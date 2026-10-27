/* =========================================================
   ⚙️ النواة — الحالة، الصوت، قواعد الإتقان، موقع رزان في المنهج
   قواعد الإتقان (تلقائية، والأزرار اليدوية متاحة أيضًا):
   - الحرف: صحيح من أول مرة في يومين مختلفين
   - الدرس/القصة: ٨٠٪ صحيح من أول مرة
   - الآية: تسميع من الحفظ من أول مرة في يومين مختلفين
   - حرف/كلمة إنجليزية: صحيح من أول مرة في يومين مختلفين
   ========================================================= */
(() => {
  const KEY = 'razan-v1';
  const L = window.RAZAN_LETTERS, LS = window.RAZAN_LESSONS, ST = window.RAZAN_STORIES,
        Q = window.RAZAN_QURAN, E = window.RAZAN_ENGLISH;

  const blank = () => ({
    name: 'رَزَان', stars: 0, letters: {}, letterPass: {}, lessons: {}, lessonBest: {}, stories: {},
    eng: {}, engPass: {}, cvc: {}, ayat: {}, ayahPass: {}, qIntro: {}, qSurah: 0, quranArchive: {},
    trouble: [], troubleDone: {}, missionLog: [], lastMission: null, streak: 0, badgesSeen: [],
    mission: null, fs: 1, rate: 0.8, pendingReports: []
  });
  let st;
  try { st = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { st = blank(); }
  window.state = st;
  window.save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };
  window.resetState = () => { window.state = blank(); save(); };

  /* ---------- أدوات ---------- */
  window.today = () => window.__TODAY || new Date().toLocaleDateString('en-CA');
  window.ar = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  window.esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  window.$ = s => document.querySelector(s);
  window.stripMarks = s => String(s).replace(/[ً-ْٰـۡ-ۭ]/g, '');

  let audio = null;
  window.stopAudio = () => {
    try { if (audio) { audio.pause(); audio = null; } } catch (e) {}
    try { speechSynthesis.cancel(); } catch (e) {}
  };
  window.playUrl = (url, onend) => {
    stopAudio();
    try {
      audio = new Audio(url);
      audio.onended = () => { audio = null; onend && onend(); };
      audio.onerror = () => { audio = null; onend && onend(); };
      const p = audio.play(); if (p && p.catch) p.catch(() => onend && onend());
    } catch (e) { onend && onend(); }
  };
  window.speak = (text, lang = 'ar-SA', onend) => {
    try {
      stopAudio();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang; u.rate = lang.startsWith('en') ? 0.85 : (state.rate || 0.8);
      const v = speechSynthesis.getVoices().find(x => x.lang && x.lang.startsWith(lang.slice(0, 2)));
      if (v) u.voice = v;
      u.onend = () => onend && onend();
      speechSynthesis.speak(u);
    } catch (e) { onend && onend(); }
  };

  window.toast = (msg) => {
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 2600);
  };
  window.confetti = () => {
    const box = document.createElement('div'); box.className = 'confetti';
    for (let i = 0; i < 28; i++) {
      const p = document.createElement('i');
      p.style.left = Math.random() * 100 + '%'; p.style.animationDelay = Math.random() * 0.6 + 's';
      p.style.background = ['#E67E22', '#3498DB', '#F1C40F', '#2ECC71', '#E91E63'][i % 5];
      box.appendChild(p);
    }
    document.body.appendChild(box); setTimeout(() => box.remove(), 2600);
  };
  window.addStars = n => { state.stars = (state.stars || 0) + n; };

  /* ---------- قواعد الإتقان ---------- */
  const addDate = (map, k) => { const d = today(); map[k] = map[k] || []; if (!map[k].includes(d)) map[k].push(d); return map[k].length; };
  window.passLetter = l => { if (addDate(state.letterPass, l) >= 2 && !state.letters[l]) { state.letters[l] = today(); return true; } return false; };
  window.passEng = l => { if (addDate(state.engPass, l) >= 2 && !state.eng[l]) { state.eng[l] = today(); return true; } return false; };
  window.passCvc = w => { if (addDate(state.engPass, 'w:' + w) >= 2 && !state.cvc[w]) { state.cvc[w] = today(); return true; } return false; };
  window.passAyah = k => {
    if (addDate(state.ayahPass, k) >= 2 && !state.ayat[k]) { state.ayat[k] = today(); delete state.qIntro[k]; checkSurahDone(); return true; }
    return false;
  };
  /** الدرس أو القصة: ٨٠٪ من أول مرة */
  window.scoreLesson = (kind, id, ok, total) => {
    if (!total) return false;
    const p = Math.round(ok / total * 100);
    state.lessonBest[id] = Math.max(state.lessonBest[id] || 0, p);
    const map = kind === 'story' ? state.stories : state.lessons;
    if (p >= 80 && !map[id]) { map[id] = today(); return true; }
    return false;
  };

  /* ---------- موقع رزان في المنهج ---------- */
  window.letterMastered = l => !!state.letters[l];
  window.curUnit = () => { const i = L.units.findIndex(u => u.letters.some(l => !state.letters[l])); return i; }; // -1 = كلها متقنة
  window.lessonsOf = s => LS.filter(x => x.stage === s);
  window.storyOpen = s => s.needs.every(id => state.lessons[id]);
  window.arabicStage = () => {
    if (curUnit() >= 0) return 1;
    if (lessonsOf(2).some(x => !state.lessons[x.id])) return 2;
    if (lessonsOf(3).some(x => !state.lessons[x.id])) return 3;
    return 4;
  };
  window.curLesson = () => { const s = arabicStage(); return (s === 2 || s === 3) ? lessonsOf(s).find(x => !state.lessons[x.id]) : null; };
  window.curStory = () => ST.find(s => storyOpen(s) && !state.stories[s.id]) || null;

  /* القرآن */
  window.curSurah = () => Q.surahs[Math.min(state.qSurah || 0, Q.surahs.length - 1)];
  window.qKey = (s, i) => `${s.surah}:${i}`;
  window.underMem = () => Object.keys(state.qIntro).filter(k => !state.ayat[k]);
  function checkSurahDone() {
    const s = curSurah();
    if (state.quranArchive[s.surah]) return;
    if (!s.ayat.every((_, i) => state.ayat[qKey(s, i)])) return;
    // نقل تقدّم السورة إلى الأرشيف — لا يختلط بالسورة الجديدة
    const pref = s.surah + ':';
    const moved = { name: s.name, done: today(), ayat: {}, ayahPass: {} };
    for (const k of Object.keys(state.ayat)) if (k.startsWith(pref)) { moved.ayat[k] = state.ayat[k]; }
    for (const k of Object.keys(state.ayahPass)) if (k.startsWith(pref)) { moved.ayahPass[k] = state.ayahPass[k]; delete state.ayahPass[k]; }
    state.quranArchive[s.surah] = moved;
    if ((state.qSurah || 0) < Q.surahs.length - 1) state.qSurah = (state.qSurah || 0) + 1;
    window.__surahFinished = s.name;
  }
  window.checkSurahDone = checkSurahDone;

  /* الإنجليزية */
  window.engGroup = () => E.groups.findIndex(g => g.some(l => !state.eng[l]));
  window.cvcReady = () => E.cvc.filter(c => c.w.split('').every(ch => state.eng[ch]));

  /* المتعثّرات — تعود في مهمة الغد حتى تُقرأ صحيحة من أول مرة */
  window.addTrouble = card => {
    const t = card.key;
    state.trouble = (state.trouble || []).filter(x => x.t !== t);
    state.trouble.push({ t, date: today(), card: Object.assign({}, card, { fromTrouble: true }) });
    state.trouble = state.trouble.slice(-20);
  };
  window.clearTrouble = key => {
    if (!(state.trouble || []).some(x => x.t === key)) return;
    state.trouble = state.trouble.filter(x => x.t !== key);
    state.troubleDone[key] = today();
  };
})();
