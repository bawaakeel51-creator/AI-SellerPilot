/* Pure draft functions also exported for dependency-free Node tests. */
(function () {
'use strict';
const markets = {
 'Amazon India': 'Review title, five feature bullets and search terms against your category requirements.',
 'Flipkart': 'Review the draft alongside category attributes and specifications in Seller Hub.',
 'Meesho': 'Review product name, description and mandatory catalogue attributes in the Supplier Panel.'
};
const clean = value => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
const limits = {name:120,brand:70,category:80,material:100,colour:60,size:100,terms:1000,features:2000};
function buildDraft(input) {
 if (!Object.hasOwn(markets,input.market)) throw Error('Choose a supported marketplace.');
 for (const [key,max] of Object.entries(limits)) if (String(input[key] || '').length > max) throw Error(`${key}: maximum ${max} characters.`);
 const get = key => clean(input[key]);
 if (!get('name')) throw Error('Product name is required.');
 if (!input.confirmed) throw Error('Confirm the product facts before generating.');
 const q = get('quantity');
 if (q && (!/^\d+$/.test(q) || Number(q)<1 || Number(q)>10000)) throw Error('Pack quantity must be a whole number from 1 to 10000.');
 const features = String(input.features || '').split(/\r?\n/).map(clean).filter(Boolean);
 if (features.length > 10) throw Error('Use no more than 10 feature lines.');
 const facts = [['Material','material'],['Colour','colour'],['Size','size']].filter(([,key])=>get(key)).map(([label,key])=>`${label}: ${get(key)}`);
 if (q) facts.push(`Pack quantity: ${Number(q)}`);
 const title = [get('brand'), get('name'), get('material'), get('colour'),get('size'),q ? `Pack of ${Number(q)}` : ''].filter(Boolean).join(' | ');
 // No invented benefits, omitted facts or silently truncated titles.
 if (title.length>180) throw Error('Combined title exceeds this tool’s 180-character draft limit. Shorten name or attributes.');
 const bullets = [...facts,...features];
 const displayBullets = input.market==='Amazon India' && bullets.length>5 ? [...bullets.slice(0,4),bullets.slice(4).join('; ')] : bullets;
 const keywords = [...new Set([get('name'),get('category'),...String(input.terms || '').split(',').map(clean)].filter(Boolean).map(s=>s.toLowerCase()))].join(', ');
 const description = [get('name'),get('category')?`Category: ${get('category')}`:'',...facts,...features].filter(Boolean).join('\n');
 return {market:input.market,title,bullets:displayBullets,description,keywords};
}
function toTXT(d){return [...(d.ai?['AI-assisted draft (Gemini). NOT verified: check every claim before publishing.',...(d.unsupportedClaims&&d.unsupportedClaims.length?[`Unsupported claims to remove or verify: ${d.unsupportedClaims.join(', ')}`]:[]),'']:[]),`Marketplace: ${d.market}`,`Title: ${d.title}`,'','Bullet points:',...d.bullets.map(s=>`- ${s}`),'','Description:',d.description,'',`Keywords: ${d.keywords}`,'',d.ai?'AI-assisted draft. Review all facts and category requirements before publishing.':'Template draft. Review all facts and category requirements before publishing.'].join('\n');}
function csvCell(value){let s=String(value);if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
function toCSV(d){return '\ufeff'+[['Marketplace','Title','Bullet points','Description','Keywords'],[d.market,d.title,d.bullets.join('\n'),d.description,d.keywords]].map(row=>row.map(csvCell).join(',')).join('\r\n');}

const API_MARKETS = {'Amazon India':'amazon_in','Flipkart':'flipkart','Meesho':'meesho'};
function toApiRequest(input) {
 if (!Object.hasOwn(API_MARKETS,input.market)) throw Error('Choose a supported marketplace.');
 buildDraft(input); // reuse the same validation and confirmation checks
 const get = key => clean(input[key]);
 const facts = {name:get('name')};
 for (const [apiKey,key] of [['brand','brand'],['material','material'],['color','colour'],['size','size']]) if (get(key)) facts[apiKey] = get(key);
 if (get('quantity')) { const q = Number(get('quantity')); if (q>1000) throw Error('AI generation supports pack quantity up to 1000.'); facts.packQuantity = q; }
 const features = String(input.features || '').split(/\r?\n/).map(clean).filter(Boolean);
 if (features.some(f=>f.length>160)) throw Error('Each feature line must be 160 characters or fewer for AI generation.');
 if (features.length) facts.features = features;
 return {marketplace:API_MARKETS[input.market],facts};
}
function fromApiResponse(body, market, keywords) {
 const d = body && body.draft;
 if (!body || body.reviewRequired !== true || !d || typeof d.title !== 'string' || typeof d.description !== 'string' || !Array.isArray(d.bullets) || !d.bullets.every(b=>typeof b==='string') || !Array.isArray(d.unsupportedClaims)) throw Error('The AI service returned an unexpected response. Use the template draft.');
 return {market,title:d.title,bullets:d.bullets,description:d.description,keywords:keywords||'',ai:true,unsupportedClaims:d.unsupportedClaims.filter(c=>typeof c==='string')};
}
async function requestAi(input, apiUrl, fetchImpl) {
 const endpoint = new URL('/v1/listings/generate', apiUrl);
 if (endpoint.protocol !== 'https:') throw Error('AI service must use HTTPS.');
 const payload = toApiRequest(input);
 let res;
 try {
  res = await fetchImpl(endpoint.href, {method:'POST',mode:'cors',credentials:'include',redirect:'manual',headers:{'content-type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});
 } catch { throw Error(`Could not reach the AI service. Sign in at ${endpoint.origin} in this browser, then try again. The template draft still works.`); }
 if (res.type === 'opaqueredirect') throw Error(`Sign in is required. Open ${endpoint.origin} in this browser, sign in, then try again.`);
 let body = null;
 try { body = await res.json(); } catch { /* fall through to generic message */ }
 if (!res.ok) throw Error(body && typeof body.message === 'string' ? body.message : `AI service error (${res.status}). Use the template draft.`);
 return fromApiResponse(body, input.market, buildDraft(input).keywords);
}
if(typeof module!=='undefined')module.exports={buildDraft,toTXT,toCSV,csvCell,toApiRequest,fromApiResponse,requestAi};
if(typeof document==='undefined')return;
const $ = id=>document.getElementById(id);let draft=null;let revision=0;
function invalidate(message='Inputs changed. Generate a fresh draft.'){revision++;draft=null;$('txt').disabled=$('csv').disabled=true;$('result').textContent='Your draft will appear here.';$('counts').textContent='';$('status').textContent=message;}
$('listing-form').addEventListener('input',()=>invalidate());
$('market').addEventListener('change',()=>{invalidate();$('guidance').textContent=markets[$('market').value];});
$('listing-form').addEventListener('reset',()=>{invalidate('Form cleared.');$('guidance').textContent=markets['Amazon India'];});
$('listing-form').addEventListener('submit',event=>{event.preventDefault();revision++;try{const input=Object.fromEntries(['market',...Object.keys(limits),'quantity'].map(id=>[id,$(id).value]));input.confirmed=$('confirmed').checked;draft=buildDraft(input);$('result').textContent=toTXT(draft);$('guidance').textContent=markets[draft.market];$('counts').textContent=`Title: ${draft.title.length}/180 characters · ${draft.bullets.length} bullets · Keywords: ${new TextEncoder().encode(draft.keywords).length} UTF-8 bytes`;$('txt').disabled=$('csv').disabled=false;$('status').textContent='Draft ready. Check every claim before publishing.';}catch(error){invalidate(error.message);}});
function download(kind){if(!draft)return;const url=URL.createObjectURL(new Blob([kind==='csv'?toCSV(draft):toTXT(draft)],{type:kind==='csv'?'text/csv;charset=utf-8':'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`sellerpilot-${draft.market.toLowerCase().replaceAll(' ','-')}-listing.${kind}`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('txt').onclick=()=>download('txt');$('csv').onclick=()=>download('csv');
const aiUrl = (typeof window!=='undefined' && window.SELLERPILOT_AI && window.SELLERPILOT_AI.apiUrl) || '';
if (aiUrl && $('ai')) {
 $('ai').hidden = false;
 $('ai').addEventListener('click', async () => {
  invalidate('Contacting AI service…');
  const requestRevision = revision;
  const button = $('ai'); button.disabled = true; $('status').textContent = 'Contacting AI service…';
  try {
   const input = Object.fromEntries(['market',...Object.keys(limits),'quantity'].map(id=>[id,$(id).value])); input.confirmed = $('confirmed').checked;
   const responseDraft = await requestAi(input, aiUrl, (...args)=>fetch(...args));
   if (revision !== requestRevision) return;
   draft = responseDraft;
   $('result').textContent = toTXT(draft); $('guidance').textContent = markets[draft.market];
   $('counts').textContent = `Title: ${draft.title.length} characters · ${draft.bullets.length} bullets · AI-assisted, review required`;
   $('txt').disabled = $('csv').disabled = false;
   $('status').textContent = draft.unsupportedClaims.length ? 'AI draft ready. Unsupported claims were flagged; remove or verify them.' : 'AI draft ready. Check every claim before publishing.';
  } catch (error) { if (revision === requestRevision) $('status').textContent = error.message; } finally { button.disabled = false; }
 });
}

})();
