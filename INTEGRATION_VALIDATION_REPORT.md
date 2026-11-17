# Integration, validation and software assessment

> Historical pre-fix assessment. See [FINAL_SOFTWARE_REPORT.md](FINAL_SOFTWARE_REPORT.md) for current results.

Date: 15 November 2026 (Asia/Kolkata)

## Overall assessment: 40 / 100

The application has a usable interface and working core workflows, but it is not ready for shared production use or to serve as the authoritative financial record. Critical access-control failures, invalid data acceptance, disappearing workers and reconciliation errors outweigh the successful page and happy-path checks.

This is an engineering judgment of current production readiness, weighted by business impact. It is not a standardized certification or the percentage of tests that passed. Several tests exercise the same underlying defect from different angles.

| Quality dimension | Score | Evidence |
| --- | ---: | --- |
| Feature usability and basic workflows | 20 / 25 | All 20 current-interface browser checks pass, including login validation, dashboard entry, persisted plot display and employee-to-attendance display. Fifteen primary pages render without uncaught page errors. |
| Financial and cross-module correctness | 10 / 25 | Core crop, wage, stock dispatch, sales and petty-cash flows work; expense double counting, stale stock after voucher correction and disappearing direct-created workers fail through real HTTP requests. Earlier unit regressions expose further accounting omissions. |
| Input validation and record integrity | 5 / 20 | Most negative-input checks fail. Invalid numeric values, dates, statuses, references and empty records reach storage; bad employee creation can break the workers listing. |
| Authentication and access control | 0 / 20 | Unauthenticated employee reads, worker creation and global reset succeed. A fabricated auth cookie grants page access. |
| Build, testing and maintainability | 5 / 10 | Production compilation and type checking pass. Unit line coverage is 26.06%, existing lint remains failing, and several older browser tests no longer match the interface. |
| **Total** | **40 / 100** | **Suitable for demonstration and controlled testing; production blockers remain.** |

## Executed results

| Suite / category | Passed | Failed | Total |
| --- | ---: | ---: | ---: |
| New real-HTTP integration workflows | 8 | 3 | 11 |
| New server-side input validation | 8 | 28 | 36 |
| New access-control checks | 1 | 4 | 5 |
| New current-interface browser checks | 20 | 0 | 20 |
| **New tests total** | 37 | 35 | 72 |
| Existing repository suite, independently rerun | 36 | 14 | 50 |
| Prior unit/component/handler suite | 201 | 17 | 218 |

The suites overlap in behavior; these counts must not be interpreted as that many unique product requirements. The prior unit results are documented in [UNIT_TEST_REPORT.md](UNIT_TEST_REPORT.md).

The final new test run used an optimized **Next.js 16.2.10 production build**, real HTTP requests, Chromium and real disk persistence in a separate test application. Database access was not mocked. The initial development-server trial produced intermittent framework JSON parsing errors and was superseded by the production run; its results are not used for the score.

## Release blockers verified

1. **Critical — access control:** a client without a login session can read employees (HTTP 200), create workers (201), and reset all application data (200). A cookie named estate_authenticated with value false grants protected-page access (200). These tests ran only on the isolated server. This demonstrates risk to anyone able to reach the server; public internet exposure was not tested. The login credentials and cookie creation currently live in client-side code rather than a server-verified session.
2. **High — reconciliation:** one crop-linked general expense of 100 appears as 200 in consolidated expense totals. Updating a purchase from 10 to 20 units leaves godown stock at 10. A newly created direct worker disappears when its list is read. These reproduce the earlier unit findings through the running production application.
3. **High — invalid records:** missing/nonnumeric wages and nonnumeric expenses return success, with numeric values serialized as null. Negative stock/rates, empty employee records, invalid attendance status, negative wage payments, invalid dates and nonexistent plot references are accepted. Zero sale quantity becomes one unit. Validation must be enforced on the server for creates and updates.
4. **High — failure propagation:** accepting an empty employee record can make the workers GET endpoint return a server error. Validation weaknesses therefore affect later normal operations, not only the submitted record.
5. **High — previously identified financial defects remain:** out-of-period wages in P&L, omitted indirect expenses, stale crop expenses after machine deletion, and consolidated-report omissions/filtering defects remain covered by the earlier failing regressions. No application fixes were made during this assessment.

## What worked

- Production build completed successfully, including type checking and generation of 98 static pages/routes. The separate workspace type check also passed.
- Current login rejects missing and incorrect credentials and reaches the dashboard for the configured account. This UI behavior does not establish secure authentication.
- Crop expenses and income persist across endpoints, with correct crop and plot rollups in the tested positive scenario.
- Employee attendance, half-day adjustment, partial payment and crop-expense synchronization reconcile in the tested flow.
- Voucher inward stock, fertilizer dispatch, consumption logs and rejection of over-issue reconcile.
- Backdated petty-cash top-ups and expense deletion produce correct balances.
- Sales invoice totals agree with analytics, including a quantity edit.
- Item-code uniqueness works across HTTP requests.
- A burst of 20 concurrent expense submissions is checked for complete retention, unique IDs and correct totals. This is a small concurrency check, not a production load benchmark.

## Existing suite interpretation

The 50 older tests include browser journeys and direct library integration tests. They were copied without changing assertions; only localhost port references were redirected from 3000 to 3107. Direct-library tests ran with their working directory inside the isolated copy so file writes could not reach the working estate records.

Older browser failures often wait for removed selectors, retired routes or old navigation labels, including #fert-name-input, #start-date-filter, #sales-buyer-input, /labor, /production and Vouchers (Purchases). The daily-work journey tries to use activity controls while the current page defaults to the master-sheet view. These are recorded as failing/stale journeys, not automatically counted as additional application defects. Current-interface tests independently verify the principal pages. The older test labelled an RLS bypass attempt merely expects HTTP 200 and a kpis property; its passing result does not establish access restrictions.

## Required order of fixes

1. Implement server-verified sessions and enforce authentication/roles on every protected read and write, especially data reset. Replace the client-only login/cookie gate.
2. Correct financial totals, stock reversals/corrections and worker/employee synchronization. Add explicit source linkage so a transaction is counted once.
3. Apply consistent validation for finite numbers, signs, date ranges, enums and referenced records to all create/update methods. Invalid submissions should return a clear client error without changing stored data.
4. Repair stale browser tests, fix existing lint errors and extend critical-flow branch coverage.
5. Rerun the unchanged regression expectations, then test recovery, multi-process concurrency, production-sized data and deployment access boundaries before sign-off.

## Evidence, isolation and limitations

- Human-readable browser reports: integration-report/index.html and legacy-browser-report/index.html.
- Structured results: integration-results.json and legacy-browser-results.json; traces/screenshots are retained for failures in the corresponding artifacts folders.
- Build log: integration-build-output.txt. New test/config/helper lint: integration-lint.json. Type-check output: integration-typecheck.txt.
- The original estate data was not copied to the test server. No environment secrets were copied and no external account/service was exercised. The existing development server on port 3000 was not used for test mutations.
- Estate data SHA-256 before preparation: 39e0824943bd7de89b9db485e5f4dd104adef415b71a2c1c67c27542d698b666.
- Estate data SHA-256 after testing: 39e0824943bd7de89b9db485e5f4dd104adef415b71a2c1c67c27542d698b666.
- Original estate data unchanged: **YES**.
- No production application behavior was changed. Only test harnesses, test configuration and documentation were added or adjusted. Existing application edits were preserved.
- Chromium on Windows was tested. Cross-browser/mobile interaction depth, external backends, public deployment configuration, penetration testing, backup restoration and sustained/multi-process load were not verified. A page render check does not certify all controls or forms on that page.

## Reproduce safely

Run these separately from the project root:

~~~text
npm run test:integration:prepare
npm run test:integration:build
npm run test:integration
npm run test:integration:legacy
~~~

Run the two test suites sequentially because they share a test server port and isolated data. The legacy wrapper deliberately sets its working directory to the test copy. Do not run the original direct-storage browser suite from the project root against real estate data. If Chromium is not installed, install the matching Playwright browser; PLAYWRIGHT_CHROMIUM_EXECUTABLE can select an existing executable.

Both test commands are expected to exit unsuccessfully while confirmed regressions remain. Keep the failing assertions as release gates.

## New failing checks

| Test | Result |
| --- | --- |
| S02 unauthenticated users cannot read employee records | failed |
| S03 unauthenticated users cannot create workers | failed |
| S04 unauthenticated users cannot reset application data | failed |
| S05 a fabricated auth cookie cannot grant page access | failed |
| V01 plot requires a name | failed |
| V02 plot rejects negative acreage | failed |
| V03 plot rejects nonnumeric acreage | failed |
| V04 plot rejects invalid status | failed |
| V05 worker rejects missing wage | failed |
| V06 worker rejects nonnumeric wage | failed |
| V11 expense rejects nonnumeric amount | failed |
| V12 expense rejects invalid date | failed |
| V13 expense rejects unknown category | failed |
| V15 sale rejects zero quantity | failed |
| V16 sale rejects negative rate | failed |
| V17 sale requires invoice lines | failed |
| V18 godown rejects negative received stock | failed |
| V19 godown rejects negative rate | failed |
| V20 catalog rejects negative stock | failed |
| V21 catalog rejects negative rate | failed |
| V22 crop cycle rejects nonexistent plot | failed |
| V23 crop cycle rejects reversed dates | failed |
| V24 daily work rejects nonexistent plot | failed |
| V25 daily work rejects invalid date | failed |
| V27 petty cash rejects nonnumeric top-up | failed |
| V28 voucher rejects invalid route type | failed |
| V29 employee requires name and wage fields | failed |
| malformed JSON is a client error at /api/plots | failed |
| V33 expense updates enforce the create-time amount rule | failed |
| V34 attendance rejects invalid status values | failed |
| V35 wage payments reject negative amounts | failed |
| V36 invalid employee submission cannot break the worker-list API | failed |
| I08 linked general expense is counted once across report modules | failed |
| I09 new worker remains visible after re-fetching its register | failed |
| I10 purchase correction updates the stock module | failed |

## Existing-suite failures requiring maintenance or investigation

| Test | Result | First error |
| --- | --- | --- |
| seed known transactions and verify computed P&L matches manual calculation | timedOut | Test timeout of 30000ms exceeded. |
| 1. Navigate to Daily Work Log, add planned activities, toggle Done and Not Done with reason | timedOut | Test timeout of 30000ms exceeded. |
| 2. Edge Cases in P&L Calculation (Zero transactions, only purchases, negative stock) | timedOut | Test timeout of 30000ms exceeded. |
| 1. Sidebar navigation contains Sales & Purchases accordions | failed | Error: expect(locator).toBeVisible() failed Locator: locator('aside').getByText('Vouchers (Purchases)') Expected: visible |
| 2. Create a new Sales Voucher with itemized produce and verify in ledger | timedOut | Test timeout of 30000ms exceeded. |
| 3. Open and inspect official printable Sales Voucher Slip with Letterhead and Amount in Words | timedOut | Test timeout of 30000ms exceeded. |
| 4. Create a new Purchase Voucher and verify in purchase ledger and slip | timedOut | Test timeout of 30000ms exceeded. |
| 1. Submit Fertilizer Log entry and verify in history | failed | Error: expect(locator).toContainText(expected) failed Locator: locator('main h1') Expected substring: "Fertilizer Logs" |
| 2. Submit Diesel Log entry and verify in history | failed | Error: expect(locator).toContainText(expected) failed Locator: locator('main h1') Expected substring: "Diesel Fuel Logs" |
| 3. Submit Machinery Log with auto-calculated runtime & diesel | failed | Error: expect(locator).toContainText(expected) failed Locator: locator('main h1') Expected substring: "Machinery Usage" |
| 4. Submit Labor Log with auto-calculated total wages | failed | Error: expect(locator).toContainText(expected) failed Locator: locator('main h1') Expected substring: "Labor Usage" |
| 5. Submit Production Log entry and verify in history | failed | Error: expect(locator).toContainText(expected) failed Locator: locator('main h1') Expected substring: "Crop Production" |
| 6. Submit Sales Log entry and verify in history | failed | Error: expect(locator).toContainText(expected) failed Locator: locator('main h1') Expected substring: "Crop Sales" |
| Mark attendance for 2 workers, log activities, verify computed wages, settle payment and verify register | failed | Error: expect(locator).toContainText(expected) failed Locator: locator('h1') Expected substring: "Worker Management & Wages" |
