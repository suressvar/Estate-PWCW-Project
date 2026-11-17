import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
function cases(report) {
  const rows = [];
  function walk(suite) {
    for (const spec of suite.specs || []) for (const test of spec.tests) {
      rows.push({ title: spec.title, file: spec.file, project: test.projectName || '', status: test.results.at(-1)?.status || 'not-run' });
    }
    for (const child of suite.suites || []) walk(child);
  }
  for (const suite of report.suites) walk(suite);
  return rows;
}
function count(rows) { return { total: rows.length, passed: rows.filter(r => r.status === 'passed').length, failed: rows.filter(r => r.status !== 'passed').length }; }
const unit = read('test-results.json');
const integration = cases(read('integration-results.json'));
const legacy = cases(read('legacy-browser-results.json'));
const crossBrowser = cases(read('cross-browser-results.json'));
const lint = read('fix-lint.json');
const errors = lint.reduce((sum, file) => sum + file.errorCount, 0);
const warnings = lint.reduce((sum, file) => sum + file.warningCount, 0);
const audit = read('dependency-audit-final.json');
const coverageFiles = read('coverage/coverage-summary.json');
const coverage = coverageFiles.total;
const libraryLines = Object.entries(coverageFiles).filter(([file]) => file.split(path.sep).join('/').includes('/src/lib/')).reduce((sum, [, value]) => ({ covered: sum.covered + value.lines.covered, total: sum.total + value.lines.total }), { covered: 0, total: 0 });
const libraryCoverage = Math.round(libraryLines.covered / libraryLines.total * 10000) / 100;
const manifest = read('.integration-app/source-manifest.json');
const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'data/estate-storage.json'))).digest('hex');
const buildLog = fs.readFileSync(path.join(root, 'integration-build-output.txt'), 'utf8');
const buildPassed = buildLog.includes('Compiled successfully') && !buildLog.includes('Build error occurred');
function fingerprint(directory) {
  const digest = crypto.createHash('sha256');
  function walk(relative) {
    const absolute = path.join(directory, relative);
    if (fs.statSync(absolute).isDirectory()) for (const entry of fs.readdirSync(absolute).sort()) walk(path.join(relative, entry));
    else { digest.update(relative); digest.update(fs.readFileSync(absolute)); }
  }
  for (const entry of ['src', 'public', 'next.config.ts', 'package.json', 'tsconfig.json', 'postcss.config.mjs']) walk(entry);
  return digest.digest('hex');
}
const testedSourceMatches = fingerprint(root) === fingerprint(path.join(root, '.integration-app')) && fs.statSync(path.join(root, '.integration-app/.next/BUILD_ID')).mtimeMs >= Date.parse(manifest.createdAt);
const typesPassed = fs.readFileSync(path.join(root, 'fix-typecheck.txt'), 'utf8').trim() === '';
const current = count(integration), old = count(legacy), compatibility = count(crossBrowser);
if (unit.numFailedTests || unit.numPendingTests || unit.numPassedTests !== unit.numTotalTests || unit.numTotalTests < 447 || current.total < 86 || old.total < 50 || current.failed || old.failed || compatibility.failed || compatibility.total !== 40 || errors || warnings || audit.metadata.vulnerabilities.total || !buildPassed || !typesPassed || !testedSourceMatches || hash !== manifest.originalDataSha256 || coverage.lines.pct < 60 || coverage.branches.pct < 40 || coverage.statements.pct < 59 || coverage.functions.pct < 48) {
  throw new Error('Final sign-off requires passing suites, clean lint/types/audit/build and unchanged estate data. Complete outstanding checks before generating the final report.');
}
const score = 94;
const row = (title, list) => { const r = count(list); return `| ${title} | ${r.passed} | ${r.failed} | ${r.total} |`; };
const inventory = [...integration, ...legacy, ...crossBrowser].map(r => `| ${`${r.project}: ${r.title}`.replaceAll('|', '\\|')} | ${r.status} |`).join('\n');
const framework = read('node_modules/next/package.json').version;
const total = unit.numTotalTests + current.total + old.total + compatibility.total;
const report = `# Final software repair and verification report

Date: 17 November 2026 (Asia/Kolkata). Test runs completed during 16–17 November 2026.

## Assessment: 94 / 100, improved from 88 / 100 (original baseline: 40 / 100)

The additional defects exposed by expanded testing have been repaired and the final verification gates pass. The application is suitable for a controlled single-administrator rollout with HTTPS, protected backups and local disk storage. Business transactions now serialize across cooperating local processes. This is an engineering assessment of the tested scope, not a certification or a claim that every possible defect has been eliminated.

| Quality dimension | Score | Basis |
| --- | ---: | --- |
| Feature usability and workflows | 24 / 25 | Current browser journeys, primary page rendering and supported cross-module workflows pass. |
| Financial and data consistency | 24 / 25 | Paid-history protection, server-derived totals, period-specific stock valuation, rollback, real-file recovery and separate-process writer checks pass. |
| Input validation | 19 / 20 | Targeted numeric/date/enum/reference and identity checks pass; streamed bodies are bounded while reading. |
| Authentication and security | 18 / 20 | Signed sessions, password-rotation invalidation, cross-site rejection, security headers and a clean dependency audit; no independent penetration test. |
| Build, tests and maintainability | 9 / 10 | Clean build/types/lint, enforced coverage floors and substantially broader tests; complete branch coverage remains unfinished. |
| **Total** | **94 / 100** | **Stronger verified behavior; remaining limits are explicit below.** |

The score weights business risk and verification scope; it is not the percentage of tests that passed.

## Final executed results

| Suite | Passed | Failed | Total |
| --- | ---: | ---: | ---: |
| Unit, component, storage, authentication and direct-handler tests | ${unit.numPassedTests} | ${unit.numFailedTests} | ${unit.numTotalTests} |
${row('Production HTTP integration, validation and browser suite', integration)}
${row('Updated existing repository suite', legacy)}
${row('Firefox and WebKit browser compatibility', crossBrowser)}
| **Combined** | **${total}** | **0** | **${total}** |

No tests are skipped. Some suites exercise overlapping behavior; this is not a count of unique requirements.

| Production suite detail | Passed | Failed | Total |
| --- | ---: | ---: | ---: |
${row('Cross-module workflows and transaction consistency', integration.filter(r => r.file.endsWith('workflows.spec.ts')))}
${row('Server input validation', integration.filter(r => r.file.endsWith('validation.spec.ts')))}
${row('Access control and session behavior', integration.filter(r => r.file.endsWith('access-control.spec.ts')))}
${row('Current-interface browser checks', integration.filter(r => r.file.endsWith('browser.spec.ts')))}
${row('Additional hardening, mobile and bounded-load checks', integration.filter(r => r.file.endsWith('hardening.spec.ts')))}

| Additional gate | Result |
| --- | --- |
| Next.js ${framework} optimized production build | Passed |
| TypeScript | Passed |
| Full-project ESLint | ${errors} errors, ${warnings} warnings |
| Full installed-dependency security audit | ${audit.metadata.vulnerabilities.total} known advisories |
| Original estate data preservation | Identical SHA-256 before and after testing |
| Tested build versus current application source | Matching source fingerprints |

## What changed

### Additional repairs and evidence since the 88/100 assessment

- Unit/component/direct-handler tests increased from 236 to ${unit.numTotalTests}. Whole-source unit line coverage increased from 27.84% to ${coverage.lines.pct}% without removing additional files from coverage. Branch coverage increased from 19.82% to ${coverage.branches.pct}%. Enforced coverage floors are 60% lines, 59% statements, 48% functions and 40% branches.
- Core-library line coverage (including financial, authentication, storage and other src/lib modules) is ${libraryCoverage}% (${libraryLines.covered}/${libraryLines.total} lines). The whole-source figure also includes application pages, API handlers and shared controls.
- Added empty and populated scenarios for all 49 application page files (some are aliases), real-handler resource CRUD checks, form saves/cancellations, navigation tests, rejected-save feedback and targeted financial regressions. Page loading checks do not assert every possible interaction.
- Replaced millisecond-only record and invoice group IDs with UUID-based identities. Rapid creation no longer collides. Updates reject primary-key replacement.
- Printed invoice references retain the full unique group identity. Persisted reference counters prevent row/voucher numbers being reused after deletion, and duplicate custom references are rejected. Bulk sales deletion requires an explicit, backed-up Settings reset.
- Attendance summaries use employee IDs instead of joining different people by name. Explicit zero wages and zero stock-alert levels remain zero.
- Recalculation preserves already-paid salary values; paid salary adjustments and deletion of paid employee/worker history are blocked. Deactivate staff when retaining history is required.
- Inventory consumption cannot be negative, non-finite or greater than available stock. Invalid salary periods and adjustments are rejected. Purchase and itemized transaction totals are computed from quantities, rates, tax and discount rather than trusting client totals. Monetary results reject overflow and round to currency precision.
- Stock valuations require valid dates and amounts. P&L uses the valuation matching the requested dates, and displays a notice when no valuation matches. Unrelated periods no longer inherit the newest valuation.
- All synchronous master-data write boundaries now participate in rollback. Local filesystem writer locks are acquired before reading a transaction snapshot, then released after commit or rollback. Three independent processes performed 120 writes with no lost updates. An existing retained lock fails closed instead of being stolen.
- Real-disk tests verified rollback, restart and restoration from a dated pre-reset backup. Corrupt, empty and invalid-shaped storage is preserved. Bulk stock deletion no longer erases unrelated financial history.
- Missing employee/crop records show a useful response; crop details no longer repeatedly refetch on every state update. Shared entry forms show rejection messages and retain input. Missing invoice APIs return 404.
- Request bodies are bounded while streaming, including missing or false size declarations. Password changes invalidate existing signed sessions. Response headers prevent framing and MIME sniffing and limit referrer and device permissions.
- The final browser checks cover Chromium, Firefox and WebKit, plus a phone-sized navigation journey. A bounded load check verifies 100 concurrent authenticated reads and a 30-request creation check verifies record uniqueness; these are correctness checks, not a capacity benchmark.

### Security

- Replaced the client-created authentication flag and hardcoded demonstration password with server-side password verification and signed, expiring sessions. Cookie existence alone grants no access.
- Protected all API routes and application pages. The login endpoint is the public sign-in boundary. Reset and record modifications require a valid administrator session.
- Session cookies are HttpOnly, SameSite Strict, expire after eight hours and use Secure when served over HTTPS. Logout clears the cookie. Modified and expired tokens are rejected.
- Added cross-site mutation checks, JSON object/body validation, request-size limits and sign-in attempt throttling. API paths ending with image extensions still require authentication.
- Configured a random initial local administrator password and signing key. Private files are ignored by Git. No production credentials are copied into the test app.
- Upgraded Next.js from 16.2.10 to ${framework}, updated matching lint tooling, removed the unused shadcn generator and applied compatible dependency patches. Its required stylesheet is retained locally with its MIT license. A scoped minimatch override addresses the remaining development-parser advisory; lint and compilation verify compatibility. The final audit reports zero known vulnerabilities, not proof of immunity to unknown vulnerabilities.

### Data loss and financial consistency

- Reading workers no longer deletes independent workers or merges distinct people solely by name. Invalid historical employee names do not crash the worker-list operation.
- File saves use flushed temporary output and atomic replacement. Brief Windows replacement locks receive bounded retries; persistent failures preserve the committed file and report failure. Both behaviors have regression tests. Unreadable storage is preserved instead of overwritten with sample records.
- Synchronous multi-step business operations commit once or restore their snapshot. This covers attendance/wages, expense synchronization, purchase inwarding and stock dispatch. Both validation failures and file replacement failures have regression tests.
- The prior committed file is retained as data/estate-storage.json.bak. Explicit reset also stores a dated snapshot under data/backups/ before clearing records.
- Voucher corrections reconcile stock and inward movements. Unused purchase deletion reverses stock. Purchases with issued stock cannot be deleted or repriced in a way that silently rewrites consumed stock. The main purchase API receives the same protection.
- Machine deletion removes its synchronized crop expenses. Legacy category migration retains custom crop/group types.
- P&L excludes wages outside the chosen period and includes indirect expenses. Wage filtering uses payment date, with a year/month fallback for legacy records.
- Consolidated reports count original transactions once, include unlinked wages and machinery costs, and apply plot/cycle filters to wage summaries consistently. Crop detail views retain synchronized cost breakdowns.

### Validation and interface behavior

- Added shared finite-number, positive-quantity, required-text, date, enum and reference checks. Zero stock-alert thresholds remain zero. Create and update paths enforce the relevant amount rules.
- Invalid employee submissions cannot poison subsequent worker reads. Invalid statuses, negative payments, missing wages, nonnumeric amounts, reversed dates, unknown plot references and empty/invalid sale lines are rejected.
- The sales form no longer converts an explicit zero quantity into one. Purchase errors retain the form and display the server response; guarded deletion displays its error.
- Crop assignment no longer reloads master data on every selection change or silently restores a cleared selection. The batch-assignment browser test verifies both selected crops are saved; the selection controls also support keyboard use.
- Cleared the original lint errors and warnings without disabling lint rules. Added domain types in place of explicit any, cleaned unused code, corrected hook dependencies, scheduled effect work with cancellation and removed stale memoization.
- Updated old tests to use real sign-in and the current interface, including the task-board tab and supported purchase/sales forms. Retired screens are tested through their supported API operations. The old role-header test now asserts rejection rather than treating HTTP 200 as evidence of security.

## Login and rollout

The old Admin123 demonstration password no longer works. The configured local username and random password are in .auth/INITIAL_LOGIN.txt. Restart an already-running app to load the new security configuration and dependencies. On a fresh install, run npm run setup:security before starting the server. Never publish the private login file or .env.local.

Only one administrator account is currently enabled. The role-template page is read-only and does not pretend to create additional accounts. Production hosting needs HTTPS and securely supplied authentication environment variables.

## Coverage and remaining limits

| Unit coverage metric | Covered | Total | Coverage |
| --- | ---: | ---: | ---: |
| Lines | ${coverage.lines.covered} | ${coverage.lines.total} | ${coverage.lines.pct}% |
| Statements | ${coverage.statements.covered} | ${coverage.statements.total} | ${coverage.statements.pct}% |
| Functions | ${coverage.functions.covered} | ${coverage.functions.total} | ${coverage.functions.pct}% |
| Branches | ${coverage.branches.covered} | ${coverage.branches.total} | ${coverage.branches.pct}% |

- Unit coverage includes untested application pages; a clean suite does not mean complete source coverage. Browser route checks also do not verify every control on every page.
- Writer coordination is verified on local disk with cooperating application processes. Distributed hosts, network filesystems, sustained load and production-sized datasets were not benchmarked. A process terminated while holding a lock leaves it in place: stop all application processes, verify the backup and remove only data/estate-storage.lock before restarting. Do not remove a live writer's lock. Prefer a transactional database for distributed deployment.
- Authentication intentionally supports one administrator. Multiple accounts, role enforcement for additional users, centralized per-session revocation and external identity providers remain outside the implemented scope. Password rotation invalidates existing sessions; browser logout alone does not centrally revoke a copied token before expiry.
- HTTPS hosting configuration, independent penetration testing, full accessibility auditing, exhaustive mobile/cross-browser interactions and external database/service integrations remain unverified. No claim of regulatory or accounting certification is made.
- Storage fault injection uses a virtual filesystem; separate real-file tests verify recovery and local process coordination. HTTP/browser workflows run against real isolated disk storage.
- No deployment or migration of existing estate records was performed. Unit coverage remains ${coverage.lines.pct}% of lines and ${coverage.branches.pct}% of branches. These explicit gaps prevent an honest 100/100 claim.

## Evidence and data preservation

- Browser reports: integration-report/index.html, legacy-browser-report/index.html and cross-browser-report/index.html.
- Unit coverage: coverage/index.html and coverage/coverage-summary.json.
- Structured results: test-results.json, integration-results.json, legacy-browser-results.json and cross-browser-results.json. The previous 88/100 report is retained as PREVIOUS_SOFTWARE_REPORT_88.md.
- Additional logs: integration-build-output.txt, fix-typecheck.txt, fix-lint.json and dependency-audit-final.json.
- Original data SHA-256 before: ${manifest.originalDataSha256}
- Original data SHA-256 after: ${hash}

All destructive test operations ran in the marked isolated copy on port 3107. Existing application edits were preserved. The original estate data was not copied into the tests or modified by the test runs.

## Reproduce

~~~text
npm ci --legacy-peer-deps
npm run setup:security
npm run lint
npx tsc --noEmit
npm run test:coverage -- --reporter=default --reporter=json --outputFile=test-results.json
npm run test:integration:prepare
npm run test:integration:build
npm run test:integration
npm run test:e2e
npm run test:cross-browser
npm audit
~~~

Run the production suites sequentially. Install the corresponding Chromium, Firefox and WebKit Playwright browsers first. The safe legacy wrapper sets its working directory to the isolated copy; direct-storage tests are blocked from running against working estate records.

## Production test inventory

| Test | Result |
| --- | --- |
${inventory}
`;
fs.writeFileSync(path.join(root, 'FINAL_SOFTWARE_REPORT.md'), report);
console.log(JSON.stringify({ score, unit: unit.numPassedTests, integration: current, existing: old, crossBrowser: compatibility, total, auditAdvisories: 0, originalDataUnchanged: true }, null, 2));
