# Quickstart: Verifying block-composed pages

Per-phase verification recipe and the user-story → test map (Constitution II — every user story ships a load-bearing test). All paths are in-repo code; no external-verification carve-out is claimed.

## US → test map

| Story                                  | Load-bearing path                                                                              | Test (kind)                                                                                                                |
| -------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| US1 — reorder workshop, no deploy (P1) | Workshop `layout` renders via `RenderBlocks`; reorder in admin → public reflects after publish | E2E: edit `layout` order via Local API + publish → assert public DOM order changed; + composeFidelity int test (workshops) |
| US2 — case studies / services / team   | each type's `layout` renders; listing + JSON-LD unchanged                                      | int: composeFidelity per type; E2E: detail renders blocks, listing parity; cache-tag parity int (extended)                 |
| US3 — authoring skill                  | skill emits valid layout or names missing block                                                | int/fixture: run skill prompt against a brief → assert layout uses only registry slugs, or a single gap; manual skill run  |
| US4 — add-a-block code path            | new block → registry + showcase + render                                                       | int: render registry-coverage (incl. `image`,`gallery`); visual: showcase capture                                          |
| US5 — homepage on blocks               | `/` renders via `RenderBlocks`; Organization JSON-LD + analytics intact                        | E2E: homepage renders blocks; int: homepage cache tag + JSON-LD present                                                    |
| US6 — conversion skill                 | skill reproduces an existing page as layout                                                    | int/fixture: convert a known record → assert reproduced content / single gap                                               |

Keystone invariants extended (not weakened): cache-tag parity (`tests/int/lib/payload-cache-tags.int.spec.ts`), access matrix (`tests/int/collections/access.int.spec.ts`, teamMembers now draftable).

## Per-phase recipe

For **every** migrated type, run this gate before merge:

1. **Schema**: `payload migrate` applies the generated `add_layout_<type>` migration cleanly (live + `_v` tables). `npm run generate:types` is clean; `tsc` passes (strict, no `any`).
2. **Content**: run the per-type composer (dry-run first — assert valid JSON-Lines, zero writes), then for real; re-run → assert idempotent (zero net writes). composeFidelity int test green (SC-003/SC-004).
3. **No-deploy proof (SC-002/SC-006)**: on staging, reorder/swap two blocks on a record in admin and publish → public detail reflects the new order with no code change or deploy.
4. **Parity (FR-006/SC-004)**: listing page, JSON-LD, nested URL (`/services/[pillar]/[slug]`), breadcrumb, and 301 redirects unchanged; `npm test` (Vitest) + `npm run test:e2e` green.
5. **Visual (required, Constitution + memory)**: `PLAYWRIGHT_BASE_URL=http://localhost:3100 npm run visual:capture`, then **open the PNGs** for the migrated detail route + its listing at desktop AND mobile and judge legibility/spacing/alignment against the pre-migration render. For any layout complaint, measure boxes (`getBoundingClientRect`) at the viewport — do not reason from classes (DESIGN_SYSTEM §11.4).
6. **Draft/preview**: admin live-preview shows unpublished block edits; public serves only published `layout`.
7. **Expand/contract**: confirm old body fields are hidden/read-only but columns retained (drop deferred to the follow-up `drop_legacy_body_columns` migration after one release).

## Foundation gate (Phase A, before any type)

- `image` + `gallery` blocks: config + render + registry + showcase fixture; `npm run seed:showcase` then visual capture both blocks at both viewports.
- Block-coverage audit (SC-005): document, in BLOCK_LIBRARY.md, that every capability of each retired template maps to ≥1 block (0 capabilities lost).
- `workshops`/`teamMembers` added to `PREVIEW_COLLECTIONS` + `publicPathFor`; cache-tag parity test extended and green.

## Definition of done (whole feature)

- SC-001: zero bespoke per-type render templates remain except Posts.
- SC-005: ≥1 block per retired-template capability.
- SC-007: workshops pilot fully usable before later phases begin; each phase independently shipped.
- Docs reconciled in the same changes: BLOCK_LIBRARY.md (45 blocks + curation loop), DESIGN_SYSTEM §11.4, ARCHITECTURE §2; ROADMAP item moved to PROJECT_HISTORY on ship.
