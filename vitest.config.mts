import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reportOnFailure: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/app/layout.tsx'],
      reporter: ['text', 'json-summary', 'html'],
      thresholds: { lines: 60, statements: 59, functions: 48, branches: 40 },
    },
  },
});
