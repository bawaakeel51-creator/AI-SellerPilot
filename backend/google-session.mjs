import { verifyGoogleIdToken } from './google-auth.mjs';
const SESSION = '__Host-sp_session';
const CSRF = '__Host-sp_csrf';
const NONCE = '__Host-sp_nonce';
function cookie(request, name) {
  const values = (request.headers.get('cookie') || '').split(';').map(s => s.trim()).filter(s => s.startsWith(name + '='));
  if (values.length !== 1) return '';
  return values[0].slice(name.length + 1);
}
function setCookie(name, value, age) {
  return `${name}=${value}; Path=/; Max-Age=${age}; HttpOnly; Secure; SameSite=Strict`;
}
function random() { return Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join(''); }
function allowedEmails(env) { return String(env.GOOGLE_ALLOWED_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean); }
function configured(env) { return Boolean(env.GOOGLE_CLIENT_ID && allowedEmails(env).length); }
function json(data, status = 200, cookies = []) {
  const headers = new Headers({ 'content-type': 'application/json', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'cross-origin-resource-policy': 'same-origin' });
  for (const value of cookies) headers.append('set-cookie', value);
  return new Response(JSON.stringify(data), { status, headers });
}
export function checkCsrf(request) {
  const expected = cookie(request, CSRF), received = request.headers.get('x-csrf-token');
  return /^[a-f0-9]{64}$/.test(expected) && received === expected;
}
export async function googleSession(request, env) {
  if (!configured(env)) throw Error('Login not configured');
  return verifyGoogleIdToken(cookie(request, SESSION), env, { allowedEmails: allowedEmails(env) });
}
export async function handleGoogleAuth(request, env) {
  const path = new URL(request.url).pathname;
  if (!path.startsWith('/auth/')) return null;
  if (!configured(env)) return json({ error: 'login_not_configured', message: 'Google sign-in setup is pending. The public tools still work.' }, 503);
  if (request.headers.get('sec-fetch-site') === 'cross-site') return json({ error: 'origin_denied' }, 403);
  if (path === '/auth/config' && request.method === 'GET') {
    const nonce = random();
    return json({ clientId: env.GOOGLE_CLIENT_ID, nonce }, 200, [setCookie(NONCE, nonce, 600)]);
  }
  if (path === '/auth/session' && request.method === 'GET') {
    try {
      await googleSession(request, env);
      const csrf = cookie(request, CSRF);
      if (!/^[a-f0-9]{64}$/.test(csrf)) throw Error('Missing CSRF cookie');
      return json({ authenticated: true, csrf, aiEnabled: env.AI_ENABLED === 'true' });
    } catch { return json({ authenticated: false }, 401); }
  }
  if (request.method !== 'POST' || !['/auth/login', '/auth/logout'].includes(path)) return json({ error: 'not_found' }, 404);
  const origin = new URL(request.url).origin;
  if (request.headers.get('origin') !== origin || env.ALLOWED_ORIGIN !== origin) return json({ error: 'origin_denied' }, 403);
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return json({ error: 'invalid_input' }, 400);
  if (path === '/auth/logout') {
    if (!checkCsrf(request)) return json({ error: 'csrf_denied' }, 403);
    return json({ signedOut: true }, 200, [setCookie(SESSION, '', 0), setCookie(CSRF, '', 0), setCookie(NONCE, '', 0)]);
  }
  try {
    if (!env.AI_RATE_LIMITER) return json({ error: 'login_unavailable' }, 503);
    const ip = request.headers.get('cf-connecting-ip');
    if (!ip) return json({ error: 'login_unavailable' }, 503);
    if (!(await env.AI_RATE_LIMITER.limit({ key: 'login:' + ip })).success) return json({ error: 'rate_limited', message: 'Too many sign-in attempts. Wait a minute and try again.' }, 429);
    const reader = request.body?.getReader();
    if (!reader) return json({ error: 'invalid_input' }, 400);
    let size = 0; const chunks = [];
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 10000) { await reader.cancel(); return json({ error: 'request_too_large' }, 413); }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const value of chunks) { bytes.set(value, offset); offset += value.byteLength; }
    let body;
    try { body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); } catch { return json({ error: 'invalid_input' }, 400); }
    if (!body || Object.keys(body).some(k => k !== 'credential') || (typeof body.credential !== 'string' || body.credential.length > 3500)) return json({ error: 'invalid_input' }, 400);
    const nonce = cookie(request, NONCE);
    if (!/^[a-f0-9]{64}$/.test(nonce) || request.headers.get('x-csrf-token') !== nonce) return json({ error: 'csrf_denied' }, 403);
    const claims = await verifyGoogleIdToken(body.credential, env, { nonce, allowedEmails: allowedEmails(env), claims: true });
    const age = Math.min(claims.exp - Math.floor(Date.now() / 1000), 3600);
    const csrf = random();
    return json({ authenticated: true }, 200, [setCookie(SESSION, body.credential, age), setCookie(CSRF, csrf, age), setCookie(NONCE, '', 0)]);
  } catch { return json({ error: 'unauthorized', message: 'Sign-in could not be verified. Reload and use an approved Google account.' }, 401); }
}
