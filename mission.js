/* =========================================================
   🚀 مهمتي — مهمة يومية ≈١٥ دقيقة، كل شيء منطوق
   الحَكَم هو الكبير: «✅ قرأتها صح» أو «🔁 نعيدها».
   🔁 أولى = مساعدة + «ماذا قالت؟»، 🔁 ثانية = البطاقة لآخر الخطوة وتُحفظ لمهمة الغد.
   بطاقات الألعاب (🎯 اختاري الصورة) تحكم عليها رزان بنقرتها هي.
   الوضعان:
   - وضع المدرسة (الافتراضي): حرف الأسبوع + مراجعة ما أخذته + كلمات من حروفها فقط
   - المسار المرتّب: وحدات الحروف ثم الدروس (القاعدة النورانية)
   ========================================================= */
(() => {
  const L = window.RAZAN_LETTERS, LS = window.RAZAN_LESSONS, ST = window.RAZAN_STORIES, E = window.RAZAN_ENGLISH;
  const HARAKAT = ['َ', 'ُ', 'ِ'];
  const MADD = ['َا', 'ُو', 'ِي'];
  const lessonById = id => LS.find(x => x.id === id);
  const nameOf = l => (L.names || {})[l] || l;
  const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
  const letterB = l => l === 'ا' ? 'أ' : l;

  /* ---------- بطاقات الحرف (مشتركة بين الوضعين) ---------- */
  function letterCards(l, full) {
    const cs = [{ type: 'letter', key: 'L:' + l, l }, { type: 'harakat', key: 'H:' + l, l }];
    if (full) cs.push({ type: 'madd', key: 'D:' + l, l }, { type: 'pos', key: 'P:' + l, l }, { type: 'pick', key: 'K:' + l, l });
    return cs;
  }

  /* ---------- بناء خطة اليوم ---------- */
  function buildPlan() {
    const steps = [];
    const trouble = (state.trouble || []).slice(0, 6).map(t => t.card);
    const seen = new Set(trouble.map(c => c.key));
    if (trouble.length) steps.push({ name: '🔁 نراجع ما صعب أمس', icon: '🔁', cards: trouble });
    const keep = cs => cs.filter(c => !seen.has(c.key));

    if (schoolMode()) {
      const cur = state.school.cur;
      if (cur && L.info[cur]) steps.push({ name: `🎯 حرف الأسبوع: ${cur}`, icon: '🎯', cards: keep(letterCards(cur, true)) });
      // مراجعة: ما لم يُتقن بعد أولًا، ثم المتقن — ٤ حروف
      const known = (state.school.known || []).filter(l => l !== cur && L.info[l]);
      const rev = known.filter(l => !state.letters[l]).concat(shuffle(known.filter(l => state.letters[l]))).slice(0, 4);
      if (rev.length) steps.push({ name: '🔤 حروف أعرفها', icon: '🔤', cards: keep(rev.map(l => ({ type: 'letter', key: 'L:' + l, l }))) });
      // كلمات من حروفها فقط
      const ws = wordsFor(schoolLetters(), cur).filter(x => !(state.wordsOk || {})[x.w]).concat(wordsFor(schoolLetters(), cur)).slice(0, 4);
      const uniq = []; ws.forEach(x => { if (!uniq.some(y => y.w === x.w)) uniq.push(x); });
      if (uniq.length) steps.push({ name: '🧩 أقرأ كلمات', icon: '🧩', cards: keep(uniq.map(x => ({ type: 'word', key: 'W:' + x.w, text: x.w, e: x.e }))) });
    } else {
      const s = arabicStage();
      if (s === 1) {
        const u = L.units[curUnit()];
        const todo = u.letters.filter(l => !state.letters[l]);
        const ar = [];
        todo.forEach(l => ar.push(...letterCards(l, false)));
        todo.slice(0, 2).forEach(l => ar.push({ type: 'pos', key: 'P:' + l, l }, { type: 'pick', key: 'K:' + l, l }));
        Object.keys(state.letters).slice(-2).forEach(l => ar.push({ type: 'letter', key: 'L:' + l, l, review: true }));
        steps.push({ name: `🔤 الحروف: ${u.letters.join(' ')}`, icon: '🔤', cards: keep(ar) });
      } else if (s === 2 || s === 3) {
        const les = curLesson();
        steps.push({ name: `${les.icon} ${les.title}`, icon: les.icon, lesson: les.id,
          cards: keep(les.items.slice(0, 8).map(t => ({ type: 'item', key: `I:${les.id}:${t}`, lesson: les.id, text: t }))) });
      }
    }
    const story = curStory();
    if (story) steps.push({ name: `📖 قصة: ${story.title}`, icon: '📖', story: story.id,
      cards: story.lines.map((t, i) => ({ type: 'line', key: `S:${story.id}:${i}`, story: story.id, text: t })) });

    // القرآن: تسميع ما قُدّم قبل اليوم، ثم آية جديدة (حدّ آيتين تحت الحفظ)
    const q = [], sur = curSurah();
    underMem().forEach(k => { if (state.qIntro[k] < today()) q.push({ type: 'qrecite', key: 'Q:' + k, k }); });
    const nextI = sur.ayat.findIndex((_, i) => !state.ayat[qKey(sur, i)] && !state.qIntro[qKey(sur, i)]);
    if (nextI >= 0 && underMem().length < 2 && !state.quranArchive[sur.surah]) q.push({ type: 'qnew', key: 'N:' + qKey(sur, nextI), k: qKey(sur, nextI) });
    if (!q.length && sur.ayat.length) { const r = Math.floor(Math.random() * sur.ayat.length); q.push({ type: 'qrecite', key: 'R:' + qKey(sur, r), k: qKey(sur, r), review: true }); }
    steps.push({ name: `🌙 ${sur.name}`, icon: '🌙', cards: q, quran: true });

    // الإنجليزية: ٣–٤ بطاقات
    const en = [], g = engGroup();
    if (g >= 0) E.groups[g].filter(l => !state.eng[l]).slice(0, 3).forEach(l => en.push({ type: 'eng', key: 'E:' + l, l }));
    cvcReady().filter(c => !state.cvc[c.w]).slice(0, en.length ? 1 : 4).forEach(c => en.push({ type: 'cvc', key: 'C:' + c.w, w: c.w, e: c.e }));
    if (en.length) steps.push({ name: '🇬🇧 English', icon: '🇬🇧', cards: en.slice(0, 4), en: true });

    return { date: today(), id: today() + '-' + Math.random().toString(36).slice(2, 7), steps: steps.filter(s => s.cards.length),
      si: 0, ci: 0, first: {}, retries: {}, said: {}, requeued: {}, started: Date.now(), done: false, phase: 'cards', starsToday: 0 };
  }
  window.buildPlan = buildPlan;

  const M = () => state.mission;
  const curCard = () => { const m = M(); const st = m.steps[m.si]; return st && st.cards[m.ci]; };
  const totalCards = () => M().steps.reduce((n, s) => n + s.cards.length, 0);
  const doneCards = () => { const m = M(); let n = 0; for (let i = 0; i < m.si; i++) n += m.steps[i].cards.length; return n + m.ci; };

  /* ---------- ما يُقال لكل بطاقة ---------- */
  function cardSay(c) {
    const i = L.info[c.l] || {};
    switch (c.type) {
      case 'letter': return [['مَا صَوْتُ هَذَا الحَرْف؟'], [i.word]];
      case 'harakat': return [['اقْرَئِي الحَرْفَ مَعَ الحَرَكَة']];
      case 'madd': return [['اقْرَئِي الحَرْفَ مَعَ المَدّ، صَوْت طَوِيل']];
      case 'pos': return [[`أَيْنَ حَرْفُ ${nameOf(c.l)} فِي كُلِّ كَلِمَة؟`]];
      case 'pick': return [[`اخْتَارِي الصُّورَةَ الَّتِي تَبْدَأُ بِحَرْفِ ${nameOf(c.l)}`]];
      case 'word': case 'item': return [['اقْرَئِي الكَلِمَة']];
      case 'line': return [['اقْرَئِي السَّطْر، وَإِصْبَعُكِ تَحْتَ الكَلِمَات']];
      case 'qnew': return [['آيَةٌ جَدِيدَة، نَسْتَمِعُ وَنُرَدِّد']];
      case 'qrecite': return [['سَمِّعِي الآيَةَ مِنْ حِفْظِكِ']];
      case 'eng': return [[E.letters[c.l].word, 'en-US'], ['What sound?', 'en-US']];
      case 'cvc': return [['Sound it out!', 'en-US']];
    }
    return [];
  }
  const sayText = c => cardSay(c).map(p => p[0]).join(' — ');

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
  function pickOptions(c) {
    if (c.opts) return c.opts;
    const others = shuffle(Object.keys(L.info).filter(x => x !== c.l && baseLetters(L.info[x].word)[0] !== c.l)).slice(0, 2);
    c.opts = shuffle([c.l, ...others]);
    return c.opts;
  }

  function cardBody(c, m) {
    const i = L.info[c.l] || {};
    const revealed = m.first[c.key] !== undefined;
    switch (c.type) {
      case 'letter': return `<div class="big-letter pop-in">${c.l}</div><button class="kw chip-say" data-say="${i.word}">${i.emoji} ${i.word} 🔊</button>`;
      case 'harakat': return `<div class="row-letters">${HARAKAT.map(h => `<span class="mid-letter bubble">${letterB(c.l)}${h}</span>`).join('')}</div>`;
      case 'madd': return `<div class="row-letters">${MADD.map(h => `<span class="mid-letter bubble">${letterB(c.l)}${h}</span>`).join('')}</div>`;
      case 'pos': return `<div class="pos-words">${(i.pos || []).map(w => `<span class="tw bubble" data-say="${w}">${hl(w, c.l)}</span>`).join('')}</div>`;
      case 'pick': return `<div class="big-letter sm-letter">${c.l}</div><div class="pick-row">${pickOptions(c).map(o =>
        `<button class="pick" data-pick="${o}">${L.info[o].emoji}</button>`).join('')}</div>
        <p class="muted">👆 انقري الصورة — وانقري 🔊 لتسمعي اسمها</p>
        <div class="pick-say">${pickOptions(c).map(o => `<button class="mini" data-say="${L.info[o].word}">🔊 ${L.info[o].emoji}</button>`).join('')}</div>`;
      case 'word': return `<div class="word-big">${wordsHTML(c.text)}</div>
        <div class="reveal ${revealed ? 'show' : ''}">${c.e}</div>`;
      case 'item': { const les = lessonById(c.lesson);
        return `<div class="word-big" id="theWord">${wordsHTML(c.text)}</div>
        ${les && les.sylls ? `<button class="btn ghost sm" data-act="split">✂️ قسّميها</button>` : ''}`; }
      case 'line': return `<div class="story-line">${wordsHTML(c.text)}</div>`;
      case 'qnew': return window.qCardHTML(c.k, 'new');
      case 'qrecite': return window.qCardHTML(c.k, 'recite');
      case 'eng': { const x = E.letters[c.l];
        return `<div class="ltr"><div class="big-letter en pop-in">${c.l} ${c.l.toUpperCase()}</div>
          <button class="kw chip-say" data-say="${x.word}" data-lang="en-US">${x.emoji} ${x.word} 🔊</button></div>`; }
      case 'cvc': return `<div class="ltr"><div class="word-big en">${c.w.split('').map(ch => `<span class="tw bubble" data-say="${ch}" data-lang="en-US">${ch}</span>`).join('')}</div>
        <div class="reveal ${revealed ? 'show' : ''}">${c.e}</div></div>`;
    }
    return '';
  }
  function helpHTML(c) {
    const i = L.info[c.l] || {};
    const btn = (say, lang, label) => `<button class="btn ghost sm" data-say="${esc(say)}" data-lang="${lang}">🔊 ${label}</button>`;
    switch (c.type) {
      case 'letter': return `💡 صوت الحرف هو أول صوت في «${i.word}» ${i.emoji} ${btn(i.word, 'ar-SA', 'الكلمة')}<br><small>👩 انطقي الصوت أنتِ، لا اسم الحرف.</small>`;
      case 'harakat': return `💡 فتحة = فم مفتوح، ضمة = شفتان مضمومتان، كسرة = ابتسامة. ${btn(HARAKAT.map(h => letterB(c.l) + h).join(' '), 'ar-SA', 'استمعي')}`;
      case 'madd': return `💡 المدّ = نمدّ الصوت ونعدّ إصبعين. ${btn(MADD.map(h => letterB(c.l) + h).join(' '), 'ar-SA', 'استمعي')}`;
      case 'pos': return `💡 الحرف ملوّن بالبرتقالي في كل كلمة.`;
      case 'pick': return `💡 انقري 🔊 تحت كل صورة واسمعي: أيّها يبدأ بصوت «${i.word}»؟`;
      case 'word': case 'item': return `💡 ${btn(c.text, 'ar-SA', 'استمعي')} ثم اقرئيها معها حرفًا حرفًا.`;
      case 'line': return `💡 انقري كل كلمة لسماعها، ثم تقرأ السطر كاملًا.`;
      case 'qrecite': return `💡 <button class="btn ghost sm" data-act="qplay">🔊 استمعي للآية</button> ثم تعيدها.`;
      case 'eng': return `💡 ${btn(E.letters[c.l].word, 'en-US', E.letters[c.l].word)} — first sound ${E.letters[c.l].sound}`;
      case 'cvc': return `💡 ${btn(c.w, 'en-US', c.w)}`;
    }
    return '';
  }

  /* ---------- الشاشة ---------- */
  const mascot = (text, act = 'repeat') => `<div class="mascot"><div class="owl">🦉</div>
    <div class="bubble-say"><span>${esc(text)}</span><button class="say-btn" data-act="${act}" aria-label="أعيدي">🔊</button></div></div>`;
  const pathBar = () => {
    const pct = Math.round(doneCards() / Math.max(1, totalCards()) * 100);
    return `<div class="trail"><div class="trail-fill" style="width:${pct}%"></div><span class="trail-owl" style="right:calc(${pct}% - 22px)">🦉</span><span class="trail-end">🏁</span></div>`;
  };

  function render(quiet) {
    const box = $('#missionBox'); if (!box) return;
    const m = M();
    if (!m || m.date !== today()) return renderStart(box);
    if (m.phase === 'rest') return renderRest(box);
    if (m.phase === 'end' || m.done) return renderEnd(box);
    const st = m.steps[m.si], c = curCard();
    if (!c) return next();
    const r = m.retries[c.key] || 0;
    const okLabel = c.type === 'qnew' ? '✅ استمعت وردّدت' : c.type === 'qrecite' ? '✅ سمّعتها صح' : '✅ قرأتها صح';
    const game = c.type === 'pick';
    box.innerHTML = `
      ${pathBar()}
      <p class="step-name">${esc(st.name)}
        <small>${ar(m.ci + 1)} / ${ar(st.cards.length)}</small> <span class="today-stars">⭐ ${ar(m.starsToday || 0)}</span></p>
      ${mascot(sayText(c))}
      ${st.quran ? `<p class="qtimer" id="qtimer"></p>` : ''}
      <div class="card card-${c.type} ${c.type === 'eng' || c.type === 'cvc' ? 'ltr-card' : ''}">${cardBody(c, m)}</div>
      <div class="help ${r >= 1 ? 'show' : ''}">${r >= 1 ? helpHTML(c) : ''}
        ${r >= 1 && c.type !== 'qnew' && !game ? `<label class="said">ماذا قالت؟ (اختياري)<input id="saidIn" value="${esc(m.said[c.key] || '')}" placeholder="اكتبي ما قالته"></label>` : ''}
      </div>
      ${game ? '' : `<div class="supervisor">
        <p class="sup-lbl">👩 للماما</p>
        <button class="btn ok" data-act="ok">${okLabel}</button>
        ${c.type === 'qnew' ? '' : `<button class="btn again" data-act="again">🔁 نعيدها</button>`}
      </div>`}`;
    if (st.quran) quranTimer();
    if (!quiet) {
      autoSay([...(praiseNext || []), ...cardSay(c)]); praiseNext = null;
      if (c.type === 'qnew') setTimeout(() => { if (curCard() === c && state.auto !== false) qPlayFull(c.k); }, 2500);
    }
  }
  window.renderMission = render;

  function quranTimer() {
    const m = M(); m.qStart = m.qStart || Date.now();
    const el = $('#qtimer'); if (!el) return;
    const mins = (Date.now() - m.qStart) / 60000;
    el.textContent = mins >= 8 ? '⏱️ انتهت ٨ دقائق القرآن — يمكنكِ الانتقال' : '';
    if (mins >= 8 && !el.querySelector('button')) {
      const b = document.createElement('button'); b.className = 'btn ghost sm'; b.textContent = 'التالي ⏭️';
      b.onclick = () => { m.si++; m.ci = 0; save(); next(true); }; el.appendChild(b);
    }
  }

  function renderStart(box) {
    const done = state.mission && state.mission.date === today() && state.mission.done;
    const plan = buildPlan();
    const needSetup = schoolMode() && !(state.school.known || []).length;
    box.innerHTML = `<div class="start">
      <div class="hero"><span class="owl big">🦉</span><div class="hero-say">مَرْحَبًا يَا رَزَان! 🌸</div></div>
      ${needSetup ? `<button class="btn setup" data-goto="mom">👩 ماما: اختاري الحروف اللي أخذتها رزان بالمدرسة</button>` : ''}
      ${done ? '<p class="good">أنجزتِ مهمة اليوم 🌟 تعالي غدًا!</p>' : ''}
      <div class="islands">${plan.steps.map((s, i) => `<div class="island" style="--d:${i * .08}s"><span>${s.icon || '⭐'}</span><small>${esc(s.name.replace(/^\S+\s/, ''))}</small></div>`).join('')}</div>
      <button class="btn big go" data-act="start">${done ? '🎮 مهمة إضافية' : '🚀 هيّا نبدأ!'}</button>
      <div class="stats-row"><span>⭐ ${ar(state.stars || 0)}</span><span>🔥 ${ar(state.streak || 0)} يوم</span></div></div>`;
  }

  /* ---------- الأزرار ---------- */
  function ok(el) {
    const m = M(), c = curCard(); if (!c) return;
    const said = $('#saidIn'); if (said && said.value.trim()) m.said[c.key] = said.value.trim();
    let first = false;
    if (!(c.key in m.first)) {
      first = !(m.retries[c.key] > 0);
      m.first[c.key] = first;
      if (first) {
        clearTrouble(c.key);
        if (c.type === 'letter') { if (passLetter(c.l)) { toast(`🏅 أتقنتِ حرف ${c.l}!`); confetti(); } }
        if (c.type === 'word') { state.wordsOk = state.wordsOk || {}; state.wordsOk[c.text] = today(); }
        if (c.type === 'eng' && passEng(c.l)) toast(`🏅 Letter ${c.l}!`);
        if (c.type === 'cvc' && passCvc(c.w)) toast(`🏅 ${c.w}!`);
        if (c.type === 'qrecite' && passAyah(c.k)) { toast('🏅 حفظتِ الآية!'); confetti(); }
        addStars(1); m.starsToday = (m.starsToday || 0) + 1;
      }
      if (c.type === 'qnew') state.qIntro[c.k] = state.qIntro[c.k] || today();
    }
    sfx(first ? 'star' : 'ok');
    // مكافأة: صورة الكلمة تطير مع النجمة، ثم مدح منطوق قبل البطاقة التالية
    const reveal = (c.type === 'word' || c.type === 'cvc');
    starBurst(el || $('[data-act="ok"]'), reveal ? `${c.e} ⭐` : first ? '⭐ +١' : '👍');
    const en = c.type === 'eng' || c.type === 'cvc';
    praiseNext = en ? (reveal ? [[c.w, 'en-US'], ['Great!', 'en-US']] : [['Great!', 'en-US']])
                    : (reveal ? [[praise()], [c.text]] : [[praise()]]);
    m.ci++; save(); next();
  }
  let praiseNext = null;
  function again() {
    const m = M(), c = curCard(); if (!c) return;
    const said = $('#saidIn'); if (said && said.value.trim()) m.said[c.key] = said.value.trim();
    m.retries[c.key] = (m.retries[c.key] || 0) + 1;
    sfx('again');
    if (m.retries[c.key] === 1) {
      save(); render(true);
      if (c.type === 'item' || c.type === 'word' || c.type === 'line') sayAll([['نُحَاوِلُ مَعًا'], [c.text]]);
      else if (c.type === 'letter') sayAll([['نُحَاوِلُ مَعًا'], [L.info[c.l].word]]);
      else autoSay([['نُحَاوِلُ مَرَّةً ثَانِيَة']]);
      return;
    }
    // المرة الثانية: لآخر الخطوة + تُحفظ لمهمة الغد
    addTrouble(c);
    m.first[c.key] = false;
    const st = m.steps[m.si];
    if (!m.requeued[c.key]) { m.requeued[c.key] = true; st.cards.splice(m.ci, 1); st.cards.push(c); m.retries[c.key] = 1; }
    else m.ci++;
    autoSay([['لَا بَأْس، نَرْجِعُ لَهَا بَعْدَ قَلِيل']]);
    save(); next(false, true);
  }
  function pick(o, el) {
    const c = curCard(); if (!c || c.type !== 'pick') return;
    if (o === c.l) { el.classList.add('right'); ok(el); }
    else { el.classList.add('wobble'); sfx('again'); speak(L.info[o].word); setTimeout(() => { if (curCard() === c) again(); }, 900); }
  }
  window.missionOk = () => ok(); window.missionAgain = again; window.missionPick = o => pick(o, document.querySelector(`[data-pick="${o}"]`) || document.body);

  function next(force, keepVoice) {
    const m = M(), st = m.steps[m.si];
    if (st && m.ci < st.cards.length && !force) return render(keepVoice);
    if (st && m.ci >= st.cards.length) {
      scoreStep(st);
      m.si++; m.ci = 0;
      if (m.si < m.steps.length) { sfx('pop'); toast(`✨ ${m.steps[m.si].name}`); }
    }
    if (m.si >= m.steps.length) { m.phase = 'rest'; m.restEnd = Date.now() + 60000; autoSay([...(praiseNext || []), ['اسْتِرَاحَة! قُومِي وَتَحَرَّكِي قَلِيلًا']]); praiseNext = null; }
    save(); render(m.phase === 'rest' || keepVoice);
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
    box.innerHTML = `<div class="rest"><div class="owl big bounce">🦉</div><h2>🧃 استراحة!</h2><div class="rest-n">${ar(left)}</div>
      <p>اشربي ماء، اقفزي ٥ مرات، وحرّكي يديك 🙆‍♀️</p><button class="btn ghost" data-act="skipRest">تخطّي ⏭️</button></div>`;
    clearTimeout(restTimer);
    if (left > 0) restTimer = setTimeout(() => render(true), 1000); else { M().phase = 'end'; save(); render(); }
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
      addStars(2); m.starsToday = (m.starsToday || 0) + 2;
    }
    m.done = true; save();
    if (window.syncReport) syncReport({ date: m.date, summary: summary(), stats: stats(), clientId: m.id });
  }

  function renderEnd(box) {
    const m = M(); const first = !m.done; if (first) finish();
    box.innerHTML = `<div class="end">
      <button class="chest ${m.opened ? 'open' : ''}" data-act="chest">${m.opened ? '🎉' : '🎁'}</button>
      <h2>${m.opened ? `جمعتِ ${ar(m.starsToday || 0)} نجمة اليوم! ⭐` : 'انقري الهدية! 🎁'}</h2>
      <div class="mom-zone">
        <p class="sup-lbl">👩 للماما: كيف كانت رزان اليوم؟</p>
        <div class="moods">${MOODS.map(([e, t]) => `<button class="btn mood ${m.mood === t ? 'sel' : ''}" data-mood="${t}">${e}<small>${t}</small></button>`).join('')}</div>
        <details><summary>📝 الملخص</summary><pre class="summary" id="sumTxt">${esc(summary())}</pre></details>
        <a class="btn wa" target="_blank" href="https://wa.me/?text=${encodeURIComponent(summary())}">📲 إرسال واتساب</a>
      </div>
      <button class="btn ghost" data-act="home">🏠 العودة</button></div>`;
    if (first) { sfx('win'); confetti(); autoSay([['أَحْسَنْتِ يَا رَزَان! أَنْهَيْتِ مُهِمَّةَ اليَوْم. انْقُرِي الهَدِيَّة']]); }
  }

  /* ---------- الأحداث ---------- */
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-act],[data-say],[data-mood],[data-pick]'); if (!t || !t.closest('#missionBox')) return;
    if (t.dataset.pick) return pick(t.dataset.pick, t);
    if (t.dataset.say) { sfx('pop'); return speak(t.dataset.say, t.dataset.lang || 'ar-SA'); }
    if (t.dataset.mood) { M().mood = t.dataset.mood; save(); finish(); return render(true); }
    const a = t.dataset.act;
    if (a === 'start') { state.mission = buildPlan(); save(); sfx('pop'); return render(); }
    if (a === 'repeat') { const c = curCard(); if (c) sayAll(cardSay(c)); return; }
    if (a === 'ok') return ok(t);
    if (a === 'again') return again();
    if (a === 'skipRest') { M().phase = 'end'; save(); return render(); }
    if (a === 'chest') { const m = M(); if (!m.opened) { m.opened = true; save(); sfx('star'); confetti(); render(true);
      speak(`جَمَعْتِ ${m.starsToday || 0} نَجْمَة! أَحْسَنْتِ`); } return; }
    if (a === 'home') { state.mission.phase = 'end'; save(); return renderStart($('#missionBox')); }
    if (a === 'split') { const w = $('#theWord'); const c = curCard(); if (w && c) w.innerHTML = window.syllables(c.text).map(s => `<span class="syl tw" data-say="${s}">${s}</span>`).join('<i class="dash">ـ</i>'); }
    if (a === 'qplay') { const c = curCard(); if (c) window.qPlayFull(c.k); }
    if (a && a.startsWith('q:')) window.qAction(a, t);
  });
  window.reloadMission = render;
})();
