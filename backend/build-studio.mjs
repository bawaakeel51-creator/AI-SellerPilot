// Build a same-origin private studio. No third-party session cookies or secrets.
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
html = html.replace('<div class="layout">', '<section aria-label="Your account"><p id="account-status" role="status">Checking session…</p><button id="signout" class="secondary" type="button">Sign out</button></section><div class="layout">');
html = html.replace('<script src="listing.js"></script>', '<script src="listing.js"></script><script src="studio-session.js"></script>');
await writeFile(new URL('index.html', output), html);
await copyFile(new URL('listing.js', root), new URL('listing.js', output));
await writeFile(new URL('ai-config.js', output), "window.SELLERPILOT_AI = { apiUrl: window.location.origin, authMode: 'google' };\n");
await copyFile(new URL('./studio-session.js', import.meta.url), new URL('studio-session.js', output));
for (const file of ['login.html', 'login.js']) await copyFile(new URL(file, import.meta.url), new URL('../' + file, output));
await writeFile(new URL('../_headers', output), '/*\n  Cache-Control: no-store\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n  Cross-Origin-Opener-Policy: same-origin-allow-popups\n');
console.log('Built same-origin private studio assets (no credentials).');
