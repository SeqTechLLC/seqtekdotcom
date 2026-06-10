# Quickstart: ship + verify media via CloudFront `/media/*`

**Feature**: 009-media-cloudfront-serving

## Order of operations (the sequencing matters)

1. **Code + infra PR** — adapter (`prefix: 'media'` + `generateFileURL`), invalidation hook, SSM param + CDK test, docs/ADR reconciliation. Merge → image builds → staging deploys.
2. **Instance refresh** — the user-data SSM→env loop runs at boot; refresh the staging ASG so `NEXT_PUBLIC_SITE_URL` lands in `/etc/seqtek-website.env`:

   ```bash
   ASG_NAME=$(aws autoscaling describe-auto-scaling-groups --region us-east-1 \
     --query "AutoScalingGroups[?contains(AutoScalingGroupName,'Staging')].AutoScalingGroupName | [0]" --output text)
   aws autoscaling start-instance-refresh --region us-east-1 --auto-scaling-group-name "$ASG_NAME"
   ```

3. **Re-key staging** (one-shot, laptop): move objects, then PATCH prefixes — this order keeps the static-handler fallback alive throughout. New uploads after step 1 already land at `media/<filename>`; the re-key script must skip keys already under `media/`.
4. **Verify** (below), then flip ADR 0008 → Accepted is already in the PR — confirm staging evidence attaches to the PR (Constitution II carve-out deliverable).

## Re-key (step 3 detail)

```bash
# Prereqs: staging AWS profile per tools/ingest-photos/STAGING_INGEST.md §Prereqs,
# IMPORT_TOKEN = payload-token cookie from https://seqtek-preview.com/admin
IMPORT_TOKEN=<jwt> IMPORT_BASE_URL=https://seqtek-preview.com AWS_PROFILE=<staging> \
  npx tsx tools/ingest-photos/rekey-staging.ts [--dry-run]
```

The script: lists bucket keys not under `media/` → server-side copy to `media/<key>` → verifies copy → deletes old key → `PATCH /api/media/<id> {prefix: 'media'}` for every media doc with a non-`'media'` prefix. Idempotent: re-runs find nothing to move/patch.

**Fallback** (if in-place re-key fails): delete the 27 media docs, re-push via `push-to-payload.ts` (idempotent), then re-wire team-member `photo` relations from the regenerated `staging-media-ids.json` — documented cost: new media IDs.

## Verify (SC-001…SC-006 evidence)

```bash
# SC-001: all /team headshots render (Playwright or manual screenshot)
# SC-002: edge cache — second request must be a hit, long TTL, no app route
curl -sI https://seqtek-preview.com/media/headshot-hank-haines.webp | grep -i 'x-cache\|cache-control\|content-type'
curl -sI https://seqtek-preview.com/media/headshot-hank-haines.webp | grep -i x-cache   # expect: Hit from cloudfront

# SC-003: zero localhost in emitted URLs
curl -s https://seqtek-preview.com/team https://seqtek-preview.com/sitemap.xml | grep -c localhost   # expect: 0
curl -s https://seqtek-preview.com/ | grep -o 'og:image[^>]*'                                        # absolute, site host

# SC-004: bucket conformance — every key under media/
aws s3api list-objects-v2 --bucket seqtek-media-staging --query 'Contents[].Key' --output text | tr '\t' '\n' | grep -vc '^media/'   # expect: 0

# SC-006: fresh upload via /admin renders with no manual fix-up (spot-check one upload)
```

Admin spot-check: `https://seqtek-preview.com/admin/collections/media` thumbnails render (static-handler fallback + new URLs both alive).

## Local dev sanity (unchanged behavior)

```bash
npm run dev   # no S3 env → plugin disabled → uploads to local FS, URLs stay /api/media/file/*
npm run test:int && npm run test:e2e
```
