# Quickstart: Payload admin UX for content self-serve

**Feature**: `specs/011-payload-admin-ux` | **Date**: 2026-08-21

How to run, see, and verify this feature. Assumes the standard local setup in `docs/LOCAL_DEVELOPMENT.md`.

---

## 1. Look at the problem first

Everything in this spec was found by opening the admin, not by reading config. Do the same before changing anything — the screenshots are the acceptance baseline.

```bash
# Postgres (already running if you use the compose file)
docker compose up -d postgres            # company-website-postgres-1 on :5433

# Your own server on a free port — do NOT reuse a running :3100 dev server
NODE_OPTIONS=--no-deprecation npx next dev --port 3111
```

The admin is Google-SSO only, so there is no password to type. Mint a session the way the E2E suite does — `tests/sessions/editorSession.ts` seeds a user and issues a cookie:

```ts
// in a throwaway spec under tests/e2e/
import { attachEditorSessionToContext } from '../sessions/editorSession'

await attachEditorSessionToContext(context, baseURL!, {
  email: 'fixture-yourname@seqtechllc.com',
  name: 'Your Name',
  sub: 'fixture-yourname-sub',
  role: 'admin',
})
await page.goto('/admin/collections/pages/create')
```

Run it against your port and screenshot whatever you are working on:

```bash
NODE_OPTIONS="--no-deprecation --import=tsx/esm" PAYLOAD_DISABLE_PUSH=true \
  PLAYWRIGHT_BASE_URL=http://localhost:3111 \
  npx playwright test --config=playwright.config.ts tests/e2e/<your-spec>.e2e.spec.ts
```

`PAYLOAD_DISABLE_PUSH=true` matters: without it, the spec's in-process Payload instance races the dev server pushing schema.

**Clean up after yourself** — delete the throwaway spec and the fixture user row before committing.

The screens worth looking at: `/admin` (dashboard grouping), `/admin/collections/pages/create` (the dead hero group, the block picker), `/admin/collections/media` (thumbnails), `/admin/globals/homepage` (block row labels), `/admin/collections/pages` (publish state column).

---

## 2. Regenerate block previews

Needed once during implementation, and again whenever a block's rendered appearance changes materially.

```bash
npm run seed:showcase        # builds 1-2 of every block type as pages docs
npm run visual:capture       # → tests/e2e/visual/screenshots/showcase/ (gitignored)
npx tsx tools/block-thumbnails/index.ts   # → public/block-previews/<blockType>.webp (committed)
```

The tool crops the desktop capture to 3:2, resizes to 480×320, encodes webp, and fails if the committed total exceeds the 400 KB budget. Blocks that render empty in isolation (`hubspot-form`, `hubspot-meetings`, `embed`, `map`, `related-posts`, `post-list`) are skipped by the tool and carry hand-authored SVGs instead — the tool prints which ones it skipped so the list stays honest.

Commit the webp output. It ships to every environment; staging and production have no showcase fixtures and cannot generate it.

---

## 3. Run the gates

```bash
npm run typecheck && npm run lint && npm run format:check
npm run test:int                 # metadata, registry, thumbnail + organizationLd specs
npm run test:e2e                 # full local run — see the note below
```

**Route-adjacent changes need a full local E2E run before push.** CI reseeds a fresh database, so content Pages that exist only in your local mirror 404 there. This feature removes fields and hides globals, which is exactly the class of change that has caused this before (PR #79).

Migrations are authored, never run, locally — local dev is push-managed:

```bash
npm run payload migrate:create spec011_drop_inert_fields
```

Regenerate what the config changes invalidate:

```bash
npm run generate:types
npm run generate:importmap      # required — the block row label is a new client component
```

A stale import map shows up as an editor that mounts blank or a `Cannot find module` in the admin console.

---

## 4. Prove the non-regression obligations

These are merge gates, and two of them cannot be automated.

**Public site unchanged (FR-028)** — capture before and after, compare by eye at both viewports:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3111 npm run visual:capture
```

Actually open the PNGs. A green typecheck is not visual verification.

**Seed pipeline intact (FR-029)** — the content files are gitignored and outside CI, so this is on you:

```bash
IMPORT_TOKEN=<your /admin payload-token> npm run payload:seed ./docs/content-drafts/<file>.json --dry-run
```

Replay every file in the load order from `docs/content-drafts/README.md`. Any file that sets a field this feature removed must be reconciled in the same PR. Keep the token out of the repo — gitleaks blocks it, but do not rely on that.

**Equivalence gate (FR-031)** — must pass before any drop migration is written:

```bash
# (the legacy-equivalence gate was deleted during review — see INFRASTRUCTURE_RUNBOOK.md §2.9)
```

Reports, per record holding legacy prose, whether that prose appears in the composed `layout`. Any failure blocks the migration. Do not read "has 3 blocks" as "has the content" — that is the trap this check exists for.

---

## 5. What "done" looks like

Walk the admin as an editor would, and check the six story outcomes:

1. Nothing you can type into is inert — no Hero group on a Page, no Navigation or Site Settings screens.
2. The block picker shows grouped, visually distinct blocks with descriptions; the four heroes are tellable apart.
3. Every content list shows publish state; every image shows itself.
4. Labels read like English; variant-irrelevant fields are hidden; collapsed blocks name themselves.
5. Creating a page needs a title, nothing else, and opens with a starting structure.
6. The dashboard is grouped by purpose with a line of explanation on each entry.

Then the part CI cannot do: sit with the marketing lead, give them a written brief, and watch them build the page. SC-001 is 20 minutes without help; SC-003 is picking the right block 9 times in 10. Where they stall is the real result — record it, because that is the verification deliverable this spec declared under the constitution's external-verification carve-out.
