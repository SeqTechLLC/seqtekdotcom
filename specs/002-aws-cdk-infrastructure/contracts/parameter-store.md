# Contract: Secrets + Parameter Store Namespace

Two AWS services back the runtime config:

- **AWS Secrets Manager** under prefix `seqtek-website/{env}/` — sensitive values that benefit from CDK-native generation, native rotation, and auto-attached metadata (RDS host/port/dbname). Plaintext never leaves the AWS API surface; CDK doesn't materialize it in the synthesized template.
- **AWS SSM Parameter Store** under prefix `/seqtek/website/{env}/` — non-sensitive config (S3 bucket names) and externally-managed config (Google OAuth client ID).

env ∈ {`prod`, `staging`}.

## Why this split

We originally specified Parameter Store SecureString for everything. First deploy of `SeqtekStagingData` (2026-05-26) hit two AWS-side limits that broke the SSM-SecureString-mirror-via-AwsCustomResource pattern:

1. **SSM rejects values containing `{{` or `}}`** — those are SSM's own parameter-resolution syntax and can't appear in a parameter value.
2. **CloudFormation does not resolve dynamic references (`{{resolve:secretsmanager:…}}`) nested inside an `AwsCustomResource` parameters block** — the literal token gets passed to the Lambda, which forwards it to `ssm:PutParameter`, which fails per (1).

Resolution: drop the SSM-SecureString mirror entirely; let sensitive values live in Secrets Manager where CDK can manage them natively. EC2 user-data fetches both stores at boot and assembles env vars.

## Inventory

### Secrets Manager — `seqtek-website/{env}/`

| Name                     | Provisioner                                              | Consumer                 | Notes                                                                                                                                                                                                                    |
| ------------------------ | -------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `…/db-master`            | CDK (`rds.Credentials.fromGeneratedSecret`)              | App (user-data assembly) | RDS-auto-attached after instance creation: JSON `{username, password, host, port, dbname, dbInstanceIdentifier, engine}`. User-data reads + assembles `DATABASE_URL`.                                                    |
| `…/payload-secret`       | CDK (`secretsmanager.Secret`)                            | App (Payload JWTs)       | Random 64-char string. Rotation: regenerate in Secrets Manager → ASG instance refresh → all admin sessions invalidated.                                                                                                  |
| `…/revalidation-secret`  | CDK (`secretsmanager.Secret`)                            | App (`/api/revalidate`)  | Random 64-char string. Rotation: regenerate → ASG instance refresh. No external webhook callers.                                                                                                                         |
| `…/google-client-secret` | _(reserved)_ — manual via `secretsmanager create-secret` | App (OAuth)              | Currently lives at the SSM SecureString path `…/google_client_secret` (manual seed via `aws ssm put-parameter`) for compatibility with the spec-001 quickstart. May migrate to Secrets Manager in a future cleanup pass. |
| `…/slack-webhook-url`    | _(reserved)_                                             | Slack notifier Lambda    | Phase 5 (T042) — channel + webhook URL provisioned by Kenn. Lives at SSM SecureString path `…/slack_webhook_url` until Phase 5 lands.                                                                                    |

### SSM Parameter Store — `/seqtek/website/{env}/`

| Path                     | Type           | Provisioner                                                                 | Consumer                                | Notes                                                                                                           |
| ------------------------ | -------------- | --------------------------------------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `…/s3_bucket`            | `String`       | CDK (`data-stack`)                                                          | App (Payload S3 adapter)                | E.g., `seqtek-media-staging`.                                                                                   |
| `…/s3_bucket_hostname`   | `String`       | CDK (`data-stack`)                                                          | App (`next.config.ts` `remotePatterns`) | E.g., `seqtek-media-staging.s3.us-east-1.amazonaws.com`.                                                        |
| `…/google_client_id`     | `String`       | Manual (Google Cloud Console + `aws ssm put-parameter`)                     | App (OAuth)                             | Per spec 001. Public-ish; env-scoped (prod vs staging OAuth clients differ).                                    |
| `…/google_client_secret` | `SecureString` | Manual (Google Cloud Console + `aws ssm put-parameter --type SecureString`) | App (OAuth)                             | Per spec 001. The `aws ssm put-parameter` CLI handles encryption client-side, so we don't hit the `{{}}` issue. |
| `…/next_public_site_url` | `String`       | CDK (`edge-stack`)                                                          | App (`next.config.ts`)                  | Resolved canonical site URL. CloudFront default until T029b registers the vanity domain.                        |
| `…/slack_webhook_url`    | `SecureString` | Manual (Kenn, Phase 5)                                                      | Slack notifier Lambda                   | Phase 5 (T042). Same manual-CLI seeding pattern as `google_client_secret`.                                      |

## Application read path (user-data at boot)

```bash
# 1. Pull SSM params (config) — bulk fetch under the env prefix
aws ssm get-parameters-by-path --path "/seqtek/website/${ENV}" --recursive --with-decryption \
  --query 'Parameters[*].[Name,Value]' --output text | while IFS=$'\t' read -r name value; do
  key=$(basename "$name" | tr '[:lower:]' '[:upper:]')
  echo "$key=$value" >> /etc/seqtek-website.env
done

# 2. Pull Secrets Manager secrets (sensitive) — three GetSecretValue calls
DB_SECRET=$(aws secretsmanager get-secret-value --secret-id "seqtek-website/${ENV}/db-master" --query SecretString --output text)
echo "DATABASE_URL=postgresql://$(echo "$DB_SECRET" | jq -r '.username'):$(echo "$DB_SECRET" | jq -r '.password')@$(echo "$DB_SECRET" | jq -r '.host'):$(echo "$DB_SECRET" | jq -r '.port')/$(echo "$DB_SECRET" | jq -r '.dbname')" >> /etc/seqtek-website.env

PAYLOAD_SECRET=$(aws secretsmanager get-secret-value --secret-id "seqtek-website/${ENV}/payload-secret" --query SecretString --output text)
echo "PAYLOAD_SECRET=$PAYLOAD_SECRET" >> /etc/seqtek-website.env

REVALIDATION_SECRET=$(aws secretsmanager get-secret-value --secret-id "seqtek-website/${ENV}/revalidation-secret" --query SecretString --output text)
echo "REVALIDATION_SECRET=$REVALIDATION_SECRET" >> /etc/seqtek-website.env

# 3. docker run --env-file /etc/seqtek-website.env …
```

Rotation: changing a Secrets Manager value or SSM parameter does NOT auto-propagate into a running container's env. Procedure: update the value → trigger ASG instance refresh → new instances pick up the new value at boot.

The app's `process.env` reads remain the existing names (`DATABASE_URL`, `PAYLOAD_SECRET`, etc.) — store choice is a packaging detail, not an API change for app code.

## What is NOT in either store

- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — never present anywhere. EC2 uses instance profile, Lambda uses execution role. (Constitution IV.)
- `NEXT_PUBLIC_*` build-time variables (`NEXT_PUBLIC_HUBSPOT_PORTAL_ID`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_SCOREAPP_URL`) — baked into the container image at `docker build` via build args. Sourced from GitHub Actions repository variables, not Parameter Store, because they need to exist at build time before push to ECR.

## Rotation matrix

| Item                   | Procedure                                                                                                                                                                                                                                                             | Customer impact                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Database password      | `aws secretsmanager rotate-secret --secret-id seqtek-website/${ENV}/db-master` (or RDS console "Modify → Manage master credentials" rotation toggle). Secrets Manager updates atomically (no DB outage). ASG instance refresh picks up the new password at next boot. | None                                     |
| `payload_secret`       | Generate new value (`openssl rand -hex 32`) → `aws secretsmanager put-secret-value --secret-id seqtek-website/${ENV}/payload-secret --secret-string …` → ASG instance refresh.                                                                                        | All admin sessions invalidated; re-login |
| `revalidation_secret`  | Same shape as `payload-secret`. Internal-only secret; no external callers to coordinate with.                                                                                                                                                                         | None                                     |
| `google_client_secret` | Rotate in Google Cloud Console → `aws ssm put-parameter --name /seqtek/website/${ENV}/google_client_secret --type SecureString --value … --overwrite` → ASG instance refresh.                                                                                         | None                                     |
| `slack_webhook_url`    | Generate new webhook in Slack workspace settings (revoke old) → `aws ssm put-parameter --type SecureString --overwrite` → no ASG refresh needed; Slack notifier Lambda re-fetches at next cold start.                                                                 | None                                     |

## IAM policy summary

```ts
// AppInstanceRole (EC2 instance profile) — compute-stack
// SSM Parameter Store
new iam.PolicyStatement({
  actions: ['ssm:GetParameter', 'ssm:GetParameters', 'ssm:GetParametersByPath'],
  resources: [`arn:aws:ssm:us-east-1:${account}:parameter/seqtek/website/${env}/*`],
})

// Secrets Manager
new iam.PolicyStatement({
  actions: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
  resources: [
    dbSecret.secretArn,
    payloadSecret.secretArn,
    revalidationSecret.secretArn,
    `${dbSecret.secretArn}-*`, // Secrets Manager appends a -<random6> suffix
    `${payloadSecret.secretArn}-*`,
    `${revalidationSecret.secretArn}-*`,
  ],
})

// KMS for decrypting both SecureString (aws/ssm) and Secrets Manager (aws/secretsmanager)
new iam.PolicyStatement({
  actions: ['kms:Decrypt'],
  resources: [
    `arn:aws:kms:us-east-1:${account}:alias/aws/ssm`,
    `arn:aws:kms:us-east-1:${account}:alias/aws/secretsmanager`,
  ],
})
```

No `ssm:*`. No `secretsmanager:*`. No wildcard resource. Assertion-tested in `infra/test/iam-invariants.test.ts`.
