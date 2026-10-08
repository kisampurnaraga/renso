# Renso — tim agent dan pembagian kerja

## Cara kerja

Tim agent bekerja saat ada tugas yang diberikan, dengan hasil berupa kode, pengujian, atau materi yang dapat ditinjau. Tim ini belum merupakan perusahaan yang berjalan terus-menerus. Operasi terjadwal memerlukan layanan, pemicu, pemantauan, biaya, dan batas tindakan yang dikonfigurasi. Otomatisasi tidak menjamin pendapatan.

Pembagian berikut dapat digunakan untuk sprint selanjutnya; peran tidak berarti semua agent sudah aktif atau terhubung ke layanan eksternal.

| Peran | Tanggung jawab | Hasil yang dapat diperiksa |
|---|---|---|
| Arsitek & Release Lead | Arsitektur, dependensi lintas tim, hambatan dan kesiapan sampai rilis | Rencana versi, briefing per tim, keputusan go/no-go dan bukti rilis |
| Product Research | Kebutuhan pengguna, hipotesis, riset dan rekomendasi prioritas | Rencana wawancara, ukuran keberhasilan, temuan berbukti |
| Frontend / pengalaman | Mood Room, gradien ceria, avatar, responsif, aksesibilitas | Komponen dan alur yang dapat dicoba |
| Audio | Musik original/prosedural, kontrol volume, jeda, penghentian | Pemutar dan pemeriksaan perilaku audio |
| Kamera / interaksi | Izin kamera, pemrosesan lokal, landmark, konfirmasi suasana | Pemindaian opsional tanpa diagnosis |
| Backend / AI | Agent percakapan, batas penggunaan, sesi, integrasi layanan | API dan konfigurasi yang teruji |
| QA / auditor | Menguji HP dan desktop, kegagalan izin, audio, privasi, regresi | Catatan hasil dan masalah prioritas |
| Manajer Marketing | Segmentasi, positioning, kanal, pilot dan metrik pemasaran | Rencana pilot, draft kampanye dan batas biaya |
| Content | Naskah, storyboard, materi demonstrasi produk | Draft yang siap ditinjau |
| Growth / analitik | Mendefinisikan peristiwa, retensi, eksperimen harga | Definisi metrik dan laporan eksperimen |
| Support / operasional | Panduan penggunaan, FAQ, pengelompokan masalah | Draft jawaban dan daftar masalah |

## Alur sprint

1. Koordinator menetapkan tugas, kriteria selesai, dan kepemilikan file.
2. Agent menjalankan tugas independen secara paralel; perubahan yang bergantung pada hasil lain dijalankan berurutan.
3. Koordinator mengintegrasikan perubahan dan menyelesaikan konflik.
4. QA memeriksa build, perilaku utama, dan batas fitur yang diklaim.
5. Hasil dilaporkan sebagai selesai, demo, belum tersedia, atau terblokir dengan bukti yang sesuai.

## Batas tindakan

- Agent boleh menyusun kode dan draft dalam lingkup tugas yang telah diizinkan.
- Publikasi, pengiriman pesan, balasan kepada pelanggan, pembelian iklan, penagihan, dan akses akun baru memerlukan instruksi eksplisit.
- Jangan meminta API key atau kata sandi di chat. Gunakan mekanisme rahasia atau autentikasi yang sesuai.
- Jangan mengklaim kamera membaca perasaan secara pasti. Suasana akhir ditentukan pengguna.
- Musik harus original atau memiliki hak penggunaan yang sesuai. Materi promosi harus mencerminkan kemampuan produk yang benar-benar tersedia.
- Agent tidak mengakses proyek atau riwayat pengguna lain untuk menjalankan Renso.

## Prioritas tim berikutnya

Pertama, selesaikan Mood Room dan pemindaian opsional yang nyaman digunakan. Berikutnya, tim Marketing, Content, dan Growth menyiapkan pilot sesuai [rencana uji pasar](GO_TO_MARKET.md). Tim Support menyiapkan FAQ sebelum peserta masuk. Rekrutmen dan publikasi dimulai setelah ada instruksi dan produk siap diuji.

Panduan penanggung jawab sampai rilis dan aktivasi peran: [RELEASE_PLAYBOOK.md](RELEASE_PLAYBOOK.md).
