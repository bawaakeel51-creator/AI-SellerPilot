# V5 dashboard review

The white and lavender redesign applies to the existing Listing Studio at `listing.html`. The profit calculator, Research and Evidence keep their existing routes and tools. The public dashboard shows unavailable marketplace metrics as empty states and links Growth insights to working SellerPilot tools. Tool search runs locally and the public page still identifies template generation and Gemini being OFF. The redesigned files require no runtime dependencies. The private Studio build copies the new UI assets and retains its account controls, private copy and same-origin settings.

## Verification

- Reviewed draft #17 at `447cb820cb167974aef4ab7437b218e71309a5ac`, #19 at `1079e68e941ad0877dd38eb2f38bf65f646bfc79` and #20 at `6d1d74df9554ae3fdb268a7409b55164b9392259`, based on `main` at `29a845bbcc324d129a047d93abf9eb477450147e`.
- Main-based redesign suite passed 89 tests. Combined source with #17, #19 and #20 passed 116 tests. The pack-of-2 title is emitted once, the quantity remains a single factual bullet, and the corrected title appears in both exports.
- Static and simulated DOM checks cover preserved form controls, local tool links, mobile disclosure, keyboard handling, and private Studio asset packaging. The cloud browser reported “Site Unavailable” on the private preview. Actual rendered desktop and mobile review remains pending at 1440, 1280, 768, 375 and 320 CSS pixels.
- The owner's earlier public Listing Studio downloads passed. Repeat the two browser downloads on the combined candidate as a final smoke test. Research/Evidence visual, keyboard and actual browser backup-import checks remain pending. See the browser acceptance checklist in `V5-AUDIT.md` on #19.
- Before approval, verify no horizontal overflow, visible keyboard focus, mobile menu, search, blank-name validation, form and draft columns, exact duplicate-pack example, both downloads, and AI disclosure. Smoke-test calculator, Research and Evidence links. Cover older supported mobile Chrome and Edge or Firefox where available. Use synthetic fixtures and a fresh browser profile.

## Integration and rollback

1. Keep all four PRs Draft while browser acceptance is pending. Reconfirm the reviewed heads and green CI after any update to main.
2. After explicit rollout approval, merge #17, then #19, then #20, then the dashboard PR. Recheck CI and compatibility against the updated main before each merge. Merging to main can update GitHub Pages. #20 changes `listing.js` and the dashboard changes `listing.html`, which are also triggers for the existing Worker workflow. Obtain explicit approval that covers both automated deployments before merging either.
3. Preserve the last known good release and back up Research and Evidence records locally. After approved rollout, smoke-test the public static workflow and confirm Gemini stays disabled. Use a consenting reviewer and non-sensitive fixtures for the first beta.
4. If the redesign causes a release regression, revert its merge through an approved PR. This restores the previous Listing Studio visuals and keeps the separate pack quantity fix when #20 remains merged. A revert can trigger the same deployment workflows. Verify the approved rollback and preserve browser records. AI enablement, subscriptions and billing have separate approval gates.
