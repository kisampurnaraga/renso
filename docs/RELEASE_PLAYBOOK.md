# Renso — kepemimpinan produk sampai rilis

## Tiga penanggung jawab

| Agent | Tanggung jawab | Target dan keluaran |
|---|---|---|
| Arsitek & Release Lead | Otak arsitektur dan koordinasi sampai rilis | Satu rencana versi dengan tugas, pemilik, dependensi, kriteria selesai, hambatan dan keputusan go/no-go berbukti |
| Product Research | Memastikan kebutuhan pengguna menjadi dasar prioritas | Lima pertanyaan wawancara, tiga hipotesis, ukuran keberhasilan dan rekomendasi prioritas; temuan hanya jika ada data yang sah |
| Manajer Marketing | Segmentasi, positioning dan rencana penjualan/pilot | Rencana pilot tujuh hari untuk 20–30 pengguna dewasa, kanal, pesan, metrik aktivasi/retensi dan batas biaya; target bukan hasil |

Tim Backend, Pengalaman emosional, Audio, Visual, Scanner dan QA mengerjakan tugas teknis; Komunitas menyiapkan kontribusi. Arsitek melihat seluruh catatan tugas publik ketika chat, sedangkan peran lain melihat tugas perannya.

## Alur kerja yang tersedia

1. Buka `/#/team`, pilih Arsitek dan minta rencana versi. Sebutkan tujuan, prioritas dan batas ruang lingkup.
2. Arsitek menyusun briefing per tim: masalah, keluaran, file terkait, dependensi dan kriteria lulus. Chat menghasilkan usulan, bukan pengiriman tugas otomatis.
3. Pemilik menyimpan satu tugas kecil untuk satu tim dan mengirim worker. Kerjakan dependensi lebih dahulu; jangan menugaskan perubahan file yang sama secara bersamaan.
4. Worker menghasilkan perubahan terbatas, menjalankan tes/build dan membuat draft PR. Periksa status melalui tombol pemeriksaan dan tautan Actions/PR.
5. QA menguji perilaku yang berubah dan merekam bukti. Arsitek merangkum kesiapan versi; pemilik mengambil keputusan penggabungan dan rilis.
6. Setelah penggabungan, periksa commit yang benar pada deployment produksi dan uji alur utama. Perbarui catatan tugas berdasarkan bukti.

## Kriteria rilis

- Lingkup versi dan kriteria penerimaan tertulis; tidak ada hambatan kritis yang belum selesai.
- PR ditinjau, tes/build lulus pada commit yang akan dirilis.
- Alur chat, sesi, musik, aktivitas, serta kantor dan antrean yang berubah diuji; tandai pengujian HP fisik yang masih belum dilakukan.
- Deployment produksi berstatus Ready dan menunjuk commit yang telah disetujui; Ready sendiri tidak membuktikan semua alur aplikasi sehat.
- Smoke test setelah deployment memiliki tanggal, perangkat, hasil dan tautan bukti.
- Catat versi sebelumnya serta langkah rollback, dan ringkasan perubahan untuk pengguna.

Jika satu syarat belum terbukti, keputusan: **perlu validasi** atau **no-go**, dengan penanggung jawab dan tindakan berikutnya. Dokumentasi ini merupakan prosedur, bukan mekanisme penggabungan/deployment otomatis atau pemeriksaan CI yang wajib.

## Aktivasi dua peran baru pada database

Login dan peran lama tetap memakai tabel yang sama. Untuk menyimpan tugas `architect` dan `research`, jalankan `db/003_team_leadership.sql` di Neon SQL Editor pada database Renso. File ini satu perintah ALTER TABLE sehingga dapat dijalankan sebagai prepared statement. Tidak menghapus tugas yang ada. Alternatif: `npm run db:migrate` dengan koneksi database yang sudah dikonfigurasi secara aman.

Chat dan pilihan peran memakai data aplikasi; penyimpanan tugas baru memerlukan migrasi. Jangan menempelkan connection string, kunci pemilik atau API key ke chat/tugas.

## Batas operasional

Agent tersedia ketika ditugaskan. Arsitek tidak menjalankan agent lain melalui chat dan tidak memiliki kewenangan merge otomatis. Worker tetap membuat draft PR, tidak merilis sendiri. Marketing/Research dapat menghasilkan dokumen dan materi; wawancara, kampanye, email, rekrutmen dan belanja memerlukan layanan serta instruksi pelaksanaan yang sesuai. Jangan mengklaim pengguna, penjualan atau hasil penelitian tanpa bukti.
