import { useEffect, useState } from 'react';
import { TEAM_WORKSPACE, type Localized, type WorkspaceTask } from './team-workspace-data';
import './team-workspace.css';

type Language = 'id' | 'en';
type Health = {ai:string;provider?:string;database:string;voiceInput:boolean};
const copy = {
  id: {back:'Kembali ke Renso',eyebrow:'RUANG KERJA RENSO',title:'Tim kecil. Hasil yang bisa dilihat.',intro:'Pantau hasil pekerjaan, bukti pengujian, dan prioritas berikutnya.',language:'Bahasa',snapshot:'Catatan pekerjaan',snapshotNote:'Status tugas diperbarui melalui perubahan kode oleh koordinator. Ini bukan pantauan agent yang sedang berjalan secara langsung.',updated:'Diperbarui',done:'Selesai',queued:'Antrean',validation:'Perlu validasi',all:'Semua',teams:'Tim & tanggung jawab',tasks:'Papan pekerjaan',search:'Cari tugas atau tim',empty:'Tidak ada tugas yang cocok.',onDemand:'Bekerja saat ditugaskan',planned:'Peran direncanakan',evidence:'Lihat bukti',health:'Kesehatan layanan aplikasi',healthNote:'Diperiksa setiap 60 detik saat halaman terbuka. Status konfigurasi AI bukan bukti setiap permintaan berhasil.',checking:'Memeriksa…',unavailable:'Belum bisa diperiksa',refresh:'Periksa lagi',checked:'Terakhir diperiksa',ai:'Mode AI',db:'Database',voice:'Input suara',active:'Tersedia',inactive:'Belum aktif',public:'Halaman ini publik. Tidak menampilkan API key, data pengguna, atau isi percakapan.',operations:'Cara tim bekerja',operationsNote:'Agent menjalankan tugas yang diberikan koordinator, kemudian menyerahkan hasil untuk diperiksa. Belum ada pekerja AI yang berjalan 24 jam, pembaruan otomatis tugas, atau pengiriman perintah dari halaman ini.',roadmap:'Bahasa berikutnya',roadmapNote:'Ruang tim tersedia dalam Indonesia dan Inggris. Antarmuka utama, persona AI, dan audio belum sepenuhnya diterjemahkan; tercatat dalam antrean.'},
  en: {back:'Back to Renso',eyebrow:'RENSO WORKSPACE',title:'A small team. Visible results.',intro:'Track delivered work, validation evidence, and next priorities.',language:'Language',snapshot:'Work record',snapshotNote:'Task statuses are updated by the coordinator through code changes. This is not live telemetry of running agents.',updated:'Updated',done:'Done',queued:'Queued',validation:'Needs validation',all:'All',teams:'Teams & responsibilities',tasks:'Task board',search:'Search tasks or teams',empty:'No matching tasks.',onDemand:'Works when assigned',planned:'Planned role',evidence:'View evidence',health:'Application service health',healthNote:'Checked every 60 seconds while this page is open. AI configuration does not prove every request succeeds.',checking:'Checking…',unavailable:'Unable to check',refresh:'Check again',checked:'Last checked',ai:'AI mode',db:'Database',voice:'Voice input',active:'Available',inactive:'Not enabled',public:'This page is public. It contains no API keys, user data, or conversation content.',operations:'How the team works',operationsNote:'Agents execute tasks assigned by the coordinator and submit their results for review. There are no AI workers running 24/7, automatic task updates, or task dispatch controls on this page yet.',roadmap:'Next languages',roadmapNote:'The team workspace supports Indonesian and English. The main app, AI personas, and audio are not fully translated yet; this is on the task board.'},
};

export default function TeamWorkspace() {
  const [language,setLanguage] = useState<Language>(()=>{try{return localStorage.getItem('renso:v1:team-language')==='en'?'en':'id';}catch{return 'id';}});
  const [filter,setFilter] = useState<'all'|WorkspaceTask['status']>('all');
  const [team,setTeam] = useState('all');
  const [query,setQuery] = useState('');
  const [health,setHealth] = useState<Health|null>(null);
  const [checking,setChecking] = useState(true);
  const [checkedAt,setCheckedAt] = useState<string|null>(null);
  const [refresh,setRefresh] = useState(0);
  const t = copy[language];
  const local = (value:Localized)=>value[language];
  const date = (value:string)=>new Intl.DateTimeFormat(language==='id'?'id-ID':'en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Jakarta'}).format(new Date(value))+' WIB';
  useEffect(()=>{try{localStorage.setItem('renso:v1:team-language',language);}catch{}},[language]);
  useEffect(()=>{
    let cancelled = false;
    let controller:AbortController|null = null;
    async function check() {
      controller?.abort();
      controller = new AbortController();
      const current = controller;
      const timeout = setTimeout(()=>current.abort(),12000);
      setChecking(true);
      try {
        const response = await fetch('/api/status',{cache:'no-store',signal:current.signal});
        if(!response.ok) throw new Error('Unavailable');
        const data = await response.json();
        if(typeof data.ai!=='string'||typeof data.database!=='string'||typeof data.voiceInput!=='boolean') throw new Error('Invalid status');
        if(!cancelled&&controller===current){setHealth({ai:data.ai,provider:data.provider,database:data.database,voiceInput:data.voiceInput});setCheckedAt(new Date().toISOString());}
      } catch {if(!cancelled&&controller===current){setHealth(null);setCheckedAt(new Date().toISOString());}}
      finally {clearTimeout(timeout);if(!cancelled&&controller===current)setChecking(false);}
    }
    void check();
    const timer = setInterval(()=>{if(!document.hidden)void check();},60000);
    return ()=>{cancelled=true;controller?.abort();clearInterval(timer);};
  },[refresh]);
  const tasks = TEAM_WORKSPACE.tasks.filter(task=>
    (filter==='all'||task.status===filter)&&(team==='all'||task.teamId===team)&&
    `${local(task.title)} ${local(task.detail)} ${local(TEAM_WORKSPACE.teams.find(item=>item.id===task.teamId)!.name)}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
  );
  return <div className="team-workspace" lang={language}>
    <header className="team-top"><a className="team-brand" href="#/">≋ renso <span>studio</span></a><div><a href="#/">← {t.back}</a><label>{t.language}<select value={language} onChange={event=>setLanguage(event.target.value as Language)}><option value="id">Indonesia</option><option value="en">English</option></select></label></div></header>
    <main className="team-main">
      <section className="team-hero"><p className="team-eyebrow">{t.eyebrow}</p><h1>{t.title}</h1><p>{t.intro}</p><div className="team-snapshot"><strong>{t.snapshot} · {t.updated} {date(TEAM_WORKSPACE.updatedAt)}</strong><p>{t.snapshotNote}</p></div></section>
      <section className="team-counts" aria-label={t.tasks}>{(['done','queued','validation'] as const).map(status=><button key={status} className={`team-count team-${status}`} aria-pressed={filter===status} onClick={()=>setFilter(filter===status?'all':status)}><span>{TEAM_WORKSPACE.tasks.filter(task=>task.status===status).length}</span>{t[status]}</button>)}</section>
      <section className="team-health"><div><h2>{t.health}</h2><p>{t.healthNote}</p></div><button disabled={checking} onClick={()=>setRefresh(value=>value+1)}>{checking?t.checking:t.refresh}</button><div className="team-health-values" role="status">{health?<><span>{t.ai}: <strong>{health.ai} · {health.provider||'—'}</strong></span><span>{t.db}: <strong>{health.database}</strong></span><span>{t.voice}: <strong>{health.voiceInput?t.active:t.inactive}</strong></span></>:<p>{checking?t.checking:t.unavailable}</p>}</div>{checkedAt?<small>{t.checked}: {date(checkedAt)}</small>:null}</section>
      <section><h2>{t.teams}</h2><div className="team-roster">{TEAM_WORKSPACE.teams.map(item=><article key={item.id}><span className="team-icon" aria-hidden="true">{({backend:'⌘',experience:'♡',audio:'♫',visual:'◇',scanner:'◎',qa:'✓',marketing:'↗',community:'✦'} as Record<string,string>)[item.id]}</span><h3>{local(item.name)}</h3><p>{local(item.role)}</p><small>{item.availability==='planned'?t.planned:t.onDemand}</small></article>)}</div></section>
      <section className="team-board"><h2>{t.tasks}</h2><div className="team-controls"><label>{t.search}<input type="search" value={query} onChange={event=>setQuery(event.target.value)}/></label><label>{t.teams}<select value={team} onChange={event=>setTeam(event.target.value)}><option value="all">{t.all}</option>{TEAM_WORKSPACE.teams.map(item=><option key={item.id} value={item.id}>{local(item.name)}</option>)}</select></label><label>{t.tasks}<select value={filter} onChange={event=>setFilter(event.target.value as typeof filter)}><option value="all">{t.all}</option>{(['done','queued','validation'] as const).map(status=><option key={status} value={status}>{t[status]}</option>)}</select></label></div><p className="team-result" role="status">{tasks.length} {language==='id'?'tugas ditampilkan':'tasks shown'}</p><div className="team-tasks">{tasks.map(task=><article key={task.id} className="team-task"><div className="team-task-meta"><span>{local(TEAM_WORKSPACE.teams.find(item=>item.id===task.teamId)!.name)}</span><span className={`team-badge team-${task.status}`}>{t[task.status]}</span></div><h3>{local(task.title)}</h3><p>{local(task.detail)}</p><small>{t.updated}: {date(task.updatedAt)}</small>{task.evidence.length?<details><summary>{t.evidence} ({task.evidence.length})</summary><ul>{task.evidence.map(item=><li key={item.url}><a href={item.url} target="_blank" rel="noopener noreferrer">{item.label} ↗</a></li>)}</ul></details>:null}</article>)}</div>{!tasks.length?<p className="team-empty">{t.empty}</p>:null}</section>
      <section className="team-notes"><article><h2>{t.operations}</h2><p>{t.operationsNote}</p></article><article><h2>{t.roadmap}</h2><p>{t.roadmapNote}</p></article></section>
    </main><footer className="team-footer">{t.public}</footer>
  </div>;
}
