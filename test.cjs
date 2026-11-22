const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {buildDraft,toTXT,toCSV,csvCell}=require('./listing.js');
const base={market:'Amazon India',name:'Desk organiser',brand:'Sample',material:'Steel',colour:'Black',size:'10 cm',quantity:'2',features:'Three compartments\nFlat base',terms:'desk organiser,stationery holder,Stationery Holder',confirmed:true};
for(const market of ['Amazon India','Flipkart','Meesho'])test(`${market}: factual output and exports`,()=>{const d=buildDraft({...base,market});assert.equal(d.market,market);assert.ok(d.title.includes('Pack of 2'));assert.ok(d.description.includes('Three compartments'));assert.equal(d.keywords,'desk organiser, stationery holder');assert.ok(toTXT(d).includes('Flat base'));assert.ok(toCSV(d).startsWith('\ufeff"Marketplace"'));assert.ok(!toTXT(d).includes('waterproof'));if(market==='Amazon India')assert.equal(d.bullets.length,5);});
test('blank, invalid, oversized and unconfirmed data rejected',()=>{for(const input of [{name:' '},{confirmed:false},{quantity:'0'},{quantity:'1.2'},{quantity:'-1'},{quantity:'1e3'},{quantity:'10001'},{market:'Other'},{features:Array(11).fill('Feature').join('\n')},{name:'x'.repeat(121)},{brand:'a'.repeat(70),name:'b'.repeat(120)}])assert.throws(()=>buildDraft({...base,...input}));});
test('minimal facts do not invent attributes',()=>{const d=buildDraft({market:'Meesho',name:'Ring',confirmed:true});assert.equal(d.title,'Ring');assert.deepEqual(d.bullets,[]);assert.equal(d.description,'Ring');});
test('CSV preserves commas, quotes, Unicode and newlines, neutralizes formulas',()=>{assert.equal(csvCell('=1+1'),'"\'=1+1"');assert.equal(csvCell('  @SUM(A1)'),'"\'  @SUM(A1)"');assert.equal(csvCell('a,"b"\nc'),'"a,""b""\nc"');const d=buildDraft({...base,name:'Chai, "cup" ₹',features:'Line one\nLine two'});assert.ok(toCSV(d).includes('Chai, ""cup"" ₹'));assert.ok(toTXT(d).includes('₹'));});
function dom(){const nodes={};let downloads=[];class BlobMock{constructor(parts,options){this.parts=parts;this.options=options;downloads.push(this);}}const document={getElementById(id){if(!nodes[id])nodes[id]={value:'',textContent:'',innerHTML:'',checked:false,disabled:false,events:{},addEventListener(e,fn){this.events[e]=fn;}};return nodes[id];},createElement(){return {click(){},remove(){}};},body:{append(){}}};return {nodes,downloads,document,Blob:BlobMock,URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}},setTimeout:fn=>fn(),TextEncoder,console};}
function calculator(values={}){const ctx=dom();const html=fs.readFileSync(require.resolve('./index.html'),'utf8');for(const match of html.matchAll(/<input id="([^"]+)"[^>]*value="([^"]*)"/g))ctx.document.getElementById(match[1]).value=match[2];ctx.document.getElementById('market').value='Amazon India';for(const [key,value] of Object.entries(values))ctx.document.getElementById(key).value=String(value);vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('./calculator.js'),'utf8'),ctx);return {ctx,latest:()=>vm.runInContext('latest',ctx)};}
test('calculator baseline matches independently summed costs',()=>{const {latest}=calculator();assert.equal(latest().expenses,642);assert.equal(latest().profit,357);assert.equal(latest().totalProfit,3570);assert.equal(latest().breakEven,642);});
test('calculator tax and break-even solve the same profit equation',()=>{for(const rate of [0,5,18,100])for(const itc of [0,50,500,2000]){const {latest}=calculator({salesTax:rate,itc});const d=latest();const fixed=642;const tax=Math.max(0,d.breakEven*rate/(100+rate)-itc);assert.ok(Math.abs(d.breakEven-fixed-tax)<1e-8);assert.ok(d.breakEven>=fixed);}});
test('invalid calculator inputs clear results',()=>{for(const values of [{price:''},{price:-1},{units:1.5},{units:0},{feeTax:101},{returnRate:101},{salesTax:101},{cost:'Infinity'},{cost:1e13}]){const {ctx,latest}=calculator(values);assert.equal(latest(),null);assert.equal(ctx.nodes.profit.textContent,'—');}});
test('calculator CSV recomputes latest edited values',()=>{const {ctx,latest}=calculator();ctx.nodes.price.value='1200';ctx.nodes.csv.onclick();assert.equal(latest().profit,558);assert.ok(ctx.downloads[0].parts[0].includes('"profit","558"'));});
test('zero price and maximum return probability remain finite',()=>{const {latest}=calculator({price:0,returnRate:100});assert.equal(latest().margin,0);assert.equal(latest().profit,-737);});
test('listing form lifecycle prevents stale exports and renders HTML as text',()=>{const ctx=dom();vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('./listing.js'),'utf8'),ctx);for(const [key,value] of Object.entries(base))ctx.document.getElementById(key).value=String(value);ctx.nodes.confirmed.checked=true;ctx.nodes['listing-form'].events.submit({preventDefault(){}});assert.equal(ctx.nodes.csv.disabled,false);ctx.nodes.csv.onclick();assert.equal(ctx.downloads.length,1);ctx.nodes['listing-form'].events.input();assert.equal(ctx.nodes.csv.disabled,true);ctx.nodes.csv.onclick();assert.equal(ctx.downloads.length,1);ctx.nodes.name.value='<img src=x onerror=alert(1)>';ctx.nodes['listing-form'].events.submit({preventDefault(){}});assert.ok(ctx.nodes.result.textContent.includes('<img'));assert.equal(ctx.nodes.result.innerHTML,'');ctx.nodes['listing-form'].events.reset();assert.equal(ctx.nodes.txt.disabled,true);});
test('navigation and mobile layout rules are present',()=>{const html=fs.readFileSync(require.resolve('./listing.html'),'utf8');assert.match(html,/href="index.html"/);assert.match(html,/@media\(max-width:800px\)/);assert.match(html,/@media\(max-width:440px\)/);assert.match(fs.readFileSync(require.resolve('./index.html'),'utf8'),/href="listing.html"/);});

const research=require('./research.js');
const fee={type:'fee',market:'Amazon India',category:'Home',fulfilment:'Seller fulfilled',version:'review-1',effective:'2026-01-01',checked:'2026-01-02',price:'1000',percent:'15',fixed:'20',source:'https://example.com/fees',notes:''};
const competitor={type:'competitor',label:'Comparable pack',kind:'Observed',checked:'2026-01-02',price:'800',ownPrice:'1000',source:'https://example.com/product',notes:''};
test('fee records preserve provenance and calculate percentage plus fixed fee',()=>{const r=research.validateRecord(fee);assert.equal(research.feeEstimate(r),170);assert.equal(r.version,'review-1');assert.equal(r.effective,'2026-01-01');});
test('competitor comparison has correct direction and denominator',()=>{assert.deepEqual(research.comparison(research.validateRecord(competitor)),{difference:200,percent:25});assert.equal(research.comparison(research.validateRecord({...competitor,ownPrice:400})).percent,-50);});
test('research rejects unsafe URLs, invalid dates, missing fields and invalid money',()=>{for(const change of [{source:'javascript:alert(1)'},{source:'http://example.com'},{source:'https://user:secret@example.com'},{source:'bad'},{checked:'2026-02-30'},{checked:'9999-01-01'},{price:''},{price:0},{price:-1},{price:Infinity},{price:1e10},{price:null},{price:[]},{percent:101},{fixed:-1},{market:'bad'},{category:''},{version:'a'.repeat(41)},{notes:'x'.repeat(1001)}])assert.throws(()=>research.validateRecord({...fee,...change}));assert.throws(()=>research.validateRecord({...competitor,kind:'Verified automatically'}));});
test('saved copies are versioned, bounded and fully revalidated',()=>{const raw=JSON.stringify({version:4,records:[fee,competitor]});assert.equal(research.decode(raw).length,2);for(const raw of ['bad','{}',JSON.stringify({version:3,records:[]}),JSON.stringify({version:4,records:Array(101).fill(fee)}),JSON.stringify({version:4,records:[{...fee,source:'javascript:evil'}]}),'x'.repeat(500001)])assert.throws(()=>research.decode(raw));});
test('research CSV neutralizes formula injection without corrupting quotes',()=>{const r=research.validateRecord({...competitor,label:'=HYPERLINK("bad")',notes:' @SUM(1)'});const csv=research.csv([r]);assert.ok(csv.startsWith('\ufeff"type"'));assert.ok(csv.includes('"\'=HYPERLINK(""bad"")"'));assert.ok(csv.includes('"\'@SUM(1)"'));});
test('research strips unknown properties from saved data',()=>{const r=research.validateRecord({...fee,apiKey:'not-a-key',__test:'unknown'});assert.equal(r.apiKey,undefined);assert.equal(r.__test,undefined);});
test('release pages block inline scripts, objects, base changes and form submission',()=>{for(const name of ['index.html','listing.html','workspace.html','research.html']){const html=fs.readFileSync(name,'utf8');assert.match(html,/Content-Security-Policy/);assert.match(html,/object-src 'none'/);assert.match(html,/base-uri 'none'/);assert.match(html,/form-action 'none'/);assert.doesNotMatch(html,/<script>/);assert.doesNotMatch(html,/script-src[^;]*unsafe-inline/);}});

test('V5 JSON backup round-trip retains V4 schema and sanitizes extra properties',()=>{
  const records=[research.validateRecord(fee),research.validateRecord(competitor)];
  const exported=research.backup(records);
  assert.deepEqual(research.decode(exported),records);
  assert.equal(JSON.parse(exported).version,4);
  assert.equal(research.decode(research.backup([{...fee,unexpected:'discard'}]))[0].unexpected,undefined);
});
test('V5 JSON backup rejects invalid and oversized records',()=>{
  assert.throws(()=>research.backup(Array(101).fill(fee)));
  assert.throws(()=>research.backup([{...fee,source:'javascript:bad'}]));
  assert.throws(()=>research.backup('not records'));
});

test('research rejects control-only required text and oversized canonical URLs',()=>{
  assert.throws(()=>research.validateRecord({...fee,category:'\u0001'}));
  assert.throws(()=>research.validateRecord({...fee,source:'https://example.com/'+ '界'.repeat(200)}));
});
test('research JSON byte bounds match file limits and reject malformed envelopes',()=>{
  for(const raw of ['null','[]','{','x'.repeat(500001),JSON.stringify({version:4,records:[],padding:'界'.repeat(170000)})])assert.throws(()=>research.decode(raw));
  assert.deepEqual(research.decode(research.backup([])),[]);
});
test('research dates preserve early years and leap dates without a recent-year cutoff',()=>{
  assert.equal(research.validateRecord({...fee,checked:'0006-01-01',effective:'0004-02-29'}).checked,'0006-01-01');
  assert.throws(()=>research.validateRecord({...fee,checked:'2025-02-29'}));
});
function researchUI(){
 const nodes={},saved=new Map();let consent=true;
 const make=()=>({value:'',files:[],children:[],events:{},textContent:'',addEventListener(k,fn){this.events[k]=fn;},append(...items){this.children.push(...items);},replaceChildren(){this.children=[];},setAttribute(){},click(){},remove(){},reset(){},focus(){document.activeElement=this;}});
 const document={getElementById(id){return nodes[id]??=make();},createElement:make,body:make()};
 for(const type of ['fee','competitor']){const form=document.getElementById(type+'-form');form.fields={};form.elements={namedItem:name=>form.fields[name]??=make()};form.reset=()=>{for(const node of Object.values(form.fields))node.value='';};form.querySelector=()=>form.elements.namedItem(type==='fee'?'category':'label');}
 class FormDataMock{constructor(form){this.form=form;}[Symbol.iterator](){return Object.entries(this.form.fields).map(([k,n])=>[k,n.value])[Symbol.iterator]();}}
 const ctx={document,FormData:FormDataMock,window:{SellerPilotCSV:require('./csv-codec.js')},URL:class extends URL{static createObjectURL(){return 'blob:test';}static revokeObjectURL(){}},Blob:class{},TextEncoder,setTimeout:fn=>fn(),confirm:()=>consent,localStorage:{setItem(k,v){saved.set(k,v);},getItem:k=>saved.get(k)??null,removeItem:k=>saved.delete(k)}};
 vm.runInNewContext(fs.readFileSync('research.js','utf8'),ctx);
 return {nodes,saved,focused:()=>document.activeElement,setConsent:v=>consent=v,submit(type,input){const form=nodes[type+'-form'];for(const [k,v]of Object.entries(input))form.elements.namedItem(k).value=String(v);form.events.submit({preventDefault(){},currentTarget:form});},importCSV:text=>nodes['import-csv'].events.change({currentTarget:{files:[{size:100,text}],value:'backup.csv'}}),importFile:text=>nodes['import-json'].events.change({currentTarget:{files:[{size:100,text}],value:'backup.json'}})};
}
test('research import cancellation and malformed files preserve tab and saved records',async()=>{
 const ui=researchUI(),first=research.backup([fee]),second=research.backup([competitor]);
 await ui.importFile(async()=>first);ui.nodes.save.onclick();const saved=[...ui.saved.values()][0];
 ui.setConsent(false);await ui.importFile(async()=>second);assert.match(ui.nodes.records.children[0].children[0].textContent,/Amazon India/);
 assert.match(ui.nodes['workspace-status'].textContent,/Import cancelled/);
 ui.setConsent(true);await ui.importFile(async()=>'{');assert.match(ui.nodes['workspace-status'].textContent,/Import rejected/);
 assert.equal([...ui.saved.values()][0],saved);
 await ui.importFile(async()=>second);assert.equal(ui.nodes.records.children[0].children[0].textContent,competitor.label);assert.equal([...ui.saved.values()][0],saved);
});
test('research rejects stale async imports after clear or a newer selection',async()=>{
 const ui=researchUI();let finish;
 const pending=ui.importFile(()=>new Promise(resolve=>finish=resolve));ui.nodes.clear.onclick();finish(research.backup([fee]));await pending;
 assert.match(ui.nodes['workspace-status'].textContent,/Workspace changed/);assert.equal(ui.nodes.export.disabled,true);
 const old=ui.importFile(()=>new Promise(resolve=>finish=resolve));await ui.importFile(async()=>research.backup([competitor]));finish(research.backup([fee]));await old;
 assert.equal(ui.nodes.records.children[0].children[0].textContent,competitor.label);
});
test('Research CSV round trips both record types and reversible text while retaining legacy files',()=>{
 const rows=[research.validateRecord({...fee,notes:"'=SUM(1)"}),research.validateRecord({...competitor,label:"''original, \"quote\"",notes:'=1+1'})];
 assert.deepEqual(research.parseCSV(research.csv(rows)),rows);
 const legacy=research.csv([research.validateRecord(fee)]).replace(',"csv_encoding"','').replace(',"apostrophe-v1"','');assert.deepEqual(research.parseCSV(legacy),[research.validateRecord(fee)]);
 for(const text of ['','"unclosed','x'.repeat(500001),'界'.repeat(170000),research.csv(rows).replace('apostrophe-v1','bad'),research.csv(rows).replace('"Amazon India"','"=bad"'),research.csv(Array(101).fill(rows[0]))])assert.throws(()=>research.parseCSV(text));
});
test('Research CSV rejects malformed rows, formula prefixes, bad URLs and invalid numbers',()=>{
 const safe=research.csv([research.validateRecord(fee)]);
 for(const bad of [safe.replace('https://example.com/fees','javascript:alert(1)'),safe.replace('"Home"','"Home"junk'),safe.replace('"Home"','"\u0001=cmd"'),safe.replace('"1000"','"0x10"'),safe.replace('2026-01-02','2025-02-29')])assert.throws(()=>research.parseCSV(bad));
 for(const value of ['0x10','1e999','NaN','Infinity','-1',''])assert.throws(()=>research.validateRecord({...fee,price:value}));
});
test('Research edit and cancel preserve records; removing an earlier row keeps the correct edit target',()=>{
 const ui=researchUI();ui.submit('fee',fee);ui.submit('competitor',competitor);
 ui.nodes.records.children[1].children.at(-2).onclick();ui.nodes['competitor-form'].elements.namedItem('label').value='Unsaved';ui.nodes['competitor-cancel'].onclick();assert.equal(ui.nodes.records.children[1].children[0].textContent,competitor.label);
 assert.equal(ui.focused(),ui.nodes['competitor-submit']);
 ui.nodes.records.children[1].children.at(-2).onclick();ui.nodes.records.children[0].children.at(-1).onclick();ui.submit('competitor',{label:'Edited'});
 assert.equal(ui.nodes.records.children.length,1);assert.equal(ui.nodes.records.children[0].children[0].textContent,'Edited');
 ui.nodes.save.onclick();assert.equal(JSON.parse([...ui.saved.values()][0]).version,4);
});
test('Research can edit at capacity, rejects invalid edits and preserves duplicate imports',async()=>{
 const ui=researchUI();await ui.importFile(async()=>research.backup(Array(100).fill(research.validateRecord(fee))));
 ui.nodes.records.children[99].children.at(-2).onclick();ui.submit('fee',{category:'Changed'});assert.equal(ui.nodes.records.children.length,100);assert.match(ui.nodes.records.children[99].children[0].textContent,/Changed/);
 ui.nodes.records.children[99].children.at(-2).onclick();ui.submit('fee',{source:'javascript:bad'});assert.match(ui.nodes.records.children[99].children[0].textContent,/Changed/);
 ui.nodes['fee-cancel'].onclick();ui.submit('fee',fee);assert.match(ui.nodes['workspace-status'].textContent,/100 records/);
 await ui.importCSV(async()=>research.csv([research.validateRecord(competitor),research.validateRecord(competitor)]));assert.equal(ui.nodes.records.children.length,2);assert.equal(ui.nodes['record-count'].textContent,'2/100 records');
});
test('Research CSV import is atomic, cancellable, and cannot replace newer records after a slow read',async()=>{
 const ui=researchUI();ui.submit('fee',fee);ui.nodes.save.onclick();const saved=[...ui.saved.values()][0];
 ui.setConsent(false);await ui.importCSV(async()=>research.csv([research.validateRecord(competitor)]));assert.match(ui.nodes.records.children[0].children[0].textContent,/Amazon India/);
 ui.setConsent(true);await ui.importCSV(async()=>research.csv([research.validateRecord(competitor)]).replace('Observed','Unknown'));assert.match(ui.nodes.records.children[0].children[0].textContent,/Amazon India/);assert.equal([...ui.saved.values()][0],saved);
 let finish;const pending=ui.importCSV(()=>new Promise(resolve=>finish=resolve));ui.submit('competitor',competitor);finish(research.csv([research.validateRecord(fee)]));await pending;assert.equal(ui.nodes.records.children.length,2);assert.match(ui.nodes['workspace-status'].textContent,/Workspace changed/);
});
test('research editing one form leaves the other unsaved draft intact',()=>{
 const ui=researchUI();ui.nodes['competitor-form'].elements.namedItem('label').value='Separate draft';ui.submit('fee',fee);assert.equal(ui.nodes['competitor-form'].elements.namedItem('label').value,'Separate draft');
});
test('Research CSV preserves small finite numeric values serialized in exponent notation',()=>{
 const row=research.validateRecord({...fee,fixed:0.0000001,percent:0.0000001});assert.deepEqual(research.parseCSV(research.csv([row])),[row]);assert.equal(research.validateRecord({...fee,price:'1e3'}).price,1000);
});
