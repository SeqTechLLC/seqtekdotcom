import { App } from 'aws-cdk-lib'
import { Match, Template } from 'aws-cdk-lib/assertions'
import { describe, expect, it } from 'vitest'
import type { EnvConfig } from '../lib/construct-utils'
import { DataStack } from '../lib/data-stack'
import { NetworkStack } from '../lib/network-stack'

const stagingCfg: EnvConfig = {
  region: 'us-east-1',
  domainName: null,
  hostedZoneId: null,
  certificateArn: null,
  instanceClass: 't3',
  instanceSize: 'micro',
  rdsInstanceClass: 't3.micro',
  rdsAllocatedStorageGb: 20,
  rdsMultiAz: false,
  asgMinCapacity: 1,
  asgDesiredCapacity: 1,
  asgMaxCapacity: 2,
  ecrRetainCount: 10,
  logRetentionDays: 14,
}

const prodCfg: EnvConfig = {
  ...stagingCfg,
  instanceSize: 'small',
  rdsInstanceClass: 't3.small',
  rdsAllocatedStorageGb: 50,
  asgMinCapacity: 2,
  asgDesiredCapacity: 2,
  asgMaxCapacity: 3,
  logRetentionDays: 90,
}

function synthDataStack(envName: 'prod' | 'staging', cfg: EnvConfig): Template {
  const app = new App()
  const network = new NetworkStack(app, `Seqtek${envName === 'prod' ? 'Prod' : 'Staging'}Network`, {
    env: { account: '123456789012', region: 'us-east-1' },
    envName,
    cfg,
  })
  const stack = new DataStack(app, `Seqtek${envName === 'prod' ? 'Prod' : 'Staging'}Data`, {
    env: { account: '123456789012', region: 'us-east-1' },
    envName,
    cfg,
    network,
  })
  return Template.fromStack(stack)
}

describe('DataStack', () => {
  describe('staging (free-tier-eligible config)', () => {
    const t = synthDataStack('staging', stagingCfg)

    it('provisions RDS Postgres in private isolated subnets', () => {
      t.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
        DBInstanceClass: 'db.t3.micro',
        AllocatedStorage: '20',
        StorageType: 'gp3',
        MultiAZ: false,
        BackupRetentionPeriod: 7,
        DeletionProtection: false,
        PubliclyAccessible: false,
      })
    })

    it('places RDS in PRIVATE_ISOLATED subnets via a DB subnet group', () => {
      t.hasResource('AWS::RDS::DBSubnetGroup', Match.anyValue())
    })

    it('staging RDS uses DESTROY removal policy (no final snapshot — fast iteration)', () => {
      t.hasResource('AWS::RDS::DBInstance', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      })
    })

    it('creates the S3 media bucket with public access blocked', () => {
      t.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'seqtek-media-staging',
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        OwnershipControls: {
          Rules: [{ ObjectOwnership: 'BucketOwnerEnforced' }],
        },
        VersioningConfiguration: { Status: 'Enabled' },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' },
            },
          ],
        },
      })
    })

    it('configures the lifecycle rules on the media bucket', () => {
      t.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'NoncurrentVersionsToGlacier',
              Status: 'Enabled',
              NoncurrentVersionTransitions: [
                {
                  StorageClass: 'GLACIER_IR',
                  TransitionInDays: 90,
                },
              ],
              NoncurrentVersionExpiration: { NoncurrentDays: 365 },
            }),
            Match.objectLike({
              Id: 'AbortIncompleteMultipartUploads',
              Status: 'Enabled',
              AbortIncompleteMultipartUpload: { DaysAfterInitiation: 7 },
            }),
          ]),
        },
      })
    })

    it('creates two non-sensitive Parameter Store entries (no sensitive values in SSM)', () => {
      t.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/seqtek/website/staging/s3_bucket',
        Type: 'String',
      })
      t.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/seqtek/website/staging/s3_bucket_hostname',
        Type: 'String',
      })
      // Total SSM params for staging-data = 2. Anything else means a
      // regression to the SSM-SecureString-mirror pattern that we
      // explicitly dropped after the failed first deploy.
      const params = t.findResources('AWS::SSM::Parameter')
      expect(Object.keys(params)).toHaveLength(2)
    })

    it('creates Secrets Manager secrets for sensitive values', () => {
      // db-master is auto-created by RDS.Credentials.fromGeneratedSecret;
      // payload-secret + revalidation-secret are explicit Secret constructs.
      t.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: 'seqtek-website/staging/db-master',
      })
      t.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: 'seqtek-website/staging/payload-secret',
      })
      t.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: 'seqtek-website/staging/revalidation-secret',
      })
    })

    it('does NOT use the AwsCustomResource SecureString mirror pattern (dropped after deploy failure)', () => {
      // The Custom::SsmSecureStringMirror approach hit two AWS limits:
      // (a) SSM rejects values containing `{{` or `}}`, and
      // (b) AwsCustomResource doesn't resolve CFN dynamic refs in its parameters.
      // Sensitive values now live in Secrets Manager only; user-data fetches them at boot.
      t.resourceCountIs('Custom::SsmSecureStringMirror', 0)
    })

    it('does NOT materialize sensitive secret values in the synthesized template', () => {
      // Secrets Manager secrets are CDK-native and never leak the plaintext
      // into the synthesized template. Spot-check by confirming the
      // GenerateSecretString blocks ask for random generation (not a literal value).
      const secrets = t.findResources('AWS::SecretsManager::Secret')
      for (const [id, r] of Object.entries(secrets)) {
        const props = r.Properties as {
          GenerateSecretString?: { GenerateStringKey?: string; PasswordLength?: number }
          SecretString?: string
        }
        // Either CDK is generating a random secret (GenerateSecretString set)
        // or no SecretString literal is present.
        expect(
          props.SecretString,
          `${id} must not embed a literal SecretString in the template`,
        ).toBeUndefined()
      }
    })
  })

  describe('prod (spec-shape config)', () => {
    const t = synthDataStack('prod', prodCfg)

    it('RDS uses db.t3.small + 50GB allocated', () => {
      t.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.t3.small',
        AllocatedStorage: '50',
      })
    })

    it('prod RDS has deletionProtection=true and RETAIN policy', () => {
      t.hasResourceProperties('AWS::RDS::DBInstance', {
        DeletionProtection: true,
      })
      t.hasResource('AWS::RDS::DBInstance', {
        DeletionPolicy: 'Retain',
        UpdateReplacePolicy: 'Retain',
      })
    })

    it('media bucket name follows the env-scoped pattern', () => {
      t.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'seqtek-media-prod',
      })
    })
  })
})
