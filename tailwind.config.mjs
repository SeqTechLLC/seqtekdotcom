import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {},
  },
  plugins: [typography],
}

export default config
