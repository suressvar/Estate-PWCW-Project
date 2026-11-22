# Coverage improvement and final verification report

22 November 2026 · Ranga Estate PWCW · Asia/Kolkata

## Result

**Assessment: 94/100. All 1017 final test cases passed; zero failures or skips.** Added 167 unit/API regression cases, increasing the unit suite from 519 to 686. Financial and attendance behavior has stronger verified protection; the score remains a conservative overall engineering assessment, separate from test coverage. It is not a certification that every possible bug has been eliminated.

## Measured unit coverage

| Metric | Previous saved result | Current | Change in percentage points |
| --- | ---: | ---: | ---: |
| lines | 64.02% | 65.31% | +1.29 |
| branches | 45.42% | 46.54% | +1.12 |
| functions | 52.22% | 53.5% | +1.28 |
| statements | 62.5% | 63.89% | +1.39 |

The coverage scope is unchanged: all source TypeScript/TSX except the root layout. No files were excluded to improve the numbers. HTTP/browser coverage is not merged into these unit figures. The previous saved branch artifact was 45.42%; the pasted table rounded/reported 45.44%.

Core libraries: **89.20% lines**, **70.77% branches**. The 15 targeted API files: **100.00% lines**, **88.78% branches**.

| Targeted API | Lines | Branches |
| --- | ---: | ---: |
| /api/attendance/bulk | 100% | 100% |
| /api/attendance/grid | 100% | 100% |
| /api/attendance/mark | 100% | 100% |
| /api/attendance/summary | 100% | 100% |
| /api/workers/attendance | 100% | 100% |
| /api/salary/calculate | 100% | 100% |
| /api/salary/pay/[id] | 100% | 100% |
| /api/workers/wages | 100% | 92.85% |
| /api/leaves | 100% | 100% |
| /api/leaves/[id] | 100% | 100% |
| /api/expenses | 100% | 85.71% |
| /api/expenses/petty-cash | 100% | 75% |
| /api/crop-cycles/[id]/expenses | 100% | 83.33% |
| /api/crop-cycles/[id]/incomes | 100% | 85.71% |
| /api/crop-cycles/[id]/sync-operations | 100% | 100% |

Enforced minimum coverage was raised from lines 60 / statements 59 / functions 48 / branches 40 to **65 / 63 / 53 / 46**. The final unit run passed these higher requirements.

## Bugs reproduced and fixed

- Payroll accepted explicit zero, blank, invalid or boolean working-day values by silently defaulting/coercing them. It now validates period and working days before calculation; omitted working days still default to 26. Attendance/salary queries reject invalid, partial and out-of-range periods with a structured client error.
- Empty-workforce bulk attendance skipped validation. Invalid dates and statuses are now rejected even when there are no active employees.
- Attendance accepted impossible clock times and a check-out earlier than check-in on the same attendance date. Shared worker attendance validation checks both new and retained clock fields before changing attendance or wages. Empty optional clock fields remain supported.
- Crop expense/income deletion ignored the parent crop-cycle ID. Deletion now checks membership inside the transaction; a request through another crop's endpoint returns 404 and preserves the original record. Storage failures return a structured error.
- Crop expense/income creation and operation sync could commit changes before a later financial-response failure. Each complete synchronous handler operation now runs in one transaction, including response construction.
- Petty-cash top-up/recalculation could commit before a later balance-response failure. Their complete operation and response now share a transaction.
- Worker payment could commit before a subsequent crop-expense sync failed. Payment and sync now share a transaction.
- Crop-income APIs converted boolean numbers into valid amounts and allowed an overflowing calculated income or blank unit. Numeric validation now precedes coercion, and calculated income and units are validated before saving.

## Expanded test behavior

Tests cover valid workflows, missing resources and IDs, malformed JSON/null/array payloads, numeric/date/enum/reference rejection, derived-field tampering, paid-salary protection, payroll adjustments and payment, leave approval/rejection/deletion, partial worker payments, ledger filters and summaries, multi-employee failure, and rollback of attendance, wages, cash and linked crop expenses. Fault injection includes failed persistence and failures after earlier mutations. Initial regression logs retain the observed failures; invalid test fixtures were corrected separately from application fixes.

## Final executed checks

| Suite/check | Result |
| --- | --- |
| Unit/component/authentication/storage/direct-handler tests | 686 passed |
| Production HTTP integration/validation/Chromium browser suite | 239 passed |
| Existing repository browser/logic suite | 50 passed |
| Firefox/WebKit compatibility | 42 passed |
| Combined | **1017 passed; 0 failed; 0 skipped** |
| Production build | Passed, Next.js 16.4.6 |
| TypeScript and full-project lint | Passed; 0 lint errors/warnings |
| Dependency audit | 0 known advisories |
| Current source versus tested production copy | Matching fingerprints |
| Estate data | Same SHA-256 before and after final tests |

The complete test launcher exited successfully with the added worker-attendance cases and higher coverage floors. An earlier pass was stopped after a concurrent workers-screen change introduced a lint error; that edit was preserved, its mount update was corrected, and the entire sequence was restarted. Final production reports postdate preparation of the tested build, and source fingerprints match. Counts include overlapping checks, rather than unique requirements.

## Score and remaining limits

The 94/100 assessment retains the earlier risk-weighted rubric: workflows 24/25; financial consistency 24/25; validation 19/20; security 18/20; build/tests/maintainability 9/10. This pass increases confidence within that score. Whole-app branch coverage of 46.54% is still moderate and prevents a 100/100 claim. Further work should exercise the remaining financial/report API failure branches and complex UI interactions, then expand other API families. A high score must not be interpreted as complete coverage.

Independent penetration testing, a full accessibility audit, sustained production-sized load, distributed/network-file storage, multi-user permissions and external-service integrations were not verified in this pass. Existing single-administrator/local-storage deployment constraints remain. No deployment or migration was performed. Other concurrent work was preserved.

## Evidence

Evidence directory: C:/Users/Suressvar/.codex/visualizations/2026/11/15/01a1de5c-0a4c-7b70-b3a8-f859a9796134/coverage-improvement-evidence

- test-results.json; integration-results.json; legacy-browser-results.json; cross-browser-results.json
- coverage/index.html; coverage/coverage-summary.json; coverage-comparison.json
- all-test-output.txt; all-test-exit.txt; unit-final-output.txt; integration-build-output.txt
- fix-typecheck.txt; fix-lint.json; dependency-audit-final.json
- regressions-before.txt; regressions-after.txt; failure-paths-before.txt; focused-final.txt

Estate data SHA-256: ba95846e7bd9b75425e70a887f5b178a0cf773109152577765e849b4e38cfcf3

Tests used the marked disposable .black-box-app copy on port 3117 and synthetic records. The original estate records were not copied into tests.
