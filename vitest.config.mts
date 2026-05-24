import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globalSetup: ['./vitest.globalSetup.ts'],
    include: ['tests/int/**/*.int.spec.ts'],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    // The Payload+Postgres int suites all push schema to the same testcontainer
    // DB. Run them sequentially in one worker so getPayload's module-level
    // cache wins on schema setup and they don't race on enum/table creates.
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
    fileParallelism: false,
  },
})
