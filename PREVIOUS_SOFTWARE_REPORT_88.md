# Final software repair and verification report

Date: 16 November 2026 (Asia/Kolkata)

## Assessment: 88 / 100, improved from 40 / 100

The identified release blockers have been repaired and the final verification gates pass. The application is suitable for a controlled single-administrator rollout using one application process, HTTPS and protected backups. This is an engineering assessment of the tested software, not a certification or a claim that every possible defect has been eliminated.

| Quality dimension | Score | Basis |
| --- | ---: | --- |
| Feature usability and workflows | 24 / 25 | Current browser journeys, primary page rendering and supported cross-module workflows pass. |
| Financial and data consistency | 22 / 25 | Original financial regressions pass; stock reversals, guarded deletion, transaction rollback and reconciliation checks pass. |
| Input validation | 18 / 20 | All targeted invalid-input regressions pass, including malformed JSON, numeric/date/enum/reference validation and update-time checks. |
| Authentication and security | 17 / 20 | Server-verified signed sessions, protected API access, cross-site write rejection, expiring HttpOnly cookies and a clean dependency audit. |
| Build, tests and maintainability | 7 / 10 | Production build, type checking and lint are clean. Broader unit branch coverage and operational testing remain incomplete. |
| **Total** | **88 / 100** | **Known blockers fixed; remaining limits are explicit below.** |

The score weights business risk and verification scope; it is not the percentage of tests that passed.

## Final executed results

| Suite | Passed | Failed | Total |
| --- | ---: | ---: | ---: |
| Unit, component, storage, authentication and direct-handler tests | 236 | 0 | 236 |
| Production HTTP integration, validation and browser suite | 79 | 0 | 79 |
| Updated existing repository suite | 50 | 0 | 50 |
| **Combined** | **365** | **0** | **365** |

No tests are skipped. Some suites exercise overlapping behavior; this is not a count of unique requirements.

| Production suite detail | Passed | Failed | Total |
| --- | ---: | ---: | ---: |
| Cross-module workflows and transaction consistency | 14 | 0 | 14 |
| Server input validation | 36 | 0 | 36 |
| Access control and session behavior | 9 | 0 | 9 |
| Current-interface browser checks | 20 | 0 | 20 |

| Additional gate | Result |
| --- | --- |
| Next.js 16.4.6 optimized production build | Passed |
| TypeScript | Passed |
| Full-project ESLint | 0 errors, 0 warnings |
| Full installed-dependency security audit | 0 known advisories |
| Original estate data preservation | Identical SHA-256 before and after testing |

## What changed

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
| Lines | 2445 | 8781 | 27.84% |
| Statements | 2762 | 10003 | 27.61% |
| Functions | 602 | 2707 | 22.23% |
| Branches | 1650 | 8322 | 19.82% |

- Unit coverage includes untested application pages; a clean suite does not mean complete source coverage. Browser route checks also do not verify every control on every page.
- File transactions coordinate synchronous work in one application process. Do not run multiple independent writers against this JSON file. Multi-instance deployment requires a transactional database or a verified cross-process storage design.
- The 20-request concurrency check passes in the tested single-server setup; sustained load, multi-process races and production-sized data were not benchmarked.
- Authentication currently supports one administrator. Multi-user roles, centralized session revocation, external identity services and a penetration test were not implemented or certified.
- HTTPS deployment configuration, backup restoration drills, cross-browser/mobile depth and external database/service integrations were not tested. Storage fault injection uses a virtual filesystem; HTTP workflows use real isolated disk storage.
- No deployment or migration of existing estate records was performed. These limits are why the score is 88 rather than 100.

## Evidence and data preservation

- Browser reports: integration-report/index.html and legacy-browser-report/index.html.
- Unit coverage: coverage/index.html and coverage/coverage-summary.json.
- Structured results: test-results.json, integration-results.json and legacy-browser-results.json.
- Additional logs: integration-build-output.txt, fix-typecheck.txt, fix-lint.json and dependency-audit-final.json.
- Original data SHA-256 before: 39e0824943bd7de89b9db485e5f4dd104adef415b71a2c1c67c27542d698b666
- Original data SHA-256 after: 39e0824943bd7de89b9db485e5f4dd104adef415b71a2c1c67c27542d698b666

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
npm audit
~~~

Run the two production suites sequentially. The safe legacy wrapper sets its working directory to the isolated copy; direct-storage tests are blocked from running against working estate records.

## Production test inventory

| Test | Result |
| --- | --- |
| S01 unauthenticated pages redirect to login | passed |
| S02 unauthenticated users cannot read employee records | passed |
| S03 unauthenticated users cannot create workers | passed |
| S04 unauthenticated users cannot reset application data | passed |
| S05 a fabricated auth cookie cannot grant page access | passed |
| S06 API paths with file extensions still require a session | passed |
| S07 signed-in cross-site writes are rejected | passed |
| S08 logout removes browser authentication | passed |
| S09 session cookie is inaccessible to scripts and same-site restricted | passed |
| browser route /plots renders without an uncaught page error | passed |
| browser route /crops renders without an uncaught page error | passed |
| browser route /employees renders without an uncaught page error | passed |
| browser route /workers renders without an uncaught page error | passed |
| browser route /daily-log renders without an uncaught page error | passed |
| browser route /crop-cycles renders without an uncaught page error | passed |
| browser route /godown renders without an uncaught page error | passed |
| browser route /machines renders without an uncaught page error | passed |
| browser route /expenses renders without an uncaught page error | passed |
| browser route /sales-register renders without an uncaught page error | passed |
| browser route /purchases renders without an uncaught page error | passed |
| browser route /items renders without an uncaught page error | passed |
| browser route /reports/consolidated renders without an uncaught page error | passed |
| browser route /reports/pnl renders without an uncaught page error | passed |
| browser route /settings renders without an uncaught page error | passed |
| B01 rejects incorrect login credentials | passed |
| B02 requires both login fields | passed |
| B03 accepts configured login and loads dashboard | passed |
| B04 persisted plot is visible after a full page reload | passed |
| B05 employee record is available to the attendance page | passed |
| V01 plot requires a name | passed |
| V02 plot rejects negative acreage | passed |
| V03 plot rejects nonnumeric acreage | passed |
| V04 plot rejects invalid status | passed |
| V05 worker rejects missing wage | passed |
| V06 worker rejects nonnumeric wage | passed |
| V07 worker rejects negative wage | passed |
| V08 worker rejects blank name | passed |
| V09 expense rejects zero | passed |
| V10 expense rejects negative amount | passed |
| V11 expense rejects nonnumeric amount | passed |
| V12 expense rejects invalid date | passed |
| V13 expense rejects unknown category | passed |
| V14 expense rejects missing description | passed |
| V15 sale rejects zero quantity | passed |
| V16 sale rejects negative rate | passed |
| V17 sale requires invoice lines | passed |
| V18 godown rejects negative received stock | passed |
| V19 godown rejects negative rate | passed |
| V20 catalog rejects negative stock | passed |
| V21 catalog rejects negative rate | passed |
| V22 crop cycle rejects nonexistent plot | passed |
| V23 crop cycle rejects reversed dates | passed |
| V24 daily work rejects nonexistent plot | passed |
| V25 daily work rejects invalid date | passed |
| V26 petty cash rejects negative top-up | passed |
| V27 petty cash rejects nonnumeric top-up | passed |
| V28 voucher rejects invalid route type | passed |
| V29 employee requires name and wage fields | passed |
| malformed JSON is a client error at /api/workers | passed |
| malformed JSON is a client error at /api/expenses | passed |
| malformed JSON is a client error at /api/plots | passed |
| V33 expense updates enforce the create-time amount rule | passed |
| V34 attendance rejects invalid status values | passed |
| V35 wage payments reject negative amounts | passed |
| V36 invalid employee submission cannot break the worker-list API | passed |
| I01 crop expense and income persist across routes and roll into plot finances | passed |
| I02 employee attendance calculates wages and synchronizes one crop expense through payment | passed |
| I03 voucher inward, godown dispatch and fertilizer consumption reconcile | passed |
| I04 petty-cash balances recalculate after backdated top-ups and expense deletion | passed |
| I05 invoice totals agree with sales analytics after edits | passed |
| I06 catalog code uniqueness survives separate HTTP requests | passed |
| I07 rejected over-issue leaves stock and movements unchanged | passed |
| I08 linked general expense is counted once across report modules | passed |
| I09 new worker remains visible after re-fetching its register | passed |
| I10 purchase correction updates the stock module | passed |
| I11 concurrent expense submissions retain every transaction | passed |
| I12 main purchase deletion reverses unused inward stock | passed |
| I13 purchase deletion preserves issued stock and the original voucher | passed |
| I14 invalid purchase line cannot partially save a voucher or stock | passed |
| Known transaction costs and revenue reconcile in dashboard analytics | passed |
| Create a crop cycle, add 3 expenses and 2 incomes, verify exact P&L on detail page and plot rollup | passed |
| 1. Sum and financial rollup logic: 3 expenses and 2 incomes calculation | passed |
| 2. Edge Case: Only expenses incurred, zero harvest income yet (Net Loss calculation) | passed |
| 3. Plot-Level Lifetime Rollup across multiple crop cycles | passed |
| 4. Non-blocking date range validation warnings | passed |
| 5. Idempotent operational sync from labor and machinery logs | passed |
| 1. Enforces unique constraint per plot + date via upsert logic | passed |
| 2. WorkActivity defaults to plannedFlag: true, completedFlag: false | passed |
| 3. Updating activity to NOT_DONE strictly requires a valid reason | passed |
| 4. Computes DailyLog status dynamically from activity states | passed |
| 5. End-of-day auto-transition carries forward incomplete activities with lineage | passed |
| 6. Master Daily Sheet dispatches filled operations across multiple menus | passed |
| 1. Navigate to Daily Work Log, add planned activities, toggle Done and Not Done with reason | passed |
| 2. Carry-forward unfinished activities and verify executive dashboard | passed |
| 1. Unauthenticated role headers cannot bypass protected analytics | passed |
| 2. Edge Cases in P&L Calculation (Zero transactions, only purchases, negative stock) | passed |
| 1. Unauthenticated user is redirected to /login | passed |
| 2. Toggle password visibility (Eye / EyeOff icon) | passed |
| 3. Successful login redirects to main Executive Dashboard | passed |
| 1. Machinery Register: Register tractor, log usage with fuel and maintenance, verify report | passed |
| 2. Expenses & Petty Cash: Top-up cash, record petty cash spend, verify running balance | passed |
| 3. Consolidated Final Report: View master ledger, apply filters, and verify export link | passed |
| 1. Machine creation and retrieval | passed |
| 2. Machine usage logging and idempotent CropExpense sync under MACHINERY | passed |
| 3. Machinery reports and plot consumption allocation | passed |
| 4. General and Petty Cash expense logging with MISC CropExpense sync | passed |
| 5. Petty cash running balance calculation and top-ups | passed |
| 6. Consolidated report aggregator and CSV generation | passed |
| create a plot, create a crop, assign crop to plot, verify in plot_crops list | passed |
| assign multiple crops to a plot simultaneously via batch assignment modal | passed |
| verify Plots, Crops, and Plot-Crops are inside a single menu Plots-Crops in the sidebar | passed |
| Current sales and purchases navigation is available | passed |
| Record an itemized sale in the current form and verify invoice and register | passed |
| Printable sales voucher contains official totals and buyer details | passed |
| Current purchase form saves a voucher and inward stock | passed |
| navigate to settings page and trigger a full database reset | passed |
| Stock consumption form at /fertilizer records an issue and reconciles balance | passed |
| Stock consumption form at /diesel records an issue and reconciles balance | passed |
| Machinery form calculates runtime and records the operation | passed |
| Master daily sheet labor dispatch persists the computed labor cost | passed |
| Production API persists quantities without a retired production page | passed |
| Sales API creates an invoice visible in the current sales register | passed |
| Attendance UI, wage register, payment and monthly summary reconcile | passed |
| 1. Wage computation edge cases (Full Day, Half Day, Absent, Leave, Hourly Override, Manual Override) | passed |
| 2. Attendance upsert prevents duplicate records and recalculates wage in lockstep | passed |
| 3. Idempotent sync of WageEntry to CropCycle CropExpense under LABOR category | passed |
| 4. Worker Activity Logging tied to DailyLog and Plot | passed |
| 5. Wage payment settlement (UNPAID -> PARTIAL -> PAID) | passed |
| 6. Monthly Worker Summary calculation & CSV generation | passed |
