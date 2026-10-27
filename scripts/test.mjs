// اختبارات jsdom: وضع المدرسة (مهمة كاملة ← اليوم التالي) ← المسار المرتّب (إتقان درس) ← أرشفة السورة ← الدمج بين جهازين
// التشغيل: npm install && npm test
import { JSDOM } from 'jsdom'; import fs from 'fs'; import assert from 'assert'; import os from 'os'; import path from 'path';
import { transformSync } from 'esbuild';
import { fileURLToPath, pathToFileURL } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..') + '/';
// نحوّل convex/kidState.ts إلى JS ونستبدل استيرادات Convex بنسخ وهمية لاختبار دالة الدمج وحدها
const ts = fs.readFileSync(root + 'convex/kidState.ts', 'utf8').replace(/^import .*$/gm, '');
const js = 'const mutation = x => x; const v = new Proxy({}, { get: () => () => ({}) });\n' + transformSync(ts, { loader: 'ts', format: 'esm' }).code;
const ks = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'razan-')), 'ks.mjs');
fs.writeFileSync(ks, js);
const { mergeStates } = await import(pathToFileURL(ks).href);

const html = fs.readFileSync(root + 'index.html', 'utf8');
const scripts = [...html.matchAll(/src="([^"?]+)/g)].map(m => m[1]);
const spoken = [];
function boot(store) {
  const dom = new JSDOM(html.replace(/<script[^>]*><\/script>/g, ''), { runScripts: 'outside-only', url: 'https://x.test/razan/' });
  const w = dom.window;
  if (store) w.localStorage.setItem('razan-v1', store);
  w.Audio = class { play() { setTimeout(() => this.onended && this.onended(), 0); return Promise.resolve(); } pause() {} };
  w.speechSynthesis = { speak(u) { spoken.push(u.text); u.onend && u.onend(); }, cancel() {}, getVoices: () => [] }; w.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
  w.fetch = () => Promise.reject(new Error('offline')); w.scrollTo = () => {};
  w.HTMLCanvasElement.prototype.getContext = () => null;
  w.HTMLElement.prototype.scrollIntoView = () => {};
  for (const s of scripts) w.eval(fs.readFileSync(root + s, 'utf8'));
  return w;
}
const click = (w, sel) => { const el = w.document.querySelector(sel); assert(el, 'missing ' + sel); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
/** plan(card, againSoFar) = كم مرة نضغط 🔁 قبل ✅ */
function runMission(w, plan) {
  w.renderMission(); click(w, '[data-act="start"]');
  let guard = 0; const againDone = {};
  while (w.state.mission.phase === 'cards' && guard++ < 300) {
    const m = w.state.mission, c = m.steps[m.si].cards[m.ci];
    if (c.type === 'pick') { assert(w.document.querySelector('[data-pick]'), 'pick card rendered'); click(w, `[data-pick="${c.l}"]`); continue; }
    const n = plan(c, againDone);
    for (let i = 0; i < n; i++) { click(w, '[data-act="again"]'); if (i === 0 && w.document.querySelector('#saidIn')) w.document.querySelector('#saidIn').value = 'قالت شيئًا'; }
    againDone[c.key] = (againDone[c.key] || 0) + n;
    if (n < 2 || againDone[c.key] > 2) click(w, '[data-act="ok"]');
  }
  assert.equal(w.state.mission.phase, 'rest'); click(w, '[data-act="skipRest"]');
  click(w, '[data-act="chest"]');
  click(w, '[data-mood="جيدة"]');
}

// ---------- إعداد الماما: حرف الأسبوع س، وأخذت قبله ا ب ر م ل ق ----------
let w = boot(); w.__TODAY = '2026-11-01'; w.renderAll();
w.showTab('mom');
['ا', 'ب', 'ر', 'م', 'ل', 'ق'].forEach(l => click(w, `[data-known="${l}"]`));
assert.equal(w.state.school.cur, 'س'); assert.deepEqual([...w.state.school.known].sort(), ['ا', 'ب', 'ر', 'ق', 'ل', 'م'].sort());
const words = w.wordsFor(w.schoolLetters(), 'س');
assert(words.length >= 5 && words.every(x => w.baseLetters(x.w).every(c => w.schoolLetters().includes(c))), 'words use only known letters');
assert(w.baseLetters(words[0].w).includes('س'), 'words with the week letter come first');
console.log('✅ mom setup OK — words:', words.map(x => x.w).join(' '));

// ---------- اليوم ١ (وضع المدرسة) ----------
w.showTab('mission');
const plan1 = w.buildPlan();
console.log('Day1 steps:', plan1.steps.map(s => s.name + '×' + s.cards.length).join(' | '));
assert(plan1.steps[0].name.includes('س') && plan1.steps[0].cards.some(c => c.type === 'pick'), 'week letter step with game');
assert(plan1.steps.some(s => s.name.includes('كلمات')), 'words step');
assert(plan1.steps.some(s => s.name.includes('الكوثر')), 'Al-Kawthar');
spoken.length = 0;
runMission(w, (c, a) => c.key === 'L:ب' && !a[c.key] ? 2 : c.key === 'L:ر' && !a[c.key] ? 1 : 0);
let S = w.state;
assert(spoken.some(t => /صَوْتُ/.test(t)) && spoken.some(t => /السِّين/.test(t)), 'cards are spoken');
assert(S.mission.done && S.missionLog.length === 1, 'logged');
assert(S.trouble.some(t => t.t === 'L:ب'), 'ب saved for tomorrow');
assert(!S.trouble.some(t => t.t === 'L:ر'), 'ر not saved (one retry only)');
assert.deepEqual(S.letterPass['س'], ['2026-11-01']); assert(!S.letterPass['ب'] && !S.letterPass['ر'], 'no first-try credit');
assert(S.qIntro['108:0'] === '2026-11-01', 'Kawthar ayah 1 introduced');
assert(S.pendingReports.length === 1, 'offline report queued');
assert(S.mission.opened && S.mission.starsToday > 0, 'chest opened');
assert(/ماذا قالت/.test(w.missionSummary()) && /حرف الأسبوع: س/.test(w.missionSummary()));
console.log('✅ Day1 full mission OK\n' + w.missionSummary());

// ---------- اليوم ٢ ----------
w = boot(w.localStorage.getItem('razan-v1')); w.__TODAY = '2026-11-02'; w.renderAll();
const p2 = w.buildPlan();
console.log('Day2 steps:', p2.steps.map(s => s.name + '×' + s.cards.length).join(' | '));
assert(p2.steps[0].cards.some(c => c.key === 'L:ب'), 'trouble comes back first');
assert(p2.steps.some(s => s.cards.some(c => c.key === 'Q:108:0')), 'ayah recite next day');
runMission(w, () => 0);
S = w.state;
assert(S.letters['س'] && S.letters['م'], 'letters mastered after 2 first-try days');
assert(!S.letters['ب'], 'ب needs 2 first-try days');
assert(!S.trouble.some(t => t.t === 'L:ب'), 'trouble cleared after first-try');
console.log('✅ Day2 OK — mastered:', Object.keys(S.letters).join(' '));

// ---------- الماما تنتقل لحرف ق ----------
w.showTab('mom'); click(w, '[data-cur="ق"]');
assert.equal(S.school.cur, 'ق'); assert(S.school.known.includes('س') && !S.school.known.includes('ق'), 'old week letter moved to known');
assert(w.buildPlan().steps.some(s => s.name.includes('حرف الأسبوع: ق')));
console.log('✅ switch week letter OK');

// ---------- المسار المرتّب: الدرس ٨٠٪ ----------
click(w, '[data-mode="path"]'); assert(!w.schoolMode());
Object.keys(w.RAZAN_LETTERS.info).forEach(l => S.letters[l] = '2026-11-02'); w.__TODAY = '2026-11-03';
const p3 = w.buildPlan(); assert.equal(p3.steps.find(s => s.lesson).lesson, 'h-fatha');
runMission(w, (c, a) => c.type === 'item' && c.text === 'بَ' && !a[c.key] ? 1 : 0); // 7/8
assert(S.lessons['h-fatha'] && S.lessonBest['h-fatha'] === 88, 'lesson mastered at 88% (7/8)');
console.log('✅ lesson mastery OK');

// ---------- إتمام السورة → أرشيف ----------
const sur = w.curSurah(); assert.equal(sur.surah, 108);
sur.ayat.forEach((_, i) => { S.ayahPass['108:' + i] = ['2026-11-01']; S.qIntro['108:' + i] = '2026-11-01'; });
sur.ayat.forEach((_, i) => w.passAyah('108:' + i));
assert(S.quranArchive[108] && w.curSurah().surah === 1 && w.underMem().length === 0);
console.log('✅ surah archive OK →', w.curSurah().name);

// ---------- الدمج بين جهازين ----------
const A = { letters: { 'م': 'd1' }, letterPass: { 'ب': ['2026-11-01'] }, stars: 5, missionLog: [{ date: '2026-11-01', id: 'a' }], trouble: [{ t: 'L:ب', date: '2026-11-01' }], ayat: {},
  school: { mode: 'school', cur: 'ق', known: ['س'], surah: 108, since: 200 } };
const B = { letters: { 'س': 'd2' }, letterPass: { 'ب': ['2026-11-02'] }, stars: 3, missionLog: [{ date: '2026-11-02', id: 'b' }], troubleDone: { 'L:ب': '2026-11-02' }, ayat: { '108:0': 'd' },
  school: { mode: 'school', cur: 'س', known: [], surah: 108, since: 0 } };
let M = mergeStates(mergeStates(null, A), B);
assert(M.letters['م'] && M.letters['س'], 'union letters'); assert.deepEqual(M.letterPass['ب'], ['2026-11-01', '2026-11-02']);
assert.equal(M.stars, 5); assert.equal(M.streak, 2); assert.equal(M.trouble.length, 0, 'trouble resolved on other device');
assert.equal(M.school.cur, 'ق', 'newer mom settings win over a fresh device');
const M2 = mergeStates(M, { letters: {}, stars: 0, missionLog: [] }); assert(M2.letters['م'] && M2.missionLog.length === 2, 'nothing deleted');
console.log('✅ merge OK — letters:', Object.keys(M2.letters).join(' '), 'streak', M.streak, 'week letter', M.school.cur);
console.log('\nALL TESTS PASSED');
