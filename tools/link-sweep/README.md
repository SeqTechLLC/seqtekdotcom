# link-sweep

ROADMAP **K8** — the broken-link and broken-image sweep. "Everything has to go
somewhere" is the number-one soft-launch requirement, and until this existed it
was an opinion rather than a number.

## Run it

```bash
npm run sweep                                          # localhost:3100
npm run sweep -- --base-url=https://preview.seqtek.com # a lane
npm run sweep -- --json=/tmp/sweep.json --external      # full report + external links
```

A Cognito-gated lane needs the ALB session, taken from your own browser
(DevTools → Application → Cookies) — both halves, or the ALB 302s you to the
IdP and every route "returns 200" as a Google sign-in page:

```bash
SWEEP_COOKIE='AWSELBAuthSessionCookie-0=…; AWSELBAuthSessionCookie-1=…' \
  npm run sweep -- --base-url=https://preview.seqtek.com
```

`--help` for the rest.

## What it checks

| Category       | What counts as a finding                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------- |
| `links`        | An internal route that does not return 200. Reported with the pages linking it                     |
| `images`       | An `<img>` that is laid out but never painted (`naturalWidth === 0`)                               |
| `placeholders` | Placeholder copy or repo-internal references in rendered text                                      |
| `alt`          | An `<img>` with no `alt` attribute at all                                                          |
| `external`     | An outbound link that is **gone** — 404, 410, 5xx, or no connection at all. Only with `--external` |

## Why a browser

A fetch loop cannot do two of these. An `<img>` whose `src` 404s still parses
and still appears in the DOM, so the only honest "did this paint" signal is
`naturalWidth` after load. And a link rendered by a client component is not in
the initial HTML at all. The crawl runs at **desktop and mobile** because
`srcset` picks a different file per viewport and responsive utilities hide whole
blocks — an image can be fine at one width and broken at the other, and the
report says which.

## Why it also reads the sitemap

The frontier is seeded from `/` **and** `/sitemap.xml`. Following links alone
would never reach a published document that nothing links to, and an orphan is
exactly the kind of thing this is meant to surface. Anything reached only via
the sitemap is reported as `orphan (sitemap only)` when it fails.

## Placeholder detection has two halves

`src/payload/seed/skeletons/placeholderCopy.ts` is the shared list of strings a
**skeleton** `defaultValue` can put on a page.
`tests/int/render/noPlaceholderCopy.int.spec.ts` asserts that every skeleton's
strings are enumerated there; this tool greps rendered HTML for them. The source
guard cannot see a document that was published without the skeleton being
overwritten — only the sweep can.

The second half is `GENERIC_PLACEHOLDER_PATTERNS` in `checks.ts`, for
placeholder copy that came from a **seed** rather than a skeleton. That is not
hypothetical: on 2026-09-09 all fifteen `/services/*` routes were serving
`PLACEHOLDER COPY — NOT FOR PUBLICATION` in visible body text, and nothing in
the repo could see it, because seeded bodies are content and content is not in
git.

`INTERNAL_REFERENCE_PATTERNS` catches the related failure the same sweep found:
our own planning vocabulary addressed to a visitor — `CONTENT_NEEDS.md`, `§12`,
"Brent's nine services". Different in kind from unfinished copy, so it is
reported under its own labels. `§` and a bare `*.md` filename do not occur in
marketing prose, which is why these can run without a suppression list.

## What it does not check

**Text is read from `<main>` only** (falling back to `<body>`), while links and
images are read from the whole document. Chrome repeats on every route, so
scanning it would turn one nav typo into sixty findings — but placeholder copy
in the header or footer is therefore invisible here. That half is covered by
`tests/int/render/noPlaceholderCopy.int.spec.ts`, since `site-content.ts` is
code-owned.

**External links are skipped unless you pass `--external`.** The report says so
explicitly rather than printing a tick — a check that did not run must never
look like a check that passed. `--fail-on=external` without `--external` is
rejected for the same reason.

**A robot cannot verify a social link.** Outbound requests carry a browser
user-agent, because a bare client gets `999` from LinkedIn. Even so, statuses
that mean _the server refused this client_ rather than _the page is gone_ —
401, 403, 429, LinkedIn's 999 — are reported under their own "could not be
verified" heading and never counted toward `external`, so they cannot fail a
build. Measured on the real lane: `linkedin.com/company/seqtek` answers 999
bare and 200 with a browser UA; `facebook.com/seqtek/` answers 400 to one
user-agent and 200 to another. Both work in a browser. A checker that called
them broken would be teaching you to skim the one list that has to stay
trustworthy.

## Exit code

0 unless `--fail-on` names a category with findings:

```bash
npm run sweep -- --fail-on=links,images   # or --fail-on=all
```

So the default run is a report you read, and turning it into a CI gate later is
a flag rather than a rewrite. Do not gate on `placeholders` until the copy work
is done — it would be red on purpose, every run, and a gate nobody can make
green gets ignored.
