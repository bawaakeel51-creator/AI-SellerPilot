// Build a same-origin AI preview: Access sessions never need third-party cookies.
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const output = new URL('./public/studio/', import.meta.url);
await mkdir(output, { recursive: true });
let html = await readFile(new URL('listing.html', root), 'utf8');
const site = 'https://bawaakeel51-creator.github.io/AI-SellerPilot/';
for (const page of ['index.html', 'workspace.html', 'research.html']) {
  html = html.replaceAll(`href="${page}"`, `href="${site}${page}"`);
}
html = html.replace("connect-src 'none'", "connect-src 'self'")
  .replace('Template-based · No AI model connected', 'Private AI preview · Sign-in protected')
  .replace('Generate AI draft (sign-in required)', 'Generate AI draft')
  .replace('No login, payments or external requests. Product details stay in this page and are cleared on reload.',
    'AI requests send only confirmed product facts to Google Gemini. Free-tier content may be used to improve Google products. Do not enter confidential or personal data. Templates stay in this browser. AI drafts always need human review.');
html = html.replace('<div class="layout">', '<p class="note">Daily AI allowance: 2 requests per account, shared service limit: 20. Requests, including failed generations, count toward the allowance. Limits reset at 00:00 UTC. Wait at least 5 seconds between requests.</p><div class="layout">');
await writeFile(new URL('index.html', output), html);
await copyFile(new URL('listing.js', root), new URL('listing.js', output));
await writeFile(new URL('ai-config.js', output), "window.SELLERPILOT_AI = { apiUrl: window.location.origin };\n");
await writeFile(new URL('../_headers', output), '/studio/*\n  Cache-Control: no-store\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  X-Frame-Options: DENY\n');
console.log('Built same-origin private studio assets (no credentials).');
