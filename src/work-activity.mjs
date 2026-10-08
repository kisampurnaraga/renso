export const WORK_ACTIVITIES = {
  design: {label:'Desain', icon:'◈', tip:'Mulai dari satu bentuk atau satu pilihan warna.'},
  coding: {label:'Coding', icon:'⌘', tip:'Buka satu file dan kerjakan satu fungsi kecil.'},
  writing: {label:'Menulis', icon:'✎', tip:'Tulis satu kalimat dulu; rapikan nanti.'},
  study: {label:'Belajar', icon:'▤', tip:'Baca satu bagian dan catat satu ide.'},
  other: {label:'Aktivitas lain', icon:'✦', tip:'Pilih satu bagian paling ringan untuk dimulai.'}
};
export function detectWorkActivity(text) {
  const rules = [
    ['design', /\b(desain|design|ngedesain|ngedesign|poster|logo|figma|canva|ilustrasi)\b/gi],
    ['coding', /\b(coding|ngoding|kode|programming|program|debug|website|javascript|python|php)\b/gi],
    ['writing', /\b(nulis|menulis|writing|artikel|caption|skrip|script|novel|laporan)\b/gi],
    ['study', /\b(belajar|study|studying|kuliah|membaca|baca|pelajaran|ujian|matematika)\b/gi]
  ];
  let selected=null, last=-1;
  for(const [activity,pattern] of rules) for(const match of text.matchAll(pattern)) {
    // Respect a simple explicit correction such as "bukan desain, lagi coding".
    const before=text.slice(Math.max(0,match.index-18),match.index);
    if(/(?:bukan|tidak|nggak|gak)\s*$/i.test(before))continue;
    if(match.index>last){last=match.index;selected=activity;}
  }
  return selected;
}
export function workReply(activity, mode) {
  const work=WORK_ACTIVITIES[activity] || WORK_ACTIVITIES.other;
  return `${mode==='cheerful'?'Yuk, aku ikut menemanimu!':'Kita pelan-pelan saja.'} Ruangku sekarang mengikuti aktivitasmu. ${work.tip} Bagian mana yang mau kamu mulai?`;
}
