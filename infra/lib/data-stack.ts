import { CfnOutput, Duration, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as rds from 'aws-cdk-lib/aws-rds'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import * as cr from 'aws-cdk-lib/custom-resources'
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
 * Sensitive values (DB credentials, Payload secret, revalidation secret)
 * are generated in Secrets Manager (CDK-native, no template leakage)
 * and then mirrored into Parameter Store SecureString via an
 * AwsCustomResource pattern that uses CFN's dynamic-reference resolver
 * at deploy time — so the synthesized template never contains the
 * plaintext values either.
 */
export class DataStack extends Stack {
  public readonly database: rds.DatabaseInstance
  public readonly mediaBucket: s3.Bucket
  public readonly parameterPathPrefix: string
  public readonly databaseUrlParameter: ssm.IParameter
  public readonly payloadSecretParameter: ssm.IParameter
  public readonly revalidationSecretParameter: ssm.IParameter

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props)
    const { envName, cfg, network } = props
    this.parameterPathPrefix = `/seqtek/website/${envName}`

    // ----- RDS -----
    const dbMasterSecret = new secretsmanager.Secret(this, 'DbMasterSecret', {
      secretName: `seqtek-website/${envName}/db-master`,
      description: 'RDS master credentials, used by CDK to bootstrap the DB instance.',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'seqtek' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        passwordLength: 32,
      },
    })

    this.database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_4,
      }),
      instanceType: parseInstanceType(cfg.rdsInstanceClass),
      vpc: network.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [network.rdsSecurityGroup],
      credentials: rds.Credentials.fromSecret(dbMasterSecret),
      allocatedStorage: cfg.rdsAllocatedStorageGb,
      storageType: rds.StorageType.GP3,
      multiAz: cfg.rdsMultiAz,
      backupRetention: Duration.days(7),
      deletionProtection: envName === 'prod',
      removalPolicy: envName === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.SNAPSHOT,
      databaseName: `seqtek_${envName}`,
      publiclyAccessible: false,
      port: 5432,
      enablePerformanceInsights: false,
      preferredBackupWindow: '06:00-07:00',
      preferredMaintenanceWindow: 'sun:07:00-sun:08:00',
    })

    // ----- Application secrets -----
    // CDK-generated in Secrets Manager so the plaintext never appears in
    // the synth output. The app reads them from Parameter Store
    // SecureString via the EC2 instance profile.
    const payloadSecret = new secretsmanager.Secret(this, 'PayloadSecret', {
      secretName: `seqtek-website/${envName}/payload-secret`,
      description: 'Payload encryption key for admin session JWTs.',
      generateSecretString: {
        excludePunctuation: true,
        passwordLength: 64,
      },
    })

    const revalidationSecret = new secretsmanager.Secret(this, 'RevalidationSecret', {
      secretName: `seqtek-website/${envName}/revalidation-secret`,
      description: 'Shared secret validating /api/revalidate webhook callers.',
      generateSecretString: {
        excludePunctuation: true,
        passwordLength: 64,
      },
    })

    // ----- Parameter Store: non-sensitive config (CDK writes plaintext) -----
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

    // ----- Parameter Store: sensitive values via AwsCustomResource -----
    // The Value: field receives a Token (a CFN dynamic reference); CFN
    // resolves it at deploy time, NOT at synth time. The synthesized
    // template only contains the reference (arn + json key), not the
    // plaintext. Constitution IV: no secrets in synthesized templates.
    // Build the dynamic-reference expressions. Each `unsafeUnwrap()`
    // returns the resolved Token string (a CFN `{{resolve:secretsmanager:...}}`
    // expression). CDK requires the explicit opt-in because the safety
    // analyzer can't see that the rendered template only contains the
    // dynamic reference, not the plaintext. The plaintext briefly
    // transits CFN's resource-provider invocation when the
    // AwsCustomResource Lambda runs; the durable storage is Parameter
    // Store SecureString (encrypted). Constitution IV's "no secrets in
    // git" bar is satisfied — there's no plaintext in the synthesized
    // CFN template or in the repo.
    const dbUsername = dbMasterSecret.secretValueFromJson('username').unsafeUnwrap()
    const dbPassword = dbMasterSecret.secretValueFromJson('password').unsafeUnwrap()
    const databaseUrlExpr = `postgresql://${dbUsername}:${dbPassword}@${this.database.instanceEndpoint.hostname}:${this.database.instanceEndpoint.port}/seqtek_${envName}`

    this.databaseUrlParameter = mirrorSecretToSsmSecureString(this, 'DatabaseUrlSsm', {
      parameterName: `${this.parameterPathPrefix}/database_url`,
      value: databaseUrlExpr,
      description: 'Postgres connection string (built from RDS endpoint + master secret).',
    })
    this.databaseUrlParameter.node.addDependency(this.database)

    this.payloadSecretParameter = mirrorSecretToSsmSecureString(this, 'PayloadSecretSsm', {
      parameterName: `${this.parameterPathPrefix}/payload_secret`,
      value: payloadSecret.secretValue.unsafeUnwrap(),
      description: 'Payload JWT signing secret (mirror of Secrets Manager value).',
    })

    this.revalidationSecretParameter = mirrorSecretToSsmSecureString(
      this,
      'RevalidationSecretSsm',
      {
        parameterName: `${this.parameterPathPrefix}/revalidation_secret`,
        value: revalidationSecret.secretValue.unsafeUnwrap(),
        description: 'Revalidation webhook shared secret (mirror of Secrets Manager value).',
      },
    )

    // ----- Outputs (cross-stack consumption) -----
    new CfnOutput(this, 'DbEndpointHostname', {
      value: this.database.instanceEndpoint.hostname,
      exportName: `${this.stackName}-DbEndpointHostname`,
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

/**
 * Mirrors a sensitive value into SSM Parameter Store as a SecureString
 * via an AwsCustomResource. The value is passed as a Token so CFN's
 * dynamic-reference resolver materializes it at deploy time, not synth
 * time — keeping the plaintext out of the synthesized template.
 */
function mirrorSecretToSsmSecureString(
  scope: Construct,
  id: string,
  props: { parameterName: string; value: string; description?: string },
): ssm.IParameter {
  const stack = Stack.of(scope)
  const parameterArn = `arn:aws:ssm:${stack.region}:${stack.account}:parameter${props.parameterName}`

  const physicalId = cr.PhysicalResourceId.of(props.parameterName)

  new cr.AwsCustomResource(scope, `${id}Mirror`, {
    resourceType: 'Custom::SsmSecureStringMirror',
    onCreate: {
      service: 'SSM',
      action: 'putParameter',
      parameters: {
        Name: props.parameterName,
        Value: props.value,
        Type: 'SecureString',
        Overwrite: false,
        Description: props.description ?? '',
      },
      physicalResourceId: physicalId,
    },
    onUpdate: {
      service: 'SSM',
      action: 'putParameter',
      parameters: {
        Name: props.parameterName,
        Value: props.value,
        Type: 'SecureString',
        Overwrite: true,
        Description: props.description ?? '',
      },
      physicalResourceId: physicalId,
    },
    onDelete: {
      service: 'SSM',
      action: 'deleteParameter',
      parameters: {
        Name: props.parameterName,
      },
    },
    policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
      resources: [parameterArn],
    }),
    installLatestAwsSdk: false,
  })

  return ssm.StringParameter.fromSecureStringParameterAttributes(scope, `${id}Ref`, {
    parameterName: props.parameterName,
  })
}
