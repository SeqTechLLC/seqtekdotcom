# Infrastructure Runbook

Procedures for the one deployed env, `preview`: the `SeqtekPreview*` stacks in
`us-east-1`. They serve preview.seqtek.com (UAT) and ww3.seqtek.com (production)
from one RDS instance, with the databases `seqtek_preview` and `seqtek_prod`. AWS
steps belong to SEQTEK's account admin. Merges, Deploy runs, releases and `/admin`
belong to the website owner. This repo is public, so send the admin a link, not a
copy. Design rationale is in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## 1. Rebuild a lane's database

The 2026-09-24 baseline migration creates every table, so it cannot run against a
lane's existing database. Each lane's database is recreated empty; the new image
migrates it on start, and the content loads from the JSON.

Keep the lane at zero tasks from the drop until the redeploy. Otherwise ECS
restarts the old image against the empty database, it recreates the old schema,
and the redeploy fails again.

**Account admin.**

1. Scale the lane's service to 0 and leave it there.

   ```sh
   export AWS_REGION=us-east-1
   out() { aws cloudformation describe-stacks --stack-name SeqtekPreviewCompute \
     --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text; }
   CLUSTER=$(out ClusterName)
   SERVICE=$(out ServiceName)   # ww3: $(out SecondaryLaneServiceName)
   aws ecs update-service --cluster "$CLUSTER" --service "$SERVICE" --desired-count 0
   ```

2. Drop and recreate its database with a one-off task from the lane's own task
   definition, which has the credentials. The script only touches the lane's own
   database, and it logs `recreated seqtek_preview` (or `seqtek_prod`).

```sh
TASKDEF=$(aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" \
  --query 'services[0].taskDefinition' --output text)
aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" \
  --query 'services[0].networkConfiguration' --output json > net.json
cat > recreate-db.json <<'EOF'
{"containerOverrides": [{"name": "AppContainer", "command": ["node", "-e",
  "const { Client } = require('pg'); const e = process.env; if (!['seqtek_preview', 'seqtek_prod'].includes(e.DB_NAME)) { console.error('refusing DB_NAME ' + e.DB_NAME); process.exit(1); } const c = new Client({ connectionString: `postgresql://${e.DB_USER}:${e.DB_PASS}@${e.DB_HOST}:${e.DB_PORT}/postgres?sslmode=require` }); (async () => { await c.connect(); await c.query(`DROP DATABASE IF EXISTS ${e.DB_NAME} WITH (FORCE)`); await c.query(`CREATE DATABASE ${e.DB_NAME}`); await c.end(); console.log('recreated ' + e.DB_NAME); })().catch((err) => { console.error(err); process.exit(1); });"]}]}
EOF
aws ecs run-task --cluster "$CLUSTER" --launch-type FARGATE --task-definition "$TASKDEF" \
  --network-configuration file://net.json --overrides file://recreate-db.json
```

**Website owner.**

3. Redeploy: re-run the failed Deploy run (preview) or publish the release (ww3).
   The deploy brings the service back up on the new image.
4. Sign in to the lane's `/admin` first: on an empty database the first account to
   sign in becomes the only admin. Then load the content JSON with
   `npm run payload:seed` in the order in the content repo's `LOAD-ORDER.md`.

If the redeploy fails, repeat 1–2 and redeploy. Merge nothing to `main` while
preview is being rebuilt, since a merge redeploys it. Do ww3 right before
publishing the release that carries the baseline (#174 or later).

## 2. Snapshot before a destructive migration

A merge to `main` deploys preview, publishing a release deploys ww3, and each
container runs `payload migrate` on start. So a migration that drops columns or
tables applies with no manual step. Before merging one, and again before publishing
its release, the account admin snapshots the RDS instance:

```sh
aws rds create-db-snapshot --db-instance-identifier <instance> \
  --db-snapshot-identifier pre-<migration-name-with-hyphens>
aws rds wait db-snapshot-available --db-snapshot-identifier pre-<migration-name-with-hyphens>
```

The instance is the one behind the `SeqtekPreviewData` output `DbEndpointHostname`;
the account has other RDS instances. The content JSON rebuilds everything else, so
the snapshot only matters for edits made directly in `/admin`.

Don't run a Payload script from a laptop against a lane. Drizzle push is on outside
`NODE_ENV=production`, so it would push the local schema to the lane unrecorded.

## 3. GitHub environments

`preview` and `production` each hold an `AWS_ACCOUNT_ID` secret. `production` only
deploys from `v*` tags and `main`, and carries the variable
`PROD_ENVIRONMENT_CONFIGURED=true`. `deploy.yml` fails closed without that flag,
because GitHub auto-creates a missing environment with no protection rules.

## 4. Parameters CDK does not create

| Where              | Name                                                  |
| ------------------ | ----------------------------------------------------- |
| SSM `String`       | `/seqtek/website/preview/google_client_id`            |
| SSM `SecureString` | `/seqtek/website/preview/google_client_secret`        |
| SSM `SecureString` | `/seqtek/website/preview/slack_webhook_url`           |
| SSM `String`       | `/seqtek/website/preview/cognito_google_client_id`    |
| Secrets Manager    | `seqtek-website/preview/cognito-google-client-secret` |

There are two Google OAuth clients, both in the Workspace project with the
"Internal" (`@seqtechllc.com`-only) consent screen:

- **The app's `/admin` login.** Its redirect URIs are
  `https://<lane-host>/api/auth/oauth/callback/google` for each lane.
- **The Cognito gate.** Its redirect URI is
  `https://seqtek-preview-gate.auth.us-east-1.amazoncognito.com/oauth2/idpresponse`.
  Its secret is in Secrets Manager rather than SSM, because Cognito's identity
  provider only resolves Secrets Manager references.

Never switch either consent screen to External. Cognito does not filter by domain,
so that would admit every Google account.

## 5. Let an external reviewer through the gate

Someone without an `@seqtechllc.com` account gets a user in the gate's own pool.
This lets them view the site only; `/admin` is a separate login.

```sh
aws cognito-idp admin-create-user \
  --user-pool-id "$(aws cognito-idp list-user-pools --max-results 20 \
      --query "UserPools[?Name=='seqtek-preview-gate'].Id" --output text)" \
  --username '<their email>' \
  --user-attributes Name=email,Value='<their email>' Name=email_verified,Value=true \
  --message-action SUPPRESS \
  --temporary-password '<8+ chars, upper + lower + number + symbol>'
```

The pool sends no mail, so hand them the temporary password directly. It expires in
7 days, so create the account when you hand it over. They type their email into the
username field and set their own password on first sign-in. When the engagement
ends:
`aws cognito-idp admin-delete-user --user-pool-id <pool id> --username '<their email>'`.
