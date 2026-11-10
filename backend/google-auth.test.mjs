import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyGoogleIdToken } from './google-auth.mjs';
const enc = new TextEncoder();
const pair = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1,0,1]), hash: 'SHA-256' }, true, ['sign','verify']);
const other = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1,0,1]), hash: 'SHA-256' }, true, ['sign','verify']);
const key = { ...(await crypto.subtle.exportKey('jwk', pair.publicKey)), kid: 'test-key', use: 'sig', alg: 'RS256' };
const b64 = v => Buffer.from(v).toString('base64url');
async function makeToken(overrides = {}, signingPair = pair) {
  const now = Math.floor(Date.now()/1000);
  const header = b64(enc.encode(JSON.stringify({ alg:'RS256', kid:'test-key' })));
  const body = b64(enc.encode(JSON.stringify({ iss:'https://accounts.google.com', aud:'client-123', sub:'123456789', iat:now, exp:now+3600, ...overrides })));
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', signingPair.privateKey, enc.encode(header+'.'+body));
  return header+'.'+body+'.'+b64(sig);
}
const options = { fetch: async () => Response.json({ keys:[key] }, { headers: { 'cache-control':'max-age=60' } }) };
const env = { GOOGLE_CLIENT_ID:'client-123' };
test('accepts signed Google token and namespaces stable user identity', async () => {
  assert.equal(await verifyGoogleIdToken(await makeToken(), env, options), 'google:123456789');
});
test('rejects missing configuration and malformed tokens', async () => {
  await assert.rejects(verifyGoogleIdToken(await makeToken(), {}, options));
  await assert.rejects(verifyGoogleIdToken('not-a-jwt', env, options));
});
test('rejects wrong audience, issuer, expired, future and forged signatures', async () => {
  const now = Math.floor(Date.now()/1000);
  for (const token of [
    await makeToken({ aud:'wrong' }),
    await makeToken({ iss:'https://evil.example' }),
    await makeToken({ exp:now-1 }),
    await makeToken({ iat:now+1000 }),
    await makeToken({ azp:'wrong' }),
    await makeToken({}, other)
  ]) await assert.rejects(verifyGoogleIdToken(token, env, options));
});
