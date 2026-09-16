'use client'

import { FieldDescription, SlugField } from '@payloadcms/ui'
import type { SlugFieldClientProps } from 'payload'
import React from 'react'

/**
 * Spec 011 US5 — Payload's built-in SlugField, plus the field description it
 * does not render.
 *
 * `@payloadcms/ui`'s SlugField draws the label, the input and its Unlock and
 * Generate controls, and nothing else. The URL path description is where an
 * editor is told that changing a published slug breaks every link to it, which
 * is most useful right beside the Unlock button.
 */
export const UrlPathField: React.FC<SlugFieldClientProps> = (props) => {
  const description = props.field?.admin?.description
  // One `.field-type` around both, so the form's field spacing (applied to
  // `.render-fields > .field-type`) lands once, below the description. A
  // fragment gave SlugField's own `.field-type` that margin, above it.
  //
  // `flex: 1 1 auto` is what Payload puts inline on its own fields. Without it
  // this sits in slugField's row at its content width, visibly narrower than
  // the fields around it on any form without a sidebar.
  return (
    <div className="field-type url-path-field" style={{ flex: '1 1 auto' }}>
      <SlugField {...props} />
      {description ? <FieldDescription description={description} path={props.path} /> : null}
    </div>
  )
}
