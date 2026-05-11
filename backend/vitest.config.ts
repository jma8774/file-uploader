import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Each integration test creates its own temp DB + uploads dir and a
    // fresh Express app. Running them serially keeps better-sqlite3 file
    // handles + in-memory rate-limit state from leaking between tests.
    fileParallelism: false,
    sequence: { concurrent: false },
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    exclude: ['dist/**', 'node_modules/**'],
  },
})
