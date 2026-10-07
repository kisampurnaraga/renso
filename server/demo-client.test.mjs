import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoClient } from '../src/demo-client.mjs';
test('frontend preview clearly declares no database or live AI',async()=>{
  const api=createDemoClient(); const status=await api('/status');
  assert.equal(status.frontendDemo,true); assert.equal(status.database,'none'); assert.equal(status.ai,'demo'); assert.equal(status.voiceInput,false);
});
test('frontend demo sessions can start, respond, delete and restart',async()=>{
  const api=createDemoClient();const chat=()=>api('/chat',{body:JSON.stringify({agent:'teduh',mood:'blue',message:'Aku jenuh'})});
  await assert.rejects(chat()); await api('/session',{method:'POST'});
  assert.equal((await chat()).mode,'demo'); await api('/session',{method:'DELETE'}); await assert.rejects(chat());
  await api('/session',{method:'POST'}); assert.ok((await chat()).reply.length>20);
});
