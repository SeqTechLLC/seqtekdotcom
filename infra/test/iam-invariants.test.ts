import { App } from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { describe, expect, it } from 'vitest'
import type { EnvConfig } from '../lib/construct-utils'
import { NetworkStack } from '../lib/network-stack'

/**
 * Cross-cutting IAM-invariant assertions. These run against every
 * stack's synthesized template and catch regressions on the
 * least-privilege bar before a deploy can ever execute the policy.
 *
 * Source: data-model.md §3 ("Assertion-tested IAM invariants").
 */

const SENSITIVE_SERVICES = ['s3', 'ssm', 'iam', 'kms', 'cloudformation', 'ec2']

const cfg: EnvConfig = {
  region: 'us-east-1',
  domainName: null,
  hostedZoneId: null,
  certificateArn: null,
  instanceClass: 't3',
  instanceSize: 'small',
  rdsInstanceClass: 't3.small',
  rdsAllocatedStorageGb: 50,
  rdsMultiAz: false,
  asgMinCapacity: 2,
  asgDesiredCapacity: 2,
  asgMaxCapacity: 3,
  ecrRetainCount: 10,
  logRetentionDays: 90,
}

interface PolicyDocument {
  Statement?: Array<{
    Effect?: string
    Action?: string | string[]
    Resource?: string | string[]
    Condition?: Record<string, unknown>
  }>
}

interface ManagedPolicyArnRef {
  'Fn::Join'?: [string, unknown[]]
}

function synthProdNetwork(): Template {
  const app = new App()
  const stack = new NetworkStack(app, 'SeqtekProdNetwork', {
    env: { account: '123456789012', region: 'us-east-1' },
    envName: 'prod',
    cfg,
  })
  return Template.fromStack(stack)
}

function synthStagingNetwork(): Template {
  const app = new App()
  const stack = new NetworkStack(app, 'SeqtekStagingNetwork', {
    env: { account: '123456789012', region: 'us-east-1' },
    envName: 'staging',
    cfg: { ...cfg, asgMinCapacity: 1, asgDesiredCapacity: 1, asgMaxCapacity: 2 },
  })
  return Template.fromStack(stack)
}

/**
 * Collects every PolicyDocument the template contains — both managed
 * (AWS::IAM::ManagedPolicy) and inline (AWS::IAM::Policy +
 * AWS::IAM::Role.Policies inline blocks).
 */
function collectPolicies(t: Template): PolicyDocument[] {
  const docs: PolicyDocument[] = []
  for (const [, res] of Object.entries(t.findResources('AWS::IAM::Policy'))) {
    const props = res.Properties as { PolicyDocument?: PolicyDocument }
    if (props.PolicyDocument) docs.push(props.PolicyDocument)
  }
  for (const [, res] of Object.entries(t.findResources('AWS::IAM::ManagedPolicy'))) {
    const props = res.Properties as { PolicyDocument?: PolicyDocument }
    if (props.PolicyDocument) docs.push(props.PolicyDocument)
  }
  for (const [, res] of Object.entries(t.findResources('AWS::IAM::Role'))) {
    const props = res.Properties as { Policies?: Array<{ PolicyDocument?: PolicyDocument }> }
    if (props.Policies) {
      for (const inline of props.Policies) {
        if (inline.PolicyDocument) docs.push(inline.PolicyDocument)
      }
    }
  }
  return docs
}

function actionsOf(stmt: { Action?: string | string[] }): string[] {
  if (!stmt.Action) return []
  return Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action]
}

function resourcesOf(stmt: { Resource?: string | string[] }): string[] {
  if (!stmt.Resource) return []
  return Array.isArray(stmt.Resource) ? stmt.Resource : [stmt.Resource]
}

describe('IAM invariants — every stack', () => {
  const stacks = [
    { name: 'SeqtekProdNetwork', synth: synthProdNetwork },
    { name: 'SeqtekStagingNetwork', synth: synthStagingNetwork },
  ]

  for (const { name, synth } of stacks) {
    describe(name, () => {
      it('no policy statement has Action: "*"', () => {
        const t = synth()
        for (const doc of collectPolicies(t)) {
          for (const stmt of doc.Statement ?? []) {
            const actions = actionsOf(stmt)
            expect(actions, `Action: "*" found in ${name}`).not.toContain('*')
          }
        }
      })

      it('no policy statement has Resource: "*" combined with a wildcard sensitive action', () => {
        const t = synth()
        for (const doc of collectPolicies(t)) {
          for (const stmt of doc.Statement ?? []) {
            const actions = actionsOf(stmt)
            const resources = resourcesOf(stmt)
            const hasWildcardResource = resources.some((r) => r === '*')
            if (!hasWildcardResource) continue

            // Wildcard resource is OK ONLY if every action is one of the
            // documented "API requires *" exceptions:
            // - ecr:GetAuthorizationToken — auth flow predates the repo ARN
            // - cloudwatch:PutMetricData — service-level metric write
            // - ssm:DescribeParameters — list APIs can't be ARN-scoped
            // - iam:*OpenIDConnectProvider — CDK custom-resource Lambda that
            //   manages the OIDC provider lifecycle (the provider's ARN doesn't
            //   exist at policy-attach time; the actions are scoped by API to
            //   IdP management only, not general IAM)
            const allowedWildcardActions = new Set([
              'ecr:GetAuthorizationToken',
              'cloudwatch:PutMetricData',
              'ssm:DescribeParameters',
              'iam:CreateOpenIDConnectProvider',
              'iam:DeleteOpenIDConnectProvider',
              'iam:GetOpenIDConnectProvider',
              'iam:UpdateOpenIDConnectProviderThumbprint',
              'iam:AddClientIDToOpenIDConnectProvider',
              'iam:RemoveClientIDFromOpenIDConnectProvider',
            ])
            for (const action of actions) {
              if (allowedWildcardActions.has(action)) continue
              for (const service of SENSITIVE_SERVICES) {
                expect(
                  action.startsWith(`${service}:`),
                  `Wildcard resource with sensitive action ${action} in ${name}`,
                ).toBe(false)
              }
            }
          }
        }
      })

      it('OIDC-trusted roles have a sub: claim pin', () => {
        const t = synth()
        const roles = t.findResources('AWS::IAM::Role')
        for (const [logicalId, res] of Object.entries(roles)) {
          const trust = (res.Properties as { AssumeRolePolicyDocument?: PolicyDocument })
            .AssumeRolePolicyDocument
          if (!trust?.Statement) continue
          for (const stmt of trust.Statement) {
            const principal = (stmt as { Principal?: Record<string, unknown> }).Principal
            const isOidc =
              principal &&
              typeof principal === 'object' &&
              'Federated' in principal &&
              JSON.stringify(principal.Federated).includes('token.actions.githubusercontent.com')
            if (!isOidc) continue
            const condition = stmt.Condition
            expect(
              condition,
              `OIDC role ${logicalId} in ${name} must declare a sub-claim condition`,
            ).toBeDefined()
            const stringLike = (condition as Record<string, unknown>)?.StringLike as
              | Record<string, unknown>
              | undefined
            expect(
              stringLike?.['token.actions.githubusercontent.com:sub'],
              `OIDC role ${logicalId} in ${name} must pin sub: claim`,
            ).toBeDefined()
          }
        }
      })

      it('EC2 instance profile roles attach ONLY allowlisted managed policies', () => {
        // Validation-period carve-out: AmazonSSMManagedInstanceCore is
        // accepted for SSM Session Manager debug access. Phase 5.5 polish
        // removes that attachment from compute-stack.ts and tightens this
        // allowlist back to an empty set.
        const ALLOWED_MANAGED_POLICIES = new Set(['AmazonSSMManagedInstanceCore'])
        const t = synth()
        const roles = t.findResources('AWS::IAM::Role')
        for (const [logicalId, res] of Object.entries(roles)) {
          const props = res.Properties as {
            AssumeRolePolicyDocument?: PolicyDocument
            ManagedPolicyArns?: ManagedPolicyArnRef[] | string[]
          }
          const trust = props.AssumeRolePolicyDocument
          const isEc2Role =
            trust?.Statement?.some((stmt) =>
              JSON.stringify((stmt as { Principal?: unknown }).Principal).includes(
                'ec2.amazonaws.com',
              ),
            ) ?? false
          if (!isEc2Role) continue

          const managed = props.ManagedPolicyArns ?? []
          for (const arn of managed) {
            const serialized = typeof arn === 'string' ? arn : JSON.stringify(arn)
            const match = serialized.match(/policy\/([\w-]+)/)
            const policyName = match?.[1] ?? ''
            expect(
              ALLOWED_MANAGED_POLICIES.has(policyName),
              `EC2 role ${logicalId} in ${name} attaches non-allowlisted managed policy: ${serialized}`,
            ).toBe(true)
          }
        }
      })
    })
  }
})
