import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request as httpRequest } from 'node:http';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('API boots with require(ESM) disabled even when frontend dist exists', () => {
  const directory = mkdtempSync(join(tmpdir(), 'renso-api-'));
  try {
    mkdirSync(join(directory, 'dist'));
    writeFileSync(join(directory, 'dist/index.html'), '<html>frontend</html>');
    const moduleUrl = new URL('./app.mjs', import.meta.url).href;
    const script = `
      const { buildApp } = await import(${JSON.stringify(moduleUrl)});
      const app = await buildApp({serveStatic:false,env:{APP_ORIGIN:'http://localhost:5173'}});
      const response = await app.inject({method:'GET',url:'/api/status'});
      if(response.statusCode !== 200) throw new Error('API startup failed');
      const frontend = await app.inject({method:'GET',url:'/'});
      if(frontend.statusCode !== 404) throw new Error('API must not serve frontend files');
      await app.close();
    `;
    execFileSync(process.execPath, ['--no-experimental-require-module', '--input-type=module', '-e', script], {cwd:directory,stdio:'pipe'});
  } finally { rmSync(directory, {recursive:true,force:true}); }
});

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = httpRequest(url, {method:options.method || 'GET',headers:options.headers}, res => {
      const chunks=[]; res.on('data',chunk=>chunks.push(chunk)); res.on('end',()=>{
        const body=Buffer.concat(chunks).toString();
        resolve({status:res.statusCode,headers:{get:name=>Array.isArray(res.headers[name])?res.headers[name][0]:res.headers[name]},json:async()=>JSON.parse(body),text:async()=>body});
      });
    });
    req.on('error',reject); req.end(options.body);
  });
}

test('Vercel adapter preserves JSON bodies, cookies and origin checks', async t => {
  const originalEnv = process.env;
  process.env = { NODE_ENV:'development', AI_PROVIDER:'groq', APP_ORIGIN:'http://localhost:5173' };
  t.after(() => { process.env = originalEnv; });
  const { default: handler } = await import('../api/[...path].js');
  const server = createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const status = await request(`${base}/api/status`);
  assert.equal(status.status, 200);
  assert.equal((await status.json()).ai, 'demo');
  const session = await request(`${base}/api/session`, {method:'POST',headers:{origin:'http://localhost:5173'}});
  assert.equal(session.status, 200);
  const cookie = session.headers.get('set-cookie').split(';')[0];
  const body = JSON.stringify({agent:'spark',mood:'red',message:'Aku lagi desain'});
  const headers = {origin:'http://localhost:5173',cookie,'Content-Type':'application/json'};
  const chat = await request(`${base}/api/chat`, {method:'POST',headers,body});
  assert.equal(chat.status, 200);
  assert.equal((await chat.json()).mode, 'demo');
  const invalid = await request(`${base}/api/chat`, {method:'POST',headers,body:'{"agent":'});
  assert.equal(invalid.status, 400);
  const denied = await request(`${base}/api/chat`, {method:'POST',headers:{...headers,origin:'https://other.example'},body});
  assert.equal(denied.status, 403);
});

test('Vercel adapter fails closed without production database and does not leak config', async t => {
  const originalEnv = process.env;
  process.env = { NODE_ENV:'production',APP_ORIGIN:'https://renso.example',AI_PROVIDER:'groq' };
  t.after(() => { process.env = originalEnv; });
  const { default: handler } = await import('../api/[...path].js?production-test');
  const server = createServer(handler);
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const response = await request(`http://127.0.0.1:${server.address().port}/api/status`);
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.doesNotMatch(await response.text(), /DATABASE_URL|GROQ_API_KEY|stack|postgres/i);
});
