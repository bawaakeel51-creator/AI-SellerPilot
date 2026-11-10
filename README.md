# AI SellerPilot 4.0 — free workspace beta

Static seller tools for Amazon India, Flipkart and Meesho, with labelled profit estimates for Shopify and other stores.

- `index.html` / `calculator.js`: profit planner, GST/ITC assumptions, return buffer, break-even and CSV.
- `listing.html` / `listing.js`: factual template drafts, titles, bullets, descriptions, input-based keywords, TXT/CSV.
- `research.html` / `research.js`: versioned manual fee schedules, source/effective/check dates, percentage + fixed fee estimates, observed/estimated competitor prices and comparison, explicit local save/load/delete and CSV export.
- `workspace.html` / `workspace.js`: preserves the existing V4 Pilot evidence records, source links, optional persistence and CSV. Its existing storage key and schema remain unchanged.
- `qa-preview.html`: same-origin responsive viewport harness.

**Public AI is OFF.** The public GitHub Pages tools remain static and template-based. A separate owner-only Google-authenticated Worker Studio is deployed; `AI_ENABLED=false` prevents provider calls. Authentication, exports and mobile checks pass, but authenticated real Gemini generation remains a release blocker. V4 is **not yet complete as a real-AI release**. See [V4-RELEASE.md](V4-RELEASE.md) for evidence and the approval gate.

Live: https://bawaakeel51-creator.github.io/AI-SellerPilot/

## Run and test

Serve with `python3 -m http.server 8765`. Open `http://localhost:8765/`. Run `node --test test.cjs workspace.test.cjs listing-ai.test.cjs backend/*.test.mjs` (Node 22+; CI uses Node 24). No dependency installation is needed. See QA.md for actual test evidence.

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

## AI backend: deployed, Google-authenticated, generation disabled

Private Studio: https://ai-sellerpilot-v4-api.bawaakeel51.workers.dev/studio/

`backend/worker.mjs` serves the private Studio and `/v1/listings/generate` on the same origin. Google Sign-In replaces the card-blocked Cloudflare Access onboarding; no Access subscription or OAuth client secret is required. `AUTH_MODE=google`, `GOOGLE_CLIENT_ID`, owner-only `GOOGLE_ALLOWED_EMAILS` and the exact Worker `ALLOWED_ORIGIN` are configured in runtime settings. Missing configuration fails closed. The duplicate OAuth client is preserved.

`google-auth.mjs` verifies Google RS256 signatures, issuer, audience, authorized party, timestamps, nonce and verified approved email. Sessions use host-only Secure/HttpOnly/SameSite=Strict cookies; ID tokens are never stored in localStorage. Login, logout and generation use nonce/CSRF and origin checks. Session responses and private assets are not cached. Logout clears cookies; it does not globally revoke a previously stolen signed Google token before its expiry.

Gemini credentials remain in encrypted Worker secrets. The provider key is sent only in the server-side API header, never a browser URL. Requests and provider responses are bounded, calls time out, output is validated and human review is mandatory. The Durable Object reserves quota **before** provider calls and fails closed on storage failure. Current limits: 2 requests/account/day, 20 globally/day and a 5-second per-account interval; login attempts use the existing 5/60-second rate limiter. Failed generations consume reserved allowance; invalid requests do not.

`GEMINI_MODEL=gemini-3.6-flash` is listed with free standard input/output on [Google's pricing page](https://ai.google.dev/gemini-api/docs/pricing). AI Studio shows the project as Free tier with 5 RPM / 250K TPM / 20 RPD for this model. Eligibility/configuration is verified; actual key/model generation is not. Free-tier input/output may be used to improve Google products. Do not send confidential or personal information.

## Deployment and activation boundary

Run Wrangler from `backend/`. `build-studio.mjs` generates private assets from the existing Listing Studio. The main-only deployment workflow runs regression checks and forces `AI_ENABLED=false`. Its encrypted GitHub credential is restricted to this Worker. `keep_vars=true` preserves dashboard variables; do not replace the Gemini secret or alter other projects. The public `ai-config.js` keeps its API URL empty.

No live-provider test can pass through the existing generation endpoint while `AI_ENABLED=false`. Do not create a diagnostic endpoint that bypasses this switch or copy the encrypted provider key elsewhere. A controlled real test needs explicit owner approval for temporary activation under the existing single-account allowlist, followed immediately by disabling it again. [V4-RELEASE.md](V4-RELEASE.md) defines the test and rollback plan. Public access, additional accounts, billing and paid services require separate approval.
