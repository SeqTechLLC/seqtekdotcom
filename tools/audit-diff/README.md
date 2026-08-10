# audit-diff

The per-PR production audit gate — **differential**, not absolute.

## Why

`npm audit` reads **live** advisory data. The original gate ran
`npm audit --omit=dev --audit-level=high` directly in CI, which answered:

> is the world's advisory state clean right now?

That is not the question a pull request should be gated on. It means an advisory
published overnight against a dependency nobody touched turns **every open PR**
red. That is not hypothetical — three PRs in one week were blocked this way:

| PR  | Advisory that blocked it     | Related to the PR's diff?           |
| --- | ---------------------------- | ----------------------------------- |
| #88 | `next` / `postcss` / `sharp` | no — stale lockfile, in-range fixes |
| #89 | `undici`                     | no — `payload` exact-pins it        |
| #90 | `image-size` / `nanoid`      | no — `image-size` had **no** patch  |

Each fix was legitimate, and each one was unrelated work grafted onto whatever
PR happened to be open. So this tool asks the narrower question:

> does **this diff** introduce a high+ production advisory that the base branch
> does not already have?

Advisories already on the base branch are printed as warnings and allowed
through. They are main's problem — and main's problem is tracked by the daily
`audit-main` job in `.github/workflows/deps-hygiene.yml`, which opens a
`security-audit` tracking issue.

**These two halves are a pair.** PR CI gates the diff; the schedule gates the
repo. Deleting the scheduled job without making this gate absolute again would
let main rot silently with nothing watching.

## Usage

```bash
# differential (the CI gate) — default base is origin/main
node tools/audit-diff/audit-diff.mjs --base "$BASE_SHA"

# absolute reporter — audit this tree, write a report, always exit 0
node tools/audit-diff/audit-diff.mjs --absolute --out-dir "$RUNNER_TEMP"
```

| Flag              | Meaning                                                         |
| ----------------- | --------------------------------------------------------------- |
| `--base <ref>`    | git ref to compare against (default `origin/main`)              |
| `--absolute`      | audit HEAD alone, write a report, exit 0 (reporter, not a gate) |
| `--out-dir <dir>` | write `audit.json` + `audit.md` here (default: no files)        |
| `--json`          | print the machine-readable result to stdout                     |

| Exit | Meaning                                                        |
| ---- | -------------------------------------------------------------- |
| `0`  | no introduced high+ advisories (or `--absolute`)               |
| `1`  | introduced high+ advisories, or fail-closed fallback found any |
| `2`  | the tool itself failed (bad args, npm/registry error)          |

## How

Both sides are resolved and audited in **throwaway temp dirs** seeded with a
`package.json` + `package-lock.json` pair — HEAD's from the working tree, the
base's read straight out of git via `git show`. Nothing reads the local
`node_modules`, so the comparison doesn't drift with whatever is installed.

Advisories are keyed by their **GHSA URL**, not title or range: titles get
reworded and ranges widen as new affected releases are found, and either would
otherwise read as a "new" advisory and fail an innocent PR.

The audit primitives live in `tools/npm-audit/audit.mjs`, shared with
`tools/check-stale-overrides` so the two tools can never disagree about what
counts as an advisory or how a tree is audited.

## Fail-closed

If the base side can't be established — ref missing, shallow clone that never
fetched the base commit, unparseable lockfile — the tool does **not** quietly
pass. It falls back to the absolute gate (any high+ advisory fails) and says
loudly that it did. A gate that silently degrades to "always green" is worse
than no gate at all.

This is why `ci.yml` explicitly fetches the base commit before running it:
`actions/checkout` clones shallow, so `origin/main` is not otherwise present.

## What it does not do

It won't catch an advisory that lands on a dependency already in main — by
design. That is the scheduled job's job. If you want the old behaviour for a
one-off check, run the gate directly:

```bash
npm audit --omit=dev --audit-level=high
```
