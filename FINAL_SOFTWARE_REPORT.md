# Final software repair and verification report

Date: 21 November 2026 (Asia/Kolkata). Updated after black-box testing and the full regression pass.

See [BLACK_BOX_TEST_REPORT.md](BLACK_BOX_TEST_REPORT.md) for the latest public-interface findings, repairs and remaining verification limits.

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
| Unit, component, storage, authentication and direct-handler tests | 517 | 0 | 517 |
| Production HTTP integration, validation and browser suite | 239 | 0 | 239 |
| Updated existing repository suite | 50 | 0 | 50 |
| Firefox and WebKit browser compatibility | 42 | 0 | 42 |
| **Combined** | **848** | **0** | **848** |

No tests are skipped. Some suites exercise overlapping behavior; this is not a count of unique requirements.

| Production suite detail | Passed | Failed | Total |
| --- | ---: | ---: | ---: |
| Cross-module workflows and transaction consistency | 14 | 0 | 14 |
| Server input validation | 36 | 0 | 36 |
| Access control and session behavior | 9 | 0 | 9 |
| Current-interface browser checks | 20 | 0 | 20 |
| Additional hardening, mobile and bounded-load checks | 7 | 0 | 7 |
| White-box regression workflows over HTTP | 6 | 0 | 6 |
| Additional black-box boundary, recovery, browser and session checks | 147 | 0 | 147 |

| Additional gate | Result |
| --- | --- |
| Next.js 16.4.6 optimized production build | Passed |
| TypeScript | Passed |
| Full-project ESLint | 0 errors, 0 warnings |
| Full installed-dependency security audit | 0 known advisories |
| Estate data preservation during the final run | Identical SHA-256 before and after testing |
| Tested build versus current application source | Matching source fingerprints |

## What changed

### Black-box repairs on 21 November

- Plot and crop saves retain entered values after rejection, display server errors and prevent repeat submissions while pending. Related assignment/category actions now check acceptance before updating their views.
- Sales, purchase, attendance, inventory, workforce and consolidated CSV exports share field quoting and formula-text protection. Downloads preserve commas, quotes, line breaks, Unicode, hash characters and zero amounts.
- Logout discards the client router cache, protected responses request no storage, and restored browser documents reauthenticate with the server. A rejected logout shows feedback and retains the current session.
- Failed plot/crop register loads retain prior data and offer a working retry instead of crashing on an error response.
- Operational logs reject negative, nonnumeric, overflowing and invalid-date entries before saving. Fuel records retain plot/equipment/operator details and display the saved quantity; fractional fuel issues are available in the form. Restored accessible quantity and time-input labels.
- Added public-boundary tests, recovery scenarios and cross-browser logout history checks. Retested the latest parallel layout changes; protected the test evidence from shared-folder cleanup.

### White-box repairs on 21 November

- Corrected hourly payroll projection, historical attendance earnings, paid-wage safeguards, employee/worker deletion cleanup and leave approval/cancellation restoration.
- Made daily master-sheet submissions atomic, including late failures, and preserved explicit zero input values. Rejected inconsistent relationships and invalid enum/date/numeric inputs across the reviewed write paths.
- Preserved fractional stock quantities and stopped internal stock transfers from creating supplier purchases. Protected referenced plots and server-derived salary fields.
- Prevented swallowed nested transaction failures from committing partial data; hardened Windows lock retries, missing-file handling and cache invalidation. Salary edits now save in order and roll back visibly after rejection.
- Added targeted regression coverage and four selected mutation probes. Updated the vulnerable Effect dependency to 3.22.1 and removed the unused Tremor dependency that conflicted with installation.

### Additional repairs and evidence since the 88/100 assessment

- Unit/component/direct-handler tests increased from 236 to 517. Whole-source unit line coverage increased from 27.84% to 64.02% without removing additional files from coverage. Branch coverage increased from 19.82% to 45.42%. Enforced coverage floors are 60% lines, 59% statements, 48% functions and 40% branches.
- Core-library line coverage (including financial, authentication, storage and other src/lib modules) is 88.01% (2495/2835 lines). The whole-source figure also includes application pages, API handlers and shared controls.
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
- Upgraded Next.js from 16.2.10 to 16.4.6, updated matching lint tooling, removed the unused shadcn generator and applied compatible dependency patches. Its required stylesheet is retained locally with its MIT license. A scoped minimatch override addresses the remaining development-parser advisory; lint and compilation verify compatibility. The final audit reports zero known vulnerabilities, not proof of immunity to unknown vulnerabilities.

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
| Lines | 6053 | 9454 | 64.02% |
| Statements | 6716 | 10744 | 62.5% |
| Functions | 1505 | 2882 | 52.22% |
| Branches | 4066 | 8952 | 45.42% |

- Unit coverage includes untested application pages; a clean suite does not mean complete source coverage. Browser route checks also do not verify every control on every page.
- Writer coordination is verified on local disk with cooperating application processes. Distributed hosts, network filesystems, sustained load and production-sized datasets were not benchmarked. A process terminated while holding a lock leaves it in place: stop all application processes, verify the backup and remove only data/estate-storage.lock before restarting. Do not remove a live writer's lock. Prefer a transactional database for distributed deployment.
- Authentication intentionally supports one administrator. Multiple accounts, role enforcement for additional users, centralized per-session revocation and external identity providers remain outside the implemented scope. Password rotation invalidates existing sessions; browser logout alone does not centrally revoke a copied token before expiry.
- HTTPS hosting configuration, independent penetration testing, full accessibility auditing, exhaustive mobile/cross-browser interactions and external database/service integrations remain unverified. No claim of regulatory or accounting certification is made.
- Storage fault injection uses a virtual filesystem; separate real-file tests verify recovery and local process coordination. HTTP/browser workflows run against real isolated disk storage.
- No deployment or migration of existing estate records was performed. Unit coverage remains 64.02% of lines and 45.42% of branches. These explicit gaps prevent an honest 100/100 claim.

## Evidence and data preservation

The following evidence paths are relative to: C:/Users/Suressvar/.codex/visualizations/2026/11/15/01a1de5c-0a4c-7b70-b3a8-f859a9796134/black-box-evidence.

- Browser reports: integration-report/index.html, legacy-browser-report/index.html and cross-browser-report/index.html.
- Unit coverage: coverage/index.html and coverage/coverage-summary.json.
- Structured results: test-results.json, integration-results.json, legacy-browser-results.json and cross-browser-results.json.
- Additional logs: integration-build-output.txt, fix-typecheck.txt, fix-lint.json and dependency-audit-final.json.
- Estate data SHA-256 at the start of the final run: 5debbd1abd3aa420c34a1c7ec9ed5b520a9e74adf1961c85b7cbb0efa3ad4b64
- Estate data SHA-256 after the final run: 5debbd1abd3aa420c34a1c7ec9ed5b520a9e74adf1961c85b7cbb0efa3ad4b64

All destructive test operations ran in the marked isolated copy .black-box-app on port 3117. Existing application edits were preserved. The original estate data was not copied into the tests or modified by the test runs.

## Reproduce

~~~text
$env:TEST_APP_DIR = '.black-box-app'
$env:TEST_SERVER_PORT = '3117'
$env:TEST_EVIDENCE_DIR = 'C:\Users\Suressvar\.codex\visualizations\2026\11\15\01a1de5c-0a4c-7b70-b3a8-f859a9796134\black-box-evidence'
npm ci
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
| integration-validation: S01 unauthenticated pages redirect to login | passed |
| integration-validation: S02 unauthenticated users cannot read employee records | passed |
| integration-validation: S03 unauthenticated users cannot create workers | passed |
| integration-validation: S04 unauthenticated users cannot reset application data | passed |
| integration-validation: S05 a fabricated auth cookie cannot grant page access | passed |
| integration-validation: S06 API paths with file extensions still require a session | passed |
| integration-validation: S07 signed-in cross-site writes are rejected | passed |
| integration-validation: S08 logout removes browser authentication | passed |
| integration-validation: S09 session cookie is inaccessible to scripts and same-site restricted | passed |
| integration-validation: BB operational boundary /api/diesel-logs: negative cannot corrupt the register | passed |
| integration-validation: BB operational boundary /api/diesel-logs: nonnumeric cannot corrupt the register | passed |
| integration-validation: BB operational boundary /api/diesel-logs: overflow cannot corrupt the register | passed |
| integration-validation: BB operational boundary /api/diesel-logs: date cannot corrupt the register | passed |
| integration-validation: BB operational boundary /api/fertilizer-logs: negative cannot corrupt the register | passed |
| integration-validation: BB operational boundary /api/fertilizer-logs: nonnumeric cannot corrupt the register | passed |
| integration-validation: BB operational boundary /api/fertilizer-logs: overflow cannot corrupt the register | passed |
| integration-validation: BB operational boundary /api/fertilizer-logs: date cannot corrupt the register | passed |
| integration-validation: BB operational boundary /api/machinery-logs: negative cannot corrupt the register | passed |
| integration-validation: BB operational boundary /api/machinery-logs: nonnumeric cannot corrupt the register | passed |
| integration-validation: BB operational boundary /api/machinery-logs: overflow cannot corrupt the register | passed |
| integration-validation: BB operational boundary /api/machinery-logs: date cannot corrupt the register | passed |
| integration-validation: BB operational boundary /api/production-logs: negative cannot corrupt the register | passed |
| integration-validation: BB operational boundary /api/production-logs: nonnumeric cannot corrupt the register | passed |
| integration-validation: BB operational boundary /api/production-logs: overflow cannot corrupt the register | passed |
| integration-validation: BB operational boundary /api/production-logs: date cannot corrupt the register | passed |
| integration-validation: BB fuel dispatch retains the selected plot, equipment, quantity and operator | passed |
| integration-validation: BB fractional diesel issue is available through the public form | passed |
| integration-validation: BB session history is reauthenticated after logout in each browser | passed |
| integration-validation: BB input null at /api/plots returns a client error | passed |
| integration-validation: BB input array at /api/plots returns a client error | passed |
| integration-validation: BB input boolean at /api/plots returns a client error | passed |
| integration-validation: BB input string at /api/plots returns a client error | passed |
| integration-validation: BB input malformed at /api/plots returns a client error | passed |
| integration-validation: BB input null at /api/crops returns a client error | passed |
| integration-validation: BB input array at /api/crops returns a client error | passed |
| integration-validation: BB input boolean at /api/crops returns a client error | passed |
| integration-validation: BB input string at /api/crops returns a client error | passed |
| integration-validation: BB input malformed at /api/crops returns a client error | passed |
| integration-validation: BB input null at /api/employees returns a client error | passed |
| integration-validation: BB input array at /api/employees returns a client error | passed |
| integration-validation: BB input boolean at /api/employees returns a client error | passed |
| integration-validation: BB input string at /api/employees returns a client error | passed |
| integration-validation: BB input malformed at /api/employees returns a client error | passed |
| integration-validation: BB input null at /api/workers returns a client error | passed |
| integration-validation: BB input array at /api/workers returns a client error | passed |
| integration-validation: BB input boolean at /api/workers returns a client error | passed |
| integration-validation: BB input string at /api/workers returns a client error | passed |
| integration-validation: BB input malformed at /api/workers returns a client error | passed |
| integration-validation: BB input null at /api/expenses returns a client error | passed |
| integration-validation: BB input array at /api/expenses returns a client error | passed |
| integration-validation: BB input boolean at /api/expenses returns a client error | passed |
| integration-validation: BB input string at /api/expenses returns a client error | passed |
| integration-validation: BB input malformed at /api/expenses returns a client error | passed |
| integration-validation: BB input null at /api/machines returns a client error | passed |
| integration-validation: BB input array at /api/machines returns a client error | passed |
| integration-validation: BB input boolean at /api/machines returns a client error | passed |
| integration-validation: BB input string at /api/machines returns a client error | passed |
| integration-validation: BB input malformed at /api/machines returns a client error | passed |
| integration-validation: BB input null at /api/operation-items returns a client error | passed |
| integration-validation: BB input array at /api/operation-items returns a client error | passed |
| integration-validation: BB input boolean at /api/operation-items returns a client error | passed |
| integration-validation: BB input string at /api/operation-items returns a client error | passed |
| integration-validation: BB input malformed at /api/operation-items returns a client error | passed |
| integration-validation: BB input null at /api/godown/items returns a client error | passed |
| integration-validation: BB input array at /api/godown/items returns a client error | passed |
| integration-validation: BB input boolean at /api/godown/items returns a client error | passed |
| integration-validation: BB input string at /api/godown/items returns a client error | passed |
| integration-validation: BB input malformed at /api/godown/items returns a client error | passed |
| integration-validation: BB input null at /api/ledger-groups returns a client error | passed |
| integration-validation: BB input array at /api/ledger-groups returns a client error | passed |
| integration-validation: BB input boolean at /api/ledger-groups returns a client error | passed |
| integration-validation: BB input string at /api/ledger-groups returns a client error | passed |
| integration-validation: BB input malformed at /api/ledger-groups returns a client error | passed |
| integration-validation: BB input null at /api/expense-ledgers returns a client error | passed |
| integration-validation: BB input array at /api/expense-ledgers returns a client error | passed |
| integration-validation: BB input boolean at /api/expense-ledgers returns a client error | passed |
| integration-validation: BB input string at /api/expense-ledgers returns a client error | passed |
| integration-validation: BB input malformed at /api/expense-ledgers returns a client error | passed |
| integration-validation: BB input null at /api/employee-roles returns a client error | passed |
| integration-validation: BB input array at /api/employee-roles returns a client error | passed |
| integration-validation: BB input boolean at /api/employee-roles returns a client error | passed |
| integration-validation: BB input string at /api/employee-roles returns a client error | passed |
| integration-validation: BB input malformed at /api/employee-roles returns a client error | passed |
| integration-validation: BB input null at /api/expense-units returns a client error | passed |
| integration-validation: BB input array at /api/expense-units returns a client error | passed |
| integration-validation: BB input boolean at /api/expense-units returns a client error | passed |
| integration-validation: BB input string at /api/expense-units returns a client error | passed |
| integration-validation: BB input malformed at /api/expense-units returns a client error | passed |
| integration-validation: BB input null at /api/leaves returns a client error | passed |
| integration-validation: BB input array at /api/leaves returns a client error | passed |
| integration-validation: BB input boolean at /api/leaves returns a client error | passed |
| integration-validation: BB input string at /api/leaves returns a client error | passed |
| integration-validation: BB input malformed at /api/leaves returns a client error | passed |
| integration-validation: BB input null at /api/daily-log/master-sheet returns a client error | passed |
| integration-validation: BB input array at /api/daily-log/master-sheet returns a client error | passed |
| integration-validation: BB input boolean at /api/daily-log/master-sheet returns a client error | passed |
| integration-validation: BB input string at /api/daily-log/master-sheet returns a client error | passed |
| integration-validation: BB input malformed at /api/daily-log/master-sheet returns a client error | passed |
| integration-validation: BB input null at /api/purchase-vouchers returns a client error | passed |
| integration-validation: BB input array at /api/purchase-vouchers returns a client error | passed |
| integration-validation: BB input boolean at /api/purchase-vouchers returns a client error | passed |
| integration-validation: BB input string at /api/purchase-vouchers returns a client error | passed |
| integration-validation: BB input malformed at /api/purchase-vouchers returns a client error | passed |
| integration-validation: BB input null at /api/sales/crop returns a client error | passed |
| integration-validation: BB input array at /api/sales/crop returns a client error | passed |
| integration-validation: BB input boolean at /api/sales/crop returns a client error | passed |
| integration-validation: BB input string at /api/sales/crop returns a client error | passed |
| integration-validation: BB input malformed at /api/sales/crop returns a client error | passed |
| integration-validation: BB empty register /attendance remains usable after reload | passed |
| integration-validation: BB empty register /attendance/summary remains usable after reload | passed |
| integration-validation: BB empty register /leaves remains usable after reload | passed |
| integration-validation: BB empty register /salary/calculate remains usable after reload | passed |
| integration-validation: BB empty register /employee-roles remains usable after reload | passed |
| integration-validation: BB empty register /ledger-groups remains usable after reload | passed |
| integration-validation: BB empty register /expense-ledgers remains usable after reload | passed |
| integration-validation: BB empty register /units remains usable after reload | passed |
| integration-validation: BB empty register /plot-crops remains usable after reload | passed |
| integration-validation: BB empty register /plot-operations/items remains usable after reload | passed |
| integration-validation: BB empty register /godown/issue remains usable after reload | passed |
| integration-validation: BB empty register /godown/movements remains usable after reload | passed |
| integration-validation: BB empty register /stock-valuations remains usable after reload | passed |
| integration-validation: BB empty register /reports remains usable after reload | passed |
| integration-validation: BB empty register /reports/stock-inventory remains usable after reload | passed |
| integration-validation: BB empty register /sales remains usable after reload | passed |
| integration-validation: BB empty register /sales-dashboard remains usable after reload | passed |
| integration-validation: BB empty register /sales-invoice remains usable after reload | passed |
| integration-validation: BB empty register /purchases/register remains usable after reload | passed |
| integration-validation: BB empty register /purchases/retailers remains usable after reload | passed |
| integration-validation: BB empty register /purchases/other remains usable after reload | passed |
| integration-validation: BB empty register /fertilizer remains usable after reload | passed |
| integration-validation: BB empty register /diesel remains usable after reload | passed |
| integration-validation: BB empty register /machinery remains usable after reload | passed |
| integration-validation: BB empty register /users remains usable after reload | passed |
| integration-validation: BB empty register /wages remains usable after reload | passed |
| integration-validation: BB empty register /vouchers remains usable after reload | passed |
| integration-validation: BB missing resource /api/employees/does-not-exist has a useful client response | passed |
| integration-validation: BB missing resource /api/crop-cycles/does-not-exist has a useful client response | passed |
| integration-validation: BB missing resource /api/sales-invoice/does-not-exist has a useful client response | passed |
| integration-validation: BB rejected plot changes preserve the saved record | passed |
| integration-validation: BB stored markup is shown as text without executing scripts | passed |
| integration-validation: BB failed save retains plot input and supports a successful retry | passed |
| integration-validation: BB repeated save clicks create only one plot | passed |
| integration-validation: BB canceling an unsaved plot leaves the register unchanged | passed |
| integration-validation: BB sales CSV exports neutralize formula-like customer names | passed |
| integration-validation: BB sales download preserves commas, quotes, Unicode, hashes and zero amounts | passed |
| integration-validation: BB downloaded workforce and consolidated reports neutralize formula-like text | passed |
| integration-validation: BB logout and browser Back cannot reopen a protected register | passed |
| integration-validation: BB phone layout /salary/calculate keeps navigation and content within the screen | passed |
| integration-validation: BB phone layout /reports/consolidated keeps navigation and content within the screen | passed |
| integration-validation: BB phone layout /daily-log keeps navigation and content within the screen | passed |
| integration-validation: BB phone layout /sales-register keeps navigation and content within the screen | passed |
| integration-validation: BB phone layout /employees keeps navigation and content within the screen | passed |
| integration-validation: BB crop save rejection retains the form for retry | passed |
| integration-validation: BB logout failure shows feedback and does not claim the session ended | passed |
| integration-validation: BB failed register load /plots reports the problem and supports retry | passed |
| integration-validation: BB failed register load /crops reports the problem and supports retry | passed |
| integration-validation: browser route /plots renders without an uncaught page error | passed |
| integration-validation: browser route /crops renders without an uncaught page error | passed |
| integration-validation: browser route /employees renders without an uncaught page error | passed |
| integration-validation: browser route /workers renders without an uncaught page error | passed |
| integration-validation: browser route /daily-log renders without an uncaught page error | passed |
| integration-validation: browser route /crop-cycles renders without an uncaught page error | passed |
| integration-validation: browser route /godown renders without an uncaught page error | passed |
| integration-validation: browser route /machines renders without an uncaught page error | passed |
| integration-validation: browser route /expenses renders without an uncaught page error | passed |
| integration-validation: browser route /sales-register renders without an uncaught page error | passed |
| integration-validation: browser route /purchases renders without an uncaught page error | passed |
| integration-validation: browser route /items renders without an uncaught page error | passed |
| integration-validation: browser route /reports/consolidated renders without an uncaught page error | passed |
| integration-validation: browser route /reports/pnl renders without an uncaught page error | passed |
| integration-validation: browser route /settings renders without an uncaught page error | passed |
| integration-validation: B01 rejects incorrect login credentials | passed |
| integration-validation: B02 requires both login fields | passed |
| integration-validation: B03 accepts configured login and loads dashboard | passed |
| integration-validation: B04 persisted plot is visible after a full page reload | passed |
| integration-validation: B05 employee record is available to the attendance page | passed |
| integration-validation: H07 security headers and streamed request limits apply to the production server | passed |
| integration-validation: H01 parallel employee creation preserves every distinct ID and record | passed |
| integration-validation: H02 paid salary history survives employee and worker deletion attempts | passed |
| integration-validation: H03 purchase totals are derived from lines and bulk stock deletion preserves history | passed |
| integration-validation: H04 missing employee and crop cycle pages show a useful response without crashing | passed |
| integration-validation: H05 a phone-sized screen can open navigation and reach the plot register | passed |
| integration-validation: H06 parallel authenticated reads remain correct under a bounded load | passed |
| integration-validation: V01 plot requires a name | passed |
| integration-validation: V02 plot rejects negative acreage | passed |
| integration-validation: V03 plot rejects nonnumeric acreage | passed |
| integration-validation: V04 plot rejects invalid status | passed |
| integration-validation: V05 worker rejects missing wage | passed |
| integration-validation: V06 worker rejects nonnumeric wage | passed |
| integration-validation: V07 worker rejects negative wage | passed |
| integration-validation: V08 worker rejects blank name | passed |
| integration-validation: V09 expense rejects zero | passed |
| integration-validation: V10 expense rejects negative amount | passed |
| integration-validation: V11 expense rejects nonnumeric amount | passed |
| integration-validation: V12 expense rejects invalid date | passed |
| integration-validation: V13 expense rejects unknown category | passed |
| integration-validation: V14 expense rejects missing description | passed |
| integration-validation: V15 sale rejects zero quantity | passed |
| integration-validation: V16 sale rejects negative rate | passed |
| integration-validation: V17 sale requires invoice lines | passed |
| integration-validation: V18 godown rejects negative received stock | passed |
| integration-validation: V19 godown rejects negative rate | passed |
| integration-validation: V20 catalog rejects negative stock | passed |
| integration-validation: V21 catalog rejects negative rate | passed |
| integration-validation: V22 crop cycle rejects nonexistent plot | passed |
| integration-validation: V23 crop cycle rejects reversed dates | passed |
| integration-validation: V24 daily work rejects nonexistent plot | passed |
| integration-validation: V25 daily work rejects invalid date | passed |
| integration-validation: V26 petty cash rejects negative top-up | passed |
| integration-validation: V27 petty cash rejects nonnumeric top-up | passed |
| integration-validation: V28 voucher rejects invalid route type | passed |
| integration-validation: V29 employee requires name and wage fields | passed |
| integration-validation: malformed JSON is a client error at /api/workers | passed |
| integration-validation: malformed JSON is a client error at /api/expenses | passed |
| integration-validation: malformed JSON is a client error at /api/plots | passed |
| integration-validation: V33 expense updates enforce the create-time amount rule | passed |
| integration-validation: V34 attendance rejects invalid status values | passed |
| integration-validation: V35 wage payments reject negative amounts | passed |
| integration-validation: V36 invalid employee submission cannot break the worker-list API | passed |
| integration-validation: WBHTTP01 hourly wages agree across attendance, worker register and salary | passed |
| integration-validation: WBHTTP02 a paid attendance correction is rejected without changing earnings | passed |
| integration-validation: WBHTTP03 fractional stock issues really reduce available stock | passed |
| integration-validation: WBHTTP04 leave approval and rejection restore prior attendance | passed |
| integration-validation: WBHTTP05 invalid multi-section dispatch leaves no partial logs | passed |
| integration-validation: WBHTTP06 internal stock transfers do not invent supplier purchases | passed |
| integration-validation: I01 crop expense and income persist across routes and roll into plot finances | passed |
| integration-validation: I02 employee attendance calculates wages and synchronizes one crop expense through payment | passed |
| integration-validation: I03 voucher inward, godown dispatch and fertilizer consumption reconcile | passed |
| integration-validation: I04 petty-cash balances recalculate after backdated top-ups and expense deletion | passed |
| integration-validation: I05 invoice totals agree with sales analytics after edits | passed |
| integration-validation: I06 catalog code uniqueness survives separate HTTP requests | passed |
| integration-validation: I07 rejected over-issue leaves stock and movements unchanged | passed |
| integration-validation: I08 linked general expense is counted once across report modules | passed |
| integration-validation: I09 new worker remains visible after re-fetching its register | passed |
| integration-validation: I10 purchase correction updates the stock module | passed |
| integration-validation: I11 concurrent expense submissions retain every transaction | passed |
| integration-validation: I12 main purchase deletion reverses unused inward stock | passed |
| integration-validation: I13 purchase deletion preserves issued stock and the original voucher | passed |
| integration-validation: I14 invalid purchase line cannot partially save a voucher or stock | passed |
| existing-browser: Known transaction costs and revenue reconcile in dashboard analytics | passed |
| existing-browser: Create a crop cycle, add 3 expenses and 2 incomes, verify exact P&L on detail page and plot rollup | passed |
| existing-browser: 1. Sum and financial rollup logic: 3 expenses and 2 incomes calculation | passed |
| existing-browser: 2. Edge Case: Only expenses incurred, zero harvest income yet (Net Loss calculation) | passed |
| existing-browser: 3. Plot-Level Lifetime Rollup across multiple crop cycles | passed |
| existing-browser: 4. Non-blocking date range validation warnings | passed |
| existing-browser: 5. Idempotent operational sync from labor and machinery logs | passed |
| existing-browser: 1. Enforces unique constraint per plot + date via upsert logic | passed |
| existing-browser: 2. WorkActivity defaults to plannedFlag: true, completedFlag: false | passed |
| existing-browser: 3. Updating activity to NOT_DONE strictly requires a valid reason | passed |
| existing-browser: 4. Computes DailyLog status dynamically from activity states | passed |
| existing-browser: 5. End-of-day auto-transition carries forward incomplete activities with lineage | passed |
| existing-browser: 6. Master Daily Sheet dispatches filled operations across multiple menus | passed |
| existing-browser: 1. Navigate to Daily Work Log, add planned activities, toggle Done and Not Done with reason | passed |
| existing-browser: 2. Carry-forward unfinished activities and verify executive dashboard | passed |
| existing-browser: 1. Unauthenticated role headers cannot bypass protected analytics | passed |
| existing-browser: 2. Edge Cases in P&L Calculation (Zero transactions, only purchases, negative stock) | passed |
| existing-browser: 1. Unauthenticated user is redirected to /login | passed |
| existing-browser: 2. Toggle password visibility (Eye / EyeOff icon) | passed |
| existing-browser: 3. Successful login redirects to main Executive Dashboard | passed |
| existing-browser: 1. Machinery Register: Register tractor, log usage with fuel and maintenance, verify report | passed |
| existing-browser: 2. Expenses & Petty Cash: Top-up cash, record petty cash spend, verify running balance | passed |
| existing-browser: 3. Consolidated Final Report: View master ledger, apply filters, and verify export link | passed |
| existing-browser: 1. Machine creation and retrieval | passed |
| existing-browser: 2. Machine usage logging and idempotent CropExpense sync under MACHINERY | passed |
| existing-browser: 3. Machinery reports and plot consumption allocation | passed |
| existing-browser: 4. General and Petty Cash expense logging with MISC CropExpense sync | passed |
| existing-browser: 5. Petty cash running balance calculation and top-ups | passed |
| existing-browser: 6. Consolidated report aggregator and CSV generation | passed |
| existing-browser: create a plot, create a crop, assign crop to plot, verify in plot_crops list | passed |
| existing-browser: assign multiple crops to a plot simultaneously via batch assignment modal | passed |
| existing-browser: verify Plots, Crops, and Plot-Crops are inside a single menu Plots-Crops in the sidebar | passed |
| existing-browser: Current sales and purchases navigation is available | passed |
| existing-browser: Record an itemized sale in the current form and verify invoice and register | passed |
| existing-browser: Printable sales voucher contains official totals and buyer details | passed |
| existing-browser: Current purchase form saves a voucher and inward stock | passed |
| existing-browser: navigate to settings page and trigger a full database reset | passed |
| existing-browser: Stock consumption form at /fertilizer records an issue and reconciles balance | passed |
| existing-browser: Stock consumption form at /diesel records an issue and reconciles balance | passed |
| existing-browser: Machinery form calculates runtime and records the operation | passed |
| existing-browser: Master daily sheet labor dispatch persists the computed labor cost | passed |
| existing-browser: Production API persists quantities without a retired production page | passed |
| existing-browser: Sales API creates an invoice visible in the current sales register | passed |
| existing-browser: Attendance UI, wage register, payment and monthly summary reconcile | passed |
| existing-browser: 1. Wage computation edge cases (Full Day, Half Day, Absent, Leave, Hourly Override, Manual Override) | passed |
| existing-browser: 2. Attendance upsert prevents duplicate records and recalculates wage in lockstep | passed |
| existing-browser: 3. Idempotent sync of WageEntry to CropCycle CropExpense under LABOR category | passed |
| existing-browser: 4. Worker Activity Logging tied to DailyLog and Plot | passed |
| existing-browser: 5. Wage payment settlement (UNPAID -> PARTIAL -> PAID) | passed |
| existing-browser: 6. Monthly Worker Summary calculation & CSV generation | passed |
| firefox-browser: BB session history is reauthenticated after logout in each browser | passed |
| webkit-browser: BB session history is reauthenticated after logout in each browser | passed |
| firefox-browser: browser route /plots renders without an uncaught page error | passed |
| webkit-browser: browser route /plots renders without an uncaught page error | passed |
| firefox-browser: browser route /crops renders without an uncaught page error | passed |
| webkit-browser: browser route /crops renders without an uncaught page error | passed |
| firefox-browser: browser route /employees renders without an uncaught page error | passed |
| webkit-browser: browser route /employees renders without an uncaught page error | passed |
| firefox-browser: browser route /workers renders without an uncaught page error | passed |
| webkit-browser: browser route /workers renders without an uncaught page error | passed |
| firefox-browser: browser route /daily-log renders without an uncaught page error | passed |
| webkit-browser: browser route /daily-log renders without an uncaught page error | passed |
| firefox-browser: browser route /crop-cycles renders without an uncaught page error | passed |
| webkit-browser: browser route /crop-cycles renders without an uncaught page error | passed |
| firefox-browser: browser route /godown renders without an uncaught page error | passed |
| webkit-browser: browser route /godown renders without an uncaught page error | passed |
| firefox-browser: browser route /machines renders without an uncaught page error | passed |
| webkit-browser: browser route /machines renders without an uncaught page error | passed |
| firefox-browser: browser route /expenses renders without an uncaught page error | passed |
| webkit-browser: browser route /expenses renders without an uncaught page error | passed |
| firefox-browser: browser route /sales-register renders without an uncaught page error | passed |
| webkit-browser: browser route /sales-register renders without an uncaught page error | passed |
| firefox-browser: browser route /purchases renders without an uncaught page error | passed |
| webkit-browser: browser route /purchases renders without an uncaught page error | passed |
| firefox-browser: browser route /items renders without an uncaught page error | passed |
| webkit-browser: browser route /items renders without an uncaught page error | passed |
| firefox-browser: browser route /reports/consolidated renders without an uncaught page error | passed |
| webkit-browser: browser route /reports/consolidated renders without an uncaught page error | passed |
| firefox-browser: browser route /reports/pnl renders without an uncaught page error | passed |
| webkit-browser: browser route /reports/pnl renders without an uncaught page error | passed |
| firefox-browser: browser route /settings renders without an uncaught page error | passed |
| webkit-browser: browser route /settings renders without an uncaught page error | passed |
| firefox-browser: B01 rejects incorrect login credentials | passed |
| webkit-browser: B01 rejects incorrect login credentials | passed |
| firefox-browser: B02 requires both login fields | passed |
| webkit-browser: B02 requires both login fields | passed |
| firefox-browser: B03 accepts configured login and loads dashboard | passed |
| webkit-browser: B03 accepts configured login and loads dashboard | passed |
| firefox-browser: B04 persisted plot is visible after a full page reload | passed |
| webkit-browser: B04 persisted plot is visible after a full page reload | passed |
| firefox-browser: B05 employee record is available to the attendance page | passed |
| webkit-browser: B05 employee record is available to the attendance page | passed |
