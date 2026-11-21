import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    // Keep cryptographic and dynamic-import checks reliable under shared desktop load.
    maxWorkers: 2,
    coverage: {
      provider: 'v8',
      reportsDirectory: process.env.TEST_EVIDENCE_DIR ? path.join(process.env.TEST_EVIDENCE_DIR, 'coverage') : 'coverage',
      reportOnFailure: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/app/layout.tsx'],
      reporter: ['text', 'json-summary', 'html'],
      thresholds: { lines: 60, statements: 59, functions: 48, branches: 40 },
    },
  },
});
