import { buildApp } from './app.mjs';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
try {
  const app = await buildApp();
  // Only the standalone entry point serves frontend files. The Vercel API's
  // module graph must never import the static plugin or its ESM dependencies.
  if(existsSync(resolve('dist/index.html'))) {
    const { default: fastifyStatic } = await import('@fastify/static');
    await app.register(fastifyStatic,{root:resolve('dist')});
    app.setNotFoundHandler((request,reply)=>request.url.startsWith('/api/')?reply.code(404).send({error:'Tidak ditemukan.'}):reply.sendFile('index.html'));
  }
  await app.listen({port:Number(process.env.PORT)||3001,host:process.env.HOST||'127.0.0.1'});
  console.log('Renso server ready');
}
catch { console.error('Renso startup failed. Check environment and database migrations.'); process.exit(1); }
