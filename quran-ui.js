/* =========================================================
   🌙 القرآن — آية آية، صوت كل كلمة (quran.com) وتلاوة الحصري المعلّم
   الأوضاع: كلمة كلمة / احفظها بالبناء (>٦ كلمات: نصفًا نصفًا) / أخفِ كلمة
   + مقسّم المقاطع للكلمات العربية
   ========================================================= */
(() => {
  const Q = window.RAZAN_QURAN;
  const get = k => { const [s, i] = k.split(':').map(Number); const sur = Q.surahs.find(x => x.surah === s); return { sur, i, a: sur.ayat[i] }; };
  window.qGet = get;
  let runId = 0;

  const ayahHTML = (k, hideIdx) => {
    const { a } = get(k);
    return `<div class="ayah" data-k="${k}">${a.w.map((w, j) =>
      `<span class="qw ${j === hideIdx ? 'hidden-w' : ''}" data-act="q:word" data-k="${k}" data-j="${j}">${j === hideIdx ? '◻️◻️' : w}</span>`).join(' ')}
      <span class="anum">﴿${ar(get(k).i + 1)}﴾</span></div>`;
  };
  const glossHTML = a => `<div class="gloss"><span class="q-emoji">${a.e}</span>${a.g.map(g => `<span class="g"><b>${g.w}</b>: ${g.m}</span>`).join('')}</div>`;
  const modeBtns = k => `<div class="qmodes">
    <button class="btn ghost sm" data-act="q:full" data-k="${k}">🎧 الآية كاملة</button>
    <button class="btn ghost sm" data-act="q:wbw" data-k="${k}">👆 كلمة كلمة</button>
    <button class="btn ghost sm" data-act="q:build" data-k="${k}">🧱 احفظها بالبناء</button>
    <button class="btn ghost sm" data-act="q:hide" data-k="${k}">🙈 أخفِ كلمة</button>
    <button class="btn ghost sm" data-act="q:stop">⏹️</button></div>`;

  window.qCardHTML = (k, mode) => {
    const { sur, i, a } = get(k);
    if (mode === 'recite') return `<p class="ask">${sur.name} — الآية ${ar(i + 1)} ${a.e}</p>
      <p class="big-ask">سمّعيها من حفظك 🌙</p>
      <details class="peek"><summary>👀 إظهار الآية للمشرفة</summary>${ayahHTML(k)}</details>`;
    return `<p class="ask">${sur.name} — آية جديدة: نستمع ونبني فقط (التسميع غدًا)</p>
      ${ayahHTML(k)}${glossHTML(a)}${modeBtns(k)}`;
  };

  const wordUrl = (a, j) => Q.wordAudioBase + a.a[j];
  function mark(k, j) {
    document.querySelectorAll(`.qw[data-k="${k}"]`).forEach(el => el.classList.toggle('on', +el.dataset.j === j));
  }
  function playSeq(k, seq, id, done) {
    const { a } = get(k);
    if (id !== runId) return;
    if (!seq.length) { mark(k, -1); return done && done(); }
    const [j, ...rest] = seq;
    if (j === 'pause') return setTimeout(() => playSeq(k, rest, id, done), 700);
    mark(k, j);
    playUrl(wordUrl(a, j), () => setTimeout(() => playSeq(k, rest, id, done), 150));
  }
  /** تسلسل البناء: تراكمي، والآية الأطول من ٦ كلمات تُبنى نصفًا نصفًا ثم كاملة */
  window.buildSequence = n => {
    const range = (a, b) => Array.from({ length: b - a }, (_, x) => a + x);
    const halves = n > 6 ? [[0, Math.ceil(n / 2)], [Math.ceil(n / 2), n]] : [[0, n]];
    const seq = [];
    halves.forEach(([a, b]) => { for (let e = a + 1; e <= b; e++) seq.push(...range(a, e), 'pause'); });
    if (halves.length > 1) seq.push(...range(0, n), 'pause');
    return seq;
  };
  window.qPlayFull = k => { runId++; const { a } = get(k); playUrl(a.full); };
  window.qAction = (act, el) => {
    const k = el.dataset.k;
    if (act === 'q:stop') { runId++; stopAudio(); return; }
    const { a } = get(k);
    if (act === 'q:word') { runId++; const j = +el.dataset.j;
      if (el.classList.contains('hidden-w')) { el.classList.remove('hidden-w'); el.textContent = a.w[j]; }
      mark(k, j); return playUrl(wordUrl(a, j), () => mark(k, -1)); }
    if (act === 'q:full') return qPlayFull(k);
    if (act === 'q:wbw') { const id = ++runId; return playSeq(k, a.w.map((_, j) => j).flatMap(j => [j, 'pause']), id); }
    if (act === 'q:build') { const id = ++runId; return playSeq(k, buildSequence(a.w.length), id); }
    if (act === 'q:hide') {
      runId++; const box = el.closest('.card, .qview').querySelector('.ayah');
      const h = Math.floor(Math.random() * a.w.length);
      box.outerHTML = ayahHTML(k, h);
    }
  };

  /* صفحة القرآن */
  window.renderQuran = () => {
    const box = $('#quranBox'); if (!box) return;
    const sur = curSurah();
    const sel = window.__qSel || 0;
    box.innerHTML = `<div class="qview">
      <h2>🌙 ${sur.name}</h2>
      <div class="ayah-nav">${sur.ayat.map((_, i) => {
        const k = qKey(sur, i);
        return `<button class="chip ${i === sel ? 'sel' : ''} ${state.ayat[k] ? 'done' : state.qIntro[k] ? 'mem' : ''}" data-qsel="${i}">${ar(i + 1)}${state.ayat[k] ? ' ✅' : ''}</button>`;
      }).join('')}</div>
      ${ayahHTML(qKey(sur, sel))}${glossHTML(sur.ayat[sel])}${modeBtns(qKey(sur, sel))}
      <div class="manual"><button class="btn ghost sm" data-qman="${qKey(sur, sel)}">${state.ayat[qKey(sur, sel)] ? '↩️ إلغاء «محفوظة»' : '✅ اعتبريها محفوظة'}</button></div>
      ${Object.keys(state.quranArchive).length ? `<p class="muted">📦 الأرشيف: ${Object.values(state.quranArchive).map(x => x.name + ' ✅').join('، ')}</p>` : ''}
      <details class="teacher"><summary>👨‍🏫 للمعلّم</summary>
        <p>الآية الجديدة تُسمَع وتُبنى فقط في يومها، والتسميع من الحفظ يبدأ غدًا. لا أكثر من آيتين تحت الحفظ. اللون الأزرق = تحت الحفظ.</p></details>
    </div>`;
  };
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-qsel],[data-qman],[data-act^="q:"]'); if (!t || !t.closest('#quranBox')) return;
    if (t.dataset.qsel) { window.__qSel = +t.dataset.qsel; return renderQuran(); }
    if (t.dataset.qman) { const k = t.dataset.qman; if (state.ayat[k]) delete state.ayat[k]; else { state.ayat[k] = today(); delete state.qIntro[k]; checkSurahDone(); } save(); return renderQuran(); }
    qAction(t.dataset.act, t);
  });

  /* ✂️ تقسيم الكلمة إلى مقاطع: حرف+حركة يبدأ مقطعًا، والساكن وحرف المدّ يلتحقان بما قبلهما */
  const MARK = /[ً-ٰٟ]/;
  window.syllables = word => {
    const cl = [];
    for (const ch of word) { if (MARK.test(ch) && cl.length) cl[cl.length - 1] += ch; else cl.push(ch); }
    const out = [];
    cl.forEach((c, i) => {
      const vowel = /[ًٌٍَُِ]/.test(c);
      const shadda = c.includes('ّ');
      if (shadda && vowel) { // الشدّة = ساكن يلتحق بالسابق + متحرك
        const base = c[0];
        if (out.length) out[out.length - 1] += base + 'ْ'; else out.push(base + 'ْ');
        out.push(c.replace('ّ', ''));
      } else if (vowel || !out.length) out.push(c);
      else out[out.length - 1] += c;
    });
    return out;
  };
})();
