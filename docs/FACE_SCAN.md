# Scan ekspresi Renso

Renso memakai Google MediaPipe Face Landmarker yang sudah menjadi dependensi proyek. Tidak ada model emosi tambahan, pelatihan model sendiri, atau layanan pengenalan identitas.

## Alur

1. Pengguna mengizinkan kamera secara eksplisit.
2. Face Landmarker menghasilkan titik wajah dan 52 koefisien gerakan ekspresi dengan `outputFaceBlendshapes: true`.
3. Frame diperiksa agar seluruh wajah berada di dalam batas gambar, ukurannya cukup, dan posisinya berada di tengah. Scan membutuhkan sedikitnya 20 frame baik berturut-turut dengan inferensi dibatasi sekitar 8 kali per detik; scan berlangsung sedikitnya 2,5 detik. Jika wajah hilang atau posisi tidak sesuai, jumlah frame dan sampel direset.
4. Rata-rata `mouthSmileLeft` dan `mouthSmileRight` dihitung pada frame baik. Hasil hanya mengatakan **Gerak senyum terlihat** atau **Ekspresi belum jelas**. Sedikitnya 20 sampel koefisien valid diperlukan untuk label senyum; keluaran tidak tersedia/tidak valid menjadi hasil belum jelas.
5. Pengguna menyatakan kebutuhannya: **Butuh jeda → Tenang**, **Sulit mulai → Segar**, **Ingin ceria → Berenergi**. Rekomendasi mengikuti pernyataan pengguna, bukan dugaan emosi dari wajah. Semua suasana tetap dapat dipilih langsung.
6. Kamera berhenti saat scan selesai, dibatalkan, modal ditutup, atau halaman disembunyikan. Memilih suasana memanggil alur booster aplikasi; scanner tidak memutar musik secara otomatis.

## Batas pengukuran

Ambang rata-rata senyum **0,35** adalah heuristik produk, belum divalidasi pada populasi pengguna. Nilai blendshape merupakan koefisien gerakan wajah, **bukan probabilitas bahagia**. Tidak terdeteksinya senyum tidak berarti sedih. Pemindai bukan MRI, diagnosis, atau pendeteksi kondisi kesehatan.

Quality gate memakai koordinat ternormalisasi: tepi wajah minimal 0,03 dari tepi frame; lebar 0,20–0,75; tinggi 0,25–0,90; pusat horizontal 0,22–0,78 dan vertikal 0,20–0,80. Ini heuristik framing, bukan jaminan kualitas pencahayaan atau keakuratan. Cahaya rendah, gerakan, kacamata/occlusion dan arah wajah dapat mengurangi hasil.

Scan dibatasi 12 detik; izin/pemuatan dibatasi 30 detik. Jalur tanpa kamera tetap tersedia. Pemrosesan inference saat ini pada main thread dengan throttle 125 ms; web worker dapat dipertimbangkan setelah profiling perangkat HP.

## Privasi dan jaringan

Foto, video, titik wajah, dan koefisien ekspresi tidak disimpan ke localStorage/database, tidak dicatat di log, serta tidak dikirim ke backend/LLM. Nilai sementara hanya digunakan dalam scan. Setelah selesai, UI menyimpan label gerakan sementara dan pilihan kebutuhan sampai modal ditutup atau scan diulang.

WASM diunduh dari jsDelivr versi 1.1.0 dan model dari Google. Unduhan ini memerlukan jaringan dan mengikuti kebijakan penyedianya. Ini bukan klaim aplikasi offline penuh. Izin kamera tidak memerlukan mikrofon.

## Lisensi dan sumber

Kode Renso berlisensi MIT. Dependensi MediaPipe dan model Blendshape V2 memiliki lisensi Apache 2.0 sendiri; lisensi Renso tidak mengganti lisensi komponen tersebut.

- [Dokumentasi Face Landmarker web](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js): blendshape, opsi dan main-thread inference.
- [Model card resmi Blendshape V2](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20Blendshape%20V2.pdf): 52 koefisien, lisensi Apache 2.0, penggunaan AR/avatar/hiburan, batas model.
- [Repo MediaPipe dan lisensinya](https://github.com/google-ai-edge/mediapipe).
- [Kajian ilmiah: Emotional Expressions Reconsidered](https://pmc.ncbi.nlm.nih.gov/articles/PMC6640856/): gerakan wajah tidak menentukan kondisi emosional secara pasti lintas konteks dan individu.

Alternatif yang ditinjau: [face-api.js](https://github.com/justadudewhohacks/face-api.js) (MIT; rilis 0.22.2 memakai TFJS-core 1.7.0), [Human](https://github.com/vladmandic/human) (MIT; beberapa model dan stack TensorFlow.js). MediaPipe dipilih karena telah digunakan Renso dan sesuai untuk gerakan avatar tanpa menambah dependensi model ekspresi.

## Validasi

Unit test memakai data sintetis untuk memeriksa wajah hilang/tidak valid/di luar frame/terlalu kecil, koefisien hilang atau NaN, batas minimum sampel, dan pemetaan kebutuhan. TypeScript diperiksa. Pengujian ini bukan validasi model pada wajah manusia nyata. Keakuratan scan pada kamera HP, beragam pencahayaan, warna kulit, usia, dan aksesori belum diverifikasi secara langsung; hasil tidak boleh dipromosikan sebagai deteksi emosi tervalidasi.
