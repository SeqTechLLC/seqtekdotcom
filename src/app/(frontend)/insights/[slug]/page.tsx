import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { getPostBySlug, getSiteSettings, publishedSlugsFor } from '@/lib/payload'
import { getDraftBySlug } from '@/lib/preview'
import { buildMetadata } from '@/lib/metadata'
import { articleLd } from '@/lib/structured-data'
import { JsonLd } from '@/components/seo/JsonLd'
import { PreviewBanner } from '@/components/layout/PreviewBanner'
import { RichText } from '@/components/richText/RichText'
import type { Post } from '@/payload-types'

// spec 004 Phase 8 (T029). Insights detail (Shape C) — richText `content`
// through the existing RichText renderer + the inline-block registry (the
// renderer defaults to `defaultInlineRegistry`). Article JSON-LD.

export const revalidate = 3600
export const dynamicParams = true

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const slugs = await publishedSlugsFor('posts')
  return slugs.map((slug) => ({ slug }))
}

const readPost = async (slug: string, isDraft: boolean): Promise<Post | null> =>
  isDraft ? getDraftBySlug<Post>('posts', slug) : getPostBySlug(slug)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { isEnabled: isDraft } = await draftMode()
  const [post, siteSettings] = await Promise.all([readPost(slug, isDraft), getSiteSettings()])
  if (!post) return {}
  return buildMetadata(post.seo, {
    title: post.title,
    description: post.excerpt,
    siteSettings,
  })
}

const isRelObject = <T,>(value: T | string | number | null | undefined): value is T =>
  typeof value === 'object' && value !== null

export default async function InsightPage({ params }: Props) {
  const { slug } = await params
  const { isEnabled: isDraft } = await draftMode()
  const post = await readPost(slug, isDraft)
  if (!post) notFound()

  const author = isRelObject(post.author) ? post.author : null

  return (
    <>
      <JsonLd data={articleLd(post)} />
      {isDraft && <PreviewBanner />}

      <article data-testid="insight" className="mx-auto max-w-container-md px-4 py-16 md:px-6">
        <header className="mb-10">
          <h1 className="text-h1 font-bold" data-testid="insight-title">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap gap-x-3 text-small text-text-muted">
            {author?.name ? <span>By {author.name}</span> : null}
            {post.publishedAt ? (
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            ) : null}
          </div>
        </header>

        {post.content ? (
          <div data-testid="insight-content">
            <RichText data={post.content} />
          </div>
        ) : null}
      </article>
    </>
  )
}
