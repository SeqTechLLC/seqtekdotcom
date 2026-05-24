import typography from '@tailwindcss/typography'

/**
 * Design tokens translated from docs/DESIGN_SYSTEM.md §14.
 * Doc wins on values; this file is the published Tailwind API.
 *
 * Ramps and state colors are hex-baked because they don't theme-swap.
 * Semantic tokens (text-*, surface-*, border-*, accent-*) read from
 * CSS custom properties defined in src/app/(frontend)/styles.css so
 * dark mode / high-contrast mode can swap them later (D-1 §1.5).
 */
const fontStack = [
  'Nunito Sans',
  'ui-sans-serif',
  'system-ui',
  '-apple-system',
  'Segoe UI',
  'sans-serif',
]

/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'brand-green': {
          50: '#F3F9EC',
          100: '#E3F1D4',
          200: '#C8E3AB',
          300: '#A4D27A',
          400: '#88C45F',
          500: '#72B94D',
          600: '#5A9C3B',
          700: '#46792F',
          800: '#355B24',
          900: '#243F19',
          950: '#142410',
        },
        'brand-navy': {
          50: '#F0F3FA',
          100: '#DDE4F1',
          200: '#BCCAE0',
          300: '#94A8CC',
          400: '#6C83B3',
          500: '#4A648F',
          600: '#3A527A',
          700: '#2C3F60',
          800: '#1F3265',
          900: '#131E3D',
          950: '#0A1224',
        },
        neutral: {
          0: '#FFFFFF',
          50: '#F7F7F8',
          100: '#EDEDF0',
          200: '#D9D9DF',
          300: '#BABABF',
          400: '#93939C',
          500: '#6E6E7A',
          600: '#54545D',
          700: '#3E3E47',
          800: '#2A2A32',
          900: '#1C1C31',
          950: '#0E0E1A',
        },
        success: { 100: '#D1FAE5', 500: '#10B981', 700: '#047857' },
        warning: { 100: '#FEF3C7', 500: '#F59E0B', 700: '#B45309' },
        error: { 100: '#FEE2E2', 500: '#EF4444', 700: '#B91C1C' },
        info: { 100: '#DBEAFE', 500: '#3B82F6', 700: '#1D4ED8' },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          inverse: 'var(--color-text-inverse)',
          accent: 'var(--color-text-accent)',
        },
        link: {
          DEFAULT: 'var(--color-link)',
          hover: 'var(--color-link-hover)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          subtle: 'var(--color-surface-subtle)',
          elevated: 'var(--color-surface-elevated)',
          inverse: 'var(--color-surface-inverse)',
          accent: 'var(--color-surface-accent)',
        },
        border: {
          subtle: 'var(--color-border-subtle)',
          strong: 'var(--color-border-strong)',
          focus: 'var(--color-border-focus)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          strong: 'var(--color-accent-strong)',
          hover: 'var(--color-accent-hover)',
          pressed: 'var(--color-accent-pressed)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', ...fontStack],
        body: ['var(--font-body)', ...fontStack],
        mono: ['var(--font-mono)', 'ui-monospace', 'SF Mono', 'Roboto Mono', 'monospace'],
      },
      fontSize: {
        caption: ['0.75rem', { lineHeight: '1.5' }],
        small: ['0.8125rem', { lineHeight: '1.5' }],
        body: ['1rem', { lineHeight: '1.6' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        h4: ['1.25rem', { lineHeight: '1.3' }],
        h3: ['1.5625rem', { lineHeight: '1.25' }],
        h2: ['1.953rem', { lineHeight: '1.2' }],
        h1: ['2.441rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        display: ['3.052rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-xl': ['3.815rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
      },
      lineHeight: {
        display: '1.1',
        h1: '1.15',
        h2: '1.2',
        h3: '1.25',
        h4: '1.3',
        body: '1.6',
        small: '1.5',
      },
      letterSpacing: {
        tight: '-0.02em',
        normal: '0',
        wide: '0.025em',
      },
      fontWeight: {
        regular: '400',
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
        full: '9999px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(28 28 49 / 0.04)',
        sm: '0 1px 3px 0 rgb(28 28 49 / 0.06), 0 1px 2px -1px rgb(28 28 49 / 0.05)',
        md: '0 4px 6px -1px rgb(28 28 49 / 0.08), 0 2px 4px -2px rgb(28 28 49 / 0.06)',
        lg: '0 10px 15px -3px rgb(28 28 49 / 0.10), 0 4px 6px -4px rgb(28 28 49 / 0.08)',
        xl: '0 20px 25px -5px rgb(28 28 49 / 0.12), 0 8px 10px -6px rgb(28 28 49 / 0.10)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '250ms',
        slow: '400ms',
      },
      transitionTimingFunction: {
        entrance: 'cubic-bezier(0.16, 1, 0.3, 1)',
        transition: 'cubic-bezier(0.4, 0, 0.2, 1)',
        exit: 'cubic-bezier(0.4, 0, 1, 1)',
      },
      zIndex: {
        base: '0',
        elevated: '10',
        dropdown: '100',
        sticky: '200',
        overlay: '1000',
        modal: '1100',
        toast: '1200',
        tooltip: '1300',
      },
      maxWidth: {
        'container-sm': '640px',
        'container-md': '768px',
        'container-lg': '1024px',
        'container-xl': '1280px',
      },
    },
  },
  plugins: [typography],
}

export default config
