# check-stale-overrides

Flags `package.json#overrides` entries that have outlived their reason to exist.

## Why

We add `overrides` to force a transitive dependency to a patched version when a
security advisory trips the production audit gate CI enforces
(`npm audit --omit=dev --audit-level=high`, the `quality` job in
`.github/workflows/ci.yml`). Once the upstream dependency ships its own fix, the
override becomes dead weight — but nothing tells us, so it rots in place. JSON
can't hold comments, so the _reason_ is easy to lose too.

This tool makes the staleness mechanically checkable, and `package.json#_overridesNotes`
holds the human "why / when to remove it" context.

## The definition

> An override is **stale** iff removing it from `package.json` and regenerating
> the lockfile keeps the audit gate clean — nothing it was suppressing comes
> back. It is **load-bearing** when removing it reintroduces a high+ advisory
> (the upstream range still forces a vulnerable version).

Verdicts are judged against a **baseline** (the committed lockfile audited with
every override in place). An override is load-bearing iff removing it introduces
a high+ advisory _not already in the baseline_. So a pre-existing advisory — a
stale lockfile failing CI on its own, say — can't mask an override's own
contribution, and a dirty baseline is itself surfaced as "CI is red right now".

## How it works

Every scenario is resolved and audited in a **throwaway temp directory** seeded
with the (possibly modified) `package.json`, the committed `package-lock.json`,
and `.npmrc`. For the baseline, nothing is removed; for each overridden package,
all of its scopes are dropped, then:

1. `npm install --package-lock-only --ignore-scripts` (preserve relock), then
2. `npm audit --omit=dev --json`, diffed against the baseline.

Isolation buys three things:

- **The real repo is never touched** — pristine by construction, no
  mutate-and-restore dance (confirm with `git status`).
- **Determinism** — a plain `npm install --package-lock-only` _in the repo_ is
  skewed by whatever is currently in `node_modules`; an empty temp dir is not.
- **Fidelity to the real workflow** — drop the override, `npm install`, audit.
  npm preserves an already-satisfied locked version, so a still-vulnerable lock
  is only downgraded when the upstream range no longer admits the safe version.

**Per-package grouping:** a package can be pinned in several scopes (e.g.
`payload > ws` _and_ `happy-dom > ws`). Because npm dedupes to one installed
copy, removing one scope alone leaves the package pinned by the other — so all
scopes of a package are removed together, answering "do we still need to pin
this package at all?" rather than mislabeling each scope individually.

`$`-referenced specs (e.g. `"tsx": "$tsx"`) are workspace version-sync pins, not
security overrides, and are reported as `skipped`, never analyzed.

## Usage

```bash
npm run check:overrides                 # writes report.json + report.md here
node tools/check-stale-overrides/check-stale-overrides.mjs --out-dir /tmp
node tools/check-stale-overrides/check-stale-overrides.mjs --fail-on-stale   # exit 1 if any stale
```

Requires `npm` and registry network access. It does **not** need the repo's
`node_modules` (it resolves in temp dirs), though `package-lock.json` should be
present so the baseline reflects the committed tree.

Outputs into `--out-dir` (default: this directory):

- `report.json` — machine-readable result (consumed by the workflow).
- `report.md` — a GitHub-issue-ready body.

## `_overridesNotes`

A sibling map in `package.json`, keyed by the overridden package name, holding
the removal-trigger context for each override. Advisory IDs are **not**
hand-maintained here — the tool reads them live from `npm audit`. Keep these
honest:

- Add a note when you add an override.
- A note whose package isn't in `overrides` yet (e.g. queued in an unmerged PR)
  is reported as **pending**, not an error — handy for staging an annotation
  ahead of the override landing.
- `_`-prefixed keys (e.g. `_doc`) are documentation and ignored by the checker.

## Automation

`.github/workflows/deps-hygiene.yml` runs this weekly and opens / updates /
closes a single `deps-hygiene`-labelled tracking issue from `report.md`. It is a
**reporter**, not a gate — the per-PR audit gate in `ci.yml` is what blocks
merges. (`schedule` only fires from the default branch, so it stays dormant
until merged to `main`.)
