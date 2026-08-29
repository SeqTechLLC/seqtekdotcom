/**
 * ROADMAP INERT-2 — what a block promises to do with the controls it offers.
 *
 * `tests/int/blocks/blockOutputContract.int.spec.tsx` renders every block from
 * its own field config and requires each control to move the rendered output.
 * A control that does not is one of three things, and the difference matters,
 * so each has its own name here rather than one shared allowlist:
 *
 *   - `resolvedUpstream` — read by `src/lib/resolveLayout.ts` before the block
 *     reaches a component. Correct by design (ADR 0009 keeps blocks pure and
 *     synchronous); a component-level render simply cannot observe it.
 *   - `behavioural` — read by the component, but at interaction time rather
 *     than paint time: a form's submit target, an asset delivered on success.
 *     Correct by design; the value names where it IS consumed.
 *   - `inert` — read by nothing. Each entry is a live defect and a promise the
 *     admin makes to an editor that the site does not keep. Delete the entry
 *     as part of fixing it; the gate fails on a stale one, so the list cannot
 *     rot the way the ROADMAP prose list did.
 *
 * The declaration lives on the block rather than in a central file so that the
 * failure message names the block, and so two people fixing two blocks never
 * edit the same file.
 *
 * `Block['custom']` is server-only, so none of this reaches the client bundle
 * or the generated schema.
 */
export interface BlockOutputContract {
  /** Field names consumed by `resolveLayout` before render. */
  resolvedUpstream?: string[]
  /** Field name → where the component consumes it, if not in the paint. */
  behavioural?: Record<string, string>
  /** Controls that reach nothing. A defect, with the reason it still exists. */
  inert?: {
    /** Dotted paths, e.g. `primaryCta.variant`. */
    fields?: string[]
    /** Field path → option values that render identically to another option. */
    options?: Record<string, string[]>
    /** Why it is still here, and where the fix is tracked. */
    why: string
  }
}

/** Sugar so a block writes `custom: outputContract({ ... })`. */
export const outputContract = (
  contract: BlockOutputContract,
): { outputContract: BlockOutputContract } => ({
  outputContract: contract,
})

/** Reads the declaration off a block config, if it has one. */
export const readOutputContract = (custom: unknown): BlockOutputContract => {
  if (typeof custom !== 'object' || custom === null) return {}
  const declared = (custom as { outputContract?: BlockOutputContract }).outputContract
  return declared ?? {}
}
