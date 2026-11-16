# V5 development and quality audit — 16 November 2026 (India)

## Decision

Research editing/CSV completion and the existing local-data features are implemented on Draft feature branches. Automated integration is passing. Final visual/mobile verification of these new changes is pending because the connected Chrome browser cannot reach this environment's preview (`localhost:8765`, connection refused in the prior session). Do not mark Draft PRs ready, merge, deploy or publish a V5 release yet. Existing owner manual Add/Edit/Cancel/CSV checks are prior evidence, not independent visual verification of these fixes.

Main baseline: `29a845bbcc324d129a047d93abf9eb477450147e`. The existing `v4.0.0-beta.1` GitHub pre-release is preserved. Neither feature changes backend code, production configuration, public AI configuration or workflow/deployment files. Repository `AI_ENABLED=false` and empty public apiUrl remain unchanged. Live runtime and billing settings were not independently reinspected in this session.

## Features and verification

| Area | Status | Evidence / limit |
| --- | --- | --- |
| Research edit/cancel and JSON/CSV backup/import, Draft #17 | PASS automated | Version 4/key preserved; fee/competitor edits and cancel, including edits at capacity; validated JSON/CSV replacement needs confirmation; saved copy untouched until Save; malformed/oversized files rejected; stale async reads rejected |
| Evidence edit/cancel/type change, Draft #19 | PASS automated | Version 1/key preserved; editing works at 100 records; removal before edited index keeps correct target; validation errors keep original record |
| Evidence CSV round trips | PASS automated | Fee/competitor, quotes, multiline, Unicode, control prefixes and literal apostrophes; new `csv_encoding=apostrophe-v1` column distinguishes reversible text encoding; legacy 11-column backups remain readable |
| Formula / malformed CSV rejection | PASS automated | Strict columns/version/encoding, quote state, row counts, HTTPS sources, dates/money, 1 MB UTF-8 and 100 total rows; all rows validated before adding; duplicate rows intentionally append |
| Data loss protections | PASS automated | Confirmation on remove/delete; canceled edit/delete preserved; stale import after delete rejected; storage failure retains in-memory records and warns; JSON replace never overwrites saved copy automatically |
| Dates | PASS scoped | Existing 0006 and leap-day semantics preserved; malformed, rollover and future observations rejected. No arbitrary recent-year restriction was added. Inaccessible laptop edits were not reviewed or claimed pushed |
| V4 calculator/templates/TXT/CSV | PASS automated integration | Existing assertions exercised once for combined regression risk; no implementation changes |
| Auth/security/quotas/provider errors | PASS mocked/local suite | Existing signed-token, CSRF/origin, quota and mocked provider tests pass; no real provider call, Google login flow or production exhaustion retest |
| New visual/mobile/accessibility checks | PENDING | CSS breakpoints, labels, status live-region and focus rules inspected; these are not rendered mobile/keyboard tests |
| Next milestone | PREPARED only | Synthetic settlement fixture and normalized contract; no parser, financial validation, real fee data or seller pilot |

Legacy CSV limitation: before the encoding column existed, an exported formula escape and an original literal apostrophe immediately before a formula prefix were indistinguishable. Legacy imports retain the existing formula-unescape convention; new exports have an explicit encoding marker and preserve literal apostrophes. The in-browser storage schema/data is not migrated. Keep original legacy backup files if manual review of ambiguous text is needed.

## Confirmed fixes

1. JSON import could overwrite newer tab records after delayed file reads. Revision and request guards now reject stale imports; CSV uses the same protection against resurrecting deleted records.
2. Evidence formula escaping did not restore whitespace/control prefixes and could remove literal apostrophes. New exports use explicitly marked reversible escaping; import still rejects raw spreadsheet formulas.
3. Editing a fee record put its fee-basis label into a competitor-only select, leaving the selection blank on type change. Competitor basis now starts at Observed.
4. Canonicalized Unicode source URLs could exceed their own validation limit and then fail backup restore; overlong canonical URLs are rejected before insertion.
5. Research required control-only strings sanitized to empty after validation; they are rejected explicitly. JSON/CSV file boundaries now check UTF-8 bytes, matching browser file limits.
6. README import statements, obsolete roadmap instructions to repeat the completed Gemini call, and Evidence's obsolete AI availability wording corrected.
7. An actual combined-branch README conflict was discovered and removed by keeping Evidence-specific documentation separate from Research's data paragraph. Code changes do not overlap.

## Tests

- PR #17 focused: `node --test test.cjs` — 34 passed.
- PR #19 focused: `node --test workspace.test.cjs` — 17 passed.
- Combined suite: `node --test test.cjs workspace.test.cjs listing-ai.test.cjs backend/*.test.mjs` — 113 passed, 0 failed (final combined tree).
- Syntax checks for changed application scripts and `git diff --check` pass.
- Final-head GitHub Actions links/status are in each PR description after push; local passes are not substituted for CI.
- A focused high-confidence credential-pattern scan inspected 131 committed blobs across local Git history with zero matching paths. This is not a fresh Gitleaks scan or security certification. No application runtime dependencies were added; the existing pinned Wrangler deployment dependency was untouched.

The first local direct git push could not authenticate. Connected GitHub Git-data writes publish the tested trees with expected-head leases; there is no force push, token extraction or change to main.

## Merge sequence and rollback

1. Complete a staged visual review at 320/390/768/1280 CSS pixels for both changed pages; check form controls, focus, status errors, import cancel, actual downloaded/reimported files and no horizontal overflow. Use disposable synthetic data and preserve existing local records.
2. Owner explicitly authorizes taking Draft #17 and #19 ready and merging their reviewed exact heads. Before merging, recheck current main, CI and combined compatibility. Recommended order: #17, then #19; changes are also compatible in reverse order. A merge to main may trigger existing Pages deployment, so that consequence must be included in approval. Worker paths are not changed by these PRs.
3. Do not create a V5 release/tag unless separately approved. Preserve the existing V4 pre-release.
4. Before any approved rollout, export local Research JSON and Evidence CSV backups. If a regression appears, revert the relevant approved merge through a reviewed PR; do not delete storage keys, clear browser data, alter credentials or force-reset main. No schema migration is required for rollback. Reverting #19 removes edit/import UI but preserves its version 1 device records; reverting #17 preserves version 4 saved research records. Keep downloaded backups outside the browser.

## Remaining gates

New-branch visual/mobile review, inaccessible user-device local changes, real consenting-seller factuality evaluation, actual production quota/account isolation and actual provider failures remain pending. Prior owner-only Gemini success/AI-off rollback remains recorded in V4-RELEASE.md; no new live test was authorized or run. Settlement adapters, verified fee sources/expiry and secure account sync have distinct gates in V5-NEXT-MILESTONE.md. No outreach, marketplace action, real seller evidence, paid service, payment, billing, public AI, Worker deployment, merge or release was performed.


## Final-completion follow-up

Research now includes the previously missing fee/competitor edit/cancel and strict Research CSV replacement import. A shared `csv-codec.js` avoids separate parsing/escaping implementations; both Draft PR branches include the identical module so each remains independently testable. Existing Evidence CSV schema and all storage keys remain unchanged. Research imports preserve duplicate rows and require explicit replacement confirmation. Unsaved form values in the other form survive a save/cancel operation. Hexadecimal and nonfinite strings are rejected; finite decimal/exponent notation remains supported, including tiny values serialized in exponent form. A focused round-trip regression was reproduced and fixed before final delivery. Both import UIs show reading/validation progress.

Local checkout and new isolated worktrees were clean before edits; existing original audit branches/commits were left intact. User-laptop uncommitted date edits are not accessible here and were not reviewed, overwritten or represented as pushed. Valid 0006 dates remain supported.

PR #18 is already merged (14 November 2026, `29a845b`); it is documentation, not a pending V5 feature or Draft. It was not reopened, reverted or duplicated. #17/#19 are the only active Drafts. Both have no review threads at inspection. Issues expose no assigned milestones; full milestone collection enumeration is blocked by the connector's endpoint allowlist, so absence of every repository milestone is not claimed. Google Drive searches for AI-SellerPilot and SellerPilot returned no accessible matches.

Visual/mobile blockers: installed headless Chromium fails during launch with a forbidden socket operation. A separate native desktop Chromium opened, but the staged local file was blocked by managed browser policy. That policy was not bypassed. Consequently 320/375/768px rendered layout, visual inspection, actual browser downloads/import and keyboard navigation for these latest changes remain pending. CSS labels, focus styles, breakpoints, bounded file controls, live-region messages and hidden-state rules were inspected; simulated-DOM tests are not browser rendering evidence. No unbounded preview server was started or left running in this follow-up.

No runtime dependencies were installed. No live Google sign-in/provider calls, billing, deployment or production configuration change occurred. The previously recorded production quota/provider-error gates remain pending. Staged mobile/browser verification is the exact next safe action, followed only by separately approved ready/merge actions. The safe implementation is ready for code review with these explicit visual/live limits; it is not an unconditional release approval.
