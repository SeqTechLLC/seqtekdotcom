# Known CSP violations catalogue

The triage list for CSP violation reports arriving at `/api/csp-report`. On-call
diffs incoming reports against this catalogue: an entry that is **present** here
is expected noise; an entry that is **absent** and crosses the alarm threshold
(>100 violations/hour/directive — INTEGRATIONS.md §8 / FR-012) is a regression
to investigate.

This file is a **promote-to-enforce gate input** (csp.md P5 / INTEGRATIONS.md
§8): it must be current before production flips `CSP_MODE=enforce`. Keep it
updated as the staging report-only soak surfaces real entries — the seed rows
below are the expected categories, not an exhaustive list.

## Schema (data-model §6)

| Field         | Meaning                                                                    |
| ------------- | -------------------------------------------------------------------------- |
| `directive`   | the violated directive (e.g. `style-src`, `script-src`, `img-src`)         |
| `blocked-uri` | the blocked URI or a pattern (e.g. `inline`, `chrome-extension://…`, host) |
| `source`      | what produces it (browser extension, a specific third party, dev tooling)  |
| `status`      | `expected` · `accepted-with-note` · `action-required`                      |
| `first-seen`  | date the entry was first catalogued                                        |
| `note`        | why it is benign, or what action is required                               |

## Catalogue

| directive    | blocked-uri                        | source                               | status            | first-seen | note                                                                                                                                                                                                                                                              |
| ------------ | ---------------------------------- | ------------------------------------ | ----------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `style-src`  | `inline`                           | Browser extensions (Grammarly, etc.) | `expected`        | 2026-06-03 | Extensions inject inline styles into the page DOM. Browser-side, not our code. Cannot be allowlisted; ignore.                                                                                                                                                     |
| `style-src`  | `inline` / `eval`                  | Next.js dev mode (HMR overlay)       | `expected`        | 2026-06-03 | Dev-only. Production builds ship external CSS only. Will not appear from a prod build — present only on local/dev report-only.                                                                                                                                    |
| `script-src` | `chrome-extension://…`             | Browser extensions                   | `expected`        | 2026-06-03 | Password managers / ad blockers inject scripts. Browser-side; not blockable by our policy beyond what `strict-dynamic` already allows.                                                                                                                            |
| `img-src`    | `chrome-extension://…`             | Browser extensions                   | `expected`        | 2026-06-03 | Extension-injected images. Ignore.                                                                                                                                                                                                                                |
| `style-src`  | `inline` (from `js.hs-banner.com`) | HubSpot consent banner               | `action-required` | TBD        | **The soak's #1 target (csp.md P4 / research R6).** If the live banner injects inline styles under enforcing `style-src 'self'`, relax public `style-src` to include `'unsafe-inline'` in `src/lib/csp.ts` and re-soak. Confirm or clear during the staging soak. |

## How an entry graduates the gate

1. Appears in the staging report-only stream.
2. Triaged: is it a third party we accept, browser noise, or our own
   regression? Add the row with the correct `status`.
3. If `action-required` (e.g. the HubSpot banner style-src case), make the code
   change (the single-line `style-src` relax) and re-soak that directive.
4. Once no `action-required` rows remain and no NEW directive has appeared in
   the trailing 3 days, the catalogue is "current" for the enforce cutover.
