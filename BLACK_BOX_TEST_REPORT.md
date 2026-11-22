# Black-box testing and repair report

22 November 2026, Asia/Kolkata. Application: Ranga Estate PWCW. Verification ran on 21–22 November.

## Result and score

**94/100**, retained as a conservative engineering assessment. All final verification gates passed. This is not a certification that every possible bug has been eliminated.

| Final suite | Passed | Failed |
| --- | ---: | ---: |
| Unit, component, storage and direct-handler regression tests | 519 | 0 |
| Production HTTP integration, validation and browser tests | 239 | 0 |
| Additional black-box cases included in the production suite above | 147 | 0 |
| Existing repository browser/logic suite | 50 | 0 |
| Firefox and WebKit, including logout/history checks | 42 | 0 |
| **Combined regression total** | **850** | **0** |

The black-box row is a subset of the production suite and is not added twice. No tests were skipped. Build, type checks and lint passed; lint reported zero errors and warnings. The dependency audit reported zero known advisories. The tested production source matched the working application.

## Method

The new black-box specifications use public HTTP requests and browser interactions. They do not import business functions, read application storage, or bypass authentication. Setup and reset operations use authenticated public APIs against a marked disposable application copy. Unit and legacy logic tests run separately as regression checks.

The additional cases cover 80 invalid-body combinations across 16 public write endpoints; 27 additional empty-register routes and reloads; missing-resource responses; rejected-update preservation; stored markup displayed as text; failed saves and retry; repeated save clicks; canceling unsaved changes; CSV safety and data fidelity; logout and browser history; five phone layouts; recovery after failed register loads; 16 operational quantity/date boundaries; and fuel metadata/fractional-issue workflows. Existing production tests cover positive business workflows, numeric/date/reference boundaries, access control and the remaining primary routes.

## Reproduced defects and repairs

| Observed failure | Repair | Final public-interface evidence |
| --- | --- | --- |
| Rejected plot/crop saves closed the form and discarded entered values. | Check server acceptance, retain the form and input, display the error, and permit retry. Related assignment/category actions also check acceptance. | Failed-save, retained-input and successful-retry scenarios pass. |
| Rapid Save clicks created two identical plot records. | Prevent duplicate pending submissions with an immediate guard and disabled form controls. | A delayed double-click creates exactly one persisted plot. |
| Formula-like customer names were exported as raw spreadsheet cells. | Use shared CSV field escaping and quoted text protection across sales, purchases, attendance, inventory, workforce and consolidated exports. | Sales downloads and workforce/consolidated HTTP downloads protect benign formula-like test values. |
| Browser Back restored a protected register after logout. | Discard the client router cache at logout, request no storage for protected responses, and reauthenticate restored browser documents. | Logout/history scenarios pass in Chromium, Firefox and WebKit. Rejected logout also shows feedback without claiming the session ended. |
| A failed plot/crop loading request caused a page exception. | Validate loading responses, retain existing data, show a clear error and provide Retry. | Injected 503 responses cause no page exception; retry retrieves and displays a saved record. |
| Operational APIs accepted negative, invalid, overflowing quantities and impossible dates, including values serialized as null. | Validate before committing logs and return a client error. Preserve required transaction data and rollback on rejection. | All 16 new boundary cases failed before repair; final cases require rejection and an unchanged register. |
| Fuel quantities were saved but displayed blank, selected metadata was lost, and fractional issues were blocked by the form. | Use canonical log fields, retain plot/equipment/operator metadata and permit the supported quantity precision. | A public 0.001 L issue leaves 0.999 L in stock and appears in the register; metadata retention is asserted. |
| Already-fixed failures reappeared when an older application and copied test snapshot was launched. | Normal test commands refresh stale builds/copies, verify build fingerprints, and guard legacy tests against the real workspace. | The old snapshot is rejected; both storage-safety unit checks pass. All regression cases pass, with compatibility rerun after an interrupted browser cleanup. |

Related export repairs preserve commas, quotes, newlines, Unicode, hash characters and zero amounts. Download data is encoded completely rather than treating hash characters as URL fragments. Fifteen additional unit cases check CSV safety, cell boundaries, numeric fidelity and download encoding.

Restored missing accessible labels for fertilizer quantity and machine start/end times. Legacy tests now verify saved completion state instead of a theme-specific color, use current visible headings/actions, and accept equivalent valid CSV quoting. No failing test was skipped.

Spreadsheet protection follows [OWASP CSV Injection guidance](https://community.owasp.org/attacks/CSV_Injection). Formula-like text is prefixed with a tab inside a quoted field; real numeric values remain numeric. This changes the exported representation of suspicious text. Spreadsheet applications and downstream importers differ; their formula execution was not independently certified.

## Verification limits

- All executed checks pass, but exhaustive testing of every input and state combination is not possible. This pass does not establish that the application is bug-free.
- Whole-source unit coverage is 64.02% of lines, 62.5% of statements, 52.22% of functions and 45.42% of branches. Core-library line coverage is 88.01%. These figures measure unit execution, not black-box feature completeness; browser coverage is not merged into them.
- Full accessibility certification, independent penetration testing, long-running soak tests, production-scale capacity and every interaction in every browser remain outside the verified scope.
- The product remains a single-administrator application with cooperating local file writers. Multi-host storage and external service integrations are not certified by these tests. Legacy approved leave without provenance snapshots still needs manual attendance review before reversal.
- Other layout work was retained and retested. Generated evidence was moved outside the shared cleanup area. Earlier interrupted runs and corrected test assumptions are excluded from the final passing totals.
- The all-suite command reached the final browser cleanup before a long interruption caused a teardown timeout. The complete compatibility suite was rerun against the same verified source; the final tables use that rerun rather than treating the interrupted command as a clean run.

## Evidence and data preservation

Evidence directory: C:/Users/Suressvar/.codex/visualizations/2026/11/15/01a1de5c-0a4c-7b70-b3a8-f859a9796134/black-box-evidence.

- Machine-readable results: test-results.json, integration-results.json, legacy-browser-results.json and cross-browser-results.json.
- Browser reports: integration-report/index.html, legacy-browser-report/index.html and cross-browser-report/index.html.
- Coverage: coverage/index.html and coverage/coverage-summary.json.
- Build, types, lint and audit: integration-build-output.txt, fix-typecheck.txt, fix-lint.json and dependency-audit-final.json.
- The full test inventory and reproduction commands are in [FINAL_SOFTWARE_REPORT.md](FINAL_SOFTWARE_REPORT.md).

Estate data SHA-256 at the start and end of the final run: ba95846e7bd9b75425e70a887f5b178a0cf773109152577765e849b4e38cfcf3.

The workspace and data file changed between interrupted snapshots. This report preserves the current baseline captured for the final run; no older estate-data file was restored.

Destructive tests used synthetic records in the disposable test copy, and real-file unit tests used guarded temporary directories. No estate-record migration, deployment or commit was performed. Report generation checks passing suites, fresh browser results, coverage floors, clean build/types/lint/audit, unchanged estate data and matching tested source before writing this sign-off.
