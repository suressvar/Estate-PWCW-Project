# Application unit-test report

> Historical pre-fix assessment. See [FINAL_SOFTWARE_REPORT.md](FINAL_SOFTWARE_REPORT.md) for current results.

Date: 15 November 2026 (Asia/Kolkata)

## Result

**The application does not pass the test suite.** There are 218 executed checks: **201 passed, 17 failed, 0 skipped**, across 9 test files. Failures are retained as ordinary regression tests so they will verify future fixes. Application behavior was not changed to hide failures.

This is a broad unit-testing assessment, not a claim of complete application coverage. Measured application line coverage is **26.06%**. Most page components and authentication remain untested. The failures and coverage gaps prevent a clean quality sign-off.

## Test scope and results

| Test file | Passed | Failed | Scope |
| --- | ---: | ---: | --- |
| `tests/calculations.test.ts` | 31 | 0 | Full/half/absent/leave wages, overtime, zero overrides, rounding, calendar boundaries, work statuses, stock thresholds, permissions and class merging |
| `tests/business.test.ts` | 55 | 0 | Master data, accounting dependencies, parties, HR salaries, attendance sync, daily work, crop financials, petty cash, machinery, item catalog, inventory, procurement and sales |
| `tests/transactions.test.ts` | 9 | 0 | Transaction records, voucher numbering/subtotals, worker attendance/wages, leave and stock valuation lifecycles |
| `tests/components.test.tsx` | 17 | 0 | Table searching/sorting/empty states, role badges, stat cards and form submission callback |
| `tests/api-read-handlers.test.ts` | 66 | 0 | Every discovered GET handler: isolated empty-store or missing-record handling and JSON response type |
| `tests/api.test.ts` | 13 | 1 | Worker, expense and operation-item request validation and record lifecycle |
| `tests/storage.test.ts` | 6 | 1 | Virtual-disk loading, cache refresh, save/reset, malformed JSON recovery, write failures and legacy defaults |
| `tests/consolidated-reports.test.ts` | 4 | 4 | Populated financial summaries, date/cycle filters, CSV escaping, operational sync and financial regressions |
| `tests/defects.test.ts` | 0 | 11 | Reproductions of invalid input, P&L and stock-sync defects |
| **Total** | **201** | **17** | **218 checks; no skipped tests** |

Read-handler checks are smoke tests, not exhaustive response-schema or populated-data tests. The 18 route files without GET handlers are excluded from read-handler discovery; this does not certify their write methods.

## Confirmed failing checks

Severity describes the business impact demonstrated by the test, not a security classification. D03 and D04 reproduce the same validation weakness at different layers.

| ID | Severity | Reproduction and observed result | Expected result / recommended correction |
| --- | --- | --- | --- |
| D01 | High | Add a paid wage of 1,000 for January 2025; generate November 2026 P&L. Expenses include 1,000. | Exclude wages outside the selected period. Apply the agreed payment/accrual date basis consistently. `src/lib/pnl-data.ts:74` |
| D02 | High | Add a November indirect-expense voucher for 300. P&L reports total expenses of 0. | Include indirect expenses in debit lines and expense totals. `src/lib/pnl-data.ts:61` and `:149` |
| D03 | High | Create a worker with `dailyWageRate: NaN`. Creation succeeds. | Require a finite numeric wage greater than or equal to zero. `src/lib/worker-data.ts:128` |
| D04 | High | POST a worker name without `dailyWageRate`. API returns 201. | Return 400 and do not create a record. Conversion of `undefined` to `NaN` bypasses current checks. `src/app/api/workers/route.ts:21` |
| D05 | Medium | Create an operation item with a minimum stock alert of 0. Stored value becomes 5. | Preserve an explicit zero and default only omitted values. `src/lib/operation-items-data.ts:164` |
| D06 | High | Create a valid expense, then update its amount to -100. Update succeeds. | Apply amount validation to updates. `src/lib/expenses-data.ts:144` |
| D07 | High | Create a sale line with quantity 0 and rate 100. It becomes an invoice for one unit. | Reject zero quantity before saving; avoid defaulting zero to one. `src/lib/sales-data.ts:82` |
| D08 | High | Create a purchase voucher for 10 units, then update it to 20. Godown still shows 10. | Reconcile voucher edits with available stock and movements, accounting for quantities already issued. `src/lib/vouchers-data.ts:177` |
| D09 | High | Create a purchase for 10 units and delete it before issuing any stock. Godown retains all 10. | Reverse unused inward stock and movements; define guarded behavior where stock has already been issued. `src/lib/vouchers-data.ts:207` |
| D10 | High | Create crop-linked machine usage with fuel cost 100, then delete the machine. Its usage logs disappear, but the crop expense remains. | Clean up linked expenses when cascading machine deletion. `src/lib/machinery-data.ts:128` |
| D11 | High | Update an existing worker's daily wage to -1. Update succeeds. | Reuse wage validation when updating. `src/lib/worker-data.ts:155` |
| D12 | High | POST a valid worker into a store with no employees, then GET workers. The list is empty and the worker has been removed from the store. | Preserve workers created through the worker API or synchronize them to employee records. Reading a list should not erase newly created workers. `src/lib/worker-data.ts:35` and `:96`; reproduction in `tests/api.test.ts` |
| D13 | Medium | Load legacy storage containing a crop with type CUSTOM but no category list. CUSTOM is missing from the resulting categories. | Merge existing crop types into migrated categories. Defaults are merged before the missing-category condition, preventing inference. `src/lib/db-storage.ts:1159`; reproduction in `tests/storage.test.ts` |
| D14 | High | Add one general expense of 100 linked to a crop cycle. Consolidated expenses report 200. | Count the original expense and its synchronized crop entry once. `src/lib/consolidated-report-data.ts:329` |
| D15 | High | Add untagged machine usage with fuel cost 100. Estate consolidated expenses report 0. | Include unlinked machinery costs once. `src/lib/consolidated-report-data.ts:329` |
| D16 | High | Record an untagged full day's worker wage of 800. Estate consolidated expenses report 0. | Include unlinked labor wages once. `src/lib/consolidated-report-data.ts:329` |
| D17 | High | Record an estate-wide wage of 800, then filter the consolidated report to a plot with no assigned wages. Its labor KPI still shows 800. | Apply plot association consistently to wage summaries and ledger entries. `src/lib/consolidated-report-data.ts:234` |

## Coverage

Coverage includes application source files under `src`, including untested pages and authentication code. The root layout is excluded. Configuration, tests and browser-test files are outside the measured source set.

| Metric | Covered | Total | Coverage |
| --- | ---: | ---: | ---: |
| Lines | 2,204 | 8,456 | 26.06% |
| Statements | 2,442 | 9,367 | 26.07% |
| Functions | 532 | 2,509 | 21.20% |
| Branches | 1,426 | 7,890 | 18.07% |

Open `coverage/index.html` to inspect each file and uncovered branch. The machine-readable coverage summary is `coverage/coverage-summary.json`.

Coverage gaps requiring further work:

- Page-level forms, dialogs, loading/error states and interactions across the application; the component suite covers four shared components.
- Authentication, session renewal, proxy redirects and enforcement of permissions. Testing permission constants does not establish access control.
- Most write-handler permutations, populated GET responses, malformed types, non-finite values, duplicate requests and cross-record consistency.
- Concurrent writes, real filesystem permissions and recovery, real database/service behavior and multi-user operation. Storage unit tests use a virtual disk.
- Browser navigation, printing, responsive behavior and end-to-end user journeys. Existing Playwright tests were not run against the working estate data.

## Additional validation

| Check | Final result |
| --- | --- |
| TypeScript (`npx tsc --noEmit --pretty false`) | Passed; exit code 0 |
| Full-project ESLint | Failed; 350 errors and 286 warnings |
| New tests and Vitest configuration lint | No errors or warnings |

Type-check output is recorded in `typecheck-results.txt`. Detailed lint results are recorded in `eslint-results.json`. These checks are separate from unit tests.

The initial full lint run, before the unit-test work was complete, found 350 errors and 287 warnings, including an unused import in an early test draft that was subsequently removed. Existing application lint issues were not repaired as part of this testing/reporting request.

Production build, deployment, browser tests and a security audit are not certified by this report.

## Re-run and inspect

```text
npm ci --legacy-peer-deps
npm test
npm run test:coverage
npm run test:coverage -- --reporter=default --reporter=json --outputFile=test-results.json
npx tsc --noEmit --pretty false
npx eslint . --format json --output-file eslint-results.json
```

The current test command exits with failure because the regression cases expose application defects. Do not skip them or change expected results to match incorrect behavior. Fix the high-impact data loss, financial reconciliation and validation issues first, then rerun the same suite.

The existing UI dependencies have a date-fns peer conflict, so installation used `--legacy-peer-deps`. Added development tools are Vitest, Vite, V8 coverage, React Testing Library, DOM Testing Library and jsdom. Package and lock files were updated; no dependency-wide automatic fixes were applied.

## Data and workspace preservation

Business/handler tests replace database access with a fresh in-memory store per case. Storage tests replace filesystem access with a virtual disk. No live server, account credentials or external services are needed. No application source behavior was changed. Existing local application edits were preserved.

The estate data file's SHA-256 was identical before and after execution:

```text
39E0824943BD7DE89B9DB485E5F4DD104ADEF415B71A2C1C67C27542D698B666
```

Added reusable assets: `vitest.config.mts`, `tests/`, npm test scripts and testing guidance in `README.md`. Generated coverage and logs are ignored by Git. ESLint ignores generated coverage output.
