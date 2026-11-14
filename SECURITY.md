# Security Policy

## Scope and current limitations
AI-SellerPilot includes public static seller tools and a separate owner-only authenticated Worker Studio. Public AI generation is disabled (`AI_ENABLED=false`). This policy describes how to report suspected vulnerabilities; it does not certify the software as secure.

## Report vulnerabilities privately
Please **do not open a public GitHub issue** or publish proof-of-concept exploit details for an unpatched vulnerability.

Use the repository's **Security > Advisories > Report a vulnerability** option if private vulnerability reporting is enabled. If that option is unavailable, contact the maintainer privately through an existing verified GitHub profile contact channel. Do not post credentials or sensitive exploit details in public discussions. If no private channel is available, open a public issue asking only for a private reporting channel, without vulnerability details.

Include a short description, affected component, reproducible steps using synthetic data, expected versus observed behavior, and potential impact. Never send real credentials, tokens, seller data or customer records.

## Handling and disclosure
The maintainer will assess reports as capacity allows, prioritize potential credential leaks, authentication bypass, cross-account access and unsafe input/export handling, and coordinate remediation and disclosure when appropriate. No fixed response or patch SLA is promised.

## Contributor security boundaries
- Never commit secrets, personal information, real API keys or OAuth credentials.
- Do not turn on public AI generation, provider billing or paid infrastructure for testing.
- Do not weaken authentication, CSRF protection, quota enforcement or origin restrictions.
- Use synthetic fixtures for security testing. Do not test against other users or production data without authorization.
- Consult README.md, ROADMAP.md, QA.md and V4-RELEASE.md for documented controls and outstanding verification gates.

Supported releases and security fixes are handled on a best-effort basis; there is no contractual support commitment.
