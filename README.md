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

## Release

Review `version-3-listing-seo` through a pull request into `main`. Merge and GitHub Pages deployment require the owner's approval. No automated deployment configuration has been added. Preserve the existing Pages source configuration. After approval, verify navigation, generation, downloads and mobile layout at the actual Pages URL; roll back using a revert commit if needed.
