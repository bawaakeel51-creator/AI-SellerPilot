// Google Identity Services ID-token verifier. No OAuth client secret or card required.
// Caller must provide GOOGLE_CLIENT_ID. Never trust decoded claims before signature verification.
const decode = value => {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) throw Error('Invalid token');
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
};
const parse = value => JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(decode(value)));
let cache = { keys: null, expires: 0 };
export async function verifyGoogleIdToken(token, env, options = {}) {
  if (!env.GOOGLE_CLIENT_ID || typeof env.GOOGLE_CLIENT_ID !== 'string') throw Error('Google login not configured');
  if (typeof token !== 'string' || token.length > 8192) throw Error('Invalid token');
  const parts = token.split('.');
  if (parts.length !== 3) throw Error('Invalid token');
  const header = parse(parts[0]), payload = parse(parts[1]);
  const now = Math.floor(Date.now() / 1000);
  if (header?.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid ||
      !['accounts.google.com', 'https://accounts.google.com'].includes(payload?.iss) ||
      payload.aud !== env.GOOGLE_CLIENT_ID || typeof payload.sub !== 'string' ||
      !/^[0-9]{1,64}$/.test(payload.sub) ||
      !Number.isSafeInteger(payload.exp) || payload.exp <= now ||
      !Number.isSafeInteger(payload.iat) || payload.iat > now + 60 || payload.iat >= payload.exp ||
      (payload.nbf !== undefined && (!Number.isSafeInteger(payload.nbf) || payload.nbf > now)) ||
      (payload.azp !== undefined && payload.azp !== env.GOOGLE_CLIENT_ID)) throw Error('Unauthorized');
  const loadKeys = async force => {
    if (!force && cache.keys && Date.now() < cache.expires) return cache.keys;
    const response = await (options.fetch ?? fetch)('https://www.googleapis.com/oauth2/v3/certs', {
      signal: AbortSignal.timeout(3000)
    });
    if (!response.ok) throw Error('Authentication unavailable');
    const data = await response.json();
    if (!Array.isArray(data.keys)) throw Error('Authentication unavailable');
    const maxAge = /max-age=(\d+)/i.exec(response.headers.get('cache-control') || '');
    cache = { keys: data.keys, expires: Date.now() + Math.min(Number(maxAge?.[1] || 300), 3600) * 1000 };
    return cache.keys;
  };
  let keys = await loadKeys(false);
  let jwk = keys.find(k => k.kid === header.kid && k.kty === 'RSA' && k.use === 'sig' && k.alg === 'RS256');
  if (!jwk) {
    keys = await loadKeys(true);
    jwk = keys.find(k => k.kid === header.kid && k.kty === 'RSA' && k.use === 'sig' && k.alg === 'RS256');
  }
  if (!jwk) throw Error('Unknown signing key');
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, decode(parts[2]), new TextEncoder().encode(parts[0] + '.' + parts[1]));
  if (!ok) throw Error('Invalid signature');
  return 'google:' + payload.sub;
}
