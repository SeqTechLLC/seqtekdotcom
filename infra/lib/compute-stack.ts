import { CfnOutput, Duration, Stack, type StackProps } from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecr from 'aws-cdk-lib/aws-ecr'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import type { Construct } from 'constructs'
import { CognitoAuthGate } from './cognito-auth'
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

    // ----- Optional Cognito gate (see EnvConfig.cognitoAuthEnabled doc) -----
    // Built FIRST, before anything else in this constructor references it —
    // the primary lane's container environment (COGNITO_LOGOUT_URL /
    // COGNITO_CLIENT_ID, below) and the target-group/listener-action
    // wiring further down all need the SAME User Pool/Client/Domain when
    // gating is on.
    const gatedHostnames = [...cfg.dnsRecordNames, ...(cfg.secondaryLane?.dnsRecordNames ?? [])]
    const cognitoGate = cfg.cognitoAuthEnabled
      ? new CognitoAuthGate(this, 'AuthGate', {
          envName,
          gatedHostnames,
          parameterPathPrefix: data.parameterPathPrefix,
        })
      : undefined

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

    // ----- ALB + listener (target group attached after the service below) -----
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'Alb', {
      vpc: network.vpc,
      internetFacing: true,
      securityGroup: network.albSecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      deletionProtection: envName === 'prod',
    })

    // HTTPS (443) instead of the validation-period HTTP (80) listener when
    // cognitoAuthEnabled: ALB's authenticate-oidc action (the Cognito
    // gate wired in below) only works on HTTPS listeners — confirmed by a
    // real deploy rejection 2026-08-12 ("Actions of type 'authenticate-
    // oidc' are supported only on HTTPS listeners"). `data.certificate`
    // is guaranteed present here — construct-utils.ts's validation
    // requires domainName+hostedZoneId whenever cognitoAuthEnabled is
    // true, and DataStack only creates a certificate when domainName is
    // set. Every other env keeps the original HTTP/80 listener,
    // completely unchanged, same construct id either way ('HttpListener')
    // so nothing downstream that references `this.httpListener` needs to
    // know which protocol is actually in play.
    this.httpListener = cfg.cognitoAuthEnabled
      ? this.loadBalancer.addListener('HttpListener', {
          port: 443,
          protocol: elbv2.ApplicationProtocol.HTTPS,
          certificates: [data.certificate!],
          open: false, // SG ingress managed manually in NetworkStack
        })
      : this.loadBalancer.addListener('HttpListener', {
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

    // The secondary lane's image is ALWAYS stated explicitly. There is
    // deliberately NO fallback to `imageTag`.
    //
    // A `|| imageTag` fallback used to live here, and it is what put an
    // untested build onto the production lane on 2026-08-25. `cdk deploy`
    // re-synthesizes the WHOLE stack every time, so both lanes' task
    // definitions are re-rendered on every deploy — including deploys that
    // are only meant to move the primary lane. Any such deploy that omitted
    // `-c secondaryImageTag` silently restamped production with the primary
    // lane's image, which then ran `payload migrate` against `seqtek_prod`
    // on container start.
    //
    // Failing the synth is the correct behaviour: a deploy that cannot say
    // what production should run must not guess. Callers that are not
    // promoting the lane pass the tag it is ALREADY running (deploy.yml
    // reads it back from the live ECS service), making that half of the
    // synth a byte-for-byte no-op.
    let secondaryImageTag: string | undefined
    if (cfg.secondaryLane) {
      secondaryImageTag = this.node.tryGetContext('secondaryImageTag') as string | undefined
      if (!secondaryImageTag) {
        throw new Error(
          `Required CDK context: -c secondaryImageTag=<tag>. Env '${envName}' has a ` +
            `secondaryLane ('${cfg.secondaryLane.name}'), every deploy re-synthesizes it, ` +
            'and there is no fallback by design — pass the tag the lane should KEEP ' +
            'running when you are not deliberately promoting it.',
        )
      }
    }

    // Semantic release version for the secondary (production) lane, supplied
    // at PROMOTION time rather than baked into the image. A tested artifact is
    // never rebuilt just to carry a version number: the commit SHA is baked in
    // and identifies the artifact; this names the release that promoted it.
    //
    // Unlike `secondaryImageTag` an absent value is legitimate — a lane that
    // has never been released has no version — so this is optional. But it is
    // subject to the same re-render hazard: every deploy re-renders this task
    // definition, so a deploy that omits it WIPES it. deploy.yml therefore
    // reads the current value back from the live task definition and restates
    // it, exactly as it does for the image tag.
    const releaseVersion = this.node.tryGetContext('releaseVersion') as string | undefined

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
        // dnsRecordNames[0], NOT domainName — domainName is the
        // CERTIFICATE's domain (for preview, the zone apex `seqtek.com`,
        // which this env doesn't actually serve — that's the real live
        // site). Found 2026-08-12: this line used cfg.domainName, so the
        // primary lane's own absolute URLs (Payload serverURL, and every
        // image src Payload/Next.js build from it) pointed at
        // https://seqtek.com instead of itself — images loaded from the
        // wrong site entirely. The secondaryLane container below already
        // gets this right (`lane.dnsRecordNames[0]`); this now matches.
        ...(cfg.dnsRecordNames.length > 0
          ? { NEXT_PUBLIC_SITE_URL: `https://${cfg.dnsRecordNames[0]}` }
          : {}),
        // Consumed by src/app/(payload)/api/auth/gate-logout/route.ts —
        // ALB has NO logout endpoint of its own (confirmed against AWS's
        // docs 2026-08-12: it just cryptographically validates the
        // session cookie per request, no server-side state to revoke).
        // The only real fix is the app itself expiring ALB's OWN cookie
        // names via Set-Cookie, then bouncing through Cognito's /logout
        // too so both layers actually clear.
        ...(cognitoGate
          ? {
              COGNITO_LOGOUT_URL: `${cognitoGate.userPoolDomain.baseUrl()}/logout`,
              COGNITO_CLIENT_ID: cognitoGate.userPoolClient.userPoolClientId,
            }
          : {}),
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

    // Primary lane's target group — built explicitly (rather than via the
    // `addTargets` sugar this used to call directly) so the listener's
    // DEFAULT action can be wrapped in Cognito auth when gating is on.
    // Parented under `this.httpListener` (not `this`, the stack) with id
    // 'AppTargetGroup' — this exactly reproduces the logical ID CDK's
    // `addTargets('AppTarget', ...)` sugar used to generate internally
    // (`new ApplicationTargetGroup(listener, id + 'Group', ...)`), so the
    // ALREADY-DEPLOYED target group is recognized as unchanged rather than
    // destroyed and recreated. Verified via `cdk diff` against the live
    // stack before this landed — get this wrong and it's a real outage
    // (new empty target group takes over the listener's default action
    // before ECS finishes registering healthy tasks into it).
    this.targetGroup = new elbv2.ApplicationTargetGroup(this.httpListener, 'AppTargetGroup', {
      vpc: network.vpc,
      port: APP_PORT,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
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

    if (cognitoGate) {
      // /api/health MUST stay reachable unauthenticated on every gated
      // lane: the ALB's OWN target-group health check above bypasses
      // listener rules entirely and is unaffected either way, but the
      // EXTERNAL health check the post-deploy smoke test (and any future
      // uptime monitor) makes over the public URL goes through this
      // listener — gating it would make a routine automated check
      // indistinguishable from a real outage. Priority 6 evaluates before
      // the secondaryLane's own health-bypass (5) and its full rule (10),
      // and before falling through to the (gated) default action below.
      //
      // /_next/image and /api/media/file/* are bundled into the SAME
      // bypass (found 2026-08-12: gating either broke every <Image> on
      // the site). Next.js's image optimizer serves /_next/image?url=
      // %2Fapi%2Fmedia%2Ffile%2F..., and fetches ITS OWN source bytes
      // back through the public domain at /api/media/file/* (see
      // next.config.ts's `images.localPatterns`) — exempting only
      // /_next/image wasn't enough, since the optimizer's own upstream
      // fetch was STILL gated. Scoped to .../file/* specifically (not the
      // broader /api/media/*) so this doesn't also expose Payload's
      // auto-generated collection list/create/delete endpoints at the
      // bare /api/media — those stay behind both this gate AND Payload's
      // own access control. Neither exemption loosens what's actually
      // protected: both only ever serve already-public content — the raw
      // files under /media/* bypass the ALB entirely via a separate
      // CloudFront origin (see edge-stack.ts) and are unauthenticated
      // regardless of this gate.
      //
      // /api/revalidate is deliberately NOT exempted, despite having its
      // own separate Bearer-secret auth that would make doing so just as
      // safe as the exemptions above: checked 2026-08-12, nothing in this
      // codebase actually calls it over HTTP. Content publishes trigger
      // src/payload/hooks/revalidateOnChange.ts, an in-process afterChange
      // hook that calls revalidateTag()/invalidateCloudFrontPaths()
      // directly — never through this route. It's a capability for a
      // future external trigger, not something in active use; add the
      // exemption if and when something actually needs to call it.
      this.httpListener.addAction('PrimaryHealthCheckBypass', {
        priority: 6,
        conditions: [
          elbv2.ListenerCondition.pathPatterns([
            '/api/health',
            '/_next/image',
            '/api/media/file/*',
          ]),
        ],
        action: elbv2.ListenerAction.forward([this.targetGroup]),
      })
    }

    this.httpListener.addAction('DefaultAction', {
      action: cognitoGate
        ? cognitoGate.authenticateAndForward(elbv2.ListenerAction.forward([this.targetGroup]))
        : elbv2.ListenerAction.forward([this.targetGroup]),
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
          // Empty string when unreleased — ECS rejects undefined values, and
          // the app reports `release: null` for an empty one rather than
          // substituting a build-time number.
          RELEASE_VERSION: releaseVersion ?? '',
          // Same reasoning as the primary lane's container — see its
          // COGNITO_LOGOUT_URL comment above.
          ...(cognitoGate
            ? {
                COGNITO_LOGOUT_URL: `${cognitoGate.userPoolDomain.baseUrl()}/logout`,
                COGNITO_CLIENT_ID: cognitoGate.userPoolClient.userPoolClientId,
              }
            : {}),
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

      if (cognitoGate) {
        // Same reasoning as PrimaryHealthCheckBypass above — this lane's
        // OWN /api/health, /_next/image, AND /api/media/file/* must stay
        // reachable unauthenticated (deliberately NOT /api/revalidate —
        // see that rule's comment). Evaluated before the full rule below
        // (priority 10) since ALB rules are checked in priority order.
        this.httpListener.addAction('SecondaryLaneHealthCheckBypass', {
          priority: 5,
          conditions: [
            elbv2.ListenerCondition.httpHeader('x-forwarded-host', lane.dnsRecordNames),
            elbv2.ListenerCondition.pathPatterns([
              '/api/health',
              '/_next/image',
              '/api/media/file/*',
            ]),
          ],
          action: elbv2.ListenerAction.forward([laneTargetGroup]),
        })
      }

      // Priority is arbitrary but must be unique on this listener; the
      // primary lane is the listener's DEFAULT action (no priority), so
      // any value here just needs to not collide with the health-check
      // bypass rules above (5, 6) or a future fourth rule.
      this.httpListener.addAction('SecondaryLaneRule', {
        priority: 10,
        conditions: [elbv2.ListenerCondition.httpHeader('x-forwarded-host', lane.dnsRecordNames)],
        action: cognitoGate
          ? cognitoGate.authenticateAndForward(elbv2.ListenerAction.forward([laneTargetGroup]))
          : elbv2.ListenerAction.forward([laneTargetGroup]),
      })

      // Exported so a deploy can read back the tag this lane is CURRENTLY
      // running and pass it as `-c secondaryImageTag` when it is NOT
      // promoting production. Required because the synth has no fallback
      // (see the secondaryImageTag guard above) — this output is how a
      // primary-lane-only deploy learns what to hold production at.
      // Symmetric with `ServiceName`, which the release path reads to pin
      // the primary lane.
      new CfnOutput(this, 'SecondaryLaneServiceName', {
        value: laneService.serviceName,
        exportName: `${this.stackName}-SecondaryLaneServiceName`,
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
