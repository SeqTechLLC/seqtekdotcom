# Quickstart: GTM Pixel Activation

Three runbooks: (1) verify the dataLayer events locally/CI, (2) build + export the GTM container, (3) run the staging fire-matrix. Cites INTEGRATIONS.md §2.2/§2.3 and `contracts/`.

---

## 1. dataLayer events (local + CI)

The emitters are env-gated-safe: with `NEXT_PUBLIC_GTM_ID` unset (CI/local default per `.env.example`), GTM doesn't load but the pushes still land on `window.dataLayer`, which is what the E2E asserts against.

```bash
# Unit/contract: the shared emitter is SSR-safe and shapes events correctly
npm run test:int -- dataLayer            # if a pure assertion fits in tests/int

# E2E: drive the interaction, assert the push
npm run test:e2e -- datalayer-events     # tests/e2e/datalayer-events.e2e.spec.ts
```

What the E2E asserts (reusing `tests/e2e/helpers/consent.ts` patterns):

- click a primary CTA → exactly one `cta_click` on `window.dataLayer` with `event` + `ctaId`.
- visit `/case-studies/<slug>` → exactly one `case_study_view` with the right `slug`.
- (`booking_complete` is seam-only — no live assertion until the Meetings embed is real.)

Manual sanity check in any browser: open devtools console on a page with a CTA, run `window.dataLayer`, click the CTA, re-read — the new entry appears.

---

## 2. Build + export the GTM container (web UI)

Container `GTM-54KBJ2Z3` (Kenn = admin). Per `infra/gtm/README.md` + `contracts/gtm-activation.md`:

1. **Consent default (G1)** — confirm the container's Consent Mode default is all-denied except `functionality_storage`, "Wait for update" on (belt-and-suspenders to `ConsentDefault.tsx`).
2. **Consent trigger (G2)** — a Custom Event trigger on event name `hubspotConsentUpdate` (exact string).
3. **Live tags (A1)** — add the LinkedIn Insight Tag (`3952964`) and Google Ads conversion tag (`AW-810041431`). On each: set "Require additional consent for tag to fire" = `ad_storage`; trigger = Page View + the `hubspotConsentUpdate` Custom Event.
4. **Meta tags (A2)** — either leave unbuilt, or stage with **no live trigger** and a label "pending per-market landing routes." Do **not** wire the `/…casestudyworkshop` path triggers (routes don't exist).
5. **Export → commit**: Admin → Export Container → save the JSON over `infra/gtm/container.json` → commit (`feat(gtm): activate site-wide consent-gated tags`). This is the first real export; it replaces the `TBD` note in the README.

---

## 3. Staging fire-matrix (the acceptance test — G4 / A3)

On `seqtek-preview.com` with `NEXT_PUBLIC_GTM_ID=GTM-54KBJ2Z3` set, using **GTM Preview/Debug** (Tag Assistant) + the browser **Network** tab:

| Step              | Action                                        | Expected                                                                                                       |
| ----------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Accept all        | click Accept on the HubSpot banner            | LinkedIn + Google Ads tags show **Fired** after the `hubspotConsentUpdate` / consent `update`; analytics fires |
| Deny all          | fresh session, click Deny                     | both ad tags **Not fired**; **no `linkedin`/`googleadservices`/`google-analytics` ad host appears in Network** |
| Customize         | analytics granted, advertising denied         | analytics fires; both ad tags **held** (no `ad_storage` beacon leaves)                                         |
| Returning visitor | revisit with a prior choice (no banner shown) | tags fire/hold per the stored choice via rehydration (006 R3)                                                  |

Capture the result (Tag Assistant screenshots + a Network HAR on Deny) and attach to the verification record. **Meta rows are N/A** until their landing pages exist.

**Pass = SC-001/002/003/007**: zero ad hosts on Deny; 100% of live ad tags fire on Accept; 0% on Customize-ads-off; results recorded.

---

## 4. Docs to reconcile in the same change (constitution III)

- `infra/gtm/README.md` — container ID `TBD` → `GTM-54KBJ2Z3`; add the Meta-deferral + live-scope note.
- `docs/INTEGRATIONS.md §2.3` — record the CAPI decision (US4) + the `booking_complete`/Meta deferral seams.
- On merge: move the relevant ROADMAP item → PROJECT_HISTORY (don't checkbox-flip); leave the Meta/CAPI/booking deferrals as open items pointing at their gating track.
