import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomBytes, createHash } from 'node:crypto';
import { agents, moods, systemPrompt, demoReply } from './agents.mjs';
import { createStore } from './store.mjs';
import { providerConfig, createProvider, ProviderError } from './provider.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');
export async function buildApp(options = {}) {
  const env = options.env || process.env;
  const production = env.NODE_ENV === 'production';
  if(production && !env.APP_ORIGIN?.startsWith('https://')) throw new Error('Production requires HTTPS APP_ORIGIN');
  if(production && !env.DATABASE_URL) throw new Error('Production requires DATABASE_URL and migrated schema');
  const app = Fastify({ logger: false, bodyLimit: 6 * 1024 * 1024 });
  const store = options.store || createStore(env.DATABASE_URL);
  const providerSettings = providerConfig(env);
  const provider = createProvider(providerSettings, options.providerFetch || fetch);
  const live = providerSettings.live;
  const quota = Math.max(1, Math.min(100, Number(env.DAILY_CHAT_LIMIT) || 20));
  await app.register(cookie);
  await app.register(rateLimit, { max: 60, timeWindow: '1 minute' });
  await store.ready();
  const cleanupTimer = setInterval(() => store.cleanup().catch(() => {}), 3600_000); cleanupTimer.unref();
  app.addHook('onClose', async () => { clearInterval(cleanupTimer); await store.close(); });
  app.addHook('onSend', async (request, reply) => {
    reply.header('X-Content-Type-Options','nosniff').header('Referrer-Policy','same-origin').header('Permissions-Policy','camera=(self), microphone=(self)');
    if(request.url.startsWith('/api')) reply.header('Cache-Control','no-store');
  });
  app.addHook('preHandler', async (request, reply) => {
    if(request.url.startsWith('/api') && ['POST','PUT','DELETE','PATCH'].includes(request.method) && request.headers.origin !== (env.APP_ORIGIN || 'http://localhost:5173')) return reply.code(403).send({error:'Permintaan berasal dari alamat yang tidak diizinkan.'});
  });
  async function requireSession(request, reply) {
    const token = request.cookies.renso_session;
    const id = token && /^[a-f0-9]{64}$/.test(token) ? await store.findSession(hash(token)) : null;
    if(!id) { reply.code(401).send({ error: 'Sesi berakhir. Mulai sesi baru.' }); return null; }
    return id;
  }
  app.get('/api/status', async () => ({ ai: live ? 'live' : 'demo', provider: providerSettings.name, database: store.persistent ? 'postgresql' : 'temporary', voiceInput: providerSettings.voiceInput, agents: Object.values(agents).map(({instruction,...agent})=>agent) }));
  app.post('/api/session', async (request, reply) => {
    const previous = request.cookies.renso_session;
    if(previous && /^[a-f0-9]{64}$/.test(previous) && await store.findSession(hash(previous))) return { ok: true };
    const token = randomBytes(32).toString('hex'); await store.createSession(hash(token));
    reply.setCookie('renso_session',token,{ httpOnly: true, secure: production, sameSite:'strict', path:'/', maxAge:86400 });
    return { ok: true };
  });
  app.delete('/api/session', async (request, reply) => {
    const id = await requireSession(request,reply); if(!id) return;
    await store.deleteSession(id); reply.clearCookie('renso_session',{path:'/'}); return { ok: true };
  });
  app.post('/api/chat', { schema: { body: { type:'object', additionalProperties:false, required:['agent','mood','message'], properties: {
    agent:{type:'string',enum:Object.keys(agents)}, mood:{type:'string',enum:moods}, message:{type:'string',minLength:1,maxLength:2000},
    history:{type:'array',maxItems:6,items:{type:'object',additionalProperties:false,required:['role','content'],properties:{role:{type:'string',enum:['user','assistant']},content:{type:'string',minLength:1,maxLength:2000}}}}
  } } } }, async (request,reply) => {
    const id = await requireSession(request,reply); if(!id) return;
    if(!request.body.message.trim()) return reply.code(400).send({error:'Tuliskan pesan terlebih dahulu.'});
    if(!await store.reserve(id,quota)) return reply.code(429).send({error:'Batas sesi hari ini tercapai. Kamu bisa kembali besok.'});
    const {agent,mood,message,history=[]} = request.body;
    if(!live) return { reply:demoReply(agent,mood,message), mode:'demo' };
    try {
      const text = await provider.chat([{role:'system',content:systemPrompt(agent,mood)},...history,{role:'user',content:message}]);
      return { reply: text, mode:'live' };
    } catch(error) { await store.refund(id); return reply.code(error instanceof ProviderError && error.status === 429 ? 429 : 503).send({error:error instanceof ProviderError && error.status === 429 ? 'Layanan AI sedang mencapai batas penggunaan. Coba lagi sebentar.' : 'Teman Renso belum bisa menjawab. Coba lagi sebentar.'}); }
  });
  app.addContentTypeParser(['audio/webm','audio/ogg','audio/mp4'],{parseAs:'buffer'},(_request,body,done)=>done(null,body));
  app.post('/api/transcribe', { config:{ rateLimit:{max:6,timeWindow:'1 minute'} } }, async(request,reply)=>{
    const id = await requireSession(request,reply); if(!id) return;
    if(!providerSettings.voiceInput) return reply.code(503).send({error:'Input suara tersedia setelah layanan transkripsi terhubung.'});
    if(!Buffer.isBuffer(request.body) || request.body.length < 100 || !/^audio\/(webm|ogg|mp4)/.test(request.headers['content-type'] || '')) return reply.code(400).send({error:'Format rekaman tidak didukung.'});
    if(!await store.reserve(id,quota)) return reply.code(429).send({error:'Batas penggunaan hari ini tercapai.'});
    try {
      const type = request.headers['content-type'].split(';')[0];
      return {text:await provider.transcribe(request.body,type)};
    } catch(error) {await store.refund(id); return reply.code(error instanceof ProviderError && error.status === 429 ? 429 : 503).send({error:error instanceof ProviderError && error.status === 429 ? 'Layanan suara sedang mencapai batas penggunaan. Coba ketik pesanmu.' : 'Rekaman belum bisa diproses. Coba ketik pesanmu.'});}
  });
  app.setErrorHandler((error,_request,reply)=>{ reply.code(error.statusCode && error.statusCode < 500 ? error.statusCode : 500).send({error:error.validation?'Periksa isi pesanmu.':error.statusCode===429?'Terlalu banyak permintaan. Tunggu sebentar.':'Permintaan belum bisa diproses.'}); });
  if(existsSync(resolve('dist/index.html'))) {
    await app.register(fastifyStatic,{root:resolve('dist')});
    app.setNotFoundHandler((request,reply)=>request.url.startsWith('/api/')?reply.code(404).send({error:'Tidak ditemukan.'}):reply.sendFile('index.html'));
  }
  return app;
}
