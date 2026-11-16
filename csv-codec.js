/* Local-only CSV codec. No evaluation, network access or storage. */
(function(root){
'use strict';
const dangerous=/^[\s\u0000-\u001f]*[=+@-]/;
function cell(value){let s=String(value??'');if(s.startsWith("'")||dangerous.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
function restore(value,encoded){if(dangerous.test(value))throw Error('CSV formula rejected. Use an original SellerPilot backup.');return value.startsWith("'")&&(dangerous.test(value.slice(1))||(encoded&&value[1]==="'"))?value.slice(1):value;}
function parse(input,maxBytes=500000,maxRecords=100){
 if(typeof input!=='string'||new TextEncoder().encode(input).length>maxBytes)throw Error('CSV file is too large or unreadable.');
 const source=input.replace(/^\ufeff/,'');const rows=[];let row=[],field='',quoted=false,closed=false,ended=false;
 const finish=()=>{row.push(field);rows.push(row);if(rows.length>maxRecords+1)throw Error('CSV exceeds the record limit.');row=[];field='';closed=false;ended=true;};
 for(let i=0;i<source.length;i++){
  const c=source[i];
  if(quoted){if(c==='"'){if(source[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=c;ended=false;continue;}
  if(c===','){row.push(field);field='';closed=false;ended=false;if(row.length>32)throw Error('Too many CSV columns.');continue;}
  if(c==='\n'||(c==='\r'&&source[i+1]==='\n')){finish();if(c==='\r')i++;continue;}
  if(closed)throw Error('Malformed CSV: unexpected content after quoted field.');
  if(c==='"'){if(field.length)throw Error('Malformed CSV quote.');quoted=true;ended=false;continue;}
  if(c==='\r')throw Error('Malformed CSV line ending.');field+=c;ended=false;
 }
 if(quoted)throw Error('Malformed CSV: unclosed quoted field.');
 if(row.length||field.length||closed||!ended)finish();
 return rows;
}
const api={cell,restore,parse};if(typeof module!=='undefined')module.exports=api;else root.SellerPilotCSV=api;
})(typeof window!=='undefined'?window:this);
