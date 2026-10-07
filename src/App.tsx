import { Component, lazy, Suspense, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
const Avatar = lazy(() => import('./Avatar'));
const AGENTS = {
  teduh: {name:'Teduh',role:'Teman mengambil jeda',mark:'☾',greeting:'Hai, aku Teduh. Kamu boleh pelan-pelan di sini. Mau cerita atau mengambil jeda sebentar?'},
  spark: {name:'Spark',role:'Teman memulai langkah',mark:'✦',greeting:'Hai, aku Spark! Kita mulai dari yang kecil. Apa satu hal yang ingin kamu lakukan hari ini?'}
};
const MOODS = {
  blue:{label:'Tenang',hint:'Aku ingin melambat',color:'#7dbbff'},
  green:{label:'Segar',hint:'Aku ingin mulai lagi',color:'#9bf4c4'},
  red:{label:'Berenergi',hint:'Aku ingin bergerak',color:'#ff8b8f'}
};
type Agent = keyof typeof AGENTS;
type Mood = keyof typeof MOODS;
type Message = {role:'user'|'assistant';content:string};
type Status = {ai:'live'|'demo';database:string;voiceInput:boolean};
class AvatarBoundary extends Component<{children:ReactNode},{failed:boolean}> {
  state = {failed:false};
  static getDerivedStateFromError() { return {failed:true}; }
  render() { return this.state.failed ? <div className="avatar-fallback"><span>✦</span><p>Temanmu tetap di sini.<br/>Mode ringan aktif.</p></div> : this.props.children; }
}
async function api(path:string,options:RequestInit={}) {
  const result = await fetch(`/api${path}`,{...options,credentials:'same-origin',headers:{...(typeof options.body==='string'?{'Content-Type':'application/json'}:{}),...options.headers},signal:AbortSignal.timeout(35000)});
  const data = await result.json(); if(!result.ok) throw new Error(data.error || 'Belum terhubung. Coba lagi sebentar.'); return data;
}
function readPreference(key:string,fallback:string) {try{return localStorage.getItem(`renso:v1:${key}`)||fallback;}catch{return fallback;}}
function useReducedMotion() {
  const [reduced,setReduced] = useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const change=()=>setReduced(media.matches);media.addEventListener('change',change);return()=>media.removeEventListener('change',change);},[]); return reduced;
}
export default function App() {
  const [agent,setAgent] = useState<Agent>('teduh');
  const [mood,setMood] = useState<Mood>(()=>{const saved=readPreference('mood','blue');return saved in MOODS?saved as Mood:'blue';});
  const [messages,setMessages] = useState<Message[]>([{role:'assistant',content:AGENTS.teduh.greeting}]);
  const [input,setInput] = useState(''); const [busy,setBusy] = useState(false);
  const [status,setStatus] = useState<Status|null>(null); const [ready,setReady] = useState(false);
  const [error,setError] = useState(''); const [notice,setNotice] = useState('');
  const [speaking,setSpeaking] = useState(false); const [recording,setRecording] = useState(false);
  const [seconds,setSeconds] = useState<number|null>(null); const [activity,setActivity] = useState<'rest'|'start'|null>(null);
  const [modal,setModal] = useState<'aura'|'privacy'|'voice'|null>(null);
  const [light,setLight] = useState(()=>readPreference('light','false')==='true');
  const [install,setInstall] = useState<any>(null);
  const reduced = useReducedMotion();
  const recorder = useRef<MediaRecorder|null>(null); const stream = useRef<MediaStream|null>(null);
  const recordingTimeout = useRef<ReturnType<typeof setTimeout>|null>(null);
  const chatEnd = useRef<HTMLDivElement>(null); const mounted = useRef(true);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const requestLock = useRef(false);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;recorder.current?.stop();stream.current?.getTracks().forEach(t=>t.stop());if(recordingTimeout.current)clearTimeout(recordingTimeout.current);window.speechSynthesis?.cancel();};},[]);
  async function connect() {
    setError('');setReady(false);
    try {const [data]=await Promise.all([api('/status'),api('/session',{method:'POST'})]);if(mounted.current){setStatus(data);setReady(true);}}
    catch {if(mounted.current)setError('Renso belum tersambung. Pastikan layanan aplikasi berjalan, lalu coba lagi.');}
  }
  useEffect(()=>{void connect();},[]);
  useEffect(()=>{if(modal && dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();},[modal]);
  useEffect(()=>{try{localStorage.setItem('renso:v1:mood',mood);localStorage.setItem('renso:v1:light',String(light));}catch{}},[mood,light]);
  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:reduced?'instant':'smooth',block:'nearest'});},[messages,busy,reduced]);
  useEffect(()=>{const handler=(event:Event)=>{event.preventDefault();setInstall(event);};window.addEventListener('beforeinstallprompt',handler);return()=>window.removeEventListener('beforeinstallprompt',handler);},[]);
  useEffect(()=>{
    if(seconds===null)return;
    if(seconds===0){setSeconds(null);setNotice('Sesi selesai. Bagaimana rasanya? Kamu boleh lanjut atau cukup sampai di sini.');return;}
    const timer=setTimeout(()=>setSeconds(s=>s===null?null:s-1),1000);return()=>clearTimeout(timer);
  },[seconds]);
  function stopAudio(){window.speechSynthesis?.cancel();setSpeaking(false);}
  function speak(text:string) {
    stopAudio();if(!('speechSynthesis' in window)){setNotice('Audio perangkat belum didukung. Kamu tetap bisa membaca pesannya.');return;}
    const utterance=new SpeechSynthesisUtterance(text);utterance.lang='id-ID';utterance.rate=agent==='teduh'?0.9:1.05;
    const voice=window.speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith('id'));
    if(voice)utterance.voice=voice;else setNotice('Suara Indonesia mengikuti ketersediaan di perangkatmu.');
    utterance.onstart=()=>setSpeaking(true);utterance.onend=()=>setSpeaking(false);utterance.onerror=()=>{setSpeaking(false);setNotice('Audio belum bisa diputar. Coba lagi atau baca pesannya.');};
    window.speechSynthesis.speak(utterance);
  }
  function chooseAgent(next:Agent){stopAudio();setAgent(next);setMessages([{role:'assistant',content:AGENTS[next].greeting}]);setInput('');setNotice('Percakapan baru dimulai. Cerita sebelumnya tidak diteruskan ke agent ini.');}
  async function send(text=input) {
    if(!text.trim()||!ready||requestLock.current||recording)return;
    requestLock.current=true;setBusy(true);setError('');stopAudio();
    const history=messages.slice(-6);setMessages(m=>[...m,{role:'user',content:text.trim()}]);setInput('');
    try {const data=await api('/chat',{method:'POST',body:JSON.stringify({agent,mood,message:text.trim(),history})});if(mounted.current)setMessages(m=>[...m,{role:'assistant',content:data.reply}]);}
    catch(e){if(mounted.current){setError(e instanceof Error?e.message:'Pesan belum terkirim.');setInput(text);setMessages(m=>m.slice(0,-1));}}
    finally {requestLock.current=false;if(mounted.current)setBusy(false);}
  }
  async function startRecording(){
    setModal(null);setError('');
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){setNotice('Input suara belum didukung di browser ini. Coba ketik pesanmu.');return;}
    try {
      const media=await navigator.mediaDevices.getUserMedia({audio:true});if(!mounted.current){media.getTracks().forEach(t=>t.stop());return;}
      stream.current=media;
      const mime=['audio/webm','audio/mp4','audio/ogg'].find(t=>MediaRecorder.isTypeSupported(t));
      if(!mime){media.getTracks().forEach(t=>t.stop());setNotice('Format rekaman browser ini belum didukung.');return;}
      const rec=new MediaRecorder(media,{mimeType:mime});recorder.current=rec;const chunks:BlobPart[]=[];
      rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      rec.onstop=async()=>{
        media.getTracks().forEach(t=>t.stop());stream.current=null;if(recordingTimeout.current)clearTimeout(recordingTimeout.current);
        if(!mounted.current)return;setRecording(false);setBusy(true);requestLock.current=true;
        try {const data=await api('/transcribe',{method:'POST',headers:{'Content-Type':mime},body:new Blob(chunks,{type:mime})});if(mounted.current){setInput(data.text);setNotice('Periksa teks rekaman sebelum mengirim.');}}
        catch(e){if(mounted.current)setError(e instanceof Error?e.message:'Rekaman belum diproses.');}
        finally{requestLock.current=false;if(mounted.current)setBusy(false);}
      };
      rec.start();setRecording(true);recordingTimeout.current=setTimeout(()=>{if(rec.state==='recording')rec.stop();},30000);
    }catch{setError('Mikrofon belum diizinkan atau tidak tersedia. Kamu tetap bisa mengetik.');}
  }
  async function deleteData(){
    if(requestLock.current)return;requestLock.current=true;setBusy(true);stopAudio();
    try{await api('/session',{method:'DELETE'});try{localStorage.removeItem('renso:v1:mood');localStorage.removeItem('renso:v1:light');}catch{}setMood('blue');setLight(false);setMessages([{role:'assistant',content:AGENTS[agent].greeting}]);setInput('');setSeconds(null);setActivity(null);setModal(null);await connect();setNotice('Data sesi dihapus. Kamu memulai sesi tamu baru.');}
    catch(e){setError(e instanceof Error?e.message:'Data belum bisa dihapus.');}finally{requestLock.current=false;setBusy(false);}
  }
  function startActivity(kind:'rest'|'start'){setActivity(kind);setSeconds(kind==='rest'?60:120);stopAudio();}
  const latest = [...messages].reverse().find(m=>m.role==='assistant')?.content || '';
  return <div className="app" style={{'--aura':MOODS[mood].color} as CSSProperties}>
    <header className="topbar"><a className="brand" href="/" aria-label="Renso beranda"><span className="brand-mark">≋</span>renso<span className="brand-note">resonansi soul</span></a><div className="top-actions">{install?<button className="quiet" onClick={async()=>{await install.prompt();setInstall(null);}}>Pasang Renso</button>:null}<button className="quiet" onClick={()=>setModal('privacy')}>Privasi</button><span className="version">EARLY ACCESS</span></div></header>
    <main><div className="intro"><div><p className="eyebrow">RUANG KECIL UNTUK DIRIMU</p><h1>Temukan ritmemu.<br/><span>Kita mulai pelan-pelan.</span></h1></div><p className="intro-note">Satu percakapan.<br/>Satu langkah kecil.<br/>Dengan energi pilihanmu.</p></div>
    <div className="workspace">
      <section className="stage" aria-label="Teman dan aura"><div className="stage-header"><span className="pill">{AGENTS[agent].mark} {AGENTS[agent].name}</span><button className="quiet" aria-pressed={light} onClick={()=>setLight(!light)}>Mode {light?'3D':'ringan'}</button></div>
        <div className="avatar-space">{light?<div className="avatar-fallback"><span>{AGENTS[agent].mark}</span><p>{AGENTS[agent].name} menemanimu</p></div>:<AvatarBoundary><Suspense fallback={<div className="avatar-fallback"><p>Temanmu sedang datang…</p></div>}><Avatar color={MOODS[mood].color} agent={agent} speaking={speaking} reduced={reduced}/></Suspense></AvatarBoundary>}<span className="orbit-label">{speaking?'Sedang berbicara':recording?'Mendengarkan rekamanmu':MOODS[mood].label}</span></div>
        <div className="stage-copy"><h2>{AGENTS[agent].role}</h2><p>Kamu menentukan suasananya. Aku menemani langkahnya.</p></div>
        <div className="aura-selector" role="group" aria-label="Pilih suasana aura">{Object.entries(MOODS).map(([key,value])=><button key={key} aria-pressed={mood===key} className={mood===key?'aura-choice selected':'aura-choice'} onClick={()=>setMood(key as Mood)}><span className="swatch" style={{background:value.color}}/>{value.label}</button>)}</div>
        <button className="aura-check" onClick={()=>setModal('aura')}>✧ Cek aura pilihanku</button>
      </section>
      <section className="conversation" aria-label="Percakapan"><div className="conversation-header"><div><p className="eyebrow">TEMAN RENSO-MU</p><h2>Ada cerita apa hari ini?</h2></div><span className="connection">{ready?status?.ai==='live'?'AI terhubung':'Mode demo':'Menghubungkan'}</span></div>
        <div className="agent-tabs" role="group" aria-label="Pilih teman">{Object.entries(AGENTS).map(([key,value])=><button disabled={busy||recording} key={key} aria-pressed={agent===key} className={agent===key?'agent-tab active':'agent-tab'} onClick={()=>chooseAgent(key as Agent)}><span>{value.mark}</span><div><strong>{value.name}</strong><small>{value.role}</small></div></button>)}</div>
        {status?.ai==='demo'?<p className="demo-note">Demo interaktif: respons memakai skenario yang disiapkan, belum AI langsung. Audio memakai suara perangkat.</p>:null}
        <div className="messages" role="log" aria-live="polite" aria-label="Isi percakapan">{messages.map((message,index)=><div key={index} className={`message ${message.role}`}><span className="message-author">{message.role==='user'?'Kamu':AGENTS[agent].name}</span><p>{message.content}</p></div>)}{busy?<div className="thinking" role="status">Sebentar ya…</div>:null}<div ref={chatEnd}/></div>
        {messages.length===1?<div className="suggestions">{['Aku lagi jenuh','Sulit mulai kerja','Aku butuh semangat'].map(text=><button disabled={!ready||busy} key={text} onClick={()=>void send(text)}>{text}</button>)}</div>:null}
        {error?<div className="error" role="alert">{error}{!ready?<button onClick={()=>void connect()}>Coba sambungkan lagi</button>:null}</div>:null}
        <form className="composer" onSubmit={e=>{e.preventDefault();void send();}}><label className="sr-only" htmlFor="message">Pesan untuk teman Renso</label><textarea id="message" placeholder="Ceritakan sedikit saja…" value={input} maxLength={2000} disabled={!ready||busy||recording} rows={2} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();void send();}}}/><div className="composer-bottom"><span>{input.length}/2000</span><div><button type="button" className={recording?'record active':'record'} disabled={busy||!ready} onClick={()=>{if(recording){recorder.current?.stop();}else if(!status?.voiceInput)setNotice('Input suara akan aktif ketika layanan AI terhubung.');else setModal('voice');}}>{recording?'■ Selesai merekam':'◉ Suara'}</button><button className="send" disabled={!ready||busy||recording||!input.trim()} type="submit">Kirim</button></div></div></form>
        <div className="audio-controls"><button disabled={!latest} onClick={()=>speaking?stopAudio():speak(latest)}>{speaking?'■ Hentikan audio':'▷ Dengarkan temanmu'}</button><span>Cerita hanya ada dalam sesi ini.</span></div>
      </section>
    </div>
    <section className="activities" aria-label="Aktivitas singkat"><div className="activity-title"><p className="eyebrow">LANGKAH KECIL, RUANG BARU</p><h2>Mau mulai dari sini?</h2></div><button className="activity-card" onClick={()=>startActivity('rest')}><span className="activity-icon">☁</span><div><h3>Ambil jeda</h3><p>Longgarkan bahu. Beri ruang untuk dirimu.</p></div><span className="duration">1 menit</span></button><button className="activity-card" onClick={()=>startActivity('start')}><span className="activity-icon">✦</span><div><h3>Mulai satu hal</h3><p>Buka dokumen. Tulis satu kalimat. Cukup itu.</p></div><span className="duration">2 menit</span></button></section>
    {seconds!==null?<div className="activity-session"><div><strong>{activity==='rest'?'Jeda singkat':'Satu langkah kecil'}</strong><p>{activity==='rest'?'Duduk senyamanmu. Kamu boleh berhenti kapan saja.':'Pilih satu tindakan ringan dan lakukan sekarang.'}</p></div><span className="timer" aria-label="Sisa waktu">{Math.floor(seconds/60)}:{String(seconds%60).padStart(2,'0')}</span><button className="quiet" onClick={()=>{setSeconds(null);setActivity(null);}}>Selesai</button></div>:null}
    {notice?<div className="notice" role="status"><span>{notice}</span><button aria-label="Tutup pemberitahuan" onClick={()=>setNotice('')}>×</button></div>:null}
    </main><footer><span>renso · temukan ritmemu</span><span>Teman AI untuk keseharian. Bukan layanan terapi atau pertolongan darurat.</span></footer>
    {modal?<dialog ref={dialogRef} className="modal" aria-labelledby="modal-title" onCancel={e=>{e.preventDefault();setModal(null);}}><div className="modal-inner"><button className="close-modal" aria-label="Tutup" autoFocus onClick={()=>setModal(null)}>×</button>{modal==='aura'?<><p className="eyebrow">CEK AURA</p><h2 id="modal-title">Energi apa yang kamu butuhkan?</h2><p>Aura adalah warna suasana pilihanmu. Kamera dan pembacaan wajah belum aktif.</p><div className="mood-options">{Object.entries(MOODS).map(([key,value])=><button key={key} onClick={()=>{setMood(key as Mood);setModal(null);}}><span className="swatch" style={{background:value.color}}/><div><strong>{value.label}</strong><small>{value.hint}</small></div></button>)}</div></>:modal==='voice'?<><h2 id="modal-title">Bicara, lalu periksa teksnya</h2><p>Rekaman maksimal 30 detik dikirim ke penyedia AI untuk transkripsi. Renso tidak menyimpan file rekaman. Pemrosesan mengikuti kebijakan penyedia. Kamu tetap bisa memilih mengetik.</p><button className="primary" onClick={()=>void startRecording()}>Izinkan dan mulai rekaman</button></>:<><h2 id="modal-title">Ruangmu, pilihanmu</h2><p>Kamu sedang memakai sesi tamu. Renso menyimpan token sesi yang diacak dan jumlah penggunaan. Percakapan berada di memori halaman, tidak disimpan di database.</p><p>Saat AI langsung aktif, pesan dikirim ke penyedia AI untuk dijawab. Audio keluaran menggunakan layanan suara perangkat. Kamera tidak aktif. Cerita tidak otomatis menjadi bahan pelatihan agent Renso.</p><p>Menghapus sesi akan menghapus data penggunaan dan preferensi perangkat. Kebijakan penyimpanan penyedia AI berlaku terpisah.</p><button disabled={busy} className="danger" onClick={()=>void deleteData()}>Hapus data sesi saya</button></>}</div></dialog>:null}
  </div>;
}
