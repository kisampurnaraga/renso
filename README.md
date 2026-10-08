# Renso — Resonansi Soul

Teman AI dengan karakter balok 3D, aura interaktif, audio, dan langkah kecil untuk keseharian. Desain karakter orisinal; tidak menggunakan aset LEGO atau Roblox.

Repository: https://github.com/kisampurnaraga/renso

Ruang tim tersedia di `/#/team`. Chat menyusun pekerjaan; antrean pemilik dapat menyimpan tugas di Neon dan mengirimkannya ke worker GitHub Actions untuk membuat draft PR beserta validasi. Konfigurasi akses pemilik dan worker wajib diaktifkan sebelum digunakan: [AGENT_WORKER.md](docs/AGENT_WORKER.md).

## Status v0.1

Fondasi MVP yang dapat dijalankan lokal. **Belum merupakan layanan produksi berbayar.**

Berfungsi: Teduh dan Spark, avatar 3D dengan fallback ringan, tiga warna aura pilihan pengguna, percakapan tamu, timer aktivitas 1–2 menit, pembacaan respons menggunakan suara perangkat, penghapusan sesi, kuota API, manifest PWA dan halaman offline.

Tanpa kredensial, UI menampilkan **mode demo** dengan respons skenario. Database lokal sementara berada di memori dan hilang ketika server berhenti. Dengan `DATABASE_URL`, aplikasi menggunakan PostgreSQL. Backend mendukung Groq (`AI_PROVIDER=groq`, `GROQ_API_KEY`, `GROQ_MODEL`) dan OpenAI lama (`AI_PROVIDER=openai`). Groq input suara memerlukan `GROQ_TRANSCRIPTION_MODEL` terpisah. Panduan aktivasi ada di [GROQ_SETUP.md](docs/GROQ_SETUP.md). Percakapan AI memerlukan internet. Suara Indonesia bergantung pada layanan suara perangkat; suara unik tiap karakter belum tersedia. Aura Scan opsional tersedia untuk gerakan ekspresi wajah lokal; lihat bagian Mood Room dan Aura Scan.

## Jalankan

Node.js 22.12+ atau 24 disarankan.

```bash
npm ci
cp .env.example .env
npm run server
# Terminal lain:
npm run dev
```

Buka `http://localhost:5173`. Vite meneruskan `/api` ke backend port 3001.

```bash
npm test
npm run build
```

Untuk menyajikan hasil build, jalankan backend dengan `APP_ORIGIN=http://localhost:3001` pada pengujian lokal, lalu buka port 3001. Mode produksi mewajibkan origin HTTPS dan database persisten.

## Database gratis: Neon PostgreSQL

Pilihan awal adalah Neon Free, dengan batas penyimpanan dan compute sesuai paket aktif. Paket gratis bukan jaminan seluruh biaya aplikasi gratis; pemakaian AI, hosting, dan suara terpisah. Referensi: https://neon.com/pricing dan https://neon.com/blog/neon-free-plan-1-gb-per-project (2 Oktober 2026).

1. Buat project Neon Free melalui akun pemilik.
2. Salin connection string yang disediakan Neon (termasuk parameter TLS) ke `DATABASE_URL` di `.env` atau secret manager hosting.
3. Jalankan `npm run db:migrate`.
4. Jalankan server; `/api/status` harus menampilkan `database: postgresql`.

Jangan memasukkan `.env`, connection string, atau API key ke GitHub. Jangan menaruh secret pada variabel dengan prefiks `VITE_`. Migrasi menggunakan query parameterized dan tidak menyimpan isi percakapan. Pengujian database Neon langsung belum dilakukan tanpa kredensial.

## Preview frontend di Vercel

Import repository ini sebagai project Vite, build `npm run build`, output `dist`, install `npm ci`, Node.js 24. Tambahkan environment variable publik `VITE_RENSO_MODE=demo` untuk Preview. Konfigurasi platform tersedia di `vercel.json`.

Mode ini menjalankan respons demo di browser dan tidak membutuhkan backend/database. Avatar, aura, timer, chat skenario dan audio perangkat dapat diuji. Label preview selalu terlihat; mikrofon/transkripsi dan AI langsung belum aktif. Entry point `api/[...path].js` tersedia untuk Vercel. Untuk mengaktifkan backend, pasang secret provider, database yang sudah dimigrasi, origin HTTPS yang tepat, gunakan `VITE_RENSO_MODE=api`, lalu rebuild; lihat [panduan Groq](docs/GROQ_SETUP.md).

Pengujian lokal mode frontend-only:

```bash
VITE_RENSO_MODE=demo npm run build
npm run dev -- --mode development
```

Untuk development frontend-only, set `VITE_RENSO_MODE=demo` pada `.env` lokal juga. File `.env` tidak boleh masuk GitHub. Preview Vercel mungkin membutuhkan login pemilik sesuai pengaturan perlindungan deployment.

## Agent dan audio

Konfigurasi agent dan batas perilakunya berada di `server/agents.mjs`. Server membentuk instruksi sistem sendiri; client tidak boleh mengirim role `system`. History maksimum enam pesan. Pesan baru maksimum 2.000 karakter.

Chat AI: transkrip/teks → backend → model → teks → speech synthesis perangkat. Input suara: izin eksplisit → rekaman maksimal 30 detik → backend → transkripsi → pengguna memeriksa teks → kirim chat. Rekaman tidak disimpan oleh aplikasi. Pemrosesan dan retensi penyedia AI/layanan suara perangkat harus dinilai sebelum peluncuran.

Warna aura adalah representasi suasana yang dipilih pengguna. Tidak ada diagnosis, pembacaan aura ilmiah, inferensi kepribadian dari wajah, atau identifikasi biometrik.

## Batas sebelum publikasi komersial

- Sesi tamu saat ini bukan akun pengguna permanen; kuota per sesi tidak mencegah semua penyalahgunaan oleh orang yang membuat sesi baru. Tambahkan verifikasi akun, batas global biaya, dan proteksi bot sebelum membuka AI berbayar ke publik.
- Rate limit lokal perlu penyimpanan bersama ketika memakai beberapa instance.
- Belum ada subscription, pembayaran, push notification, dashboard admin, APK Android, voice realtime, Kiko atau Sapa.
- Penghapusan sesi menghapus data aplikasi; tidak menjamin penghapusan data yang telah diproses penyedia eksternal.
- Uji evaluasi agent, kebijakan privasi, penanganan percakapan berisiko, dan dukungan pengguna sebelum produksi.
- Uji Android nyata untuk mikrofon, suara Indonesia, WebGL, dan instalasi PWA. Ikon PNG 192/512 tersedia; pemasangan tetap perlu diuji di perangkat nyata.

## Struktur

```text
src/             React UI, avatar dan audio perangkat
server/          Fastify, agent, provider adapter, sesi dan kuota
db/              Migrasi PostgreSQL
public/          Manifest, favicon, offline page dan service worker
docs/            Arsitektur dan roadmap
```

## Mood Room dan Aura Scan

Mood Room memainkan instrumental yang disintesis di browser dengan Web Audio. Pengguna harus menekan putar; tersedia pilihan suasana, volume, dan mode musik saja. Audio berhenti saat halaman disembunyikan. Gerakan avatar saat musik diputar adalah animasi ritmis, bukan analisis beat dari mikrofon.

Aura Scan meminta izin kamera secara eksplisit. MediaPipe Face Landmarker mendeteksi titik wajah dan koefisien gerakan senyum secara lokal. Scan membutuhkan framing wajah yang cukup baik; hasil deskriptif dapat berupa “Gerak senyum terlihat” atau “Ekspresi belum jelas”. Pengguna mengonfirmasi kebutuhan, memilih booster, lalu preset Mood Room disiapkan tanpa autoplay. Kamera bukan MRI dan fitur ini tidak memastikan emosi, kepribadian, atau kondisi medis. Ambang gerakan adalah heuristik produk, belum divalidasi pada wajah nyata. Foto/video dan koefisien tidak diunggah maupun disimpan. Engine WASM diunduh dari jsDelivr dan model dari Google; jaringan pertama dan dukungan browser memengaruhi ketersediaan. Jika kamera atau model gagal, pemilihan suasana manual tetap tersedia. Kamera dihentikan ketika scanner ditutup atau halaman disembunyikan. Riset, lisensi dan batas pengujian ada di [FACE_SCAN.md](docs/FACE_SCAN.md).

Panduan pilot dan pembagian kerja agent tersedia di `docs/GO_TO_MARKET.md` dan `docs/AGENT_TEAM.md`. Agent tim bekerja saat tugas dijalankan, belum menjadi layanan otomatis yang aktif sepanjang waktu.

## Kerja ditemani Renso

Pilih Santai atau Ceria di kartu avatar, atau pilih musik Sinar kecil. Ceritakan aktivitas lewat kolom aktivitas atau chat. Desain, coding, menulis, dan belajar memiliki visual kantor 3D; aktivitas lain diberi label pengguna dengan ruang kerja umum. Pilihan laptop/komputer dan tombol Akhiri tersedia. Pemetaan aktivitas saat ini berbasis kata kunci lokal, bukan AI generatif pembuat adegan. Chat preview tetap demo. Mode ringan tetap dapat dipilih untuk perangkat yang kesulitan menampilkan 3D.

Ruang aktivitas memiliki dekorasi tersendiri: studio desain, ruang coding, sudut menulis, dan ruang belajar. Nama ruang serta alat kerjanya ditampilkan di kartu avatar. Aktivitas yang belum dikenali tetap memakai ruang kerja umum.

## Kontribusi dan komunitas

Kode Renso memakai [lisensi MIT](LICENSE). Kontribusi manusia dan agent AI disambut melalui issue dan pull request. Baca [panduan kontribusi](CONTRIBUTING.md), [komunitas](docs/COMMUNITY.md), dan [kode etik](CODE_OF_CONDUCT.md). Usulan fitur baru, optimasi, riset audio, ruang aktivitas, aksesibilitas, dan marketing dapat diajukan; perubahan ditinjau sebelum digabung.

Status akses repository ditentukan di GitHub Settings. Lisensi ini tidak otomatis mengubah repository privat menjadi publik. Dependensi, model MediaPipe, font, serta layanan AI memiliki ketentuan masing-masing; lisensi MIT Renso mencakup kode yang dibuat dalam proyek ini.
