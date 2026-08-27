'use client'

import { Pill, useRowLabel } from '@payloadcms/ui'
import React from 'react'

/**
 * Spec 011 US4 / T051 / FR-021 — a collapsed block row identifies itself.
 *
 * Payload's own row header is a number, a pill with the block's type, and
 * nothing else, so a ten-block page collapses to `01 Hero`, `02 Content`,
 * `03 Content`, `04 Content` and has to be opened one row at a time to find
 * anything. Since the layout IS the page, that list should read as the page's
 * outline.
 *
 * Payload's custom `Label` replaces the entire header rather than appending to
 * it (`BlockRow` passes it as `RowLabel`'s `CustomComponent`, and
 * `RenderCustomComponent` renders one or the other), so the number and the
 * type pill are re-created here with Payload's own class names. Losing them
 * would answer "what is this block about?" at the cost of "what kind of block
 * is it?".
 *
 * The summary is read from live form state through `useRowLabel`, so it tracks
 * what the editor is typing without a save. `data` is the row itself, meaning
 * `TITLE_FIELDS` is matched against this block's own field names.
 */

export interface BlockRowLabelProps {
  /** The block's name, matching `labels.singular`. Supplied by `blockAdmin()`. */
  name: string
}

/**
 * Field names to try, in order, for the line an editor would recognise. The
 * order is "what a person would call this block", not the field order: a
 * `case-study-hero` has both `headline` and `eyebrow`, and the headline is
 * the one that names it.
 */
const TITLE_FIELDS = [
  'headline',
  'heading',
  'title',
  'pillarName',
  'quote',
  'summary',
  'label',
  'question',
  'name',
  'number',
  'city',
  'caption',
  'eyebrow',
  'body',
  'mission',
] as const

/** Longer than this and the row wraps, pushing the drag handles around. */
const MAX_SUMMARY = 72

function firstFilledText(data: Record<string, unknown>): string | null {
  for (const key of TITLE_FIELDS) {
    const value = data?.[key]
    if (typeof value === 'string' && value.trim().length > 0) return value.trim()
  }
  return null
}

const truncate = (value: string): string =>
  value.length > MAX_SUMMARY ? `${value.slice(0, MAX_SUMMARY - 1).trimEnd()}…` : value

export function BlockRowLabel({ name }: BlockRowLabelProps) {
  const { data, rowNumber } = useRowLabel<Record<string, unknown>>()
  const summary = firstFilledText(data ?? {})

  return (
    <React.Fragment>
      <span className="blocks-field__block-number">
        {String((rowNumber ?? 0) + 1).padStart(2, '0')}
      </span>
      <Pill className="blocks-field__block-pill" pillStyle="white" size="small">
        {name}
      </Pill>
      {summary ? (
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {truncate(summary)}
        </span>
      ) : null}
    </React.Fragment>
  )
}

export default BlockRowLabel
