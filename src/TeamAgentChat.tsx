import { useEffect, useRef, useState } from 'react';
import { TEAM_WORKSPACE } from './team-workspace-data';
import { TEAM_TARGETS } from '../shared/team-roles.mjs';

type Props={teamId:string;language:'id'|'en'};
type Message={role:'user'|'assistant';content:string};
type Brief={text:string;updatedAt:string};
const key='renso:v1:team-targets';
function readBriefs():Record<string,Brief>{
  try{const data=JSON.parse(localStorage.getItem(key)||'{}');if(!data||typeof data!=='object'||Array.isArray(data))return {};return Object.fromEntries(TEAM_WORKSPACE.teams.filter(team=>typeof data[team.id]?.text==='string'&&typeof data[team.id]?.updatedAt==='string').map(team=>[team.id,{text:data[team.id].text.slice(0,1000),updatedAt:data[team.id].updatedAt}]));}catch{return {};}
}
export default function TeamAgentChat({teamId,language}:Props){
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
    <div className="agent-chat-heading"><div><p className="team-eyebrow">{english?'TEAM CONVERSATION':'KOMUNIKASI TIM'}</p><h2 id="agent-chat-title">{english?'Talk to':'Chat dengan'} {agent.name[language]}</h2><p>{agent.role[language]}</p></div><span className="team-badge team-queued">{english?'AI planning assistant':'Asisten perencanaan AI'}</span></div>
    <div className="agent-chat-layout"><div className="agent-brief"><h3>{english?'Next-stage target':'Target tahap berikutnya'}</h3><p className="agent-default-target">{TEAM_TARGETS[teamId][language]}</p><label htmlFor="agent-target">{english?'Your additional brief':'Arahan tambahan darimu'}</label><textarea id="agent-target" value={edited[teamId]??briefs[teamId]?.text??''} maxLength={1000} rows={4} placeholder={english?'Deliverable, success criteria, deadline…':'Hasil yang diminta, kriteria berhasil, tenggat…'} onChange={event=>{setNotice('');setEdited(previous=>({...previous,[teamId]:event.target.value}));}}/><button onClick={saveBrief}>{english?'Save brief':'Simpan briefing'}</button>{notice?<p role="status" className="agent-brief-notice">{notice}</p>:null}<small>{english?'Briefs are saved only on this browser. They do not change the shared task board or dispatch a worker.':'Briefing hanya tersimpan di browser ini. Tidak mengubah papan tugas bersama atau menjalankan worker.'}</small></div>
    <div className="agent-conversation"><div className="agent-thread" ref={threadRef} role="log" aria-label={english?'Agent conversation':'Percakapan agent'} aria-live="polite">{!(threads[teamId]?.length)?<div className="agent-message assistant"><strong>{agent.name[language]}</strong><p>{english?'I can help plan Renso work for my role. Ask about priorities, targets, or an evidence-based status report.':'Aku bisa membantu menyusun pekerjaan Renso sesuai peranku. Tanyakan prioritas, target, atau laporan berdasarkan bukti.'}</p></div>:threads[teamId].map((item,index)=><div className={`agent-message ${item.role}`} key={index}><strong>{item.role==='user'?(english?'You':'Kamu'):agent.name[language]}</strong><p>{item.content}</p></div>)}{busy===teamId?<p role="status">{english?'Waiting for the agent…':'Menunggu jawaban agent…'}</p>:null}</div>
    <div className="agent-chat-shortcuts">{(english?['What is your next target?','Report verified results.','Break your target into three steps.']:['Apa targetmu berikutnya?','Laporkan hasil yang terverifikasi.','Pecah targetmu menjadi tiga langkah.']).map(text=><button key={text} disabled={busy!==null} onClick={()=>void send(text)}>{text}</button>)}</div>
    {errors[teamId]?<p role="alert" className="agent-chat-error">{errors[teamId]}</p>:null}
    <form onSubmit={event=>{event.preventDefault();void send();}}><label htmlFor="agent-message">{english?'Message to agent':'Pesan untuk agent'}</label><textarea id="agent-message" rows={3} maxLength={2000} value={drafts[teamId]||''} onChange={event=>setDrafts(previous=>({...previous,[teamId]:event.target.value}))} placeholder={english?'Discuss Renso work…':'Diskusikan pekerjaan Renso…'}/><div><span>{(drafts[teamId]||'').length}/2000</span><button disabled={busy!==null||!(drafts[teamId]||'').trim()} type="submit">{english?'Send':'Kirim'}</button></div></form>
    <button className="agent-clear" disabled={busy!==null} onClick={()=>{setThreads(previous=>({...previous,[teamId]:[]}));setErrors(previous=>({...previous,[teamId]:''}));}}>{english?'Clear this conversation':'Hapus percakapan ini'}</button></div></div>
    <p className="agent-chat-note">{english?'Messages and saved briefs are sent to the AI provider when you chat. Conversation history stays in page memory. This chat does not edit code, publish campaigns, or automatically execute jobs; AI replies are proposals, not proof of delivery. The chat shares your session usage allowance with Renso.':'Pesan dan briefing terkirim ke penyedia AI saat kamu chat. Riwayat percakapan hanya di memori halaman. Chat ini tidak mengubah kode, menerbitkan kampanye, atau otomatis mengeksekusi pekerjaan; jawaban AI adalah usulan, bukan bukti hasil. Kuota chat berbagi dengan sesi Renso.'}</p>
  </section>;
}
