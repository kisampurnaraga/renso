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

## Mood Room + Aura Scan (2026-10-08)

- Production build in `VITE_RENSO_MODE=demo`: PASS; scanner/music lazy-loaded separately.
- Existing backend/demo suite: 12 PASS; same-origin camera policy included.
- Local Chromium 390x844 and 1365x1000: music play/pause, volume, music-only voice disabling, preset-to-aura selection, timer control, responsive no horizontal overflow: PASS.
- Scanner explicit opt-in, denied camera permission, manual mood selection, late stream after dialog dismissal, and model download failure: PASS; tracks stopped in dismissal/failure tests.
- Audio lifecycle mock: stale resume rejection preserves newer playback, pending volume retained, canceled start does not activate audio: PASS.
- Production dependency audit: zero reported vulnerabilities.
- Real phone speaker quality, successful landmarks from a real face, and real device camera permission behavior remain unverified. No emotion classification or MRI claims. Preview conversation remains scripted demo; database/live AI unchanged.

## Distinct music arrangements (2026-10-08)

Replaced shared chord/arpeggio arrangement with separate ambient pads (no percussion), swung lo-fi chords/bass/drums, and bright lead melody/percussion. Local OfflineAudioContext rendered 12 seconds of each preset: non-silent, no clipping, distinct oscillator/percussion event counts and low pairwise waveform correlation. This verifies different synthesized outputs, not listener preference or phone speaker quality.

## Dynamic work companion (2026-10-08)

Mode Santai/Ceria asks for the current activity; choosing the bright music preset also opens the cheerful companion. Local keyword matching maps design/coding/writing/study descriptions to procedural scenes. Unmatched activities use an explicitly labeled generic workspace, not a newly generated custom scene. Laptop/desktop can be switched; work scene can be ended. No camera or task data uploads are required for this visualization. Preview replies remain scripted.

Build and 13 tests pass. Local Chromium verifies bright-mode prompt, description-to-design, chat-to-coding, manual writing/study, generic fallback, laptop/desktop, calm mode, end/reset, and no mobile overflow. Design office scene visually inspected on mobile.

## Distinct room assets (2026-10-08)

Replaced the shared decor with activity-specific asset groups and palettes. All four mobile scene screenshots inspected: design easel/tablet/pinboard, coding second terminal/tower, writing tall bookcase/manuscript stack, study chalkboard/open book/book stack. Work-flow browser QA passes with no page errors or horizontal overflow. Generic activities remain explicitly generic. Scene selection uses local keyword mapping, not image/video generation.

## Natural workstation and community foundation (2026-10-08)

Laptop and desktop displays now face the seated avatar; the work camera views the desk from the side. The coding secondary monitor also faces the avatar. Build and 13 tests pass. Local Chromium work-flow QA passes with no page errors; updated mobile laptop and desktop design screenshots visually inspected. Physical Android testing remains pending.

Added MIT license, contribution/community guides, code of conduct, issue forms, and PR template. Community welcome issue #1 exists. Repository visibility was verified as private; these files do not change access or establish an always-running AI team.
