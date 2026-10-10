const API = 'https://api.audius.co/v1';
export class MusicError extends Error {
  constructor(status, message, retryAfter) { super(message); this.status = status; this.retryAfter = retryAfter; }
}
export function normalizeTrack(track) {
  if (!track || !/^[a-zA-Z0-9]+$/.test(track.id || '') || !track.title || !track.user?.name || track.is_stream_gated || track.is_streamable !== true || track.is_available === false || track.is_delete || track.is_unlisted) return null;
  const path = track.permalink;
  if (typeof path !== 'string' || !/^\/[\w-]+\/[\w-]+$/.test(path)) return null;
  return { id: track.id, title: String(track.title).slice(0,200), artist: String(track.user.name).slice(0,120), duration: Number(track.duration) || 0, sourceUrl: `https://audius.co${path}`, license: typeof track.license === 'string' ? track.license.slice(0,160) : 'Lisensi mengikuti ketentuan Audius', streamUrl: `/api/music/stream/${track.id}` };
}
export function createMusicProvider(env = {}, fetcher = fetch) {
  const cache = new Map();
  async function request(path) {
    const url = new URL(`${API}${path}`); url.searchParams.set('app_name','Renso');
    if (env.AUDIUS_API_KEY) url.searchParams.set('api_key',env.AUDIUS_API_KEY);
    let response;
    try { response = await fetcher(url, { signal: AbortSignal.timeout(12000), redirect: 'manual' }); }
    catch { throw new MusicError(503,'Audius belum tersambung. Musik original tetap tersedia.'); }
    if (response.status === 429) throw new MusicError(429,'Audius sedang mencapai batas penggunaan. Coba lagi nanti.', /^\d{1,5}$/.test(response.headers.get('retry-after') || '') ? response.headers.get('retry-after') : '60');
    if (!response.ok) throw new MusicError(503,'Katalog Audius belum tersedia. Pilih musik original atau coba lagi.');
    try { return await response.json(); } catch { throw new MusicError(503,'Respons katalog musik belum valid.'); }
  }
  return {
    async search(query) {
      const key = query.trim().toLowerCase();
      const saved = cache.get(key); if (saved && saved.expires > Date.now()) return saved.tracks;
      const data = await request(`/tracks/search?query=${encodeURIComponent(query)}&limit=30`);
      if (!Array.isArray(data.data)) throw new MusicError(503,'Respons katalog musik belum valid.');
      const tracks = data.data.map(normalizeTrack).filter(Boolean).slice(0,12);
      if (cache.size >= 50) cache.delete(cache.keys().next().value);
      cache.set(key,{tracks,expires:Date.now()+60_000}); return tracks;
    },
    async stream(id) {
      const data = await request(`/tracks/${id}`);
      const track = data.data; if (!normalizeTrack(track)) throw new MusicError(404,'Lagu ini tidak tersedia untuk streaming publik.');
      const raw = track.stream?.url;
      let url; try { url = new URL(raw); } catch { throw new MusicError(503,'Tautan pemutaran belum tersedia. Coba lagu lain.'); }
      if (url.protocol !== 'https:' || url.username || url.password || !url.pathname.includes('/tracks/')) throw new MusicError(503,'Tautan pemutaran belum valid.');
      return url.href;
    }
  };
}
export async function registerMusicRoutes(app, env, fetcher) {
  const provider = createMusicProvider(env,fetcher);
  const handle = async (reply, action) => {
    try { return await action(); } catch (error) {
      if (error.retryAfter) reply.header('Retry-After',error.retryAfter);
      return reply.code(error instanceof MusicError ? error.status : 503).send({error:error instanceof MusicError ? error.message : 'Musik belum tersedia.'});
    }
  };
  app.get('/api/music/search',{config:{rateLimit:{max:12,timeWindow:'1 minute'}},schema:{querystring:{type:'object',additionalProperties:false,required:['q'],properties:{q:{type:'string',minLength:2,maxLength:80}}}}},async(request,reply)=>handle(reply,async()=>({tracks:await provider.search(request.query.q)})));
  app.get('/api/music/stream/:id',{config:{rateLimit:{max:20,timeWindow:'1 minute'}},schema:{params:{type:'object',properties:{id:{type:'string',pattern:'^[a-zA-Z0-9]{1,30}$'}},required:['id']}}},async(request,reply)=>handle(reply,async()=>reply.redirect(await provider.stream(request.params.id))));
}
