import test from 'node:test';
import assert from 'node:assert/strict';
import { handleGoogleAuth, googleSession, checkCsrf } from './google-session.mjs';
import worker from './worker.mjs';
const origin='https://ai-sellerpilot-v4-api.bawaakeel51.workers.dev';
const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk={...await crypto.subtle.exportKey('jwk',pair.publicKey),kid:'session-test',use:'sig',alg:'RS256'};
const env={AUTH_MODE:'google',GOOGLE_CLIENT_ID:'session-client',GOOGLE_ALLOWED_EMAILS:'owner@example.com',ALLOWED_ORIGIN:origin,AI_ENABLED:'false',AI_RATE_LIMITER:{limit:async()=>({success:true})}};
const encoder=new TextEncoder();
async function token(nonce,overrides={}){
 const now=Math.floor(Date.now()/1000), head=Buffer.from(JSON.stringify({alg:'RS256',kid:jwk.kid})).toString('base64url');
 const body=Buffer.from(JSON.stringify({iss:'https://accounts.google.com',aud:env.GOOGLE_CLIENT_ID,sub:'1234567890',iat:now,exp:now+3600,email:'owner@example.com',email_verified:true,nonce,...overrides})).toString('base64url');
 const sig=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,encoder.encode(head+'.'+body));return head+'.'+body+'.'+Buffer.from(sig).toString('base64url');
}
function req(path,{method='GET',body,headers={}}={}){return new Request(origin+path,{method,headers:{...(method==='POST'?{origin,'content-type':'application/json','cf-connecting-ip':'192.0.2.1'}:{}),...headers},...(method==='POST'?{body:typeof body==='string'?body:JSON.stringify(body??{})}:{})});}
async function config(){const res=await handleGoogleAuth(req('/auth/config'),env);return {body:await res.json(),cookie:res.headers.getSetCookie()[0].split(';')[0]};}
const originalFetch=globalThis.fetch;
globalThis.fetch=async url=>{assert.equal(String(url),'https://www.googleapis.com/oauth2/v3/certs');return Response.json({keys:[jwk]},{headers:{'cache-control':'max-age=60'}});};
test.after(()=>{globalThis.fetch=originalFetch;});
async function login(overrides={},options={}){const c=await config();return handleGoogleAuth(req('/auth/login',{method:'POST',body:{credential:await token(c.body.nonce,overrides)},headers:{cookie:c.cookie,'x-csrf-token':c.body.nonce,...options}}),env);}
test('configuration fails closed and does not grant cross-origin CORS',async()=>{
 assert.equal((await handleGoogleAuth(req('/auth/config'),{})).status,503);
 const r=await handleGoogleAuth(req('/auth/config',{headers:{'sec-fetch-site':'cross-site'}}),env);assert.equal(r.status,403);assert.equal(r.headers.get('access-control-allow-origin'),null);
});
test('login nonce is random and cookies have strict host security attributes',async()=>{
 const a=await config(),b=await config();assert.match(a.body.nonce,/^[a-f0-9]{64}$/);assert.notEqual(a.body.nonce,b.body.nonce);
 const res=await handleGoogleAuth(req('/auth/config'),env);assert.match(res.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Strict/);assert.equal(res.headers.get('cache-control'),'no-store');
});
test('valid login creates a server-verified HttpOnly session and logout clears it',async()=>{
 const res=await login();assert.equal(res.status,200);const cookies=res.headers.getSetCookie();assert.equal(cookies.length,3);
 const cookie=cookies.filter(c=>!c.startsWith('__Host-sp_nonce=')).map(c=>c.split(';')[0]).join('; ');
 for(const c of cookies)assert.match(c,/Path=\/; Max-Age=\d+; HttpOnly; Secure; SameSite=Strict/);
 assert.equal(await googleSession(req('/studio/',{headers:{cookie}}),env),'google:1234567890');
 const status=await handleGoogleAuth(req('/auth/session',{headers:{cookie}}),env),body=await status.json();assert.equal(body.authenticated,true);assert.equal(body.aiEnabled,false);
 assert.equal(checkCsrf(req('/x',{headers:{cookie,'x-csrf-token':body.csrf}})),true);
 const out=await handleGoogleAuth(req('/auth/logout',{method:'POST',headers:{cookie,'x-csrf-token':body.csrf}}),env);assert.equal(out.status,200);for(const c of out.headers.getSetCookie())assert.match(c,/Max-Age=0/);
});
test('rejects cross-origin login, missing CSRF and token nonce mismatch',async()=>{
 assert.equal((await login({}, {origin:'https://evil.example'})).status,403);
 assert.equal((await login({}, {'x-csrf-token':'wrong'})).status,403);
 assert.equal((await login({nonce:'wrong'})).status,401);
 assert.equal((await handleGoogleAuth(req('/auth/login',{method:'POST',body:{credential:await token('x')}}),env)).status,403);
});
test('rejects unapproved or unverified accounts and forged/expired session cookies',async()=>{
 assert.equal((await login({email:'other@example.com'})).status,401);assert.equal((await login({email_verified:false})).status,401);
 for(const cookie of ['__Host-sp_session=forged','__Host-sp_session='+await token('x',{exp:1}),''])await assert.rejects(googleSession(req('/studio/',{headers:{cookie}}),env));
});
test('login rate limiter, malformed inputs, duplicate cookies and size limits fail closed',async()=>{
 const c=await config(),headers={cookie:c.cookie,'x-csrf-token':c.body.nonce};
 assert.equal((await handleGoogleAuth(req('/auth/login',{method:'POST',headers}),{...env,AI_RATE_LIMITER:{limit:async()=>({success:false})}})).status,429);
 assert.equal((await handleGoogleAuth(req('/auth/login',{method:'POST',headers}),{...env,AI_RATE_LIMITER:null})).status,503);
 assert.equal((await handleGoogleAuth(req('/auth/login',{method:'POST',headers,body:'bad'}),env)).status,400);
 assert.equal((await handleGoogleAuth(req('/auth/login',{method:'POST',headers,body:'x'.repeat(10001)}),env)).status,413);
 assert.equal((await handleGoogleAuth(req('/auth/login',{method:'POST',headers:{...headers,cookie:c.cookie+'; '+c.cookie},body:{credential:await token(c.body.nonce)}}),env)).status,403);
 assert.equal((await handleGoogleAuth(req('/auth/logout',{method:'POST'}),env)).status,403);
});
test('private assets redirect without Google session and AI remains disabled without provider calls',async()=>{
 const e={...env,ASSETS:{fetch:async()=>new Response('private')}};
 const denied=await worker.fetch(req('/studio/'),e);assert.equal(denied.status,302);assert.equal(denied.headers.get('location'),'/login.html');
 const publicLogin=await worker.fetch(req('/login.html'),e);assert.equal(await publicLogin.text(),'private');
 const disabled=await worker.fetch(req('/v1/listings/generate',{method:'POST'}),e);assert.equal(disabled.status,503);assert.equal((await disabled.json()).error,'ai_disabled');
});

test('Google API identity and CSRF are verified before quota or provider calls',async()=>{
 const res=await login();const cookie=res.headers.getSetCookie().filter(c=>!c.startsWith('__Host-sp_nonce=')).map(c=>c.split(';')[0]).join('; ');
 const session=await (await handleGoogleAuth(req('/auth/session',{headers:{cookie}}),env)).json();
 let reservations=0,providers=0;const previous=globalThis.fetch;
 globalThis.fetch=async url=>{
  if(String(url).startsWith('https://www.googleapis.com'))return Response.json({keys:[jwk]});
  assert.match(String(url),/^https:\/\/generativelanguage.googleapis.com\//);providers++;
  return Response.json({candidates:[{content:{parts:[{text:JSON.stringify({title:'Steel ring',description:'Steel ring',bullets:['Steel'],claims:[]})}]}}]});
 };
 try{
  const e={...env,AI_ENABLED:'true',GEMINI_MODEL:'gemini-test-model',GEMINI_API_KEY:'FAKE-test-key',QUOTA_GATE:{idFromName:()=> 'global',get:()=>({fetch:async(url,init)=>{const body=JSON.parse(init.body);assert.equal(body.user,'google:1234567890');reservations++;return Response.json({reserved:true});}})}};
  const body={marketplace:'amazon_in',facts:{name:'Steel ring',material:'Steel'}};
  const headers={cookie,'x-csrf-token':session.csrf};
  assert.equal((await worker.fetch(req('/v1/listings/generate',{method:'POST',body,headers:{...headers,origin:'https://evil.example'}}),e)).status,403);
  assert.equal((await worker.fetch(req('/v1/listings/generate',{method:'POST',body,headers:{...headers,'x-csrf-token':'bad'}}),e)).status,403);
  assert.equal(reservations,0);assert.equal(providers,0);
  const good=await worker.fetch(req('/v1/listings/generate',{method:'POST',body,headers}),e);assert.equal(good.status,200);assert.equal((await good.json()).reviewRequired,true);assert.equal(reservations,1);assert.equal(providers,1);
  assert.equal((await worker.fetch(req('/v1/listings/generate',{method:'POST',body:{...body,userId:'admin'},headers}),e)).status,400);assert.equal(reservations,1);
 }finally{globalThis.fetch=previous;}
});
