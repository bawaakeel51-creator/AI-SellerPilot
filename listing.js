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
function toTXT(d){return [`Marketplace: ${d.market}`,`Title: ${d.title}`,'','Bullet points:',...d.bullets.map(s=>`- ${s}`),'','Description:',d.description,'',`Keywords: ${d.keywords}`,'','Template draft. Review all facts and category requirements before publishing.'].join('\n');}
function csvCell(value){let s=String(value);if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
function toCSV(d){return '\ufeff'+[['Marketplace','Title','Bullet points','Description','Keywords'],[d.market,d.title,d.bullets.join('\n'),d.description,d.keywords]].map(row=>row.map(csvCell).join(',')).join('\r\n');}
if(typeof module!=='undefined')module.exports={buildDraft,toTXT,toCSV,csvCell};
if(typeof document==='undefined')return;
const $ = id=>document.getElementById(id);let draft=null;
function invalidate(message='Inputs changed. Generate a fresh draft.'){draft=null;$('txt').disabled=$('csv').disabled=true;$('result').textContent='Your draft will appear here.';$('counts').textContent='';$('status').textContent=message;}
$('listing-form').addEventListener('input',()=>invalidate());
$('market').addEventListener('change',()=>{invalidate();$('guidance').textContent=markets[$('market').value];});
$('listing-form').addEventListener('reset',()=>{invalidate('Form cleared.');$('guidance').textContent=markets['Amazon India'];});
$('listing-form').addEventListener('submit',event=>{event.preventDefault();try{const input=Object.fromEntries(['market',...Object.keys(limits),'quantity'].map(id=>[id,$(id).value]));input.confirmed=$('confirmed').checked;draft=buildDraft(input);$('result').textContent=toTXT(draft);$('guidance').textContent=markets[draft.market];$('counts').textContent=`Title: ${draft.title.length}/180 characters · ${draft.bullets.length} bullets · Keywords: ${new TextEncoder().encode(draft.keywords).length} UTF-8 bytes`;$('txt').disabled=$('csv').disabled=false;$('status').textContent='Draft ready. Check every claim before publishing.';}catch(error){invalidate(error.message);}});
function download(kind){if(!draft)return;const url=URL.createObjectURL(new Blob([kind==='csv'?toCSV(draft):toTXT(draft)],{type:kind==='csv'?'text/csv;charset=utf-8':'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`sellerpilot-${draft.market.toLowerCase().replaceAll(' ','-')}-listing.${kind}`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('txt').onclick=()=>download('txt');$('csv').onclick=()=>download('csv');
})();
