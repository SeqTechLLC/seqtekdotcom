import { render } from '@testing-library/react'
import type { Block, Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { registry } from '../../../src/components/sections/registry'
import { layoutBlocks } from '../../../src/payload/blocks/layout'
import { readOutputContract } from '../../../src/payload/blocks/outputContract'
import { flattenBlock } from '../helpers/flattenFields'
import { selectOptions, synthesizeBlock } from '../helpers/synthesizeBlock'

/**
 * ROADMAP INERT-2 — the block output contract.
 *
 * PR #123 wrote a plain-language description for every field in the admin.
 * Writing "this field does X" means checking that the renderer actually does
 * X, and that turned up a class of defect nobody had catalogued: controls the
 * renderer reads and ignores, options that render nothing, and blocks that
 * publish developer placeholder text on a real page. Three review rounds each
 * found more of them BY READING, because nothing in CI checked what a block
 * renders.
 *
 * This is that check. Blocks are pure synchronous presentational components by
 * design (ADR 0009), so every one of them can be rendered here for the price
 * of a unit test, and the whole set is driven off `layoutBlocks` — a block
 * added later is covered the moment it is registered.
 *
 * Three promises:
 *
 *   1. No placeholder text ever reaches a reader. Absolute, no exceptions.
 *   2. Every control moves the output. Exceptions are declared ON THE BLOCK
 *      (`src/payload/blocks/outputContract.ts`) and each one is a defect,
 *      a resolver hand-off, or a runtime behaviour — never a shrug.
 *   3. Every option of a select renders something, and something different
 *      from its siblings. An option that draws nothing is a trap: the editor
 *      picks it and the section vanishes.
 *
 * The test works by DIFFERENCE rather than by looking for a sentinel string.
 * A sentinel cannot see `limit` (a cap that is never printed) or a value that
 * only reaches an attribute; "change one control, the HTML must move" sees
 * both, and is what actually distinguishes a wired control from a dead one.
 */

/**
 * Developer copy that has been published as body text at some point in this
 * repo's history, plus the generic words that introduce it.
 *
 * Checked against `textContent`, not HTML: `placeholder` is a legitimate input
 * attribute, and banning it in markup would forbid a working form.
 */
const BANNED = [
  'loads in production',
  'No manual items',
  'Configure a HubSpot',
  'resolves at template time',
  'placeholder',
  'TODO',
]

/** Blocks whose `source`/`filter` is resolved by `src/lib/resolveLayout.ts`. */
const RESOLVED_BLOCKS = new Set(['team-grid', 'post-list', 'case-study-grid', 'service-cards'])

const isContainerType = (field: Field): boolean =>
  field.type === 'group' || field.type === 'array' || field.type === 'row'

/**
 * Payload's sanitizer adds `blockName` (the admin's own label for a row) and
 * `id` to every block config, in place, on the shared config objects. Whether
 * this walk sees them therefore depends on whether some earlier spec in the
 * same Vitest process built a Payload config — left in, this file passes alone
 * and fails in the full suite, exactly as `flattenFields.ts` warns about
 * `sessions`. Neither is authored in `src/`, and neither is meant to render.
 */
const PAYLOAD_OWNED = new Set(['blockName', 'id'])

/** Every leaf control an editor can actually set on this block. */
function leafFields(block: Block): Array<{ path: string; field: Field }> {
  return flattenBlock(block)
    .filter((f) => !f.hidden && !isContainerType(f.field) && !PAYLOAD_OWNED.has(f.path))
    .map((f) => ({ path: f.path, field: f.field }))
}

function renderBlock(block: Block, data: Record<string, unknown>): HTMLElement {
  const Component = registry[block.slug]
  if (!Component) throw new Error(`no registered component for block "${block.slug}"`)
  const { container } = render(<Component {...data} />)
  return container
}

const html = (block: Block, data: Record<string, unknown>): string =>
  renderBlock(block, data).innerHTML
const text = (block: Block, data: Record<string, unknown>): string =>
  renderBlock(block, data).textContent ?? ''

describe.each(layoutBlocks.map((b) => [b.slug, b] as const))(
  'block output contract: %s',
  (slug, block) => {
    const contract = readOutputContract(block.custom)
    const inertFields = new Set(contract.inert?.fields ?? [])
    const inertOptions = contract.inert?.options ?? {}
    const upstream = new Set(contract.resolvedUpstream ?? [])
    const behavioural = new Set(Object.keys(contract.behavioural ?? {}))
    const leaves = leafFields(block)

    // ---- 1. No placeholder text reaches a reader. No allowlist. -------------

    it.each([
      ['fully authored', {}],
      // The state an author reaches by saving the moment Payload lets them —
      // which is exactly where the placeholder branches lived.
      ['required fields only', { requiredOnly: true }],
    ])('publishes no developer copy (%s)', (_label, options) => {
      const rendered = text(block, synthesizeBlock(block, options))
      for (const banned of BANNED) {
        expect(
          rendered.toLowerCase().includes(banned.toLowerCase()),
          `"${slug}" renders the banned phrase "${banned}" as body text — that is developer copy on a public page`,
        ).toBe(false)
      }
    })

    // ---- 2. Every control moves the output. --------------------------------

    const perturbable = leaves.filter(
      ({ path, field }) => field.type !== 'select' && !upstream.has(path) && !behavioural.has(path),
    )

    /**
     * A control is often only drawn under one setting of a sibling select: a
     * hero's image needs `variant: with-image`, a CTA section's background
     * image needs `background: image`. Comparing under the baseline alone
     * would call both of those inert, so each perturbation is retried under
     * every single-select variation of the block. One state where the control
     * moves the output is enough — the question is whether the control is
     * wired at all, not whether it is wired in every combination.
     */
    const states: Array<Record<string, unknown>> = [{}]
    for (const { path, field } of leaves) {
      if (field.type !== 'select') continue
      for (const option of selectOptions(field).slice(1)) states.push({ [path]: option })
    }

    if (perturbable.length > 0) {
      it.each(perturbable.map(({ path }) => path))(
        'the `%s` control changes what renders',
        (path) => {
          const moved = states.some((overrides) => {
            const before = html(block, synthesizeBlock(block, { overrides }))
            const after = html(block, synthesizeBlock(block, { overrides, perturb: [path] }))
            return before !== after
          })

          if (inertFields.has(path)) {
            expect(
              moved,
              `"${slug}.${path}" is declared inert but now changes the output — delete it from the block's outputContract`,
            ).toBe(false)
            return
          }
          expect(
            moved,
            `"${slug}.${path}" is offered in the admin but changing it renders exactly the same HTML. Wire it, remove it, or declare why in the block's outputContract.`,
          ).toBe(true)
        },
      )
    }

    // ---- 3. Every option of a select renders, and renders differently. ------

    const selects = leaves.filter(
      ({ path, field }) => field.type === 'select' && !upstream.has(path) && !behavioural.has(path),
    )

    if (selects.length > 0) {
      it.each(selects.map(({ path, field }) => [path, field] as const))(
        'every option of `%s` draws something, and something distinct',
        (path, field) => {
          const declaredInert = new Set(inertOptions[path] ?? [])
          const options = selectOptions(field)
          const byOption = new Map<string, string>()

          for (const option of options) {
            const rendered = html(block, synthesizeBlock(block, { overrides: { [path]: option } }))
            if (!declaredInert.has(option)) {
              expect(
                rendered.trim().length,
                `"${slug}.${path}" option "${option}" renders nothing at all — an editor who picks it loses the section`,
              ).toBeGreaterThan(0)
            }
            byOption.set(option, rendered)
          }

          // A declared-inert option is understood to be a duplicate of a live
          // one, so it is not itself evidence that the live option is a lie —
          // otherwise declaring two of three identical options would leave the
          // third failing and the set undeclarable.
          const live = options.filter((o) => !declaredInert.has(o))

          for (const option of live) {
            const twin = live.find((o) => o !== option && byOption.get(o) === byOption.get(option))
            expect(
              twin,
              `"${slug}.${path}" options "${option}" and "${twin}" render identical HTML, so one of them is a lie in the picker`,
            ).toBeUndefined()
          }

          for (const option of declaredInert) {
            const stillDead =
              byOption.get(option)?.trim() === '' ||
              live.some((o) => byOption.get(o) === byOption.get(option))
            expect(
              stillDead,
              `"${slug}.${path}" option "${option}" is declared inert but now renders on its own — delete it from the block's outputContract`,
            ).toBe(true)
          }
        },
      )
    }

    // ---- 4. The declarations themselves cannot rot. ------------------------

    it('declares only controls it actually has', () => {
      const known = new Set(leaves.map((l) => l.path))
      const declared = [...inertFields, ...Object.keys(inertOptions), ...upstream, ...behavioural]
      for (const path of declared) {
        expect(
          known.has(path),
          `"${slug}" declares an output contract for "${path}", which is not a field on the block`,
        ).toBe(true)
      }
      if (contract.inert) {
        expect(
          contract.inert.why,
          `"${slug}" declares inert controls without saying why`,
        ).toBeTruthy()
      }
      for (const path of upstream) {
        expect(
          RESOLVED_BLOCKS.has(slug),
          `"${slug}.${path}" claims to be resolved upstream, but src/lib/resolveLayout.ts has no resolver for this block`,
        ).toBe(true)
      }
    })
  },
)
