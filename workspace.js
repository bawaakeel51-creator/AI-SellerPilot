/* Versioned, manual evidence records. No requests, tracking or AI calls. */
(function(){
'use strict';
const markets=['Amazon India','Flipkart','Meesho','Shopify / Own Store','Other'];
const key='sellerpilot-evidence-v1';
const columns=['version','type','market','label','amount','source','checked','effective','fulfilment','basis','notes'];
function text(value,max,label){const s=String(value??'').trim();if(!s||s.length>max)throw Error(`${label}: enter 1–${max} characters.`);return s;}
function date(value,label){const s=String(value||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s)throw Error(`${label}: enter a valid date.`);return s;}
function url(value){const s=text(value,2000,'Source URL');let u;try{u=new URL(s);}catch{throw Error('Enter a full HTTPS source URL.');}if(u.protocol!=='https:'||u.username||u.password)throw Error('Use HTTPS without embedded credentials.');if(u.href.length>2000)throw Error('Source URL is too long after URL encoding.');return u.href;}
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
function csv(rows){const cell=v=>'"'+(/^(?:'|[\s\u0000-\u001f]*[=+@-])/.test(String(v))?"'":'')+String(v??'').replaceAll('"','""')+'"';return '\ufeff'+[[...columns,'csv_encoding'],...rows.map(r=>[...columns.map(k=>r[k]),'apostrophe-v1'])].map(r=>r.map(cell).join(',')).join('\r\n');}
function parseCSV(input){
 if(typeof input!=='string'||new TextEncoder().encode(input).length>1000000)throw Error('CSV file is too large or unreadable (maximum 1 MB).');
 const source=input.replace(/^\ufeff/,'');const rows=[];let row=[],field='',quoted=false,afterQuote=false,lastWasNewline=false;
 for(let i=0;i<source.length;i++){
  const c=source[i];
  if(quoted){if(c==='"'){if(source[i+1]==='"'){field+='"';i++;}else{quoted=false;afterQuote=true;}}else field+=c;lastWasNewline=false;continue;}
  if(afterQuote){if(c===','){row.push(field);field='';afterQuote=false;lastWasNewline=false;continue;}if(c==='\n'||(c==='\r'&&source[i+1]==='\n')){row.push(field);rows.push(row);if(rows.length>101)throw Error('CSV backup exceeds the 100-record limit.');row=[];field='';afterQuote=false;if(c==='\r')i++;lastWasNewline=true;continue;}throw Error('Malformed CSV: unexpected content after a quoted field.');}
  if(c==='"'){if(field.length)throw Error('Malformed CSV: quotes must start a field.');quoted=true;lastWasNewline=false;continue;}
  if(c===','){row.push(field);field='';lastWasNewline=false;continue;}
  if(c==='\n'||(c==='\r'&&source[i+1]==='\n')){row.push(field);rows.push(row);if(rows.length>101)throw Error('CSV backup exceeds the 100-record limit.');row=[];field='';if(c==='\r')i++;lastWasNewline=true;continue;}
  if(c==='\r')throw Error('Malformed CSV: use LF or CRLF line endings.');
  field+=c;lastWasNewline=false;
 }
 if(quoted)throw Error('Malformed CSV: unclosed quoted field.');
 if(row.length||field.length||afterQuote||!lastWasNewline){row.push(field);rows.push(row);}
 const encoded=rows[0]?.length===columns.length+1&&rows[0][columns.length]==='csv_encoding';
 if(!rows.length||(!encoded&&rows[0].length!==columns.length)||columns.some((name,i)=>rows[0][i]!==name))throw Error('Unsupported CSV columns. Select a SellerPilot evidence backup.');
 if(rows.length<2)throw Error('CSV backup contains no records.');
 if(rows.length-1>100)throw Error('CSV backup exceeds the 100-record limit.');
 return rows.slice(1).map((cells,i)=>{
  if(cells.length!==columns.length+(encoded?1:0))throw Error(`Malformed CSV: record ${i+1} has the wrong number of columns.`);
  for(const value of cells)if(/^[\s\u0000-\u001f]*[=+@-]/.test(value))throw Error(`CSV formula rejected in record ${i+1}. Exported spreadsheet formulas are not accepted.`);
  if(encoded&&cells[columns.length]!=='apostrophe-v1')throw Error(`Unsupported CSV text encoding in row ${i+1}.`);
  const restored=cells.slice(0,columns.length).map(value=>value.startsWith("'")&&(encoded?/^(?:'|[\s\u0000-\u001f]*[=+@-])/:/^[\s\u0000-\u001f]*[=+@-]/).test(value.slice(1))?value.slice(1):value);
  const [version,type,market,label,amount,sourceUrl,checked,effective,fulfilment,basis,notes]=restored;
  if(version!=='1')throw Error(`Unsupported record version in row ${i+1}.`);
  if(type==='fee'&&basis!=='Seller-entered fee; not automatically verified')throw Error(`Malformed fee basis in row ${i+1}.`);
  if(type==='competitor'&&(effective!==''||fulfilment!==''))throw Error(`Malformed competitor record in row ${i+1}.`);
  return record({type,market,label,amount,source:sourceUrl,checked,effective,fulfilment,basis,notes});
 });
}
function decode(raw){const d=JSON.parse(raw);if(d.version!==1||!Array.isArray(d.records)||d.records.length>100)throw Error('Unsupported saved records.');return d.records.map(r=>record(r));}
if(typeof module!=='undefined')module.exports={record,csv,decode,parseCSV};
if(typeof document==='undefined')return;
const $=id=>document.getElementById(id);let records=[],editingIndex=null,revision=0,importRequest=0;
function status(s){$('status').textContent=s;}
function persist(){if(!$('remember').checked)return;try{localStorage.setItem(key,JSON.stringify({version:1,records}));}catch{status('Browser storage failed. Records remain here; export before closing.');}}
function render(){revision++;const list=$('records');list.replaceChildren();$('count').textContent=`${records.length}/100 records`;records.forEach((r,i)=>{const item=document.createElement('article');item.className='record';const h=document.createElement('h3');h.textContent=`${r.type==='fee'?'Fee':'Competitor'} · ${r.label} · ₹${r.amount.toFixed(2)}`;const p=document.createElement('p');p.textContent=`${r.market} · ${r.basis} · Checked ${r.checked}`+(r.effective?` · Effective ${r.effective} · ${r.fulfilment}`:'');const notes=document.createElement('p');notes.textContent=r.notes;const a=document.createElement('a');a.href=r.source;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Open source ↗';const edit=document.createElement('button');edit.type='button';edit.className='secondary';edit.textContent='Edit record';edit.setAttribute('aria-label',`Edit ${r.label} record ${i+1}`);edit.onclick=()=>editRecord(i);const remove=document.createElement('button');remove.type='button';remove.className='secondary';remove.textContent='Remove record';remove.setAttribute('aria-label',`Remove ${r.label} record ${i+1}`);remove.onclick=()=>{if(!confirm('Remove this record? Export a backup first if needed.'))return;if(editingIndex===i)clearEditor();else if(editingIndex!==null&&i<editingIndex)editingIndex--;records.splice(i,1);render();status('Record removed.');persist();};item.append(h,p,notes,a,edit,remove);list.append(item);});$('export').disabled=!records.length;}
function fields(){const fee=$('type').value==='fee';$('fee-fields').hidden=!fee;$('basis-label').hidden=fee;}
function editRecord(index){const r=records[index];editingIndex=index;for(const k of ['type','market','label','amount','source','checked','effective','fulfilment','basis','notes'])$(k).value=k==='basis'&&r.type==='fee'?'Observed':r[k]??'';$('submit-record').textContent='Save changes';$('cancel-edit').hidden=false;fields();$('label').focus();}
function clearEditor(){editingIndex=null;$('record-form').reset();$('submit-record').textContent='Add record';$('cancel-edit').hidden=true;fields();}
try{const saved=localStorage.getItem(key);if(saved){records=decode(saved);$('remember').checked=true;status('Saved records restored on this browser.');}}catch{status('Saved records could not be loaded. Use Delete saved data to remove them.');}
$('type').onchange=fields;
$('record-form').onsubmit=e=>{e.preventDefault();try{if(editingIndex===null&&records.length>=100)throw Error('100-record limit reached. Export and remove old records.');const wasEditing=editingIndex!==null;const input=Object.fromEntries(['type','market','label','amount','source','checked','effective','fulfilment','basis','notes'].map(k=>[k,$(k).value]));const updated=record(input);if(wasEditing)records[editingIndex]=updated;else records.push(updated);clearEditor();render();status(wasEditing?'Record updated. Review the source before pricing.':'Record added. Review the source before pricing.');persist();}catch(e){status(e.message);}};
$('record-form').onreset=()=>{editingIndex=null;$('submit-record').textContent='Add record';$('cancel-edit').hidden=true;setTimeout(fields,0);};
$('cancel-edit').onclick=clearEditor;
$('remember').onchange=()=>{if($('remember').checked){status('Saving enabled on this browser. Avoid shared devices.');persist();}else{try{localStorage.removeItem(key);status('Saved copy removed. Current records remain until reload.');}catch{status('Could not remove saved copy. Clear this site’s browser data.');}}};
$('delete').onclick=()=>{if(!confirm('Delete all tab and saved evidence records? Export a backup first if needed.'))return;try{localStorage.removeItem(key);records=[];$('remember').checked=false;clearEditor();render();status('All workspace records deleted from this browser.');}catch{status('Deletion failed. Clear this site’s browser data.');}};
$('export').onclick=()=>{if(!records.length)return;const u=URL.createObjectURL(new Blob([csv(records)],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=u;a.download='sellerpilot-evidence.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);status('CSV backup download started.');};
$('import-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;const before=revision,request=++importRequest;try{if(file.size>1000000)throw Error('CSV file is too large (maximum 1 MB).');const imported=parseCSV(await file.text());if(before!==revision||request!==importRequest)throw Error('Workspace changed while reading. Select the backup again.');if(records.length+imported.length>100)throw Error('Import would exceed the 100-record limit. No records were added.');records.push(...imported);render();status(`Imported ${imported.length} validated record${imported.length===1?'':'s'}.`);persist();}catch(error){status(error.message||'CSV import failed. Current records were preserved.');}finally{e.target.value='';}};
fields();render();
})();
