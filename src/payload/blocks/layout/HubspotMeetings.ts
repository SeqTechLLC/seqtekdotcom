import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

import { httpsUrlValidate } from '../../fields/url'

// Per BLOCK_LIBRARY.md §5.6. HubSpot Meetings booking embed.
export const HubspotMeetings: Block = {
  slug: 'hubspot-meetings',
  interfaceName: 'HubspotMeetingsBlock',
  labels: { singular: 'HubSpot meetings', plural: 'HubSpot meetings blocks' },
  admin: blockAdmin('specialty', 'hubspot-meetings', 'HubSpot meetings block preview'),
  fields: [
    { name: 'meetingUrl', type: 'text', required: true, validate: httpsUrlValidate },
    { name: 'heading', type: 'text' },
  ],
}
