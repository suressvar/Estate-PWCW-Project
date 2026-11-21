/* eslint-disable @typescript-eslint/no-require-imports -- Playwright loads this setup through CommonJS. */
const { assertFreshTestBuild } = require('./test-freshness.cjs');
module.exports = async function checkTestBuild() {
  if (process.env.ESTATE_TEST_RUNNER !== '1') throw new Error('Use npm run test:all, npm run test:integration, npm run test:e2e or npm run test:cross-browser. These commands refresh the test build and protect estate records.');
  assertFreshTestBuild();
};
