import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import pg from 'pg';
import { TEAM_WORKSPACE } from '../shared/team-workspace.mjs';

const repo = 'kisampurnaraga/renso';
const workflow = 'renso-agent.yml';
const cookieName = 'renso_owner';
const teams = TEAM_WORKSPACE.teams.map(team => team.id);
const idSchema = {type:'object',additionalProperties:false,required:['id'],properties:{id:{type:'string',format:'uuid'}}};
const fields = `id, team, title, instructions, status, created_at, updated_at, run_url, pr_url, error`;
const equal = (a,b) => { const x=Buffer.from(a), y=Buffer.from(b); return x.length===y.length && timingSafeEqual(x,y); };

export function createJobStore(url) {
  if(!url) return null;
  const pool=new pg.Pool({connectionString:url,max:2,connectionTimeoutMillis:5000,idleTimeoutMillis:10000});
  const one=async (query,values=[]) => (await pool.query(query,values)).rows[0] || null;
  return {
    list: async()=> (await pool.query(`SELECT ${fields} FROM agent_jobs ORDER BY created_at DESC LIMIT 100`)).rows,
    create: ({team,title,instructions})=>one(`INSERT INTO agent_jobs(team,title,instructions) VALUES($1,$2,$3) RETURNING ${fields}`,[team,title,instructions]),
    get: id=>one(`SELECT ${fields} FROM agent_jobs WHERE id=$1`,[id]),
    claim: id=>one(`UPDATE agent_jobs SET status='dispatching',error=NULL,updated_at=now() WHERE id=$1 AND status='queued' RETURNING ${fields}`,[id]),
    update: (id,patch)=>one(`UPDATE agent_jobs SET status=$2,run_url=$3,pr_url=$4,error=$5,updated_at=now() WHERE id=$1 RETURNING ${fields}`,[id,patch.status,patch.runUrl||null,patch.prUrl||null,patch.error||null]),
    close: ()=>pool.end(),
  };
}

export async function registerJobRoutes(app,env,dependencies={}) {
  const key=env.OWNER_ACCESS_KEY || '';
  const configured=key.length>=24 && key.length<=256;
  const store=dependencies.store || createJobStore(env.DATABASE_URL);
  const requestFetch=dependencies.fetch || fetch;
  const now=dependencies.now || Date.now;
  const signingKey=configured ? createHmac('sha256',key).update('renso-owner-session-v1').digest() : null;
  const sign=payload=>createHmac('sha256',signingKey).update(payload).digest('base64url');
  const authenticated=request=> {
    if(!configured) return false;
    const token=request.cookies[cookieName] || '';
    if(token.length>256) return false;
    const parts=token.split('.');
    if(parts.length!==3 || !/^\d+$/.test(parts[0]) || !/^[a-f0-9]{32}$/.test(parts[1])) return false;
    const expires=Number(parts[0]);
    return expires>now() && expires<=now()+8*3600_000 && equal(parts[2],sign(`${parts[0]}.${parts[1]}`));
  };
  const requireOwner=async(request,reply)=> {
    if(!configured) return reply.code(503).send({error:'Login pemilik belum diatur. Tambahkan OWNER_ACCESS_KEY minimal 24 karakter.'});
    if(!authenticated(request)) return reply.code(401).send({error:'Masuk sebagai pemilik untuk mengelola tugas.'});
  };
  const withStore=handler=>async(request,reply)=> {
    if(!store) return reply.code(503).send({error:'Database antrean belum terhubung.'});
    try {return await handler(request,reply);} catch {return reply.code(503).send({error:'Antrean belum tersedia. Periksa koneksi database dan migrasi agent_jobs.'});}
  };
  if(store) app.addHook('onClose',async()=>store.close?.());
  app.get('/api/owner-status',async request=>({authenticated:authenticated(request),configured,workerConfigured:!!env.GITHUB_DISPATCH_TOKEN,ownerConfigured:configured,databaseConfigured:!!store,dispatcherConfigured:!!env.GITHUB_DISPATCH_TOKEN}));
  app.post('/api/owner-login',{config:{rateLimit:{max:5,timeWindow:'1 minute'}},schema:{body:{type:'object',additionalProperties:false,required:['key'],properties:{key:{type:'string',maxLength:256,minLength:1}}}}},async(request,reply)=> {
    if(!configured) return reply.code(503).send({error:'Login pemilik belum diatur.'});
    if(!equal(request.body.key,key)) return reply.code(401).send({error:'Kunci pemilik tidak sesuai.'});
    const payload=`${now()+8*3600_000}.${randomBytes(16).toString('hex')}`;
    reply.setCookie(cookieName,`${payload}.${sign(payload)}`,{httpOnly:true,secure:env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:8*3600});
    return {ok:true};
  });
  app.post('/api/owner-logout',async(_request,reply)=>{reply.clearCookie(cookieName,{path:'/'});return {ok:true};});
  app.get('/api/jobs',{preHandler:requireOwner},withStore(async()=>({jobs:await store.list()})));
  app.post('/api/jobs',{preHandler:requireOwner,schema:{body:{type:'object',additionalProperties:false,required:['team','title','instructions'],properties:{team:{type:'string',enum:teams},title:{type:'string',minLength:1,maxLength:120},instructions:{type:'string',minLength:1,maxLength:4000}}}}},withStore(async(request,reply)=> {
    const {team,title,instructions}=request.body;
    if(!title.trim()||!instructions.trim()) return reply.code(400).send({error:'Tuliskan judul dan arahan tugas.'});
    return {job:await store.create({team,title:title.trim(),instructions:instructions.trim()})};
  }));
  async function github(path,options={}) {
    const response=await requestFetch(`https://api.github.com/repos/${repo}/${path}`,{...options,headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${env.GITHUB_DISPATCH_TOKEN}`,'X-GitHub-Api-Version':'2022-11-28',...options.headers},signal:AbortSignal.timeout(15000)});
    if(!response.ok) throw new Error('GitHub unavailable');
    return response.status===204 ? null : response.json();
  }
  app.post('/api/job-dispatch',{preHandler:requireOwner,schema:{body:idSchema}},withStore(async(request,reply)=> {
    if(!env.GITHUB_DISPATCH_TOKEN) return reply.code(503).send({error:'Eksekutor belum terhubung. Atur GITHUB_DISPATCH_TOKEN dan secret worker GitHub.'});
    const job=await store.claim(request.body.id);
    if(!job) return reply.code(409).send({error:'Tugas tidak ada atau sudah dikirim. Gunakan periksa status untuk menghindari eksekusi ganda.'});
    try {
      await github(`actions/workflows/${workflow}/dispatches`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ref:'main',inputs:{job_id:job.id,team:job.team,title:job.title,instructions:job.instructions}})});
      return {job:await store.update(job.id,{status:'dispatched'})};
    } catch {
      return reply.code(502).send({error:'Pengiriman belum terkonfirmasi. Periksa status; jangan mengirim ulang tugas yang sama.',job:await store.update(job.id,{status:'dispatch_failed',error:'Pengiriman belum terkonfirmasi. Periksa status GitHub sebelum membuat tugas baru.'})});
    }
  }));
  app.post('/api/job-sync',{preHandler:requireOwner,schema:{body:idSchema}},withStore(async(request,reply)=> {
    if(!env.GITHUB_DISPATCH_TOKEN) return reply.code(503).send({error:'Pemeriksaan worker belum terhubung.'});
    const job=await store.get(request.body.id);
    if(!job) return reply.code(404).send({error:'Tugas tidak ditemukan.'});
    if(job.status==='queued') return {job};
    try {
      const runs=await github(`actions/workflows/${workflow}/runs?event=workflow_dispatch&per_page=100`);
      const run=runs.workflow_runs?.find(item=>item.display_title===`renso-task-${job.id}`);
      if(!run) return {job};
      if(!/^https:\/\/github\.com\/kisampurnaraga\/renso\/actions\/runs\/\d+$/.test(run.html_url || '')) throw new Error('Invalid run URL');
      const runUrl=run.html_url;
      if(run.status!=='completed') return {job:await store.update(job.id,{status:run.status==='in_progress'?'running':'dispatched',runUrl})};
      if(run.conclusion!=='success') return {job:await store.update(job.id,{status:'failed',runUrl,error:'Worker berhenti tanpa hasil berhasil. Lihat log GitHub.'})};
      const prs=await github(`pulls?head=kisampurnaraga:renso-task/${job.id}&state=all&per_page=10`);
      const pr=prs.find(item=>item.head?.ref===`renso-task/${job.id}` && item.base?.ref==='main' && item.draft===true && item.state==='open' && /^https:\/\/github\.com\/kisampurnaraga\/renso\/pull\/\d+$/.test(item.html_url || ''));
      return {job:await store.update(job.id,pr ? {status:'review_ready',runUrl,prUrl:pr.html_url} : {status:'failed',runUrl,error:'Worker selesai, tetapi draft PR belum ditemukan. Periksa laporan worker.'})};
    } catch {return reply.code(502).send({error:'Status GitHub belum dapat diperiksa. Status tugas terakhir tetap tersimpan.'});}
  }));
}
