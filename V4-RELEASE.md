# V4 release verification — 11 November 2026 (India)

**Status: owner-only controlled Gemini generation PASS; AI restored OFF. Public real-AI release NOT COMPLETE.**

## Deployed baseline

- Main code commit: `6c7d49505b6666e196e77ff897a25d1636c096d7` (PR #14), following merged PR #13.
- Worker: `ai-sellerpilot-v4-api`, deployed version `e7d16b54-bf74-4bb0-be83-20e84c55b8ab`.
- [Successful Worker deployment](https://github.com/bawaakeel51-creator/AI-SellerPilot/actions/runs/42868955615).
- [Main CI](https://github.com/bawaakeel51-creator/AI-SellerPilot/actions/runs/42868955623).
- Public site: https://bawaakeel51-creator.github.io/AI-SellerPilot/
- Private Studio: https://ai-sellerpilot-v4-api.bawaakeel51.workers.dev/studio/

Documentation commits after this baseline do not change the Worker runtime.

## Completed and tested

| Area | Evidence | Status |
| --- | --- | --- |
| Automated regression/security | 88 tests; signed Google tokens, nonce/CSRF/origin rejection, secure cookies, approved accounts, request/output validation, mocked Gemini success/errors/timeouts and quota behavior | PASS; completed runs retained, not needlessly rerun |
| Live Google sessions | Sign-in, logout redirect, unauthorized Studio redirect, fresh server-verified session after owner re-login | PASS |
| Responsive UI | 320px and compact 487px CSS viewport checks; no horizontal overflow | PASS within inspected scope |
| TXT export | Owner downloaded/opened file; title, bullets, description and keywords correct | PASS, owner manual verification |
| CSV export | Owner downloaded/opened file; headers and product data correct | PASS, owner manual verification |
| Quota concurrency | Real workerd + SQLite Durable Object: 10 concurrent requests accept 2/deny 8, separate accounts and global cap | PASS locally; not a claim of production quota exhaustion |
| Secrets/build | Gitleaks, syntax, Wrangler dry run and diff check | PASS |
| Live kill switch | Studio reports AI disabled; generation button returns disabled error | PASS |

Direct container HTTP probes were blocked by Cloudflare 1010; they are not application-level live security passes. Browser download capture timed out, superseded only by the owner's manual file verification above. Do not claim an independent automated file-content capture.

## Current configuration and readiness

Runtime was inspected without changing settings: `AI_ENABLED=false`, `AUTH_MODE=google`, exact same-origin allowlist, one approved Google account, encrypted `GEMINI_API_KEY`, existing quota object and rate limiter. Limits remain 2/account/day, 20/global/day and a 5-second account interval. Failed provider attempts consume reserved quota. Google OAuth remains in Testing; duplicate client is untouched.

`gemini-3.6-flash` matches the backend API model path. Google AI Studio shows Free tier and 5 RPM / 250K TPM / 20 RPD; [official pricing](https://ai.google.dev/gemini-api/docs/pricing) lists standard input/output as free. The subsequently approved controlled test succeeded using the encrypted Worker key; see the recorded result below. No provider secret was revealed, copied into a URL, source, chat or test artifact. No billing was activated.

The final source review checked matching frontend/API contracts, RS256 Google verification, CSRF and exact-origin checks, secure session cookies, bounded bodies, provider timeout, validated output and quota-before-provider ordering. No new blocking defect was identified in reviewed code. One successful live response and review warning are now observed. Live provider failures and production quota exhaustion have not been induced.

## Approved controlled-test result — PASS

The owner explicitly approved at most two real calls, conditional on no public exposure and immediate rollback. Preconditions were checked before activation: the approved-email allowlist contained only the owner, AUTH_MODE was Google, signed-token/CSRF/origin gates protected the API, public Pages apiUrl was empty, and the model's free-tier dashboard showed 0/20 daily use. No accounts, origins, secrets or limits were changed.

Only AI_ENABLED was temporarily set true on the existing Worker. **One real Gemini call** was made from the signed-in private Studio with synthetic facts: Desk organiser, Stainless steel, Two compartments, Matte finish. It returned an AI-assisted title, four bullets and description through the existing validated backend. Human-review labelling appeared; the conservative claims validator flagged “Stainless steel material” for review despite the supplied material fact. This warning is recorded, not treated as independent factual certification.

Immediately after the response, AI_ENABLED was restored to false. The dashboard showed false; a fresh Studio load showed “Signed in · AI generation is disabled”; a subsequent generation attempt returned “AI generation is not enabled. Use the template draft instead.” The disabled attempt made no provider call under the verified kill-switch path. **Real call count: 1 of maximum 2.** No automatic retry or second live call was needed. Public AI configuration stayed empty; billing was not activated and provider credentials remained encrypted/server-side.

## Remaining release blockers and limits

1. Production quota exhaustion/account-isolation negative checks have not been exercised through live provider calls; existing signed-auth mocks and real local workerd quota checks remain the evidence. No extra live call was risked beyond the approved count to force a denial.
2. An actual Gemini provider error/timeout was not induced. Mocked provider error/timeout/malformed-output tests pass; do not mislabel them as live failures or damage the production key to manufacture an error.
3. Public AI is separately unapproved and remains OFF. Do not mark V4 fully complete as a public real-AI release while these recorded gates remain.

The static workspace and authenticated preview remain available. This controlled test passed; the remaining items are untested/pending, not observed failures.

## Controlled-test procedure (retained for future separately approved tests)

The endpoint refuses provider calls while AI_ENABLED=false. The one-call test above used explicit owner approval and is finished with the switch restored. Any further temporary activation needs a new scoped approval; the unused allowance is not permission for an ongoing pilot. Never extract the key or add a kill-switch bypass.

If approved:

1. Recheck the single approved account and exact Worker origin. Keep public GitHub Pages AI configuration empty and OAuth audience in Testing. Do not add accounts, routes, billing or services.
2. Temporarily change only `AI_ENABLED` to true on this existing Worker. Keep all quota/rate settings and secrets unchanged. This makes generation available to the existing approved owner while the test runs; it is not a public launch.
3. Send one deliberate request using synthetic non-confidential product facts from the signed-in Studio. No auto retries. Stop on any unexpected behavior; at most two attempts under the existing daily account cap.
4. Record response success/error, schema/factuality review and quota behavior without recording credentials or full auth payloads. Do not intentionally break the production secret to manufacture an upstream error. If no real provider error is observed, retain that limitation explicitly.
5. In all outcomes immediately restore `AI_ENABLED=false`, verify the Studio disabled response, and confirm the public tools remain unchanged. On interruption, prioritize rollback before other work.

A real failure-handling test may require an isolated, separately approved environment; do not pretend mocked errors are real-provider failures. Public AI enablement or paid services remain separately unapproved.
