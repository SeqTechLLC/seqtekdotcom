# SEQTEK Website — Project History

Shipped roadmap items, moved here from `ROADMAP.md` when they finish. IDs are kept so the code and docs that cite
them still resolve. Detail lives in the PRs.

## Research (R)

- **R-1 – R-6** (2026-05) — Brand research: Hinge's "Visible Experts" studies (R-1), origin-story consulting firms
  (R-2), Oklahoma businesses honouring Native heritage (R-3), B2B trust signals (R-4), Edelman Trust Barometer
  (R-5), a regional competitor audit (R-6). The research is in the private content repo; the decision it fed is
  ADR 0003.

## Design and engineering (D)

- **D-1** (2026-05) — Design tokens: type scale, colour ramps, spacing, radius, shadow, motion (`DESIGN_SYSTEM.md`).
- **D-2** (2026-05) — Block inventory (`BLOCK_LIBRARY.md`).
- **D-4** (2026-05) — `ARCHITECTURE.md` testing and infrastructure-as-code sections.
- **D-5** (2026-05) — SES transactional-email spec. Never built.
- **D-6** (2026-05) — CSP rollout: `/api/csp-report` and the promote-to-enforce checklist (`INTEGRATIONS.md` §8).
- **D-7** (2026-05) — Private media bucket behind CloudFront Origin Access Control.
- **D-8** (2026-05) — Wix-audit-to-Payload field mapping for a migration script since deleted.
- **D-9** (2026-05) — Draft, publish and scheduled-publish permissions (`ARCHITECTURE.md` §6).
- **D-10** (2026-05) — GTM consent bridge design (`INTEGRATIONS.md` §2.2).
- **D-11** (2026-05) — Form submission failure handling (`INTEGRATIONS.md` §1.2).
- **D-12** (2026-05) — Error pages: 404, 500, maintenance, slow request (`ERROR_PAGES.md`).
- **D-13** (2026-05) — Stack spike: Next 16, React 19, Payload 3.84, Postgres and Tailwind v3.4 validated end to
  end.

## Doc fixes (F)

- **F-1 – F-5** (2026-05) — Early corrections: the Amplify reference replaced with CloudFront (F-1), mission,
  vision and values marked resolved (F-2), versions pinned after the spike (F-3), HubSpot meeting hosts added to
  CSP `frame-src` (F-4), WCAG 2.2 citations checked (F-5).

## Branding and narrative (BR)

- **BR-1** (2026-05-20) — Sequoyah heritage carried as a layered narrative (ADR 0003).
- **BR-2** (2026-05-20) — Nunito Sans chosen as the open-source substitute for Avenir.
- **BR-3** (2026-05-20) — Canonical address: 12 N Cheyenne Ave., Tulsa, OK 74103.
- **BR-4** (2026-06-19) — The seven brand-kit values rewritten as public copy and approved. The copy is in the
  private content repo.

## Phase 1 (P1)

- **P1-1** (2026-05) — gitleaks pre-commit hook and a CI secret scan.
- **P1-2** (2026-05) — CI quality job: typecheck, lint, format.
- **P1-3** (2026-05-15) — Next.js, Payload and Tailwind scaffold from the D-13 spike.
- **P1-4** (2026-05-20) — Design tokens in `tailwind.config.mjs` and the `:root` CSS variables.
- **P1-5** (2026-05-20) — Layout shell: skip link, header, footer, and a mobile nav on native `<dialog>`.
- **P1-6** (2026-05-20) — Per-request nonce CSP in `src/proxy.ts`, `/api/csp-report`, static security headers.
- **P1-7** (2026-05-20) — `/api/health` with a database round-trip.
- **P1-8** (2026-05-20) — Nonce-aware GTM and HubSpot bootstrap with the consent default, both env-gated.
- **P1-9** (2026-05-21) — Test pipeline: Vitest, Playwright with axe, Lighthouse CI.
- **D-14** (2026-05-24) — Google Workspace SSO for `/admin`: custom OAuth handlers verifying the ID token with
  `jose`, local strategy disabled (ADR 0002).
- **P1-10** (2026-05-28) — AWS CDK app: network, data, compute, edge and observability stacks. Compute moved to
  Fargate in P5-23.
- **P1-11** (2026-05-28) — Production Dockerfile (tini, non-root user) and the shared `seqtek-website` ECR repo.
- **P1-12** (2026-05-28) — CI/CD over GitHub OIDC: `cdk diff` on infra PRs, deploy on merge.
- **P1-13** (#33, 2026-06-07) — CI path gating: heavy jobs run only when their paths change, and skipped required
  checks still report.

## Phase 2 (P2)

- **P2-1** (#11, 2026-05-30) — Content collections, Lexical inline blocks, the layout block library and
  `RenderBlocks`.
- **P2-2** (#13, 2026-05-30) — Same-origin live preview through `/preview/[collection]/[slug]`, and the preview
  banner.
- **P2-3** (#14, 2026-05-30) — Render-path type guarantees and the public draft-query invariant.
- **P2-4** (#15, 2026-05-30) — Wix audit seed pipeline, since deleted.
- **P2-5** (#16, 2026-05-30) — Access matrix and draft-leak invariants, pinned by tests.
- **P2-6** (#17, 2026-05-31) — Migrations collapsed into one; Postgres 16 → 18 (ADR 0004).
- **P2-7** (#19, 2026-06-01) — S3 media storage, and `enforceDraftWhenScheduled` on every draftable collection with
  `publishedAt`, with an integration test. The cron trigger stays deferred.

## Phase 3 (P3)

- **P3-1** (#21, 2026-06-01) — Public render foundation: cached readers with tag parity (ADR 0005), SEO metadata
  and JSON-LD, the sitemap, error and maintenance pages, the 301 map.
- **P3-2** (#23, 2026-06-02) — The 404 page's dead link fixed; revalidation covers a service changing parent.
- **P3-3** (#47–#51, #54–#60, 2026-06-14) — The warm-paper visual system; `/touchstone-workshops` became
  `/workshops`; the YouTube referrer fix; the quill favicon (#48).

## Phase 5 (P5)

- **P5-1** (2026-06-05) — Launch hardening: green-500 accents replaced by `accent-strong` for text, a zero-violation
  axe sweep over every in-scope route, the 5 s read timeout (ADR 0007), a local performance baseline.
- **P5-2** (#31, 2026-06-06) — One typed dataLayer emitter with `cta_click`, `case_study_view` and the dormant
  `booking_complete` seam. The site originates no CAPI events.
- **P5-3** (#24, #25, 2026-06-02) — HubSpot Forms API engine (retry, timeout, dataLayer events, honeypot), the live
  workshop form, and `/contact`.
- **P5-4** (#26, 2026-06-04) — Consent bridge on HubSpot's `addPrivacyConsentListener` (ADR 0006), footer consent
  controls and `/privacy-policy`. CSP stays report-only by default.
- **P5-5** (#27, 2026-06-05) — Case-study REST importer. Deleted in #107, replaced by `payload-seed`.
- **P5-6** (#43, #44, 2026-06-11) — Media served from CloudFront `/media/<filename>` (ADR 0008), invalidated when a
  media document changes.
- **P5-7** (#46, #52, 2026-06-12) — `NEXT_PUBLIC_*` values passed as Docker build args so client bundles receive
  them; esbuild advisories cleared with scoped overrides.
- **P5-8** (#66, 2026-06-18) — Block-composed pages: two content primitives, every typed collection's body a
  `layout` (ADR 0009).
- **P5-9** (#79, 2026-06-24) — Services restructured into four peer offerings. Superseded by P5-31.
- **P5-10** (#74, #76, 2026-06-23) — The Workshop Inquiry and Contact forms live against their HubSpot GUIDs.
- **P5-11** (#77, 2026-06-24) — A-1: `/admin` admits both Workspace domains, `seqtechllc.com` and `seqtek.com`
  (`src/lib/auth/allowed-domains.ts`).
- **P5-12** (#78, 2026-06-24) — The whole card is the link on every card grid.
- **P5-13** (#72, 2026-06-18) — CI and deploy status posted to Slack through a reusable workflow.
- **P5-14** (#68, 2026-06-17) — Stale-override checker (`tools/check-stale-overrides`) and a weekly report.
- **P5-15** (#80, #82, #83, 2026-06-28) — `tools/payload-seed` upserts any collection or global from JSON, with
  `$ref`, `$file` and `$lexical`; content became gitignored JSON.
- **P5-16** (#84, 2026-07-27) — Ten 404 links in the site chrome repointed or removed.
- **P5-17** (#85, 2026-07-27) — Docs reconciled with the code after the services restructure and block-composed
  pages.
- **P5-18** (#87, 2026-08-08) — "About" retired as a label; the page is `/our-story` and `/about` 301s to it.
- **P5-19** (#90, 2026-08-08) — The organizational maturity assessment retired; its URL 301s to `/workshops`.
- **P5-20** (#88, #91, 2026-08-10) — Differential per-PR audit gate (`tools/audit-diff`) and a daily audit of
  `main`.
- **P5-21** (#98, 2026-08-10) — Merges deploy UAT and releases deploy production. Refined by P5-23 and P5-32.
- **P5-22** (#99, 2026-08-11) — `partners` collection and routes: the metadata-collection reference implementation
  (ADR 0009).
- **P5-23** (#100, #101, #103, 2026-08-18) — ECS Fargate replaced EC2/ASG; the Cognito gate; two lanes, preview and
  ww3, in one env. The staging account was retired 2026-08-14.
- **P5-24** (#105, 2026-08-17) — Wix 301 map repaired, `/feeds` returns 410, the address and `/terms-of-service`
  published.
- **P5-25** (#102, 2026-08-17) — The seeder writes through the ALB gate with `IMPORT_COOKIE`, and fails loudly on a
  sign-in page.
- **P5-26** (#107, 2026-08-25) — Every inert admin control withdrawn (ADR 0010); the site chrome and the
  Organization JSON-LD values moved to `src/lib/site-content.ts`.
- **P5-27** (#117, 2026-08-26) — UI-1: team cards render the job title (`title`), not the one-sentence `role`.
- **P5-28** (#117, 2026-08-26) — UI-2: `src/lib/resolveLayout.ts` fills collection-backed blocks from the cached
  readers before `RenderBlocks`.
- **P5-29** (#117, 2026-08-26) — The seeder's `unpublished` status takes a document down; listing pages stopped
  double-containering their grid.
- **P5-30** (#117, 2026-08-26) — `--draft` preserves `unpublished`. No CI gate runs migrations (open in the ROADMAP).
- **P5-31** (#131, 2026-09-02) — SVC-2: services, their groups and the axis pages became one `services` collection
  with a `tier`; `servicePillars` was absorbed, and every relationship to `services` constrains its tier.
- **P5-32** (#110–#121, 2026-08-27) — A release promotes the image already built for preview; it never builds one.
  The Actions UI promotes by version, SHA or branch.
- **P5-33** (#118, 2026-08-27) — The block picker is categorised, with committed previews (ADR 0011).
- **P5-34** (#120, 2026-08-27) — Media list thumbnails; `_status` is a column on every draftable collection.
- **P5-35** (#123, 2026-08-27) — Every editor-visible field is labelled and described, variant fields hide, and
  fields whose routes don't exist are hidden (INERT-1).
- **P5-36** (#124–#127, 2026-08-29) — INERT-2: `blockOutputContract.int.spec.tsx` fails when a block control
  changes nothing in the output.
- **P5-37** (#129, 2026-08-31) — NAV-1: the services menu opens as a panel on desktop and mobile, click to open,
  no focus trap.
- **P5-38** (#133, 2026-09-02) — The nav split into What We Do and How We Work.
- **P5-39** (#134, 2026-09-02) — Content moved to the private `website-content` repo.
- **P5-40** (#135, 2026-09-02) — Seeder pre-flight and a per-spec summary for unattended runs.
- **P5-41** (#136, 2026-09-03) — `/services` collapsed onto the What We Do axis; the 21 Wix service 301s land
  there directly.
- **P5-42** (#150, 2026-09-09) — Production advisories cleared by a relock; `Users.access.unlock` is admin-only.
- **P5-43** (#158, 2026-09-14) — Admin sidebar groups and a description on every collection.
- **P5-44** (#165, 2026-09-15) — URL paths on Payload's `slugField` (`urlPathField`); a collision is refused by
  name.
- **P5-45** (#166, 2026-09-16) — `specs/` and the speckit machinery retired; the cited contracts moved to
  `docs/contracts/`.
- **P5-46** (#168, 2026-09-17) — Real copy for all 16 `services` documents; SVC-3 moved Localshoring to its service
  page; Cadence joined How We Work.
- **P5-47** (#174, 2026-09-28) — The 45 layout blocks became 13 (ADR 0013), gated by `noCaps.int.spec.ts` and
  `allowedBlocks.int.spec.ts`. The migration history was squashed into one baseline; every database is created
  empty and loaded from the content JSON.
- **P5-48** — C-8 (#35, #36, #42, 2026-06-09) — `tools/ingest-photos`: normalises and catalogues the photo library,
  ingests curated sets, and pushes media over REST.
- **P5-49** — IND-1 (#140, #147, 2026-09-09) — Industries became routed pages: `/industries/[slug]` renders the
  industry's `layout`, a draft industry stays a tag while its URL 404s, and an empty cards block renders nothing.
- **P5-50** (#141, 2026-09-08) — One source of truth for the page shell's width and padding (ADR 0012).
- **P5-51** — K8 (#152, #173, 2026-09-24) — `npm run sweep` (`tools/link-sweep`) crawls every internal link at
  desktop and mobile and reports dead routes, unpainted images, missing alt text, placeholder copy, em dashes and
  redirects; `--fail-on` turns a category into a gate.
- **P5-52** (#167, 2026-09-16) — The header menu is a validated `navigation` collection read by an async
  `SiteHeader` through `getNavigation`, falling back to the `site-content.ts` tree while empty. Footer and legal
  navs stay code-owned (ADR 0010, amendment 2026-09-16).
- **P5-53** (#189, 2026-10-01) — Booking is a Google Calendar appointment page, chosen over HubSpot Meetings on
  2026-08-31. The header, footer, 404 and `/team` link to it as "Book a Call" (`bookACall`, `site-content.ts`).
- **P5-54** (#191, 2026-10-05) — `tools/payload-export` writes a database back out as seeder files and media (ADR 0014).
  A local export, restored into an empty database and exported again, came back identical.
- **P5-55** — CM-2 (#191, 2026-10-05) — The seeder refuses to overwrite a document that changed after the export its file
  came from (`basedOn`), unless `--force` (ADR 0014).
