import { useEffect, useRef, useState } from 'react';
import { MoodMusic, type MusicPreset } from './music-engine';
import './mood-room.css';

type Props = {
  recommendation?: {mood:'blue'|'green'|'red';sequence:number}|null;
  onMoodChange: (mood: 'blue' | 'green' | 'red') => void;
  onPlaybackChange: (playing: boolean) => void;
  onMusicOnlyChange: (only: boolean) => void;
};
const rooms: { id: MusicPreset; mood: 'blue' | 'green' | 'red'; icon: string; title: string; detail: string }[] = [
  { id: 'ambient', mood: 'blue', icon: '☁', title: 'Awan pelan', detail: 'Pad mengalun · tanpa ketukan' },
  { id: 'lofi', mood: 'green', icon: '♫', title: 'Sudut nyaman', detail: 'Bass hangat · beat santai' },
  { id: 'bright', mood: 'red', icon: '☀', title: 'Sinar kecil', detail: 'Melodi ceria · perkusi ringan' },
];

export default function MoodRoom({ recommendation, onMoodChange, onPlaybackChange, onMusicOnlyChange }: Props) {
  const [preset, setPreset] = useState<MusicPreset>('ambient');
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [volume, setVolume] = useState(35);
  const [only, setOnly] = useState(false);
  const [timer, setTimer] = useState(false);
  const [remaining, setRemaining] = useState(300);
  const [notice, setNotice] = useState('Pilih suasana yang ingin menemanimu.');
  const engine = useRef<MoodMusic | null>(null);
  const playback = useRef(false);
  const pending = useRef(false);
  const generation = useRef(0);
  const mounted = useRef(true);
  const callbacks = useRef({ onPlaybackChange, onMusicOnlyChange });
  callbacks.current = { onPlaybackChange, onMusicOnlyChange };
  const selected = rooms.find(room => room.id === preset)!;

  function stop(message?: string) {
    generation.current++;
    playback.current = false;
    pending.current = false;
    engine.current?.stop();
    setPlaying(false);
    setBusy(false);
    callbacks.current.onPlaybackChange(false);
    if (message) setNotice(message);
  }

  useEffect(() => {
    if (!recommendation) return;
    const room = rooms.find(item => item.mood === recommendation.mood)!;
    stop(`${room.title} disiapkan dari pilihanmu di Aura Scan. Ketuk Putar musik untuk mulai.`);
    setPreset(room.id);
    setRemaining(300);
  }, [recommendation]);

  useEffect(() => {
    mounted.current = true;
    const hidden = () => { if (document.hidden) stop('Musik dijeda saat kamu meninggalkan halaman.'); };
    document.addEventListener('visibilitychange', hidden);
    return () => {
      mounted.current = false;
      generation.current++;
      pending.current = false;
      playback.current = false;
      engine.current?.stop();
      callbacks.current.onPlaybackChange(false);
      callbacks.current.onMusicOnlyChange(false);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, []);

  useEffect(() => {
    if (!playing || !timer) return;
    const tick = setInterval(() => setRemaining(value => Math.max(0, value - 1)), 1000);
    return () => clearInterval(tick);
  }, [playing, timer]);
  useEffect(() => {
    if (timer && remaining === 0 && playing) stop('Sesi lima menit selesai. Terima kasih sudah memberi ruang untuk dirimu.');
  }, [remaining, timer, playing]);

  async function play() {
    if (playback.current) { stop('Musik dijeda. Lanjutkan kapan kamu mau.'); return; }
    if (pending.current) return;
    const run = ++generation.current;
    const active = () => mounted.current && generation.current === run;
    pending.current = true;
    setBusy(true);
    setNotice('Menyiapkan musik…');
    try {
      engine.current ??= new MoodMusic();
      const started = await engine.current.start(preset, volume / 100);
      if (!active() || !started) return;
      if (remaining === 0) setRemaining(300);
      playback.current = true;
      setPlaying(true);
      callbacks.current.onPlaybackChange(true);
      setNotice(`${selected.title} sedang menemanimu.`);
    } catch (error) {
      if (active()) setNotice(error instanceof Error ? error.message : 'Musik belum bisa diputar. Coba lagi.');
    } finally { if (active()) { pending.current = false; setBusy(false); } }
  }

  return <section className={`mood-room mood-room--${preset}`} aria-labelledby="mood-room-title">
    <div className="mood-room-heading"><div><p className="mood-room-eyebrow">MUSIK, TEMAN, DAN RUANG KECILMU</p><h2 id="mood-room-title">Masuk ke Mood Room <span aria-hidden="true">✦</span></h2></div><span className="mood-room-pill">Instrumental original</span></div>
    <p className="mood-room-intro">Mau ditemani suasananya, mengambil jeda, atau menikmati nada ceria? Kamu yang memilih.</p>
    <div className="mood-room-presets" role="group" aria-label="Pilih suasana musik">
      {rooms.map(room => <button type="button" key={room.id} className={`mood-room-preset ${preset === room.id ? 'is-selected' : ''}`} aria-pressed={preset === room.id} onClick={() => {
        stop('Suasana dipilih. Ketuk Putar musik untuk mulai.');
        setPreset(room.id); setRemaining(300); onMoodChange(room.mood);
      }}><span className="mood-room-icon" aria-hidden="true">{room.icon}</span><strong>{room.title}</strong><span>{room.detail}</span></button>)}
    </div>
    <div className="mood-room-player">
      <div className={`mood-room-wave ${playing ? 'is-playing' : ''}`} aria-hidden="true">{Array.from({ length: 16 }, (_, index) => <i key={index} style={{ animationDelay: `${index * 0.08}s`, height: `${12 + ((index * 13) % 30)}px` }} />)}</div>
      <div className="mood-room-player-copy"><strong>{selected.title}</strong><span>{playing ? 'Sedang diputar' : 'Siap menemanimu'}{timer ? ` · ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}` : ''}</span></div>
      <button type="button" className="mood-room-play" onClick={() => void play()} disabled={busy}><span aria-hidden="true">{playing ? 'Ⅱ' : '▶'}</span> {busy ? 'Menyiapkan…' : playing ? 'Jeda musik' : 'Putar musik'}</button>
    </div>
    <div className="mood-room-options">
      <label className="mood-room-volume">Volume <input type="range" min="0" max="100" value={volume} onChange={event => { const value = Number(event.target.value); setVolume(value); engine.current?.setVolume(value / 100); }} aria-label="Volume musik" /><span>{volume}%</span></label>
      <label><input type="checkbox" checked={only} onChange={event => { setOnly(event.target.checked); onMusicOnlyChange(event.target.checked); }} /> Musik saja</label>
      <label><input type="checkbox" checked={timer} onChange={event => { setTimer(event.target.checked); setRemaining(300); }} /> Sesi 5 menit</label>
    </div>
    <p className="mood-room-status" role="status">{notice}</p>
    <p className="mood-room-footnote">Tanpa autoplay. Musik berhenti saat halaman ditinggalkan. Suasana dipilih olehmu, bukan diagnosis perasaan.</p>
  </section>;
}
