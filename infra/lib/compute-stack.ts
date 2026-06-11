import { CfnOutput, Duration, Stack, type StackProps } from 'aws-cdk-lib'
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecr from 'aws-cdk-lib/aws-ecr'
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as logs from 'aws-cdk-lib/aws-logs'
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
 * Compute plane — ECR repo (created in staging, imported in prod), ALB
 * with port-80 listener, Application Target Group on port 3000, ASG
 * with launch template that pulls the ECR image and reads Parameter
 * Store via the instance profile.
 *
 * **Validation-period topology** (Clarifications Session 2026-05-26):
 * ASG runs in PUBLIC subnets with `associatePublicIpAddress: true` and
 * SG `AppSg` ingress restricted to AlbSg only. NAT Gateway is absent;
 * outbound goes via the public IP route to the Internet Gateway. ALB
 * has only port 80 — CloudFront in front terminates TLS for viewers
 * (FR-004 satisfied at the CloudFront layer). Phase 5.5 launch
 * readiness adds: ASG → private subnets + NAT, ALB 443 listener +
 * ACM cert (defense in depth between CloudFront and ALB).
 */
export class ComputeStack extends Stack {
  public readonly ecrRepository: ecr.IRepository
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer
  public readonly targetGroup: elbv2.ApplicationTargetGroup
  public readonly autoScalingGroup: autoscaling.AutoScalingGroup
  public readonly httpListener: elbv2.ApplicationListener
  public readonly appLogGroup: logs.ILogGroup
  /**
   * EC2 instance profile role, exposed so EdgeStack can attach the
   * distribution-scoped `cloudfront:CreateInvalidation` policy (the
   * distribution ARN lives in Edge; defining the grant there breaks the
   * Compute → Edge dependency cycle — same pattern as the media bucket
   * policy).
   */
  public readonly appInstanceRole: iam.IRole

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props)
    const { envName, cfg, network, data } = props

    // ----- ECR repository (created by staging; imported by prod) -----
    if (envName === 'staging') {
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
    // defined in NetworkStack (where AlbSg lives) so CDK keeps the
    // SG and its ingress rules in one stack.

    // ----- ALB + HTTP listener (target group attached after ASG below) -----
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
      open: false, // SG ingress managed manually above
    })

    // ----- IAM: EC2 instance profile -----
    const stackPrefix = envName === 'prod' ? 'SeqtekProd' : 'SeqtekStaging'
    const appInstanceRole = new iam.Role(this, 'AppInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: `EC2 instance profile role for the ${envName} application instances.`,
      managedPolicies: [
        // Validation-period addition: allows SSM Session Manager
        // shell access for debugging boot issues. Phase 5.5 polish
        // removes this once the boot path is reliable. The iam-invariants
        // assertion test has a matching validation-period carve-out.
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    })
    this.appInstanceRole = appInstanceRole

    appInstanceRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'SsmParameterReadEnvScoped',
        actions: ['ssm:GetParameter', 'ssm:GetParameters', 'ssm:GetParametersByPath'],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter${data.parameterPathPrefix}/*`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter${data.parameterPathPrefix}`,
        ],
      }),
    )

    // ssm:DescribeParameters can't be ARN-scoped per AWS IAM spec; allow on *
    appInstanceRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'SsmDescribeParameters',
        actions: ['ssm:DescribeParameters'],
        resources: ['*'],
      }),
    )

    // KMS for decrypting SecureString — only the AWS-managed SSM key
    appInstanceRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'KmsDecryptSsmManaged',
        actions: ['kms:Decrypt'],
        resources: [
          `arn:aws:kms:${this.region}:${this.account}:alias/aws/ssm`,
          `arn:aws:kms:${this.region}:${this.account}:alias/aws/secretsmanager`,
        ],
      }),
    )

    // Secrets Manager — read the three CDK-managed secrets (db-master,
    // payload-secret, revalidation-secret) at boot.
    appInstanceRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'SecretsManagerReadAppSecrets',
        actions: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
        resources: [
          data.databaseSecret.secretArn,
          data.payloadSecret.secretArn,
          data.revalidationSecret.secretArn,
          // Secrets Manager appends a -<random6> suffix to ARNs internally;
          // wildcard the suffix so `GetSecretValue` works against the canonical ARN.
          `${data.databaseSecret.secretArn}-*`,
          `${data.payloadSecret.secretArn}-*`,
          `${data.revalidationSecret.secretArn}-*`,
        ],
      }),
    )

    // S3 — media bucket only, env-scoped
    appInstanceRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'S3MediaBucketRw',
        actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
        resources: [`${data.mediaBucket.bucketArn}/*`],
      }),
    )
    appInstanceRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'S3MediaBucketList',
        actions: ['s3:ListBucket', 's3:GetBucketLocation'],
        resources: [data.mediaBucket.bucketArn],
      }),
    )

    // ECR — pull-only (deploy pipeline pushes via separate role)
    appInstanceRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'EcrPull',
        actions: [
          'ecr:BatchCheckLayerAvailability',
          'ecr:BatchGetImage',
          'ecr:GetDownloadUrlForLayer',
        ],
        resources: [this.ecrRepository.repositoryArn],
      }),
    )
    appInstanceRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'EcrAuthToken',
        actions: ['ecr:GetAuthorizationToken'],
        resources: ['*'],
      }),
    )

    // CloudWatch Logs — write to the app log group only
    appInstanceRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'CloudWatchLogsAppGroup',
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents', 'logs:DescribeLogStreams'],
        resources: [this.appLogGroup.logGroupArn, `${this.appLogGroup.logGroupArn}:*`],
      }),
    )

    // CloudWatch metrics — service-level, can't ARN-scope
    appInstanceRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'CloudWatchPutMetrics',
        actions: ['cloudwatch:PutMetricData'],
        resources: ['*'],
      }),
    )

    // ----- Launch template + ASG -----
    const userData = ec2.UserData.forLinux()
    userData.addCommands(
      'set -euo pipefail',
      'dnf update -y',
      'dnf install -y docker amazon-cloudwatch-agent jq',
      'systemctl enable --now docker',
      'usermod -a -G docker ec2-user',
      // AWS RDS issues certs from its own CA which isn't in Node's
      // default trust bundle. Download the global RDS CA bundle and
      // mount it into the container via NODE_EXTRA_CA_CERTS so the
      // Postgres client trusts the RDS endpoint cert chain.
      'mkdir -p /etc/seqtek/certs',
      'curl -fsSL -o /etc/seqtek/certs/rds-ca.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem',
      'chmod 644 /etc/seqtek/certs/rds-ca.pem',
      `PARAM_PREFIX="${data.parameterPathPrefix}"`,
      `REGION="${this.region}"`,
      `AWS_DEFAULT_REGION="${this.region}"`,
      'export AWS_DEFAULT_REGION',
      // ----- Assemble /etc/seqtek-website.env from SSM (config) + Secrets Manager (secrets) -----
      'touch /etc/seqtek-website.env',
      'chmod 600 /etc/seqtek-website.env',
      // SSM Parameter Store: non-sensitive config (s3_bucket, s3_bucket_hostname,
      // google_client_id, etc.). Each parameter becomes UPPER_NAME=value in the env file.
      `aws ssm get-parameters-by-path --path "$PARAM_PREFIX" --recursive --with-decryption --region "$REGION" --query 'Parameters[*].[Name,Value]' --output text | while IFS=$'\\t' read -r name value; do`,
      `  key=$(basename "$name" | tr '[:lower:]' '[:upper:]')`,
      `  echo "$key=$value" >> /etc/seqtek-website.env`,
      'done',
      // Secrets Manager: db-master JSON contains username/password/host/port/dbname
      // (auto-attached by RDS). Assemble DATABASE_URL.
      `DB_SECRET=$(aws secretsmanager get-secret-value --secret-id "${data.databaseSecret.secretArn}" --region "$REGION" --query SecretString --output text)`,
      `DB_USER=$(echo "$DB_SECRET" | jq -r '.username')`,
      `DB_PASS=$(echo "$DB_SECRET" | jq -r '.password')`,
      `DB_HOST=$(echo "$DB_SECRET" | jq -r '.host')`,
      `DB_PORT=$(echo "$DB_SECRET" | jq -r '.port')`,
      `DB_NAME=$(echo "$DB_SECRET" | jq -r '.dbname')`,
      // RDS Postgres requires TLS by default; sslmode=require + the
      // RDS CA bundle (downloaded above + mounted into the container
      // via NODE_EXTRA_CA_CERTS) gives proper encrypted-and-verified
      // connections.
      `echo "DATABASE_URL=postgresql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=require" >> /etc/seqtek-website.env`,
      'echo "NODE_EXTRA_CA_CERTS=/etc/seqtek/certs/rds-ca.pem" >> /etc/seqtek-website.env',
      // Validation period: Payload auto-syncs schema on boot via
      // drizzle push. Remove this at Phase 5.5 when generated
      // migrations land.
      'echo "PAYLOAD_DB_PUSH=true" >> /etc/seqtek-website.env',
      // Payload encryption key + revalidation webhook secret (plain string values).
      `PAYLOAD_SECRET=$(aws secretsmanager get-secret-value --secret-id "${data.payloadSecret.secretArn}" --region "$REGION" --query SecretString --output text)`,
      `echo "PAYLOAD_SECRET=$PAYLOAD_SECRET" >> /etc/seqtek-website.env`,
      `REVALIDATION_SECRET=$(aws secretsmanager get-secret-value --secret-id "${data.revalidationSecret.secretArn}" --region "$REGION" --query SecretString --output text)`,
      `echo "REVALIDATION_SECRET=$REVALIDATION_SECRET" >> /etc/seqtek-website.env`,
      // ----- Pull and run the container image -----
      `aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "${this.ecrRepository.repositoryUri}"`,
      `docker pull "${this.ecrRepository.repositoryUri}:latest"`,
      // Mount the RDS CA bundle read-only at the same path the env var
      // references. -v /host:/container:ro for read-only.
      `docker run -d --name seqtek-website --restart=unless-stopped -p ${APP_PORT}:${APP_PORT} --env-file /etc/seqtek-website.env -v /etc/seqtek/certs/rds-ca.pem:/etc/seqtek/certs/rds-ca.pem:ro --log-driver=awslogs --log-opt awslogs-group="${this.appLogGroup.logGroupName}" --log-opt awslogs-region="${this.region}" "${this.ecrRepository.repositoryUri}:latest"`,
    )

    // ----- Explicit LaunchTemplate -----
    // Why explicit (not inline ASG props): ASG with inline instance
    // props + associatePublicIpAddress falls back to the legacy
    // `AWS::AutoScaling::LaunchConfiguration` resource (deprecated by
    // AWS in 2023). Modern infrastructure must use `AWS::EC2::LaunchTemplate`.
    // The L2 LaunchTemplate construct doesn't expose
    // associatePublicIpAddress as a top-level prop; we set it via an
    // L1 escape hatch on NetworkInterfaces below. Security group is
    // also set in NetworkInterfaces.Groups (not at the LT top level)
    // because CFN forbids both `SecurityGroupIds` and `NetworkInterfaces`
    // on the same launch template.
    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      instanceType: parseInstanceType(`${cfg.instanceClass}.${cfg.instanceSize}`),
      securityGroup: network.appSecurityGroup,
      role: appInstanceRole,
      userData,
      requireImdsv2: true,
      httpPutResponseHopLimit: 2,
    })

    // L1 escape: add NetworkInterfaces with associatePublicIpAddress.
    // CFN forbids `SecurityGroupIds` and `NetworkInterfaces` together,
    // so null out the top-level SGs (CDK populated them via the
    // `securityGroup` prop above, which we keep for the L2
    // IConnectable contract).
    const cfnLaunchTemplate = launchTemplate.node.defaultChild as ec2.CfnLaunchTemplate
    cfnLaunchTemplate.addPropertyOverride('LaunchTemplateData.NetworkInterfaces', [
      {
        DeviceIndex: 0,
        AssociatePublicIpAddress: true,
        Groups: [network.appSecurityGroup.securityGroupId],
        DeleteOnTermination: true,
      },
    ])
    cfnLaunchTemplate.addPropertyDeletionOverride('LaunchTemplateData.SecurityGroupIds')

    this.autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'AppAsg', {
      vpc: network.vpc,
      // Validation-period topology: public subnets. Flips to
      // PRIVATE_WITH_EGRESS at Phase 5.5 per ROADMAP §4.
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      launchTemplate,
      minCapacity: cfg.asgMinCapacity,
      desiredCapacity: cfg.asgDesiredCapacity,
      maxCapacity: cfg.asgMaxCapacity,
      healthChecks: autoscaling.HealthChecks.withAdditionalChecks({
        additionalTypes: [autoscaling.AdditionalHealthCheckType.ELB],
        // 8-min grace — accommodates docker pull of the ~700MB validation
        // image + dnf install + migrate run + Next.js start. Phase 5.5
        // shrinks the image (drop runtime node_modules once we have
        // committed migrations) and can shorten this back to 3 min.
        gracePeriod: Duration.minutes(8),
      }),
      updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
        minInstancesInService: cfg.asgMinCapacity,
        maxBatchSize: 1,
        pauseTime: Duration.minutes(5),
        waitOnResourceSignals: false,
      }),
    })

    // Attach the ASG as the target for the HTTP listener; CDK creates
    // the target group inline with the per-target settings.
    this.targetGroup = this.httpListener.addTargets('AppTarget', {
      port: APP_PORT,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [this.autoScalingGroup],
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
    new CfnOutput(this, 'AsgName', {
      value: this.autoScalingGroup.autoScalingGroupName,
      exportName: `${this.stackName}-AsgName`,
    })
    new CfnOutput(this, 'AppLogGroupName', {
      value: this.appLogGroup.logGroupName,
      exportName: `${this.stackName}-AppLogGroupName`,
    })

    // Suppress unused warning
    void stackPrefix
  }
}

function parseInstanceType(s: string): ec2.InstanceType {
  const [className, sizeName] = s.split('.')
  if (!className || !sizeName) {
    throw new Error(`Invalid instance type '${s}'. Expected '<class>.<size>' (e.g., t3.small).`)
  }
  const classKey = className.toUpperCase() as keyof typeof ec2.InstanceClass
  const sizeKey = sizeName.toUpperCase() as keyof typeof ec2.InstanceSize
  if (!(classKey in ec2.InstanceClass)) {
    throw new Error(`Unknown ec2.InstanceClass: '${className}'`)
  }
  if (!(sizeKey in ec2.InstanceSize)) {
    throw new Error(`Unknown ec2.InstanceSize: '${sizeName}'`)
  }
  return ec2.InstanceType.of(ec2.InstanceClass[classKey], ec2.InstanceSize[sizeKey])
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
