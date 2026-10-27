/* =========================================================
   🚀 مهمتي — مهمة يومية ≈١٥ دقيقة
   الحَكَم هو الكبير: «✅ قرأتها صح» أو «🔁 نعيدها».
   🔁 أولى = مساعدة + «ماذا قالت؟»، 🔁 ثانية = البطاقة لآخر الخطوة وتُحفظ لمهمة الغد.
   ========================================================= */
(() => {
  const L = window.RAZAN_LETTERS, LS = window.RAZAN_LESSONS, ST = window.RAZAN_STORIES, E = window.RAZAN_ENGLISH;
  const HARAKAT = ['َ', 'ُ', 'ِ'];
  const lessonById = id => LS.find(x => x.id === id);
  const storyById = id => ST.find(x => x.id === id);

  /* ---------- بناء خطة اليوم ---------- */
  function buildPlan() {
    const steps = [];
    const trouble = (state.trouble || []).slice(0, 6).map(t => t.card);
    const seen = new Set(trouble.map(c => c.key));
    if (trouble.length) steps.push({ name: '🔁 نراجع ما صعب أمس', cards: trouble });

    const s = arabicStage();
    const ar = [];
    if (s === 1) {
      const u = L.units[curUnit()];
      const todo = u.letters.filter(l => !state.letters[l]);
      todo.forEach(l => {
        ar.push({ type: 'letter', key: 'L:' + l, l });
        ar.push({ type: 'harakat', key: 'H:' + l, l });
      });
      todo.slice(0, 2).forEach(l => ar.push({ type: 'pos', key: 'P:' + l, l }));
      // مراجعة حرفين متقنين سابقًا
      Object.keys(state.letters).slice(-2).forEach(l => ar.push({ type: 'letter', key: 'L:' + l, l, review: true }));
      steps.push({ name: `🔤 الحروف: ${u.letters.join(' ')}`, cards: ar.filter(c => !seen.has(c.key)) });
    } else if (s === 2 || s === 3) {
      const les = curLesson();
      les.items.slice(0, 8).forEach(t => ar.push({ type: 'item', key: `I:${les.id}:${t}`, lesson: les.id, text: t }));
      steps.push({ name: `${les.icon} ${les.title}`, cards: ar.filter(c => !seen.has(c.key)), lesson: les.id });
    }
    const story = curStory();
    if (story) steps.push({ name: `📖 قصة: ${story.title}`, story: story.id,
      cards: story.lines.map((t, i) => ({ type: 'line', key: `S:${story.id}:${i}`, story: story.id, text: t })) });

    // القرآن: تسميع ما قُدّم قبل اليوم، ثم آية جديدة (حدّ آيتين تحت الحفظ)
    const q = [], sur = curSurah();
    underMem().forEach(k => { if (state.qIntro[k] < today()) q.push({ type: 'qrecite', key: 'Q:' + k, k }); });
    const nextI = sur.ayat.findIndex((_, i) => !state.ayat[qKey(sur, i)] && !state.qIntro[qKey(sur, i)]);
    if (nextI >= 0 && underMem().length < 2 && !state.quranArchive[sur.surah]) q.push({ type: 'qnew', key: 'N:' + qKey(sur, nextI), k: qKey(sur, nextI) });
    if (q.length) steps.push({ name: `🌙 ${sur.name}`, cards: q, quran: true });

    // الإنجليزية: ٣–٤ بطاقات
    const en = [], g = engGroup();
    if (g >= 0) E.groups[g].filter(l => !state.eng[l]).slice(0, 3).forEach(l => en.push({ type: 'eng', key: 'E:' + l, l }));
    cvcReady().filter(c => !state.cvc[c.w]).slice(0, en.length ? 1 : 4).forEach(c => en.push({ type: 'cvc', key: 'C:' + c.w, w: c.w, e: c.e }));
    if (en.length) steps.push({ name: '🇬🇧 English', cards: en.slice(0, 4), en: true });

    return { date: today(), id: today() + '-' + Math.random().toString(36).slice(2, 7), steps,
      si: 0, ci: 0, first: {}, retries: {}, said: {}, requeued: {}, started: Date.now(), done: false, phase: 'cards' };
  }
  window.buildPlan = buildPlan;

  const M = () => state.mission;
  const curCard = () => { const m = M(); const st = m.steps[m.si]; return st && st.cards[m.ci]; };
  const totalCards = () => M().steps.reduce((n, s) => n + s.cards.length, 0);
  const doneCards = () => { const m = M(); let n = 0; for (let i = 0; i < m.si; i++) n += m.steps[i].cards.length; return n + m.ci; };

  /* ---------- عرض البطاقة ---------- */
  const hl = (word, l) => {
    const re = new RegExp(`(${l === 'ا' ? '[اأ]' : l}[ً-ْٰ]*)`, 'g');
    return esc(word).replace(re, '<b class="hl">$1</b>');
  };
  const wordsHTML = (text, lang) => text.split(/\s+/).map(w => {
    const clean = w.replace(/[.،!؟:]/g, '');
    const sight = (window.RAZAN_SIGHT || []).some(s => stripMarks(s) === stripMarks(clean));
    return `<span class="tw ${sight ? 'sight' : ''}" data-say="${esc(clean)}" data-lang="${lang || 'ar-SA'}">${esc(w)}</span>`;
  }).join(' ');

  function cardBody(c) {
    const i = L.info[c.l] || {};
    switch (c.type) {
      case 'letter': return `<div class="big-letter">${c.l}</div><div class="kw" data-say="${i.word}">${i.emoji} ${i.word}</div>
        <p class="ask">ما صوت الحرف؟</p>`;
      case 'harakat': return `<div class="row-letters">${HARAKAT.map(h => `<span class="mid-letter">${c.l === 'ا' ? 'أ' : c.l}${h}</span>`).join('')}</div>
        <p class="ask">اقرئي الحرف مع الحركة</p>`;
      case 'pos': return `<div class="pos-words">${(i.pos || []).map(w => `<span class="tw" data-say="${w}">${hl(w, c.l)}</span>`).join('')}</div>
        <p class="ask">أين الحرف «${c.l}» في كل كلمة؟</p>`;
      case 'item': { const les = lessonById(c.lesson);
        return `<div class="word-big" id="theWord">${wordsHTML(c.text)}</div>
        ${les && les.sylls ? `<button class="btn ghost sm" data-act="split">✂️ قسّميها</button>` : ''}`; }
      case 'line': return `<div class="story-line">${wordsHTML(c.text)}</div>`;
      case 'qnew': return window.qCardHTML(c.k, 'new');
      case 'qrecite': return window.qCardHTML(c.k, 'recite');
      case 'eng': { const x = E.letters[c.l];
        return `<div class="ltr"><div class="big-letter en">${c.l}${c.l.toUpperCase() !== c.l ? ' ' + c.l.toUpperCase() : ''}</div>
          <div class="kw tw" data-say="${x.word}" data-lang="en-US">${x.emoji} ${x.word}</div><p class="ask">What sound?</p></div>`; }
      case 'cvc': return `<div class="ltr"><div class="word-big en">${c.w.split('').map(ch => `<span class="tw" data-say="${ch}" data-lang="en-US">${ch}</span>`).join('')}</div>
        <div class="kw">${c.e}</div><p class="ask">Sound it out: ${c.w.split('').join(' - ')}</p></div>`;
    }
    return '';
  }
  function helpHTML(c) {
    const i = L.info[c.l] || {};
    const btn = (say, lang, label) => `<button class="btn ghost sm" data-say="${esc(say)}" data-lang="${lang}">🔊 ${label}</button>`;
    switch (c.type) {
      case 'letter': return `مساعدة: صوت الحرف هو أول صوت في «${i.word}». ${btn(i.word, 'ar-SA', 'الكلمة')}<br><small>👨‍🏫 انطقي الصوت أنتِ، لا اسم الحرف.</small>`;
      case 'harakat': return `مساعدة: فتحة = فم مفتوح، ضمة = شفتان مضمومتان، كسرة = ابتسامة. ${btn(HARAKAT.map(h => c.l + h).join(' '), 'ar-SA', 'استمعي')}`;
      case 'pos': return `مساعدة: الحرف ملوّن بالبرتقالي في كل كلمة.`;
      case 'item': return `مساعدة: ${btn(c.text, 'ar-SA', 'استمعي')} ثم اقرئيها معها مقطعًا مقطعًا.`;
      case 'line': return `مساعدة: انقري كل كلمة لسماعها، ثم تقرأ السطر كاملًا.`;
      case 'qrecite': return `مساعدة: ${'<button class="btn ghost sm" data-act="qplay">🔊 استمعي للآية</button>'} ثم تعيدها.`;
      case 'eng': return `Help: ${btn(E.letters[c.l].word, 'en-US', E.letters[c.l].word)} — first sound ${E.letters[c.l].sound}`;
      case 'cvc': return `Help: ${btn(c.w, 'en-US', c.w)}`;
    }
    return '';
  }

  function render() {
    const box = $('#missionBox'); if (!box) return;
    const m = M();
    if (!m || m.date !== today()) return renderStart(box);
    if (m.phase === 'rest') return renderRest(box);
    if (m.phase === 'end' || m.done) return renderEnd(box);
    const st = m.steps[m.si], c = curCard();
    if (!c) return next();
    const r = m.retries[c.key] || 0;
    const pct = Math.round(doneCards() / Math.max(1, totalCards()) * 100);
    const okLabel = c.type === 'qnew' ? '✅ استمعت وبنتها' : c.type === 'qrecite' ? '✅ سمّعتها صح' : '✅ قرأتها صح';
    box.innerHTML = `
      <div class="mbar"><span style="width:${pct}%"></span></div>
      <p class="step-name">الخطوة ${ar(m.si + 1)} من ${ar(m.steps.length)}: ${esc(st.name)}
        <small>(${ar(m.ci + 1)} / ${ar(st.cards.length)})</small></p>
      ${st.quran ? `<p class="qtimer" id="qtimer"></p>` : ''}
      <div class="card ${c.type.startsWith('e') || c.type === 'cvc' ? 'ltr-card' : ''}">${cardBody(c)}</div>
      <div class="help ${r >= 1 ? 'show' : ''}">${r >= 1 ? helpHTML(c) : ''}
        ${r >= 1 && c.type !== 'qnew' ? `<label class="said">ماذا قالت؟ (اختياري)<input id="saidIn" value="${esc(m.said[c.key] || '')}" placeholder="اكتبي ما قالته"></label>` : ''}
      </div>
      <div class="supervisor">
        <p class="sup-lbl">👩 للمشرفة</p>
        <button class="btn ok" data-act="ok">${okLabel}</button>
        ${c.type === 'qnew' ? '' : `<button class="btn again" data-act="again">🔁 نعيدها</button>`}
      </div>`;
    if (st.quran) quranTimer();
  }
  window.renderMission = render;

  function quranTimer() {
    const m = M(); m.qStart = m.qStart || Date.now();
    const el = $('#qtimer'); if (!el) return;
    const mins = (Date.now() - m.qStart) / 60000;
    el.textContent = mins >= 8 ? '⏱️ انتهت ٨ دقائق القرآن — يمكنكِ الانتقال' : '';
    if (mins >= 8 && !el.querySelector('button')) {
      const b = document.createElement('button'); b.className = 'btn ghost sm'; b.textContent = 'تخطّي إلى الخطوة التالية ⏭️';
      b.onclick = () => { m.si++; m.ci = 0; save(); next(true); }; el.appendChild(b);
    }
  }

  function renderStart(box) {
    const done = state.mission && state.mission.date === today() && state.mission.done;
    const plan = buildPlan();
    box.innerHTML = `<div class="start">
      <h2>🚀 مهمتي اليوم</h2>
      ${done ? '<p class="good">أنجزتِ مهمة اليوم 🌟 تعالي غدًا!</p>' : ''}
      <ol class="plan">${plan.steps.map(s => `<li>${esc(s.name)} <small>(${ar(s.cards.length)})</small></li>`).join('')}</ol>
      <button class="btn big" data-act="start">${done ? 'مهمة إضافية' : 'ابدئي ✨'}</button>
      <p class="muted">⭐ ${ar(state.stars || 0)} — 🔥 ${ar(state.streak || 0)} يوم</p></div>`;
  }

  /* ---------- الأزرار ---------- */
  function ok() {
    const m = M(), c = curCard(); if (!c) return;
    const said = $('#saidIn'); if (said && said.value.trim()) m.said[c.key] = said.value.trim();
    if (!(c.key in m.first)) {
      const first = !(m.retries[c.key] > 0);
      m.first[c.key] = first;
      if (first) {
        clearTrouble(c.key);
        if (c.type === 'letter') { if (passLetter(c.l)) { toast(`🏅 أتقنتِ حرف ${c.l}!`); confetti(); } }
        if (c.type === 'eng' && passEng(c.l)) toast(`🏅 Letter ${c.l}!`);
        if (c.type === 'cvc' && passCvc(c.w)) toast(`🏅 ${c.w}!`);
        if (c.type === 'qrecite' && passAyah(c.k)) { toast('🏅 حفظتِ الآية!'); confetti(); }
        addStars(1);
      }
      if (c.type === 'qnew') state.qIntro[c.k] = state.qIntro[c.k] || today();
    } else if (!m.first[c.key] && m.requeued[c.key]) {
      // قُرئت بعد الإعادة — تبقى للغد حتى تُقرأ من أول مرة
    }
    m.ci++; save(); next();
  }
  function again() {
    const m = M(), c = curCard(); if (!c) return;
    const said = $('#saidIn'); if (said && said.value.trim()) m.said[c.key] = said.value.trim();
    m.retries[c.key] = (m.retries[c.key] || 0) + 1;
    if (m.retries[c.key] === 1) {
      if (c.type === 'item' || c.type === 'line') speak(c.text);
      save(); return render();
    }
    // المرة الثانية: لآخر الخطوة + تُحفظ لمهمة الغد
    addTrouble(c);
    m.first[c.key] = false;
    const st = m.steps[m.si];
    if (!m.requeued[c.key]) { m.requeued[c.key] = true; st.cards.splice(m.ci, 1); st.cards.push(c); m.retries[c.key] = 1; }
    else m.ci++;
    save(); next();
  }
  window.missionOk = ok; window.missionAgain = again;

  function next(force) {
    const m = M(), st = m.steps[m.si];
    if (st && m.ci < st.cards.length && !force) return render();
    if (st && m.ci >= st.cards.length) {
      scoreStep(st);
      m.si++; m.ci = 0;
    }
    if (m.si >= m.steps.length) { m.phase = 'rest'; m.restEnd = Date.now() + 60000; }
    save(); render();
  }
  function scoreStep(st) {
    const m = M();
    if (st.lesson) {
      const cs = st.cards.filter(c => c.type === 'item');
      if (cs.length && scoreLesson('lesson', st.lesson, cs.filter(c => m.first[c.key]).length, cs.length)) { toast('🏅 أتقنتِ الدرس!'); confetti(); }
    }
    if (st.story) {
      const cs = st.cards;
      if (scoreLesson('story', st.story, cs.filter(c => m.first[c.key]).length, cs.length)) { toast('📖 أنهيتِ القصة!'); confetti(); addStars(3); }
    }
  }

  let restTimer = null;
  function renderRest(box) {
    const left = Math.max(0, Math.ceil((M().restEnd - Date.now()) / 1000));
    box.innerHTML = `<div class="rest"><h2>🧘 استراحة دقيقة</h2><div class="rest-n">${ar(left)}</div>
      <p>اشربي ماء، تمدّدي، وحرّكي يديك 🙆‍♀️</p><button class="btn ghost" data-act="skipRest">تخطّي</button></div>`;
    clearTimeout(restTimer);
    if (left > 0) restTimer = setTimeout(render, 1000); else { M().phase = 'end'; save(); render(); }
  }

  const MOODS = [['😄', 'مستمتعة'], ['🙂', 'جيدة'], ['😐', 'عادية'], ['😴', 'متعبة']];
  function stats() {
    const m = M(); const keys = Object.keys(m.first);
    const ok = keys.filter(k => m.first[k]).length;
    return { cards: keys.length, firstOk: ok, pct: keys.length ? Math.round(ok / keys.length * 100) : 0,
      minutes: Math.max(1, Math.round((Date.now() - m.started) / 60000)), mood: m.mood || '',
      trouble: (state.trouble || []).map(t => labelOf(t.card)) };
  }
  const labelOf = c => c.l ? c.l : c.text ? c.text : c.w ? c.w : c.k ? 'آية ' + c.k : c.key;
  function summary() {
    const m = M(), s = stats();
    const again = Object.keys(m.first).filter(k => !m.first[k]);
    const findCard = k => { for (const st of m.steps) for (const c of st.cards) if (c.key === k) return c; return null; };
    const lines = [
      `🌟 مهمة ${state.name} — ${m.date}`,
      `⏱️ ${s.minutes} دقيقة | ✅ ${s.firstOk} من ${s.cards} من أول مرة (${s.pct}٪)`,
      `🗂️ الخطوات: ${m.steps.map(x => x.name).join(' • ')}`,
      again.length ? `🔁 احتاجت إعادة: ${again.map(k => { const c = findCard(k); return c ? labelOf(c) : k; }).join('، ')}` : '🔁 لا شيء احتاج إعادة 👏',
      Object.keys(m.said).length ? `🗣️ ماذا قالت: ${Object.entries(m.said).map(([k, v]) => { const c = findCard(k); return `${c ? labelOf(c) : k} ← «${v}»`; }).join('، ')}` : '',
      `📍 المرحلة: ${window.stageLabel ? stageLabel() : ''}`,
      m.mood ? `💭 المزاج: ${m.mood}` : '',
      `⭐ النجوم: ${state.stars} | 🔥 ${state.streak || 1} يوم`
    ].filter(Boolean);
    return lines.join('\n');
  }
  window.missionSummary = summary;

  function finish() {
    const m = M();
    if (!m.logged) {
      m.logged = true;
      state.missionLog = (state.missionLog || []).filter(x => x.id !== m.id).concat({ date: m.date, id: m.id, stats: stats() }).slice(-90);
      state.lastMission = m.date;
      const dates = new Set(state.missionLog.map(x => x.date)); let n = 0, d = new Date(m.date + 'T12:00:00Z');
      while (dates.has(d.toISOString().slice(0, 10))) { n++; d = new Date(d - 864e5); } state.streak = n;
      addStars(2);
    }
    m.done = true; save();
    if (window.syncReport) syncReport({ date: m.date, summary: summary(), stats: stats(), clientId: m.id });
  }

  function renderEnd(box) {
    const m = M(); if (!m.done) finish();
    box.innerHTML = `<div class="end"><h2>🎉 أحسنتِ يا ${state.name}!</h2>
      <p>كيف كانت رزان اليوم؟</p>
      <div class="moods">${MOODS.map(([e, t]) => `<button class="btn mood ${m.mood === t ? 'sel' : ''}" data-mood="${t}">${e}<small>${t}</small></button>`).join('')}</div>
      <pre class="summary" id="sumTxt">${esc(summary())}</pre>
      <a class="btn wa" target="_blank" href="https://wa.me/?text=${encodeURIComponent(summary())}">📲 إرسال واتساب</a>
      <button class="btn ghost" data-act="home">🏠 العودة</button></div>`;
    confetti();
  }

  /* ---------- الأحداث ---------- */
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-act],[data-say],[data-mood]'); if (!t || !t.closest('#missionBox')) return;
    if (t.dataset.say) return speak(t.dataset.say, t.dataset.lang || 'ar-SA');
    if (t.dataset.mood) { M().mood = t.dataset.mood; save(); finish(); return render(); }
    const a = t.dataset.act;
    if (a === 'start') { state.mission = buildPlan(); save(); return render(); }
    if (a === 'ok') return ok();
    if (a === 'again') return again();
    if (a === 'skipRest') { M().phase = 'end'; save(); return render(); }
    if (a === 'home') { state.mission.phase = 'end'; save(); return renderStart($('#missionBox')); }
    if (a === 'split') { const w = $('#theWord'); const c = curCard(); if (w && c) w.innerHTML = window.syllables(c.text).map(s => `<span class="syl tw" data-say="${s}">${s}</span>`).join('<i class="dash">ـ</i>'); }
    if (a === 'qplay') { const c = curCard(); if (c) window.qPlayFull(c.k); }
    if (a && a.startsWith('q:')) window.qAction(a, t);
  });
  window.reloadMission = render;
})();
