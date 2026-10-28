// يبني quran.js من scripts/quran_words.json (النص العثماني وأرقام أصوات الكلمات) + scripts/quran_meta.mjs (المعاني والرموز)
//   node scripts/gen_quran.mjs          ← بناء من الملف المحفوظ (بلا إنترنت)
//   node scripts/gen_quran.mjs --fetch  ← يسحب النص من api.quran.com أولًا ثم يبني
// لإضافة سورة: أضف رقمها في ORDER ومعانيها في META، ثم شغّل مع --fetch.
import fs from 'fs';
import { META, ORDER, DEFAULT_SURAH } from './quran_meta.mjs';
const here = new URL('.', import.meta.url);
const pad = n => String(n).padStart(3, '0');

if (process.argv.includes('--fetch')) {
  const out = {};
  for (const s of ORDER) {
    const j = await (await fetch(`https://api.quran.com/api/v4/verses/by_chapter/${s}?words=true&word_fields=text_uthmani,audio_url&per_page=50`)).json();
    out[s] = j.verses.map(v => {
      const ws = v.words.filter(w => w.char_type_name === 'word');
      const idx = ws.map((w, k) => { const a = +w.audio_url.match(/_(\d{3})\.mp3$/)[1]; return a === k + 1 ? '' : String(a); });
      const text = ws.map(w => w.text_uthmani).join(' ');
      return idx.some(Boolean) ? [text, idx.join(',')] : text;
    });
  }
  fs.writeFileSync(new URL('quran_words.json', here), JSON.stringify(out));
}

const words = JSON.parse(fs.readFileSync(new URL('quran_words.json', here), 'utf8'));
const LETTER = /[ء-ي]/;
const surahs = ORDER.map(s => {
  const [name, meta] = META[s];
  if (!words[s] || words[s].length !== meta.length) throw new Error(`surah ${s}: ${words[s] && words[s].length} ayat vs ${meta.length} meanings`);
  return { surah: s, name, ayat: words[s].map((row, i) => {
    const [text, idxStr] = Array.isArray(row) ? row : [row, ''];
    // علامات الوقف (ۚ ۖ ۩ ۞) تلتصق بالكلمة المجاورة ولا تُعدّ كلمة
    const toks = []; let lead = '';
    for (const t of text.split(' ')) {
      if (LETTER.test(t)) { toks.push(lead + t); lead = ''; }
      else if (toks.length) toks[toks.length - 1] += ' ' + t; else lead = t + ' ';
    }
    const idx = idxStr ? idxStr.split(',') : [];
    const [e, g] = meta[i];
    return { w: toks, a: toks.map((_, k) => `wbw/${pad(s)}_${pad(i + 1)}_${pad(idx[k] ? +idx[k] : k + 1)}.mp3`), e,
      full: `https://everyayah.com/data/Husary_Muallim_128kbps/${pad(s)}${pad(i + 1)}.mp3`,
      g: g ? g.split(';').map(x => { const [w, m] = x.split('='); return { w, m }; }) : [] };
  }) };
});
fs.writeFileSync(new URL('../quran.js', here), `/* القرآن لرزان — مولَّد من scripts/gen_quran.mjs (لا تعدّل يدويًا؛ عدّل scripts/quran_meta.mjs ثم أعد التشغيل)
   قصار السور كلها + الفاتحة. الماما تختار سورة المدرسة (الافتراضي: ${META[DEFAULT_SURAH][0]})، وكل سورة تقدّمها محفوظ لوحده. */
window.RAZAN_QURAN = { wordAudioBase: "https://audio.qurancdn.com/", defaultSurah: ${DEFAULT_SURAH}, surahs: ${JSON.stringify(surahs, null, 1)} };\n`);
console.log(surahs.length, 'surahs,', surahs.reduce((n, s) => n + s.ayat.length, 0), 'ayat');
