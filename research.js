(function(){
'use strict';
const codec=typeof module!=='undefined'?require('./csv-codec.js'):window.SellerPilotCSV;
const STORAGE='sellerpilot.research.v4';
const markets=['Amazon India','Flipkart','Meesho','Shopify / Own Store','Other'];
function text(value,max,required=true){if(typeof value!=='string'||value.length>max||(required&&!value.trim()))throw Error('Fill required text fields within their character limits.');const cleaned=value.replace(/[\u0000-\u001f\u007f]/g,' ').trim();if(required&&!cleaned)throw Error('Fill required text fields.');return cleaned;}
function amount(value,max=1e9,min=0){if(!['string','number'].includes(typeof value)||String(value).trim()===''||(typeof value==='string'&&!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim()))||!Number.isFinite(Number(value))||Number(value)<min||Number(value)>max)throw Error(`Enter an amount between ${min} and ${max}.`);return Number(value);}
function date(value,allowFuture=false){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))throw Error('Enter a valid date.');const d=new Date(value+'T00:00:00Z');if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==value||(!allowFuture&&value>new Date().toISOString().slice(0,10)))throw Error('Check the date; observation dates cannot be in the future.');return value;}
function source(value){const s=text(value,1000);let u;try{u=new URL(s);}catch{throw Error('Use a complete HTTPS source URL.');}if(u.protocol!=='https:'||u.username||u.password||!u.hostname.includes('.'))throw Error('Use an HTTPS URL without credentials.');if(u.href.length>1000)throw Error('Source URL is too long after URL encoding.');return u.href;}
function validateRecord(r){if(!r||typeof r!=='object'||Array.isArray(r))throw Error('Invalid record.');const common={type:r.type,source:source(r.source),checked:date(r.checked),notes:text(r.notes??'',1000,false)};if(r.type==='fee'){if(!markets.includes(r.market))throw Error('Choose a supported marketplace.');return {...common,market:r.market,category:text(r.category,80),fulfilment:text(r.fulfilment,80),version:text(r.version,40),effective:date(r.effective,true),price:amount(r.price,1e9,.01),percent:amount(r.percent,100),fixed:amount(r.fixed)};}if(r.type==='competitor'){if(!['Observed','Estimated'].includes(r.kind))throw Error('Choose observed or estimated.');return {...common,label:text(r.label,120),kind:r.kind,price:amount(r.price,1e9,.01),ownPrice:amount(r.ownPrice,1e9,.01)};}throw Error('Unknown record type.');}
function feeEstimate(r){return r.price*r.percent/100+r.fixed;}
function comparison(r){return {difference:r.ownPrice-r.price,percent:(r.ownPrice-r.price)/r.price*100};}
function decode(raw){if(typeof raw!=='string'||new TextEncoder().encode(raw).length>500000)throw Error('Saved copy is too large or invalid.');const data=JSON.parse(raw);if(!data||data.version!==4||!Array.isArray(data.records)||data.records.length>100)throw Error('Unsupported saved copy.');return data.records.map(validateRecord);}
function backup(records){if(!Array.isArray(records)||records.length>100)throw Error('Invalid record count.');const raw=JSON.stringify({version:4,records:records.map(validateRecord)},null,2);if(new TextEncoder().encode(raw).length>500000)throw Error('Backup exceeds 500 KB. Export CSV or split records before JSON backup.');return raw;}
const cell=codec.cell;
const fields=['type','market','category','fulfilment','version','effective','checked','label','kind','price','percent','fixed','ownPrice','source','notes'];
function csv(records){return '\ufeff'+[[...fields,'csv_encoding'],...records.map(r=>[...fields.map(k=>r[k]),'apostrophe-v1'])].map(row=>row.map(cell).join(',')).join('\r\n');}
function parseCSV(raw){
 const rows=codec.parse(raw);const encoded=rows[0]?.length===fields.length+1&&rows[0][fields.length]==='csv_encoding';
 if(!rows.length||(!encoded&&rows[0].length!==fields.length)||fields.some((name,i)=>rows[0][i]!==name))throw Error('Choose a SellerPilot Research CSV backup; Evidence CSV uses a different schema.');
 if(rows.length<2)throw Error('CSV backup contains no records.');
 return rows.slice(1).map((cells,i)=>{
  if(cells.length!==fields.length+(encoded?1:0))throw Error(`Wrong column count in row ${i+1}.`);
  if(encoded&&cells[fields.length]!=='apostrophe-v1')throw Error('Unsupported CSV text encoding.');
  const r=Object.fromEntries(fields.map((name,j)=>[name,codec.restore(cells[j],encoded)]));
  const unused=r.type==='fee'?['label','kind','ownPrice']:['market','category','fulfilment','version','effective','percent','fixed'];
  if(unused.some(name=>r[name]!==''))throw Error(`Unexpected fields in row ${i+1}.`);
  return validateRecord(r);
 });
}
if(typeof module!=='undefined')module.exports={validateRecord,feeEstimate,comparison,decode,csv,backup,parseCSV};
if(typeof document==='undefined')return;
const $=id=>document.getElementById(id);let records=[],revision=0,importRequest=0,editing=null;
function status(s){$('workspace-status').textContent=s;}
const money=n=>'₹'+n.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
function line(parent,value){const p=document.createElement('p');p.textContent=value;parent.append(p);}
function download(content,type,name){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function render(){revision++;$('record-count').textContent=`${records.length}/100 records`;const root=$('records');root.replaceChildren();$('export').disabled=records.length===0;if(!records.length)line(root,'No records yet. Add a fee schedule or competitor observation above.');records.forEach((r,i)=>{const article=document.createElement('article');article.className='record';const h=document.createElement('h3');h.textContent=r.type==='fee'?`${r.market} · ${r.category} · ${r.version}`:r.label;article.append(h);if(r.type==='fee'){line(article,`${r.fulfilment} · Effective ${r.effective} · Checked ${r.checked}`);line(article,`User-entered fee estimate: ${money(feeEstimate(r))} at ${money(r.price)} (${r.percent}% + ${money(r.fixed)}). Excludes GST and shipping.`);}else{const c=comparison(r);line(article,`${r.kind} ${r.checked} · Competitor ${money(r.price)} · Yours ${money(r.ownPrice)}`);line(article,`Your price is ${money(Math.abs(c.difference))} (${Math.abs(c.percent).toFixed(1)}%) ${c.difference<0?'below':c.difference>0?'above':'equal to'} this comparator.`);}line(article,`Source (user supplied, not verified): ${r.source}`);if(r.notes)line(article,r.notes);const edit=document.createElement('button');edit.type='button';edit.className='secondary';edit.textContent='Edit record';edit.setAttribute('aria-label',`Edit record ${i+1}`);edit.onclick=()=>editRecord(i);article.append(edit);const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent='Remove record';b.setAttribute('aria-label',`Remove record ${i+1}`);b.onclick=()=>{if(!confirm('Remove this tab record? Saved device copy stays unchanged until Save.'))return;if(editing?.index===i)clearEditor();else if(editing&&i<editing.index)editing.index--;records.splice(i,1);render();status('Record removed from this tab. Save again to update the device copy.');};article.append(b);root.append(article);});}
function clearEditor(target=editing?.type){
 editing=null;
 for(const type of (target==='all'?['fee','competitor']:target?[target]:[])){const form=$(type+'-form');form.reset();$(type+'-submit').textContent=type==='fee'?'Add fee record':'Add observation';$(type+'-cancel').hidden=true;}
}
function editRecord(index){
 if(editing&&!confirm('Discard the current unsaved edit?'))return;
 clearEditor();const r=records[index],form=$(r.type+'-form');editing={index,type:r.type};
 for(const [name,value]of Object.entries(r)){const input=form.elements.namedItem(name);if(input)input.value=String(value);}
 $(r.type+'-submit').textContent='Save changes';$(r.type+'-cancel').hidden=false;
 form.querySelector('input').focus();status('Editing a tab record. Save on this device after updating to persist it.');
}
for(const type of ['fee','competitor']){
 $(type+'-cancel').onclick=()=>{clearEditor();status('Edit cancelled. Records unchanged.');};
 $(type+'-form').addEventListener('submit',e=>{e.preventDefault();try{
  if(editing&&editing.type!==type)throw Error('Save or cancel the active edit first.');
  if(!editing&&records.length>=100)throw Error('Maximum 100 records. Export and clear before adding more.');
  const r=validateRecord({...Object.fromEntries(new FormData(e.currentTarget)),type}),wasEditing=!!editing;
  if(editing)records[editing.index]=r;else records.push(r);
  clearEditor(type);render();status(wasEditing?'Record updated in this tab. Save on this device to persist.':'Record added to this tab. Save on this device or export to keep it.');
 }catch(err){status(err.message);}});
}
$('save').onclick=()=>{try{localStorage.setItem(STORAGE,JSON.stringify({version:4,records}));status(`${records.length} records saved on this device. No cloud sync.`);}catch{status('Device storage unavailable or full. Export CSV to keep your records.');}};
$('load').onclick=()=>{try{const raw=localStorage.getItem(STORAGE);if(raw===null)return status('No saved device copy found.');const loaded=decode(raw);if(records.length&&!confirm('Replace current tab records with the saved device copy?'))return;records=loaded;clearEditor('all');render();status(`Loaded ${records.length} records from this device.`);}catch{status('Could not load the device copy. Current tab records were preserved.');}};
$('erase').onclick=()=>{if(!confirm('Delete the saved device copy? Export first if you need a backup. Tab records will remain.'))return;try{localStorage.removeItem(STORAGE);status('Saved device copy deleted. Tab records remain.');}catch{status('Could not delete the device copy: storage is unavailable.');}};
$('clear').onclick=()=>{if(records.length&&!confirm('Clear tab records? Export or save first if needed.'))return;records=[];clearEditor('all');render();status('Tab records cleared. Any saved device copy remains.');};
$('backup').onclick=()=>{try{download(backup(records),'application/json;charset=utf-8','sellerpilot-research-v5-backup.json');status('JSON backup requested. Keep this file private.');}catch(err){status(err.message);}};
for(const format of ['json','csv'])$('import-'+format).addEventListener('change',async e=>{
 const input=e.currentTarget,file=input.files&&input.files[0];input.value='';if(!file)return;
 const before=revision,request=++importRequest;
 try{
  if(file.size>500000)throw Error('Backup is too large (maximum 500 KB UTF-8).');
  status('Reading and validating backup…');const raw=await file.text(),imported=format==='json'?decode(raw):parseCSV(raw);
  if(before!==revision||request!==importRequest)throw Error('Workspace changed while reading. Select the backup again.');
  if(!confirm('Replace current tab records with '+imported.length+' imported records (including any duplicate rows)? Unsaved form edits will be discarded. Saved device copy stays unchanged until Save.'))return;
  records=imported;clearEditor('all');render();status('Imported '+records.length+' validated records into this tab. Save on this device to persist.');
 }catch(err){status('Import rejected: '+err.message+' Existing records were preserved.');}
});
$('export').onclick=()=>{if(!records.length)return;const url=URL.createObjectURL(new Blob([csv(records)],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='sellerpilot-research-v4.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);status('CSV backup requested. This is not a marketplace upload template.');};render();
})();
