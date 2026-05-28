# Contract: GitHub Actions Workflows

Two new workflows under `.github/workflows/`. The existing `ci.yml` (P1-2 + P1-9) is extended; no changes to its trigger or permission profile.

---

## `infra-diff.yml`

**Purpose**: Post a `cdk diff` comment on any PR that touches infrastructure code, so reviewers see exactly what resources will change (FR-013).

**Trigger**:

```yaml
on:
  pull_request:
    branches: [main]
    paths:
      - 'infra/**'
      - 'Dockerfile'
      - '.dockerignore'
      - '.github/workflows/deploy.yml'
      - '.github/workflows/infra-diff.yml'
```

The `paths:` filter means PRs that don't touch infra silently skip this workflow — but the workflow always **runs** on infra-touching PRs (path filtering is a GitHub-side optimization). Per FR-013: "On PRs that do not touch infrastructure code, the comment MUST either explicitly say so or not appear, never silently miss the run." We choose "not appear" — the absence of an `infra-diff` check on a non-infra PR is unambiguous (the workflow simply did not run).

**Permissions**:

```yaml
permissions:
  id-token: write # OIDC
  contents: read
  pull-requests: write # to post the diff comment
```

**Required**:

- GitHub Actions repository variable `AWS_ACCOUNT_ID` (non-secret; account ID is not a secret in AWS's threat model)
- AWS role `SeqtekStagingDeploy` (uses staging role — diff is read-only, no need to assume prod role)

**Outputs**:

- A PR comment with the synthesized `cdk diff` for both `SeqtekStaging*` and `SeqtekProd*` stack sets. Comment is updated in-place on subsequent pushes (one comment per PR, not one-per-push).
- If the diff exceeds GitHub's comment size limit (~65k chars), the comment truncates with `[diff truncated — see workflow run for full output]` and a link.
- Workflow status: success (diff posted) / failure (synth errored).

**Steps**:

1. Checkout
2. Setup Node (matches `infra/package.json`)
3. `npm --prefix infra ci`
4. Assume `SeqtekStagingDeploy` via `aws-actions/configure-aws-credentials@v4` with OIDC
5. `npm --prefix infra run synth -- -c env=staging` (also synth prod for completeness)
6. `npx cdk diff -c env=prod 'SeqtekProd*'` + same for staging — capture to file
7. Post / update PR comment via `actions/github-script`

---

## `deploy.yml`

**Purpose**: On merge to `main`, build + push the Docker image and trigger a zero-downtime ASG instance refresh (FR-014).

**Trigger**:

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch: # manual re-deploy / network-stack changes
    inputs:
      stack-filter:
        description: 'CDK stack glob (e.g., SeqtekProd*Compute or SeqtekProd*)'
        default: 'SeqtekProd*Compute'
        type: string
```

`push` triggers the routine compute-stack-only deploy. `workflow_dispatch` is used to roll out network/data/edge/observability stack changes, which require manual approval per ARCHITECTURE.md §13.

**Permissions**:

```yaml
permissions:
  id-token: write
  contents: read
```

**Required**:

- Repository variable `AWS_ACCOUNT_ID`
- AWS role `SeqtekProdDeploy` (trust policy pinned to `ref:refs/heads/main`)
- GitHub Environment `production` with required reviewers gate on the `workflow_dispatch` path for non-compute stacks (CloudFormation change-set acts as the diff; reviewers approve the GitHub environment promotion)

**Concurrency**:

```yaml
concurrency:
  group: deploy-prod
  cancel-in-progress: false # never cancel a deploy mid-flight
```

Pairs with CloudFormation's native stack-update lock — a second `deploy.yml` run started while one is in flight will queue (FR-016).

**Outputs**:

- ECR image tag (git SHA) — posted to the commit's deployment status
- Instance refresh ID — posted to the commit's deployment status
- Smoke test result (Playwright against deployed staging) — gates the workflow's "success" state

**Steps**:

1. Checkout
2. Assume `SeqtekProdDeploy` via OIDC
3. ECR login (`aws ecr get-login-password | docker login`)
4. `docker buildx build --platform linux/amd64 --tag <ecr-uri>:<git-sha> --tag <ecr-uri>:latest .`
5. `docker push --all-tags <ecr-uri>`
6. `npm --prefix infra ci`
7. `npm --prefix infra run cdk -- deploy -c env=prod 'SeqtekProd*Compute' --require-approval never` — triggers ASG instance refresh as part of the LaunchTemplate update
8. Wait for instance refresh to complete (`aws autoscaling describe-instance-refreshes`) with timeout 15 min
9. Run Playwright smoke against the prod ALB (`/api/health` → 200, `/admin` reaches SSO entry)
10. If steps 7-9 fail: report failure; CloudFormation auto-rollback handles the cleanup; previous image continues serving (FR-015)

---

## Extension to existing `ci.yml`

Append one job to the `quality` workflow:

```yaml
synth:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version-file: '.nvmrc'
    - run: npm --prefix infra ci
    - run: npm --prefix infra run synth -- -c env=staging --quiet
    - run: npm --prefix infra run synth -- -c env=prod --quiet
    - run: npm --prefix infra run test # vitest + aws-cdk-lib/assertions
```

This job has **no** `id-token: write` permission — synth runs entirely from committed code, no AWS API calls needed. Reviewing this addition confirms the OIDC trust surface stays bounded to `deploy.yml` + `infra-diff.yml`.

---

## OIDC trust policy (one-time bootstrap)

Created by `infra/lib/deploy-role.ts` and seeded by the first `cdk deploy SeqtekProdNetwork` (the network stack is the only one that contains the OIDC provider — its blast radius matches: rare change, account-wide):

```ts
// One OIDC provider per account
new iam.OpenIdConnectProvider(this, 'GitHubOidc', {
  url: 'https://token.actions.githubusercontent.com',
  clientIds: ['sts.amazonaws.com'],
})

// Per-env deploy role
new iam.Role(this, 'ProdDeployRole', {
  roleName: 'SeqtekProdDeploy',
  assumedBy: new iam.WebIdentityPrincipal(githubOidcProvider.openIdConnectProviderArn, {
    StringEquals: {
      'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
    },
    StringLike: {
      'token.actions.githubusercontent.com:sub': 'repo:SeqTechLLC/seqtekdotcom:ref:refs/heads/main',
    },
  }),
  maxSessionDuration: cdk.Duration.hours(1),
  // policies attached per the IAM inventory in data-model.md §3
})
```

The `sub` claim pin is **load-bearing** — without it, any GitHub workflow in any repo could potentially assume this role. The CDK assertion test `infra/test/iam-invariants.test.ts` fails if any OIDC-trusted role lacks a `sub` condition.

---

## What is NOT in scope for this contract

- The existing `ci.yml` `quality`, `gitleaks`, and `tests` jobs are unchanged.
- No new repo-level secrets are required. The OIDC trust eliminates the need for `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` secrets.
- No new third-party GitHub Actions are introduced beyond `aws-actions/configure-aws-credentials@v4` and `actions/github-script@v7` — both first-party-equivalent (AWS-maintained / GitHub-maintained).
