# AI SellerPilot 4.0 — free workspace beta

Static seller tools for Amazon India, Flipkart and Meesho, with labelled profit estimates for Shopify and other stores.

- `index.html` / `calculator.js`: profit planner, GST/ITC assumptions, return buffer, break-even and CSV.
- `listing.html` / `listing.js`: factual template drafts, titles, bullets, descriptions, input-based keywords, TXT/CSV.
- `research.html` / `research.js`: versioned manual fee schedules, source/effective/check dates, percentage + fixed fee estimates, observed/estimated competitor prices and comparison, explicit local save/load/delete and CSV export.
- `workspace.html` / `workspace.js`: preserves the existing V4 Pilot evidence records, source links, optional persistence and CSV. Its existing storage key and schema remain unchanged.
- `qa-preview.html`: same-origin responsive viewport harness.

**Real AI is not live yet.** The live site is static and template-based; its AI allowance is zero and no provider, paid service, account or payment integration is activated. The secure backend code and a hidden, disabled-by-default AI button are in the repository (see "AI backend" below) but nothing is deployed until the owner completes the setup steps. See ROADMAP.md for outstanding V4 gates and V5 ideas.

Live: https://bawaakeel51-creator.github.io/AI-SellerPilot/

## Run and test

Serve with `python3 -m http.server 8765`. Open `http://localhost:8765/`. Run `node --test test.cjs workspace.test.cjs listing-ai.test.cjs backend/validation.test.mjs backend/worker.test.mjs` (Node 22+; CI uses Node 24). No dependency installation is needed. See QA.md for actual test evidence.

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

## AI backend (built, tested, disabled, not deployed)

`backend/` holds a Cloudflare Worker that calls Gemini server-side. Browser code never sees the key. It checks the origin, verifies a Cloudflare Access JWT (signature, issuer, audience, expiry), validates and size-limits input, rejects prompt-injection-like text, reserves a per-user and global daily quota plus a burst limit in a Durable Object **before** calling the provider, fails closed if quota storage fails, bounds output and timeout, flags unsupported claims and always requires human review. Tests (`backend/*.test.mjs`) cover these controls with mocked Access and Gemini endpoints; real concurrency on Cloudflare and a live Gemini call are **not yet verified**.

**Privacy:** verify the selected provider's current data-use and free-tier terms before activation. Do not send confidential data; disclose the verified terms before enabling AI.

**Owner steps to enable (all free tiers, none done yet):**
1. Create a Gemini API key in Google AI Studio and confirm on Google's pricing page that the chosen model is free tier. Set `GEMINI_MODEL` (the repo value is empty on purpose).
2. Create a free Cloudflare account, deploy `backend/` with Wrangler, and store the key with `wrangler secret put GEMINI_API_KEY`.
3. Add a Cloudflare Access application for the Worker (free plan) and set `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` and `ALLOWED_ORIGIN=https://bawaakeel51-creator.github.io`. Set the Access cookie SameSite attribute to `None` and allow CORS preflight (OPTIONS) to reach the Worker.
4. Set `AI_ENABLED=true`, put the Worker origin in `ai-config.js` (`apiUrl`) and in the `connect-src` of `listing.html`'s CSP, update the "No AI model connected" copy and footer text, then test with a signed-in account and a free-tier key before announcing.

Never commit keys. AI output is labelled only when a real request succeeds.
