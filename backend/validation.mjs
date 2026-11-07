// Pure validation layer; no provider calls, credentials, or network access.
export const MARKETPLACES = Object.freeze(['amazon_in', 'flipkart', 'meesho']);
const MAX_BODY_BYTES = 8192;
const FACT_KEYS = ['name', 'brand', 'material', 'color', 'size', 'packQuantity', 'features'];
const forbidden = /(?:ignore (?:all |previous )?instructions|system prompt|developer message|api[_ -]?key|secret token)/i;
function plainObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype; }
function cleanText(v, limit) {
  if (typeof v !== 'string' || !v.trim() || v.length > limit || /[\u0000-\u001f\u007f]/.test(v)) throw new TypeError('Invalid product fact');
  return v.trim();
}
export function validateListingRequest(input) {
  if (!plainObject(input)) throw new TypeError('Invalid request');
  if (new TextEncoder().encode(JSON.stringify(input)).byteLength > MAX_BODY_BYTES) throw new RangeError('Request too large');
  if (Object.keys(input).some(k => !['marketplace', 'facts'].includes(k))) throw new TypeError('Unknown request field');
  if (!MARKETPLACES.includes(input.marketplace)) throw new TypeError('Invalid marketplace');
  if (!plainObject(input.facts) || Object.keys(input.facts).some(k => !FACT_KEYS.includes(k))) throw new TypeError('Unknown product fact');
  const facts = {};
  facts.name = cleanText(input.facts.name, 150);
  for (const key of ['brand','material','color','size']) {
    if (input.facts[key] !== undefined) facts[key] = cleanText(input.facts[key], 120);
  }
  if (input.facts.packQuantity !== undefined) {
    if (!Number.isSafeInteger(input.facts.packQuantity) || input.facts.packQuantity < 1 || input.facts.packQuantity > 1000) throw new TypeError('Invalid pack quantity');
    facts.packQuantity = input.facts.packQuantity;
  }
  if (input.facts.features !== undefined) {
    if (!Array.isArray(input.facts.features) || input.facts.features.length > 10) throw new TypeError('Invalid features');
    facts.features = input.facts.features.map(v => cleanText(v, 160));
  }
  // Product facts are untrusted data. Do not execute instructions embedded in them.
  return Object.freeze({marketplace: input.marketplace, facts: Object.freeze(facts)});
}
// Conservative risk detection, not factuality certification; human approval remains mandatory.
const HIGH_RISK_CLAIMS = [
  /\b(?:waterproof|water-resistant|hypoallergenic|anti-tarnish|nickel-free|lead-free)\b/gi,
  /\b(?:certified|certification|fda-approved|bis-certified|iso-certified|clinically proven)\b/gi,
  /\b(?:lifetime warranty|warranty|guaranteed|100% genuine|authentic)\b/gi,
  /\b(?:18k|22k|24k|316l|304)\b/gi,
  /\b(?:made in india|made in usa|imported from)\b/gi,
  /\b(?:free shipping|free returns|best seller|top rated|five-star)\b/gi
];
function riskPhrases(text) {
  const hits = [];
  for (const pattern of HIGH_RISK_CLAIMS) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) hits.push(match[0]);
  }
  return hits;
}
export function validateModelDraft(draft, request) {
  if (!plainObject(draft) || Object.keys(draft).some(k => !['title','bullets','description','claims'].includes(k))) throw new TypeError('Invalid model response');
  const title = cleanText(draft.title, 180);
  const description = cleanText(draft.description, 3000);
  if (!Array.isArray(draft.bullets) || draft.bullets.length > 8) throw new TypeError('Invalid bullets');
  const bullets = draft.bullets.map(v => cleanText(v, 300));
  if (!Array.isArray(draft.claims) || draft.claims.length > 20) throw new TypeError('Invalid claims');
  const claims = draft.claims.map(v => cleanText(v, 200));
  const source = Object.values(request.facts).flat().map(v => String(v).toLowerCase());
  const supported = c => source.some(v => v.includes(c.toLowerCase()));
  const unsupportedClaims = [...new Set([...claims, ...riskPhrases([title, description, ...bullets].join(' '))].filter(c => !supported(c)))];
  return {title, description, bullets, claims, unsupportedClaims, requiresHumanReview: true};
}
export function detectInstructionLikeFacts(request) {
  return Object.values(request.facts).flat().some(v => typeof v === 'string' && forbidden.test(v));
}
