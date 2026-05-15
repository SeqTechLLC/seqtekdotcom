# Payload CMS v3 — Development Guide

**Date:** May 2026
**Status:** Reference — Pre-Implementation

This is a practical reference for developing with Payload CMS v3 in the SEQTEK website project. It covers collection design, block development, Lexical editor customization, hooks, access control, querying, and admin panel configuration.

For architecture decisions and deployment, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Table of Contents

1. [How Payload Works](#1-how-payload-works)
2. [Root Configuration](#2-root-configuration)
3. [Collections](#3-collections)
4. [Globals](#4-globals)
5. [Field Types Reference](#5-field-types-reference)
6. [Blocks](#6-blocks)
7. [Lexical Rich Text Editor](#7-lexical-rich-text-editor)
8. [Hooks](#8-hooks)
9. [Access Control](#9-access-control)
10. [Local API (Querying from Next.js)](#10-local-api-querying-from-nextjs)
11. [Uploads and Media](#11-uploads-and-media)
12. [Live Preview](#12-live-preview)
13. [Migrations](#13-migrations)
14. [Admin Panel Customization](#14-admin-panel-customization)
15. [Pre-Built Block Libraries](#15-pre-built-block-libraries)
16. [Common Patterns](#16-common-patterns)

---

## 1. How Payload Works

Payload v3 is not a separate service — it's a library that embeds directly into the Next.js application. One Node process (`next start`) serves everything:

- **Public pages** — your React components in `/app/(site)/`
- **Admin panel** — a React SPA at `/admin`, auto-generated from your content model
- **REST API** — CRUD endpoints at `/api/[collection]`, auto-generated per collection
- **GraphQL API** — full schema at `/api/graphql`
- **Local API** — direct function calls from server components, no HTTP overhead

The content model is defined in TypeScript. From those definitions, Payload generates the database schema (via Drizzle ORM), the API layer, the admin UI, and TypeScript types. You define the shape of your data once; everything else is derived.

### What Gets Generated

From a single collection config like `CaseStudies.ts`:

| Generated Artifact             | Description                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| Postgres table + columns       | Via Drizzle ORM, managed through migrations                                           |
| `GET /api/case-studies`        | Paginated, filterable list endpoint                                                   |
| `POST /api/case-studies`       | Create endpoint                                                                       |
| `GET /api/case-studies/:id`    | Single document endpoint                                                              |
| `PATCH /api/case-studies/:id`  | Update endpoint                                                                       |
| `DELETE /api/case-studies/:id` | Delete endpoint                                                                       |
| GraphQL types + resolvers      | Full CRUD queries and mutations                                                       |
| TypeScript interface           | `CaseStudy` type usable across the app                                                |
| Admin list view                | Sortable, filterable table in `/admin`                                                |
| Admin edit form                | Field-appropriate inputs (rich text editor, relationship picker, upload widget, etc.) |

### The Build Pipeline

`next.config.ts` wraps the Next.js config with `withPayload()`:

```typescript
import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig = {
  // your Next.js config
}

export default withPayload(nextConfig)
```

During `next build`, Payload scans `payload.config.ts`, generates types, and injects admin routes into the App Router. At runtime, Payload shares the Next.js Node process — no separate server.

---

## 2. Root Configuration

`payload.config.ts` in the project root is the central configuration:

```typescript
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { seoPlugin } from '@payloadcms/plugin-seo'

import { Users } from './src/payload/collections/Users'
import { Posts } from './src/payload/collections/Posts'
import { CaseStudies } from './src/payload/collections/CaseStudies'
import { Media } from './src/payload/collections/Media'
import { SiteSettings } from './src/payload/globals/SiteSettings'
import { Navigation } from './src/payload/globals/Navigation'

export default buildConfig({
  // Default editor for all richText fields (can be overridden per-field)
  editor: lexicalEditor(),

  // Database
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
    push: process.env.NODE_ENV !== 'production',
  }),

  // Collections
  collections: [Users, Posts, CaseStudies, Media],

  // Globals (singletons)
  globals: [SiteSettings, Navigation],

  // Plugins
  plugins: [
    s3Storage({
      collections: { media: true },
      bucket: process.env.S3_BUCKET!,
      config: {
        region: process.env.S3_REGION!,
        // No credentials — uses EC2 instance profile via default credential chain
      },
    }),
    seoPlugin({
      collections: ['posts', 'case-studies', 'pages', 'services'],
      globals: ['homepage'],
      uploadsCollection: 'media',
      generateTitle: ({ doc }) => `${doc.title} | SEQTEK`,
      generateDescription: ({ doc }) => doc.excerpt || doc.description,
    }),
  ],

  // Admin panel config
  admin: {
    livePreview: {
      // Routes to a dedicated preview API that resolves relations server-side and
      // streams the rendered page back. Live preview form data only contains IDs
      // for relationship fields, not populated objects — never reach into
      // `data.someRelation.slug` here. See §12 for the full pattern.
      url: ({ data, collectionConfig, req }) =>
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/preview` +
        `?collection=${collectionConfig?.slug}` +
        `&slug=${data?.slug ?? ''}` +
        `&token=${req?.user ? 'authed' : ''}`,
      collections: ['posts', 'case-studies', 'pages', 'services'],
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },

  // CORS — allow requests from the site domain
  cors: [process.env.NEXT_PUBLIC_SITE_URL || ''],

  // Secret for JWT encryption
  secret: process.env.PAYLOAD_SECRET!,
})
```

### Key Config Options

| Option              | Purpose                                                              |
| ------------------- | -------------------------------------------------------------------- |
| `editor`            | Default rich text editor for all `richText` fields                   |
| `db`                | Database adapter (Postgres for production, SQLite for dev if needed) |
| `collections`       | Array of collection configs                                          |
| `globals`           | Array of global configs                                              |
| `plugins`           | Plugin array (S3 storage, SEO, search, etc.)                         |
| `admin.livePreview` | Enables in-admin preview panel with your frontend                    |
| `cors`              | Allowed origins for API requests                                     |
| `secret`            | JWT signing key (must be set via env var, never hardcoded)           |

---

## 3. Collections

A collection is a repeating data type — blog posts, case studies, team members. Each collection gets its own Postgres table, API endpoints, admin views, and TypeScript types.

### Anatomy of a Collection Config

```typescript
import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',

  // Admin panel behavior
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'publishedAt'],
    listSearchableFields: ['title', 'excerpt'],
    group: 'Content',
  },

  // Access control (see Section 9)
  access: {
    read: ({ req }) => {
      if (req.user) return true
      // `_status` is Payload's auto-managed draft state field (created when
      // `versions.drafts: true`). Filtering on `_status` correctly hides
      // unpublished drafts of previously-published documents — a user-defined
      // `status` field would not, since the prior draft still has the old value.
      return { _status: { equals: 'published' } }
    },
    create: ({ req }) => req.user?.roles?.includes('editor') || false,
    update: ({ req }) => req.user?.roles?.includes('editor') || false,
    delete: ({ req }) => req.user?.roles?.includes('admin') || false,
  },

  // Lifecycle hooks (see Section 8)
  hooks: {
    afterChange: [revalidateOnChange],
  },

  // Version control
  versions: {
    drafts: true,
    maxPerDoc: 10,
  },

  // Auto-generated createdAt and updatedAt fields
  timestamps: true,

  // Field definitions
  fields: [
    { name: 'title', type: 'text', required: true },
    // ... more fields
  ],
}
```

### Important Config Properties

| Property                     | Purpose                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| `slug`                       | URL segment and database table name. Use kebab-case for multi-word: `'case-studies'` |
| `admin.useAsTitle`           | Which field displays as the document title in lists and relationship pickers         |
| `admin.defaultColumns`       | Columns shown in the list view                                                       |
| `admin.listSearchableFields` | Fields included in the admin search                                                  |
| `admin.group`                | Groups collections in the admin sidebar                                              |
| `versions.drafts`            | Enables draft/publish workflow with version history                                  |
| `timestamps`                 | Auto-adds `createdAt` and `updatedAt` fields                                         |
| `orderable`                  | Enables drag-and-drop reordering in admin list view                                  |

---

## 4. Globals

A global is a singleton — one document, not a collection. Used for site settings, navigation, homepage config.

```typescript
import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',

  access: {
    read: () => true,
    update: ({ req }) => req.user?.roles?.includes('admin') || false,
  },

  admin: {
    group: 'Site Configuration',
  },

  fields: [
    { name: 'companyName', type: 'text', required: true },
    { name: 'tagline', type: 'text' },
    { name: 'phone', type: 'text' },
    { name: 'email', type: 'email' },
    {
      name: 'address',
      type: 'group',
      fields: [
        { name: 'street', type: 'text' },
        { name: 'city', type: 'text' },
        { name: 'state', type: 'text' },
        { name: 'zip', type: 'text' },
      ],
    },
    {
      name: 'socialLinks',
      type: 'group',
      fields: [
        { name: 'linkedinUrl', type: 'text' },
        { name: 'twitterUrl', type: 'text' },
        { name: 'facebookUrl', type: 'text' },
      ],
    },
    {
      name: 'stats',
      type: 'array',
      fields: [
        { name: 'number', type: 'text', required: true },
        { name: 'label', type: 'text', required: true },
        { name: 'suffix', type: 'text' },
      ],
    },
  ],
}
```

### Querying Globals

```typescript
const payload = await getPayload({ config })

// Read
const settings = await payload.findGlobal({ slug: 'site-settings' })

// Update
await payload.updateGlobal({
  slug: 'site-settings',
  data: { tagline: 'New tagline' },
})
```

### When to Use Globals vs. Collections

| Use Case                   | Choice     | Why                                 |
| -------------------------- | ---------- | ----------------------------------- |
| Company info, social links | Global     | One instance, site-wide             |
| Navigation menu structure  | Global     | One nav, used on every page         |
| Homepage hero/CTA config   | Global     | One homepage                        |
| Blog posts                 | Collection | Many instances                      |
| Team members               | Collection | Many instances                      |
| Testimonials               | Collection | Many instances, reused across pages |

---

## 5. Field Types Reference

### Scalar Fields

| Type       | Stores             | Admin Widget     | Notes                                 |
| ---------- | ------------------ | ---------------- | ------------------------------------- |
| `text`     | `string`           | Text input       | `minLength`, `maxLength`, `unique`    |
| `textarea` | `string`           | Multi-line input | For longer unformatted text           |
| `number`   | `number`           | Number input     | `min`, `max`, integer or float        |
| `email`    | `string`           | Email input      | Built-in format validation            |
| `date`     | `string` (ISO)     | Date picker      | Optional time picker via `admin.date` |
| `checkbox` | `boolean`          | Toggle           | `defaultValue: true/false`            |
| `json`     | `object`           | JSON editor      | For arbitrary structured data         |
| `point`    | `[number, number]` | Coordinate input | Geospatial (longitude, latitude)      |

### Selection Fields

| Type     | Stores                 | Admin Widget  | Notes                                                           |
| -------- | ---------------------- | ------------- | --------------------------------------------------------------- |
| `select` | `string` or `string[]` | Dropdown      | `hasMany: true` for multi-select. Options: `[{ label, value }]` |
| `radio`  | `string`               | Radio buttons | Same options format as select                                   |

### Relational Fields

| Type           | Stores         | Admin Widget                | Notes                                                             |
| -------------- | -------------- | --------------------------- | ----------------------------------------------------------------- |
| `relationship` | `id` or `id[]` | Searchable dropdown         | `relationTo: 'collection-slug'`, `hasMany: true` for many-to-many |
| `upload`       | `id`           | File picker + upload widget | `relationTo: 'media'` — points to an upload-enabled collection    |

### Structural Fields (no database column)

| Type          | Purpose                            | Notes                                                                                       |
| ------------- | ---------------------------------- | ------------------------------------------------------------------------------------------- |
| `group`       | Nest fields under a namespace      | Creates a JSON column in Postgres                                                           |
| `array`       | Repeatable set of fields           | Each item has its own `id`                                                                  |
| `blocks`      | Repeatable, polymorphic content    | Each item has `blockType` + fields. See [Section 6](#6-blocks)                              |
| `tabs`        | Organize fields into tabs in admin | Purely visual — no effect on data shape (named tabs) or nests under tab name (unnamed tabs) |
| `collapsible` | Collapsible field group in admin   | Purely visual organization                                                                  |
| `row`         | Horizontal layout in admin         | Places fields side by side                                                                  |

### Rich Text

| Type       | Stores             | Admin Widget           | Notes                                        |
| ---------- | ------------------ | ---------------------- | -------------------------------------------- |
| `richText` | JSON AST (Lexical) | Lexical WYSIWYG editor | See [Section 7](#7-lexical-rich-text-editor) |

### Field Config Patterns

```typescript
// Required field with validation
{
  name: 'title',
  type: 'text',
  required: true,
  minLength: 3,
  maxLength: 200,
}

// Field with default value
{
  name: 'status',
  type: 'select',
  defaultValue: 'draft',
  options: [
    { label: 'Draft', value: 'draft' },
    { label: 'Published', value: 'published' },
  ],
}

// Unique field
{
  name: 'slug',
  type: 'text',
  unique: true,
  index: true,
}

// Relationship with hasMany
{
  name: 'categories',
  type: 'relationship',
  relationTo: 'categories',
  hasMany: true,
}

// Polymorphic relationship (multiple collection types)
{
  name: 'relatedContent',
  type: 'relationship',
  relationTo: ['posts', 'case-studies'],
  hasMany: true,
}

// Array of complex objects
{
  name: 'metrics',
  type: 'array',
  minRows: 1,
  maxRows: 6,
  fields: [
    { name: 'number', type: 'text', required: true },
    { name: 'label', type: 'text', required: true },
    { name: 'context', type: 'text' },
  ],
}

// Conditional field (only visible when another field has a specific value)
{
  name: 'externalUrl',
  type: 'text',
  admin: {
    condition: (data, siblingData) => siblingData.linkType === 'external',
  },
}
```

---

## 6. Blocks

Blocks are polymorphic, repeatable content structures. An editor picks from a menu of block types and fills in the fields for each. This is how you build flexible page layouts.

### Defining Blocks

```typescript
import type { Block } from 'payload'

const HeroBlock: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: { singular: 'Hero Section', plural: 'Hero Sections' },
  imageURL: '/images/blocks/hero-preview.png',
  imageAltText: 'Hero section preview',
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'subheading', type: 'textarea' },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'cta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'url', type: 'text' },
      ],
    },
  ],
}

const StatsBlock: Block = {
  slug: 'stats',
  interfaceName: 'StatsBlock',
  labels: { singular: 'Stats Bar', plural: 'Stats Bars' },
  fields: [
    {
      name: 'items',
      type: 'array',
      minRows: 2,
      maxRows: 5,
      fields: [
        { name: 'number', type: 'text', required: true },
        { name: 'label', type: 'text', required: true },
        { name: 'suffix', type: 'text' },
      ],
    },
  ],
}

const ContentBlock: Block = {
  slug: 'content',
  interfaceName: 'ContentBlock',
  fields: [{ name: 'body', type: 'richText', required: true }],
}

const CTABlock: Block = {
  slug: 'cta',
  interfaceName: 'CTABlock',
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'body', type: 'textarea' },
    { name: 'buttonLabel', type: 'text', required: true },
    { name: 'buttonUrl', type: 'text', required: true },
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'primary',
      options: [
        { label: 'Primary', value: 'primary' },
        { label: 'Secondary', value: 'secondary' },
      ],
    },
  ],
}
```

### Using Blocks in a Collection

```typescript
export const Pages: CollectionConfig = {
  slug: 'pages',
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'layout',
      type: 'blocks',
      required: true,
      blocks: [HeroBlock, StatsBlock, ContentBlock, CTABlock],
    },
  ],
}
```

### Rendering Blocks on the Frontend

The `layout` field stores an array of objects, each with a `blockType` discriminator:

```typescript
import type { Page } from '@/payload-types'

const blockComponents: Record<string, React.ComponentType<any>> = {
  hero: HeroSection,
  stats: StatsBar,
  content: ContentSection,
  cta: CTASection,
}

export function RenderBlocks({ blocks }: { blocks: Page['layout'] }) {
  return (
    <>
      {blocks?.map((block, i) => {
        const Component = blockComponents[block.blockType]
        if (!Component) return null
        return <Component key={block.id ?? i} {...block} />
      })}
    </>
  )
}
```

### Block Data Shape

When queried, a blocks field returns:

```json
[
  {
    "id": "abc123",
    "blockType": "hero",
    "heading": "Technology consulting that delivers",
    "subheading": "...",
    "backgroundImage": { "url": "/media/hero.jpg", "alt": "..." },
    "cta": { "label": "Get Started", "url": "/contact" }
  },
  {
    "id": "def456",
    "blockType": "stats",
    "items": [
      { "number": "25+", "label": "Years", "suffix": "" },
      { "number": "500+", "label": "Projects", "suffix": "" }
    ]
  }
]
```

### Block Properties

| Property                    | Purpose                                                        |
| --------------------------- | -------------------------------------------------------------- |
| `slug`                      | Stored as `blockType` in the data — the discriminator          |
| `interfaceName`             | Name of the generated TypeScript type                          |
| `labels`                    | Human-readable names in the admin block picker                 |
| `imageURL` / `imageAltText` | Thumbnail preview in the block selector                        |
| `fields`                    | Array of field configs specific to this block type             |
| `minRows` / `maxRows`       | On the parent `blocks` field — constrain how many blocks total |

---

## 7. Lexical Rich Text Editor

Payload v3 uses Meta's Lexical editor for all `richText` fields. Content is stored as a JSON AST (Abstract Syntax Tree), not HTML.

### Default Features

Out of the box, the Lexical editor includes: bold, italic, underline, strikethrough, inline code, headings (H1–H4), ordered/unordered lists, blockquotes, links, horizontal rules, and upload/image embedding.

### Configuring the Editor

**Project-wide default** (in `payload.config.ts`):

```typescript
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export default buildConfig({
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [...defaultFeatures],
  }),
})
```

**Per-field override** (restrict features for a specific field):

```typescript
import {
  lexicalEditor,
  BoldFeature,
  ItalicFeature,
  LinkFeature,
  ParagraphFeature,
  HeadingFeature,
  UnorderedListFeature,
} from '@payloadcms/richtext-lexical'

{
  name: 'excerpt',
  type: 'richText',
  editor: lexicalEditor({
    features: [
      ParagraphFeature(),
      BoldFeature(),
      ItalicFeature(),
      LinkFeature(),
      HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
      UnorderedListFeature(),
    ],
  }),
}
```

### Toolbar Options

```typescript
lexicalEditor({
  features: ({ defaultFeatures }) => [...defaultFeatures],
  lexical: {
    // Fixed toolbar at top (default is inline/floating toolbar)
    theme: {
      // Lexical theme overrides
    },
  },
})
```

The default is a **floating inline toolbar** that appears when you select text (similar to Notion/Medium). A fixed toolbar can be configured to stay pinned at the top of the editor.

### Editor Interaction Model

Editors interact with Lexical through three mechanisms:

1. **Select text** → floating toolbar appears (bold, italic, link, heading, etc.)
2. **Type `/`** on an empty line → slash command menu appears (insert heading, list, image, block, horizontal rule, etc.)
3. **Markdown shortcuts** → `##` becomes H2, `**text**` becomes bold, `-` starts a bullet list, `>` starts a blockquote

### Rendering Lexical Content on the Frontend

The `@payloadcms/richtext-lexical` package provides a React component:

```typescript
import { RichText } from '@payloadcms/richtext-lexical/react'

export function PostBody({ content }: { content: any }) {
  return (
    <div className="prose prose-lg">
      <RichText data={content} />
    </div>
  )
}
```

For custom rendering (e.g., mapping Lexical nodes to your own components):

```typescript
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'

const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  heading: ({ node, nodesToJSX }) => {
    const Tag = node.tag
    return <Tag className="font-display">{nodesToJSX({ nodes: node.children })}</Tag>
  },
  link: ({ node, nodesToJSX }) => (
    <a href={node.fields.url} className="text-brand-primary underline">
      {nodesToJSX({ nodes: node.children })}
    </a>
  ),
})

export function PostBody({ content }: { content: any }) {
  return <RichText data={content} converters={converters} />
}
```

### Checking for Empty Rich Text

```typescript
import { hasText } from '@payloadcms/richtext-lexical/shared'

if (hasText(doc.content)) {
  return <RichText data={doc.content} />
}
return <p>No content yet.</p>
```

### Custom Inline Blocks in Lexical

You can embed custom block types directly within rich text (as opposed to field-level blocks):

```typescript
import { lexicalEditor, BlocksFeature } from '@payloadcms/richtext-lexical'

{
  name: 'content',
  type: 'richText',
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      BlocksFeature({
        blocks: [
          {
            slug: 'inlineCTA',
            fields: [
              { name: 'label', type: 'text', required: true },
              { name: 'url', type: 'text', required: true },
            ],
          },
          {
            slug: 'testimonialEmbed',
            fields: [
              {
                name: 'testimonial',
                type: 'relationship',
                relationTo: 'testimonials',
                required: true,
              },
            ],
          },
        ],
      }),
    ],
  }),
}
```

Editors insert these via the slash command menu or toolbar, and they render inline within the rich text flow.

---

## 8. Hooks

Hooks are lifecycle functions that run server-side at specific points in a document's lifecycle. They're defined on collections, globals, or individual fields.

### Collection Hooks

```typescript
export const Posts: CollectionConfig = {
  slug: 'posts',
  hooks: {
    beforeValidate: [
      /* runs before Payload validates the data */
    ],
    beforeChange: [
      /* runs after validation, before database write */
    ],
    afterChange: [
      /* runs after database write — side effects go here */
    ],
    beforeRead: [
      /* runs before returning data from a query */
    ],
    afterRead: [
      /* runs after data is read, before returning to caller */
    ],
    beforeDelete: [
      /* runs before deletion */
    ],
    afterDelete: [
      /* runs after deletion */
    ],
  },
  fields: [
    /* ... */
  ],
}
```

### Hook Function Signatures

**`beforeChange`** — modify data before it's written:

```typescript
const setPublishedDate: CollectionBeforeChangeHook = async ({
  data, // the incoming data (mutable)
  req, // the request object (includes user, payload instance)
  operation, // 'create' or 'update'
  originalDoc, // the existing document (null on create)
}) => {
  if (data.status === 'published' && !data.publishedAt) {
    data.publishedAt = new Date().toISOString()
  }
  return data
}
```

**`afterChange`** — trigger side effects after save:

```typescript
const revalidateOnChange: CollectionAfterChangeHook = async ({
  doc, // the saved document (with id, timestamps, etc.)
  req, // request object
  operation, // 'create' or 'update'
  previousDoc, // the document before the change
}) => {
  if (doc.status === 'published') {
    revalidateTag(`posts-${doc.slug}`)
    revalidateTag('posts-list')
  }
}
```

**`afterRead`** — transform data before it reaches the caller:

```typescript
const stripInternalFields: CollectionAfterReadHook = async ({
  doc, // the document as read from the database
  req, // request object
}) => {
  if (!req.user?.roles?.includes('admin')) {
    delete doc.internalNotes
  }
  return doc
}
```

### Field-Level Hooks

```typescript
{
  name: 'slug',
  type: 'text',
  hooks: {
    beforeValidate: [
      ({ value, siblingData }) => {
        if (!value && siblingData.title) {
          return siblingData.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
        }
        return value
      },
    ],
  },
}
```

### Hook Gotchas

- **`beforeChange` receives unvalidated data** — don't assume field values are correct
- **`afterChange` can cause infinite loops** if it calls `payload.update()` on the same collection without a guard
- **Hooks run on both API calls and Local API calls** — there's no way to skip them
- **Expensive operations in `afterRead` affect every query** — use sparingly, or check `req.context` for flags

### Common Hook Patterns for This Project

| Hook           | Pattern                                          | Where Used                               |
| -------------- | ------------------------------------------------ | ---------------------------------------- |
| `afterChange`  | Revalidate ISR cache + CloudFront path           | All published content collections        |
| `beforeChange` | Auto-generate slug from title                    | Posts, case studies, services, workshops |
| `beforeChange` | Set `publishedAt` on first publish               | Posts, case studies                      |
| `afterRead`    | Strip draft content for unauthenticated requests | All content collections                  |

---

## 9. Access Control

Access control functions gate every operation on every collection and field. They receive the request context and return either a boolean or a query constraint.

### Collection-Level Access

```typescript
import type { Access } from 'payload'

const isAdminOrEditor: Access = ({ req }) => {
  return req.user?.roles?.includes('admin') || req.user?.roles?.includes('editor') || false
}

const publishedOrAuthenticated: Access = ({ req }) => {
  if (req.user) return true
  return { _status: { equals: 'published' } }
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  access: {
    read: publishedOrAuthenticated,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: ({ req }) => req.user?.roles?.includes('admin') || false,
  },
}
```

### How Query Constraints Work

When an access function returns an object instead of a boolean, Payload merges it into the database query as a WHERE clause:

```typescript
// This access function:
read: ({ req }) => {
  if (req.user) return true
  return { status: { equals: 'published' } }
}

// For unauthenticated users, every query becomes:
// SELECT * FROM posts WHERE status = 'published' AND <original query>
```

This means unauthenticated users literally cannot see draft content — it's filtered at the database level, not the application level.

### Field-Level Access

```typescript
{
  name: 'internalNotes',
  type: 'textarea',
  access: {
    read: ({ req }) => req.user?.roles?.includes('admin') || false,
    update: ({ req }) => req.user?.roles?.includes('admin') || false,
  },
}
```

When field-level `read` returns `false`, the field is omitted from API responses entirely. In the admin panel, the field is hidden.

### Reusable Access Functions

Create shared access functions in `src/payload/access/`:

```typescript
// src/payload/access/isAdmin.ts
import type { Access } from 'payload'

export const isAdmin: Access = ({ req }) => req.user?.roles?.includes('admin') || false

// src/payload/access/isAdminOrEditor.ts
export const isAdminOrEditor: Access = ({ req }) =>
  req.user?.roles?.includes('admin') || req.user?.roles?.includes('editor') || false

// src/payload/access/publishedOnly.ts
export const publishedOnly: Access = ({ req }) => {
  if (req.user) return true
  return { status: { equals: 'published' } }
}
```

### Admin Panel Access

The admin panel checks access functions to decide what to show. When checking permissions for UI display (before any specific document is loaded), `id`, `data`, and `doc` are `undefined`. Always guard against this:

```typescript
// Wrong — will throw when checking admin UI permissions
read: ({ req, id }) => {
  return id === req.user?.id // id is undefined during permission check
}

// Correct
read: ({ req, id }) => {
  if (!id) return true // Allow the UI to load
  return id === req.user?.id
}
```

---

## 10. Local API (Querying from Next.js)

The Local API is the primary way to fetch content in server components. It calls Payload directly within the same Node process — no HTTP request, no serialization overhead, fully typed responses.

### Getting the Payload Instance

```typescript
import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })
```

### Core Operations

**Find (list with filtering and pagination):**

```typescript
const { docs, totalDocs, totalPages, hasNextPage, hasPrevPage, page } = await payload.find({
  collection: 'posts',
  where: {
    status: { equals: 'published' },
    categories: { in: ['ai-strategy', 'change-management'] },
  },
  sort: '-publishedAt',
  limit: 10,
  page: 1,
  depth: 1,
})
```

**Find by ID:**

```typescript
const post = await payload.findByID({
  collection: 'posts',
  id: postId,
  depth: 2,
})
```

**Find by slug (common pattern):**

```typescript
const { docs } = await payload.find({
  collection: 'posts',
  where: { slug: { equals: params.slug } },
  limit: 1,
  depth: 2,
})
const post = docs[0] || null
```

**Count:**

```typescript
const { totalDocs } = await payload.count({
  collection: 'posts',
  where: { status: { equals: 'published' } },
})
```

**Create, Update, Delete:**

```typescript
const newPost = await payload.create({
  collection: 'posts',
  data: { title: 'New Post', status: 'draft' },
})

const updated = await payload.update({
  collection: 'posts',
  id: postId,
  data: { status: 'published' },
})

await payload.delete({
  collection: 'posts',
  id: postId,
})
```

### Query Operators

| Operator             | Example                                  | SQL Equivalent    |
| -------------------- | ---------------------------------------- | ----------------- |
| `equals`             | `{ status: { equals: 'published' } }`    | `= 'published'`   |
| `not_equals`         | `{ status: { not_equals: 'draft' } }`    | `!= 'draft'`      |
| `greater_than`       | `{ views: { greater_than: 100 } }`       | `> 100`           |
| `greater_than_equal` | `{ views: { greater_than_equal: 100 } }` | `>= 100`          |
| `less_than`          | `{ views: { less_than: 50 } }`           | `< 50`            |
| `less_than_equal`    | `{ views: { less_than_equal: 50 } }`     | `<= 50`           |
| `in`                 | `{ category: { in: ['a', 'b'] } }`       | `IN ('a', 'b')`   |
| `not_in`             | `{ category: { not_in: ['a'] } }`        | `NOT IN ('a')`    |
| `exists`             | `{ publishedAt: { exists: true } }`      | `IS NOT NULL`     |
| `contains`           | `{ title: { contains: 'react' } }`       | `ILIKE '%react%'` |
| `like`               | `{ title: { like: 'react%' } }`          | `ILIKE 'react%'`  |

**Logical operators:**

```typescript
where: {
  or: [
    { status: { equals: 'published' } },
    { author: { equals: currentUserId } },
  ],
  and: [
    { publishedAt: { exists: true } },
    { publishedAt: { less_than: new Date().toISOString() } },
  ],
}
```

### The `depth` Parameter

Controls how deeply relationships are populated:

| Depth | Behavior                                                         | Use When                                             |
| ----- | ---------------------------------------------------------------- | ---------------------------------------------------- |
| `0`   | Relationships return IDs only                                    | You only need to know if a relationship exists       |
| `1`   | First-level relationships are full objects                       | Most common — you need the related document's fields |
| `2`   | Nested relationships within related documents are also populated | You need the related document's related documents    |

**Performance note:** Higher depth means more database joins. Default is `1`. Set explicitly — don't rely on the default.

### Using in Next.js Patterns

**Server component (page):**

```typescript
export default async function InsightsPage() {
  const payload = await getPayload({ config })

  const posts = await payload.find({
    collection: 'posts',
    where: { status: { equals: 'published' } },
    sort: '-publishedAt',
    limit: 12,
    depth: 1,
  })

  return <PostGrid posts={posts.docs} />
}
```

**`generateMetadata`:**

```typescript
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })

  const post = docs[0]
  if (!post) return { title: 'Not Found' }

  return {
    title: `${post.title} | SEQTEK Insights`,
    description: post.excerpt,
  }
}
```

**`generateStaticParams` (for ISR):**

```typescript
export async function generateStaticParams() {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'posts',
    where: { status: { equals: 'published' } },
    limit: 1000,
    depth: 0,
  })

  return docs.map((post) => ({ slug: post.slug }))
}
```

---

## 11. Uploads and Media

### Media Collection Config

```typescript
export const Media: CollectionConfig = {
  slug: 'media',

  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdmin,
  },

  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf'],
    imageSizes: [
      { name: 'thumbnail', width: 300, height: 300, crop: 'center' },
      { name: 'card', width: 600, height: 400, crop: 'center' },
      { name: 'hero', width: 1920, height: undefined },
    ],
    adminThumbnail: 'thumbnail',
    crop: true,
    focalPoint: true,
  },

  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      type: 'text',
    },
  ],
}
```

### S3 Storage Adapter

Configured as a plugin in `payload.config.ts`:

```typescript
import { s3Storage } from '@payloadcms/storage-s3'

plugins: [
  s3Storage({
    collections: { media: true },
    bucket: process.env.S3_BUCKET!,
    config: {
      region: process.env.S3_REGION!,
      // Uses default credential chain — no static keys needed on EC2
    },
  }),
]
```

When S3 is configured, uploads go directly to S3. The `url` field on media documents points to the S3 object URL (or the CloudFront URL in front of it).

**Local development fallback:** When S3 env vars are absent, Payload falls back to local filesystem storage automatically. No S3 credentials needed for local dev.

### Referencing Media from Other Collections

```typescript
// Single image
{
  name: 'featuredImage',
  type: 'upload',
  relationTo: 'media',
  required: true,
}

// Multiple images
{
  name: 'gallery',
  type: 'array',
  fields: [
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    { name: 'caption', type: 'text' },
  ],
}
```

### Image Sizes in Frontend

When queried with sufficient depth, media documents include all generated sizes:

```typescript
// doc.featuredImage (with depth >= 1)
{
  id: '...',
  filename: 'team-photo.jpg',
  url: 'https://s3-bucket.../team-photo.jpg',
  width: 2400,
  height: 1600,
  alt: 'SEQTEK team at Tulsa office',
  sizes: {
    thumbnail: {
      url: 'https://s3-bucket.../team-photo-300x300.jpg',
      width: 300,
      height: 300,
    },
    card: {
      url: 'https://s3-bucket.../team-photo-600x400.jpg',
      width: 600,
      height: 400,
    },
    hero: {
      url: 'https://s3-bucket.../team-photo-1920x1280.jpg',
      width: 1920,
      height: 1280,
    },
  },
}
```

Use these with `next/image`:

```tsx
import Image from 'next/image'
;<Image
  src={doc.featuredImage.sizes.hero.url}
  alt={doc.featuredImage.alt}
  width={doc.featuredImage.sizes.hero.width}
  height={doc.featuredImage.sizes.hero.height}
  priority
/>
```

---

## 12. Live Preview

Live preview lets editors see content changes rendered on the actual frontend, inside the admin panel, without saving or publishing.

### How It Works

1. Editor opens a document in the admin panel
2. Admin panel renders an iframe pointing to the frontend URL for that document
3. As the editor types, the admin panel sends the current form state to the iframe via `postMessage`
4. The frontend receives the data and re-renders in real time

### Configuration

In `payload.config.ts`:

```typescript
admin: {
  livePreview: {
    // The `url` callback receives the form state being edited — for relationship
    // fields this is the related doc's *ID*, not a populated object. Reaching
    // into `data?.someRelation?.slug` will always be undefined here. The robust
    // pattern is to point at a dedicated preview API route that resolves the
    // relations server-side (where `req.payload.findByID` is available) and
    // returns the rendered page.
    url: ({ data, collectionConfig, req }) => {
      const base = process.env.NEXT_PUBLIC_SITE_URL
      return `${base}/api/preview` +
        `?collection=${collectionConfig?.slug}` +
        `&id=${data?.id ?? ''}` +
        `&slug=${data?.slug ?? ''}`
    },
    collections: ['posts', 'case-studies', 'pages', 'services', 'workshops'],
    breakpoints: [
      { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
      { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
      { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
    ],
  },
}
```

The `/api/preview` route handler validates the user has admin access (via the Payload session cookie), looks up the document with `payload.findByID({ collection, id, depth: 2 })` so relations are populated, computes the canonical URL (e.g., `/services/${pillar.slug}/${service.slug}` for service pages), and either redirects to that URL with a draft cookie set or renders the page directly with the populated draft data. This keeps relation resolution in one place and avoids the form-state pitfall.

### Frontend Preview Component

The frontend needs a client component that listens for `postMessage` events and swaps in the live data:

```typescript
'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import type { Post } from '@/payload-types'

export function LivePreviewPost({ initialData }: { initialData: Post }) {
  const { data } = useLivePreview<Post>({
    initialData,
    serverURL: process.env.NEXT_PUBLIC_SITE_URL!,
    depth: 2,
  })

  return <PostContent post={data} />
}
```

---

## 13. Migrations

### Development vs. Production

| Environment | Strategy                                 | Config                                                  |
| ----------- | ---------------------------------------- | ------------------------------------------------------- |
| Local dev   | Push mode — auto-syncs schema on startup | `push: true` (default when `NODE_ENV !== 'production'`) |
| Production  | Explicit migrations — reviewed SQL files | `push: false`                                           |

### Creating Migrations

```bash
# Generate a migration from the diff between current schema and Payload config
npx payload migrate:create
```

This creates a timestamped migration file in `src/migrations/` with `up` and `down` functions.

### Running Migrations

```bash
# Run all pending migrations
npx payload migrate

# Check migration status
npx payload migrate:status
```

In production, migrations run on container startup before the health check passes. The Dockerfile's entrypoint should run migrations before starting the server:

```dockerfile
CMD ["sh", "-c", "npx payload migrate && node server.js"]
```

### Migration File Structure

```typescript
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE posts ADD COLUMN excerpt TEXT;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE posts DROP COLUMN excerpt;
  `)
}
```

### Blue-Green Migration Safety

As noted in the architecture review, backwards-incompatible migrations will break the old instance during blue-green deploys. Rules:

1. **Additive migrations are safe:** Adding a nullable column, adding an index, adding a new table
2. **Destructive migrations need two deploys:** First deploy adds the new column (nullable), second deploy removes the old column after all instances are updated
3. **Column renames are destructive** — treat as add-new + migrate-data + remove-old across multiple deploys

---

## 14. Admin Panel Customization

### Conditional Fields

Show/hide fields based on other field values:

```typescript
{
  name: 'linkType',
  type: 'select',
  options: [
    { label: 'Internal', value: 'internal' },
    { label: 'External', value: 'external' },
  ],
},
{
  name: 'internalPage',
  type: 'relationship',
  relationTo: 'pages',
  admin: {
    condition: (data, siblingData) => siblingData.linkType === 'internal',
  },
},
{
  name: 'externalUrl',
  type: 'text',
  admin: {
    condition: (data, siblingData) => siblingData.linkType === 'external',
  },
},
```

### Custom Field Components

Replace the default admin UI for a field with a custom React component:

```typescript
{
  name: 'color',
  type: 'text',
  admin: {
    components: {
      Field: '/src/payload/components/ColorPicker',
    },
  },
}
```

Custom components are React Server Components by default. Use `'use client'` if they need interactivity.

### Admin Sidebar Groups

Organize collections in the sidebar:

```typescript
// In each collection config
admin: {
  group: 'Content',       // Posts, case studies, workshops
}

admin: {
  group: 'Site Structure', // Pages, services, service pillars, industries
}

admin: {
  group: 'People',         // Team members, testimonials
}

admin: {
  group: 'Configuration',  // Users, categories, locations
}
```

### List View Customization

```typescript
admin: {
  useAsTitle: 'title',
  defaultColumns: ['title', 'status', 'author', 'publishedAt'],
  listSearchableFields: ['title', 'excerpt', 'content'],
  pagination: {
    defaultLimit: 25,
  },
}
```

### Description and Help Text

```typescript
{
  name: 'excerpt',
  type: 'textarea',
  admin: {
    description: '1-2 sentences for listings and meta description. Keep under 160 characters.',
    placeholder: 'A brief summary of this post...',
  },
  maxLength: 160,
}
```

---

## 15. Pre-Built Block Libraries

You don't need to build every block from scratch. These community libraries provide copy-paste Payload block configs + frontend React components:

### LayoutBlocks (layoutblocks.dev)

25 free, open-source blocks across 14 categories. Built with Next.js + Tailwind + shadcn/ui.

Available blocks: Hero (3 variants), Features (2), Content (2), CTA (2), FAQ (2), Testimonials (4), Pricing (1), Logo bars (3), Stats (1), Team (1), Newsletter (1), Contact (1), Header (1), Footer (1).

Each block includes the Payload block config and the frontend component. Copy into your project and restyle to match your brand.

### Payload Blocks (payloadblocks.dev)

Similar concept with clean, minimal design. Includes nav bars, heroes, pricing, carousels, FAQs. Ships with motion.dev animations.

### Shadcn Blocks for Payload (shadcnblocks.com)

Maps popular shadcn/ui block patterns to Payload CMS field types.

### How to Use These

1. Browse the library for a block that matches your need
2. Copy the block config into `src/payload/collections/blocks/` or inline it in your collection
3. Copy the frontend component into `src/components/sections/`
4. Restyle with your Tailwind theme tokens
5. Register the block in your collection's `blocks` field

These are starting points, not dependencies. Once copied, they're your code to modify freely.

---

## 16. Common Patterns

### Slug Auto-Generation

Payload provides a built-in slug field helper. It returns a single field (not an array) and takes an optional config object — call it as `slugField()` for defaults, or pass overrides:

```typescript
import { slugField } from 'payload'

fields: [
  { name: 'title', type: 'text', required: true },
  slugField({ useAsSlug: 'title' }), // `useAsSlug` defaults to 'title'; shown for clarity
]
```

For custom slugification (e.g., transliteration, special-character handling), pass a `slugify` function:

```typescript
import { slugField } from 'payload'
import slugify from 'slugify'

fields: [
  { name: 'title', type: 'text', required: true },
  slugField({
    useAsSlug: 'title',
    slugify: ({ valueToSlugify }) => slugify(valueToSlugify, { lower: true, strict: true }),
  }),
]
```

Or build it manually with a `beforeValidate` hook if you need behavior the helper doesn't expose (see Section 8).

### SEO Fields via Plugin

The `@payloadcms/plugin-seo` plugin adds `meta.title`, `meta.description`, and `meta.image` fields to specified collections. It also provides auto-generation from document fields:

```typescript
seoPlugin({
  collections: ['posts', 'case-studies', 'pages', 'services'],
  uploadsCollection: 'media',
  generateTitle: ({ doc }) => `${doc.title} | SEQTEK`,
  generateDescription: ({ doc }) => doc.excerpt,
})
```

### ISR Revalidation Hook

```typescript
import { revalidateTag } from 'next/cache'
import type { CollectionAfterChangeHook } from 'payload'

export const revalidateOnChange: CollectionAfterChangeHook = async ({ doc, collection, req }) => {
  const collectionSlug = collection?.slug || ''

  if (doc._status === 'published' || doc.status === 'published') {
    revalidateTag(collectionSlug)
    if (doc.slug) {
      revalidateTag(`${collectionSlug}-${doc.slug}`)
    }
  }
}
```

Attach this hook to every content collection's `afterChange`.

### Querying Published Content with Type Safety

```typescript
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Post } from '@/payload-types'

export async function getPublishedPosts(limit = 10, page = 1) {
  const payload = await getPayload({ config })

  return payload.find({
    collection: 'posts',
    where: { status: { equals: 'published' } },
    sort: '-publishedAt',
    limit,
    page,
    depth: 1,
  })
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  })

  return docs[0] || null
}
```

### Structured Data (JSON-LD)

Generate JSON-LD from Payload documents for SEO:

```typescript
export function generateArticleJsonLd(post: Post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: typeof post.author === 'object' ? post.author.name : undefined,
    },
    image: typeof post.featuredImage === 'object' ? post.featuredImage.url : undefined,
    description: post.excerpt,
  }
}
```

### Fetching Globals in Layout Components

```typescript
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const payload = await getPayload({ config })

  const [navigation, settings] = await Promise.all([
    payload.findGlobal({ slug: 'navigation' }),
    payload.findGlobal({ slug: 'site-settings' }),
  ])

  return (
    <html lang="en">
      <body>
        <Header nav={navigation} settings={settings} />
        <main>{children}</main>
        <Footer nav={navigation} settings={settings} />
      </body>
    </html>
  )
}
```
