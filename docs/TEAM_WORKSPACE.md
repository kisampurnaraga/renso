# Ruang tim Renso

Buka `/#/team` atau tautan **Ruang tim** pada header. Halaman publik tersedia dalam bahasa Indonesia dan Inggris, dengan preferensi bahasa disimpan di perangkat. Antarmuka utama Renso belum sepenuhnya diterjemahkan.

## Yang bisa dipantau

Kantor 3D menampilkan delapan karakter balok original, workstation, area duduk, tanaman, dan jendela. Pilih model/meja atau tombol nama agent untuk menampilkan ringkasan dan menyaring tugas tim. Geser untuk memutar kamera, cubit/scroll untuk zoom; tombol reset mengembalikan sudut awal. Mode ringan menyediakan pilihan karakter tanpa WebGL. Reduced motion mengikuti preferensi perangkat.

Karakter adalah representasi visual peran tim. Animasi diam dan keberadaan model bukan indikator proses agent sedang berjalan. Musik/kamera/mikrofon tidak diaktifkan oleh kantor.

- Delapan peran tim, tanggung jawab, serta apakah peran bekerja saat ditugaskan atau masih direncanakan.
- Catatan tugas selesai, antrean, dan perlu validasi; filter, pencarian, tanggal pembaruan dalam WIB, dan tautan bukti kode/dokumentasi.
- Status aplikasi dari `/api/status`, diperiksa saat masuk dan setiap 60 detik ketika halaman terlihat. Pengguna juga dapat memeriksa ulang. Kegagalan pemeriksaan ditampilkan sebagai tidak tersedia, bukan status sehat lama.

## Batas sumber data

Papan tugas bersumber dari `src/team-workspace-data.ts`, diperbarui koordinator melalui commit dan deployment. Ini **bukan** telemetry pelaksanaan agent. Angka kartu menghitung tugas dalam catatan, bukan jam kerja, produktivitas, atau pendapatan. Tidak ada worker agent 24/7, tombol dispatch, atau sinkronisasi otomatis dengan sesi Codex/GitHub Issues.

`/api/status` membuktikan aplikasi merespons dan konfigurasi terbaca; tidak menjalankan percakapan Groq atau membuktikan setiap request berhasil. Keberhasilan chat produksi dicatat berdasarkan pengujian pengguna pada 8 Oktober 2026.

Halaman publik hanya menampilkan informasi proyek. Jangan menambahkan secret, isi percakapan, data pribadi peserta pilot, atau log sensitif pada dataset. Ruang pemilik privat dan dispatch agent memerlukan autentikasi/otorisasi serta layanan worker pada pengembangan berikutnya.

## Memperbarui pekerjaan

1. Tambahkan atau perbarui task: tim, status, ringkasan bilingual, waktu, dan bukti.
2. Gunakan `done` hanya untuk hasil yang telah diperiksa; `validation` untuk pengujian yang masih diperlukan; `queued` untuk usulan yang belum dilaksanakan.
3. Jalankan build dan pemeriksaan yang sesuai, kemudian deploy. Tanggal dataset menyatakan waktu review catatan, bukan waktu agent terakhir aktif.

## Bahasa

Bahasa Indonesia tetap default. Fondasi bilingual ruang tim sudah tersedia. Terjemahan seluruh produk, pilihan bahasa respons AI, dan keluaran suara per bahasa adalah pekerjaan terpisah yang tercatat dalam antrean. Bahasa tambahan dipilih berdasarkan pengguna pilot.
