/* Versioned, manual evidence records. No requests, tracking or AI calls. */
(function(){
'use strict';
const markets=['Amazon India','Flipkart','Meesho','Shopify / Own Store','Other'];
const key='sellerpilot-evidence-v1';
function text(value,max,label){const s=String(value??'').trim();if(!s||s.length>max)throw Error(`${label}: enter 1–${max} characters.`);return s;}
function date(value,label){const s=String(value||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s)throw Error(`${label}: enter a valid date.`);return s;}
function url(value){const s=text(value,2000,'Source URL');let u;try{u=new URL(s);}catch{throw Error('Enter a full HTTPS source URL.');}if(u.protocol!=='https:'||u.username||u.password)throw Error('Use HTTPS without embedded credentials.');return u.href;}
function record(input,today=new Date().toISOString().slice(0,10)){
 if(!['fee','competitor'].includes(input.type))throw Error('Choose a record type.');
 if(!markets.includes(input.market))throw Error('Choose a marketplace.');
 const checked=date(input.checked,'Observation date');if(checked>today)throw Error('Observation date cannot be in the future.');
 const amount=String(input.amount??'').trim();if(!/^\d+(\.\d{1,2})?$/.test(amount)||Number(amount)>1e9)throw Error('Enter a non-negative INR amount with at most two decimals.');
 const r={version:1,type:input.type,market:input.market,label:text(input.label,120,'Product / category'),amount:Number(amount),source:url(input.source),checked,notes:String(input.notes??'').trim()};
 if(r.notes.length>1000)throw Error('Notes: maximum 1000 characters.');
 if(input.type==='fee'){r.fulfilment=text(input.fulfilment,120,'Fulfilment mode');r.effective=date(input.effective,'Effective date');r.basis='Seller-entered fee; not automatically verified';}
 else {if(!['Observed','Estimated'].includes(input.basis))throw Error('Choose observed or estimated.');r.basis=input.basis;}
 return r;
}
function csv(rows){const cell=v=>'"'+(/^[\s]*[=+@-]/.test(String(v))?"'":'')+String(v??'').replaceAll('"','""')+'"';const cols=['version','type','market','label','amount','source','checked','effective','fulfilment','basis','notes'];return '\ufeff'+[cols,...rows.map(r=>cols.map(k=>r[k]))].map(r=>r.map(cell).join(',')).join('\r\n');}
function decode(raw){const d=JSON.parse(raw);if(d.version!==1||!Array.isArray(d.records)||d.records.length>100)throw Error('Unsupported saved records.');return d.records.map(r=>record(r));}
if(typeof module!=='undefined')module.exports={record,csv,decode};
if(typeof document==='undefined')return;
const $=id=>document.getElementById(id);let records=[];
function status(s){$('status').textContent=s;}
function persist(){if(!$('remember').checked)return;try{localStorage.setItem(key,JSON.stringify({version:1,records}));}catch{status('Browser storage failed. Records remain here; export before closing.');}}
function render(){const list=$('records');list.replaceChildren();$('count').textContent=`${records.length}/100 records`;records.forEach((r,i)=>{const item=document.createElement('article');item.className='record';const h=document.createElement('h3');h.textContent=`${r.type==='fee'?'Fee':'Competitor'} · ${r.label} · ₹${r.amount.toFixed(2)}`;const p=document.createElement('p');p.textContent=`${r.market} · ${r.basis} · Checked ${r.checked}`+(r.effective?` · Effective ${r.effective} · ${r.fulfilment}`:'');const notes=document.createElement('p');notes.textContent=r.notes;const a=document.createElement('a');a.href=r.source;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Open source ↗';const remove=document.createElement('button');remove.type='button';remove.className='secondary';remove.textContent='Remove record';remove.setAttribute('aria-label',`Remove ${r.label} record ${i+1}`);remove.onclick=()=>{records.splice(i,1);render();status('Record removed.');persist();};item.append(h,p,notes,a,remove);list.append(item);});$('export').disabled=!records.length;}
function fields(){const fee=$('type').value==='fee';$('fee-fields').hidden=!fee;$('basis-label').hidden=fee;}
try{const saved=localStorage.getItem(key);if(saved){records=decode(saved);$('remember').checked=true;status('Saved records restored on this browser.');}}catch{status('Saved records could not be loaded. Use Delete saved data to remove them.');}
$('type').onchange=fields;
$('record-form').onsubmit=e=>{e.preventDefault();try{if(records.length>=100)throw Error('100-record limit reached. Export and remove old records.');const input=Object.fromEntries(['type','market','label','amount','source','checked','effective','fulfilment','basis','notes'].map(k=>[k,$(k).value]));records.push(record(input));render();status('Record added. Review the source before pricing.');persist();}catch(e){status(e.message);}};
$('record-form').onreset=()=>setTimeout(fields,0);
$('remember').onchange=()=>{if($('remember').checked){status('Saving enabled on this browser. Avoid shared devices.');persist();}else{try{localStorage.removeItem(key);status('Saved copy removed. Current records remain until reload.');}catch{status('Could not remove saved copy. Clear this site’s browser data.');}}};
$('delete').onclick=()=>{try{localStorage.removeItem(key);records=[];$('remember').checked=false;render();status('All workspace records deleted from this browser.');}catch{status('Deletion failed. Clear this site’s browser data.');}};
$('export').onclick=()=>{if(!records.length)return;const u=URL.createObjectURL(new Blob([csv(records)],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=u;a.download='sellerpilot-evidence.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);};
fields();render();
})();
