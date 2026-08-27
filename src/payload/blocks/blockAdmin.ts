import type { Block } from 'payload'

import { BLOCK_CATEGORY_LABELS, type BlockCategory } from './categories'

/**
 * Spec 011 US2 — the admin presentation every layout block must declare
 * (`specs/011-payload-admin-ux/contracts/admin-metadata.md` C1).
 *
 * Payload's block picker renders exactly three things per card: the
 * `admin.group` heading, the `admin.images.thumbnail` image, and
 * `labels.singular`. There is no `admin.description` on the `Block` type and
 * no place on the card for one, which is why the disambiguation clause of C1
 * lives in the label instead. This helper exists so the group heading and the
 * preview path are derived, not retyped 45 times.
 *
 * Previews are committed static files under `public/block-previews/`
 * (ADR 0011), built by `npm run block:thumbnails`.
 */
export function blockAdmin(
  category: BlockCategory,
  slug: string,
  previewAlt: string,
  ext: 'webp' | 'svg' = 'webp',
): Block['admin'] {
  return {
    group: BLOCK_CATEGORY_LABELS[category],
    // The blockName field is unused in this project — every block is identified
    // by its type and its content, never by a name an editor types.
    disableBlockName: true,
    images: {
      thumbnail: { url: `/block-previews/${slug}.${ext}`, alt: previewAlt },
    },
  }
}

/**
 * The 20×20 glyph Payload draws beside a rich-text block in the Lexical slash
 * menu and fixed toolbar (C2). Same reasoning as above: icon and label are all
 * that menu renders.
 */
export function inlineBlockAdmin(slug: string, iconAlt: string): Block['admin'] {
  return {
    disableBlockName: true,
    images: {
      icon: { url: `/block-previews/inline/${slug}.svg`, alt: iconAlt },
    },
  }
}
