# Contract: server-read timeout and telemetry

The 5 s budget on content reads in `src/lib/payload.ts`, and the log line a timeout leaves. ADR 0007
records why.

## C-1. `withReadTimeout`

```
withReadTimeout<T>(label: string, fn: (...args) => Promise<T>): (...args) => Promise<T>
```

It is the outermost layer of each exported reader:
`export const getX = withReadTimeout('getX', React.cache(unstable_cache(rawX)))`.

| Condition                     | Behaviour                                                                                                      |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `fn` resolves within 5000 ms  | Its value is returned, the timer is cleared, and nothing is logged.                                            |
| `fn` rejects within 5000 ms   | The original error is rethrown unchanged.                                                                      |
| `fn` still pending at 5000 ms | It rejects with `PayloadReadTimeoutError` and logs C-2. The query is orphaned and runs to its end in the pool. |

- **The budget is `READ_TIMEOUT_MS = 5000`,** enforced with `Promise.race`, not `AbortController`:
  the Local API takes no `AbortSignal`. The timer is cleared in `finally`.
- **Propagation.** A rejection reaches the nearest Next error boundary, which renders the branded
  `error.tsx` with the request id. There is no other error UI.
- **Why the wrapper is outermost.** The `requestId` is read in the wrapper's `catch`, in the RSC
  render scope. Reading `headers()` inside the `unstable_cache` callback throws.

### The `getNavigation` exception

`getNavigation` is awaited from `SiteHeader` in `(frontend)/layout.tsx`, and `error.tsx` does not wrap
the layout above it. So instead of propagating, `getNavigation` catches and falls back to the code-owned
menu in `src/lib/site-content.ts`.

- **Placement.** The catch sits outside `withReadTimeout`, so the budget still fires and C-2 is still
  logged. A catch inside the wrapped function would miss the timeout rejection, which `Promise.race`
  raises in the wrapper.
- **Its own log line.** The catch logs a `nav_fallback` warn for every cause, so a timeout produces
  both lines.
- **Test.** `tests/int/lib/readerFallback.int.spec.ts` pins both halves.

## C-2. Warn-log record

One line per timeout, `console.warn(JSON.stringify(record))`:

```jsonc
{
  "type": "payload_read_timeout",
  "ts": "2026-06-05T17:42:11.003Z", // ISO time of emit
  "requestId": "9f1c…", // x-request-id; "unknown" if absent
  "reader": "getCaseStudyBySlug", // the label passed to withReadTimeout
  "args": "acme-turnaround", // optional
}
```

`requestId` is the id `proxy.ts` sets on the response, so the log line matches the id a visitor sees on
`error.tsx`.

## C-3. Health probe

`/api/health` (`src/app/(payload)/api/health/route.ts`) runs its own DB ping and imports none of the
readers, so a slow content query never fails the health check and cycles tasks.

`tests/int/lib/read-timeout.int.spec.ts` and `tests/e2e/slow-request.e2e.spec.ts` cover the timeout, the
log line and the health exemption.
