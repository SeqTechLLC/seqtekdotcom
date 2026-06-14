import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { getPostBySlug, getSiteSettings } from '@/lib/payload'
import { getDraftBySlug } from '@/lib/preview'
import { buildMetadata } from '@/lib/metadata'
import { articleLd } from '@/lib/structured-data'
import { JsonLd } from '@/components/seo/JsonLd'
import { PreviewBanner } from '@/components/layout/PreviewBanner'
import { RichText } from '@/components/richText/RichText'
import { Prose } from '@/components/ui/Prose'
import { ResponsiveImage } from '@/components/ui/ResponsiveImage'
import type { Post } from '@/payload-types'

// spec 004 Phase 8 (T029). Insights detail (Shape C) — richText `content`
// through the existing RichText renderer + the inline-block registry (the
// renderer defaults to `defaultInlineRegistry`). Article JSON-LD.

// Dynamically rendered (no generateStaticParams) — layout CSP nonce forces
// dynamic rendering (Constitution §IV, ADR 0005); data ISR-cached via the
// unstable_cache readers.
export const revalidate = 3600

interface Props {
  params: Promise<{ slug: string }>
}

// Published-only metadata — no draftMode() before the cached read (avoids the
// DYNAMIC_SERVER_USAGE bail under ISR; see the page body note).
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [post, siteSettings] = await Promise.all([getPostBySlug(slug), getSiteSettings()])
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
  // Cached published read FIRST, then the dynamic draft check (order matters —
  // draftMode() before unstable_cache throws DYNAMIC_SERVER_USAGE under ISR).
  const published = await getPostBySlug(slug)
  const { isEnabled: isDraft } = await draftMode()
  const post = isDraft ? ((await getDraftBySlug<Post>('posts', slug)) ?? published) : published
  if (!post) notFound()

  const author = isRelObject(post.author) ? post.author : null

  return (
    <>
      <JsonLd data={articleLd(post)} />
      {isDraft && <PreviewBanner />}

      {/* A text-only essay: one reading column (~768px) CENTERED in the page
          with equal margins — not a narrow column offset to one side. The wider
          header/footer chrome (container-lg) intentionally frames this narrower
          measure, the conventional long-form article layout. */}
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

        {isRelObject(post.featuredImage) ? (
          <ResponsiveImage
            media={post.featuredImage}
            sizes="(min-width: 768px) 768px, 100vw"
            className="mb-10 aspect-[16/9] w-full rounded-lg border border-border-subtle object-cover shadow-sm"
            loading="eager"
            fetchPriority="high"
          />
        ) : null}

        {post.content ? (
          // max-w-none: the `prose` class hard-caps body text at 65ch (~595px),
          // which is NARROWER than the hero image and title (the column width),
          // leaving the body's right edge short of everything beside it. Fill the
          // column so title, image, and body share one centered right edge.
          <div data-testid="insight-content">
            <Prose className="max-w-none">
              <RichText data={post.content} withProse={false} />
            </Prose>
          </div>
        ) : null}
      </article>
    </>
  )
}
