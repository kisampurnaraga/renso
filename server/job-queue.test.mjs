import test from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { registerJobRoutes } from './job-queue.mjs';

const id='d4c080af-0ebf-43ad-8ccf-769179c497f1';
const ownerKey='a-test-owner-key-with-at-least-24-characters';
async function setup(t,{env={},fetch,now,broken=false}={}) {
  const jobs=new Map();
  const store={
    list:async()=>{if(broken)throw new Error('secret-db-url');return [...jobs.values()];},
    create:async data=>{const job={id,...data,status:'queued'};jobs.set(id,job);return job;},
    get:async key=>jobs.get(key),
    claim:async key=>{const job=jobs.get(key);if(job?.status!=='queued')return null;job.status='dispatching';return job;},
    update:async(key,patch)=>{const job=jobs.get(key);Object.assign(job,patch);return job;},
    close:async()=>{},
  };
  const app=Fastify();await app.register(cookie);await app.register(rateLimit,{max:100,timeWindow:'1 minute'});
  app.addHook('preHandler',async(request,reply)=>{if(request.method==='POST'&&request.headers.origin!=='https://renso.test')return reply.code(403).send({error:'Origin rejected'});});
  await registerJobRoutes(app,{OWNER_ACCESS_KEY:ownerKey,GITHUB_DISPATCH_TOKEN:'private-token',...env},{store,fetch,now});
  await app.ready();t.after(()=>app.close());
  const login=await app.inject({method:'POST',url:'/api/owner-login',headers:{origin:'https://renso.test'},payload:{key:ownerKey}});
  const authCookie=login.headers['set-cookie']?.split(';')[0];
  const call=(url,payload,extra={})=>app.inject({method:payload?'POST':'GET',url,headers:{origin:'https://renso.test',cookie:authCookie,...extra},payload});
  return {app,call,jobs,authCookie,login};
}
test('owner cookie protects durable queue and rejects tampering and wrong origin',async t=>{
  const {app,call,authCookie}=await setup(t);
  assert.equal((await app.inject('/api/jobs')).statusCode,401);
  assert.equal((await call('/api/jobs',undefined,{cookie:authCookie+'x'})).statusCode,401);
  assert.equal((await call('/api/jobs',{team:'backend',title:'Fix',instructions:'Implement tests'},{origin:'https://evil.test'})).statusCode,403);
  assert.equal((await call('/api/jobs',{team:'backend',title:'Fix',instructions:'Implement tests'})).json().job.status,'queued');
  assert.equal((await call('/api/jobs')).json().jobs.length,1);
  await call('/api/owner-logout',{});
});
test('owner configuration, invalid key and expired session do not authorize jobs',async t=>{
  let timestamp=100000;
  const {app,call}=await setup(t,{now:()=>timestamp});
  const wrong=await app.inject({method:'POST',url:'/api/owner-login',headers:{origin:'https://renso.test'},payload:{key:'wrong'}});
  assert.equal(wrong.statusCode,401);
  timestamp+=8*3600_000+1;
  assert.equal((await call('/api/jobs')).statusCode,401);
  const disabled=await setup(t,{env:{OWNER_ACCESS_KEY:'short'}});
  assert.equal((await disabled.app.inject('/api/owner-status')).json().configured,false);
  assert.equal((await disabled.app.inject('/api/jobs')).statusCode,503);
  const oversized=await setup(t,{env:{OWNER_ACCESS_KEY:'x'.repeat(257)}});
  assert.equal((await oversized.app.inject('/api/owner-status')).json().configured,false);
});
test('dispatch fixed workflow atomically once and synchronizes actual run and PR',async t=>{
  let calls=0,stage='dispatch';
  const {call}=await setup(t,{fetch:async(url,options)=>{
    calls++;
    assert.ok(url.startsWith('https://api.github.com/repos/kisampurnaraga/renso/'));
    if(options.method==='POST'){
      assert.ok(url.endsWith('renso-agent.yml/dispatches'));
      assert.equal(JSON.parse(options.body).inputs.job_id,id);
      return {ok:true,status:204};
    }
    if(url.includes('/runs?'))return {ok:true,status:200,json:async()=>({workflow_runs:[{display_title:`renso-task-${id}`,status:stage==='running'?'in_progress':'completed',conclusion:'success',html_url:'https://github.com/kisampurnaraga/renso/actions/runs/1'}]})};
    return {ok:true,status:200,json:async()=>[{head:{ref:`renso-task/${id}`},base:{ref:'main'},draft:true,state:'open',html_url:'https://github.com/kisampurnaraga/renso/pull/1'}]};
  }});
  await call('/api/jobs',{team:'backend',title:'Fix',instructions:'Implement tests'});
  assert.equal((await call('/api/job-dispatch',{id})).json().job.status,'dispatched');
  assert.equal((await call('/api/job-dispatch',{id})).statusCode,409);
  assert.equal(calls,1);
  stage='running';assert.equal((await call('/api/job-sync',{id})).json().job.status,'running');
  stage='done';assert.equal((await call('/api/job-sync',{id})).json().job.status,'review_ready');
});
test('uncertain dispatch failures cannot be dispatched twice and secrets stay private',async t=>{
  const {call}=await setup(t,{fetch:async()=>{throw new Error('private-token');}});
  await call('/api/jobs',{team:'audio',title:'Music',instructions:'Separate music from work'});
  const failure=await call('/api/job-dispatch',{id});
  assert.equal(failure.statusCode,502);assert.equal(failure.json().job.status,'dispatch_failed');assert.ok(!failure.body.includes('private-token'));
  assert.equal((await call('/api/job-dispatch',{id})).statusCode,409);
});
test('queue migration failures remain sanitized and missing dispatch setup preserves queued job',async t=>{
  const broken=await setup(t,{broken:true});
  const response=await broken.call('/api/jobs');assert.equal(response.statusCode,503);assert.ok(!response.body.includes('secret-db-url'));
  const missing=await setup(t,{env:{GITHUB_DISPATCH_TOKEN:''}});
  await missing.call('/api/jobs',{team:'qa',title:'Checks',instructions:'Test all changes'});
  assert.equal((await missing.call('/api/job-dispatch',{id})).statusCode,503);
  assert.equal(missing.jobs.get(id).status,'queued');
});
test('invalid roles and blank instructions never create executable jobs',async t=>{
  const {call,jobs}=await setup(t);
  assert.equal((await call('/api/jobs',{team:'admin',title:'Bad',instructions:'Bad'})).statusCode,400);
  assert.equal((await call('/api/jobs',{team:'qa',title:' ',instructions:' '})).statusCode,400);
  assert.equal(jobs.size,0);
});
test('missing queue migration never prevents guest app startup or chat',async t=>{
  const {buildApp}=await import('./app.mjs');
  const origin='http://localhost:5173';
  const app=await buildApp({env:{OWNER_ACCESS_KEY:ownerKey,APP_ORIGIN:origin},jobs:{store:{list:async()=>{throw new Error('relation agent_jobs missing');},close:async()=>{}}}});
  t.after(()=>app.close());
  const login=await app.inject({method:'POST',url:'/api/owner-login',headers:{origin},payload:{key:ownerKey}});
  const ownerCookie=login.headers['set-cookie'].split(';')[0];
  assert.equal((await app.inject({url:'/api/jobs',headers:{cookie:ownerCookie}})).statusCode,503);
  assert.equal((await app.inject('/api/status')).statusCode,200);
  const session=await app.inject({method:'POST',url:'/api/session',headers:{origin}});
  const guestCookie=session.headers['set-cookie'].split(';')[0];
  const response=await app.inject({method:'POST',url:'/api/chat',headers:{origin,cookie:guestCookie},payload:{agent:'teduh',mood:'blue',message:'Halo'}});
  assert.equal(response.statusCode,200);
});
test('sync refuses untrusted proof URLs and closed PRs',async t=>{
  let badUrl=true;
  const {call,jobs}=await setup(t,{fetch:async url=>({ok:true,status:200,json:async()=>url.includes('/runs?')?{workflow_runs:[{display_title:`renso-task-${id}`,status:'completed',conclusion:'success',html_url:badUrl?'https://evil.test/steal':'https://github.com/kisampurnaraga/renso/actions/runs/1'}]}:[{head:{ref:`renso-task/${id}`},base:{ref:'main'},draft:true,state:'closed',html_url:'https://github.com/kisampurnaraga/renso/pull/1'}]})});
  await call('/api/jobs',{team:'qa',title:'Checks',instructions:'Test all changes'});
  jobs.get(id).status='dispatched';
  assert.equal((await call('/api/job-sync',{id})).statusCode,502);
  assert.equal(jobs.get(id).status,'dispatched');
  badUrl=false;
  assert.equal((await call('/api/job-sync',{id})).json().job.status,'failed');
});
