import { createHash, timingSafeEqual } from 'node:crypto'
import { revalidateTag } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'

import { invalidateCloudFrontPaths } from '@/lib/cloudfront/invalidate'

interface RevalidateBody {
  tags?: unknown
  paths?: unknown
}

// SHA-256 digests of both sides give equal-length Buffers, so timingSafeEqual
// never short-circuits on length and the comparison is truly constant-time.
const constantTimeEqual = (a: string, b: string): boolean => {
  const ah = createHash('sha256').update(a).digest()
  const bh = createHash('sha256').update(b).digest()
  return timingSafeEqual(ah, bh)
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((v) => typeof v === 'string' && v.length > 0)

export async function POST(request: NextRequest): Promise<NextResponse> {
  const start = Date.now()
  const secret = process.env.REVALIDATION_SECRET ?? ''
  const authHeader = request.headers.get('authorization') ?? ''
  const presented = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!secret || !presented || !constantTimeEqual(secret, presented)) {
    return NextResponse.json({ error: 'invalid secret' }, { status: 401 })
  }

  let body: RevalidateBody
  try {
    body = (await request.json()) as RevalidateBody
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  const tags = body.tags ?? []
  const paths = body.paths ?? []
  if (!isStringArray(tags) || !isStringArray(paths)) {
    return NextResponse.json(
      { error: 'tags and paths must be arrays of non-empty strings' },
      { status: 400 },
    )
  }
  const tagList = tags
  const pathList = paths
  if (tagList.length === 0 && pathList.length === 0) {
    return NextResponse.json({ error: 'tags or paths required' }, { status: 400 })
  }

  for (const tag of tagList) {
    try {
      revalidateTag(tag, { expire: 0 })
    } catch {
      // revalidateTag throws outside of a request scope in dev — ignore (R-03)
    }
  }

  try {
    await invalidateCloudFrontPaths(pathList)
  } catch (error) {
    console.error('[revalidate] CloudFront invalidation failed:', error)
    return NextResponse.json({ error: 'invalidation failed' }, { status: 500 })
  }

  return NextResponse.json({
    revalidated: { tags: tagList.length, paths: pathList.length },
    ms: Date.now() - start,
  })
}
