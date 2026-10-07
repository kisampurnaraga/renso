# Arsitektur Renso

## Platform

React + TypeScript + Vite untuk PWA. Three.js + React Three Fiber untuk karakter orisinal dan aura. Fastify Node.js untuk backend. PostgreSQL Neon Free untuk data sesi dan kuota. Database diakses hanya dari backend. Hosting belum dipilih atau diprovisikan.

## Alur

1. Browser memperoleh sesi tamu melalui cookie HttpOnly, SameSite Strict.
2. Token acak hanya dikirim melalui cookie; database menyimpan hash SHA-256, bukan token.
3. Browser memilih suasana dan agent. Kamera tidak dijalankan.
4. Backend memvalidasi origin, cookie, payload dan kuota harian UTC.
5. Satu agent aktif membentuk instruksi dan memanggil model yang dipilih operator. Demo dikembalikan hanya jika penyedia belum dikonfigurasi, dengan label eksplisit.
6. Browser menampilkan hasil; suara dibaca hanya setelah tindakan pengguna. Aura berdenyut ketika audio berbicara, belum memakai phoneme/viseme lip-sync.
7. Isi percakapan hanya disimpan dalam state tab dan history terbatas dikirim saat chat. Preferensi warna/mode ringan disimpan lokal; tidak ada analitik pihak ketiga.

## API

| Endpoint | Fungsi |
|---|---|
| GET /api/status | Mode demo/live, jenis persistence, agent yang tersedia |
| POST /api/session | Buat/lanjutkan sesi tamu, origin wajib cocok |
| DELETE /api/session | Hapus sesi dan data penggunaan terkait |
| POST /api/chat | Pesan tervalidasi, agent, suasana dan history terbatas |
| POST /api/transcribe | Rekaman audio terbatas, izin diminta client |

Transkripsi dan chat sama-sama menghitung satu reservasi kuota, sehingga percakapan dengan rekaman membutuhkan dua unit. Kegagalan provider mengembalikan reservasi. Batas global biaya dan akun diperlukan sebelum komersialisasi.

## Data

`guest_sessions`: UUID, hash token, waktu dibuat, expiry 24 jam.

`daily_usage`: session UUID, hari UTC dan jumlah permintaan. Foreign key cascade menghapus usage saat sesi dihapus. Kuota PostgreSQL direservasi atomik melalui INSERT ... ON CONFLICT; session expiry dibersihkan setiap jam.

Sistem tidak menyimpan gambar kamera, rekaman suara atau isi chat di PostgreSQL. Penyedia AI memproses pesan/audio pada mode live sesuai ketentuannya sendiri.

## Tahap berikutnya

1. Provision Neon, uji migrasi dan penghapusan di PostgreSQL nyata.
2. Verifikasi provider AI, evaluasi respons Indonesia dan ukur biaya sesi.
3. Akun permanen, batas global pemakaian, subscription, dashboard admin dengan role dan audit event.
4. Voice khusus karakter dan realtime dengan kredensial sementara backend.
5. Kamera opsional: MediaPipe lokal untuk gerakan ekspresi avatar; suasana dikonfirmasi pengguna, tanpa inferensi perasaan/kepribadian dari bentuk wajah.
6. Capacitor Android, notifikasi opt-in dan uji perangkat; kebijakan pembayaran toko diperiksa sebelum rilis.

Tidak ada klaim bahwa fitur tahap berikutnya telah dibangun atau terhubung.
