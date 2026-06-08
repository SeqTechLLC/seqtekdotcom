# Staging media ingest — runbook

Load the curated image set (`~/projects/seqtek-internal/photo-catalog/curated/`,
23 images) into the **staging** Media collection so it appears on
`seqtek-preview.com`.

**Why it's not one command:** staging RDS lives in a private subnet (not
reachable from a laptop) and media goes to the per-env bucket
`seqtek-media-staging`. The app container is a standalone Next build with no dev
tooling. So we run the ingest **from your machine**, reaching the staging DB
through an **SSM port-forward** and writing media **straight to the staging S3
bucket**. The curated files never have to leave your laptop.

## Prereqs

- AWS CLI v2 + the Session Manager plugin (`session-manager-plugin`).
- AWS creds for the SEQTEK account with: `ssm:StartSession` on a staging
  instance, `s3:PutObject`/`GetObject` on `arn:aws:s3:::seqtek-media-staging/*`,
  and `ssm:GetParameter*` on `/seqtek/website/staging/*`.
- Node 24 + this repo with deps (`npm ci`).
- The curated bundle present locally (regenerate from the catalog anytime; it is
  intentionally **not** committed — it's employee photos and the repo is public).

## 1. Discover the moving parts

```bash
export AWS_REGION=us-east-1
# A healthy staging instance to use as the SSM jump host
INSTANCE_ID=$(aws ec2 describe-instances --region "$AWS_REGION" \
  --filters "Name=tag:Environment,Values=staging" "Name=instance-state-name,Values=running" \
  --query 'Reservations[0].Instances[0].InstanceId' --output text)
# Staging RDS endpoint (from the data stack outputs)
RDS_HOST=$(aws cloudformation describe-stacks --region "$AWS_REGION" --stack-name SeqtekStagingData \
  --query "Stacks[0].Outputs[?contains(OutputKey,'Rds')||contains(OutputKey,'Db')||contains(OutputKey,'Endpoint')].OutputValue | [0]" \
  --output text)
echo "instance=$INSTANCE_ID rds=$RDS_HOST"
# Confirm the exact secret param names, then read them
aws ssm get-parameters-by-path --region "$AWS_REGION" --path /seqtek/website/staging \
  --with-decryption --query 'Parameters[].Name' --output text
```

From those params grab the staging DB user/password (db name is `seqtek_staging`)
and `PAYLOAD_SECRET`.

## 2. Open the SSM port-forward to RDS (leave running)

```bash
aws ssm start-session --region "$AWS_REGION" --target "$INSTANCE_ID" \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters host="$RDS_HOST",portNumber=5432,localPortNumber=5433
```

Postgres is now reachable at `localhost:5433`.

## 3. Run the ingest (new terminal, in the repo)

```bash
# Point at the tunnel, not the RDS host. Add ?sslmode=no-verify if SSL errors
# (the cert won't match localhost over the tunnel — fine for a one-off).
export DATABASE_URL='postgres://<user>:<pass>@localhost:5433/seqtek_staging?sslmode=no-verify'
export PAYLOAD_SECRET='<staging payload secret>'
export S3_BUCKET=seqtek-media-staging
export S3_REGION=us-east-1
export AWS_PROFILE=<your-staging-profile>   # or AWS_ACCESS_KEY_ID / _SECRET / _SESSION_TOKEN

# validate first (no writes), then run for real
npx tsx tools/ingest-photos/ingest-curated.ts --dir ~/projects/seqtek-internal/photo-catalog/curated --dry-run
npx tsx tools/ingest-photos/ingest-curated.ts --dir ~/projects/seqtek-internal/photo-catalog/curated
```

Idempotent — re-runs skip files already present, so it's safe to re-run if the
tunnel drops mid-way.

## 4. Verify

- `https://seqtek-preview.com/admin/collections/media` — 23 new rows, each with
  alt text and a `[curated:<slot>]` caption.
- Media serves via CloudFront OAC; uploads are live immediately (object keys are
  `<media-id>/<filename>`, so no cache invalidation is needed).

## Notes

- DB writes go through the SSM tunnel; S3 PUTs go straight from your machine to
  `seqtek-media-staging`.
- These media IDs are independent of production. At launch, content moves
  staging → prod via a DB dump/restore + `aws s3 sync` (see `ARCHITECTURE.md` §5).
- A tarball of the bundle (`photo-catalog/curated.tar.gz`) exists if you'd rather
  copy it onto an in-VPC host and run there instead of port-forwarding.
