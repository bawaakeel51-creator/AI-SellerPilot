# AI SellerPilot 4.0 — free workspace beta

Static seller tools for Amazon India, Flipkart and Meesho, with labelled profit estimates for Shopify and other stores.

- `index.html` / `calculator.js`: profit planner, GST/ITC assumptions, return buffer, break-even and CSV.
- `listing.html` / `listing.js`: factual template drafts, titles, bullets, descriptions, input-based keywords, TXT/CSV.
- `research.html` / `research.js`: versioned manual fee schedules, source/effective/check dates, percentage + fixed fee estimates, observed/estimated competitor prices and comparison, explicit local save/load/delete and CSV export.
- `workspace.html` / `workspace.js`: preserves the existing V4 Pilot evidence records, source links, optional persistence and CSV. Its existing storage key and schema remain unchanged.
- `qa-preview.html`: same-origin responsive viewport harness.

**Real AI is not connected.** V4 ships the no-cost manual workspace portion of the roadmap, not the complete AI/SaaS roadmap. AI allowance is zero; no provider, paid service, account or payment integration was activated. See ROADMAP.md for outstanding V4 gates and V5 ideas.

Live: https://bawaakeel51-creator.github.io/AI-SellerPilot/

## Run and test

Serve with `python3 -m http.server 8765`. Open `http://localhost:8765/`. Run `node --test test.cjs workspace.test.cjs` (Node 24). No dependency installation is needed. See QA.md for actual test evidence.

## Data and security

Calculations and product/research inputs are processed locally. Research records are not persisted until **Save on this device** is clicked; **Load device copy** explicitly restores them. Clearing the tab does not delete the saved copy. **Delete device copy** deletes only this app's research storage key. CSV is a review/backup format; import and cloud sync are not implemented. There is a 100-record limit. Do not store secrets or personal information, especially on shared devices.

The existing profit-page Cloudflare analytics integration remains enabled and is disclosed. Feedback links open Google Forms. No research URL is fetched. Sources remain user-supplied and unverified. A Cloudflare analytics site identifier is public configuration, not an AI API key.

Inputs and restored records are validated, output uses text rendering, CSV formula prefixes are neutralized, URLs require HTTPS without embedded credentials, and page CSP blocks inline scripts, objects, base URL changes and form submissions. These checks do not certify marketplace compliance or factual accuracy.

## Profit assumptions

Marketplace selection only labels the estimate. Fees are seller-entered fixed amounts; research fee records are illustrative percentage-plus-fixed calculations, not a complete marketplace fee engine. Recalculate fees for the actual price, slab, category and fulfilment mode. Research estimates exclude GST and shipping.

Output GST is estimated from tax-inclusive revenue; eligible ITC reduces net tax only to zero. Purchase/other costs must be entered consistently with the user's accounting approach. The returns buffer covers additional expected loss, not full refund economics. Break-even uses fixed entered costs and the same tax model; percentage-based fees require manual re-entry at another price. This is a planning estimate, not a settlement or tax filing calculation.

## Listing Studio

Enter verified product facts, confirm, generate and review before downloading. Editing inputs disables stale exports. No product data survives reload. The 180-character title limit is this tool's drafting limit, not a universal marketplace rule. CSV is not a marketplace bulk-upload template.

## Releases

Use a reviewed PR; run tests and browser checks, merge after approval, verify Pages deployment and smoke-test all four pages. Preserve the existing Pages source configuration. Roll back by reverting the release merge; the pre-upgrade V4 main commit was `f9a77b7`. V4 adds one optional browser-storage key; V3 ignores it.

The prior V4 Pilot (PRs #5/#6) arrived on main during this session. This upgrade preserves it intact; new fee calculations and price comparisons live on the separate Research page. Existing Evidence data is not migrated or removed.
