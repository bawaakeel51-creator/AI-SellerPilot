# AI SellerPilot roadmap

## Current V4 status — 11 November 2026 (India)

The public free workspace and Google-authenticated private Studio are deployed. PR #13 supplies nonce/CSRF-protected Google sessions; PR #14 fixes Cloudflare canonical login routing. Existing Calculator, Listing Studio, Research, Evidence Workspace, local storage and downloads are preserved.

88 automated tests, CI, secret scanning and diff checks passed. Google login/logout/repeat login and narrow-screen checks passed. The owner downloaded and opened TXT/CSV files and confirmed their contents. Real workerd/SQLite quota concurrency checks passed. See [QA.md](QA.md) and [V4-RELEASE.md](V4-RELEASE.md) for scope and evidence.

**V4 real-AI release remains blocked:** a successful authenticated real Gemini generation and real-provider failure handling have not been observed. The model and project have free-tier eligibility; the deployed kill switch is false. Temporary owner-only activation requires explicit approval, and public AI remains separately gated. No billing/card/paid service is authorized.

## Finish V4 before declaring release complete

1. Obtain approval for a tightly scoped temporary owner-only provider test with an immediate rollback to AI disabled.
2. Verify one real factual draft, its validated structure, human-review label and one quota reservation. Confirm authentication/CSRF and account isolation remain enforced. Stop on provider/quota/security errors; do not retry blindly.
3. Validate actual provider-error behavior without leaking upstream payloads or credentials. Existing mocked outage/timeout/malformed-output tests remain the baseline; do not damage or replace the production secret to induce an error.
4. Restore and independently verify `AI_ENABLED=false` even on failure. Record observed results before changing the V4 release status. Any public AI activation requires separate approval.

## V5 priorities (proposed; not implemented)

| Order | Scope | Acceptance gate |
| --- | --- | --- |
| 1 | Owner-approved capped seller pilot and factuality evaluation | Consenting sellers; measure corrections, time saved and export usefulness; no automatic publishing |
| 2 | Editable/importable evidence records and backup UX | Preserve existing schema/storage; reject malformed imports and unsafe CSV values |
| 3 | Consented settlement CSV reconciliation | Anonymized fixtures, traceable deductions and qualified tax/accounting review |
| 4 | Verified marketplace fee sources and expiry reminders | Authorized data, category/slab/fulfilment fixtures and source dates; no guessed fees |
| 5 | Optional secure account sync | Tenant isolation, retention, export/delete and recovery verified before migration |

No V5 feature is a revenue guarantee. Start with small reversible changes and preserve all working V4 tools. Do not expand the pilot's approved accounts or quotas without reviewing capacity and getting owner approval.

## Deferred business gates

Payments, subscriptions, marketplace API connections, background research, paid infrastructure and Play Store publication are separate projects requiring explicit approval and validation. No outreach messages or automatic product publishing are included. Validate demand with real consenting sellers before recurring spending. Never promise permanent free provider access.

## Rollback

For an approved provider test, first restore the Worker flag to false and verify the disabled response. Public tools remain on GitHub Pages with an empty AI API URL. For a code regression, revert the relevant reviewed merge rather than changing secrets, account data or Pages settings. V4 static workspace history and earlier QA remain recorded in Git history; current release truth is in V4-RELEASE.md.
