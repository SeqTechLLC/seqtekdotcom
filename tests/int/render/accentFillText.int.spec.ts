// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * The bright brand green is a fill only when its text is the brand black: white
 * on it is 2.4:1 (DESIGN_SYSTEM §2.5). A fill class that shares a line with white
 * text is the regression this catches.
 */
const SRC = resolve(process.cwd(), 'src')

const walk = (dir: string, out: string[] = []): string[] => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (/\.(tsx?|css)$/.test(entry.name)) out.push(full)
  }
  return out
}

describe('bright green fills carry brand-black text', () => {
  it('no line pairs bg-accent-fill with white text', () => {
    const offenders: string[] = []
    for (const file of walk(SRC)) {
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (/\bbg-accent-fill\b/.test(line) && /\btext-(white|text-inverse)\b/.test(line)) {
            offenders.push(`${relative(SRC, file)}:${i + 1}`)
          }
        })
    }
    expect(offenders).toEqual([])
  })
})
