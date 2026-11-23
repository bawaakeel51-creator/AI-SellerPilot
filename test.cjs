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
test('structured listing preview renders product facts as text and clears on edits',()=>{
 const ctx=dom();
 const list=ctx.document.getElementById('draft-bullets');
 list.children=[];
 list.replaceChildren=function(){this.children=[];};
 list.append=function(item){this.children.push(item);};
 vm.runInNewContext(fs.readFileSync('listing.js','utf8'),ctx);
 const input={market:'Amazon India',name:'<img src=x>',category:'Home & Kitchen',quantity:'2',confirmed:true};
 for(const [id,value] of Object.entries(input)) ctx.document.getElementById(id).value=String(value);
 ctx.nodes.confirmed.checked=true;
 ctx.nodes['listing-form'].events.submit({preventDefault(){}});
 assert.equal(ctx.nodes['draft-preview'].hidden,false);
 assert.equal(ctx.nodes['draft-placeholder'].hidden,true);
 assert.equal(ctx.nodes['draft-title'].textContent,'<img src=x> | Pack of 2');
 assert.equal(ctx.nodes['draft-title'].innerHTML,'');
 assert.equal(list.children[0].textContent,'Pack quantity: 2');
 assert.equal(ctx.nodes['draft-category'].textContent,'Home & Kitchen');
 ctx.nodes['listing-form'].events.input();
 assert.equal(ctx.nodes['draft-preview'].hidden,true);
 assert.equal(ctx.nodes['draft-placeholder'].hidden,false);
 assert.equal(ctx.nodes.csv.disabled,true);
 assert.deepEqual(list.children,[]);
});
test('dashboard preserves Listing Studio controls and links to existing tools',()=>{
 const html=fs.readFileSync('listing.html','utf8');
 for(const page of ['index.html','workspace.html','research.html']) assert.ok(html.includes('href="'+page+'"'));
 assert.match(html,/aria-controls="tool-nav"/);
 assert.match(html,/href="#listing-generator"/);
 assert.match(html,/Public Gemini AI is OFF/);
 assert.match(html,/No performance data yet/);
 for(const id of ['listing-form','market','name','brand','category','material','colour','size','quantity','features','terms','confirmed','status','guidance','result','counts','txt','csv','ai']) {
  assert.equal(html.split('id="'+id+'"').length,2,id);
 }
 assert.match(html,/id="txt"[^>]*disabled/);
 assert.match(html,/id="csv"[^>]*disabled/);
 assert.match(html,/href="listing-dashboard.css"/);
 assert.match(html,/<script src="listing-dashboard.js"><\/script>/);
 assert.match(fs.readFileSync('index.html','utf8'),/href="listing.html"/);
});

test('dashboard menu and tool search keep keyboard and disclosure state in sync',()=>{
 const nodes=new Map();
 let focused, collapsed;
 const links=['Dashboard','Profit Calculator','Evidence Workspace'].map(textContent=>({
  textContent, cloneNode(){return {textContent,removeAttribute(){},focus(){focused=this;}};}
 }));
 const lookup=id=>{
  if (!nodes.has(id)) nodes.set(id,{
   attributes:new Map(), events:{}, children:[], value:'', hidden:true,
   addEventListener(type,handler){this.events[type]=handler;},
   setAttribute(name,value){this.attributes.set(name,value);},
   getAttribute(name){return this.attributes.get(name);},
   append(...children){this.children.push(...children);},
   replaceChildren(){this.children=[];},
   focus(){focused=this;},
   classList:{toggle(name,value){if(name==='nav-collapsed')collapsed=value;}},
   querySelectorAll(){return links;},
   querySelector(){return this.children[0]?.children[0];}
  });
  return nodes.get(id);
 };
 const document={getElementById:lookup,createElement:()=>({children:[],append(item){this.children.push(item);}})};
 vm.runInNewContext(fs.readFileSync('listing-dashboard.js','utf8'),{document,window:{matchMedia:()=>({matches:true})}});
 const toggle=lookup('menu-toggle'), nav=lookup('tool-nav'), query=lookup('tool-query'), results=lookup('tool-results'), search=lookup('tool-search');
 assert.equal(toggle.getAttribute('aria-expanded'),'false');
 assert.equal(collapsed,true);
 toggle.events.click();
 assert.equal(toggle.getAttribute('aria-expanded'),'true');
 assert.equal(collapsed,false);
 nav.events.keydown({key:'Escape'});
 assert.equal(collapsed,true);
 assert.equal(focused,toggle);
 query.value='  CALCULATOR profit ';
 query.events.input();
 assert.equal(results.hidden,false);
 assert.equal(lookup('search-links').querySelector().textContent,'Profit Calculator');
 search.events.keydown({key:'Enter',target:query});
 assert.equal(focused.textContent,'Profit Calculator');
 search.events.keydown({key:'Escape',preventDefault(){}});
 assert.equal(results.hidden,true);
 assert.equal(focused,query);
});

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
