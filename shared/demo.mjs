export function demoReply(agent, mood, message) {
  if (/bunuh diri|akhiri hidup|melukai diri|menyakiti diri/i.test(message)) return 'Keselamatanmu penting. Jika kamu sedang dalam bahaya, hubungi layanan darurat setempat dan minta seseorang yang kamu percaya menemanimu sekarang. Jika memungkinkan, menjauhlah dari benda yang bisa melukaimu. Aku pendamping AI dan tidak bisa memberikan pertolongan darurat.';
  if (agent === 'teduh') return 'Terima kasih sudah bercerita. Kamu boleh mengambil jeda tanpa harus menyelesaikan semuanya sekarang. Coba pilih satu: minum air, meregangkan bahu, atau duduk tenang sebentar. Mana yang paling nyaman untukmu?';
  if (mood === 'blue') return 'Kita pakai energi yang ada saja. Pilih satu pekerjaan, lalu ambil langkah paling ringan: buka dokumen atau tulis satu kalimat. Setelah dua menit, kamu boleh berhenti. Apa yang ingin kamu mulai?';
  return 'Yuk, mulai kecil! Pilih satu hal dari ceritamu yang bisa dilakukan dalam dua menit. Kita belum perlu menyelesaikan semuanya. Apa langkah pertamamu?';
}
