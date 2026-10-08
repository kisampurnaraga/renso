# Chat Groq untuk Renso

Adapter Groq tersedia pada backend Fastify. Preview frontend tetap demo sampai credential dan database dipasang; file kode saja tidak mengaktifkan layanan AI.

## Konfigurasi

1. Buat API key pada [Groq Console](https://console.groq.com/keys). Simpan langsung sebagai secret hosting atau `.env` lokal, bukan melalui chat atau commit.
2. Pilih model yang tersedia pada akun. Kandidat awal `openai/gpt-oss-20b` tercantum pada katalog dan batas paket gratis saat riset 8 Oktober 2026. Kualitas bahasa Indonesia dan respons Renso belum diuji langsung. Ketersediaan dan kuota dapat berubah.
3. Pasang variabel server berikut:

```env
AI_PROVIDER=groq
GROQ_API_KEY=<secret pada hosting>
GROQ_MODEL=openai/gpt-oss-20b
GROQ_TRANSCRIPTION_MODEL=whisper-large-v3-turbo
DAILY_CHAT_LIMIT=20
```

Transkripsi opsional; kosongkan `GROQ_TRANSCRIPTION_MODEL` untuk menonaktifkan input suara. Audio keluaran masih menggunakan suara perangkat. Chat dan transkripsi memiliki batas penyedia terpisah.

## Lokal

Set `VITE_RENSO_MODE=api`, jalankan `npm run server` dan `npm run dev`. Backend lokal boleh memakai store sementara untuk pengujian. `/api/status` menampilkan `provider: groq` dan `ai: live` bila key/model terpasang; status ini menunjukkan konfigurasi, bukan bukti API key berhasil atau kuota masih tersedia. Uji satu pesan untuk memverifikasi koneksi.

## Vercel

Entry point `api/[...path].js` meneruskan request ke backend. Sebelum mengganti preview menjadi API:

- Provision Neon PostgreSQL, simpan `DATABASE_URL` sebagai secret dan jalankan `npm run db:migrate`.
- Pasang `APP_ORIGIN` dengan origin HTTPS yang tepat dari URL deployment/domain yang dipakai, tanpa slash akhir. Backend menolak POST dari origin lain.
- Pasang konfigurasi Groq di environment Preview, lalu `VITE_RENSO_MODE=api` dan redeploy. Jangan gunakan prefix `VITE_` untuk secret.
- Uji `/api/status`, pembuatan sesi, chat, penghapusan, dan transkripsi jika aktif. Jangan membuka AI publik berbayar sebelum proteksi biaya global dan rate limit bersama tersedia.

Produksi menolak startup tanpa origin HTTPS dan database persisten. Sesi/kuota tidak boleh bergantung pada memori instance serverless. Batas request adapter 4 MiB; frontend merekam maksimal 30 detik.

## Perilaku kesalahan dan privasi

Kuota provider habis: HTTP 429 dengan pesan yang bisa dipahami pengguna. Timeout/error provider: HTTP 503. Reservasi kuota sesi dikembalikan saat provider gagal. Tidak ada fallback tersembunyi ke balasan demo atau provider berbayar. Tidak ada failover otomatis yang mengirim cerita ke penyedia kedua.

Hanya pesan/history yang pengguna kirim dan rekaman transkripsi opsional diteruskan ke Groq. Foto, video, landmark dan blendshape scanner tidak dikirim ke Groq. Nilai API key tidak dikirim ke frontend. Kebijakan dan retensi Groq berlaku terpisah; sebelum pilot dengan cerita pribadi, tinjau [Your Data](https://console.groq.com/docs/your-data) dan pemberitahuan privasi Renso.

## Sumber resmi

- https://console.groq.com/docs/openai
- https://console.groq.com/docs/models
- https://console.groq.com/docs/rate-limits
- https://console.groq.com/docs/reasoning
- https://console.groq.com/docs/speech-to-text

Pengujian adapter menggunakan mock provider; belum ada panggilan Groq nyata tanpa API key.
