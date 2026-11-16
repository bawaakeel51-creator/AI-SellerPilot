const {test}=require('node:test');const assert=require('node:assert/strict');const {record,csv,decode,parseCSV}=require('./workspace.js');
const base={type:'fee',market:'Amazon India',label:'Desk organisers',amount:'150.00',source:'https://sell.amazon.in/fees-and-pricing',checked:'2026-01-01',effective:'2026-01-01',fulfilment:'Easy Ship',notes:'Example only; unverified'};
test('fee evidence retains source, effective date and explicit manual basis',()=>{const r=record(base);assert.equal(r.amount,150);assert.equal(r.effective,'2026-01-01');assert.equal(r.version,1);assert.match(r.basis,/not automatically verified/);});
test('competitor estimates are explicitly labelled without inferred metrics',()=>{const r=record({...base,type:'competitor',basis:'Estimated'});assert.equal(r.basis,'Estimated');assert.equal(r.fulfilment,undefined);assert.equal(r.sales,undefined);});
test('reject executable and credential-bearing source URLs',()=>{for(const source of ['javascript:alert(1)','data:text/html,x','http://example.com','https://user:secret@example.com','no url'])assert.throws(()=>record({...base,source}));});
test('reject malformed dates, future observations and malformed money',()=>{for(const change of [{checked:'2026-02-30'},{checked:'2099-01-01'},{effective:'x'},{amount:''},{amount:'Infinity'},{amount:'-5'},{amount:'1.001'},{amount:'1e5'},{amount:'1000000001'},{market:'unknown'},{fulfilment:''},{label:''},{notes:'a'.repeat(1001)}])assert.throws(()=>record({...base,...change}));});
test('CSV neutralizes formulas and preserves quotes and multiline evidence',()=>{const data=csv([record({...base,label:'=1+1',notes:'Hello, "world"\nNext'})]);assert.ok(data.includes('"\'=1+1"'));assert.ok(data.includes('Hello, ""world""\nNext'));assert.ok(data.startsWith('\ufeff'));});
test('CSV backup imports validated fee and competitor rows including quoted multiline values',()=>{const rows=[record(base),record({...base,type:'competitor',basis:'Estimated',label:'Desk, "organiser"',notes:'First line\nSecond line'})];const imported=parseCSV(csv(rows));assert.equal(imported.length,2);assert.equal(imported[0].basis,'Seller-entered fee; not automatically verified');assert.equal(imported[0].effective,base.effective);assert.equal(imported[1].basis,'Estimated');assert.equal(imported[1].label,'Desk, "organiser"');assert.equal(imported[1].notes,'First line\nSecond line');});
test('CSV backup safely round-trips formula-prefixed evidence',()=>{const original=record({...base,label:'=1+1'});assert.equal(parseCSV(csv([original]))[0].label,original.label);});
test('CSV import rejects malformed structure, unsupported rows and formula-like cells',()=>{for(const data of ['','wrong,header\n1,2','"unclosed','a,b,c','version,type,market,label,amount,source,checked,effective,fulfilment,basis,notes\n1,fee'])assert.throws(()=>parseCSV(data));const safe=csv([record(base)]);for(const label of ['=1+1','  +SUM(A1:A2)','\t@cmd'])assert.throws(()=>parseCSV(safe.replace('"Desk organisers"',`"${label}"`)));});
test('CSV import enforces schema version, record count and file size',()=>{const header='version,type,market,label,amount,source,checked,effective,fulfilment,basis,notes';assert.throws(()=>parseCSV(`${header}\n2,fee,Amazon India,Desk,150,https://example.com,2026-01-01,2026-01-01,Easy Ship,Seller-entered fee; not automatically verified,`));assert.throws(()=>parseCSV('x'.repeat(1000001)));assert.throws(()=>parseCSV(csv(Array(101).fill(record(base)))));});
test('saved records require schema, size and source validation',()=>{assert.equal(decode(JSON.stringify({version:1,records:[record(base)]})).length,1);for(const d of [{version:2,records:[]},{version:1,records:Array(101).fill(base)},{version:1,records:[{...base,source:'javascript:x'}]}])assert.throws(()=>decode(JSON.stringify(d)));});

test('CSV round trips literal apostrophes, control-prefixed formulas, Unicode and multiline notes',()=>{
 for(const value of ["'=1+1","''literal","'ordinary",'\u0001=1+1','\u0000@cmd','सोर्स, "test"\r\nnext']){
  const original=record({...base,label:value.slice(0,120),notes:value});assert.deepEqual(parseCSV(csv([original])),[original]);
 }
});
test('evidence CSV rejects UTF-8 byte overflow and unsafe structural/source/date data',()=>{
 assert.throws(()=>parseCSV('界'.repeat(340000)));
 const safe=csv([record(base)]);
 for(const bad of [safe.replace('https://sell.amazon.in/fees-and-pricing','javascript:alert(1)'),safe.replace('2026-01-01','2025-02-29'),safe.replace('"150"','"-10"'),safe.replace('"Desk organisers"','"Desk"junk'),safe.replace('"1"','"2"')])assert.throws(()=>parseCSV(bad));
 assert.equal(record({...base,checked:'0006-01-01',effective:'0004-02-29'}).checked,'0006-01-01');
 assert.throws(()=>record({...base,source:'https://example.com/'+'界'.repeat(300)}));
});
function evidenceUI(initial=[],storageFails=false){
 const fs=require('node:fs'),vm=require('node:vm'),nodes={},saved=new Map();let consent=true;
 if(initial.length)saved.set('sellerpilot-evidence-v1',JSON.stringify({version:1,records:initial}));
 const make=()=>({value:'',children:[],checked:false,textContent:'',hidden:false,append(...items){this.children.push(...items);},replaceChildren(){this.children=[];},setAttribute(){},focus(){},click(){},remove(){}});
 const document={getElementById(id){return nodes[id]??=make();},createElement:make,body:make()};
 const form=document.getElementById('record-form');form.reset=()=>{form.onreset?.();for(const k of ['label','amount','source','checked','effective','fulfilment','notes'])document.getElementById(k).value='';document.getElementById('type').value='fee';document.getElementById('market').value='Amazon India';document.getElementById('basis').value='Observed';};form.reset();
 const localStorage={getItem:k=>saved.get(k)??null,setItem(k,v){if(storageFails)throw Error('full');saved.set(k,v);},removeItem(k){if(storageFails)throw Error('blocked');saved.delete(k);}};
 vm.runInNewContext(fs.readFileSync('workspace.js','utf8'),{document,URL:class extends URL{static createObjectURL(){return 'blob:test';}static revokeObjectURL(){}},Blob:class{},TextEncoder,localStorage,confirm:()=>consent,setTimeout:fn=>fn()});
 const fill=input=>{for(const [k,v]of Object.entries(input))if(nodes[k])nodes[k].value=String(v);};
 return {nodes,saved,fill,setConsent:v=>consent=v,submit(){form.onsubmit({preventDefault(){}});},edit(i){nodes.records.children[i].children[4].onclick();},remove(i){nodes.records.children[i].children[5].onclick();},importFile:text=>nodes['import-file'].onchange({target:{files:[{size:100,text}],value:'backup.csv'}})};
}
test('evidence editing, cancellation and removal preserve selected record and saved schema',()=>{
 const ui=evidenceUI([record(base),record({...base,label:'Second'})]);ui.edit(1);ui.nodes.label.value='Unsaved';ui.nodes['cancel-edit'].onclick();assert.match(ui.nodes.records.children[1].children[0].textContent,/Second/);
 ui.edit(1);ui.remove(0);ui.nodes.label.value='Updated';ui.submit();assert.equal(ui.nodes.records.children.length,1);assert.match(ui.nodes.records.children[0].children[0].textContent,/Updated/);
 const saved=JSON.parse(ui.saved.get('sellerpilot-evidence-v1'));assert.equal(saved.version,1);assert.equal(saved.records[0].label,'Updated');assert.equal(ui.nodes['cancel-edit'].hidden,true);
 ui.edit(0);assert.equal(ui.nodes.basis.value,'Observed');ui.nodes.type.value='competitor';ui.submit();assert.match(ui.nodes.records.children[0].children[1].textContent,/Observed/);
 ui.edit(0);ui.setConsent(false);ui.nodes.delete.onclick();assert.equal(ui.nodes.records.children.length,1);
 ui.setConsent(true);ui.remove(0);assert.equal(ui.nodes.records.children.length,0);assert.equal(ui.nodes['cancel-edit'].hidden,true);
});
test('evidence can edit at 100-record limit and rejects invalid edits without mutation',()=>{
 const ui=evidenceUI(Array.from({length:100},(_,i)=>record({...base,label:'Row '+i})));
 ui.edit(99);ui.nodes.label.value='Changed';ui.submit();assert.equal(ui.nodes.records.children.length,100);assert.match(ui.nodes.records.children[99].children[0].textContent,/Changed/);
 ui.edit(99);ui.nodes.source.value='javascript:bad';ui.submit();assert.match(ui.nodes.records.children[99].children[0].textContent,/Changed/);assert.equal(ui.nodes['cancel-edit'].hidden,false);
 ui.nodes['cancel-edit'].onclick();ui.fill(base);ui.submit();assert.match(ui.nodes.status.textContent,/100-record limit/);
});
test('evidence imports validate all rows atomically and reject stale reads after deletion',async()=>{
 const ui=evidenceUI([record(base)]),before=ui.saved.get('sellerpilot-evidence-v1');
 await ui.importFile(async()=>csv([record({...base,label:'Good'}),record({...base,label:'Bad'})]).replace('"Bad"','"=bad"'));
 assert.equal(ui.nodes.records.children.length,1);assert.equal(ui.saved.get('sellerpilot-evidence-v1'),before);
 let finish;const pending=ui.importFile(()=>new Promise(resolve=>finish=resolve));ui.nodes.delete.onclick();finish(csv([record(base)]));await pending;
 assert.equal(ui.nodes.records.children.length,0);assert.match(ui.nodes.status.textContent,/Workspace changed/);assert.equal(ui.saved.has('sellerpilot-evidence-v1'),false);
 await ui.importFile(async()=>csv([record(base)]));assert.equal(ui.nodes.records.children.length,1);
});
test('storage failures retain evidence in memory and expose a backup warning',()=>{
 const ui=evidenceUI([],true);ui.nodes.remember.checked=true;ui.fill(base);ui.submit();assert.equal(ui.nodes.records.children.length,1);assert.match(ui.nodes.status.textContent,/storage failed/);
 ui.nodes.delete.onclick();assert.equal(ui.nodes.records.children.length,1);assert.match(ui.nodes.status.textContent,/Deletion failed/);
});
test('legacy CSV remains readable without stripping literal double apostrophes',()=>{
 const legacy=csv([record({...base,label:"''literal"})]).replace(',"csv_encoding"','').replace(',"apostrophe-v1"','').replace("'''literal","''literal");
 assert.equal(parseCSV(legacy)[0].label,"''literal");
 assert.throws(()=>parseCSV(csv([record(base)]).replace('apostrophe-v1','unknown')));
});
