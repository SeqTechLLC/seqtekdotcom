import type { Block, Field, GroupField } from 'payload'

import { blockAdmin } from '../blockAdmin'
import { requiredWhen } from '../conditional'
import { outputContract } from '../outputContract'
import { backgroundField, headingField } from '../../fields/blockCopy'
import { ctaField } from '../../fields/cta'
import { httpsUrlValidate, hubspotFormIdValidate } from '../../fields/url'

type CtaSibling = { action?: string }

const actionOf = (d?: CtaSibling | null): string => d?.action ?? 'buttons'
const hasButtons = (d?: CtaSibling | null) => ['buttons', 'meeting'].includes(actionOf(d))

type Check = (value: unknown) => true | string
type ValidateArgs = { data?: unknown; siblingData?: unknown }

/**
 * `requiredWhen` supplies the condition and the presence check; `check` is the
 * field's own format validator, which a spread `validate` would otherwise
 * replace rather than join.
 */
const requiredWhenAnd = (
  predicate: (d: CtaSibling) => boolean,
  description: string,
  check: Check,
) => {
  const base = requiredWhen<CtaSibling>(predicate, { description })
  return {
    ...base,
    validate: (value: unknown, args: ValidateArgs): true | string => {
      const present = base.validate(value, args)
      return present === true ? check(value) : present
    },
  }
}

/**
 * The main button is what a "Click a button" section exists for, so it is
 * required there. Under "Book a meeting" the scheduler is the action and the
 * button is optional. The rule lives on the two text fields because a group
 * cannot see the block's `action`; `blockData` can.
 */
const requiredOnButtons = (field: Field): Field => {
  if (field.type !== 'text' || (field.name !== 'label' && field.name !== 'url')) return field
  const own = field.validate as Check | undefined
  return {
    ...field,
    validate: (value: unknown, args: { blockData?: unknown }): true | string => {
      const missing = typeof value !== 'string' || value.trim() === ''
      if (missing && actionOf(args.blockData as CtaSibling) === 'buttons') {
        return 'The main button needs its text and link when the section is "Click a button".'
      }
      return own ? own(value) : true
    },
  } as Field
}

const primary = ctaField({
  name: 'primaryCta',
  label: 'Main button',
  description:
    'The action this section exists to get. Required for "Click a button"; optional beside a scheduler.',
  withStyle: true,
})

const primaryCta: GroupField = {
  ...primary,
  admin: { ...primary.admin, condition: (_data, siblingData) => hasButtons(siblingData) },
  fields: primary.fields.map(requiredOnButtons),
}

const secondary = ctaField({
  name: 'secondaryCta',
  label: 'Second button',
  description:
    'Optional lighter alternative, drawn as a plain link, e.g. emailing instead of booking.',
})

const secondaryCta: GroupField = {
  ...secondary,
  admin: { ...secondary.admin, condition: (_data, siblingData) => hasButtons(siblingData) },
}

/**
 * Replaces `cta-section`, `contact-cta`, `newsletter-cta`, `download-card`
 * and `hubspot-meetings`: one ask, and `action` says what answering it means.
 */
export const Cta: Block = {
  slug: 'cta',
  interfaceName: 'CtaBlock',
  labels: { singular: 'Call to action', plural: 'Calls to action' },
  admin: blockAdmin('cta', 'cta', 'Call to action'),
  custom: outputContract({
    behavioural: {
      formId: 'submit target — src/lib/hubspot/submit.ts',
      // Absent from what the block PAINTS: it arrives in the form's success
      // panel. It still crosses the server/client boundary as a prop, so it is
      // in the RSC payload in the page source. See the note in Cta.tsx.
      fileUrl: 'revealed in the success panel — HubspotLeadForm successCta',
    },
  }),
  fields: [
    headingField({
      required: true,
      description: 'The ask, in a line. Address the reader directly.',
    }),
    {
      name: 'body',
      type: 'textarea',
      label: 'Supporting sentence',
      admin: {
        description:
          'Optional line under the heading. For a download, say what the reader gets: it is what earns the form fill.',
      },
    },
    {
      name: 'action',
      type: 'select',
      label: 'What the reader does',
      required: true,
      defaultValue: 'buttons',
      options: [
        { label: 'Click a button', value: 'buttons' },
        { label: 'Book a meeting', value: 'meeting' },
        { label: 'Subscribe to the newsletter', value: 'newsletter' },
        { label: 'Download a file', value: 'download' },
      ],
      admin: {
        description:
          'Buttons link anywhere. A meeting adds a panel that opens a HubSpot scheduler. Newsletter and download put a HubSpot form in the section; a download hands over the file once the form is sent.',
      },
    },
    {
      name: 'variant',
      type: 'select',
      label: 'Layout',
      required: true,
      defaultValue: 'centered',
      options: [
        { label: 'Centered', value: 'centered' },
        { label: 'Split', value: 'split' },
      ],
      admin: {
        description:
          'Centered stacks everything down the middle. Split puts the heading on the left and the buttons, scheduler, form or download beside it; on a phone the two stack.',
      },
    },
    primaryCta,
    secondaryCta,
    {
      name: 'meetingUrl',
      type: 'text',
      label: 'HubSpot scheduling link',
      ...requiredWhenAnd(
        (d) => actionOf(d) === 'meeting',
        'A HubSpot meetings address, e.g. https://meetings.hubspot.com/name. The panel\'s "See available times" button opens it in a new tab.',
        httpsUrlValidate,
      ),
    },
    {
      name: 'formId',
      type: 'text',
      label: 'HubSpot form ID',
      ...requiredWhenAnd(
        (d) => ['newsletter', 'download'].includes(actionOf(d)),
        'The HubSpot form ID (Marketing > Forms > Share > embed code), e.g. 12345678-90ab-cdef-1234-567890abcdef. A newsletter sends an email address to it; a download sends name, email and company.',
        hubspotFormIdValidate,
      ),
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Cover image',
      ...requiredWhen<CtaSibling>((d) => actionOf(d) === 'download', {
        description:
          'A picture of the thing itself, e.g. the report cover. Portrait or square reads best.',
      }),
    },
    {
      name: 'fileUrl',
      type: 'text',
      label: 'File to deliver',
      ...requiredWhenAnd(
        (d) => actionOf(d) === 'download',
        'The full https:// address of the file. The form hides it from the page, but it is still present in the page source, so treat this as a public link: the form is a courtesy step most people will take, not a lock. Do not put anything here you would not publish outright.',
        httpsUrlValidate,
      ),
    },
    backgroundField('accent'),
  ],
}
