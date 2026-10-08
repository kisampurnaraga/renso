import { useEffect, useRef, useState } from 'react';
import { TEAM_WORKSPACE } from './team-workspace-data';
import { TEAM_TARGETS } from '../shared/team-roles.mjs';
import type { WorkerActivity } from '../shared/worker-activity.mjs';
import TeamJobQueue from './TeamJobQueue';

type PresenceMode='resting'|'available';
type Props={teamId:string;language:'id'|'en';onActivity?:(activity:WorkerActivity)=>void;onPresenceChange?:(teamId:string,mode:PresenceMode)=>void};
type Message={role:'user'|'assistant';content:string};
type Brief={text:string;updatedAt:string};
const key='renso:v1:team-targets';
function readBriefs():Record<string,Brief>{
  try{const data=JSON.parse(localStorage.getItem(key)||'{}');if(!data||typeof data!=='object'||Array.isArray(data))return {};return Object.fromEntries(TEAM_WORKSPACE.teams.filter(team=>typeof data[team.id]?.text==='string'&&typeof data[team.id]?.updatedAt==='string').map(team=>[team.id,{text:data[team.id].text.slice(0,1000),updatedAt:data[team.id].updatedAt}]));}catch{return {};}
}
function presenceCommand(text:string):PresenceMode|null{
  const normalized=text.toLocaleLowerCase().replace(/[.!?]+/g,' ').replace(/\s+/g,' ').trim();
  if(/\b(lanjut kerja|kembali bekerja|mulai kerja|kerja lagi|aktif lagi|resume|back to work|continue working)\b/.test(normalized))return 'available';
  if(/\b(istirahat|rehat|break|rest)\b/.test(normalized))return 'resting';
  return null;
}
export default function TeamAgentChat({teamId,language,onActivity,onPresenceChange}:Props){
  const [briefs,setBriefs]=useState(readBriefs);
  const [edited,setEdited]=useState<Record<string,string>>({});
  const [drafts,setDrafts]=useState<Record<string,string>>({});
  const [threads,setThreads]=useState<Record<string,Message[]>>({});
  const [busy,setBusy]=useState<string|null>(null);
  const [errors,setErrors]=useState<Record<string,string>>({});
  const [notice,setNotice]=useState('');
  const requestRef=useRef<AbortController|null>(null);
  const lock=useRef(false);
  const mounted=useRef(true);
  const threadRef=useRef<HTMLDivElement>(null);
  const agent=TEAM_WORKSPACE.teams.find(item=>item.id===teamId)!;
  const english=language==='en';
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;requestRef.current?.abort();};},[]);
  useEffect(()=>{setNotice('');},[teamId]);
  useEffect(()=>{if(threadRef.current)threadRef.current.scrollTop=threadRef.current.scrollHeight;},[threads,teamId,busy]);
  function saveBrief(){
    const text=(edited[teamId]??briefs[teamId]?.text??'').trim();
    const next={...briefs,[teamId]:{text,updatedAt:new Date().toISOString()}};
    try{localStorage.setItem(key,JSON.stringify(next));setBriefs(next);setNotice(english?'Brief saved on this device. It will be included in this agent’s next chat.':'Briefing tersimpan di perangkat ini dan akan disertakan pada chat agent berikutnya.');}catch{setNotice(english?'This device could not save the brief.':'Perangkat ini belum bisa menyimpan briefing.');}
  }
  async function send(text=(drafts[teamId]||'')){
    text=text.trim();if(!text||lock.current)return;
    const id=teamId;
    const command=presenceCommand(text);
    if(command&&onPresenceChange){
      onPresenceChange(id,command);
      const reply=command==='resting'
        ?(english?`Understood. I’m switching to rest mode. If a verified worker task is already running, I’ll stay at the desk until that active task finishes, then move to the lounge.`:`Siap. Saya masuk mode istirahat. Jika ada tugas worker terverifikasi yang masih berjalan, saya tetap di meja sampai tugas aktif itu selesai, lalu pindah ke ruang istirahat.`)
        :(english?`Understood. I’m returning to the desk and ready to receive work. Typing animation will only start when the verified worker status is running.`:`Siap. Saya kembali ke meja kerja dan siap menerima tugas. Animasi mengetik hanya akan aktif saat status worker terverifikasi benar-benar running.`);
      setThreads(previous=>({...previous,[id]:[...(previous[id]||[]),{role:'user',content:text},{role:'assistant',content:reply}].slice(-20) as Message[]}));
      setDrafts(previous=>({...previous,[id]:''}));
      setErrors(previous=>({...previous,[id]:''}));
      return;
    }
    const history=(threads[id]||[]).slice(-6).map(item=>({...item,content:item.content.slice(0,2000)}));
    lock.current=true;setBusy(id);setErrors(previous=>({...previous,[id]:''}));
    const controller=new AbortController();requestRef.current=controller;
    const timeout=setTimeout(()=>controller.abort(),35000);
    async function call(path:string,body?:unknown){
      const response=await fetch(`/api${path}`,{method:'POST',credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,signal:controller.signal});
      if(!response.headers.get('content-type')?.includes('application/json'))throw new Error(english?`The chat service returned an invalid response (HTTP ${response.status}). Refresh the app and try again.`:`Layanan chat belum memberikan respons yang sesuai (HTTP ${response.status}). Muat ulang aplikasi lalu coba lagi.`);
      let data;
      try{data=await response.json();}catch{throw new Error(english?'The chat response could not be read. Try again shortly.':'Respons chat belum bisa dibaca. Coba lagi sebentar.');}
      if(!data||typeof data!=='object')throw new Error(english?'The chat response is invalid.':'Respons chat belum sesuai.');
      if(!response.ok)throw new Error(typeof data.error==='string'?data.error:(english?'Service unavailable.':'Layanan belum tersedia.'));return data;
    }
    try{
      await call('/session');
      const data=await call('/team/chat',{team:id,language,message:text,target:briefs[id]?.text||'',history});
      if(typeof data.reply!=='string'||!data.reply.trim())throw new Error(english?'No reply received.':'Balasan belum diterima.');
      if(mounted.current){setThreads(previous=>({...previous,[id]:[...(previous[id]||[]),{role:'user',content:text},{role:'assistant',content:data.reply}].slice(-20) as Message[]}));setDrafts(previous=>({...previous,[id]:''}));}
    }catch(error){if(mounted.current)setErrors(previous=>({...previous,[id]:error instanceof Error&&error.name!=='AbortError'?error.message:english?'Request timed out. Please try again.':'Permintaan terlalu lama. Coba lagi.'}));}
    finally{clearTimeout(timeout);lock.current=false;if(mounted.current)setBusy(null);}
  }
  return <section className="team-agent-chat" id="office-chat" aria-labelledby="agent-chat-title">
    <div className="agent-chat-heading"><div><p className="team-eyebrow">{english?'TEAM CONVERSATION':'KOMUNIKASI TIM'}</p><h2 id="agent-chat-title">{english?'Talk to':'Chat dengan'} {agent.agentName}</h2><p>{agent.role[language]}</p></div><span className="team-badge team-queued">{english?'AI planning assistant':'Asisten perencanaan AI'}</span></div>
    <div className="agent-chat-layout"><div className="agent-brief"><h3>{english?'Next-stage target':'Target tahap berikutnya'}</h3><p className="agent-default-target">{TEAM_TARGETS[teamId][language]}</p><label htmlFor="agent-target">{english?'Your additional brief':'Arahan tambahan darimu'}</label><textarea id="agent-target" value={edited[teamId]??briefs[teamId]?.text??''} maxLength={1000} rows={4} placeholder={english?'Deliverable, success criteria, deadline…':'Hasil yang diminta, kriteria berhasil, tenggat…'} onChange={event=>{setNotice('');setEdited(previous=>({...previous,[teamId]:event.target.value}));}}/><button onClick={saveBrief}>{english?'Save brief':'Simpan briefing'}</button>{notice?<p role="status" className="agent-brief-notice">{notice}</p>:null}<small>{english?'Briefs are saved only on this browser. They do not change the shared task board or dispatch a worker.':'Briefing hanya tersimpan di browser ini. Tidak mengubah papan tugas bersama atau menjalankan worker.'}</small></div>
    <div className="agent-conversation"><div className="agent-thread" ref={threadRef} role="log" aria-label={english?'Agent conversation':'Percakapan agent'} aria-live="polite">{!(threads[teamId]?.length)?<div className="agent-message assistant"><strong>{agent.agentName}</strong><p>{english?'I can help plan Renso work for my role. Ask about priorities, targets, or an evidence-based status report.':'Aku bisa membantu menyusun pekerjaan Renso sesuai peranku. Tanyakan prioritas, target, atau laporan berdasarkan bukti.'}</p></div>:threads[teamId].map((item,index)=><div className={`agent-message ${item.role}`} key={index}><strong>{item.role==='user'?(english?'You':'Kamu'):agent.agentName}</strong><p>{item.content}</p></div>)}{busy===teamId?<p role="status">{english?'Waiting for the agent…':'Menunggu jawaban agent…'}</p>:null}</div>
    <div className="agent-chat-shortcuts">{(english?['What is your next target?','Report verified results.','Break your target into three steps.','Take a break.','Back to work.']:['Apa targetmu berikutnya?','Laporkan hasil yang terverifikasi.','Pecah targetmu menjadi tiga langkah.','Istirahat dulu.','Lanjut kerja.']).map(text=><button key={text} disabled={busy!==null} onClick={()=>void send(text)}>{text}</button>)}</div>
    {errors[teamId]?<p role="alert" className="agent-chat-error">{errors[teamId]}</p>:null}
    <form onSubmit={event=>{event.preventDefault();void send();}}><label htmlFor="agent-message">{english?'Message to agent':'Pesan untuk agent'}</label><textarea id="agent-message" rows={3} maxLength={2000} value={drafts[teamId]||''} onChange={event=>setDrafts(previous=>({...previous,[teamId]:event.target.value}))} placeholder={english?'Discuss Renso work…':'Diskusikan pekerjaan Renso…'}/><div><span>{(drafts[teamId]||'').length}/2000</span><button disabled={busy!==null||!(drafts[teamId]||'').trim()} type="submit">{english?'Send':'Kirim'}</button></div></form>
    <button className="agent-clear" disabled={busy!==null} onClick={()=>{setThreads(previous=>({...previous,[teamId]:[]}));setErrors(previous=>({...previous,[teamId]:''}));}}>{english?'Clear this conversation':'Hapus percakapan ini'}</button></div></div>
    <p className="agent-chat-note">{english?'Messages and saved briefs are sent to the AI provider when you chat. Conversation history stays in page memory. Rest/back-to-work commands change only the office presence visualization; they do not edit code, publish campaigns, or automatically execute jobs. Verified worker status remains the source of truth for real execution.':'Pesan dan briefing terkirim ke penyedia AI saat kamu chat. Riwayat percakapan hanya di memori halaman. Perintah istirahat/lanjut kerja mengubah visual kehadiran di kantor, tetapi tidak mengubah kode, menerbitkan kampanye, atau otomatis mengeksekusi pekerjaan. Status worker terverifikasi tetap menjadi sumber kebenaran untuk eksekusi nyata.'}</p>
    <TeamJobQueue onActivity={onActivity} teamId={teamId} language={language} suggestedInstructions={[edited[teamId]??briefs[teamId]?.text??'', (threads[teamId]||[]).filter(item=>item.role==='user').at(-1)?.content||drafts[teamId]||''].filter(Boolean).join('\n\n')}/>
  </section>;
}