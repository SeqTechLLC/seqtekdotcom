import type { ReactElement } from 'react'

import { cn } from '@/lib/cn'
import { boxSizes, gridSizes, RAIL, type ColumnStep } from '@/lib/layoutGeometry'

import { ReadingColumn } from '../ui/ReadingColumn'
import { ResponsiveImage } from '../ui/ResponsiveImage'
import { Section, type SectionBackground } from '../ui/Section'
import { SmartLink } from '../ui/SmartLink'

type ItemsLayout = 'grid' | 'line' | 'list' | 'tags'
type ItemsMarkers = 'none' | 'numbers' | 'custom'
type ItemsStyle = 'plain' | 'card'

interface ItemMedia {
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
  sizes?: Partial<
    Record<string, { url?: string | null; width?: number | null } | null | undefined>
  > | null
}

export interface ItemsItem {
  id?: string | null
  title: string
  body?: string | null
  marker?: string | null
  image?: ItemMedia | string | number | null
  link?: { label?: string | null; url?: string | null } | null
}

export interface ItemsProps {
  heading?: string | null
  intro?: string | null
  background?: SectionBackground | null
  layout?: ItemsLayout | null
  markers?: ItemsMarkers | null
  style?: ItemsStyle | null
  items?: ItemsItem[] | null
}

/**
 * Colour roles, by whether the band behind the block is light or dark. On the
 * light bands meaning-bearing green is `accent-strong` (DESIGN_SYSTEM §2.4, the
 * `text-accent` trap). The dark band is the one place green-500 is the right
 * choice: it clears AA there, where green-700 does not, which is why StatsBar
 * and MetricDisplay used it on the same band.
 */
interface Tone {
  marker: string
  body: string
  rule: string
  dot: string
  spine: string
  track: string
  card: string
  row: string
  chip: string
  chipLink: string
  link: string
}

const LIGHT: Tone = {
  marker: 'text-accent-strong',
  body: 'text-text-secondary',
  rule: 'border-accent-strong',
  dot: 'bg-accent-strong',
  spine: 'bg-accent',
  track: 'border-border-strong',
  card: 'border-border-subtle bg-surface shadow-xs',
  row: 'border-border-subtle bg-surface',
  chip: 'border-border-strong bg-surface-subtle text-text-secondary',
  chipLink:
    'border-border-strong bg-surface text-text-secondary hover:border-accent-strong hover:text-accent-strong',
  link: 'text-link hover:text-link-hover',
}

const DARK: Tone = {
  marker: 'text-accent',
  body: 'text-text-inverse',
  rule: 'border-accent',
  dot: 'bg-accent',
  spine: 'bg-accent',
  track: 'border-white/30',
  card: 'border-white/20 bg-white/5',
  row: 'border-white/20',
  chip: 'border-white/30 text-text-inverse',
  chipLink: 'border-white/30 text-text-inverse hover:border-accent hover:text-accent',
  link: 'text-accent hover:underline',
}

/**
 * Grid columns follow the item count, never a cap. Classes are literal so
 * Tailwind can see them, and each shape's `sizes` is derived from the same
 * column steps rather than typed (DESIGN_SYSTEM §11, `layoutGeometry`).
 */
type Shape = 'two' | 'three' | 'four' | 'fourAcross' | 'many'

const SHAPES: Record<Shape, { classes: string; columns: ReadonlyArray<ColumnStep> }> = {
  two: {
    classes: 'sm:grid-cols-2',
    columns: [
      [640, 2],
      [0, 1],
    ],
  },
  three: {
    classes: 'md:grid-cols-3',
    columns: [
      [768, 3],
      [0, 1],
    ],
  },
  four: {
    classes: 'sm:grid-cols-2',
    columns: [
      [640, 2],
      [0, 1],
    ],
  },
  // Figures are short, so four of them pair up even on a phone.
  fourAcross: {
    classes: 'grid-cols-2 lg:grid-cols-4',
    columns: [
      [1024, 4],
      [0, 2],
    ],
  },
  many: {
    classes: 'sm:grid-cols-2 lg:grid-cols-3',
    columns: [
      [1024, 3],
      [640, 2],
      [0, 1],
    ],
  },
}

const GUTTER: Record<ItemsStyle, { classes: string; gap: 6 | 8 }> = {
  plain: { classes: 'gap-x-8 gap-y-12', gap: 8 },
  card: { classes: 'gap-6', gap: 6 },
}

const shapeSizes = (shape: Shape, style: ItemsStyle): string =>
  gridSizes({ columns: SHAPES[shape].columns, gap: GUTTER[style].gap })

export const GRID_SIZES: Record<Shape, Record<ItemsStyle, string>> = {
  two: { plain: shapeSizes('two', 'plain'), card: shapeSizes('two', 'card') },
  three: { plain: shapeSizes('three', 'plain'), card: shapeSizes('three', 'card') },
  four: { plain: shapeSizes('four', 'plain'), card: shapeSizes('four', 'card') },
  fourAcross: {
    plain: shapeSizes('fourAcross', 'plain'),
    card: shapeSizes('fourAcross', 'card'),
  },
  many: { plain: shapeSizes('many', 'plain'), card: shapeSizes('many', 'card') },
}

/** A lone item sits in the reading column, which never exceeds the `sm` rail. */
export const SINGLE_SIZES = boxSizes({ cap: RAIL.sm })

function shapeFor(count: number, statLike: boolean): Shape {
  if (count === 2) return 'two'
  if (count === 3) return 'three'
  if (count === 4) return statLike ? 'fourAcross' : 'four'
  return 'many'
}

const asMedia = (value: ItemsItem['image']): ItemMedia | null =>
  typeof value === 'object' && value !== null && typeof value.url === 'string' && value.url
    ? value
    : null

const trimmed = (value: string | null | undefined): string | null => value?.trim() || null

function markerFor(markers: ItemsMarkers, item: ItemsItem, index: number): string | null {
  if (markers === 'numbers') return String(index + 1)
  if (markers === 'custom') return trimmed(item.marker)
  return null
}

/** Item titles are headings only when they head something: a body under them. */
type TitleTag = 'h2' | 'h3' | 'p'

interface Shared {
  /** The heading and intro, or null when the block has neither. */
  header: ReactElement | null
  list: ItemsItem[]
  markers: ItemsMarkers
  tone: Tone
  Title: TitleTag
}

export function Items({ heading, intro, background, layout, markers, style, items }: ItemsProps) {
  const list = (items ?? []).filter((item) => trimmed(item?.title))
  if (list.length === 0) return null

  const bg = background ?? 'none'
  const tone = bg === 'inverse' ? DARK : LIGHT
  const title = trimmed(heading)
  const lede = trimmed(intro)
  const hasBody = list.some((item) => trimmed(item.body))
  const shared: Shared = {
    header: title || lede ? <Header heading={title} intro={lede} tone={tone} /> : null,
    list,
    markers: markers ?? 'none',
    tone,
    // Under the block's h2 an item heading is an h3; with no block heading it
    // sits straight under the page h1, so it steps down one level only.
    Title: hasBody ? (title ? 'h3' : 'h2') : 'p',
  }

  switch (layout ?? 'grid') {
    case 'line':
      return (
        <Section padding="spacious" background={bg}>
          <Line {...shared} />
        </Section>
      )
    case 'list':
      return (
        <Section padding="default" background={bg}>
          <List {...shared} />
        </Section>
      )
    case 'tags':
      return (
        <Section padding="default" background={bg}>
          <Tags {...shared} />
        </Section>
      )
    default:
      return <Grid {...shared} background={bg} style={style ?? 'plain'} />
  }
}

function Header({
  heading,
  intro,
  tone,
}: {
  heading: string | null
  intro: string | null
  tone: Tone
}) {
  return (
    <>
      {heading ? <h2 className="text-h2 font-bold">{heading}</h2> : null}
      {intro ? <p className={cn('text-body-lg', heading && 'mt-4', tone.body)}>{intro}</p> : null}
    </>
  )
}

/** The title, linked when the item has an address. `stretch` makes the whole cell the target. */
function TitleText({ item, stretch }: { item: ItemsItem; stretch?: boolean }) {
  const href = trimmed(item.link?.url)
  if (!href) return <>{item.title}</>
  return (
    <SmartLink
      href={href}
      className={cn(
        'underline-offset-4 hover:underline',
        stretch && 'after:absolute after:inset-0 group-hover:underline',
      )}
    >
      {item.title}
    </SmartLink>
  )
}

/**
 * The "label →" line. The title already carries the same link, so this one is
 * kept out of the tab order and the accessibility tree: a pointer can use it, a
 * keyboard or screen reader meets the link once, on the title.
 */
function MoreLink({ item, tone, className }: { item: ItemsItem; tone: Tone; className?: string }) {
  const href = trimmed(item.link?.url)
  const label = trimmed(item.link?.label)
  if (!href || !label) return null
  return (
    <p className={cn('font-semibold', className)}>
      <SmartLink href={href} aria-hidden="true" tabIndex={-1} className={tone.link}>
        {label} →
      </SmartLink>
    </p>
  )
}

function Body({ text, tone, className }: { text?: string | null; tone: Tone; className: string }) {
  const body = trimmed(text)
  return body ? <p className={cn(className, tone.body)}>{body}</p> : null
}

// ---- grid ------------------------------------------------------------------

function Grid({
  header,
  list,
  markers,
  tone,
  Title,
  background,
  style,
}: Shared & { background: SectionBackground; style: ItemsStyle }) {
  const card = style === 'card'
  const statLike = markers === 'custom' && !list.some((item) => asMedia(item.image))
  const Tag = markers === 'numbers' ? 'ol' : 'ul'

  // One figure on its own is a headline number: centred, display size, the
  // way MetricDisplay drew it.
  if (list.length === 1 && statLike) {
    const [item] = list
    return (
      <Section padding="spacious" background={background} rail="md" innerClassName="text-center">
        {header}
        <Tag className={cn(header && 'mt-10')}>
          <li className={cn('group relative', card && cn('rounded-md border p-8', tone.card))}>
            <Title>
              <Marker value={markerFor(markers, item, 0)} tone={tone} size="text-display-xl" />
              <span className="mt-4 block text-h3 font-semibold">
                <TitleText item={item} stretch />
              </span>
            </Title>
            <Body text={item.body} tone={tone} className="mt-2 text-body" />
            <MoreLink item={item} tone={tone} className="mt-4" />
          </li>
        </Tag>
      </Section>
    )
  }

  const cells = (sizes: string) =>
    list.map((item, i) => (
      <GridCell
        key={item.id ?? i}
        item={item}
        marker={markerFor(markers, item, i)}
        card={card}
        sizes={sizes}
        tone={tone}
        Title={Title}
      />
    ))

  // A lone item is prose, not a grid: it takes the reading column.
  if (list.length === 1) {
    return (
      <Section padding="spacious" background={background}>
        <ReadingColumn>
          {header}
          <Tag className={cn(header && 'mt-10')}>{cells(SINGLE_SIZES)}</Tag>
        </ReadingColumn>
      </Section>
    )
  }

  const shape = shapeFor(list.length, statLike)
  return (
    <Section padding="spacious" background={background}>
      {header ? <ReadingColumn flush>{header}</ReadingColumn> : null}
      <Tag className={cn('grid', SHAPES[shape].classes, GUTTER[style].classes, header && 'mt-10')}>
        {cells(GRID_SIZES[shape][style])}
      </Tag>
    </Section>
  )
}

function Marker({
  value,
  tone,
  size,
}: {
  value: string | null
  tone: Tone
  size: 'text-display' | 'text-display-xl'
}) {
  if (!value) return null
  return <span className={cn('block font-bold leading-none', size, tone.marker)}>{value}</span>
}

function GridCell({
  item,
  marker,
  card,
  sizes,
  tone,
  Title,
}: {
  item: ItemsItem
  marker: string | null
  card: boolean
  sizes: string
  tone: Tone
  Title: TitleTag
}) {
  const image = asMedia(item.image)
  return (
    <li
      className={cn(
        'group relative',
        card
          ? cn('overflow-hidden rounded-md border', tone.card)
          : cn('border-t-4 pt-6', tone.rule),
      )}
    >
      {image ? (
        <ResponsiveImage
          media={image}
          sizes={sizes}
          className={cn('block aspect-[16/9] w-full object-cover', !card && 'mb-5 rounded-sm')}
        />
      ) : null}
      <div className={card ? 'p-6' : undefined}>
        <Title>
          <Marker value={marker} tone={tone} size="text-display" />
          <span className={cn('block text-h4 font-semibold', marker && 'mt-3')}>
            <TitleText item={item} stretch />
          </span>
        </Title>
        <Body text={item.body} tone={tone} className="mt-2 text-body" />
        <MoreLink item={item} tone={tone} className="mt-4" />
      </div>
    </li>
  )
}

// ---- line ------------------------------------------------------------------

/**
 * Short markers (a number, a letter) hang in a gutter joined by a rule, so read
 * top to bottom a lettered set spells its word. Anything longer — a year, a
 * date — would not fit that gutter, so it runs as a timeline instead: a dot on
 * the rule and the marker set above the title.
 */
function Line(props: Shared) {
  const marks = props.list.map((item, i) => markerFor(props.markers, item, i))
  const longest = Math.max(0, ...marks.map((m) => (m ? Array.from(m).length : 0)))
  return longest > 0 && longest <= 2 ? (
    <Spine {...props} marks={marks} />
  ) : (
    <Timeline {...props} marks={marks} />
  )
}

// One item per row down the reading column. The copy keeps the body measure
// and axis (DESIGN_SYSTEM §11.4); from `lg`, where the page has the margin for
// it, the markers hang to the left of that column instead of taking its width.
// The drawn marker is hidden from assistive tech and spoken with the title.
function Spine({ header, list, tone, Title, marks }: Shared & { marks: Array<string | null> }) {
  return (
    <ReadingColumn>
      {header}
      <ol className={cn(header && 'mt-10')}>
        {list.map((item, i) => {
          const last = i === list.length - 1
          const marker = marks[i]
          return (
            <li
              key={item.id ?? i}
              className="relative grid grid-cols-[3.5rem_1fr] gap-x-5 lg:block"
            >
              <div
                aria-hidden="true"
                className="flex flex-col items-center lg:absolute lg:inset-y-0 lg:-left-28 lg:w-20"
              >
                {marker ? (
                  <span
                    className={cn(
                      'text-display font-bold leading-none lg:text-display-xl',
                      tone.marker,
                    )}
                  >
                    {marker}
                  </span>
                ) : (
                  <span className={cn('mt-3 h-3 w-3 rounded-full lg:mt-5', tone.dot)} />
                )}
                {last ? null : (
                  <span className={cn('my-3 w-0.5 flex-1 rounded-full', tone.spine)} />
                )}
              </div>
              <div className={last ? undefined : 'pb-10 lg:pb-12'}>
                <Title className="pt-1 text-h3 font-semibold lg:pt-3">
                  {marker ? <span className="sr-only">{`${marker}. `}</span> : null}
                  <TitleText item={item} />
                </Title>
                <Body text={item.body} tone={tone} className="mt-2 text-body" />
                <MoreLink item={item} tone={tone} className="mt-3" />
              </div>
            </li>
          )
        })}
      </ol>
    </ReadingColumn>
  )
}

function Timeline({ header, list, tone, Title, marks }: Shared & { marks: Array<string | null> }) {
  return (
    <ReadingColumn>
      {header}
      {/* From `lg` the rule hangs in the margin, so the text keeps the heading's edge. */}
      <ol
        className={cn('space-y-8 border-l-2 pl-6 lg:-ml-[1.625rem]', tone.track, header && 'mt-8')}
      >
        {list.map((item, i) => {
          const marker = marks[i]
          return (
            <li key={item.id ?? i} className="relative">
              <span
                aria-hidden="true"
                className={cn('absolute -left-[1.875rem] top-2 h-3 w-3 rounded-full', tone.dot)}
              />
              <Title>
                {marker ? (
                  <span className={cn('block text-body font-bold tracking-wide', tone.marker)}>
                    {marker}
                  </span>
                ) : null}
                <span className={cn('block text-h4 font-semibold', marker && 'mt-1')}>
                  <TitleText item={item} />
                </span>
              </Title>
              <Body text={item.body} tone={tone} className="mt-2 text-body" />
              <MoreLink item={item} tone={tone} className="mt-3" />
            </li>
          )
        })}
      </ol>
    </ReadingColumn>
  )
}

// ---- list ------------------------------------------------------------------

function List(props: Shared) {
  return props.markers === 'numbers' ? <NumberedList {...props} /> : <BulletList {...props} />
}

// A numbered list reads down one column, so it keeps the reading measure.
function NumberedList({ header, list, tone, Title }: Shared) {
  const weight = Title === 'p' ? undefined : 'font-semibold'
  return (
    <ReadingColumn>
      {header}
      <ol className={cn('space-y-4', header && 'mt-8')}>
        {list.map((item, i) => (
          <li key={item.id ?? i} className="flex items-baseline gap-4">
            <span aria-hidden="true" className={cn('text-h3 font-bold', tone.marker)}>
              {i + 1}.
            </span>
            <div>
              <Title className={cn('text-body-lg', weight)}>
                <span className="sr-only">{`${i + 1}. `}</span>
                <TitleText item={item} />
              </Title>
              <Body text={item.body} tone={tone} className="mt-1 text-body" />
              <MoreLink item={item} tone={tone} className="mt-2 text-small" />
            </div>
          </li>
        ))}
      </ol>
    </ReadingColumn>
  )
}

// Bullets are short, so they take two columns once the screen has room.
function BulletList({ header, list, markers, tone, Title }: Shared) {
  const weight = Title === 'p' ? undefined : 'font-semibold'
  return (
    <>
      {header ? <ReadingColumn flush>{header}</ReadingColumn> : null}
      <ul className={cn('grid gap-3 sm:grid-cols-2', header && 'mt-6')}>
        {list.map((item, i) => {
          const marker = markerFor(markers, item, i)
          return (
            <li
              key={item.id ?? i}
              className={cn('flex items-start gap-3 rounded-md border px-4 py-3', tone.row)}
            >
              {marker ? (
                <span aria-hidden="true" className={cn('shrink-0 font-bold', tone.marker)}>
                  {marker}
                </span>
              ) : (
                <span
                  aria-hidden="true"
                  className={cn('mt-2 inline-block h-2 w-2 shrink-0 rounded-full', tone.dot)}
                />
              )}
              <div>
                <Title className={cn('text-body', weight)}>
                  {marker ? <span className="sr-only">{`${marker} `}</span> : null}
                  <TitleText item={item} />
                </Title>
                <Body text={item.body} tone={tone} className="mt-1 text-small" />
                <MoreLink item={item} tone={tone} className="mt-1 text-small" />
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}

// ---- tags ------------------------------------------------------------------

function Tags({ header, list, tone }: Shared) {
  const chip = 'inline-block rounded-full border px-4 py-1.5 text-small font-medium'
  return (
    <>
      {header ? <ReadingColumn flush>{header}</ReadingColumn> : null}
      <ul className={cn('flex flex-wrap gap-2', header && 'mt-6')}>
        {list.map((item, i) => {
          const href = trimmed(item.link?.url)
          return (
            <li key={item.id ?? i}>
              {href ? (
                <SmartLink href={href} className={cn(chip, 'transition-colors', tone.chipLink)}>
                  {item.title}
                </SmartLink>
              ) : (
                <span className={cn(chip, tone.chip)}>{item.title}</span>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}

export default Items
