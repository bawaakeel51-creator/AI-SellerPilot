# Version 4.0: staged, low-cost SaaS roadmap

Version 3.0 is a static, template-based tool. No model, account, payment provider, marketplace API or background research is connected. Do not market it as an AI-powered generator yet.

## 1. Validate demand before recurring spending
Recruit 5–10 sellers for an opt-in pilot. Measure time saved, factual corrections per draft, export usage and willingness to pay. Keep Version 3 free to run; do not activate paid services during development. Suggested price experiments (not validated): ₹199 and ₹499 per month, with clearly stated usage limits.

## 2. Add a small secure AI backend
Keep the static frontend. Add a separately deployed backend only after provider and budget approval. Store provider keys in server-side secrets, never in HTML, JavaScript, GitHub or browser storage. Authenticate calls, enforce per-user quotas, request-size limits, timeouts, rate limits and a global spending cutoff. Use one generation per deliberate click, with an estimated allowance visible to the seller.

Pass only selected product facts and marketplace context. Treat user text and retrieved competitor content as untrusted data. Require structured output, validate it against the source facts and highlight unsupported claims for human review. Keep the deterministic draft as a fallback. Label AI output only when a real request succeeds. Add factuality, prompt-injection and outage tests before release.

## 3. Marketplace fee verification
Start with user-entered fee schedules and links to official fee documentation, with marketplace, category, fulfilment mode and verification date. Add effective dates and versioned fixtures. Obtain authorized API access only where available; do not promise universal automatic fee verification. Add settlement imports and reconciliation after validating the model with real, consented, anonymized examples. Keep GST/ITC accounting assumptions explicit and have a qualified reviewer validate the expanded tax model.

## 4. Competitor research
Begin with seller-supplied public product URLs and manually reviewed observations. Show source URL, observation date and whether a number is observed or estimated. Use authorized APIs or permitted data sources; no login bypass or unapproved scraping. Do not infer sales, return rates or keyword volumes from price alone. Competitor text must never supply instructions to the model.

## 5. Paid beta
Add managed authentication, isolated per-user records, export/delete controls and a short retention policy. Add payment-provider checkout only after user approval and current cost review. Verify webhook signatures and idempotency; derive entitlements server-side. Test cancellation, refunds, failed payments, quota enforcement and cross-account access before accepting money.

## Budget gates
No current vendor prices are assumed here. Before choosing providers, verify official pricing and free-tier conditions. Calculate monthly cost as:

hosting + database + model input/output tokens + research/API requests + payment charges + support/refund allowance.

Start with a capped pilot and no commitments. Set a spend cap the owner can afford, stop paid generation at the cap, and expand only after revenue covers actual variable costs. Never promise guaranteed income or a permanently free backend.

## Release gates
Working end-to-end AI integration; factuality evaluation; auth and account-isolation tests; secret scanning; verified current provider costs; explicit budget approval; and a rollback plan. AI and paid features stay disabled until those gates pass.
