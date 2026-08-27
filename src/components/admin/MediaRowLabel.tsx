'use client'

/* eslint-disable @next/next/no-img-element */
import { useConfig, useRowLabel } from '@payloadcms/ui'
import React from 'react'

/**
 * Spec 011 US3 / T043 / FR-017 — a collapsed row of media identifies itself.
 *
 * Payload labels array rows by position: eight logos in a `client-logo-grid`
 * collapse to `Logo 01` … `Logo 08`, which answers nothing and forces an
 * expand-and-collapse per row to find the one you want.
 *
 * This resolves the row's own name in three steps, cheapest first:
 *   1. a text field the editor already filled in on the row (`caption`,
 *      `title`, `date` — declared per call site, in order);
 *   2. the linked media's alt text, then its filename;
 *   3. Payload's numbered fallback, so a half-filled row still renders.
 *
 * **Cost**: one `GET /api/media/:id` per row that holds an upload — every such
 * row, not only the ones step 1 cannot name. The 20px thumbnail comes from the
 * same document, and it is what answers "which image is this?" on a captioned
 * row as much as on a bare one, so the request is not avoidable by finding a
 * caption. What the text fields buy is the *name*: `logo-bar.logos` and
 * `industries.clientLogos`, the two arrays that are nothing but an upload,
 * have no other source for it. The image is `adminThumbnail`'s output (T041),
 * not the full-size original.
 */

export interface MediaRowLabelProps {
  /** Row field names to try, in order, for a label the editor wrote. */
  textFields?: string[]
  /** The row's upload field, used when no text field is filled in. */
  uploadField: string
  /** Singular noun for the numbered fallback, matching the array's label. */
  singular: string
}

interface MediaSummary {
  alt?: string | null
  filename?: string | null
  thumbnailURL?: string | null
}

function firstFilledText(data: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = data?.[key]
    if (typeof value === 'string' && value.trim().length > 0) return value.trim()
  }
  return null
}

/**
 * Form state holds an upload as its ID; a populated document turns up when the
 * row was rendered from server data. Accept both, reject everything else.
 */
function mediaIdOf(value: unknown): number | string | null {
  if (typeof value === 'number' || (typeof value === 'string' && value.length > 0)) return value
  if (value && typeof value === 'object' && 'id' in value) {
    return mediaIdOf((value as { id: unknown }).id)
  }
  return null
}

export function MediaRowLabel({ textFields = [], uploadField, singular }: MediaRowLabelProps) {
  const { data, rowNumber } = useRowLabel<Record<string, unknown>>()
  const {
    config: {
      routes: { api },
    },
  } = useConfig()

  const writtenLabel = firstFilledText(data ?? {}, textFields)
  const mediaId = mediaIdOf(data?.[uploadField])
  const [resolved, setResolved] = React.useState<{
    id: number | string
    doc: MediaSummary | null
  } | null>(null)

  React.useEffect(() => {
    if (mediaId === null) return
    // Relative to the admin's own origin: `config.serverURL` is the public
    // site URL, which is not necessarily where the admin is being served from
    // (a preview lane behind the Cognito gate, a dev server on another port).
    const controller = new AbortController()
    fetch(`${api}/media/${mediaId}?depth=0`, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((doc: MediaSummary | null) => setResolved({ doc, id: mediaId }))
      .catch(() => {
        /* a deleted or unreadable media row falls back to the numbering */
      })
    return () => controller.abort()
  }, [api, mediaId])

  // Keyed by the id it was fetched for, so swapping a row's image shows the
  // numbered fallback for a frame rather than the previous image's name.
  const media = resolved && resolved.id === mediaId ? resolved.doc : null

  const fallback = `${singular} ${String((rowNumber ?? 0) + 1).padStart(2, '0')}`
  const label = writtenLabel ?? media?.alt ?? media?.filename ?? fallback

  return (
    <span style={{ alignItems: 'center', display: 'inline-flex', gap: '0.5rem' }}>
      {media?.thumbnailURL ? (
        <img
          alt=""
          src={media.thumbnailURL}
          style={{
            borderRadius: '2px',
            flexShrink: 0,
            height: '20px',
            objectFit: 'cover',
            width: '20px',
          }}
        />
      ) : null}
      <span>{label}</span>
    </span>
  )
}

export default MediaRowLabel
