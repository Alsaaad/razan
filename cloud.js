/* =========================================================
   ☁️ المزامنة — تقدّم واحد على كل الأجهزة + طابور تقارير بلا إنترنت
   الدمج في الخادم (convex/kidState.ts): اتحاد الإنجازات ولا يُحذف شيء.
   إعدادات الشاشة (fs, rate) وطابور التقارير تبقى خاصة بكل جهاز.
   ========================================================= */
(() => {
  const C = window.RAZAN_SYNC;
  if (!C || !C.url || typeof fetch !== 'function') return;
  const LOCAL = ['fs', 'rate', 'auto', 'sfxOn', 'pendingReports'];

  async function call(kind, path, args) {
    const r = await fetch(`${C.url}/api/${kind}`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, args, format: 'json' }) });
    const j = await r.json();
    if (j.status !== 'success') throw new Error(j.errorMessage || 'sync error');
    return j.value;
  }
  function progress() {
    const LS = window.RAZAN_LESSONS, ST = window.RAZAN_STORIES, sur = curSurah();
    const trouble = (state.trouble || []).map(t => { const c = t.card || {}; return c.l || c.text || c.w || (c.k ? 'آية ' + c.k : t.t); });
    return {
      name: state.name, stars: state.stars || 0, streak: state.streak || 0, lastMission: state.lastMission || null,
      stage: window.stageLabel ? stageLabel() : '', journey: window.journeyInfo ? journeyInfo() : null,
      letters: { have: Object.keys(state.letters).length, total: 28, list: Object.keys(state.letters) },
      lessons: { have: LS.filter(x => state.lessons[x.id]).length, total: LS.length },
      stories: { have: ST.filter(x => state.stories[x.id]).length, total: ST.length },
      eng: { have: Object.keys(state.eng).length, total: 26, words: Object.keys(state.cvc).length },
      quran: { surah: sur.name, have: sur.ayat.filter((_, i) => state.ayat[qKey(sur, i)]).length, total: sur.ayat.length,
        underMem: underMem().map(k => 'آية ' + (+k.split(':')[1] + 1)), archive: Object.values(state.quranArchive).map(x => x.name) },
      trouble, missionDates: (state.missionLog || []).map(x => x.date)
    };
  }
  window.razanProgress = progress;

  /* --- تقارير المهمات: طابور يُرسل عند عودة الاتصال --- */
  let flushing = false;
  async function flush() {
    if (flushing) return; flushing = true;
    try {
      while ((state.pendingReports || []).length) {
        const rep = state.pendingReports[0];
        await call('mutation', 'progress:report', { code: C.code, kid: C.kid, date: rep.date, summary: rep.summary,
          stats: rep.stats || {}, clientId: rep.clientId, progress: progress() });
        state.pendingReports.shift(); save();
      }
    } catch (e) { /* بلا إنترنت */ } finally { flushing = false; }
  }
  window.syncReport = rep => {
    state.pendingReports = (state.pendingReports || []).filter(r => r.clientId !== rep.clientId).concat(rep).slice(-30);
    save(); flush();
  };
  window.flushReports = flush;

  /* --- دمج الحالة --- */
  const origSave = window.save;
  async function merge() {
    const s = Object.assign({}, state); LOCAL.forEach(k => delete s[k]);
    return JSON.parse(await call('mutation', 'kidState:mergeState', { code: C.code, kid: C.kid, json: JSON.stringify(s) }));
  }
  function adopt(merged, initial) {
    if (!merged || typeof merged !== 'object') return;
    const keep = {}; LOCAL.forEach(k => { if (k in state) keep[k] = state[k]; });
    const localMission = state.mission;
    Object.keys(merged).forEach(k => { state[k] = merged[k]; });
    Object.assign(state, keep);
    if (!initial && localMission) state.mission = localMission; // لا نلمس مهمة جارية
    origSave();
  }
  let timer = null, busy = false, again = false;
  async function push() {
    if (busy) { again = true; return; }
    busy = true;
    try { adopt(await merge(), false); if (!document.querySelector('#mission.active')) window.renderAll && renderAll(); } catch (e) {}
    busy = false;
    if (again) { again = false; push(); }
  }
  window.save = function () { origSave(); clearTimeout(timer); timer = setTimeout(push, 2000); };
  window.cloudSyncNow = push;
  window.cloudMergeOnce = merge; window.cloudAdopt = adopt;

  (async () => { try { adopt(await merge(), true); window.renderAll && renderAll(); } catch (e) {} flush(); })();
  addEventListener('online', () => { push(); flush(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { push(); flush(); } });
})();
