import { test as base, expect } from '@playwright/test';
import { assertIsolatedStorage } from './storage-safety';
export { expect };
export const test = base.extend<object, { estateStorageSafety: void }>({
  // Playwright requires destructured fixture arguments, including when none are used.
  estateStorageSafety: [async ({}, use) => {
    const workspace = process.env.ESTATE_TEST_ROOT;
    if (!workspace) throw new Error('Start storage tests with npm run test:e2e or npm run test:all.');
    assertIsolatedStorage(process.cwd(), workspace);
    await use();
  }, { scope: 'worker', auto: true }],
});
