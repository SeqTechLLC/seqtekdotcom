import { expect, test, type Page } from '@playwright/test'
import { getPayload, type Payload } from 'payload'

import config from '../../../src/payload.config'
import type { Page as PageDoc } from '../../../src/payload-types'
import { layoutBlocks } from '../../../src/payload/blocks/layout'
import { useAdminSession, type AdminSession } from '../helpers/adminSession'

/**
 * Spec 011 US4 / T045 — contracts/admin-metadata.md C4 clause (3), FR-020.
 *
 * "Much of the perceived emptiness is fields belonging to variants the editor
 * didn't choose, shown unconditionally" (spec.md US4).
 * `adminMetadata.int.spec.ts` can prove a field DECLARES `admin.condition`;
 * only the browser proves Payload acts on it, which is the half that actually
 * failed: `logo-bar.logos` carried a conditional validator whose `admin` was
 * overwritten by a sibling key, so it validated conditionally and displayed
 * unconditionally for two specs.
 *
 * **The expectations are computed from the config, not typed out.** Each
 * block's own `condition` predicate is evaluated here, in this process, against
 * the sibling data an option produces, and the DOM is asserted to match. A
 * conditional field added later is covered the moment it is declared, and a
 * select whose options change nothing is skipped rather than driven.
 *
 * **One seeded row per case, asserted in a single page load.** `passesCondition`
 * is computed server-side in `fieldSchemasToFormState` — the client's
 * `WatchCondition` only reads it — so every option change through the UI costs a
 * `form-state` round trip, and a sequence of them races: a reply built before
 * the last change lands after it and resets the control. Seeding the values
 * asks the same question of the same code with none of that. The live path is
 * still covered, once, by the last test in this file.
 */

let session: AdminSession
let payload: Payload
let pageId: number | string

test.use({ viewport: { width: 1400, height: 1200 } })

// Each test loads the same 24-block-row edit view, which is the heaviest page
// in the admin. The default 30s local budget (playwright.config.ts) is tight
// against a cold dev server; CI already allows 120s.
test.describe.configure({ timeout: 90_000 })

const FIXTURE_SLUG = 'us4-variant-fields'

type Sibling = Record<string, unknown>

interface AnyField {
  name?: string
  type?: string
  defaultValue?: unknown
  options?: Array<{ label: string; value: string } | string>
  admin?: { condition?: (data: unknown, siblingData: unknown) => boolean }
}

interface VariantCase {
  blockSlug: string
  /** The select being varied, and the option this case sets it to. */
  selectName: string
  optionValue: string
  optionLabel: string
  /** Conditional field names that must render for this option. */
  visible: string[]
  /** Conditional field names that must NOT render for this option. */
  hidden: string[]
  /** Row index of this case in the seeded fixture page. */
  row: number
}

const optionValue = (option: NonNullable<AnyField['options']>[number]): string =>
  typeof option === 'string' ? option : option.value

const optionLabel = (option: NonNullable<AnyField['options']>[number]): string =>
  typeof option === 'string' ? option : option.label

/** Every field's default: the sibling data a freshly added block starts with. */
function defaultsOf(fields: AnyField[]): Sibling {
  const data: Sibling = {}
  for (const field of fields) {
    if (field.name && field.defaultValue !== undefined) data[field.name] = field.defaultValue
  }
  return data
}

function casesFor(slug: string, fields: AnyField[]): Omit<VariantCase, 'row'>[] {
  const conditional = fields.filter((f) => f.name && f.admin?.condition)
  if (conditional.length === 0) return []

  const defaults = defaultsOf(fields)
  const cases: Omit<VariantCase, 'row'>[] = []

  for (const select of fields) {
    if (select.type !== 'select' || !select.name || !select.options) continue
    const perOption = select.options.map((option) => {
      const siblingData = { ...defaults, [select.name as string]: optionValue(option) }
      const visible: string[] = []
      const hidden: string[] = []
      for (const field of conditional) {
        const shows = field.admin?.condition?.(siblingData, siblingData) ?? true
        ;(shows ? visible : hidden).push(field.name as string)
      }
      return { option, visible, hidden }
    })

    // A select whose options make no difference to any condition is not a
    // variant control; driving it would assert nothing.
    if (new Set(perOption.map((p) => p.visible.join(','))).size < 2) continue

    for (const { option, visible, hidden } of perOption) {
      cases.push({
        blockSlug: slug,
        selectName: select.name,
        optionValue: optionValue(option),
        optionLabel: optionLabel(option),
        visible,
        hidden,
      })
    }
  }
  return cases
}

/** Enough of a row for the edit view to draw the block's fields. */
const SEED_ROWS: Record<string, Record<string, unknown>> = {
  hero: { headline: 'Variant fixture hero' },
  'cta-section': { headline: 'Variant fixture CTA' },
}

const CASES: VariantCase[] = layoutBlocks
  .flatMap((block) => casesFor(block.slug, block.fields as AnyField[]))
  .map((c, row) => ({ ...c, row }))

/**
 * Every field type puts `id="field-<path with dots as __>"` on the element it
 * renders — the wrapper for `array`, `select` and `upload`, the input itself
 * for `text`. The label is not usable for this: an `array` heads itself with an
 * `<h3>`, not a `<label>`, and `relationship` and the scalar fields disagree
 * about whether the form uuid is appended to `for`.
 */
const fieldControl = (page: Page, row: number, name: string) =>
  page.locator(`#field-layout__${row}__${name}`)

test.describe('variant-only fields are hidden, not shown blank', () => {
  test.beforeAll(async ({ browser, baseURL }) => {
    payload = await getPayload({ config: await config })
    await payload.delete({
      collection: 'pages',
      where: { slug: { equals: FIXTURE_SLUG } },
      overrideAccess: true,
    })

    const fixturePage = await payload.create({
      collection: 'pages',
      data: {
        title: 'US4 variant fields fixture',
        slug: FIXTURE_SLUG,
        _status: 'draft',
        // One row per case, in `CASES` order, so a case's row index is its
        // position here. The union of 45 block types cannot be satisfied by a
        // computed literal; `payload.create` checks the shape at runtime.
        layout: CASES.map((c) => ({
          blockType: c.blockSlug,
          ...(SEED_ROWS[c.blockSlug] ?? {}),
          [c.selectName]: c.optionValue,
        })) as PageDoc['layout'],
      },
      // A draft, so Payload skips required-field validation: half of these
      // blocks require an upload or a relationship this fixture has no reason
      // to create, and a conditional field is required precisely for the
      // option a neighbouring row selects.
      draft: true,
      overrideAccess: true,
    })
    pageId = fixturePage.id

    const context = await browser.newContext()
    session = await useAdminSession(context, baseURL!, 'variant-fields')
    await context.close()
  })

  test.afterAll(async () => {
    if (payload) {
      await payload.delete({
        collection: 'pages',
        where: { slug: { equals: FIXTURE_SLUG } },
        overrideAccess: true,
      })
    }
    await session?.dispose()
  })

  // Attach the session minted in `beforeAll` rather than re-seeding: seeding
  // deletes and recreates the fixture user, so each test would run as a
  // different user id.
  test.beforeEach(async ({ context }) => {
    await session.attachTo(context)
  })

  test('there are conditional fields to check', () => {
    // Without this the suite below would pass by testing nothing if a refactor
    // dropped every `admin.condition` in the config.
    expect(new Set(CASES.map((c) => c.blockSlug)).size).toBeGreaterThan(3)
    expect(CASES.length).toBeGreaterThan(10)
    expect(CASES.some((c) => c.hidden.length > 0)).toBe(true)
  })

  test('each selection draws its own fields and no others', async ({ page }) => {
    await page.goto(`/admin/collections/pages/${pageId}`)
    await expect(page.locator('#field-layout')).toBeVisible({ timeout: 25_000 })

    for (const variant of CASES) {
      const where = `${variant.blockSlug} / ${variant.selectName}: "${variant.optionLabel}"`

      // Payload does not render a block row's fields until the row is in the
      // viewport, so on a page this long everything below the fold is absent
      // rather than hidden — which reads exactly like a failing condition.
      await page.locator('.blocks-field__row').nth(variant.row).scrollIntoViewIfNeeded()

      // Anchor first. Eight of these cases expect nothing to be visible, so
      // their only assertions are absences — and an absence passes just as
      // well against a row Payload has not rendered yet. The select being
      // varied is always present, so it proves the row is really on screen.
      await expect(
        fieldControl(page, variant.row, variant.selectName),
        `${where}: the row itself did not render`,
      ).toBeVisible()

      // The visible half matters as much as the hidden half: without it a
      // locator-convention change would leave every absence assertion passing
      // against a page that renders nothing at all.
      for (const name of variant.visible) {
        await expect(
          fieldControl(page, variant.row, name),
          `${where} should show ${name}`,
        ).toBeVisible()
      }
      for (const name of variant.hidden) {
        await expect(
          fieldControl(page, variant.row, name),
          `${where} should hide ${name}`,
        ).toHaveCount(0)
      }
    }
  })

  test('a collapsed block row names itself by its content', async ({ page }) => {
    // FR-021. `adminMetadata.int.spec.ts` proves the Label component is
    // DECLARED with the right name; only the browser proves it renders, and
    // BlockRowLabel re-creates Payload's own header markup, so a class rename
    // upstream would degrade all 45 rows with a green suite.
    const heroCase = CASES.find((c) => c.blockSlug === 'hero')
    expect(heroCase, 'the hero fixture row moved').toBeDefined()

    await page.goto(`/admin/collections/pages/${pageId}`)
    await expect(page.locator('#field-layout')).toBeVisible({ timeout: 25_000 })

    const header = page.locator('.blocks-field__block-header').nth(heroCase!.row)
    await header.scrollIntoViewIfNeeded()
    // Derived from the same row index, so registering a block ahead of `hero`
    // moves both together instead of turning this into a confusing false red.
    const rowNumber = String(heroCase!.row + 1).padStart(2, '0')
    await expect(header.locator('.blocks-field__block-number')).toHaveText(rowNumber)
    await expect(header, 'the row must still say which block it is').toContainText(
      'Hero (standard page)',
    )
    await expect(header, 'and what it is about').toContainText('Variant fixture hero')
  })

  test('changing the selection changes the form, without a save', async ({ page }) => {
    // The seeded cases above assert the rendered result; this asserts the live
    // path an editor actually takes. One block is enough: the mechanism
    // (a `form-state` round trip that recomputes `passesCondition`) is shared.
    const heroCase = CASES.find((c) => c.blockSlug === 'hero' && c.optionValue === 'text-only')
    expect(heroCase, 'the hero fixture row moved').toBeDefined()
    const row = heroCase!.row

    await page.goto(`/admin/collections/pages/${pageId}`)
    await expect(page.locator('#field-layout')).toBeVisible({ timeout: 25_000 })
    await expect(fieldControl(page, row, 'media')).toHaveCount(0)

    const select = page.locator(`#field-layout__${row}__variant`)
    await select.scrollIntoViewIfNeeded()
    await select.locator('.rs__control').click()
    // Wait for the menu rather than racing it: react-select mounts the options
    // asynchronously, and clicking into a menu that is not open yet silently
    // does nothing and leaves the control on its previous value.
    await expect(select.locator('.rs__menu')).toBeVisible()
    await select.locator('.rs__option', { hasText: /^With image$/ }).click()
    await expect(select.locator('.rs__single-value')).toHaveText('With image')

    await expect(
      fieldControl(page, row, 'media'),
      'choosing "With image" must reveal the image field',
    ).toBeVisible({ timeout: 15_000 })
    await expect(fieldControl(page, row, 'videoUrl')).toHaveCount(0)
  })
})
