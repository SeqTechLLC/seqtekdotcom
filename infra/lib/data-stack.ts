import { CfnOutput, Duration, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as rds from 'aws-cdk-lib/aws-rds'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import type { Construct } from 'constructs'
import type { EnvConfig, EnvName } from './construct-utils'
import type { NetworkStack } from './network-stack'

export interface DataStackProps extends StackProps {
  envName: EnvName
  cfg: EnvConfig
  network: NetworkStack
}

/**
 * Data plane — RDS Postgres in isolated subnets, S3 media bucket, and
 * the Parameter Store namespace (per contracts/parameter-store.md).
 *
 * Sensitive values (DB master credentials, Payload secret, revalidation
 * secret) live in **Secrets Manager** — CDK-native, no template
 * leakage, supports auto-rotation. The EC2 user-data script in
 * compute-stack fetches them at boot via the AWS SDK and assembles the
 * env vars the app reads.
 *
 * Why not mirror to SSM SecureString: AwsCustomResource serializes the
 * `parameters` block as a JSON string, and CFN doesn't resolve
 * `{{resolve:secretsmanager:...}}` dynamic references nested inside
 * that string. The unresolved literal gets passed to ssm:PutParameter,
 * which AWS SSM rejects because parameter values can't contain `{{` or
 * `}}`. The Secrets-Manager-direct pattern avoids the chain entirely.
 */
export class DataStack extends Stack {
  public readonly database: rds.DatabaseInstance
  public readonly databaseSecret: secretsmanager.ISecret
  public readonly payloadSecret: secretsmanager.ISecret
  public readonly revalidationSecret: secretsmanager.ISecret
  public readonly mediaBucket: s3.Bucket
  public readonly parameterPathPrefix: string

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props)
    const { envName, cfg, network } = props
    this.parameterPathPrefix = `/seqtek/website/${envName}`

    // ----- RDS Postgres + auto-attached master credentials -----
    // Using fromGeneratedSecret so CDK creates the secret AND wires up
    // RDS's "auto-attach" behavior — after the DB instance is created,
    // RDS adds host/port/dbname/engine fields to the secret JSON.
    // User-data can read the single secret and assemble DATABASE_URL.
    this.database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_18_3,
      }),
      instanceType: parseInstanceType(cfg.rdsInstanceClass),
      vpc: network.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [network.rdsSecurityGroup],
      credentials: rds.Credentials.fromGeneratedSecret('seqtek', {
        secretName: `seqtek-website/${envName}/db-master`,
      }),
      allocatedStorage: cfg.rdsAllocatedStorageGb,
      storageType: rds.StorageType.GP3,
      multiAz: cfg.rdsMultiAz,
      // Required for CDK-driven major-version upgrades. RDS otherwise refuses
      // to apply a major engine bump and the cdk deploy fails.
      allowMajorVersionUpgrade: true,
      backupRetention: Duration.days(7),
      deletionProtection: envName === 'prod',
      // staging: DESTROY (no final snapshot — fast iteration cycle);
      // prod: RETAIN (data is precious; explicit cleanup post-launch).
      removalPolicy: envName === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      databaseName: `seqtek_${envName}`,
      publiclyAccessible: false,
      port: 5432,
      enablePerformanceInsights: false,
      preferredBackupWindow: '06:00-07:00',
      preferredMaintenanceWindow: 'sun:07:00-sun:08:00',
    })
    // The DatabaseInstance.secret is auto-attached after creation.
    this.databaseSecret = this.database.secret!

    // ----- Application secrets (Secrets Manager) -----
    this.payloadSecret = new secretsmanager.Secret(this, 'PayloadSecret', {
      secretName: `seqtek-website/${envName}/payload-secret`,
      description: 'Payload encryption key for admin session JWTs.',
      generateSecretString: {
        excludePunctuation: true,
        passwordLength: 64,
      },
      removalPolicy: envName === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    })

    this.revalidationSecret = new secretsmanager.Secret(this, 'RevalidationSecret', {
      secretName: `seqtek-website/${envName}/revalidation-secret`,
      description: 'Shared secret validating /api/revalidate webhook callers.',
      generateSecretString: {
        excludePunctuation: true,
        passwordLength: 64,
      },
      removalPolicy: envName === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    })

    // ----- S3 media bucket -----
    this.mediaBucket = new s3.Bucket(this, 'MediaBucket', {
      bucketName: `seqtek-media-${envName}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      removalPolicy: envName === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      autoDeleteObjects: envName !== 'prod',
      lifecycleRules: [
        {
          id: 'NoncurrentVersionsToGlacier',
          enabled: true,
          noncurrentVersionTransitions: [
            {
              storageClass: s3.StorageClass.GLACIER_INSTANT_RETRIEVAL,
              transitionAfter: Duration.days(90),
            },
          ],
          noncurrentVersionExpiration: Duration.days(365),
        },
        {
          id: 'AbortIncompleteMultipartUploads',
          enabled: true,
          abortIncompleteMultipartUploadAfter: Duration.days(7),
        },
      ],
    })

    // ----- Parameter Store: non-sensitive config only -----
    // Sensitive values (db creds, payload secret, revalidation secret)
    // live in Secrets Manager above. User-data fetches both at boot.
    new ssm.StringParameter(this, 'S3BucketParam', {
      parameterName: `${this.parameterPathPrefix}/s3_bucket`,
      stringValue: this.mediaBucket.bucketName,
      description: 'S3 bucket name for Payload media uploads.',
    })

    new ssm.StringParameter(this, 'S3BucketHostnameParam', {
      parameterName: `${this.parameterPathPrefix}/s3_bucket_hostname`,
      stringValue: this.mediaBucket.bucketRegionalDomainName,
      description: 'S3 regional hostname for next/image remotePatterns.',
    })

    // S3_REGION is REQUIRED for the Payload S3 storage adapter:
    // `conditionalS3Storage()` (src/payload/storage/s3.ts) activates only when
    // BOTH S3_BUCKET and S3_REGION are set, otherwise it falls back to local FS
    // storage — which on the read-only container fs throws `EACCES mkdir media`
    // and 500s every upload. This param was missing originally; see the
    // staging hotfix note in the PR. The launch template maps the leaf name to
    // S3_REGION (basename | uppercase).
    new ssm.StringParameter(this, 'S3RegionParam', {
      parameterName: `${this.parameterPathPrefix}/s3_region`,
      stringValue: this.region,
      description: 'AWS region for the Payload S3 storage adapter (S3_REGION).',
    })

    // ----- Outputs -----
    new CfnOutput(this, 'DbEndpointHostname', {
      value: this.database.instanceEndpoint.hostname,
      exportName: `${this.stackName}-DbEndpointHostname`,
    })
    new CfnOutput(this, 'DbSecretArn', {
      value: this.databaseSecret.secretArn,
      exportName: `${this.stackName}-DbSecretArn`,
    })
    new CfnOutput(this, 'PayloadSecretArn', {
      value: this.payloadSecret.secretArn,
      exportName: `${this.stackName}-PayloadSecretArn`,
    })
    new CfnOutput(this, 'RevalidationSecretArn', {
      value: this.revalidationSecret.secretArn,
      exportName: `${this.stackName}-RevalidationSecretArn`,
    })
    new CfnOutput(this, 'MediaBucketName', {
      value: this.mediaBucket.bucketName,
      exportName: `${this.stackName}-MediaBucketName`,
    })
    new CfnOutput(this, 'MediaBucketRegionalDomain', {
      value: this.mediaBucket.bucketRegionalDomainName,
      exportName: `${this.stackName}-MediaBucketRegionalDomain`,
    })
    new CfnOutput(this, 'MediaBucketArn', {
      value: this.mediaBucket.bucketArn,
      exportName: `${this.stackName}-MediaBucketArn`,
    })
    new CfnOutput(this, 'ParameterPathPrefix', {
      value: this.parameterPathPrefix,
      exportName: `${this.stackName}-ParameterPathPrefix`,
    })
  }
}

/**
 * Derives `ec2.InstanceType` from the `cfg.rdsInstanceClass` string
 * format (e.g., "t3.micro"). Validates the class/size are known to CDK.
 */
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
