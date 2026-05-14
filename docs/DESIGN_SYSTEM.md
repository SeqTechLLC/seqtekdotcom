# SEQTEK Website — Design System

**Date:** 2026-05-14
**Status:** Design — Pre-Implementation
**Depends on:** Brand kit (`brandkit/brandkit.pdf`), `BRAND_STRATEGY_RESEARCH.md`
**Blocked on:** BR-2 (web font licensing decision — see ROADMAP.md)

The foundation tokens for the SEQTEK website. Everything here flows into a single Tailwind v4 `@theme` block (§13) that the application reads. Source of truth — when this doc and a Tailwind config disagree, this doc wins.

---

## 1. Principles

1. **Brand depth, not brand decoration.** The brand kit gives us four colors, a logo, and a wordmark. The design system multiplies that into a working palette without inventing visual identity that isn't ours.
2. **Content is the conversion asset.** Case studies, service pages, and blog posts are content-dense. The type scale, line height, and spacing rhythms favor scanability over hero drama. (See `BRAND_STRATEGY_RESEARCH.md` §2 — Hinge findings on content as the top growth lever.)
3. **Trust by detail.** Per WCAG 2.2 AA minimum, with AAA contrast on hero copy where the first impression is set. Real photography over stock. Full-attribution components over anonymous ones. Type metrics tuned for actual reading.
4. **One source of truth.** Tailwind v4's `@theme` block is the published API. Component code reads tokens via utility classes (`text-text-primary`, `bg-accent`); component code does not hardcode hex values, sizes, or durations.
5. **Light mode is v1 scope.** Dark mode and high-contrast mode are deferred per ROADMAP.md (D-1 decision). When added later, semantic tokens are the swap point — primitives don't change.

---

## 2. Color

### 2.1 Brand seeds

From the official brand kit (`brandkit/brandkit.pdf`), four immutable values:

| Name | Hex | Role |
|---|---|---|
| Brand Green | `#72B94D` | Accent, calls-to-action, illustration highlights, the quill in the Q |
| Brand Navy | `#1F3265` | Foundational structural color — headings, primary text, dark surfaces |
| Brand "Black" | `#1C1C31` | Near-black with slight navy cast. Used as the deepest neutral. |
| Brand White | `#FFFFFF` | Canonical surface |

These four values may not be edited. The ramps in §2.2 are extrapolated *around* them so the brand seeds keep their named positions inside the system.

### 2.2 Color ramps

Algorithmic 50–950 ramps generated from the brand seeds. Where the brand seed naturally falls (by luminance) is where it sits in the ramp — we don't force every brand color to "500."

#### Brand Green (`brand-green-*`)

Seed at `500`. Mid-saturation, mid-luminance — natural fit.

| Step | Hex | Use |
|---|---|---|
| `50` | `#F3F9EC` | Subtle accent backgrounds (success-ish surface, callouts) |
| `100` | `#E3F1D4` | Hover backgrounds for green-tinted controls |
| `200` | `#C8E3AB` | Light dividers, illustration fills |
| `300` | `#A4D27A` | Light accent backgrounds (sparing) |
| `400` | `#88C45F` | Lighter accent for hover states above 500 |
| `500` | `#72B94D` | **Brand seed.** Primary accent color, link rest, the quill highlight. |
| `600` | `#5A9C3B` | Primary button background paired with white text (AA large, see §2.5). Focus rings on light backgrounds. |
| `700` | `#46792F` | Primary button background paired with white text (passes AA for body). Pressed/active state. |
| `800` | `#355B24` | Dark accent for inverse surfaces |
| `900` | `#243F19` | Reserved for compositing |
| `950` | `#142410` | Reserved |

#### Brand Navy (`brand-navy-*`)

Seed at `800`. The brand navy is dark — anchoring it at 800 leaves room for lighter navy steps that the design will actually use (mute headings, dark UI chrome).

| Step | Hex | Use |
|---|---|---|
| `50` | `#F0F3FA` | Cool surface tint |
| `100` | `#DDE4F1` | Subtle dividers, badge backgrounds |
| `200` | `#BCCAE0` | Disabled control surfaces |
| `300` | `#94A8CC` | Light navy text on light surfaces (decorative only, fails body contrast) |
| `400` | `#6C83B3` | Decorative accents |
| `500` | `#4A648F` | Secondary structural color (e.g., section dividers on dark backgrounds) |
| `600` | `#3A527A` | Body text on light surfaces (passes AA body) |
| `700` | `#2C3F60` | Headings (passes AAA body — see §2.5) |
| `800` | `#1F3265` | **Brand seed.** Deep navy — display copy, dark sections, footer background. |
| `900` | `#131E3D` | Inverse surface background (alternative to neutral-900) |
| `950` | `#0A1224` | Reserved |

#### Neutrals (`neutral-*`)

Seeded from the brand "Black" `#1C1C31` so the neutral ramp carries the same faint navy cast as the brand foundation. The site reads cohesive even where no brand color is visible.

| Step | Hex | Use |
|---|---|---|
| `0` | `#FFFFFF` | Canonical surface |
| `50` | `#F7F7F8` | Subtle surface (alternating sections, code blocks) |
| `100` | `#EDEDF0` | Dividers, input borders rest |
| `200` | `#D9D9DF` | Strong dividers, disabled outlines |
| `300` | `#BABABF` | Placeholder text (large only — fails body) |
| `400` | `#93939C` | Disabled text |
| `500` | `#6E6E7A` | Muted text (timestamps, metadata) — passes AA body |
| `600` | `#54545D` | Secondary body text — passes AA body |
| `700` | `#3E3E47` | Body text alternate (when navy-700 is too cool) |
| `800` | `#2A2A32` | Strong text |
| `900` | `#1C1C31` | **Brand seed.** Primary text, headings, dark surfaces. |
| `950` | `#0E0E1A` | Reserved compositing |

### 2.3 State colors

Semantic state colors are intentionally *not* brand-green, so a success message never gets confused with a primary CTA.

| State | 100 (surface) | 500 (foreground) | 700 (strong) |
|---|---|---|---|
| `success` | `#D1FAE5` | `#10B981` | `#047857` |
| `warning` | `#FEF3C7` | `#F59E0B` | `#B45309` |
| `error` | `#FEE2E2` | `#EF4444` | `#B91C1C` |
| `info` | `#DBEAFE` | `#3B82F6` | `#1D4ED8` |

These are de-saturated enough to coexist with brand colors without competing for attention. `info-500` is cooler than brand navy by design — they should never share a viewport without semantic distinction.

### 2.4 Semantic tokens

The site is built against semantic tokens, not raw ramps. A component reads `text-text-primary`; never `text-neutral-900`. This is the swap layer.

| Token | Default value | Purpose |
|---|---|---|
| `--color-text-primary` | `neutral-900` | Primary text — body, headings |
| `--color-text-secondary` | `neutral-700` | Secondary text — captions, metadata-with-weight |
| `--color-text-muted` | `neutral-500` | De-emphasized text — timestamps, helper text |
| `--color-text-inverse` | `neutral-0` | Text on dark backgrounds |
| `--color-text-accent` | `brand-green-700` | Inline accent text |
| `--color-link` | `brand-green-700` | Default link color (passes AA body on white) |
| `--color-link-hover` | `brand-green-800` | Link hover |
| `--color-surface` | `neutral-0` | Default surface |
| `--color-surface-subtle` | `neutral-50` | Alternating section background |
| `--color-surface-elevated` | `neutral-0` | Card surface (paired with shadow) |
| `--color-surface-inverse` | `neutral-900` | Dark sections, footer |
| `--color-surface-accent` | `brand-green-50` | Highlight callouts |
| `--color-border-subtle` | `neutral-100` | Dividers, default input borders |
| `--color-border-strong` | `neutral-200` | Pronounced dividers, card outlines |
| `--color-border-focus` | `brand-green-600` | Focus indicator ring |
| `--color-accent` | `brand-green-500` | Brand accent (the quill green) |
| `--color-accent-strong` | `brand-green-700` | Solid CTA backgrounds, badges |
| `--color-accent-hover` | `brand-green-800` | Hover for solid accent backgrounds |
| `--color-accent-pressed` | `brand-green-900` | Pressed state for solid accent backgrounds |

### 2.5 Contrast pairs reference

WCAG 2.2 floor compliance (AA: 4.5:1 body, 3:1 large/UI) for general site content. AAA (7:1 body, 4.5:1 large) for hero copy specifically — see §12 for the page-by-page list.

Verified pairings on white (`#FFFFFF`) background:

| Text color | Contrast vs white | Use for |
|---|---|---|
| `neutral-900` (`#1C1C31`) | 16.4:1 | AAA — hero copy, primary body |
| `neutral-700` (`#3E3E47`) | 10.0:1 | AAA — secondary text |
| `navy-800` (`#1F3265`) | 11.6:1 | AAA — display headings |
| `navy-700` (`#2C3F60`) | 8.8:1 | AAA — H1/H2 |
| `navy-600` (`#3A527A`) | 5.7:1 | AA body — alternative body color |
| `neutral-500` (`#6E6E7A`) | 4.8:1 | AA body — muted text minimum |
| `brand-green-700` (`#46792F`) | 5.6:1 | AA body — inline links |
| `brand-green-600` (`#5A9C3B`) | 3.9:1 | AA large only — large accent text, never body |

Verified pairings for white text on a colored background (for buttons, badges, dark sections):

| Background | Contrast vs white | Use |
|---|---|---|
| `neutral-900` (`#1C1C31`) | 16.4:1 | AAA — inverse hero |
| `navy-800` (`#1F3265`) | 11.6:1 | AAA — primary dark button (recommended for primary CTAs) |
| `navy-700` (`#2C3F60`) | 8.8:1 | AAA — alternate dark button |
| `brand-green-700` (`#46792F`) | 5.6:1 | AA body — green CTA background ("Take the Assessment" etc.) |
| `brand-green-600` (`#5A9C3B`) | 3.9:1 | AA large only — large CTA buttons (≥18pt or 14pt bold) |
| `brand-green-500` (`#72B94D`) | 2.5:1 | **Fails AA.** Never use as button background with white text — pair with navy text instead, or use 600/700 with white. |

**Important pattern:** the brand green at `500` is too light for white text. Solid green CTAs use `brand-green-700` for body sizes, `brand-green-600` for large sizes. Alternatively, the brand-green-500 background with navy text (`navy-800`) yields ~4.4:1 — passes AA large only. Document this everywhere a "green button" appears.

---

## 3. Typography

### 3.1 Families

| Role | Family | Notes |
|---|---|---|
| Display + UI | `Inter` | Web placeholder pending BR-2 resolution. Modern geometric sans with a wide weight range; closest free analogue to Avenir's tone. Self-hosted in `/public/fonts/` per ARCHITECTURE.md §1. |
| Body | `Inter` | Same family used throughout for cohesion. |
| Monospace | `ui-monospace, 'SF Mono', 'Roboto Mono', monospace` | System stack — no custom mono font loaded. Used in code blocks only. |

**BR-2 dependency:** Avenir Book is the brand font but it is paid and cannot ship in a public repo. Once BR-2 resolves (purchase Avenir web license vs select a free alternative vs designate Avenir for print only), this section changes by one CSS variable. Component code is family-agnostic via `--font-display` and `--font-body`.

### 3.2 Type scale — major-third (1.25×)

Base body size is `1rem` = `16px`. Each step multiplies by 1.25.

| Token | Size | Pixels | Use |
|---|---|---|---|
| `text-caption` | `0.75rem` | 12 | Caption, timestamps, footnotes |
| `text-small` | `0.8125rem` | 13 | Helper text, dense metadata |
| `text-body` | `1rem` | 16 | Body copy, default UI text |
| `text-body-lg` | `1.125rem` | 18 | Lead paragraphs, intro copy |
| `text-h4` | `1.25rem` | 20 | Card titles, small section labels |
| `text-h3` | `1.5625rem` | 25 | Subsection headings |
| `text-h2` | `1.953rem` | 31 | Section headings |
| `text-h1` | `2.441rem` | 39 | Page titles |
| `text-display` | `3.052rem` | 49 | Hero headlines on most pages |
| `text-display-xl` | `3.815rem` | 61 | Homepage / About hero only |

Rounded to 3 decimal places where the math doesn't land cleanly; rendered pixels rounded by the browser.

### 3.3 Line heights

Line heights tighten as type size grows — display copy at 1.6 line-height looks limp; body at 1.15 is unreadable.

| Token | Value | Pair with |
|---|---|---|
| `leading-display` | `1.1` | `text-display`, `text-display-xl` |
| `leading-h1` | `1.15` | `text-h1` |
| `leading-h2` | `1.2` | `text-h2` |
| `leading-h3` | `1.25` | `text-h3` |
| `leading-h4` | `1.3` | `text-h4` |
| `leading-body` | `1.6` | `text-body`, `text-body-lg` |
| `leading-small` | `1.5` | `text-small`, `text-caption` |

### 3.4 Weights

Inter is loaded in four weights to keep the network payload small:

| Token | Weight | Use |
|---|---|---|
| `font-regular` | 400 | Body copy default |
| `font-medium` | 500 | Lead paragraphs, button labels |
| `font-semibold` | 600 | H4, H3, H2 |
| `font-bold` | 700 | H1, display, emphatic inline (`<strong>`) |

`font-display` style attribute is `swap` (per ARCHITECTURE.md §7) — fallback system font renders immediately while Inter loads.

### 3.5 Letter spacing

| Token | Value | Use |
|---|---|---|
| `tracking-tight` | `-0.02em` | Display + h1 (large type benefits from slight negative tracking) |
| `tracking-normal` | `0` | Body, h2–h4 |
| `tracking-wide` | `0.025em` | All-caps eyebrows, labels |

### 3.6 Usage matrix

| Style | Family | Size | Weight | Line height | Tracking |
|---|---|---|---|---|---|
| Display XL (homepage hero) | display | `text-display-xl` | 700 | `leading-display` | `tracking-tight` |
| Display (page heroes) | display | `text-display` | 700 | `leading-display` | `tracking-tight` |
| H1 | display | `text-h1` | 700 | `leading-h1` | `tracking-tight` |
| H2 | display | `text-h2` | 600 | `leading-h2` | normal |
| H3 | display | `text-h3` | 600 | `leading-h3` | normal |
| H4 | display | `text-h4` | 600 | `leading-h4` | normal |
| Lead | body | `text-body-lg` | 500 | `leading-body` | normal |
| Body | body | `text-body` | 400 | `leading-body` | normal |
| Small | body | `text-small` | 400 | `leading-small` | normal |
| Caption | body | `text-caption` | 400 | `leading-small` | normal |
| Eyebrow | body | `text-caption` | 600 | `leading-small` | `tracking-wide` (uppercase) |
| Button label | body | `text-body` | 500 | `1` | normal |
| Code | mono | `text-small` | 400 | `leading-small` | normal |

---

## 4. Spacing

Tailwind's default 4px base. We don't override the scale — fighting Tailwind's spacing primitive creates friction with every component, plugin, and third-party block library. Standard tokens (`space-0`, `space-1`, …, `space-96`) are used directly.

Section rhythm convention (vertical padding on `<Section>`):

| Token | Mobile (top + bottom) | Desktop (top + bottom) | Use |
|---|---|---|---|
| `section-tight` | `space-12` (48px) | `space-16` (64px) | Compact sections in dense pages |
| `section-default` | `space-16` (64px) | `space-24` (96px) | Default content rhythm |
| `section-spacious` | `space-20` (80px) | `space-32` (128px) | Hero sections, major breathing moments |

These are component-level conventions, not Tailwind custom values.

---

## 5. Radius

| Token | Value | Use |
|---|---|---|
| `radius-sm` | `0.25rem` (4px) | Tags, badges, inline pills |
| `radius-md` | `0.5rem` (8px) | Buttons, inputs, small cards |
| `radius-lg` | `0.75rem` (12px) | Cards, image containers |
| `radius-xl` | `1rem` (16px) | Hero card frames, prominent surfaces |
| `radius-2xl` | `1.5rem` (24px) | Large feature panels |
| `radius-full` | `9999px` | Avatars, circular icon buttons |

---

## 6. Shadow / elevation

Shadows use the brand `neutral-900` tint (rather than pure black) so elevation feels cohesive with the cool-cast neutral palette. Calibrated for a content site — sparing use, no SaaS-app deep shadows.

| Token | Value | Use |
|---|---|---|
| `shadow-xs` | `0 1px 2px 0 rgb(28 28 49 / 0.04)` | Subtle separation (input rest state) |
| `shadow-sm` | `0 1px 3px 0 rgb(28 28 49 / 0.06), 0 1px 2px -1px rgb(28 28 49 / 0.05)` | Default card lift |
| `shadow-md` | `0 4px 6px -1px rgb(28 28 49 / 0.08), 0 2px 4px -2px rgb(28 28 49 / 0.06)` | Hover state for interactive cards |
| `shadow-lg` | `0 10px 15px -3px rgb(28 28 49 / 0.10), 0 4px 6px -4px rgb(28 28 49 / 0.08)` | Dropdowns, popovers |
| `shadow-xl` | `0 20px 25px -5px rgb(28 28 49 / 0.12), 0 8px 10px -6px rgb(28 28 49 / 0.10)` | Modal dialogs, max elevation |

---

## 7. Motion

Calibrated to feel responsive but not theatrical. Respects `prefers-reduced-motion: reduce` everywhere — when set, durations collapse to `1ms` and easing becomes `linear` (effectively disabling animation).

### 7.1 Durations

| Token | Value | Use |
|---|---|---|
| `duration-fast` | `150ms` | Hover state changes, focus rings, micro-interactions |
| `duration-base` | `250ms` | Default transitions — most state changes |
| `duration-slow` | `400ms` | Modal/drawer enter, large layout shifts |

### 7.2 Easings

| Token | Value | Use |
|---|---|---|
| `ease-entrance` | `cubic-bezier(0.16, 1, 0.3, 1)` (out-expo) | Elements entering the viewport, modal slide-ins |
| `ease-transition` | `cubic-bezier(0.4, 0, 0.2, 1)` (in-out) | State changes, hover, color/opacity transitions |
| `ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` (in-quad) | Elements leaving (faster snap-out feel) |

### 7.3 Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
    scroll-behavior: auto !important;
  }
}
```

Applied in `globals.css`. Component code does not need to check the media query — the global override handles it.

---

## 8. Breakpoints

Tailwind defaults. No customization. Matching the framework reduces friction with every third-party block library (BLOCK_LIBRARY.md §15 reference).

| Token | Min-width | Notional device |
|---|---|---|
| (default) | 0 | Mobile |
| `sm` | 640px | Large mobile / small tablet |
| `md` | 768px | Tablet |
| `lg` | 1024px | Laptop |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Wide desktop |

Mobile-first by default. Components style for mobile, then layer larger breakpoints.

---

## 9. Z-index

A short, deliberate scale. Components should never use raw numbers — only these named tokens.

| Token | Value | Use |
|---|---|---|
| `z-base` | `0` | Default |
| `z-elevated` | `10` | Hovered cards, raised content |
| `z-dropdown` | `100` | Select dropdowns, popovers |
| `z-sticky` | `200` | Sticky header, scroll-to-top button |
| `z-overlay` | `1000` | Page overlay/scrim |
| `z-modal` | `1100` | Modal dialogs |
| `z-toast` | `1200` | Toast notifications |
| `z-tooltip` | `1300` | Tooltips (highest — always on top) |

---

## 10. Component state tokens

Patterns every interactive component implements. Documented here so primitives don't reinvent the wheel.

### 10.1 Button states

| State | Background | Text | Border | Shadow |
|---|---|---|---|---|
| Rest (primary) | `accent-strong` (green-700) | `text-inverse` | none | `shadow-xs` |
| Hover (primary) | `accent-hover` (green-800) | `text-inverse` | none | `shadow-sm` |
| Pressed (primary) | `accent-pressed` (green-900) | `text-inverse` | none | none |
| Focus (primary) | `accent-strong` | `text-inverse` | `2px solid border-focus` (offset 2px) | `shadow-xs` |
| Disabled (primary) | `neutral-200` | `text-muted` | none | none |

Secondary buttons invert: navy-700 background, white text, with a hover shift to navy-800. Ghost buttons use transparent background with `border-strong` outline and `text-primary` text.

### 10.2 Input states

| State | Background | Border | Text |
|---|---|---|---|
| Rest | `surface` | `border-subtle` | `text-primary` |
| Hover | `surface` | `border-strong` | `text-primary` |
| Focus | `surface` | `2px solid border-focus` (replacing 1px) | `text-primary` |
| Error | `surface` | `2px solid error-500` | `text-primary` (with `error-700` helper text below) |
| Disabled | `neutral-50` | `border-subtle` | `text-muted` |

### 10.3 Card states

| State | Background | Border | Shadow |
|---|---|---|---|
| Rest | `surface-elevated` | `border-subtle` | `shadow-sm` |
| Hover (interactive only) | `surface-elevated` | `border-strong` | `shadow-md` |

Non-interactive cards do not change on hover.

### 10.4 Focus indicator (universal)

Per WCAG 2.2 §2.4.11 (focus appearance):
- Minimum 2px solid outline
- Minimum 3:1 contrast with adjacent colors
- 2px offset from the focused element
- Visible on all interactive elements via `:focus-visible`
- Color: `border-focus` (brand-green-600) on light surfaces; `brand-green-400` on dark surfaces (verified contrast against `surface-inverse`)

Applied globally:

```css
:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}
```

Component code does not re-implement focus styling unless overriding for a specific contrast reason (and that override must also meet the 3:1 minimum).

---

## 11. Layout system

### 11.1 Containers

| Token | Max-width | Use |
|---|---|---|
| `container-sm` | `640px` | Long-form reading (blog posts) |
| `container-md` | `768px` | Standard content (about, services) |
| `container-lg` | `1024px` | Media-heavy (case study with images) |
| `container-xl` | `1280px` | Default site container — most pages |
| `container-full` | `100%` | Full-bleed sections (hero backgrounds, footer) |

Horizontal padding: `space-4` (16px) at mobile, `space-6` (24px) at `md`, `space-8` (32px) at `lg+`. Applied in the `<Container>` primitive (BLOCK_LIBRARY.md §3).

### 11.2 Grid

12-column responsive grid available via Tailwind utilities (`grid-cols-12`). Most marketing layouts will use Flexbox or simpler grids (`grid-cols-3`, `grid-cols-4`) — the 12-col is there when complex column spans are needed (case study sidebar layouts).

### 11.3 Section rhythm

Per §4, three section padding tokens (`section-tight`, `section-default`, `section-spacious`). `<Section>` primitive in BLOCK_LIBRARY.md §3 accepts a `padding` prop that maps to these.

---

## 12. Accessibility specs

WCAG 2.2 AA minimum across the site, with AAA contrast on specific high-impact surfaces.

### 12.1 AAA targets (must hit 7:1 body / 4.5:1 large)

- Homepage hero headline + subhead
- About landing hero
- Our Story (`/about/our-story`) hero
- Service pillar hero headlines (3 pages)
- Case study hero metric callouts

For these, body uses `neutral-900` (16.4:1 on white), display uses `navy-800` (11.6:1 on white). No design freedom to use mid-tone grays in these zones.

### 12.2 AA targets (must hit 4.5:1 body / 3:1 large + UI)

Everywhere else. All body copy, all UI components, all interactive states. The §2.5 contrast pair list is the operational reference.

### 12.3 Focus indicators

- Visible on every interactive element via `:focus-visible` (so keyboard users see focus; mouse users don't get the ring polluting hover state)
- 2px outline minimum
- 3:1 contrast against adjacent colors
- 2px offset

### 12.4 Touch targets

- Minimum 44×44 CSS pixels for any interactive element on mobile (per WCAG 2.2 §2.5.8 / Apple HIG / Material Design)
- Applies to buttons, links, form inputs, checkboxes, radio buttons, navigation items
- Visual element can be smaller as long as the hit area (padding) brings it to 44×44

### 12.5 Motion and animation

- All animation respects `prefers-reduced-motion: reduce` (see §7.3)
- No autoplay video with audio
- No parallax effects (per Nielsen Norman Group accessibility guidance; also a performance liability)
- Carousels (testimonial carousel) require manual advancement OR pause-on-focus + pause-on-reduced-motion

### 12.6 Color independence

No information conveyed by color alone. Error states pair color with an icon and text label. Status pills use both color and a leading dot/icon.

### 12.7 Skip link

`<SkipToContent>` is the first focusable element in `<body>`. Per BLOCK_LIBRARY.md §4 — visually hidden until focused, jumps to `#main`.

---

## 13. Tailwind v4 `@theme` block

The copy-pasteable deliverable. Lives in `src/styles/globals.css` per ARCHITECTURE.md §4. Component code reads via Tailwind utility classes; no hex values appear outside this block.

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  /* ─────────────────────────────────────────────────────
   * BRAND GREEN — accent palette
   * ───────────────────────────────────────────────────── */
  --color-brand-green-50:  #f3f9ec;
  --color-brand-green-100: #e3f1d4;
  --color-brand-green-200: #c8e3ab;
  --color-brand-green-300: #a4d27a;
  --color-brand-green-400: #88c45f;
  --color-brand-green-500: #72b94d;  /* brand seed */
  --color-brand-green-600: #5a9c3b;
  --color-brand-green-700: #46792f;
  --color-brand-green-800: #355b24;
  --color-brand-green-900: #243f19;
  --color-brand-green-950: #142410;

  /* ─────────────────────────────────────────────────────
   * BRAND NAVY — structural palette (seed at 800)
   * ───────────────────────────────────────────────────── */
  --color-brand-navy-50:  #f0f3fa;
  --color-brand-navy-100: #dde4f1;
  --color-brand-navy-200: #bccae0;
  --color-brand-navy-300: #94a8cc;
  --color-brand-navy-400: #6c83b3;
  --color-brand-navy-500: #4a648f;
  --color-brand-navy-600: #3a527a;
  --color-brand-navy-700: #2c3f60;
  --color-brand-navy-800: #1f3265;  /* brand seed */
  --color-brand-navy-900: #131e3d;
  --color-brand-navy-950: #0a1224;

  /* ─────────────────────────────────────────────────────
   * NEUTRALS — navy-tinted cool cast (seed at 900)
   * ───────────────────────────────────────────────────── */
  --color-neutral-0:   #ffffff;
  --color-neutral-50:  #f7f7f8;
  --color-neutral-100: #ededf0;
  --color-neutral-200: #d9d9df;
  --color-neutral-300: #bababf;
  --color-neutral-400: #93939c;
  --color-neutral-500: #6e6e7a;
  --color-neutral-600: #54545d;
  --color-neutral-700: #3e3e47;
  --color-neutral-800: #2a2a32;
  --color-neutral-900: #1c1c31;  /* brand seed ("Black") */
  --color-neutral-950: #0e0e1a;

  /* ─────────────────────────────────────────────────────
   * STATE COLORS
   * ───────────────────────────────────────────────────── */
  --color-success-100: #d1fae5;
  --color-success-500: #10b981;
  --color-success-700: #047857;
  --color-warning-100: #fef3c7;
  --color-warning-500: #f59e0b;
  --color-warning-700: #b45309;
  --color-error-100:   #fee2e2;
  --color-error-500:   #ef4444;
  --color-error-700:   #b91c1c;
  --color-info-100:    #dbeafe;
  --color-info-500:    #3b82f6;
  --color-info-700:    #1d4ed8;

  /* ─────────────────────────────────────────────────────
   * SEMANTIC TOKENS — what component code actually reads
   * ───────────────────────────────────────────────────── */
  --color-text-primary:    var(--color-neutral-900);
  --color-text-secondary:  var(--color-neutral-700);
  --color-text-muted:      var(--color-neutral-500);
  --color-text-inverse:    var(--color-neutral-0);
  --color-text-accent:     var(--color-brand-green-700);
  --color-link:            var(--color-brand-green-700);
  --color-link-hover:      var(--color-brand-green-800);

  --color-surface:          var(--color-neutral-0);
  --color-surface-subtle:   var(--color-neutral-50);
  --color-surface-elevated: var(--color-neutral-0);
  --color-surface-inverse:  var(--color-neutral-900);
  --color-surface-accent:   var(--color-brand-green-50);

  --color-border-subtle: var(--color-neutral-100);
  --color-border-strong: var(--color-neutral-200);
  --color-border-focus:  var(--color-brand-green-600);

  --color-accent:         var(--color-brand-green-500);
  --color-accent-strong:  var(--color-brand-green-700);
  --color-accent-hover:   var(--color-brand-green-800);
  --color-accent-pressed: var(--color-brand-green-900);

  /* ─────────────────────────────────────────────────────
   * TYPOGRAPHY
   * ───────────────────────────────────────────────────── */
  --font-display: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-body:    'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-mono:    ui-monospace, 'SF Mono', 'Roboto Mono', monospace;

  /* Type scale — major-third (1.25×) from 16px base */
  --text-caption:    0.75rem;
  --text-small:      0.8125rem;
  --text-body:       1rem;
  --text-body-lg:    1.125rem;
  --text-h4:         1.25rem;
  --text-h3:         1.5625rem;
  --text-h2:         1.953rem;
  --text-h1:         2.441rem;
  --text-display:    3.052rem;
  --text-display-xl: 3.815rem;

  /* Line heights */
  --leading-display: 1.1;
  --leading-h1:      1.15;
  --leading-h2:      1.2;
  --leading-h3:      1.25;
  --leading-h4:      1.3;
  --leading-body:    1.6;
  --leading-small:   1.5;

  /* Letter spacing */
  --tracking-tight:  -0.02em;
  --tracking-normal: 0;
  --tracking-wide:   0.025em;

  /* Weights — Inter only loads these four to keep payload tight */
  --font-weight-regular:  400;
  --font-weight-medium:   500;
  --font-weight-semibold: 600;
  --font-weight-bold:     700;

  /* ─────────────────────────────────────────────────────
   * RADIUS
   * ───────────────────────────────────────────────────── */
  --radius-sm:   0.25rem;
  --radius-md:   0.5rem;
  --radius-lg:   0.75rem;
  --radius-xl:   1rem;
  --radius-2xl:  1.5rem;
  --radius-full: 9999px;

  /* ─────────────────────────────────────────────────────
   * SHADOWS — neutral-900 tinted
   * ───────────────────────────────────────────────────── */
  --shadow-xs: 0 1px 2px 0 rgb(28 28 49 / 0.04);
  --shadow-sm: 0 1px 3px 0 rgb(28 28 49 / 0.06), 0 1px 2px -1px rgb(28 28 49 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(28 28 49 / 0.08), 0 2px 4px -2px rgb(28 28 49 / 0.06);
  --shadow-lg: 0 10px 15px -3px rgb(28 28 49 / 0.10), 0 4px 6px -4px rgb(28 28 49 / 0.08);
  --shadow-xl: 0 20px 25px -5px rgb(28 28 49 / 0.12), 0 8px 10px -6px rgb(28 28 49 / 0.10);

  /* ─────────────────────────────────────────────────────
   * MOTION
   * ───────────────────────────────────────────────────── */
  --duration-fast: 150ms;
  --duration-base: 250ms;
  --duration-slow: 400ms;
  --ease-entrance:  cubic-bezier(0.16, 1, 0.3, 1);
  --ease-transition: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-exit:       cubic-bezier(0.4, 0, 1, 1);

  /* ─────────────────────────────────────────────────────
   * Z-INDEX
   * ───────────────────────────────────────────────────── */
  --z-base:     0;
  --z-elevated: 10;
  --z-dropdown: 100;
  --z-sticky:   200;
  --z-overlay:  1000;
  --z-modal:    1100;
  --z-toast:    1200;
  --z-tooltip:  1300;

  /* ─────────────────────────────────────────────────────
   * BREAKPOINTS — Tailwind defaults (here for reference)
   * sm: 640px  md: 768px  lg: 1024px  xl: 1280px  2xl: 1536px
   * ───────────────────────────────────────────────────── */
}

/* Global focus indicator — WCAG 2.2 §2.4.11 */
:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}

/* Reduced-motion override (see §7.3) */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 14. Open questions and dependencies

| ID | Question | Where blocked |
|---|---|---|
| BR-2 | Web font licensing — purchase Avenir web license, use Inter as the working web face, or use a different free family (DM Sans, Nunito Sans). Affects only `--font-display` and `--font-body` in §13. | ROADMAP.md (leadership/marketing) |
| DS-1 | Should `<TestimonialCarousel>` autoplay by default, or only manual advancement? Accessibility implications. | Confirm during D-3 wireframe pass |
| DS-2 | Does the homepage hero use `text-display-xl` (61px) or scale back to `text-display` (49px) on smaller hero copy? Decide after first hero copy draft lands. | Content (CONTENT-REQUIREMENTS §4 — homepage hero copy) |
| DS-3 | Lexical rich-text styling — confirm `@tailwindcss/typography` `prose` defaults match this design system's body/heading scales. May need a `prose-seqtek` override class. | Validate during Phase 1 stack spike (D-13) |

These do not block applying the rest of the design system. They block specific pieces.
