# SEQTEK Website — Design System

Usage rules for the brand tokens. The values live in `tailwind.config.mjs` (ramps, type scale, radius, shadow,
motion, z-index, container widths) and in `src/app/(frontend)/styles.css` (the semantic `--color-*` variables).
When this doc and those files disagree, the files are right and this doc gets fixed. Tailwind v3 (ADR 0001).

---

## 1. Principles

1. **Brand depth, not decoration.** Four brand seeds become a working palette; no invented identity.
2. **Semantic tokens only.** Components use `text-text-primary`, `bg-surface` and the like, never raw hex, sizes
   or durations.
3. **WCAG 2.2 AA everywhere**, AAA contrast on the surfaces in §12.1.
4. **Light mode only.**

---

## 2. Color

### 2.1 Brand seeds

From the brand kit (kept outside this repo). These four values are fixed.

| Name          | Hex       | Role                                                                      |
| ------------- | --------- | ------------------------------------------------------------------------- |
| Brand Green   | `#72B94D` | Accent, illustration, the quill in the Q                                  |
| Brand Navy    | `#1F3265` | Structure: headings, dark surfaces                                        |
| Brand "Black" | `#1C1C31` | The deepest neutral, with a navy cast                                     |
| Brand White   | `#FFFFFF` | Card surface (`--color-surface-elevated`); the page itself is warm (§2.4) |

### 2.2 Ramps

`brand-green-*`, `brand-navy-*` and `neutral-*` run 50–950 in `tailwind.config.mjs`. Each seed sits where its
luminance falls: green at `500`, navy at `800`, and the brand black at `neutral-900`, so the neutrals carry the same
navy cast. For foreground green and solid green fills use `700`; `500` is decorative (§2.5).

### 2.3 State colors

`success`, `warning`, `error` and `info` at `100` / `500` / `700`. None is brand green, so a success message never
reads as a call to action.

### 2.4 Semantic tokens

Components read these, never a ramp step. Values are in `styles.css`.

| Token                                            | Purpose                                                |
| ------------------------------------------------ | ------------------------------------------------------ |
| `--color-text-primary` / `-secondary` / `-muted` | Body and headings / captions / timestamps, helper text |
| `--color-text-inverse`                           | Text on dark surfaces                                  |
| `--color-text-accent`, `--color-link` (`-hover`) | Meaning-bearing green text, links                      |
| `--color-surface`                                | The page: warm paper `#faf8f4`                         |
| `--color-surface-subtle`                         | Alternating band: `#f6f3ec`                            |
| `--color-surface-elevated`                       | Cards: white, lifting off the warm page                |
| `--color-surface-inverse` / `-accent`            | Dark sections and footer / green-50 callouts           |
| `--color-border-subtle` / `-strong` / `-focus`   | Dividers / card outlines / the focus ring (green-600)  |
| `--color-accent`                                 | Green-500, decorative only                             |
| `--color-accent-strong` / `-hover` / `-pressed`  | Solid CTA fills (green-700/800/900)                    |

**The `text-accent` trap.** Tailwind flattens the theme, so `text-accent` is `--color-accent`, green-500, which fails
AA on every light surface. Meaning-bearing green text uses `text-accent-strong` (or `text-text-accent` /
`text-link`); the same goes for `border-accent` and `bg-accent`. axe `color-contrast` on the in-scope routes is the
guard.

**Bands.** A block's `background` picks its surface through `ui/Section`: `subtle` → `surface-subtle`, `accent` →
`surface-accent`, `inverse` → `surface-inverse`, `brand` → `accent-strong`. Only `cta` offers `brand`: white on
green-700 is AA, green text on it is not. The `inverse` and `brand` bands re-point the text, link and border tokens
(`styles.css`), so a block's ordinary classes stay legible:

| Token                                             | `inverse` (`.band-dark`)  | `brand` (`.band-brand`) |
| ------------------------------------------------- | ------------------------- | ----------------------- |
| `--color-text-primary`                            | white                     | white                   |
| `--color-text-secondary` / `--color-text-muted`   | neutral-200 / neutral-300 | green-50 / green-100    |
| `--color-text-accent`, `--color-link`             | green-300                 | white                   |
| `--color-border-subtle` / `--color-border-strong` | neutral-700 / neutral-600 | white at 30% / 50%      |

`accent-strong` is not re-pointed, because it is also the button fill. A light panel inside a band (`bg-surface`,
`bg-surface-elevated`, `bg-surface-subtle`, `bg-white`) gets the page tokens back. Classes that are not tokens come
from `toneFor(background)` in `src/components/ui/tone.ts`.

### 2.5 Contrast

Floors: AA is 4.5:1 for body and 3:1 for large text and UI; AAA is 7:1 and 4.5:1. Measured with the WCAG formula:

| Text                             | White card | Page `#faf8f4` | Band `#f6f3ec` | Use                        |
| -------------------------------- | ---------- | -------------- | -------------- | -------------------------- |
| `neutral-900`                    | 16.67      | 15.71          | 15.04          | AAA: body, hero copy       |
| `navy-800`                       | 12.34      | 11.63          | 11.13          | AAA: display headings      |
| `neutral-700` / `navy-700`       | 10.58      | 9.97           | 9.55           | AAA: secondary text        |
| `navy-600`                       | 7.87       | 7.42           | 7.10           | AAA                        |
| `--color-text-muted` (`#65656f`) | 5.76       | 5.43           | 5.20           | AA body                    |
| `brand-green-700`                | 5.20       | 4.90           | 4.69           | AA body: links, green text |
| `brand-green-600`                | 3.36       | 3.17           | 3.03           | Large text and UI only     |
| `brand-green-500`                | 2.40       | 2.26           | 2.16           | Fails: decorative only     |

White text on fills: `neutral-900` 16.67, `navy-800` 12.34, `brand-green-700` 5.20 (the CTA fill), `brand-green-600`
3.36 (large only), `brand-green-500` 2.40 (never). Green-500 with `navy-800` text is 5.15. On the dark band,
`neutral-200` is 11.86 and `green-300` 9.59 against `neutral-900`.

---

## 3. Typography

### 3.1 Family

**Nunito Sans** for display and body: the open-source (SIL OFL) analogue of the brand kit's Avenir, which stays the
print face. Monospace is the system stack. The frontend layout loads it through `next/font/google` (the variable
font, normal and italic), which sets `--font-nunito-sans` on `<html>`; `--font-display` and `--font-body` build on
it. Semibold (600) is a true weight in Nunito and reads lighter than a system bold.

### 3.2 Scale

Major third (1.25×) on a 16px base. Each size token in `tailwind.config.mjs` carries its own line height, and the
large ones their tracking: `caption`, `eyebrow`, `small`, `body`, `body-lg`, `h4`, `h3`, `h2`, `h1`, `display`,
`display-xl`.

### 3.3 Usage

| Style   | Size                              | Weight | Notes                               |
| ------- | --------------------------------- | ------ | ----------------------------------- |
| Hero    | `text-display md:text-display-xl` | 700    | Every hero (`Hero.tsx`)             |
| H1      | `text-h1`                         | 700    |                                     |
| H2–H4   | `text-h2` / `text-h3` / `text-h4` | 600    |                                     |
| Lead    | `text-body-lg`                    | 500    |                                     |
| Body    | `text-body`                       | 400    |                                     |
| Small   | `text-small` / `text-caption`     | 400    | Helper text, metadata               |
| Eyebrow | `text-eyebrow`                    | —      | Uppercase; 0.75rem, 0.08em tracking |
| Code    | `font-mono text-small`            | 400    |                                     |

---

## 4. Spacing

Tailwind's default 4px scale, not overridden. Section padding is `ui/Section`'s `padding`, the same at every
breakpoint: `tight` `py-10`, `default` `py-12`, `spacious` `py-16` (the default). Horizontal padding comes from the
shell: `px-4`, `md:px-6`, `lg:px-8`.

Two sections on the same background share one gap: the second drops its top padding (`data-band`, `styles.css`), so
back-to-back `content` blocks space like headings within one body. A change of background keeps both paddings.
Rich text starts and ends flush: the first child's top margin and the last child's bottom margin are zero.

---

## 5. Radius

`rounded-sm` (4px) tags, `rounded-md` (8px) buttons and inputs, `rounded-lg` (12px) cards, `rounded-full` avatars.

## 6. Shadow

Shadows are tinted with `neutral-900`, not black. Cards rest at `shadow-xs`; linked cards lift to `shadow-sm` on
hover.

## 7. Motion

Durations `fast` (150ms) and `base` (250ms) with the `transition` easing. `prefers-reduced-motion` is handled
globally in `styles.css`; components do not check it.

## 8. Breakpoints

Tailwind defaults, mobile first.

## 9. Z-index

Use the named tokens in `tailwind.config.mjs`, never a raw number.

## 10. Component states

Button variants and their hover, active and disabled states are in `src/components/ui/Button.tsx`. Focus is the
global ring (§12.3). Form errors in `HubspotLeadForm` use Tailwind's `red-*` utilities, not the `error` state tokens.

---

## 11. Layout system

### 11.1 Containers

`ui/Container` sizes: `sm` 640px, `md` 768px (the long-form article measure), `lg` 1024px, `xl` 1280px (the shell
rail, `SHELL_RAIL`), and `full`.

### 11.2 Shell ownership

`ui/Section` owns a block's rail and padding, and `ui/Container` the page chrome's (ADR 0012).
`tests/int/layout/shellOwnership.int.spec.ts` fails a block that restates either, and a route file that names a
`container-*` token.

### 11.3 Verifying layout

Measure element boxes (`getBoundingClientRect`) at 1440 and 390 through the visual harness. Don't reason from
classes.

### 11.4 Reading column (body-copy alignment)

**Body copy is left-justified text in a block capped at the `prose` measure (65ch) and centred in its container.**
This is a hard rule.

- **Blocks own it.** Each block takes its measure from `ui/ReadingColumn`, which centres by default. Fix the wrapper
  in one block and it is fixed everywhere that block renders.
- **Keep 65ch.** Don't widen body copy past it.
- **Centre the block, not the text.** `mx-auto`, never `text-center` on body copy or headings.
- **Different widths are fine if they share one centre axis.** Mismatched widths hugging the left edge look broken.
- **A section's heading travels with its body**: inside the same `ReadingColumn`, sharing its left edge.

**Banned:** `max-w-none` on `prose` to "fill the column", and any left-aligned-to-the-shared-edge wrapper.
`ReadingColumn`'s `flush` / `flushFrom` are the only exceptions, for a column a grid has already positioned. For rich
text, pass `className="mx-auto"` to `<RichText>`. The `case-studies`, `workshops`, `team` and `partners` detail
routes, `error.tsx` and `not-found.tsx` write the measure directly.

### 11.5 Listing pages: never double-container a block

Every listing renders the `cards` block, which contains itself through `ui/Section`. A listing page must not wrap it
in a second padded container: that insets the grid from the page's own `h1`. The header uses `ui/Container`, which
reads the same `SHELL_RAIL`, never a hand-written `mx-auto max-w-container-*`.

```tsx
<div data-testid="…">
  <header className="pt-16">
    <Container>
      <h1 … />
    </Container>
  </header>
  <Cards collection="teamMembers" … />
</div>
```

A narrower column is the same owner with a size: `<Container size="md">` for `insights/[slug]`. Check it by
measuring `getBoundingClientRect().x` on the `h1` and the grid at 1440 and 390; they must match.

---

## 12. Accessibility

### 12.1 AAA targets (7:1 body, 4.5:1 large)

Hero headlines and subheadlines. On the `cover` hero, a navy-900 scrim at 80% keeps white text above 8:1 over any
photo. Use `neutral-900` for body and `navy-800` for display here; no mid-tone greys.

### 12.2 AA targets

Everything else: all body copy, UI components and interactive states. §2.5 is the reference.

### 12.3 Focus indicators

A global `:focus-visible` outline: 2px, offset 2px, `--color-border-focus` (green-600), at least 3:1 against what it
sits on. It is 4.96:1 on the dark band. The `cover` hero switches to green-400, and the `brand` band re-points the
ring to white (5.2:1 on green-700).

### 12.4 Touch targets

WCAG 2.2 AA (2.5.8) requires 24×24 CSS px; aim for 44×44 on mobile. The header CTA is a `sm` button, 36px tall.

### 12.5 Motion

Reduced motion is honoured globally (§7). No autoplaying audio and no parallax. The gallery `carousel` is a
scroll-snap row the reader moves; it never autoplays.

### 12.6 Color independence

Never convey information by colour alone; pair it with text or an icon.

### 12.7 Skip link

`SkipToContent` is the first focusable element and jumps to `#main` (BLOCK_LIBRARY §4).

---

## 13. Logo and brand mark

Logo files come from the brand kit, the only source for the wordmark: no recreations, no traces. Rules marked
**(brand kit)** are quoted from it; the rest are this site's conventions.

### 13.1 Spelling — non-negotiable

**(brand kit)** SEQTEK is **always all caps**, never `SeqTek`, `Seqtek` or `Seqtech`. That covers visible copy,
`<title>` and meta tags, alt text, ARIA labels, structured data (`Organization.name`) and every user-facing string. No
automated check enforces it.

### 13.2 Variants

`public/brand/` holds four PNGs; filenames match the brand kit.

| Variant                     | Asset                                               | Use                          |
| --------------------------- | --------------------------------------------------- | ---------------------------- |
| Black wordmark with tagline | `Black Logo-Transparent.png`                        | Light surfaces               |
| Black wordmark, no tagline  | `Black-logo-w-o-tagline-transparent-background.png` | Light surfaces, below ~120px |
| White wordmark with tagline | `White SEQTEK Logo-Transparent.png`                 | Dark surfaces and imagery    |
| White wordmark, no tagline  | `White-logo-w-o-tagline-transparent-background.png` | Dark surfaces; the footer    |

The brand kit's Q-only mark is not among the supplied files. The site's favicon (`src/app/favicon.ico`,
`src/app/icon.png`) is the Q mark extracted from the wordmark (PR #48).

### 13.3 Tagline

**(brand kit)** "Delivering Transformative Technologies Since 1999", always with "Since 1999". The footer sets it
as text under the no-tagline wordmark; it stays out of the header and anywhere the wordmark renders below ~120px.

### 13.4 Clearspace and minimum size

Clearspace equals the cap height of the "S" on every side. Minimum width is 96px for the wordmark and 200px with
the tagline.

### 13.5 Backgrounds

Black wordmark on light surfaces; white on `surface-inverse`, navy and dark imagery. On a photograph, put a navy
scrim under the white wordmark. Keep the logo off green.

### 13.6 Don't

Recolour, filter, distort, rebuild or trace the wordmark; place it where it falls under 3:1; crop the Q out of it
for a standalone icon; or alter the tagline.

### 13.7 Implementation

The header uses the black wordmark without tagline, and the footer the white wordmark with it; both `alt` texts are
the company name, SEQTEK.
