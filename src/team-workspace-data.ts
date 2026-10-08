export type Localized = { id: string; en: string }

export type WorkspaceTeam = {
  id: string
  name: Localized
  role: Localized
  availability: 'on-demand' | 'planned'
}

export type WorkspaceTask = {
  id: string
  teamId: string
  title: Localized
  detail: Localized
  status: 'done' | 'queued' | 'validation'
  updatedAt: string
  evidence: { label: string; url: string }[]
}

const repository = 'https://github.com/kisampurnaraga/renso'
const updatedAt = '2026-10-08T07:54:36Z'
const source = (path: string) => `${repository}/blob/main/${path}`

export const TEAM_WORKSPACE: {
  updatedAt: string
  teams: WorkspaceTeam[]
  tasks: WorkspaceTask[]
} = {
  updatedAt,
  teams: [
    { id: 'backend', name: { id: 'Backend & AI', en: 'Backend & AI' }, role: { id: 'Chat, sesi, dan integrasi layanan', en: 'Chat, sessions, and service integration' }, availability: 'on-demand' },
    { id: 'experience', name: { id: 'Pengalaman emosional', en: 'Emotional experience' }, role: { id: 'Sambutan, pilihan pengguna, dan percakapan', en: 'Welcome, user choice, and conversation' }, availability: 'on-demand' },
    { id: 'audio', name: { id: 'Musik & audio', en: 'Music & audio' }, role: { id: 'Musik, kontrol suara, dan transisi', en: 'Music, audio controls, and transitions' }, availability: 'on-demand' },
    { id: 'visual', name: { id: 'Avatar & ruang', en: 'Avatar & rooms' }, role: { id: 'Karakter, aktivitas, dan tampilan', en: 'Character, activities, and visuals' }, availability: 'on-demand' },
    { id: 'scanner', name: { id: 'Scanner ekspresi', en: 'Expression scanner' }, role: { id: 'Gerak wajah lokal dan konfirmasi pengguna', en: 'Local face movement and user confirmation' }, availability: 'on-demand' },
    { id: 'qa', name: { id: 'Pengujian', en: 'Quality checks' }, role: { id: 'Tes, verifikasi, dan batas bukti', en: 'Tests, verification, and evidence limits' }, availability: 'on-demand' },
    { id: 'marketing', name: { id: 'Product & Marketing', en: 'Product & Marketing' }, role: { id: 'Uji kebutuhan dan rencana pilot', en: 'Needs research and pilot planning' }, availability: 'planned' },
    { id: 'community', name: { id: 'Komunitas', en: 'Community' }, role: { id: 'Kontribusi open source dan kolaborasi', en: 'Open source contributions and collaboration' }, availability: 'planned' },
  ],
  tasks: [
    {
      id: 'live-chat', teamId: 'backend', status: 'done', updatedAt: '2026-10-08T07:47:53Z',
      title: { id: 'Chat Groq dan sesi PostgreSQL', en: 'Groq chat and PostgreSQL sessions' },
      detail: { id: 'Pengguna mengonfirmasi status API dan balasan chat berhasil pada 8 Oktober. Bukti operasional berasal dari uji pengguna, bukan pemantauan terus-menerus.', en: 'The user confirmed API status and a successful chat reply on October 8. Operational evidence comes from that user test, not continuous monitoring.' },
      evidence: [{ label: 'Groq setup', url: source('docs/GROQ_SETUP.md') }, { label: 'Session implementation', url: source('server/store.mjs') }],
    },
    {
      id: 'static-module-fix', teamId: 'backend', status: 'done', updatedAt: '2026-10-08T07:45:34Z',
      title: { id: 'Perbaikan modul static pada API Vercel', en: 'Vercel API static module fix' },
      detail: { id: 'Impor modul static dipisahkan dari API untuk memperbaiki ERR_REQUIRE_ESM. Setelah deployment, pengguna menerima respons status API.', en: 'Static module imports were separated from the API to fix ERR_REQUIRE_ESM. After deployment, the user received an API status response.' },
      evidence: [{ label: 'Fix commit 9f07a18', url: `${repository}/commit/9f07a18275a296eef49408b03a0566093e63db80` }],
    },
    {
      id: 'emotional-review', teamId: 'experience', status: 'done', updatedAt,
      title: { id: 'Review kenyamanan, musik, dan produk', en: 'Comfort, music, and product review' },
      detail: { id: 'Review agent menghasilkan prioritas: pengguna merasa diterima, bebas mengambil jeda, dan memilih bantuan. Efek menenangkan belum divalidasi dengan pengguna atau psikolog.', en: 'Agent reviews prioritized feeling welcomed, being free to pause, and choosing support. Calming effects have not been validated with users or a psychologist.' },
      evidence: [{ label: 'Agent team scope', url: source('docs/AGENT_TEAM.md') }],
    },
    {
      id: 'simpler-entry', teamId: 'experience', status: 'queued', updatedAt,
      title: { id: 'Sambutan dengan tiga pilihan sederhana', en: 'Welcome with three simple choices' },
      detail: { id: 'Rencana: Ambil jeda, Ditemani tanpa ngobrol, atau Mulai pelan-pelan. Belum diimplementasikan.', en: 'Planned: Take a pause, Have quiet company, or Start gently. Not implemented yet.' },
      evidence: [{ label: 'Current entry flow', url: source('src/App.tsx') }],
    },
    {
      id: 'quiet-mode', teamId: 'experience', status: 'queued', updatedAt,
      title: { id: 'Mode Hening dan respons yang mendengarkan', en: 'Quiet mode and listening-first replies' },
      detail: { id: 'Rencana: kurangi gerakan, suara percakapan opsional, dan tanyakan kebutuhan sebelum memberi tugas. Belum diimplementasikan.', en: 'Planned: reduce movement, make spoken replies optional, and ask about needs before suggesting tasks. Not implemented yet.' },
      evidence: [{ label: 'Current agent prompts', url: source('server/agents.mjs') }],
    },
    {
      id: 'multilingual', teamId: 'experience', status: 'queued', updatedAt,
      title: { id: 'Bahasa Indonesia dan Inggris untuk aplikasi', en: 'Indonesian and English across the app' },
      detail: { id: 'Dukungan penuh UI, chat, dan suara direncanakan. Label bilingual ruang tim bukan bukti seluruh aplikasi sudah diterjemahkan.', en: 'Full UI, chat, and voice support is planned. Bilingual team workspace labels do not mean the whole app has been translated.' },
      evidence: [{ label: 'Current app', url: source('src/App.tsx') }],
    },
    {
      id: 'music-presets', teamId: 'audio', status: 'done', updatedAt,
      title: { id: 'Tiga musik berbeda dengan kontrol pengguna', en: 'Three distinct music presets with user controls' },
      detail: { id: 'Ambient, lo-fi, dan melodi ceria tersedia dengan volume dan jeda. Pemutaran memerlukan tindakan pengguna.', en: 'Ambient, lo-fi, and cheerful melody presets are available with volume and pause controls. Playback requires user action.' },
      evidence: [{ label: 'Music engine', url: source('src/music-engine.ts') }, { label: 'Music controls', url: source('src/MoodRoom.tsx') }],
    },
    {
      id: 'separate-music-work', teamId: 'audio', status: 'queued', updatedAt,
      title: { id: 'Pisahkan pilihan musik dan mode kerja', en: 'Separate music choice from work mode' },
      detail: { id: 'Review menemukan musik ceria ikut mengaktifkan mode kerja dan mereset chat. Perbaikan pemisahan masih dalam antrean.', en: 'The review found cheerful music also activates work mode and resets chat. Separating these choices is still queued.' },
      evidence: [{ label: 'Current music and work flow', url: source('src/App.tsx') }],
    },
    {
      id: 'smooth-audio', teamId: 'audio', status: 'queued', updatedAt,
      title: { id: 'Transisi audio yang lebih lembut', en: 'Smoother audio transitions' },
      detail: { id: 'Rencana penghalusan pergantian musik. Pengujian kenyamanan mendengar pada pengguna belum dilakukan.', en: 'Music transition refinement is planned. User listening comfort has not been tested yet.' },
      evidence: [{ label: 'Current music engine', url: source('src/music-engine.ts') }],
    },
    {
      id: 'activity-rooms', teamId: 'visual', status: 'done', updatedAt,
      title: { id: 'Ruang aktivitas dan arah layar diperbaiki', en: 'Activity rooms and screen orientation fixed' },
      detail: { id: 'Desain, coding, menulis, dan belajar memiliki ruang atau properti berbeda. Layar menghadap avatar; pengguna telah mengonfirmasi perbaikan.', en: 'Design, coding, writing, and study have distinct rooms or props. Screens face the avatar; the user confirmed the fix.' },
      evidence: [{ label: 'Activity avatar', url: source('src/Avatar.tsx') }, { label: 'Activity mapping', url: source('src/work-activity.mjs') }],
    },
    {
      id: 'expression-scanner', teamId: 'scanner', status: 'done', updatedAt,
      title: { id: 'Scanner lokal dengan pilihan pengguna', en: 'Local scanner with user choice' },
      detail: { id: 'Kamera opsional memproses gerak wajah di perangkat. Pengguna mengonfirmasi kebutuhan; scanner tidak menentukan emosi batin atau diagnosis.', en: 'The optional camera processes face movement on the device. Users confirm their needs; the scanner does not determine inner emotions or diagnoses.' },
      evidence: [{ label: 'Scanner scope and limits', url: source('docs/FACE_SCAN.md') }, { label: 'Scanner implementation', url: source('src/AuraScanner.tsx') }],
    },
    {
      id: 'physical-scanner-validation', teamId: 'scanner', status: 'validation', updatedAt,
      title: { id: 'Validasi kamera dan wajah nyata', en: 'Real camera and face validation' },
      detail: { id: 'Alur diuji dengan input sintetis. Pengujian perangkat, pencahayaan, dan wajah nyata masih diperlukan; akurasi emosi tidak diklaim.', en: 'The flow was tested with synthetic input. Device, lighting, and real-face testing is still required; no emotion accuracy is claimed.' },
      evidence: [{ label: 'Validation record', url: source('docs/VALIDATION.md') }, { label: 'Face scan limitations', url: source('docs/FACE_SCAN.md') }],
    },
    {
      id: 'backend-regression', teamId: 'qa', status: 'done', updatedAt: '2026-10-08T07:40:22Z',
      title: { id: '29 tes lulus pada perbaikan backend', en: '29 tests passed for the backend fix' },
      detail: { id: '29 tes regresi dan build lulus setelah penambahan ruang tim. Pengujian browser lokal memeriksa pencarian, filter, bahasa, navigasi, tampilan HP, dan kegagalan status layanan.', en: '29 regression tests and the build passed after adding the team workspace. Local browser checks covered search, filters, language, navigation, mobile layout, and service-status failures.' },
      evidence: [{ label: 'Backend fix', url: `${repository}/commit/9f07a18275a296eef49408b03a0566093e63db80` }, { label: 'Handler tests', url: source('server/vercel-handler.test.mjs') }],
    },
    {
      id: 'adult-pilot', teamId: 'marketing', status: 'queued', updatedAt,
      title: { id: 'Pilot 7 hari dengan 20–30 pengguna dewasa', en: 'Seven-day pilot with 20–30 adult users' },
      detail: { id: 'Pilot direncanakan untuk menilai kenyamanan dan kebutuhan. Perekrutan belum dimulai; belum ada hasil pilot atau pendapatan yang terverifikasi.', en: 'The pilot is planned to assess comfort and needs. Recruitment has not started; there are no verified pilot results or earnings.' },
      evidence: [{ label: 'Go-to-market plan', url: source('docs/GO_TO_MARKET.md') }],
    },
    {
      id: 'community-foundation', teamId: 'community', status: 'done', updatedAt,
      title: { id: 'Fondasi kontribusi open source', en: 'Open source contribution foundations' },
      detail: { id: 'Repo publik, lisensi, panduan kontribusi, dan issue sambutan tersedia. Belum ada bukti komunitas aktif atau agent yang bekerja otomatis sepanjang waktu.', en: 'The public repo, license, contribution guide, and welcome issue are available. There is no evidence of an active community or agents working automatically around the clock.' },
      evidence: [{ label: 'Welcome issue #1', url: `${repository}/issues/1` }, { label: 'Community guide', url: source('docs/COMMUNITY.md') }],
    },
  ],
}
