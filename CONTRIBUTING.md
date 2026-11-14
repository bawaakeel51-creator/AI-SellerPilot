# Contributing to AI-SellerPilot

Thanks for helping improve AI-SellerPilot, an MIT-licensed toolkit for e-commerce sellers.

## Before contributing
- Read README.md, ROADMAP.md and QA.md for current scope, limitations and verified behavior.
- Search existing issues and pull requests before opening a duplicate. For a new feature, propose a small, testable issue first.
- Never include real customer information, marketplace credentials, OAuth tokens, API keys or private seller records in issues, tests or commits.
- For vulnerabilities, follow SECURITY.md instead of opening a public issue.

## Local setup
1. Clone the repository and use a feature branch from main.
2. Use Node.js 22+ (CI uses Node 24). Serve the static site with `python3 -m http.server 8765` and open http://localhost:8765/.
3. Run `node --test test.cjs workspace.test.cjs listing-ai.test.cjs backend/*.test.mjs`.
4. Test changed pages on narrow mobile and desktop widths, and validate TXT/CSV exports when relevant.

## Pull request checklist
- Keep changes focused and explain the problem, solution and any limitations.
- Include relevant automated tests and manual checks; report untested behavior honestly.
- Preserve existing calculator, listing, research, evidence storage schemas and export behavior.
- Do not change production deployment, credentials, billing or external integrations without explicit maintainer approval.
- Keep public AI disabled: `AI_ENABLED=false`. Never enable paid APIs, publish AI generation or make real provider calls as part of a contribution.
- Use factual, seller-supplied product information; do not claim estimated fees or generated copy are verified.
- Check for secrets, personal data, unsafe CSV values and unintended changes before requesting review.

The primary maintainer reviews changes and decides whether to merge. A pull request is not a promise of acceptance. Please be respectful and constructive in discussions.
