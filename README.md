# AI SellerPilot 3.0

Static seller workspace for Amazon India, Flipkart and Meesho. The existing profit planner also supports labelled estimates for Shopify and other stores.

- `index.html`: profit calculator with editable costs, GST assumptions, returns buffer and CSV export.
- `listing.html` + `listing.js`: factual template drafts, titles, bullets, descriptions, deduplicated input-based keywords, TXT/CSV export and input validation.
- `ROADMAP.md`: gated Version 4 AI and SaaS plan.

**No AI model is connected.** No accounts, payments, external requests or automatic marketplace verification. Generated copy must be reviewed. CSV is a review format, not a marketplace bulk-upload template. The 180-character title limit is this tool's conservative drafting choice, not a universal marketplace policy.

## Run and test

Serve the repository with any static HTTP server, for example `python3 -m http.server 8765`, and open `http://localhost:8765/`. Run dependency-free checks with `node --test test.cjs` (tested with Node 24).

## Profit assumptions

Fees are fixed amounts entered by the seller. Output GST is estimated from tax-inclusive revenue; eligible ITC reduces net tax only to zero. Purchase/other cost amounts must be entered consistently with the user's chosen accounting approach. The returns buffer covers only additional expected loss, not full refund economics. Break-even assumes fixed entered costs and uses the same tax model as the profit calculation; percentage-based fees need manual re-entry at a different price. This is a planning estimate, not a settlement or tax filing calculation.

## Release status

Version 3.0 is live at https://bawaakeel51-creator.github.io/AI-SellerPilot/ . PR #2 was merged with owner approval; GitHub Pages deployment succeeded. Listing Studio: https://bawaakeel51-creator.github.io/AI-SellerPilot/listing.html .

`qa-preview.html` provides same-origin viewport checks at 360, 390, 768 and 1280 pixels. All eight page/width combinations passed horizontal-overflow checks in Chromium. These are CSS viewport tests, not physical-device certification. See `QA.md` for completed browser tests and scope.

For future releases, use a reviewed branch/PR, run `node --test test.cjs`, verify Pages deployment and smoke-test both pages and downloads. Revert the release commit if verification fails. Preserve the Pages source configuration.

## Using Listing Studio

Choose a marketplace, enter the product name and verified attributes, add factual feature lines and relevant search terms, confirm the facts, then generate. Review the draft before downloading TXT or CSV. Editing inputs disables old exports until a fresh draft is generated. Clear resets the form. No product data is saved across reloads.
