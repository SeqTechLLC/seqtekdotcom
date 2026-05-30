import { draftMode } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'

import config from '@payload-config'

import {
  isPreviewCollection,
  publicPathFor,
  type PreviewCollection,
} from '@/payload/livePreview/url'

interface PreviewRouteContext {
  params: Promise<{ collection: string; slug: string }>
}

const ADMIN_LOGIN_PATH = '/admin/login'
const EDITORIAL_ROLES = new Set(['admin', 'editor'])

/**
 * Live-preview entry route. Same-origin so the admin session cookie ships
 * automatically; we resolve the cookie to a User via `payload.auth` and
 * gate on `admin`/`editor` roles. No URL-borne secret — see
 * `buildPreviewUrl` for the rationale.
 *
 * Contract: specs/003-phase-2-content-models/contracts/live-preview-urls.md
 */
export async function GET(
  request: NextRequest,
  { params }: PreviewRouteContext,
): Promise<NextResponse> {
  const { collection, slug } = await params

  if (!isPreviewCollection(collection)) {
    return NextResponse.json({ error: 'unsupported collection' }, { status: 404 })
  }
  if (!slug) {
    return NextResponse.json({ error: 'slug required' }, { status: 400 })
  }

  const payload = await getPayload({ config: await config })

  const { user } = await payload.auth({ headers: request.headers })
  const roles = user?.roles ?? []
  const isEditorial = roles.some((r) => EDITORIAL_ROLES.has(r))
  if (!isEditorial) {
    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(loginUrl, { status: 302 })
  }

  const result = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    draft: true,
    limit: 1,
    depth: collection === 'services' ? 1 : 0,
  })
  const doc = result.docs[0] as
    | { slug?: string; pillar?: { slug?: string } | string | null }
    | undefined
  if (!doc) {
    return NextResponse.json({ error: 'document not found' }, { status: 404 })
  }

  const publicPath = publicPathFor(collection as PreviewCollection, doc)
  if (!publicPath) {
    return NextResponse.json({ error: 'document has no resolvable path' }, { status: 404 })
  }

  ;(await draftMode()).enable()
  return NextResponse.redirect(new URL(publicPath, request.url), { status: 302 })
}
