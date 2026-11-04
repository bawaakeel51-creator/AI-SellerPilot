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

## Remaining manual checks before release

Browser-rendered desktop/mobile layout, keyboard navigation, actual browser download files and navigation between pages remain to be verified. The remote browser cannot reach this workspace's local preview server. Automated DOM lifecycle checks use a small test double, not a full browser engine.

## Access diagnosis

The repository and working branch were readable; main and the working branch initially pointed to 89c19e026cb371047032c2daf868603b5eeab0e1. Repository metadata exposed push/admin rights for the user, but creating listing.html through the connector returned 403 Resource not accessible by integration. The installations query returned an empty list. This establishes a connector write-access failure; exact app permission configuration cannot be determined from these responses. No security settings were changed. The fallback cloud browser showed GitHub signed out.
