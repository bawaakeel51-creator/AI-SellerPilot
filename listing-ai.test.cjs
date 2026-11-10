const test = require('node:test');
const assert = require('node:assert/strict');
const { buildDraft, toTXT, toApiRequest, fromApiResponse, requestAi } = require('./listing.js');
const fs = require('node:fs');

const input = { market: 'Amazon India', name: 'Steel ring', brand: '', category: 'Rings', material: '316L steel', colour: 'Silver', size: '18 mm', quantity: '2', features: 'Polished finish\nHandmade', terms: 'steel ring', confirmed: true };
const good = { reviewRequired: true, draft: { title: 'Steel ring', description: 'A ring', bullets: ['Polished'], claims: [], unsupportedClaims: [], requiresHumanReview: true } };
const respond = (body, status = 200, extra = {}) => ({ ok: status < 400, status, type: 'cors', json: async () => body, ...extra });

test('maps form input to the strict API contract', () => {
  assert.deepEqual(toApiRequest(input), { marketplace: 'amazon_in', facts: { name: 'Steel ring', material: '316L steel', color: 'Silver', size: '18 mm', packQuantity: 2, features: ['Polished finish', 'Handmade'] } });
});
test('requires confirmation, valid marketplace and API-sized values', () => {
  assert.throws(() => toApiRequest({ ...input, confirmed: false }), /Confirm/);
  assert.throws(() => toApiRequest({ ...input, market: 'Other' }), /marketplace/);
  assert.throws(() => toApiRequest({ ...input, quantity: '5000' }), /up to 1000/);
  assert.throws(() => toApiRequest({ ...input, features: 'x'.repeat(161) }), /160/);
});
test('API request never contains identity, quota or price fields', () => {
  const keys = Object.keys(toApiRequest({ ...input, price: '999', userId: 'admin' }));
  assert.deepEqual(keys.sort(), ['facts', 'marketplace']);
});
test('rejects malformed or unreviewed AI responses', () => {
  assert.throws(() => fromApiResponse(null, 'Amazon India', ''), /unexpected/);
  assert.throws(() => fromApiResponse({ ...good, reviewRequired: false }, 'Amazon India', ''), /unexpected/);
  assert.throws(() => fromApiResponse({ reviewRequired: true, draft: { title: 1 } }, 'Amazon India', ''), /unexpected/);
});
test('AI output is labelled and shows unsupported claims; template output stays unlabelled', () => {
  const ai = fromApiResponse({ ...good, draft: { ...good.draft, unsupportedClaims: ['Waterproof'] } }, 'Amazon India', 'steel');
  const txt = toTXT(ai);
  assert.match(txt, /AI-assisted draft \(Gemini\)/);
  assert.match(txt, /Unsupported claims.*Waterproof/);
  const template = toTXT(buildDraft(input));
  assert.doesNotMatch(template, /AI-assisted/);
  assert.match(template, /Template draft/);
});
test('requestAi posts to the HTTPS endpoint with credentials and returns an AI draft', async () => {
  let seen;
  const draft = await requestAi(input, 'https://api.example.workers.dev', async (url, init) => { seen = { url, init }; return respond(good); });
  assert.equal(seen.url, 'https://api.example.workers.dev/v1/listings/generate');
  assert.equal(seen.init.method, 'POST');
  assert.equal(seen.init.credentials, 'include');
  assert.equal(draft.ai, true);
  assert.equal(draft.keywords, buildDraft(input).keywords);
});
test('requestAi refuses non-HTTPS endpoints before any network call', async () => {
  let called = false;
  await assert.rejects(requestAi(input, 'http://api.example.com', async () => { called = true; }), /HTTPS/);
  assert.equal(called, false);
});
test('requestAi surfaces clear errors for quota, sign-in, network and bad responses', async () => {
  await assert.rejects(requestAi(input, 'https://a.example', async () => respond({ error: 'quota_exceeded', message: 'Daily AI allowance used up.' }, 429)), /Daily AI allowance/);
  await assert.rejects(requestAi(input, 'https://a.example', async () => respond(null, 502, { json: async () => { throw Error('x'); } })), /AI service error \(502\)/);
  await assert.rejects(requestAi(input, 'https://a.example', async () => respond(null, 200, { type: 'opaqueredirect', ok: false })), /Sign in is required/);
  await assert.rejects(requestAi(input, 'https://a.example', async () => { throw new TypeError('Failed to fetch'); }), /Could not reach the AI service/);
});
test('AI stays disabled and hidden by default; no secrets in public files', () => {
  assert.match(fs.readFileSync('ai-config.js', 'utf8'), /apiUrl: ''/);
  assert.match(fs.readFileSync('listing.html', 'utf8'), /id="ai"[^>]*hidden/);
  for (const f of ['ai-config.js', 'listing.js', 'listing.html', 'backend/wrangler.toml']) {
    assert.doesNotMatch(fs.readFileSync(f, 'utf8'), /AIza[0-9A-Za-z_-]{20,}|sk-[A-Za-z0-9]{20,}|GEMINI_API_KEY\s*=\s*"[^"]+"/, f);
  }
  assert.match(fs.readFileSync('backend/wrangler.toml', 'utf8'), /AI_ENABLED = "false"/);
});

test('editing or generating a template while AI is pending discards stale success and failure', async () => {
  const vm = require('node:vm');
  for (const action of ['input', 'reset', 'submit', 'reject']) {
    const nodes = {};
    const document = { getElementById(id) { return nodes[id] ||= { value: '', checked: false, disabled: true, events: {}, addEventListener(e, fn) { this.events[e] = fn; } }; } };
    let resolve, reject;
    const pending = new Promise((yes, no) => { resolve = yes; reject = no; });
    const ctx = { document, window: { SELLERPILOT_AI: { apiUrl: 'https://api.example' } }, fetch: () => pending, URL, TextEncoder, AbortSignal };
    vm.runInNewContext(fs.readFileSync('listing.js', 'utf8'), ctx);
    for (const [key, value] of Object.entries(input)) document.getElementById(key).value = value;
    nodes.confirmed.checked = true;
    const request = nodes.ai.events.click();
    if (action === 'submit') nodes['listing-form'].events.submit({ preventDefault() {} });
    else nodes['listing-form'].events[action === 'reject' ? 'input' : action]();
    const previousStatus = nodes.status.textContent;
    if (action === 'reject') reject(new Error('network'));
    else resolve(respond(good));
    await request;
    assert.equal(nodes.status.textContent, previousStatus);
    assert.equal(nodes.csv.disabled, action !== 'submit');
    assert.doesNotMatch(nodes.result.textContent, /AI-assisted/);
    assert.equal(nodes.ai.disabled, false);
  }
});

test('private studio build keeps AI on its own origin and preserves public tools', () => {
  require('node:child_process').execFileSync(process.execPath, ['backend/build-studio.mjs']);
  const html = fs.readFileSync('backend/public/studio/index.html', 'utf8');
  assert.match(html, /connect-src 'self'/);
  assert.match(html, /Private AI preview/);
  assert.match(html, /Do not enter confidential or personal data/);
  for (const page of ['index.html','workspace.html','research.html']) assert.ok(html.includes('https://bawaakeel51-creator.github.io/AI-SellerPilot/'+page));
  assert.match(fs.readFileSync('backend/public/studio/ai-config.js', 'utf8'), /window.location.origin/);
  assert.match(fs.readFileSync('ai-config.js','utf8'), /apiUrl: ''/);
});
