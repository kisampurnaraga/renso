import {useEffect,useRef,useState} from 'react';
import './audio-library.css';
type Props={text:string;agent:'teduh'|'spark';disabled:boolean;onSpeaking:(value:boolean)=>void;stopKey:number};
export default function VoiceOutput({text,agent,disabled,onSpeaking,stopKey}:Props){
  const [provider,setProvider]=useState<'device'|'natural'>('device');const [language,setLanguage]=useState<'id'|'en'>('id');const [voice,setVoice]=useState<'F1'|'M1'>('F1');
  const [accepted,setAccepted]=useState(false);const [busy,setBusy]=useState(false);const [playing,setPlaying]=useState(false);const [notice,setNotice]=useState('Suara tidak diputar otomatis.');
  const worker=useRef<Worker|null>(null);const audio=useRef<HTMLAudioElement|null>(null);const objectUrl=useRef<string|null>(null);const timer=useRef<ReturnType<typeof setTimeout>|null>(null);const run=useRef(0);const callback=useRef(onSpeaking);callback.current=onSpeaking;
  function clearAudio(){audio.current?.pause();audio.current=null;if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);objectUrl.current=null;window.speechSynthesis?.cancel();if(timer.current)clearTimeout(timer.current);timer.current=null;callback.current(false);}
  function stop(){run.current++;worker.current?.terminate();worker.current=null;clearAudio();setBusy(false);setPlaying(false);}
  useEffect(()=>{stop();},[stopKey,text,agent,disabled]);
  useEffect(()=>{const hidden=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',hidden);return()=>{document.removeEventListener('visibilitychange',hidden);run.current++;worker.current?.terminate();clearAudio();};},[]);
  function device(){
    if(!window.speechSynthesis){setNotice('Suara perangkat belum tersedia. Kamu tetap bisa membaca.');return;}
    const utterance=new SpeechSynthesisUtterance(text);utterance.lang=language==='id'?'id-ID':'en-US';utterance.rate=agent==='teduh'?0.9:1.05;
    const selected=window.speechSynthesis.getVoices().find(item=>item.lang.toLowerCase().startsWith(language));if(selected)utterance.voice=selected;
    const current=run.current;utterance.onstart=()=>{if(current===run.current){setPlaying(true);callback.current(true);}};utterance.onend=()=>{if(current===run.current){setPlaying(false);callback.current(false);}};utterance.onerror=()=>{if(current===run.current){setPlaying(false);callback.current(false);setNotice('Suara perangkat belum bisa diputar.');}};
    setNotice(selected?'Menggunakan suara perangkat.':'Suara bahasa ini mengikuti ketersediaan perangkat.');window.speechSynthesis.speak(utterance);
  }
  function speak(){
    if(busy||playing){stop();setNotice('Audio dihentikan.');return;}run.current++;clearAudio();if(provider==='device'){device();return;}if(!accepted)return;
    const current=run.current;setBusy(true);setNotice('Memuat suara natural. Unduhan pertama dapat memerlukan beberapa menit…');
    const active=()=>current===run.current;
    worker.current??=new Worker(new URL('./natural-voice.worker.ts',import.meta.url),{type:'module'});
    const fail=(message:string)=>{if(active()){stop();setNotice(message);}};
    timer.current=setTimeout(()=>fail('Pemuatan suara terlalu lama. Coba suara perangkat; suara natural belum aktif.'),240000);
    worker.current.onerror=()=>fail('Suara natural belum dapat dijalankan. Pilih suara perangkat atau teks saja.');
    worker.current.onmessage=async(event:MessageEvent)=>{
      if(!active())return;const result=event.data;
      if(result.type==='progress'){setNotice(result.message);return;}
      if(result.type==='error'){fail(result.message);return;}
      if(result.type==='audio'){
        if(timer.current)clearTimeout(timer.current);timer.current=null;
        const url=URL.createObjectURL(new Blob([result.wav],{type:'audio/wav'}));objectUrl.current=url;const player=new Audio(url);audio.current=player;
        player.onended=()=>{if(active()){clearAudio();setPlaying(false);setNotice('Suara selesai.');}};
        player.onerror=()=>fail('Audio belum bisa diputar. Coba suara perangkat.');
        try{await player.play();if(active()){setBusy(false);setPlaying(true);callback.current(true);setNotice('Supertonic 3 · suara dibuat lokal di perangkat.');}else player.pause();}
        catch{fail('Browser menunda pemutaran. Coba lagi atau gunakan suara perangkat.');}
      }
    };
    worker.current.postMessage({text:text.slice(0,1200),language,voice,speed:agent==='teduh'?0.95:1.05});
  }
  return <div className="voice-output"><div className="voice-options"><label>Suara<select value={provider} onChange={event=>{stop();setProvider(event.target.value as 'device'|'natural');}}><option value="device">Suara perangkat · ringan</option><option value="natural">Natural · Supertonic 3</option></select></label><label>Bahasa suara<select value={language} onChange={event=>{stop();setLanguage(event.target.value as 'id'|'en');}}><option value="id">Indonesia</option><option value="en">English</option></select></label>{provider==='natural'?<label>Karakter suara<select value={voice} onChange={event=>{stop();setVoice(event.target.value as 'F1'|'M1');}}><option value="F1">Perempuan</option><option value="M1">Laki-laki</option></select></label>:null}</div>{provider==='natural'?<label className="voice-consent"><input type="checkbox" checked={accepted} onChange={event=>{setAccepted(event.target.checked);if(!event.target.checked)stop();}}/> Izinkan unduhan model ratusan MB dari Hugging Face. Gunakan Wi-Fi; teks diproses lokal dan tidak dikirim ke layanan TTS.</label>:null}<button disabled={disabled||!text||provider==='natural'&&!accepted} onClick={speak}>{busy?'■ Batalkan pemuatan':playing?'■ Hentikan audio':'▷ Dengarkan temanmu'}</button><p role="status">{notice}</p><small>Pilihan bahasa mengatur pengucapan, tidak menerjemahkan pesan. {provider==='natural'?<>Model <a href="https://huggingface.co/supertone-oss-archive/supertonic-3/blob/aafc6e32416a594460b32413efc49d7fe4ce6d46/LICENSE" target="_blank" rel="noreferrer">OpenRAIL-M</a>; kode <a href="/licenses/Supertonic-MIT.txt" target="_blank" rel="noreferrer">MIT</a>. Kualitas suara tergantung perangkat.</>:null}</small></div>;
}
