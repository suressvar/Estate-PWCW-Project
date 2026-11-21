This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Administrator sign-in

Run `npm run setup:security` once before starting a fresh installation. It creates a random administrator password and signing key, preserves other existing environment settings, and saves the initial login in `.auth/INITIAL_LOGIN.txt`. These files are ignored by Git. The old demonstration password and client-created cookie no longer grant access. Restart an existing development server after setup or dependency updates.

The app currently supports one administrator account. Role templates in the interface are read-only; additional accounts are not enabled. Production hosting should use HTTPS and securely supplied `ESTATE_ADMIN_USERNAME`, `ESTATE_ADMIN_PASSWORD_HASH` (scrypt salt:hash), and `ESTATE_SESSION_SECRET` (at least 32 characters).

See [FINAL_SOFTWARE_REPORT.md](FINAL_SOFTWARE_REPORT.md) for the latest verified results and remaining limits. Earlier assessment documents describe the pre-fix baseline.

## Unit testing

Install the locked dependencies with `npm ci`.

- `npm test` runs all isolated unit, component, and direct request-handler tests.
- `npm run test:watch` reruns tests during editing.
- `npm run test:coverage` creates an HTML coverage report at `coverage/index.html`.
- `npm run test:coverage -- --reporter=default --reporter=json --outputFile=test-results.json` also writes machine-readable test results.

Tests use a fresh in-memory database per case; storage tests use a virtual filesystem. They do not need a running server, login credentials, or access to the estate data file. Existing browser tests remain separate under `npm run test:e2e`.

Additional storage tests use marked disposable temporary directories and separate processes to verify real-file recovery and writer coordination. Whole-source coverage is retained, with enforced floors of 60% lines, 59% statements, 48% functions and 40% branches.

The regression tests retain the original expectations for the defects identified in the baseline assessment. Keep these assertions when making future changes. Storage tests verify atomic commits, rollback, backup preservation and failure reporting.

## Integration and validation testing

Run the complete regression suite with one command:

```text
npm run test:all
```

This runs unit coverage, refreshes and builds a disposable application copy when code or copied tests are out of date, then runs production integration, legacy and Firefox/WebKit suites sequentially. It uses `.black-box-app` on port 3117 by default, with separate authentication and synthetic records. Stale builds and unsafe direct legacy launches are rejected before they can use estate records.

The individual commands also refresh stale builds automatically:

```text
npm run test:integration
npm run test:integration:legacy
npm run test:cross-browser
npm run test:integration:report
```

Do not run all projects together through the raw Playwright command. The legacy suite imports storage directly and must run through its wrapper in the marked disposable working directory. Advanced test copies can be selected with `TEST_APP_DIR` and `TEST_SERVER_PORT`; occupied test servers are left running.

The legacy wrapper runs direct-storage tests from inside the isolated copy. Use this wrapper to keep their writes away from working estate records. Reports are available in `integration-report/index.html`, `legacy-browser-report/index.html`, `cross-browser-report/index.html`, and [FINAL_SOFTWARE_REPORT.md](FINAL_SOFTWARE_REPORT.md). The suites share a port and test data, so run them sequentially. Install the matching browsers with `npx playwright install chromium firefox webkit` if missing. The test server uses separate test-only authentication settings; it does not copy real passwords or estate records.

## Storage recovery

Synchronous business changes acquire a local writer lock before reading their snapshot and commit once through atomic file replacement. A failed operation rolls back its in-memory snapshot and reports an error. The previous committed file is retained as `data/estate-storage.json.bak`; an explicit reset also stores a dated copy in `data/backups/`. If storage is unreadable, the application preserves it and stops instead of overwriting it with sample records. Stop all application processes before restoring a verified backup, then restart and check the records.

Local process coordination is tested; network filesystems and distributed hosts are not supported by this verification. Direct storage callers must put complete read/modify/write operations inside `withTransaction`. A process terminated while holding `data/estate-storage.lock` can leave it behind: stop all application processes, verify your backup, remove only that lock file, then restart. Never remove a live writer's lock. Prefer a transactional database for distributed deployment.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
