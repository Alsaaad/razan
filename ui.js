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
       english: renderEnglish, journey: renderJourney, progress: renderProgress })[id]();
    scrollTo(0, 0);
  };

  /* ---------- الحروف ---------- */
  let curL = null;
  function renderLetters() {
    const box = $('#lettersBox');
    const cu = curUnit();
    box.innerHTML = `<h2>🔤 الحروف</h2>
      ${L.units.map((u, i) => `<div class="unit ${i === cu ? 'cur' : ''}"><span class="u-n">${ar(i + 1)}</span>
        ${u.letters.map(l => `<button class="lchip ${state.letters[l] ? 'done' : ''} ${curL === l ? 'sel' : ''}" data-l="${l}">${l}</button>`).join('')}</div>`).join('')}
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
    box.innerHTML = `<div class="game"><div class="g-pic tw" data-say="${i.word}">${i.emoji}</div>
      <p class="muted">انقري الصورة لتسمعي الكلمة</p>
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
  window.stageLabel = () => { const c = ARABIC_NODES().find(n => n.cur); return c ? `${c.name} (${c.sub})` : ''; };
  window.journeyInfo = () => ({ arabic: ARABIC_NODES(), surah: curSurah().name, archive: Object.values(state.quranArchive).map(x => x.name) });
  function renderJourney() {
    const node = n => `<div class="j-node ${n.done ? 'done' : ''} ${n.cur ? 'cur' : ''} ${n.locked ? 'locked' : ''}">
      <span class="j-ico">${n.done ? '✅' : n.locked ? '🔒' : n.icon}</span><b>${n.name}</b><small>${n.sub}</small>
      ${n.cur ? `<small>${ar(n.have)} من ${ar(n.total)}</small>` : ''}</div>`;
    const Q = window.RAZAN_QURAN;
    $('#journeyBox').innerHTML = `<h2>🗺️ رحلتي</h2><p class="j-lbl">📖 القراءة</p>
      <div class="j-path">${ARABIC_NODES().map(node).join('<span class="j-link"></span>')}</div>
      <p class="j-lbl">🌙 القرآن</p><div class="j-path">${Q.surahs.map((s, i) => {
        const done = !!state.quranArchive[s.surah], cur = i === (state.qSurah || 0) && !done;
        const have = s.ayat.filter((_, j) => state.ayat[qKey(s, j)]).length;
        return node({ icon: '🌙', name: s.name, sub: `${ar(s.ayat.length)} آيات`, done, cur, locked: !done && !cur, have, total: s.ayat.length });
      }).join('<span class="j-link"></span>')}</div>
      <p class="j-lbl">🇬🇧 English</p><div class="j-path">${E.groups.map((g, i) => {
        const done = g.every(l => state.eng[l]); const gi = engGroup();
        return node({ icon: '🔤', name: g.join(' '), sub: '', done, cur: i === gi, locked: !done && i !== gi, have: g.filter(l => state.eng[l]).length, total: g.length });
      }).join('<span class="j-link"></span>')}</div>`;
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
      <h3>⚙️ إعدادات هذا الجهاز</h3>
      <div class="settings">
        <label>حجم الخط <input type="range" min="0.9" max="1.5" step="0.1" value="${state.fs || 1}" id="fsIn"></label>
        <label>سرعة الصوت العربي <input type="range" min="0.5" max="1.1" step="0.1" value="${state.rate || 0.8}" id="rateIn"></label>
      </div>`;
    $('#fsIn').oninput = e => { state.fs = +e.target.value; applyFs(); save(); };
    $('#rateIn').oninput = e => { state.rate = +e.target.value; save(); };
  };
  window.applyFs = () => document.documentElement.style.setProperty('--fs', state.fs || 1);

  /* ---------- الأحداث ---------- */
  document.addEventListener('click', e => {
    const t = e.target.closest('button,[data-say]'); if (!t) return;
    const d = t.dataset;
    if (d.tab) return showTab(d.tab);
    if (t.closest('#missionBox') || t.closest('#quranBox')) return;
    if (d.say) return speak(d.say, d.lang || 'ar-SA');
    if (d.l) { curL = d.l; renderLetters(); $('#letterDetail').scrollIntoView({ behavior: 'smooth' }); return; }
    if (d.lman) { if (state.letters[d.lman]) delete state.letters[d.lman]; else state.letters[d.lman] = today(); save(); return renderLetters(); }
    if (d.g) { if (d.g === d.t) { toast('👏 رائع!'); confetti(); addStars(1); save(); setTimeout(newGame, 900); } else toast('🤔 لنسمع الكلمة مرة أخرى'); return; }
    if (d.les) return lessonView(d.les);
    if (d.split) { t.previousElementSibling.innerHTML = syllables(d.split).map(s => `<span class="syl tw" data-say="${s}">${s}</span>`).join('<i class="dash">ـ</i>'); return; }
    if (d.lesman) { if (state.lessons[d.lesman]) delete state.lessons[d.lesman]; else state.lessons[d.lesman] = today(); save(); renderReading(); return lessonView(d.lesman); }
    if (d.sto) { const s = ST.find(x => x.id === d.sto); if (!storyOpen(s)) return toast('🔒 تُفتح بعد درسها'); return storyView(d.sto); }
    if (d.stoman) { if (state.stories[d.stoman]) delete state.stories[d.stoman]; else state.stories[d.stoman] = today(); save(); renderReading(); return storyView(d.stoman); }
    if (d.en) return enDetail(d.en);
    if (d.enman) { if (state.eng[d.enman]) delete state.eng[d.enman]; else state.eng[d.enman] = today(); save(); renderEnglish(); return enDetail(d.enman); }
    if (d.guide !== undefined) { $('#guide').classList.toggle('open'); return; }
  });

  window.renderAll = () => { applyFs(); const a = document.querySelector('.panel.active'); showTab(a ? a.id : 'mission'); };
  document.addEventListener('DOMContentLoaded', () => renderAll());
  if (document.readyState !== 'loading') setTimeout(() => renderAll(), 0);
})();
