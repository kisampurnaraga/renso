# Rencana Rilis Audius dan TTS Bilingual

## 1. Kontrak dan Adapter Audius
- **SDK**: [Audius SDK](https://docs.audius.co/sdk/)
- **Quota**: 500 000 request per bulan, 10 request per detik.
- **Atribusi & Lisensi**: Setiap track harus mencantumkan atribusi Audius dan lisensi Open‑Music. Dokumen lisensi: [Open Music License](https://audius.org/open-music-license.pdf).
- **Adapter**: Implementasi adapter di backend untuk memanggil SDK, memuat token, dan menyimpan metadata track.

## 2. Integrasi TTS Supertonic
- **Repo**: https://github.com/supertone-oss-archive/supertonic
- **Lisensi**: MIT
- **Model**: OpenRAIL‑M
- **Pengaturan**: Model dimuat secara opt‑in, memerlukan konfigurasi API key.
- **Adapter**: API wrapper di backend yang menerima teks bilingual (ID/EN) dan mengembalikan file audio.

## 3. Urutan Tim
| Urutan | Tim | Tugas | Deliverable |
|--------|-----|-------|-------------|
| 1 | Backend | Konfigurasi Audius SDK, pembuatan adapter | Adapter Audius, skema DB track |
| 2 | Audio | Integrasi Supertonic TTS, unit test | Wrapper TTS, contoh output |
| 3 | Visual | UI untuk memilih track dan bahasa | Komponen pemutar, selector bahasa |
| 4 | QA | Smoke test: upload track, generate TTS, play | Log hasil, bug list |
| 5 | Research | Penilaian lisensi, analisa quota | Laporan batas penggunaan |

## 4. Dependensi & Konfigurasi
- **Environment Variables**
  - `AUDIUS_API_KEY`
  - `AUDIUS_CLIENT_ID`
  - `SUPERTONIC_API_KEY`
  - `MODEL_PATH` (optional)
- **Database**
  - Tambahkan tabel `tracks` dengan kolom `id`, `audius_id`, `title_id`, `title_en`, `license`, `created_at`.
- **CI/CD**
  - Tambahkan job lint & test pada pipeline untuk module baru.

## 5. Lisensi & Atribusi
- Audius: Open‑Music License – semua konten wajib menyertakan atribusi.
- Supertonic: MIT – kode bebas, model OpenRAIL‑M bebas penggunaan.
- Pastikan file `LICENSE` di repo mencakup kedua lisensi.

## 6. Kriteria Go/No‑Go
1. **Quota**: Audit log tidak melebihi 10 req/detik pada load testing.
2. **Atribusi**: Semua track menampilkan atribusi Audius pada UI.
3. **Lisensi**: Tidak ada pelanggaran hak cipta pada model TTS.
4. **Smoke Test**: 100% success rate untuk upload track + generate TTS.
5. **Rollback**: Rencana rollback meliputi
   - Hapus konfigurasi Audius dari env.
   - Matikan endpoint TTS.
   - Restore DB ke snapshot sebelum release.

## 7. Smoke Test
- **Scenario**: Upload satu track, pilih bahasa ID dan EN, generate TTS, play audio.
- **Expected**: Audio berisi kedua bahasa, metadata track terupdate, tidak ada error API.

## 8. Rollback Plan
1. **Stop Service**: Matikan endpoint `/api/audius` dan `/api/tts`.
2. **Restore DB**: Rollback ke snapshot DB.
3. **Unset Env**: Hapus variabel `AUDIUS_API_KEY`, `SUPERTONIC_API_KEY`.
4. **Notify**: Kirim pesan ke channel ops dengan detail rollback.

## 9. Draft PR
- PR akan berisi:
  - Penambahan modul `src/backend/audiusAdapter.ts`.
  - Penambahan modul `src/backend/ttsAdapter.ts`.
  - Update `package.json` dengan dependensi SDK.
  - Update `docs` dan `README`.
  - Test unit untuk adapter.

---

Catatan: Semua kode dan konfigurasi masih dalam tahap draft. Integrasi atau pengujian tidak dijalankan.
