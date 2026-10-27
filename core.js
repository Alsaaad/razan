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
    mission: null, fs: 1, rate: 0.8, auto: true, sfxOn: true, pendingReports: [],
    // إعدادات الأم: وضع المدرسة (مفتوح) أو المسار المرتّب، حرف الأسبوع، الحروف المأخوذة، سورة المدرسة
    school: { mode: 'school', cur: 'س', known: [], surah: 108, since: 0 }
  });
  let st;
  try { st = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { st = blank(); }
  st.school = Object.assign(blank().school, st.school || {});
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
  /** نطق سلسلة جمل بالترتيب: [['نص','ar-SA'], ['word','en-US']] */
  window.sayAll = (parts, onend) => {
    const list = parts.filter(p => p && p[0]);
    const go = i => i >= list.length ? (onend && onend()) : speak(list[i][0], list[i][1] || 'ar-SA', () => go(i + 1));
    stopAudio(); go(0);
  };
  /** النطق التلقائي (يمكن إيقافه من إعدادات الجهاز) */
  window.autoSay = (parts) => { if (state.auto !== false) sayAll(Array.isArray(parts[0]) ? parts : [parts]); };
  const PRAISE = ['أَحْسَنْتِ!', 'رَائِع!', 'مُمْتَازَة يَا رَزَان!', 'بَطَلَة!', 'مَا شَاءَ اللَّه!', 'شَاطِرَة!'];
  window.praise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)];

  /* 🔔 مؤثرات صوتية خفيفة (WebAudio) — بلا ملفات */
  let ac = null;
  window.sfx = name => {
    if (state.sfxOn === false) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const notes = { ok: [[660, 0], [880, .09], [1320, .18]], again: [[440, 0], [392, .12]], pop: [[900, 0]],
        star: [[1047, 0], [1319, .07], [1568, .14], [2093, .21]], win: [[523, 0], [659, .12], [784, .24], [1047, .36], [784, .5], [1047, .62]] }[name] || [[700, 0]];
      notes.forEach(([f, t]) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = 'triangle'; o.frequency.value = f; o.connect(g); g.connect(ac.destination);
        const s = ac.currentTime + t; g.gain.setValueAtTime(.0001, s); g.gain.exponentialRampToValueAtTime(.25, s + .02);
        g.gain.exponentialRampToValueAtTime(.0001, s + .22); o.start(s); o.stop(s + .25);
      });
    } catch (e) {}
  };
  /** نجمة تطير من الزر */
  window.starBurst = (el, txt = '⭐ +١') => {
    try {
      const r = el ? el.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0 };
      const s = document.createElement('div'); s.className = 'burst'; s.textContent = txt;
      s.style.left = (r.left + r.width / 2) + 'px'; s.style.top = r.top + 'px';
      document.body.appendChild(s); setTimeout(() => s.remove(), 1200);
    } catch (e) {}
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

  /* وضع المدرسة: حروف رزان = ما أخذته + حرف الأسبوع */
  window.schoolMode = () => state.school.mode !== 'path';
  window.schoolLetters = () => Array.from(new Set([...(state.school.known || []), state.school.cur].filter(Boolean)));
  window.baseLetters = w => Array.from(new Set([...stripMarks(w).replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ت').replace(/ى/g, 'ي')].filter(c => /[ا-ي]/.test(c))));
  /** كلمات كل حروفها مأخوذة — والتي فيها حرف الأسبوع أولًا */
  window.wordsFor = (letters, focus) => {
    const set = new Set(letters);
    const ok = (window.RAZAN_WORDS || []).filter(x => baseLetters(x.w).every(c => set.has(c)));
    return ok.filter(x => focus && baseLetters(x.w).includes(focus)).concat(ok.filter(x => !(focus && baseLetters(x.w).includes(focus))));
  };
  window.setSchool = patch => { Object.assign(state.school, patch, { since: Date.now() }); save(); };

  /* القرآن — السورة الحالية تختارها الأم (افتراضيًا: الكوثر) */
  window.curSurah = () => Q.surahs.find(s => s.surah === state.school.surah) || Q.surahs[0];
  window.qKey = (s, i) => `${s.surah}:${i}`;
  window.underMem = () => { const p = curSurah().surah + ':'; return Object.keys(state.qIntro).filter(k => k.startsWith(p) && !state.ayat[k]); };
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
    const nxt = Q.surahs.find(x => !state.quranArchive[x.surah]);
    if (nxt) { state.school.surah = nxt.surah; state.school.since = Date.now(); }
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
