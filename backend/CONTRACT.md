# V4 AI Backend Contract (not deployed)

Tracks #8. This is a design contract, not a working API. Current GitHub Pages listing generator remains deterministic and AI allowance remains **0**.

## Proposed API

`POST /v1/listings/generate` with an authenticated session, CSRF/origin protection as appropriate, and a strict JSON body containing marketplace (`amazon_in`, `flipkart`, `meesho`) and seller-confirmed product facts. Reject unknown fields, oversized payloads, missing verified facts, and invalid marketplace identifiers. Never trust client-supplied identity, quota or prices.

## Mandatory server controls before enabling requests

1. Verify identity server-side and isolate every record by authenticated user ID.
2. Atomically reserve durable per-user and global daily allowances **before** any provider call. Bound concurrency and enforce a global zero-cost/disabled switch. Fail closed if the quota store is unavailable. Never treat browser local storage as an authoritative quota.
3. Load provider credentials only from server-side secrets. Do not log keys or raw sensitive seller input. Use a provider configuration with verified free-tier terms and no paid fallback; require owner approval before provisioning.
4. Bound input/output tokens, response bytes, wall-clock timeout and retries. Return explicit quota, timeout and outage errors; never silently switch to a paid model.
5. Treat product facts and external text as untrusted data. Require structured output and compare generated material/size/warranty/certification claims against the seller's confirmed facts. Flag unsupported claims and require human approval. No automatic publishing.
6. Enforce request origin policy, safe CORS, abuse controls and retention/deletion rules before public access.

## Required validation

Unit/integration tests must cover invalid inputs, injected instructions in product text, unsupported claims, quota races, concurrent calls, failed reservations, cross-user access, provider timeouts/outages, malformed provider output, secret leaks and safe fallback to the existing deterministic listing tool. Run real end-to-end tests only after approved provider and identity configuration. No production deployment from this documentation-only change.

## Release gate

Keep AI disabled until a reviewed backend implementation, authenticated tests, factuality evaluation, cost/free-tier verification, owner approval and rollback procedure are complete. Do not label static template output as AI-generated.
