# Validasi v0.1 — 7 Oktober 2026

- `npm run build`: PASS (TypeScript dan Vite). Avatar diload terpisah; bundel 3D masih besar dan perlu evaluasi performa HP nyata.
- `npm test`: 10/10 PASS. Sesi, CSRF origin, input, kuota, penghapusan, provider mock, kegagalan provider, dan fail-closed produksi.
- `npm audit --omit=dev --audit-level=high`: 0 vulnerabilities setelah pembaruan `@fastify/static`.
- Browser Chromium headless, desktop 1365×1000 dan mobile viewport 390×844: PASS.
- Alur browser: aura, chat demo, pergantian agent/reset history, mulai/hentikan aktivitas, dialog Escape dan penghapusan sesi: PASS.
- Tidak ada error JavaScript pada alur browser yang diuji; tidak ada overflow horizontal pada viewport mobile.
- Gambar tampilan tersedia di `docs/screenshots/`.

Belum diuji: Neon/PostgreSQL nyata, panggilan AI langsung, transkripsi provider langsung, suara pada HP nyata, pemasangan PWA pada Android, pembayaran, dan APK. Tidak ada kredensial provider aktif selama validasi. Headless mobile viewport bukan pengujian perangkat Android fisik.

Source disiapkan untuk repository `kisampurnaraga/renso`, yang dibuat pemilik pada 8 Oktober 2026. Kredensial database dan AI tidak termasuk dalam source.
