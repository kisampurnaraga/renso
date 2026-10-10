import { useEffect, useRef, useState } from 'react';
export type LibraryTrack = {id:string;title:string;artist:string;duration:number;sourceUrl:string;license:string;streamUrl:string};
type Props = {onSelect:(track:LibraryTrack)=>void;selected:string|null};
export default function MusicLibrary({onSelect,selected}:Props){
  const [query,setQuery]=useState('lofi');const [tracks,setTracks]=useState<LibraryTrack[]>([]);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const controller=useRef<AbortController|null>(null);
  useEffect(()=>()=>controller.current?.abort(),[]);
  async function search(){
    controller.current?.abort(); const request=new AbortController();controller.current=request;setBusy(true);setError('');
    try{const response=await fetch(`/api/music/search?q=${encodeURIComponent(query.trim())}`,{signal:request.signal});const data=await response.json();if(!response.ok)throw new Error(data.error||'Katalog belum tersedia.');if(!Array.isArray(data.tracks))throw new Error('Respons katalog belum valid.');setTracks(data.tracks);if(!data.tracks.length)setError('Belum ada lagu publik yang bisa diputar. Coba kata kunci lain.');}
    catch(error){if(!request.signal.aborted)setError(error instanceof Error?error.message:'Katalog belum tersambung.');}finally{if(!request.signal.aborted)setBusy(false);}
  }
  return <div className="music-library"><form onSubmit={event=>{event.preventDefault();void search();}}><label htmlFor="music-search">Cari lagu Audius</label><div><input id="music-search" value={query} maxLength={80} onChange={event=>setQuery(event.target.value)} placeholder="lofi, ambient, jazz…"/><button disabled={busy||query.trim().length<2}>{busy?'Mencari…':'Cari lagu'}</button></div></form><p>Streaming katalog independen. Hak lagu mengikuti lisensi artis dan <a href="https://audius.co/legal" target="_blank" rel="noreferrer">ketentuan Audius</a>.</p>{error?<p role="status">{error} Musik original tetap tersedia.</p>:null}<ul>{tracks.map(track=><li key={track.id}><div><strong>{track.title}</strong><span>{track.artist} · {Math.floor(track.duration/60)}:{String(track.duration%60).padStart(2,'0')}</span><small>{track.license}</small><a href={track.sourceUrl} target="_blank" rel="noreferrer">Lihat di Audius ↗</a></div><button aria-pressed={selected===track.id} onClick={()=>onSelect(track)}>{selected===track.id?'Dipilih':'Pilih lagu'}</button></li>)}</ul></div>;
}
