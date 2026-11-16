# V5 next milestone: offline settlement reconciliation contract

Status: PREPARED, fixture/spec only. No settlement parser, UI, live integration or financial validation is claimed.

## Scope

Build a separate local-only review tool after the backup PRs. Accept a manually normalized JSON/CSV file with currency INR and integer paise fields. Keep the existing Research version 4 and Evidence version 1 keys untouched. Do not infer any marketplace's settlement format, fee schedule, tax liability or contractual rule.

The synthetic fixture in `fixtures/settlement-review.synthetic.json` is invented arithmetic for engineering tests only. It contains no seller/customer data, marketplace fees or evidence of earnings. These amounts must never populate the production calculator as defaults or be labelled verified fees.

## Proposed arithmetic and outcomes

For each unique reference, expected net = gross - refund - fee - tax withheld + signed adjustment. Difference = actual paid - expected net. Zero is a match; any nonzero integer is a review item, with each entered deduction shown. Do not silently absorb differences into fees. This is a cash comparison, not a GST/ITC/tax filing computation.

Required tests: matches, underpayment, overpayment, refund, negative adjustment, duplicate IDs, integer overflow, fractional paise, wrong currency, missing fields, formula injection and oversized/malformed input. Reject the entire file on any invalid row. Permit negative net balances only when explicitly represented in the normalized contract. Use safe-integer arithmetic with bounds before summing.

## Readiness gates

| Work | Ready now | Required gate |
| --- | --- | --- |
| Pure offline arithmetic and mock UI | Yes, next isolated Draft PR | Reviewed contract, synthetic fixtures and regression tests |
| Real settlement import adapters | No | Owner-provided anonymized samples, consent, explicit column mapping and accounting review |
| Seller pilots / factuality evaluation | No | Consenting sellers and approved evaluation protocol; no outreach in this task |
| Verified fee source reminders | No | Authorized official category/slab/fulfilment sources, source/check/effective dates and expiry policy |
| Account sync / cloud storage | No | Separate approval, tenant isolation, retention/export/delete/recovery testing |
| Live AI, billing, auto publishing | No | Separate explicit approval and V4 release gates |

Keep files local by default, require confirmation before replacement, preserve cancel/error state, neutralize exports and show source limitations. No API or account connection is part of this milestone.
