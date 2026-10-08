import { useState } from 'react';
import { WORK_ACTIVITIES, type WorkActivity } from './work-activity.mjs';
import './work-companion.css';
type Props={enabled:boolean;mode:'calm'|'cheerful';activity:WorkActivity|null;label:string;workstation:'laptop'|'desktop';disabled:boolean;onMode:(mode:'calm'|'cheerful')=>void;onActivity:(text:string,activity?:WorkActivity)=>void;onWorkstation:(value:'laptop'|'desktop')=>void;onEnd:()=>void};
export default function WorkCompanion(props:Props){
  const [text,setText]=useState('');
  return <div className="work-companion">
    <div className="work-heading"><strong>Kerja ditemani Renso</strong>{props.enabled?<button className="work-end" onClick={props.onEnd} disabled={props.disabled}>Akhiri</button>:null}</div>
    <div className="work-modes" role="group" aria-label="Pilih mode pendamping kerja">
      <button disabled={props.disabled} aria-pressed={props.enabled&&props.mode==='calm'} onClick={()=>props.onMode('calm')}>☁ Santai</button>
      <button disabled={props.disabled} aria-pressed={props.enabled&&props.mode==='cheerful'} onClick={()=>props.onMode('cheerful')}>☀ Ceria</button>
    </div>
    {props.enabled?<>
      <p className="work-question">Lagi mengerjakan apa yang bikin kamu sulit mulai?</p>
      <form className="work-form" onSubmit={event=>{event.preventDefault();if(text.trim()){props.onActivity(text);setText('');}}}>
        <label className="sr-only" htmlFor="work-description">Aktivitas yang sedang kamu kerjakan</label>
        <input id="work-description" value={text} onChange={e=>setText(e.target.value)} maxLength={120} placeholder="Misalnya: lagi desain poster…" disabled={props.disabled}/>
        <button disabled={props.disabled||!text.trim()} type="submit">Temani</button>
      </form>
      <div className="work-chips" role="group" aria-label="Pilih aktivitas kerja">{Object.entries(WORK_ACTIVITIES).filter(([key])=>key!=='other').map(([key,value])=><button disabled={props.disabled} key={key} aria-pressed={props.activity===key} onClick={()=>props.onActivity(value.label,key as WorkActivity)}>{value.icon} {value.label}</button>)}</div>
      {props.activity?<><p className="work-current" role="status">{props.label} · {props.mode==='cheerful'?'Ditemani dengan semangat':'Ditemani pelan-pelan'}</p><div className="work-equipment" role="group" aria-label="Pilih perangkat di ruang Renso"><button aria-pressed={props.workstation==='laptop'} onClick={()=>props.onWorkstation('laptop')}>Laptop</button><button aria-pressed={props.workstation==='desktop'} onClick={()=>props.onWorkstation('desktop')}>Komputer</button></div>{props.activity==='other'?<p className="work-help">Ruang kerja umum untuk aktivitas ini. Pilih aktivitas lain kapan saja.</p>:null}</>:null}
    </>:<p className="work-help">Ceritakan aktivitasmu. Temanmu akan ikut bekerja di ruang kecilnya.</p>}
  </div>;
}
