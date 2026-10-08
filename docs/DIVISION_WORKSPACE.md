# Kantor Renso per divisi

Engineering: Arka (arsitektur/release), Nara (backend), Lensa (scanner), Cek (QA).
Wellbeing & Science: Teduh (pengalaman), Sains (riset ilmiah), Hana (psikologi).
Creative: Nada (audio), Rupa (visual), Krea (content creator).
Growth: Mira (marketing), Reka (product research), Sapa (komunitas).

Setiap divisi memiliki ruang kerja dan area istirahat. Nama adalah persona AI, bukan tenaga profesional manusia atau bukti aktivitas mandiri.

## Bukti kerja
Animasi mengetik hanya ketika API sinkronisasi GitHub mengembalikan running. Antrean dan dispatched berarti menunggu. Status tidak tersedia menghentikan gerakan; pengunjung publik tidak menerima informasi tugas pemilik. Polling berjalan ketika halaman terlihat dan pemilik terautentikasi, tiap 30 detik. Model tidak membuktikan output berhasil; cek PR, tes dan deployment. Ruang istirahat merupakan visualisasi status tanpa tugas aktif/hasil selesai, bukan telemetri fisik. Tidak ada dispatcher baru atau merge otomatis.

## Scanner
Sains menyusun evidence review dan protokol evaluasi ekspresi wajah/ciri suara: noise, pencahayaan, variasi pengguna, uncertainty. Hana meninjau bahasa dukungan dan konfirmasi pengguna. Aura adalah representasi visual suasana yang dipilih/dikonfirmasi, bukan MRI, diagnosis atau pembacaan isi hati. Keahlian pemrosesan sinyal berada di riset science dan scanner. Reviewer psikologi manusia diperlukan sebelum klaim kesehatan mental. Riset dan validasi nyata belum dilaksanakan.

## Konten dan akun brand
Krea menghasilkan kalender, naskah, prompt motion, storyboard, caption dan aset yang ditinjau Mira. Siapkan daftar email brand/Instagram/TikTok/YouTube dengan status belum dibuat, pemilik, recovery dan checklist verifikasi. Pembuatan akun dan publikasi adalah pekerjaan eksternal terpisah; worker kode tidak memiliki tool email/social signup dan tidak boleh mengklaim akun telah dibuat. Pemilik menjalankan verifikasi, CAPTCHA, autentikasi serta persetujuan layanan pada situs terkait. Jangan simpan password/token/recovery di repo.

Prompt-motion tercatat sebagai kandidat alat produksi: URL/vendor/version belum diidentifikasi. Krea menyiapkan template prompt gerak berisi karakter, aktivitas, kamera, durasi, kontinuitas dan output. Tidak ada integrasi API atau langganan yang aktif; Arsitek harus memverifikasi dokumentasi, lisensi dan biaya sebelum integrasi.

## Migrasi
Jalankan db/004_science_content_roles.sql pada database Renso yang terhubung. Migrasi hanya memperluas constraint team untuk science, psychology, content; tidak mengubah akses pemilik atau data tugas.
