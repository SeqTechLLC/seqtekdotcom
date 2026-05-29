import { revalidateTag } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'

import { invalidateCloudFrontPaths } from '../../../../lib/cloudfront/invalidate'

interface RevalidateBody {
  tags?: unknown
  paths?: unknown
}

const constantTimeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return result === 0
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
  const tagsValid = isStringArray(tags) || (Array.isArray(tags) && tags.length === 0)
  const pathsValid = isStringArray(paths) || (Array.isArray(paths) && paths.length === 0)
  if (!tagsValid || !pathsValid) {
    return NextResponse.json(
      { error: 'tags and paths must be arrays of non-empty strings' },
      { status: 400 },
    )
  }
  const tagList = tagsValid && Array.isArray(tags) ? (tags as string[]) : []
  const pathList = pathsValid && Array.isArray(paths) ? (paths as string[]) : []
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'invalidation failed' },
      { status: 500 },
    )
  }

  return NextResponse.json({
    revalidated: { tags: tagList.length, paths: pathList.length },
    ms: Date.now() - start,
  })
}
