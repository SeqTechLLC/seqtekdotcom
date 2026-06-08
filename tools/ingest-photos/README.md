# ingest-photos

Bulk-loads the SEQTEK photo archive into the Payload **Media** collection
(ROADMAP **C-8**). One-shot migration tool, not part of the running app.

## What it does

- Walks the photo archive (default `../photos`, ~915 files / 7.4 GB).
- Normalizes each image with the `sharp` already bundled with Payload (compiled
  with libheif — reads HEIC natively, **no system install needed**):
  - **`--mode=all`** (default): auto-orient, cap the long edge at 2400px (the
    largest size the site serves), strip EXIF/GPS, HEIC/jfif → WebP, PNG stays
    lossless PNG. Shrinks the footprint from ~7.4 GB to well under 1 GB.
  - **`--mode=minimal`**: roadmap-literal — convert HEIC/jfif → WebP, downscale
    only the files over the 25 MB cap, pass everything else through full-res
    with original EXIF.
- Dedups by **sha256 of the converted bytes**: identical photos in multiple
  folders collapse to one Media row, and re-runs skip already-uploaded content
  (the idempotency the case-study importer lacks — ROADMAP **T-1**).
- Sets a required placeholder `alt` from the folder name and stamps `caption`
  with a review marker so the editorial alt-text pass (**C-7**) can find them.

The `../photos` archive is never modified — the tool only produces in-memory
buffers for upload.

## Usage

```bash
# Plan only — converts in memory, prints the plan, writes nothing (no DB needed)
npx tsx tools/ingest-photos/index.ts --dry-run --limit=40

# Real run (reads DATABASE_URL + PAYLOAD_SECRET from .env.local)
npm run ingest:photos -- --mode=all --env-label=local
```

Storage follows Payload config: with `S3_BUCKET`+`S3_REGION` set it writes to
S3; otherwise it falls back to local filesystem under `media/`.

## Environments

Buckets are **per-environment** (`seqtek-media-staging` / `seqtek-media-prod`),
so the dedup manifest is env-scoped via `--env-label` (`.manifest.<label>.json`,
gitignored). Staging RDS lives in private subnets and the staging bucket is
written by the EC2 instance profile, so a staging ingest runs **on a staging
instance (via SSM)** — where it has DB reachability and instance-profile S3
credentials — not from a laptop. At launch, content moves staging → prod via a
DB dump/restore + `aws s3 sync` (see `docs/ARCHITECTURE.md` §5).
