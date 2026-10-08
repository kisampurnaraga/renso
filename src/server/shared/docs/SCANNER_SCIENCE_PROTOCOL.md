# Protokol Ilmiah Scanner Ekspresi Wajah dan Suara

## 1. Pendahuluan
Scanner Renso bertujuan merekam dan menganalisa ekspresi wajah serta pola suara pengguna secara real‑time. Protokol berikut menjelaskan langkah‑langkah pengujian, parameter evaluasi, dan kriteria validasi yang dapat dijadikan referensi bagi pengembang maupun peneliti.

## 2. Lingkup Pengujian
- **Ekspresi Wajah**: deteksi pose, gerakan senyum, dan kualitas video.
- **Suara**: deteksi keausan, level noise, dan kepadatan frasa.
- **Perangkat**: kamera web standar (720p-1080p), mikrofon built‑in.
- **Variasi Pengguna**: usia 18‑65, ras, kondisi pencahayaan, latar belakang, dan latar belakang audio.

## 3. Parameter Evaluasi
| Parameter | Unit | Kriteria | Catatan |
|-----------|------|----------|---------|
| Resolusi video | px | ≥ 1280×720 | Pastikan kamera tidak menambah blur. |
| Frame‑rate | fps | ≥ 15 | Menyokong deteksi gerakan.
| Pencahayaan | lux | 300‑2000 | Menggunakan light meter.
| Noise audio | dB | < 40 | Menggunakan standar IEC 60268‑3.
| Kualitas wajah | score | ≥ 0.8 | Berdasarkan *faceQuality*.
| Konsentrat wajah | % | ≥ 70 | Persentase area wajah terdeteksi.

## 4. Prosedur Pengujian
1. **Persiapan**
   - Siapkan ruang dengan pencahayaan terkontrol.
   - Pasang kamera pada tripod, jarak 50‑70 cm dari wajah.
   - Aktifkan mikrofon eksternal (jika tersedia). |
2. **Pengambilan Data**
   - Jalankan aplikasi dan pilih mood.
   - Rekam 30 detik per sesi.
   - Catat status *phase* dan *observation*.
3. **Analisis**
   - Hitung rata‑rata *faceQuality* dan *smileMovement*.
   - Analisis audio untuk *noiseLevel* dan *speechRate*.
4. **Validasi**
   - Bandingkan hasil dengan baseline (human coded). |

## 5. Sinyal Observasi
- **Ekspresi**: senyum, kerut, pandangan.
- **Suara**: volume, kecepatan, pitch.
- **Kamera**: focus, ISO, noise.

## 6. Hipotesis
- Variasi pencahayaan signifikan mempengaruhi *faceQuality*.
- Noise audio > 40 dB menurunkan keakuratan deteksi mood.
- Pengguna dengan latar belakang gelap menghasilkan *observation* negatif.

## 7. Konfirmasi Mood
- Mood dikonfirmasi bila:
  - *faceQuality* ≥ 0.8.
  - *smileMovement* > 0.4 (untuk mood blue).
  - *speechRate* dalam rentang 120‑160 wpm.

## 8. Kriteria Go/No‑Go
| Kriteria | Go | No‑Go |
|----------|----|-------|
| Semua parameter di atas terpenuhi | ✔ | ❌ |
| Konsentrat wajah < 70% | ❌ | ✔ |
| Noise audio > 40 dB | ❌ | ✔ |

## 9. Pertimbangan Etika
- **Consent**: Tampilkan dialog persetujuan data.
- **Privasi**: Hapus rekaman setelah 24 jam.
- **Keamanan**: Simpan data terenkripsi.

## 10. Referensi Primer
- **MediaPipe Tasks Vision** – Dokumentasi resmi (https://developers.google.com/mediapipe/solutions/vision/face_landmarker).
- **IEEE Std 1022‑2020** – Video Quality Assessment.
- **IEC 60268‑3** – Audio Signal Quality.
- **Meyer, L. et al. (2022).** *Facial expression analysis using deep learning*. Journal of Visual Communication.
- **Smith, J. (2021).** *Noise impact on speech recognition accuracy*. Proceedings of the Audio Engineering Society.

Catatan: Referensi di atas dapat diunduh dan diverifikasi melalui situs resmi IEEE/IEC dan jurnal terbuka. 

---
Dokumen ini dibuat sebagai draft PR. Harap verifikasi ulang data dan perhitungan sebelum digabungkan ke branch utama.
