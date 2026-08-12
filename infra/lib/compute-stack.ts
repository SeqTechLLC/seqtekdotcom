import { CfnOutput, Duration, Stack, type StackProps } from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecr from 'aws-cdk-lib/aws-ecr'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import type { Construct } from 'constructs'
import type { EnvConfig, EnvName } from './construct-utils'
import type { DataStack } from './data-stack'
import type { NetworkStack } from './network-stack'

export interface ComputeStackProps extends StackProps {
  envName: EnvName
  cfg: EnvConfig
  network: NetworkStack
  data: DataStack
}

const ECR_REPO_NAME = 'seqtek-website'
const APP_PORT = 3000

/**
 * Compute plane — ECR repo (created by whichever env owns it in this
 * account; see `ownsAccountEcrRepository`), ALB with port-80 listener,
 * Application Target Group on port 3000 (target type IP, awsvpc mode),
 * ECS Fargate service that pulls the ECR image and reads config from
 * SSM Parameter Store / Secrets Manager at task-start.
 *
 * **Same validation-period topology as the EC2 version it replaces**
 * (Clarifications Session 2026-05-26): tasks run in PUBLIC subnets with
 * `assignPublicIp: true` and SG `AppSg` ingress restricted to AlbSg
 * only. No NAT Gateway; outbound (ECR pulls, Secrets Manager/SSM reads)
 * goes via the public IP route to the Internet Gateway. ALB has only
 * port 80 — CloudFront in front terminates TLS for viewers (FR-004
 * satisfied at the CloudFront layer). Phase 5.5 launch readiness adds:
 * tasks → private subnets + NAT (or VPC endpoints for ECR/Secrets
 * Manager/SSM/CloudWatch Logs, which avoid the NAT Gateway cost
 * entirely), ALB 443 listener + ACM cert (defense in depth between
 * CloudFront and ALB).
 *
 * Two follow-ups this migration needs OUTSIDE this file (flagged, not
 * done here — see chat):
 *  1. Dockerfile: bake the RDS CA bundle into the image at build time
 *     (`curl` it in the `runner` stage) — Fargate has no UserData-style
 *     boot script to download it at instance-launch like the EC2 AMI did.
 *  2. observability-stack.ts: the three CloudWatch alarms keyed on
 *     `AutoScalingGroupName` need to move to ECS service-level metrics
 *     (`ClusterName`/`ServiceName` dimensions) — there is no ASG anymore.
 */
export class ComputeStack extends Stack {
  public readonly ecrRepository: ecr.IRepository
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer
  public readonly targetGroup: elbv2.ApplicationTargetGroup
  public readonly cluster: ecs.Cluster
  public readonly fargateService: ecs.FargateService
  public readonly httpListener: elbv2.ApplicationListener
  public readonly appLogGroup: logs.ILogGroup
  /**
   * ECS task role, exposed under the same name the EC2 version used
   * (`appInstanceRole`) so EdgeStack's cross-stack reference —
   * `compute.appInstanceRole.attachInlinePolicy(...)` for the
   * distribution-scoped `cloudfront:CreateInvalidation` grant — needs
   * no change. Conceptually this is now the ECS **task role** (runtime
   * app permissions), not an EC2 instance-profile role; the separate
   * **execution role** (image pull + log/secret bootstrapping) is
   * private to this stack.
   */
  public readonly appInstanceRole: iam.IRole

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props)
    const { envName, cfg, network, data } = props

    // ----- ECR repository -----
    // Unchanged from the EC2 version — see the original comment block
    // in git history for the full ownership-model rationale. Name is
    // SHARED (`seqtek-website`); ownership is config (`ownsAccountEcrRepository`).
    if (cfg.ownsAccountEcrRepository) {
      this.ecrRepository = new ecr.Repository(this, 'EcrRepo', {
        repositoryName: ECR_REPO_NAME,
        imageScanOnPush: true,
        lifecycleRules: [
          {
            description: 'Expire untagged images after 7 days',
            tagStatus: ecr.TagStatus.UNTAGGED,
            maxImageAge: Duration.days(7),
          },
          {
            description: 'Keep at most ecrRetainCount tagged images',
            tagStatus: ecr.TagStatus.ANY,
            maxImageCount: cfg.ecrRetainCount,
          },
        ],
      })
    } else {
      this.ecrRepository = ecr.Repository.fromRepositoryName(this, 'EcrRepo', ECR_REPO_NAME)
    }

    // ----- Application log group (CloudWatch Logs) -----
    this.appLogGroup = new logs.LogGroup(this, 'AppLogGroup', {
      logGroupName: `/seqtek/website/${envName}/app`,
      retention: mapRetentionDays(cfg.logRetentionDays),
    })

    // Note: CloudFront managed prefix list ingress rules for AlbSg are
    // defined in NetworkStack (where AlbSg lives).

    // ----- ALB + HTTP listener (target group attached after the service below) -----
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'Alb', {
      vpc: network.vpc,
      internetFacing: true,
      securityGroup: network.albSecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      deletionProtection: envName === 'prod',
    })

    this.httpListener = this.loadBalancer.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      open: false, // SG ingress managed manually in NetworkStack
    })

    // ----- ECS cluster -----
    this.cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: network.vpc,
      containerInsightsV2: ecs.ContainerInsights.ENABLED,
    })

    // ----- IAM: execution role (image pull + secret/log bootstrapping) -----
    // ECS itself assumes this role BEFORE the container starts, to pull the
    // image from ECR, resolve `secrets:`/SSM values into env vars, and create
    // the CloudWatch log stream. The running application code never sees
    // this role's credentials — that's the task role below.
    const executionRole = new iam.Role(this, 'TaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: `ECS task execution role for the ${envName} application service.`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    })
    this.appLogGroup.grantWrite(executionRole)
    data.databaseSecret.grantRead(executionRole)
    data.payloadSecret.grantRead(executionRole)
    data.revalidationSecret.grantRead(executionRole)

    // ----- IAM: task role (runtime application permissions) -----
    // Same permission set as the old `appInstanceRole` minus the
    // ECR-pull / SSM-bootstrapping grants, which moved to the execution
    // role above since the app no longer assembles its own env file.
    const appTaskRole = new iam.Role(this, 'AppTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: `ECS task role for the ${envName} application containers.`,
    })
    this.appInstanceRole = appTaskRole

    // S3 — media bucket only, env-scoped
    appTaskRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'S3MediaBucketRw',
        actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
        resources: [`${data.mediaBucket.bucketArn}/*`],
      }),
    )
    appTaskRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'S3MediaBucketList',
        actions: ['s3:ListBucket', 's3:GetBucketLocation'],
        resources: [data.mediaBucket.bucketArn],
      }),
    )

    // CloudWatch metrics — service-level, can't ARN-scope. (CloudFront
    // invalidation grant is attached in EdgeStack via `appInstanceRole`.)
    appTaskRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'CloudWatchPutMetrics',
        actions: ['cloudwatch:PutMetricData'],
        resources: ['*'],
      }),
    )

    // ----- SSM parameters referenced by NAME (value not known at synth time) -----
    // `google_client_id`/`google_client_secret` are provisioned manually
    // outside CDK (see docs/LOCAL_DEVELOPMENT.md — Google Cloud Console),
    // and `cloudfront_distribution_id` is provisioned by EdgeStack, which
    // depends on THIS stack (Edge → Compute for the ALB origin), so it
    // can't be passed in as a prop without a cycle. Referencing by name
    // (not value) sidesteps both: CDK only needs the deterministic path,
    // resolved by ECS at task-start same as the old UserData loop did.
    const googleClientIdParam = ssm.StringParameter.fromStringParameterName(
      this,
      'GoogleClientIdParam',
      `${data.parameterPathPrefix}/google_client_id`,
    )
    const googleClientSecretParam = ssm.StringParameter.fromSecureStringParameterAttributes(
      this,
      'GoogleClientSecretParam',
      { parameterName: `${data.parameterPathPrefix}/google_client_secret` },
    )
    const cloudFrontDistIdParam = ssm.StringParameter.fromStringParameterName(
      this,
      'CloudFrontDistIdParamRef',
      `${data.parameterPathPrefix}/cloudfront_distribution_id`,
    )
    googleClientIdParam.grantRead(executionRole)
    googleClientSecretParam.grantRead(executionRole)
    cloudFrontDistIdParam.grantRead(executionRole)

    // ----- Which image this environment runs -----
    // Unchanged behavior from the EC2 version: `deploy.yml` passes
    // `-c imageTag=<vX.Y.Z | sha>` so the task definition is stamped
    // with the exact build deployed. Fallback stays ENV-SCOPED for a
    // context-less `cdk synth` (never a bare `:latest`).
    const imageTag =
      (this.node.tryGetContext('imageTag') as string | undefined) || `latest-${envName}`

    // The secondary lane (see below) can be promoted to a DIFFERENT image
    // than the primary lane — e.g. a GitHub release deploys a `vX.Y.Z` tag
    // to ONLY the ww3.seqtek.com lane while the primary preview.seqtek.com
    // lane keeps whatever the last `Preview`-branch push deployed. Defaults
    // to `imageTag` so an ordinary `-c imageTag=<sha>` deploy (no
    // `secondaryImageTag`) still moves both lanes together, unchanged from
    // before this existed.
    const secondaryImageTag =
      (this.node.tryGetContext('secondaryImageTag') as string | undefined) || imageTag

    // ----- Fargate task definition -----
    // cpu/memory sizing reuses `instanceSize` from cfg (same field the
    // EC2 version read) mapped to the nearest valid Fargate combo —
    // avoids adding new cdk.json fields for this draft. `instanceClass`
    // (t3/t4g/m5) has no Fargate equivalent and is intentionally unused.
    const { cpu, memoryLimitMiB } = mapFargateSize(cfg.instanceSize)

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      cpu,
      memoryLimitMiB,
      executionRole,
      taskRole: appTaskRole,
    })

    const container = taskDefinition.addContainer('AppContainer', {
      image: ecs.ContainerImage.fromEcrRepository(this.ecrRepository, imageTag),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'app',
        logGroup: this.appLogGroup as logs.LogGroup,
      }),
      environment: {
        // Values CDK already knows at synth time — no SSM round-trip
        // needed for these (unlike the EC2 UserData's generic
        // get-parameters-by-path loop, ECS task defs need each var
        // named explicitly, so the ones CDK can supply directly are
        // passed as plain environment rather than re-fetched from SSM).
        S3_BUCKET: data.mediaBucket.bucketName,
        S3_BUCKET_HOSTNAME: data.mediaBucket.bucketRegionalDomainName,
        S3_REGION: this.region,
        ...(cfg.domainName ? { NEXT_PUBLIC_SITE_URL: `https://${cfg.domainName}` } : {}),
        // RDS Postgres requires TLS; the CA bundle path here must match
        // wherever the Dockerfile follow-up (see class doc) bakes it in.
        NODE_EXTRA_CA_CERTS: '/etc/seqtek/certs/rds-ca.pem',
        // Validation period: Payload auto-syncs schema via drizzle push
        // on the migrate step below. Remove at Phase 5.5 with generated
        // migrations (matches the EC2 version's behavior exactly).
        PAYLOAD_DB_PUSH: 'true',
      },
      secrets: {
        // Split DB credential fields — the container command below
        // assembles DATABASE_URL from these at start, same shape as the
        // EC2 UserData's `jq` parsing of the single db-master secret.
        DB_USER: ecs.Secret.fromSecretsManager(data.databaseSecret, 'username'),
        DB_PASS: ecs.Secret.fromSecretsManager(data.databaseSecret, 'password'),
        DB_HOST: ecs.Secret.fromSecretsManager(data.databaseSecret, 'host'),
        DB_PORT: ecs.Secret.fromSecretsManager(data.databaseSecret, 'port'),
        DB_NAME: ecs.Secret.fromSecretsManager(data.databaseSecret, 'dbname'),
        PAYLOAD_SECRET: ecs.Secret.fromSecretsManager(data.payloadSecret),
        REVALIDATION_SECRET: ecs.Secret.fromSecretsManager(data.revalidationSecret),
        GOOGLE_CLIENT_ID: ecs.Secret.fromSsmParameter(googleClientIdParam),
        GOOGLE_CLIENT_SECRET: ecs.Secret.fromSsmParameter(googleClientSecretParam),
        // Present once EdgeStack has deployed and written the param;
        // absent (empty string) on a first-ever deploy, same
        // fail-open-and-skip-invalidations behavior the app already
        // has for a missing CLOUDFRONT_DISTRIBUTION_ID.
        CLOUDFRONT_DISTRIBUTION_ID: ecs.Secret.fromSsmParameter(cloudFrontDistIdParam),
      },
      portMappings: [{ containerPort: APP_PORT, protocol: ecs.Protocol.TCP }],
      // Overrides the image's CMD to assemble DATABASE_URL from the
      // split secrets above before running the same
      // `payload migrate && node server.js` the Dockerfile already
      // does. ENTRYPOINT (`tini`) is untouched — only CMD is replaced.
      command: [
        'sh',
        '-c',
        'export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require" && npx payload migrate && node server.js',
      ],
      // Deliberately NO container-level `healthCheck` here. There were
      // originally two independent health checks — this one (Docker
      // HEALTHCHECK via `wget --spider`, a HEAD-style request) and the
      // ALB target group's own check below (a real GET, proven reliable
      // in production traffic). They disagreed: the ALB consistently
      // reported the task healthy while this one intermittently failed,
      // and ECS's deployment orchestration treats ITS OWN container
      // health signal as authoritative when both exist — so a flaky
      // HEAD-based check caused ECS to endlessly kill and replace an
      // otherwise-fine, ALB-confirmed-healthy task ("Amazon ECS replaced
      // 1 tasks due to an unhealthy status", observed repeatedly on the
      // 2026-08-10 preview deploy). The ALB's GET-based check is the
      // single source of truth for health now.
    })
    void container

    // ----- Fargate service -----
    this.fargateService = new ecs.FargateService(this, 'AppService', {
      cluster: this.cluster,
      taskDefinition,
      desiredCount: cfg.asgDesiredCapacity,
      minHealthyPercent: Math.round((cfg.asgMinCapacity / cfg.asgDesiredCapacity) * 100),
      maxHealthyPercent: Math.round((cfg.asgMaxCapacity / cfg.asgDesiredCapacity) * 100),
      // Validation-period topology (see class doc): public subnets, no
      // NAT. Flips to PRIVATE_WITH_EGRESS + NAT/VPC-endpoints at Phase 5.5.
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      assignPublicIp: true,
      securityGroups: [network.appSecurityGroup],
      // Native rollback replaces the EC2 version's blind
      // `pauseTime: Duration.minutes(12)` wait: ECS actually checks ALB
      // target-group health during the deployment and rolls back
      // automatically on failure instead of waiting out a timer
      // regardless of outcome.
      circuitBreaker: { rollback: true },
      // 90s wasn't enough: observed 2026-08-11 on a real deploy, the image
      // pull alone took ~105s on a fresh Fargate host (1.68GB image — still
      // carries full node_modules for the Payload CLI, same as the EC2
      // version's own ~700MB-image rationale for its 8-minute grace period).
      // The grace period was expiring before the app was even up, so the
      // first real health check could count as a genuine failure. 5 minutes
      // covers worst-case pull + boot with real margin.
      healthCheckGracePeriod: Duration.minutes(5),
    })

    // Attach the service as the target for the HTTP listener.
    this.targetGroup = this.httpListener.addTargets('AppTarget', {
      port: APP_PORT,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [this.fargateService],
      deregistrationDelay: Duration.seconds(120),
      healthCheck: {
        path: '/api/health',
        protocol: elbv2.Protocol.HTTP,
        interval: Duration.seconds(30),
        timeout: Duration.seconds(10),
        healthyThresholdCount: 3,
        unhealthyThresholdCount: 2,
        healthyHttpCodes: '200',
      },
    })

    // ----- Optional second app lane (see EnvConfig.secondaryLane doc) -----
    // Shares this env's cluster, ALB, execution/task roles, media bucket,
    // and app secrets. The only things genuinely separate are the task
    // definition/service/target group and the database NAME (same RDS
    // instance, different `CREATE DATABASE`). Host-based ALB routing can't
    // key on the real `Host` header here: CloudFront always overwrites
    // `Host` with the ALB's own domain name before forwarding to a custom
    // origin (documented AWS behavior, not overridable via origin request
    // policy), so both lanes would otherwise see an identical Host value.
    // EdgeStack attaches a CloudFront Function that copies the viewer's
    // real Host into an `x-forwarded-host` header; the rule below matches
    // on THAT header instead.
    if (cfg.secondaryLane) {
      const lane = cfg.secondaryLane

      const laneLogGroup = new logs.LogGroup(this, 'SecondaryLaneLogGroup', {
        logGroupName: `/seqtek/website/${envName}/${lane.name}/app`,
        retention: mapRetentionDays(cfg.logRetentionDays),
      })

      const laneTaskDefinition = new ecs.FargateTaskDefinition(this, 'SecondaryLaneTaskDef', {
        cpu,
        memoryLimitMiB,
        executionRole,
        taskRole: appTaskRole,
      })

      laneTaskDefinition.addContainer('AppContainer', {
        image: ecs.ContainerImage.fromEcrRepository(this.ecrRepository, secondaryImageTag),
        logging: ecs.LogDrivers.awsLogs({
          streamPrefix: 'app',
          logGroup: laneLogGroup,
        }),
        environment: {
          S3_BUCKET: data.mediaBucket.bucketName,
          S3_BUCKET_HOSTNAME: data.mediaBucket.bucketRegionalDomainName,
          S3_REGION: this.region,
          NEXT_PUBLIC_SITE_URL: `https://${lane.dnsRecordNames[0]}`,
          NODE_EXTRA_CA_CERTS: '/etc/seqtek/certs/rds-ca.pem',
          PAYLOAD_DB_PUSH: 'true',
          // Literal, not read from the secret's `dbname` field — the
          // secret's dbname is the PRIMARY lane's database
          // (seqtek_${envName}); this lane deliberately points at a
          // different database on the same instance.
          DB_NAME: lane.databaseName,
        },
        secrets: {
          DB_USER: ecs.Secret.fromSecretsManager(data.databaseSecret, 'username'),
          DB_PASS: ecs.Secret.fromSecretsManager(data.databaseSecret, 'password'),
          DB_HOST: ecs.Secret.fromSecretsManager(data.databaseSecret, 'host'),
          DB_PORT: ecs.Secret.fromSecretsManager(data.databaseSecret, 'port'),
          PAYLOAD_SECRET: ecs.Secret.fromSecretsManager(data.payloadSecret),
          REVALIDATION_SECRET: ecs.Secret.fromSecretsManager(data.revalidationSecret),
          GOOGLE_CLIENT_ID: ecs.Secret.fromSsmParameter(googleClientIdParam),
          GOOGLE_CLIENT_SECRET: ecs.Secret.fromSsmParameter(googleClientSecretParam),
          CLOUDFRONT_DISTRIBUTION_ID: ecs.Secret.fromSsmParameter(cloudFrontDistIdParam),
        },
        portMappings: [{ containerPort: APP_PORT, protocol: ecs.Protocol.TCP }],
        // Postgres has no `CREATE DATABASE IF NOT EXISTS` — check
        // pg_database first via the `pg` client already in node_modules
        // (pulled in transitively by @payloadcms/db-postgres), since
        // CloudFormation has no "database inside an existing RDS
        // instance" resource to create this declaratively. Idempotent:
        // safe to run on every task start/replacement.
        command: [
          'sh',
          '-c',
          [
            'set -e',
            'export ADMIN_DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/postgres?sslmode=require"',
            // The `node -e '...'` argument is SHELL-single-quoted (not
            // double-quoted like the exports around it): the JS body has
            // no need of shell variable expansion (it reads
            // process.env.ADMIN_DATABASE_URL directly), and single quotes
            // are the only way to keep a literal `$` from being consumed
            // by the shell before node ever sees it — a double-quoted
            // version of this broke on the first deploy attempt
            // (2026-08-11) when a `$1` bind-param placeholder inside the
            // query text was shell-expanded to empty, truncating the
            // query to `datname = ''` ("syntax error at end of input").
            // Since the shell argument is single-quoted, the JS itself
            // uses double quotes for its strings, and the SQL text uses
            // Postgres dollar-quoting (`$$...$$`) instead of a single-
            // quoted literal, avoiding the one character (`'`) that
            // can't appear inside a single-quoted shell argument at all.
            `node -e 'const { Client } = require("pg"); (async () => { ` +
              `const c = new Client({ connectionString: process.env.ADMIN_DATABASE_URL }); ` +
              `await c.connect(); ` +
              `const r = await c.query("SELECT 1 FROM pg_database WHERE datname = $$${lane.databaseName}$$"); ` +
              `if (r.rowCount === 0) { await c.query("CREATE DATABASE ${lane.databaseName}"); } ` +
              `await c.end(); ` +
              `})().catch((e) => { console.error(e); process.exit(1); });'`,
            'export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"',
            'npx payload migrate',
            'node server.js',
          ].join(' && '),
        ],
      })

      const laneService = new ecs.FargateService(this, 'SecondaryLaneService', {
        cluster: this.cluster,
        taskDefinition: laneTaskDefinition,
        desiredCount: 1,
        // Explicit, not the 50%/100% default: at desiredCount=1, a 50%
        // minimum would let ECS drop to ZERO running tasks mid-deploy.
        // 100/200 launches the replacement before killing the old one.
        minHealthyPercent: 100,
        maxHealthyPercent: 200,
        vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
        assignPublicIp: true,
        securityGroups: [network.appSecurityGroup],
        circuitBreaker: { rollback: true },
        healthCheckGracePeriod: Duration.minutes(5),
      })

      const laneTargetGroup = new elbv2.ApplicationTargetGroup(this, 'SecondaryLaneTargetGroup', {
        vpc: network.vpc,
        port: APP_PORT,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        targets: [laneService],
        deregistrationDelay: Duration.seconds(120),
        healthCheck: {
          path: '/api/health',
          protocol: elbv2.Protocol.HTTP,
          interval: Duration.seconds(30),
          timeout: Duration.seconds(10),
          healthyThresholdCount: 3,
          unhealthyThresholdCount: 2,
          healthyHttpCodes: '200',
        },
      })

      // Priority is arbitrary but must be unique on this listener; the
      // primary lane is the listener's DEFAULT action (no priority), so
      // any value here just needs to not collide with a future third rule.
      this.httpListener.addAction('SecondaryLaneRule', {
        priority: 10,
        conditions: [elbv2.ListenerCondition.httpHeader('x-forwarded-host', lane.dnsRecordNames)],
        action: elbv2.ListenerAction.forward([laneTargetGroup]),
      })
    }

    // ----- Outputs -----
    new CfnOutput(this, 'EcrRepositoryUri', {
      value: this.ecrRepository.repositoryUri,
      exportName: `${this.stackName}-EcrRepositoryUri`,
    })
    new CfnOutput(this, 'AlbDnsName', {
      value: this.loadBalancer.loadBalancerDnsName,
      exportName: `${this.stackName}-AlbDnsName`,
    })
    new CfnOutput(this, 'AlbCanonicalHostedZoneId', {
      value: this.loadBalancer.loadBalancerCanonicalHostedZoneId,
      exportName: `${this.stackName}-AlbCanonicalHostedZoneId`,
    })
    new CfnOutput(this, 'ClusterName', {
      value: this.cluster.clusterName,
      exportName: `${this.stackName}-ClusterName`,
    })
    new CfnOutput(this, 'ServiceName', {
      value: this.fargateService.serviceName,
      exportName: `${this.stackName}-ServiceName`,
    })
    new CfnOutput(this, 'AppLogGroupName', {
      value: this.appLogGroup.logGroupName,
      exportName: `${this.stackName}-AppLogGroupName`,
    })
  }
}

/**
 * Maps `cfg.instanceSize` (an EC2-shaped field the ASG version reused)
 * to the nearest valid Fargate cpu/memory combo. Fargate only accepts
 * fixed (cpu, memory) pairs — arbitrary combinations are rejected at
 * deploy time.
 */
function mapFargateSize(size: EnvConfig['instanceSize']): { cpu: number; memoryLimitMiB: number } {
  const known: Record<EnvConfig['instanceSize'], { cpu: number; memoryLimitMiB: number }> = {
    micro: { cpu: 256, memoryLimitMiB: 512 },
    small: { cpu: 512, memoryLimitMiB: 1024 },
    medium: { cpu: 1024, memoryLimitMiB: 2048 },
    large: { cpu: 2048, memoryLimitMiB: 4096 },
  }
  return known[size]
}

/**
 * Maps a numeric day count from EnvConfig to the closest `logs.RetentionDays`
 * enum member. CloudWatch Logs accepts only a fixed set of retention durations.
 */
function mapRetentionDays(days: number): logs.RetentionDays {
  const known: Array<[number, logs.RetentionDays]> = [
    [1, logs.RetentionDays.ONE_DAY],
    [3, logs.RetentionDays.THREE_DAYS],
    [5, logs.RetentionDays.FIVE_DAYS],
    [7, logs.RetentionDays.ONE_WEEK],
    [14, logs.RetentionDays.TWO_WEEKS],
    [30, logs.RetentionDays.ONE_MONTH],
    [60, logs.RetentionDays.TWO_MONTHS],
    [90, logs.RetentionDays.THREE_MONTHS],
    [120, logs.RetentionDays.FOUR_MONTHS],
    [150, logs.RetentionDays.FIVE_MONTHS],
    [180, logs.RetentionDays.SIX_MONTHS],
    [365, logs.RetentionDays.ONE_YEAR],
    [400, logs.RetentionDays.THIRTEEN_MONTHS],
    [545, logs.RetentionDays.EIGHTEEN_MONTHS],
    [731, logs.RetentionDays.TWO_YEARS],
    [1827, logs.RetentionDays.FIVE_YEARS],
    [3653, logs.RetentionDays.TEN_YEARS],
  ]
  const match = known.find(([d]) => d === days)
  if (!match) {
    throw new Error(
      `logRetentionDays must be one of ${known.map(([d]) => d).join(', ')}; got ${days}.`,
    )
  }
  return match[1]
}
