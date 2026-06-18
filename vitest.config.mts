import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globalSetup: ['./vitest.globalSetup.ts'],
    include: ['tests/int/**/*.int.spec.{ts,tsx}'],
    testTimeout: 60_000,
    // The first int file's beforeAll triggers the initial drizzle push of the
    // whole Payload schema to the testcontainer DB. spec 010 ~5x'd that schema
    // (a `layout` blocks family on every specialized collection + the homepage
    // global), so the cold push exceeds 60s on slower/contended CI runners
    // (it stays ~15s locally). 180s gives the cold-boot push headroom.
    hookTimeout: 180_000,
    // The Payload+Postgres int suites all push schema to the same testcontainer
    // DB. Run them sequentially in one worker so getPayload's module-level
    // cache wins on schema setup and they don't race on enum/table creates.
    // Vitest 4 replaced `poolOptions.forks.singleFork` with the pair
    // `maxWorkers: 1` + `isolate: false`; the latter is exactly what keeps
    // the module cache alive across test files.
    pool: 'forks',
    maxWorkers: 1,
    isolate: false,
    fileParallelism: false,
  },
})
