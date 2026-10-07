import { demoReply } from '../shared/demo.mjs';
export function createDemoClient() {
  let active = false;
  return async function demoApi(path, options = {}) {
    if (path === '/status') return { ai:'demo', database:'none', voiceInput:false, frontendDemo:true };
    if (path === '/session' && options.method === 'POST') { active = true; return {ok:true}; }
    if (path === '/session' && options.method === 'DELETE') { active = false; return {ok:true}; }
    if (path === '/chat') {
      if (!active) throw new Error('Sesi berakhir. Mulai sesi baru.');
      const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
      if (!['teduh','spark'].includes(body.agent) || !['blue','green','red'].includes(body.mood) || typeof body.message !== 'string' || !body.message.trim() || body.message.length>2000) throw new Error('Periksa isi pesanmu.');
      return {reply:demoReply(body.agent,body.mood,body.message),mode:'demo'};
    }
    throw new Error('Fitur ini belum tersedia di preview frontend.');
  };
}
