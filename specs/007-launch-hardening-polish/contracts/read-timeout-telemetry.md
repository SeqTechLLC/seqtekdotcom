# Contract: Server-Read Timeout + Telemetry (US3)

The interface 007 adds to the server-read path. Consumers: the Next.js error boundary (`error.tsx`), and log aggregation (CloudWatch). Authoritative for FR-011…FR-014 and SC-005/SC-006.

## C-1. `withReadTimeout` wrapper behavior

```
withReadTimeout<T>(label: string, fn: (...args) => Promise<T>): (...args) => Promise<T>
```

Applied as the **outermost** layer of each exported reader in `src/lib/payload.ts`:
`export const getX = withReadTimeout('getX', React.cache(unstable_cache(rawX)))`.

| Condition                    | Behavior                                                                                                                                                                   |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fn` resolves in < 5000ms    | resolve with its value; `clearTimeout`; **no** log, **no** added behavior (FR-013)                                                                                         |
| `fn` rejects in < 5000ms     | re-throw the original error unchanged (existing error semantics preserved)                                                                                                 |
| `fn` still pending at 5000ms | `Promise.race` rejects with `PayloadReadTimeoutError`; emit the warn log (C-2); the losing query is orphaned (runs to completion/error in the pool, response thread freed) |

- **Budget**: `READ_TIMEOUT_MS = 5000` (module constant). Edge: a timeout firing mid-stream after a partial render still resolves to a coherent `error.tsx`, never a half-painted page (spec Edge Cases).
- **Mechanism**: `Promise.race([fn(...args), timer])` — **not** `AbortController` (Payload Local API takes no `AbortSignal`; ERROR_PAGES §5 prescribes `Promise.race`). The timer is always cleared in `finally`.
- **Propagation**: `PayloadReadTimeoutError extends Error`. Thrown out of the reader → nearest Next error boundary → renders the branded `error.tsx` (which already surfaces `x-request-id`). **No new error UI.**
- **`headers()` placement (load-bearing)**: the `requestId` read happens in the wrapper's `catch`, which runs in the RSC render scope — legal. It MUST NOT be read inside the `unstable_cache` callback (throws). This is why the wrapper is outermost, not at the raw read.

## C-2. Warn-log record (the telemetry contract)

Exactly one stdout line per timeout, via `console.warn(JSON.stringify(record))`:

```jsonc
{
  "type": "payload_read_timeout", // literal discriminator
  "ts": "2026-06-05T17:42:11.003Z", // new Date().toISOString() at emit
  "requestId": "9f1c…", // headers().get('x-request-id'); "unknown" if absent
  "reader": "getCaseStudyBySlug", // the label passed to withReadTimeout
  "args": "acme-turnaround", // optional; the slug/params for triage
}
```

- Level: **warn** (FR-012). Matches the existing structured-log convention (`health_check_failed`, `csp_violation`).
- `requestId` MUST be the same id `proxy.ts` set on the response header/cookie, so the log correlates to the id the visitor sees on `error.tsx` (SC-005).

## C-3. Health-probe exemption (FR-014)

- `/api/health` MUST NOT route through the content readers and therefore MUST NOT be subject to the timeout-to-error path. This holds **by construction** today: `src/app/(payload)/api/health/route.ts` runs its own DB ping and imports none of the `payload.ts` readers.
- **Verification**: a test/assertion that the health route does not import the guarded readers (grep-level is sufficient), so a slow content query never cycles instances.

## C-4. Acceptance (maps to SC-005 / SC-006)

1. Inject a > 5s delay into a reader call → the request renders `error.tsx` within ~5s (not a hang). ✅ when the E2E observes the branded page + a non-hanging response.
2. The same run emits a `payload_read_timeout` warn log whose `requestId` equals the response's `x-request-id`. ✅
3. A healthy read (< 5s) → unchanged behavior and no measurable latency delta vs pre-change. ✅ (SC-006)
4. `/api/health` returns 200 while a content reader is timing out elsewhere. ✅ (FR-014)
