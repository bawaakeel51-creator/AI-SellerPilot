# V5 dashboard review

The white and lavender redesign applies to the existing Listing Studio at `listing.html`. The profit calculator, Research and Evidence keep their existing routes and tools. The public dashboard shows unavailable marketplace metrics as empty states and links Growth insights to working SellerPilot tools. Tool search runs locally and the public page still identifies template generation and Gemini being OFF. The redesigned files require no runtime dependencies. The private Studio build copies the new UI assets and retains its account controls, private copy and same-origin settings.

## Verification

- Reviewed draft #17 at `447cb820cb167974aef4ab7437b218e71309a5ac`, #19 at `1079e68e941ad0877dd38eb2f38bf65f646bfc79` and #20 at `6d1d74df9554ae3fdb268a7409b55164b9392259`, based on `main` at `29a845bbcc324d129a047d93abf9eb477450147e`.
- Premium correction compared real renders against the selected white-purple reference and the previous #21 screenshot. The second pass compacted the hero, chart and form, aligned the panels and actions, and reduced background intensity on narrow screens. The structured draft shows separate, read-only sections without changing TXT or CSV serialization.
- Chromium 153 rendered the combined candidate at 1440, 1280, 768, 375 and 320 CSS pixels. All five had no horizontal overflow, desktop showed two columns, tablet and mobile stacked the flow, and the sample kept one factual bullet and no repeated pack wording.
- Browser checks covered the skip link, local tool search, narrow navigation disclosure, and actual TXT and CSV downloads. Both downloaded files matched the generated studio record. Public Gemini stayed hidden. Layout checks used Chromium viewport emulation and desktop full-page captures.
- The branch suite passed 90 tests. The combined candidate with #17, #19 and #20 passed 117 tests. Checks include generated content rendered as text, stale export invalidation and private Studio asset packaging.
- Device-specific Safari, Firefox and Android review remains separate from the Chromium acceptance. Research and Evidence browser backup-import verification remains open. See the browser acceptance checklist in `V5-AUDIT.md` on #19. Owner visual approval is still required.

## Integration and rollback

1. Keep all four PRs Draft while browser acceptance is pending. Reconfirm the reviewed heads and green CI after any update to main.
2. After explicit rollout approval, merge #17, then #19, then #20, then the dashboard PR. Recheck CI and compatibility against the updated main before each merge. Merging to main can update GitHub Pages. #20 changes `listing.js` and the dashboard changes `listing.html`, which are also triggers for the existing Worker workflow. Obtain explicit approval that covers both automated deployments before merging either.
3. Preserve the last known good release and back up Research and Evidence records locally. After approved rollout, smoke-test the public static workflow and confirm Gemini stays disabled. Use a consenting reviewer and non-sensitive fixtures for the first beta.
4. If the redesign causes a release regression, revert its merge through an approved PR. This restores the previous Listing Studio visuals and keeps the separate pack quantity fix when #20 remains merged. A revert can trigger the same deployment workflows. Verify the approved rollback and preserve browser records. AI enablement, subscriptions and billing have separate approval gates.
