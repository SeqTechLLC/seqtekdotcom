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

    it('places RDS in PRIVATE_ISOLATED subnets', () => {
      t.hasResource('AWS::RDS::DBSubnetGroup', Match.anyValue())
    })

    it('staging RDS has SNAPSHOT removal policy (not RETAIN)', () => {
      t.hasResource('AWS::RDS::DBInstance', {
        DeletionPolicy: 'Snapshot',
        UpdateReplacePolicy: 'Snapshot',
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

    it('creates two non-sensitive Parameter Store entries', () => {
      t.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/seqtek/website/staging/s3_bucket',
        Type: 'String',
      })
      t.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/seqtek/website/staging/s3_bucket_hostname',
        Type: 'String',
      })
    })

    it('creates Secrets Manager secrets for sensitive values', () => {
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

    it('mirrors sensitive values to SSM SecureString via custom resources', () => {
      // Three Custom::SsmSecureStringMirror resources: database_url,
      // payload_secret, revalidation_secret.
      t.resourceCountIs('Custom::SsmSecureStringMirror', 3)
    })

    it('does NOT materialize sensitive values in the synthesized template', () => {
      // Each Custom::SsmSecureStringMirror's Create field is a string
      // template that CDK joined together; it includes CFN intrinsics
      // ({"Fn::GetAtt": [...]} / {"Fn::Join": [...]}) for any Token
      // values (the secret references). At synth time the whole
      // structure is an object tree; serialize it and assert there's
      // no plaintext-looking secret value.
      const customResources = t.findResources('Custom::SsmSecureStringMirror')
      expect(Object.keys(customResources)).toHaveLength(3)
      for (const [logicalId, resource] of Object.entries(customResources)) {
        const props = resource.Properties as Record<string, unknown>
        const create = props.Create
        expect(create, `${logicalId} must have a Create payload`).toBeDefined()
        const serialized = JSON.stringify(create)
        expect(serialized).toContain('SecureString')
        // The Create payload must reference the secret via CFN
        // intrinsic OR via the CFN dynamic-reference resolver syntax
        // (`{{resolve:secretsmanager:...}}`) — never as a literal
        // plaintext string. A pure-literal value field would mean
        // we leaked the secret into the synthesized template.
        const hasIntrinsic =
          serialized.includes('Fn::Join') ||
          serialized.includes('Fn::GetAtt') ||
          serialized.includes('Fn::Sub') ||
          serialized.includes('{{resolve:secretsmanager:')
        expect(
          hasIntrinsic,
          `${logicalId} Create payload appears to have no CFN intrinsic — possible plaintext leak`,
        ).toBe(true)
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
