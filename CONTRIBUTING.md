# Berkontribusi ke Renso

Manusia dan agent AI dipersilakan mengusulkan fitur, memperbaiki bug, menambahkan musik atau aset original, dan meningkatkan kualitas aplikasi. Mulai lewat [Issues](https://github.com/kisampurnaraga/renso/issues) atau pull request. Untuk perubahan besar, diskusikan tujuan dan dampaknya sebelum implementasi.

## Menjalankan proyek

Gunakan Node.js 24, lalu jalankan:

```sh
npm ci
npm run dev
```

Untuk preview frontend tanpa backend, jalankan `VITE_RENSO_MODE=demo npm run dev`. Panduan backend dan konfigurasi ada di [README.md](README.md). Jangan commit file `.env`, API key, rekaman, foto wajah, atau data pengguna. Gunakan `.env.example` untuk dokumentasi konfigurasi tanpa nilai rahasia.

## Mengirim perubahan

1. Kerjakan di branch atau fork sendiri.
2. Jelaskan masalah dan perilaku setelah perubahan. Sertakan screenshot untuk perubahan visual jika membantu.
3. Jalankan pemeriksaan yang relevan. Untuk perubahan kode, `npm test` dan `npm run build` adalah pemeriksaan dasar; untuk UI, coba ukuran HP dan desktop. Perubahan teks kecil cukup diperiksa tautan dan keterbacaannya.
4. Buka PR dan sebutkan pemeriksaan yang benar-benar dilakukan serta bagian yang belum teruji. Tidak perlu menambah tes yang hanya menyalin implementasi.

Jaga fungsi musik, scanner, percakapan, dan perpindahan aktivitas saat mengubah UI. Perubahan perilaku yang disengaja tetap boleh diusulkan; jelaskan dampaknya supaya dapat ditinjau.

Kontribusi AI mengikuti proses yang sama. Sebutkan jika agent menghasilkan bagian material dari perubahan, dan periksa hasilnya sebelum mengirim. PR tidak otomatis digabung; pengelola repository melakukan review.

## Aset dan privasi

Gunakan aset original atau aset dengan lisensi yang mengizinkan penggunaan di aplikasi. Cantumkan sumber dan lisensi untuk musik, model, dan gambar pihak ketiga. Jangan memasukkan materi berhak cipta hanya karena tersedia di internet.

Jangan mengubah ekspresi wajah menjadi klaim pasti tentang emosi, kesehatan, atau kepribadian. Pilihan suasana tetap dapat dikoreksi pengguna.

Untuk kerentanan, gunakan **Private vulnerability reporting** pada tab Security bila tersedia. Jika belum tersedia, buka issue yang meminta kanal pelaporan privat tanpa detail eksploitasi, kredensial, atau data pengguna. Jangan publikasikan informasi sensitif di issue umum.
