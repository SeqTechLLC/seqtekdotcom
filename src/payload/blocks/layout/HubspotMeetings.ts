import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

import { headingField } from '../../fields/blockCopy'
import { httpsUrlValidate } from '../../fields/url'

// Per BLOCK_LIBRARY.md §5.6. HubSpot Meetings booking embed.
export const HubspotMeetings: Block = {
  slug: 'hubspot-meetings',
  interfaceName: 'HubspotMeetingsBlock',
  labels: { singular: 'HubSpot meetings', plural: 'HubSpot meetings blocks' },
  admin: blockAdmin('specialty', 'hubspot-meetings', 'HubSpot meetings'),
  fields: [
    {
      name: 'meetingUrl',
      type: 'text',
      label: 'HubSpot scheduling link',
      required: true,
      validate: httpsUrlValidate,
      admin: {
        description:
          "The full https:// address of a HubSpot meetings link, e.g. https://meetings.hubspot.com/name. Embeds that person's live calendar.",
      },
    },
    headingField(),
  ],
}
