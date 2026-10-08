import { useEffect, useRef, useState } from 'react';
import type { FaceLandmarker } from '@mediapipe/tasks-vision';
import './aura-scanner.css';
import { faceQuality, smileMovement, expressionObservation, boosterForNeed } from './face-expression.mjs';

type Mood = 'blue' | 'green' | 'red';
type Phase = 'idle' | 'loading' | 'scanning' | 'done' | 'error';
const OPTIONS: { mood: Mood; label: string; description: string }[] = [
  { mood: 'blue', label: 'Tenang', description: 'Aku ingin suasana lembut dan nyaman.' },
  { mood: 'green', label: 'Segar', description: 'Aku ingin jeda dan ruang bernapas.' },
  { mood: 'red', label: 'Berenergi', description: 'Aku ingin musik dan semangat baru.' },
];

export default function AuraScanner({ onSelect, onClose }: { onSelect: (mood: Mood) => void; onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [message, setMessage] = useState('Kamera hanya aktif setelah kamu mengizinkannya.');
  const [progress, setProgress] = useState(0);
  const [observation, setObservation] = useState<string | null>(null);
  const [need, setNeed] = useState('');
  const [aspect, setAspect] = useState(4 / 3);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modelRef = useRef<FaceLandmarker | null>(null);
  const rafRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);
  const mounted = useRef(false);

  function release() {
    generation.current++;
    cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) { videoRef.current.pause(); videoRef.current.srcObject = null; }
    modelRef.current?.close();
    modelRef.current = null;
    const canvas = canvasRef.current;
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
  }

  useEffect(() => {
    mounted.current = true;
    function hidden() {
      if (document.visibilityState === 'hidden' && (streamRef.current || timerRef.current)) {
        release();
        setPhase('error');
        setMessage('Kamera dihentikan saat kamu meninggalkan halaman. Mulai lagi ketika siap.');
      }
    }
    document.addEventListener('visibilitychange', hidden);
    return () => { mounted.current = false; document.removeEventListener('visibilitychange', hidden); release(); };
  }, []);

  function manual() { release(); setObservation(null); setNeed(''); setPhase('done'); setMessage('Tanpa kamera juga bisa. Kamu yang menentukan suasanamu.'); }
  function choose(mood: Mood) { release(); onSelect(mood); }

  async function start() {
    release();
    const run = generation.current;
    const active = () => mounted.current && generation.current === run;
    const fail = (text: string) => { if (!active()) return; release(); setPhase('error'); setMessage(text); };
    setPhase('loading');
    setProgress(0);
    setObservation(null);
    setNeed('');
    setMessage('Izinkan kamera, lalu tunggu pemindai siap.');
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      fail('Browser ini belum mendukung kamera di halaman ini. Gunakan HTTPS atau pilih suasana tanpa kamera.');
      return;
    }
    // A permission prompt can remain open indefinitely. Invalidate this run and
    // stop any late-arriving stream rather than activating a camera after timeout.
    timerRef.current = setTimeout(() => fail('Pemindai belum siap. Periksa izin kamera atau coba lagi. Kamu tetap bisa memilih suasana.'), 30000);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 360 } }, audio: false });
      if (!active()) { stream.getTracks().forEach(track => track.stop()); return; }
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) { fail('Pratinjau kamera belum siap. Silakan coba lagi.'); return; }
      video.srcObject = stream;
      await video.play();
      if (!active()) return;
      setMessage('Menyiapkan deteksi titik wajah di perangkatmu…');
      const { FaceLandmarker: Landmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
      if (!active()) return;
      const files = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.0/wasm');
      if (!active()) return;
      const detector = await Landmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task', delegate: 'CPU' },
        runningMode: 'VIDEO', numFaces: 1,
        minFaceDetectionConfidence: 0.6, minFacePresenceConfidence: 0.6, minTrackingConfidence: 0.6,
        outputFaceBlendshapes: true,
      });
      if (!active()) { detector.close(); return; }
      modelRef.current = detector;
      if (timerRef.current) clearTimeout(timerRef.current);
      setPhase('scanning');
      setMessage('Posisikan wajah di tengah dengan cahaya yang cukup.');
      const started = performance.now();
      let lastInference = -Infinity, lastFrame = -1, goodFrames = 0;
      let samples: number[] = [];
      timerRef.current = setTimeout(() => fail('Wajah belum terdeteksi dengan cukup jelas. Tambahkan cahaya, coba lagi, atau pilih suasana tanpa kamera.'), 12000);
      function frame(now: number) {
        if (!active()) return;
        try {
          if (video && video.readyState >= 2 && video.videoWidth && now - lastInference >= 125 && video.currentTime !== lastFrame) {
            lastInference = now;
            lastFrame = video.currentTime;
            const result = detector.detectForVideo(video, now);
            const landmarks = result.faceLandmarks[0];
            const canvas = canvasRef.current;
            if (canvas) {
              canvas.width = video.videoWidth; canvas.height = video.videoHeight;
              setAspect(video.videoWidth / video.videoHeight);
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                if (landmarks) {
                  ctx.fillStyle = '#a6ffe4';
                  // Every point comes from the model output; no decorative fake landmarks.
                  for (let i = 0; i < landmarks.length; i += 3) {
                    const point = landmarks[i];
                    ctx.beginPath(); ctx.arc(point.x * canvas.width, point.y * canvas.height, 1.5, 0, Math.PI * 2); ctx.fill();
                  }
                }
              }
            }
            if (faceQuality(landmarks)) {
              goodFrames++;
              const smile = smileMovement(result.faceBlendshapes?.[0]?.categories);
              if (smile !== null) samples.push(smile);
              setMessage('Wajah berada di tengah. Mengamati gerakan ekspresi di perangkatmu…');
              setProgress(Math.min(100, Math.round(goodFrames / 20 * 100)));
              if (goodFrames >= 20 && now - started >= 2500) {
                const label = expressionObservation(samples);
                release();
                setObservation(label);
                setPhase('done');
                setMessage('Scan selesai. Bagaimana perasaanmu dan apa yang kamu butuhkan sekarang?');
                return;
              }
            } else {
              goodFrames = 0; samples = []; setProgress(0);
              setMessage(landmarks ? 'Posisikan seluruh wajah di tengah; jangan terlalu dekat atau jauh.' : 'Wajah belum terlihat. Hadapkan wajah ke kamera dengan cahaya cukup.');
            }
          }
          rafRef.current = requestAnimationFrame(frame);
        } catch { fail('Deteksi wajah belum bisa berjalan di perangkat ini. Kamu bisa coba lagi atau pilih suasana langsung.'); }
      }
      rafRef.current = requestAnimationFrame(frame);
    } catch (error) {
      const name = error instanceof DOMException ? error.name : '';
      fail(name === 'NotAllowedError' ? 'Kamera tidak diizinkan. Ubah izin browser jika ingin mencoba lagi, atau lanjut tanpa kamera.' : name === 'NotFoundError' ? 'Kamera tidak ditemukan. Kamu tetap bisa memilih suasana langsung.' : 'Pemindai tidak berhasil dimuat. Periksa koneksi dan kamera, atau lanjut tanpa kamera.');
    }
  }

  const recommended = boosterForNeed(need);
  const live = phase === 'loading' || phase === 'scanning';
  return <section className="aura-scanner">
    <p className="eyebrow">AURA SCAN · PILIH SUASANAMU</p>
    <h2 id="modal-title">Ruang kecil untuk merasakan dirimu</h2>
    <p className="scan-explainer">Pemindai mengamati gerakan wajah, seperti senyum. Kamu mengonfirmasi kebutuhanmu untuk memilih mood booster. Ini bukan pembacaan pikiran, diagnosis, atau MRI.</p>
    <div className={`scan-preview ${live ? 'is-live' : ''}`} style={{ aspectRatio: aspect }}>
      <video ref={videoRef} muted playsInline aria-label="Pratinjau kamera lokal" className={live ? '' : 'scan-video-hidden'} />
      <canvas ref={canvasRef} aria-hidden="true" />
      {live ? <div className="scan-line" aria-hidden="true" /> : <div className="scan-placeholder" aria-hidden="true"><span>◎</span><small>{phase === 'done' ? 'Kamera sudah berhenti' : 'Kamera belum aktif'}</small></div>}
      <div className="scan-corners" aria-hidden="true" />
      <span className="scan-local">{live ? 'LOKAL · TANPA REKAMAN' : 'PRIVAT · DI PERANGKATMU'}</span>
    </div>
    <p className="scan-status" role="status">{message}</p>
    {phase === 'scanning' ? <progress value={progress} max={100} aria-label="Kemajuan deteksi titik wajah" /> : null}
    <p className="scan-privacy">Foto, video, titik wajah, dan koefisien ekspresi tidak disimpan atau dikirim. Pemindai mengunduh mesin dan model dari CDN jsDelivr dan Google; koneksi ini mengikuti kebijakan penyedianya. Kamera berhenti setelah selesai atau saat kamu menutupnya.</p>
    {phase !== 'done' ? <div className="scan-actions">
      <button className="primary" disabled={live} onClick={() => void start()}>{phase === 'error' ? 'Coba pindai lagi' : live ? 'Pemindai sedang aktif…' : 'Izinkan kamera & mulai'}</button>
      <button className="scan-secondary" onClick={manual}>{live ? 'Hentikan & pilih suasana' : 'Pilih tanpa kamera'}</button>
    </div>  : <div className="scan-moods">
      {observation ? <div className="scan-observation"><strong>{observation}</strong><p>Ini hanya gerakan yang terlihat, bukan kepastian perasaanmu.</p></div> : null}
      <h3>Apa yang kamu butuhkan sekarang?</h3>
      <div className="scan-needs" aria-label="Kebutuhan yang kamu rasakan">{[{ id: 'pause', label: 'Butuh jeda' }, { id: 'start', label: 'Sulit mulai' }, { id: 'cheerful', label: 'Ingin ceria' }].map(item => <button key={item.id} className="scan-secondary" aria-pressed={need === item.id} onClick={() => setNeed(item.id)}>{item.label}</button>)}</div>
      {recommended ? <p className="scan-recommendation" role="status">Pilihanmu cocok ditemani suasana {OPTIONS.find(option => option.mood === recommended)?.label.toLowerCase()}. Kamu tetap bebas memilih lainnya.</p> : <p className="scan-recommendation">Pilih kebutuhanmu untuk mendapat saran, atau langsung pilih suasana.</p>}
      <h3>Pilih mood booster</h3>
      {OPTIONS.map(option => <button key={option.mood} className={`scan-mood scan-${option.mood} ${recommended === option.mood ? 'is-recommended' : ''}`} onClick={() => choose(option.mood)}><span aria-hidden="true" className="scan-dot" /><span><strong>{option.label}{recommended === option.mood ? ' · Disarankan' : ''}</strong><small>{option.description}</small></span><span aria-hidden="true">→</span></button>)}<button className="scan-secondary" onClick={() => void start()}>Pindai lagi</button>
    </div>}
    <button className="scan-secondary scan-close" onClick={() => { release(); onClose(); }}>Tutup pemindai</button>
  </section>;
}
