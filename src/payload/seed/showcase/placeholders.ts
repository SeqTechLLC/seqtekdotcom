import sharp from 'sharp'

export interface PlaceholderBuffer {
  filename: string
  alt: string
  buffer: Buffer
  mimeType: 'image/png'
}

interface PlaceholderSpec {
  filename: string
  alt: string
  width: number
  height: number
  background: string
  foreground: string
  label: string
}

const SPECS: PlaceholderSpec[] = [
  {
    filename: 'showcase-photo.png',
    alt: 'Showcase photo placeholder',
    width: 1200,
    height: 800,
    background: '#46792f',
    foreground: '#f3f9ec',
    label: 'PHOTO',
  },
  {
    filename: 'showcase-screenshot.png',
    alt: 'Showcase screenshot placeholder',
    width: 1920,
    height: 1080,
    background: '#f7f7f8',
    foreground: '#1c1c31',
    label: 'SCREENSHOT',
  },
  {
    filename: 'showcase-logo.png',
    alt: 'Showcase logo placeholder',
    width: 240,
    height: 80,
    background: '#1c1c31',
    foreground: '#ffffff',
    label: 'LOGO',
  },
  {
    filename: 'showcase-illustration.png',
    alt: 'Showcase illustration placeholder',
    width: 800,
    height: 600,
    background: '#131e3d',
    foreground: '#a4d27a',
    label: 'ILLUSTRATION',
  },
]

const svgFor = (spec: PlaceholderSpec): string =>
  `<svg width="${spec.width}" height="${spec.height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${spec.background}"/>
  <text x="50%" y="50%" font-family="sans-serif" font-size="${Math.floor(spec.height / 6)}" fill="${spec.foreground}" text-anchor="middle" dominant-baseline="middle" font-weight="bold">${spec.label}</text>
</svg>`

export async function generatePlaceholders(): Promise<PlaceholderBuffer[]> {
  return Promise.all(
    SPECS.map(async (spec) => {
      const buffer = await sharp(Buffer.from(svgFor(spec)))
        .png()
        .toBuffer()
      return { filename: spec.filename, alt: spec.alt, buffer, mimeType: 'image/png' as const }
    }),
  )
}
