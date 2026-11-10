# Version 3.0 QA record — 5 November 2026

## Automated checks

Command: `node --test test.cjs`
Result: 13 tests passed; 0 failures.

Coverage: all three listing marketplaces, omission of unspecified attributes, factual descriptions, keyword deduplication, required confirmation, blank/oversized/invalid inputs, pack quantity, title limits, CSV quoting/Unicode/formula neutralization, stale export invalidation, HTML treated as text, reset lifecycle, calculator baseline, invalid numeric inputs, 16 tax/ITC break-even cases, fresh calculator CSV values, zero price and 100% return probability, navigation and responsive CSS presence.

Default calculator: expenses ₹642, profit ₹357 per order, ₹3,570 for 10 units, break-even ₹642.

## Fixed regressions

- Break-even no longer drops below fixed costs when ITC exceeds estimated tax.
- Calculator CSV recalculates current inputs; changed inputs invalidate displayed results.
- Listing edits invalidate old exports; long inputs fail visibly instead of silent truncation.
- CSV cells neutralize formula-leading values; text rendering does not interpret HTML.

## Completed live-browser checks

- PR #2 merged with owner approval; Pages deployment succeeded. The original calculator was preserved.
- Amazon India, Flipkart and Meesho generated factual drafts; switching marketplaces invalidated stale exports.
- Blank name, missing confirmation and fractional pack quantity produced visible validation errors. Clear reset the form and disabled exports.
- Calculator: price 1200 gave profit 558; zero units were rejected; reset restored defaults; ITC 500 did not reduce break-even below fixed costs of 642.
- Actual calculator CSV, listing TXT and listing CSV were downloaded in Chromium and parsed locally. Profit, marketplace, facts, CSV column count and deduplicated keywords matched expectations.
- Navigation between calculator and studio worked. Keyboard Tab moved from product name to brand.
- Mobile Listing Studio generated a draft at a 360px frame width, enabled exports and retained a layout without horizontal overflow.
- Both pages passed horizontal-overflow checks at frame widths 360, 390, 768 and 1280px (usable content widths 345, 375, 753 and 1265px because of scrollbar space). Desktop and narrow-width visual layouts were inspected.
- No application error was identified during these interactions. Browser extension metadata errors were separate from the site.

## Security and limits

Product copy is rendered with textContent; the listing CSV guards formula-leading cells. There are no backend credentials, model keys, account/payment integration or third-party application scripts in this version. Automated tests cover HTML-as-text, CSV quoting and invalid inputs. This is a focused code and functional review, not a penetration-test certification.

Tests used Chromium with CSS-width frames, not physical Android/iOS devices or every browser. No software is guaranteed bug-free. Product claims, keyword relevance and marketplace fees are not automatically verified. Exports are review files, not marketplace bulk-import templates. Real AI remains Version 4 work.

## Access diagnosis

The repository and working branch were readable; main and the working branch initially pointed to 89c19e026cb371047032c2daf868603b5eeab0e1. Repository metadata exposed push/admin rights for the user, but creating listing.html through the connector returned 403 Resource not accessible by integration. The installations query returned an empty list. This establishes a connector write-access failure; exact app permission configuration cannot be determined from these responses. No security settings were changed. The fallback cloud browser showed GitHub signed out.

After user login, authorized browser upload resolved the write blocker without changing security settings. The GitHub connector itself was not repaired.

## V4 Pilot automated review — 6 November 2026

`node --test test.cjs workspace.test.cjs`: 19 passed, 0 failed. Added checks cover evidence schema, provenance, observed/estimated distinction, executable/credential URL rejection, malformed/future dates, invalid money, CSV injection and persisted-data revalidation. JavaScript syntax and git whitespace checks pass. No provider secrets or model integration added.

The earlier V3 third-party-script statement predates PR #3: the calculator now includes Cloudflare Web Analytics. Its user-facing privacy text and README reflect that fact. Workspace and Listing Studio do not include that beacon.

Live browser checks completed after Pages rollout (PR #5, commit f5745db):
- Fee record creation, HTML-like notes rendered literally, opt-in persistence and reload restoration passed.
- Actual evidence CSV downloaded; delete-all followed by reload returned zero records. Test records were removed.
- javascript: source rejected; competitor estimate displayed the Estimated label; individual removal passed.
- Calculator price 1200 returned profit 558 and downloaded CSV. Listing draft generation and TXT download passed; editing disabled stale exports. Cross-tool navigation passed.
- All 12 page/width combinations (three pages × 360, 390, 768, 1280 CSS pixels) passed horizontal-overflow checks. Narrow workspace and desktop layouts visually inspected.
- These are Chromium CSS viewport checks, not physical mobile-device certification. Downloads completed; this release did not re-parse downloaded file bytes (serialization is covered by automated tests).
- Browser logs inspected showed extension metadata errors, not an identified application failure. This is a scoped review, not a security certification.

Local preview was unreachable from the separate cloud browser; browser verification used the deployed release. No real AI backend or account isolation was tested because neither is implemented.

## V4 free workspace beta — 6 November 2026 (India)

- Main inspected at `7c1753e`; no open PRs. Existing feedback and analytics additions preserved.
- `node --test test.cjs`: **20 passed**, 0 failed. Original 13 regressions plus fee calculations, comparison direction, URL/date/money validation, bounded and revalidated device copies, CSV injection, unknown-property stripping and CSP checks.
- `node --check workspace.js` and `git diff --check`: passed.
- Chromium staged browser: fee ₹1,000 × 15% + ₹20 = ₹170; competitor ₹800 vs own ₹1,000 gives ₹200 / 25% above; HTML payload rendered literally, unsafe URL rejected; explicit save, reload and load restored two synthetic records; CSV download completed.
- Listing Studio: generation, TXT and CSV downloads completed; changing input disabled stale export. Calculator price ₹1,200 produced ₹558 profit and CSV downloaded after CSP/external-script migration.
- Three pages × iframe widths 360, 390, 768, 1280: **12 horizontal-overflow checks passed**. Scrollbar-adjusted document widths were 345, 375, 753, 1265. These are CSS viewport tests, not physical-device certification.
- Actual downloads were observed in the browser; serializers are covered by automated tests. Browser extension metadata errors were observed, unrelated to app source.
- No model/API credentials added. No backend or model calls; AI factuality/quota/account-isolation tests are not applicable to this static release and remain release gates for actual AI.
- Live deployment verification is recorded in the release report after merge; staged checks above do not themselves prove deployment.

Integration note: main advanced to `f9a77b7` (PRs #5/#6) during development. The original V4 Evidence workspace and schema/storage key were preserved; new calculations/comparisons moved to `research.html` and `research.js`. Combined suite: 26 tests passed. Existing V4 tests remain included in CI. Rollback target for this upgrade is `f9a77b7`.

## PR #9 hardening verification — 2026-11-10

- Applied the supplied sellerpilot-v4-hardening.patch to PR #9 with latest main changes preserved.
- Node v24.22.1: all five test files pass, 75 tests total. Tests include real RSA signatures with mocked JWKS/provider fetches, malformed/expired/forged/future tokens, origin/CORS, request and provider body limits, prompt-like facts, unsupported claims, quota isolation and failure, daily/global limits, serialized concurrent reservations, burst expiry cleanup, and stale AI form responses.
- Additional fixes: collision-free quota subject namespace, server-owned reservation date, expired burst-key cleanup, streamed body bounds, JSON content type enforcement, JWT subject/nbf validation and stale asynchronous UI result invalidation.
- Static template, calculator, research and evidence regression tests pass. No package dependencies are added.
- AI_ENABLED remains false, GEMINI_MODEL and public apiUrl remain empty. No Worker deployment, real provider calls, secrets, paid service or billing activation.
- The concurrency test uses serialized mock transactions; production Cloudflare concurrency, Access cookies/CORS and live Gemini remain unverified and require a separately approved activation.
- Gitleaks 8.30.1 working-tree and full git-history scans: no secrets after reviewing/excluding exactly the existing public Cloudflare analytics identifier and localStorage key (raw detections: 2 current / 3 historical). No credentials were found. Targeted executable-sink review found only the pre-existing calculator table rendering: fixed labels plus validated finite numbers; no untrusted HTML path. No dynamic eval/Function/document.write usage in application scripts.
