/* =========================================================
   🧭 الواجهات: الحروف، القراءة، English، رحلتي، تقدّمي، الدليل
   ========================================================= */
(() => {
  const L = window.RAZAN_LETTERS, LS = window.RAZAN_LESSONS, ST = window.RAZAN_STORIES, E = window.RAZAN_ENGLISH;
  const TAT = 'ـ';
  const forms = l => {
    const b = l === 'ا' ? 'ا' : l, j = (L.info[l] || {}).join !== false;
    return j ? [b, b + TAT, TAT + b + TAT, TAT + b] : [b, TAT + b];
  };
  const teacher = txt => `<details class="teacher"><summary>👨‍🏫 للمعلّم</summary><p>${txt}</p></details>`;

  /* ---------- التبويبات ---------- */
  window.showTab = id => {
    stopAudio();
    document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === id));
    document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === id));
    ({ mission: () => renderMission(), letters: renderLetters, reading: renderReading, quran: () => renderQuran(),
       english: renderEnglish, journey: renderJourney, progress: renderProgress, mom: renderMom })[id]();
    scrollTo(0, 0);
  };
  const ALPHA = ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'];

  /* ---------- 👩 إعدادات الأم ---------- */
  function renderMom() {
    const S = state.school, Q = window.RAZAN_QURAN, school = schoolMode();
    const known = new Set(S.known || []);
    const words = wordsFor(schoolLetters(), S.cur);
    $('#momBox').innerHTML = `<h2>👩 إعدادات الماما</h2>
      <div class="mom-card"><h3>طريقة المهمة اليومية</h3>
        <div class="seg"><button class="${school ? 'on' : ''}" data-mode="school">🏫 حسب المدرسة</button>
        <button class="${school ? '' : 'on'}" data-mode="path">🗺️ مسار مرتّب</button></div>
        <p class="muted">${school ? 'المهمة تأخذ حرف الأسبوع من المدرسة، وتراجع الحروف اللي أخذتها، وتعطيها كلمات من حروفها فقط.' : 'المهمة تمشي على ترتيب التطبيق: وحدات الحروف ثم الحركات والمدود (القاعدة النورانية).'}</p></div>
      ${school ? `<div class="mom-card"><h3>🎯 حرف هذا الأسبوع في المدرسة</h3>
        <div class="agrid">${ALPHA.map(l => `<button class="ag ${S.cur === l ? 'cur' : ''}" data-cur="${l}">${l}</button>`).join('')}</div>
        <p class="muted">لما تبدأ المدرسة حرفًا جديدًا اختاريه هنا، والحرف السابق ينضاف تلقائيًا للحروف المأخوذة.</p></div>
      <div class="mom-card"><h3>✅ الحروف اللي أخذتها رزان قبل</h3>
        <div class="agrid">${ALPHA.map(l => `<button class="ag ${known.has(l) ? 'on' : ''} ${S.cur === l ? 'dim' : ''}" data-known="${l}">${l}</button>`).join('')}</div>
        <p class="muted">انقري الحرف لتحديده أو إلغائه. الكلمات المتاحة الآن من حروفها: <b>${ar(words.length)}</b>${words.length ? ' — ' + words.slice(0, 8).map(x => x.w).join('، ') : ''}</p></div>` : ''}
      <div class="mom-card"><h3>🌙 سورة المدرسة</h3>
        <div class="seg wrap">${Q.surahs.map(s => `<button class="${S.surah === s.surah ? 'on' : ''}" data-surah="${s.surah}">${s.name.replace('سورة ', '')}${state.quranArchive[s.surah] ? ' ✅' : ''}</button>`).join('')}</div>
        <p class="muted">التقدّم في كل سورة محفوظ لوحده؛ تقدرين ترجعين لأي سورة.</p></div>
      <div class="mom-card"><h3>📱 هذا الجهاز</h3>
        <div class="settings">
          <label class="tog"><input type="checkbox" id="autoIn" ${state.auto !== false ? 'checked' : ''}> 🗣️ نطق تلقائي لكل شيء</label>
          <label class="tog"><input type="checkbox" id="sfxIn" ${state.sfxOn !== false ? 'checked' : ''}> 🔔 أصوات المكافأة</label>
          <label>حجم الخط <input type="range" min="0.9" max="1.5" step="0.1" value="${state.fs || 1}" id="fsIn"></label>
          <label>سرعة الصوت العربي <input type="range" min="0.5" max="1.1" step="0.1" value="${state.rate || 0.8}" id="rateIn"></label>
        </div></div>
      ${teacher('هذه الإعدادات تتزامن بين كل الأجهزة (ما عدا قسم «هذا الجهاز»). صفحة المتابعة رابطها عندك بالرسالة.')}`;
    $('#autoIn').onchange = e => { state.auto = e.target.checked; save(); if (state.auto) speak('تَمَام'); };
    $('#sfxIn').onchange = e => { state.sfxOn = e.target.checked; save(); sfx('ok'); };
    $('#fsIn').oninput = e => { state.fs = +e.target.value; applyFs(); save(); };
    $('#rateIn').oninput = e => { state.rate = +e.target.value; save(); };
  }

  /* ---------- الحروف ---------- */
  let curL = null;
  function renderLetters() {
    const box = $('#lettersBox');
    const cu = curUnit();
    const chip = l => `<button class="lchip ${state.letters[l] ? 'done' : ''} ${curL === l ? 'sel' : ''} ${schoolMode() && state.school.cur === l ? 'week' : ''} ${schoolMode() && (state.school.known || []).includes(l) ? 'taken' : ''}" data-l="${l}">${l}</button>`;
    box.innerHTML = `<h2>🔤 الحروف</h2>
      ${schoolMode() ? `<div class="unit cur">${ALPHA.map(chip).join('')}</div>
        <p class="muted">🎯 = حرف الأسبوع • الإطار الأزرق = أخذته بالمدرسة • الأخضر = أتقنته</p>`
      : L.units.map((u, i) => `<div class="unit ${i === cu ? 'cur' : ''}"><span class="u-n">${ar(i + 1)}</span>
        ${u.letters.map(chip).join('')}</div>`).join('')}
      <div id="letterDetail">${curL ? letterDetail(curL) : '<p class="muted">اختاري حرفًا 👆</p>'}</div>
      ${teacher('ابدئي بالوحدة الملوّنة. انطقي <b>صوت</b> الحرف لا اسمه («بْ» لا «باء»). الحروف المتشابهة بالنقاط موزّعة على وحدات متباعدة عمدًا. زر «تعرفه» لما تتقنه رزان من الروضة.')}`;
    if (curL) setupTrace();
  }
  function letterDetail(l) {
    const i = L.info[l], H = ['َ', 'ُ', 'ِ'], b = l === 'ا' ? 'أ' : l;
    return `<div class="ldetail">
      <div class="big-letter">${l}</div>
      <div class="kw tw" data-say="${i.word}">${i.emoji} ${i.word} 🔊</div>
      <h3>أشكاله في الكلمة</h3>
      <div class="forms">${forms(l).map(f => `<span>${f}</span>`).join('')}</div>
      <div class="pos-words">${i.pos.map(w => `<span class="tw" data-say="${w}">${w}</span>`).join('')}</div>
      <h3>مع الحركات</h3>
      <div class="row-letters">${H.map(h => `<span class="mid-letter tw" data-say="${b + h}">${b + h}</span>`).join('')}</div>
      <h3>✍️ تتبّعي الحرف بإصبعك وقولي صوته</h3>
      <div class="trace-wrap"><canvas id="trace"></canvas></div>
      <button class="btn ghost sm" id="traceClear">🧽 امسحي</button>
      <h3>🎯 بأي حرف تبدأ؟</h3><div id="game"></div>
      <div class="manual"><button class="btn ghost sm" data-lman="${l}">${state.letters[l] ? '↩️ إلغاء «تعرفه»' : '✅ تعرفه (يدوي)'}</button></div>
    </div>`;
  }
  function setupTrace() {
    const c = $('#trace'); if (!c || !c.getContext) return;
    const w = Math.min(c.parentElement.clientWidth || 320, 420); c.width = w; c.height = w * 0.8;
    const g = c.getContext('2d'); if (!g) return;
    const guide = () => { g.clearRect(0, 0, c.width, c.height); g.fillStyle = '#E8E2D6';
      g.font = `${c.height * 0.75}px "Noto Naskh Arabic", serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(curL, c.width / 2, c.height / 2); };
    guide();
    let down = false;
    const pt = e => { const r = c.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e; return [t.clientX - r.left, t.clientY - r.top]; };
    const start = e => { down = true; const [x, y] = pt(e); g.beginPath(); g.moveTo(x, y); g.lineWidth = 14; g.lineCap = 'round'; g.strokeStyle = '#E67E22'; e.preventDefault(); };
    const move = e => { if (!down) return; const [x, y] = pt(e); g.lineTo(x, y); g.stroke(); e.preventDefault(); };
    c.onpointerdown = start; c.onpointermove = move; c.onpointerup = c.onpointerleave = () => { down = false; };
    $('#traceClear').onclick = guide;
    newGame();
  }
  function newGame() {
    const box = $('#game'); if (!box) return;
    const known = Object.keys(L.info).filter(x => state.letters[x] || x === curL);
    const pool = known.length >= 3 ? known : Object.keys(L.info).slice(0, 8);
    const target = pool[Math.floor(Math.random() * pool.length)];
    const opts = [target]; while (opts.length < 3) { const o = pool[Math.floor(Math.random() * pool.length)] || Object.keys(L.info)[opts.length]; if (!opts.includes(o)) opts.push(o); }
    opts.sort(() => Math.random() - 0.5);
    const i = L.info[target];
    box.innerHTML = `<div class="game"><button class="g-pic" data-say="${i.word}">${i.emoji}</button>
      <p class="muted">🔊 انقري الصورة لتسمعي الكلمة، ثم اختاري أول حرف</p>
      <div>${opts.map(o => `<button class="btn gopt" data-g="${o}" data-t="${target}">${o}</button>`).join('')}</div></div>`;
  }

  /* ---------- القراءة: الدروس والقصص ---------- */
  function renderReading() {
    const box = $('#readingBox');
    const cl = curLesson();
    const stage = arabicStage();
    box.innerHTML = `<h2>📖 القراءة</h2>
      ${stage === 1 ? '<p class="note">🔒 تُفتح الدروس بعد إتقان الحروف. يمكنكِ التصفّح الآن.</p>' : ''}
      ${[2, 3].map(s => `<h3>${s === 2 ? '🌿 الحركات والتركيب' : '🌳 المدود و«ال» والتنوين والشدّة'}</h3>
        <div class="lesson-list">${lessonsOf(s).map(x => `<button class="lesson ${state.lessons[x.id] ? 'done' : ''} ${cl && cl.id === x.id ? 'cur' : ''}" data-les="${x.id}">
          ${x.icon} ${x.title} ${state.lessons[x.id] ? '✅' : state.lessonBest[x.id] ? `<small>${ar(state.lessonBest[x.id])}٪</small>` : ''}</button>`).join('')}</div>`).join('')}
      <div id="lessonView"></div>
      <h3>📚 القصص</h3>
      <div class="lesson-list">${ST.map(s => `<button class="lesson ${state.stories[s.id] ? 'done' : ''} ${storyOpen(s) ? '' : 'locked'}" data-sto="${s.id}">
        ${storyOpen(s) ? s.icon : '🔒'} ${s.title} ${state.stories[s.id] ? '✅' : ''}</button>`).join('')}</div>
      <div id="storyView"></div>
      ${teacher('كل كلمة تُنقر فتُنطق. الكلمات <span class="sight">بهذا اللون</span> كلمات بصرية تُحفظ شكلًا. الصوت الآلي للمساعدة فقط، والحكم على صحة القراءة لكِ أنتِ.')}`;
  }
  function lessonView(id) {
    const x = LS.find(l => l.id === id);
    $('#lessonView').innerHTML = `<div class="lview"><h3>${x.icon} ${x.title}</h3>
      <div class="items">${x.items.map(t => `<span class="item"><span class="tw" data-say="${t}">${t}</span>
        ${x.sylls ? `<button class="mini" data-split="${t}">✂️</button>` : ''}</span>`).join('')}</div>
      ${teacher(x.note)}
      <div class="manual"><button class="btn ghost sm" data-lesman="${x.id}">${state.lessons[x.id] ? '↩️ إلغاء الإتقان' : '✅ أتقنته (يدوي)'}</button></div></div>`;
  }
  function storyView(id) {
    const s = ST.find(x => x.id === id);
    const words = t => t.split(/\s+/).map(w => { const c = w.replace(/[.،!؟:]/g, '');
      const sight = (window.RAZAN_SIGHT || []).some(x => stripMarks(x) === stripMarks(c));
      return `<span class="tw ${sight ? 'sight' : ''}" data-say="${c}">${w}</span>`; }).join(' ');
    $('#storyView').innerHTML = `<div class="sview"><h3>${s.icon} ${s.title}</h3>${s.lines.map(l => `<p class="story-line">${words(l)}</p>`).join('')}
      <div class="manual"><button class="btn ghost sm" data-stoman="${s.id}">${state.stories[s.id] ? '↩️ إلغاء' : '✅ أنهتها (يدوي)'}</button></div></div>`;
  }

  /* ---------- English ---------- */
  function renderEnglish() {
    const box = $('#englishBox'), g = engGroup(), ready = cvcReady();
    box.innerHTML = `<div class="ltr"><h2>🇬🇧 English</h2>
      ${E.groups.map((gr, i) => `<div class="unit ${i === g ? 'cur' : ''}">${gr.map(l => `<button class="lchip en ${state.eng[l] ? 'done' : ''}" data-en="${l}">${l}</button>`).join('')}</div>`).join('')}
      <div id="enDetail"></div>
      <h3>🧩 Words</h3>
      <div class="items">${ready.length ? ready.map(c => `<span class="item"><span class="tw" data-say="${c.w}" data-lang="en-US">${c.e} ${c.w}</span>${state.cvc[c.w] ? ' ✅' : ''}</span>`).join('') : '<p class="muted">Words open when their letters are learned.</p>'}</div>
      </div>${teacher('الترتيب صوتي (phonics): نعلّم <b>الصوت</b> لا اسم الحرف (s = سسس لا «إس»). النطق الآلي الإنجليزي جيد ويمكن الاعتماد عليه للنطق.')}`;
  }
  function enDetail(l) {
    const x = E.letters[l];
    $('#enDetail').innerHTML = `<div class="ldetail ltr"><div class="big-letter en">${l} ${l.toUpperCase()}</div>
      <div class="kw tw" data-say="${x.word}" data-lang="en-US">${x.emoji} ${x.word} 🔊</div><p>Sound: <b>${x.sound}</b></p>
      <button class="btn ghost sm" data-enman="${l}">${state.eng[l] ? '↩️ undo' : '✅ known (manual)'}</button></div>`;
  }

  /* ---------- رحلتي ---------- */
  const ARABIC_NODES = () => {
    const nodes = L.units.map((u, i) => ({ icon: '🔤', name: `الحروف ${ar(i + 1)}`, sub: u.letters.join(' '),
      done: u.letters.every(l => state.letters[l]), have: u.letters.filter(l => state.letters[l]).length, total: 4 }));
    nodes.push({ icon: '🌿', name: 'الحركات والتركيب', sub: 'المرحلة ٢', done: lessonsOf(2).every(x => state.lessons[x.id]),
      have: lessonsOf(2).filter(x => state.lessons[x.id]).length, total: lessonsOf(2).length });
    nodes.push({ icon: '🌳', name: 'المدود و«ال» والتنوين والشدّة', sub: 'المرحلة ٣', done: lessonsOf(3).every(x => state.lessons[x.id]),
      have: lessonsOf(3).filter(x => state.lessons[x.id]).length, total: lessonsOf(3).length });
    nodes.push({ icon: '🏆', name: 'القارئة الصغيرة', sub: 'كل القصص', done: ST.every(s => state.stories[s.id]),
      have: ST.filter(s => state.stories[s.id]).length, total: ST.length });
    let cur = nodes.findIndex(n => !n.done); if (cur < 0) cur = nodes.length - 1;
    return nodes.map((n, i) => Object.assign(n, { cur: i === cur, locked: i > cur }));
  };
  /* وضع المدرسة: كل حرف أخذته محطة، وحرف الأسبوع هو المحطة الحالية */
  const SCHOOL_NODES = () => {
    const ls = schoolLetters();
    return ls.map(l => ({ icon: (L.info[l] || {}).emoji || '🔤', name: `حرف ${l}`, sub: (L.info[l] || {}).word || '',
      done: !!state.letters[l], cur: l === state.school.cur, locked: false, have: (state.letterPass[l] || []).length, total: 2 }));
  };
  window.stageLabel = () => {
    if (schoolMode()) return `حرف الأسبوع: ${state.school.cur} — أخذت ${ar(schoolLetters().length)} حروف، أتقنت ${ar(schoolLetters().filter(l => state.letters[l]).length)}`;
    const c = ARABIC_NODES().find(n => n.cur); return c ? `${c.name} (${c.sub})` : '';
  };
  window.journeyInfo = () => ({ arabic: schoolMode() ? SCHOOL_NODES() : ARABIC_NODES(), surah: curSurah().name, archive: Object.values(state.quranArchive).map(x => x.name) });
  function renderJourney() {
    let k = 0;
    const node = n => `<div class="j-node ${n.done ? 'done' : ''} ${n.cur ? 'cur' : ''} ${n.locked ? 'locked' : ''}" style="--x:${[0, 1, 2, 1][k++ % 4]}">
      <span class="j-ico">${n.done ? '⭐' : n.locked ? '🔒' : n.icon}</span><b>${n.name}</b><small>${n.sub}</small>
      ${n.cur ? `<small class="j-here">🦉 أنا هنا — ${ar(n.have)} من ${ar(n.total)}</small>` : ''}</div>`;
    const Q = window.RAZAN_QURAN;
    const arabic = schoolMode() ? SCHOOL_NODES() : ARABIC_NODES();
    $('#journeyBox').innerHTML = `<h2>🗺️ رحلتي</h2><p class="j-lbl">📖 ${schoolMode() ? 'حروفي من المدرسة' : 'القراءة'}</p>
      <div class="j-path">${arabic.length ? arabic.map(node).join('') : '<p class="muted">ماما تختار الحروف من 👩 الإعدادات</p>'}</div>
      <p class="j-lbl">🌙 القرآن</p><div class="j-path">${Q.surahs.map(s => {
        const done = !!state.quranArchive[s.surah], cur = s.surah === curSurah().surah && !done;
        const have = s.ayat.filter((_, j) => state.ayat[qKey(s, j)]).length;
        return node({ icon: '🌙', name: s.name, sub: `${ar(s.ayat.length)} آيات`, done, cur, locked: false, have, total: s.ayat.length });
      }).join('')}</div>
      <p class="j-lbl">🇬🇧 English</p><div class="j-path">${E.groups.map((g, i) => {
        const done = g.every(l => state.eng[l]); const gi = engGroup();
        return node({ icon: '🔤', name: g.join(' '), sub: '', done, cur: i === gi, locked: !done && i !== gi, have: g.filter(l => state.eng[l]).length, total: g.length });
      }).join('')}</div>`;
  }

  /* ---------- تقدّمي + الإعدادات ---------- */
  window.renderProgress = () => {
    const box = $('#progressBox'); if (!box) return;
    const lk = Object.keys(state.letters).length, le = LS.filter(x => state.lessons[x.id]).length;
    const bar = (a, b) => `<div class="pbar"><span style="width:${Math.round(a / Math.max(1, b) * 100)}%"></span></div><small>${ar(a)} / ${ar(b)}</small>`;
    box.innerHTML = `<h2>⭐ تقدّمي</h2>
      <div class="stats"><div>⭐<b>${ar(state.stars || 0)}</b>نجمة</div><div>🔥<b>${ar(state.streak || 0)}</b>يوم</div></div>
      <p>🔤 الحروف ${bar(lk, 28)}</p><p>📚 الدروس ${bar(le, LS.length)}</p>
      <p>📖 القصص ${bar(ST.filter(s => state.stories[s.id]).length, ST.length)}</p>
      <p>🇬🇧 English ${bar(Object.keys(state.eng).length, 26)}</p>
      <div class="badges">${[[5, '🌱'], [20, '🌼'], [50, '🌈'], [100, '🏆'], [200, '👑']].map(([n, b]) =>
        `<span class="badge ${state.stars >= n ? 'got' : ''}">${b}<small>${ar(n)}⭐</small></span>`).join('')}</div>`;
  };
  window.applyFs = () => document.documentElement.style.setProperty('--fs', state.fs || 1);

  /* ---------- الأحداث ---------- */
  document.addEventListener('click', e => {
    const t = e.target.closest('button,[data-say]'); if (!t) return;
    const d = t.dataset;
    if (d.tab) { sfx('pop'); showTab(d.tab); if (d.tabsay && state.auto !== false) speak(d.tabsay); return; }
    if (d.goto) { showTab(d.goto); return; }
    if (t.closest('#missionBox') || t.closest('#quranBox')) return;
    if (d.say) { sfx('pop'); return speak(d.say, d.lang || 'ar-SA'); }
    if (d.mode) { setSchool({ mode: d.mode }); return renderMom(); }
    if (d.cur) { const S = state.school; const known = new Set(S.known || []);
      if (S.cur && S.cur !== d.cur) known.add(S.cur); known.delete(d.cur);
      setSchool({ cur: d.cur, known: [...known] }); speak(`حَرْفُ الأُسْبُوع: ${L.names[d.cur] || d.cur}`); return renderMom(); }
    if (d.known) { const k = new Set(state.school.known || []); k.has(d.known) ? k.delete(d.known) : k.add(d.known);
      setSchool({ known: [...k] }); sfx('pop'); return renderMom(); }
    if (d.surah) { setSchool({ surah: +d.surah }); window.__qSel = 0; speak(curSurah().name); return renderMom(); }
    if (d.l) { curL = d.l; renderLetters(); $('#letterDetail').scrollIntoView({ behavior: 'smooth' });
      if (state.auto !== false) sayAll([[`حَرْفُ ${L.names[d.l] || d.l}`], [L.info[d.l].word]]); return; }
    if (d.lman) { if (state.letters[d.lman]) delete state.letters[d.lman]; else state.letters[d.lman] = today(); save(); return renderLetters(); }
    if (d.g) { if (d.g === d.t) { sfx('star'); starBurst(t); speak(praise()); confetti(); addStars(1); save(); setTimeout(newGame, 1200); }
      else { sfx('again'); t.classList.add('wobble'); speak(L.info[d.t].word); } return; }
    if (d.split) { t.previousElementSibling.innerHTML = syllables(d.split).map(s => `<span class="syl tw" data-say="${s}">${s}</span>`).join('<i class="dash">ـ</i>'); return; }
    if (d.lesman) { if (state.lessons[d.lesman]) delete state.lessons[d.lesman]; else state.lessons[d.lesman] = today(); save(); renderReading(); return lessonView(d.lesman); }
    if (d.sto) { const s = ST.find(x => x.id === d.sto); if (!storyOpen(s)) return toast('🔒 تُفتح بعد درسها'); return storyView(d.sto); }
    if (d.stoman) { if (state.stories[d.stoman]) delete state.stories[d.stoman]; else state.stories[d.stoman] = today(); save(); renderReading(); return storyView(d.stoman); }
    if (d.en) { enDetail(d.en); if (state.auto !== false) speak(E.letters[d.en].word, 'en-US'); return; }
    if (d.les) { lessonView(d.les); const x = LS.find(l => l.id === d.les); if (state.auto !== false) speak(x.title.replace(/[«»:ـ]/g, ' ')); return; }
    if (d.enman) { if (state.eng[d.enman]) delete state.eng[d.enman]; else state.eng[d.enman] = today(); save(); renderEnglish(); return enDetail(d.enman); }
    if (d.guide !== undefined) { $('#guide').classList.toggle('open'); return; }
  });

  window.renderAll = () => { applyFs(); const a = document.querySelector('.panel.active'); showTab(a ? a.id : 'mission'); };
  document.addEventListener('DOMContentLoaded', () => renderAll());
  if (document.readyState !== 'loading') setTimeout(() => renderAll(), 0);
})();
