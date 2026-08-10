import { Duration, Fn, Stack } from 'aws-cdk-lib'
import * as iam from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'
import type { EnvName } from './construct-utils'

/**
 * GitHub Actions OIDC subject-claim patterns.
 *
 * Prod is pinned to the `production` GitHub **Environment**, NOT to a git ref.
 * Two reasons, and the first one is a hard requirement:
 *
 *  1. When a job declares `environment:`, GitHub replaces the ref in the `sub`
 *     claim with the environment — the token reads
 *     `repo:<owner>/<repo>:environment:production`, never `...:ref:...`.
 *     `deploy.yml`'s deploy job declares `environment: production`, so a
 *     ref-pinned claim can never match and every prod deploy would be denied
 *     with a `sts:AssumeRoleWithWebIdentity` failure.
 *  2. Production deploys are triggered by publishing a `vX.Y.Z` release, so the
 *     ref is `refs/tags/vX.Y.Z` — the old `refs/heads/main` pin was wrong for
 *     the promotion model regardless (see ARCHITECTURE.md § Promotion model).
 *
 * This is not a loosening. Which refs may deploy to production is now enforced
 * by the `production` GitHub Environment's own protection rules (deployment
 * branch/tag restrictions + required reviewers), which is the control point
 * designed for it — and unlike a ref pin, it also gates the manual
 * `workflow_dispatch` path.
 *
 * NOTE (repo age): this repo was created 2026-05-15, before GitHub's
 * 2026-07-15 switch to immutable ID-based subject claims, so the classic
 * `repo:<owner>/<repo>:environment:<name>` format applies. A repo created
 * after that date would need the newer owner-id/repo-id form.
 *
 * Staging accepts any subject under the repo — engineers `cdk diff` and deploy
 * staging from feature branches.
 *
 * Contract: `contracts/github-workflows.md` § OIDC trust policy.
 */
const GITHUB_REPO = 'SeqTechLLC/seqtekdotcom'
const PROD_ENVIRONMENT = 'production'
const PROD_SUB_CLAIM = `repo:${GITHUB_REPO}:environment:${PROD_ENVIRONMENT}`
const STAGING_SUB_CLAIM = `repo:${GITHUB_REPO}:*`

/**
 * Adds the OIDC trust + per-env deploy role to the given scope.
 * Convention: invoke once per env from the network stack so the
 * OIDC provider lives in the rare-change-rate stack.
 *
 * The OIDC provider is account-wide and must exist exactly once per ACCOUNT.
 * Which environment owns it is configuration (`ownsAccountOidcProvider`), not
 * an assumption about env names — that is what lets the two environments live
 * in separate AWS accounts, where BOTH must own one.
 */
export class DeployRoles extends Construct {
  public readonly deployRole: iam.Role

  constructor(
    scope: Construct,
    id: string,
    props: { envName: EnvName; ownsAccountOidcProvider: boolean },
  ) {
    super(scope, id)

    const provider = this.getOrCreateOidcProvider(props.ownsAccountOidcProvider)

    const subClaim = props.envName === 'prod' ? PROD_SUB_CLAIM : STAGING_SUB_CLAIM
    const stackName = props.envName === 'prod' ? 'SeqtekProd' : 'SeqtekStaging'
    const roleName = `${stackName}Deploy`

    this.deployRole = new iam.Role(this, 'DeployRole', {
      roleName,
      maxSessionDuration: Duration.hours(1),
      assumedBy: new iam.WebIdentityPrincipal(provider.openIdConnectProviderArn, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
        },
        StringLike: {
          'token.actions.githubusercontent.com:sub': subClaim,
        },
      }),
      description: `GitHub OIDC-federated deploy role for ${props.envName}. Trust pinned to ${subClaim}.`,
    })

    this.attachScopedPolicies(this.deployRole, props.envName)
  }

  /**
   * Creates the account-wide OIDC provider, or imports the one another
   * environment in the SAME account created.
   *
   * DEPLOY ORDER matters only when an account has an owner and an importer: the
   * owner's network stack must go first. Deploying the importer into an empty
   * account yields a role whose trust policy names a provider that does not
   * exist — CloudFormation accepts it, and every deploy then fails at
   * assume-role time. With both envs in one account (the layout today) that
   * means `SeqtekProdNetwork` before `SeqtekStagingNetwork`; with the envs in
   * separate accounts each owns its own and the ordering disappears.
   */
  private getOrCreateOidcProvider(ownsProvider: boolean): iam.IOpenIdConnectProvider {
    if (ownsProvider) {
      return new iam.OpenIdConnectProvider(this, 'GitHubOidc', {
        url: 'https://token.actions.githubusercontent.com',
        clientIds: ['sts.amazonaws.com'],
      })
    }

    // Import the provider another env in this account created. The ARN format
    // is deterministic and depends only on account + issuer URL.
    const stack = Stack.of(this)
    const providerArn = Fn.sub(
      'arn:${AWS::Partition}:iam::${AWS::AccountId}:oidc-provider/token.actions.githubusercontent.com',
    )
    return iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
      stack,
      'GitHubOidcImport',
      providerArn,
    )
  }

  /**
   * Attaches the least-privilege policy set per data-model.md §3.
   * ARNs are env-scoped via stack-name prefix so the prod role can't
   * touch staging stacks and vice versa.
   */
  private attachScopedPolicies(role: iam.Role, envName: EnvName): void {
    const stack = Stack.of(role)
    const account = stack.account
    const region = stack.region
    const stackPrefix = envName === 'prod' ? 'SeqtekProd' : 'SeqtekStaging'

    // CloudFormation operations on this env's stacks only
    role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'CloudFormationOnEnvStacks',
        actions: [
          'cloudformation:CreateStack',
          'cloudformation:UpdateStack',
          'cloudformation:DeleteStack',
          'cloudformation:DescribeStacks',
          'cloudformation:DescribeStackEvents',
          'cloudformation:DescribeStackResource',
          'cloudformation:DescribeStackResources',
          'cloudformation:GetTemplate',
          'cloudformation:GetTemplateSummary',
          'cloudformation:ListStacks',
          'cloudformation:ValidateTemplate',
          'cloudformation:CreateChangeSet',
          'cloudformation:DeleteChangeSet',
          'cloudformation:DescribeChangeSet',
          'cloudformation:ExecuteChangeSet',
          'cloudformation:ListChangeSets',
        ],
        resources: [`arn:aws:cloudformation:${region}:${account}:stack/${stackPrefix}*`],
      }),
    )

    // CDK toolkit roles (bootstrap-created — file asset publishing, image
    // asset publishing, etc.). `iam:PassRole` lets CFN pass them when
    // resources reference them; `sts:AssumeRole` lets `cdk synth/diff/deploy`
    // hop to them at the CLI level (lookup-role for context queries,
    // deploy-role / cfn-exec-role / file-publishing-role / image-publishing-role
    // for the actual deploy).
    role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'PassCdkExecRoles',
        actions: ['iam:PassRole'],
        resources: [`arn:aws:iam::${account}:role/cdk-*`],
      }),
    )
    role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AssumeCdkBootstrapRoles',
        actions: ['sts:AssumeRole'],
        resources: [`arn:aws:iam::${account}:role/cdk-*`],
      }),
    )

    // CDK bootstrap SSM parameter for toolkit version
    role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'CdkBootstrapParameter',
        actions: ['ssm:GetParameter', 'ssm:GetParameters'],
        resources: [`arn:aws:ssm:${region}:${account}:parameter/cdk-bootstrap/*`],
      }),
    )

    // ECR — this environment's own repo, `seqtek-website-<env>` (created by its
    // compute stack). Scoped per env so the staging deploy role cannot push to
    // the production repository, which the previous shared `seqtek-website`
    // grant allowed.
    role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'EcrPushPullSeqtekWebsite',
        actions: [
          'ecr:GetAuthorizationToken',
          'ecr:BatchCheckLayerAvailability',
          'ecr:BatchGetImage',
          'ecr:GetDownloadUrlForLayer',
          'ecr:InitiateLayerUpload',
          'ecr:UploadLayerPart',
          'ecr:CompleteLayerUpload',
          'ecr:PutImage',
          'ecr:DescribeRepositories',
          'ecr:DescribeImages',
        ],
        resources: [
          `arn:aws:ecr:${region}:${account}:repository/seqtek-website-${envName}`,
          `arn:aws:ecr:${region}:${account}:repository/cdk-*`, // CDK image-asset repos
        ],
      }),
    )

    // ecr:GetAuthorizationToken requires "*" per AWS — separate statement
    role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'EcrAuthToken',
        actions: ['ecr:GetAuthorizationToken'],
        resources: ['*'],
      }),
    )

    // ASG instance refresh — split into two statements because the
    // autoscaling:Describe* actions do NOT support resource-level
    // permissions per AWS docs (must be Resource: "*"), whereas the
    // mutating Start/Cancel actions CAN be scoped to a specific ASG.
    role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AsgInstanceRefreshMutate',
        actions: ['autoscaling:StartInstanceRefresh', 'autoscaling:CancelInstanceRefresh'],
        resources: [
          `arn:aws:autoscaling:${region}:${account}:autoScalingGroup:*:autoScalingGroupName/${stackPrefix}*`,
        ],
      }),
    )
    role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AsgInstanceRefreshDescribe',
        actions: ['autoscaling:DescribeInstanceRefreshes', 'autoscaling:DescribeAutoScalingGroups'],
        resources: ['*'],
      }),
    )

    // S3 — CDK toolkit asset bucket (file assets uploaded during synth)
    role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'CdkToolkitS3Assets',
        actions: ['s3:GetObject', 's3:PutObject', 's3:GetBucketLocation', 's3:ListBucket'],
        resources: [
          `arn:aws:s3:::cdk-*-assets-${account}-${region}`,
          `arn:aws:s3:::cdk-*-assets-${account}-${region}/*`,
        ],
      }),
    )
  }
}
