import { mutation } from "./_generated/server"
import { v } from "convex/values"

const KID = /^[a-z0-9-]{1,32}$/
type S = Record<string, any>

/* إنجازات: اتحاد — ما أُنجز على أي جهاز يبقى منجزًا ولا يُحذف */
const FLAG_MAPS = ["letters", "lessons", "stories", "eng", "cvc"]
/* تواريخ النجاح من أول محاولة: اتحاد التواريخ (يومان مختلفان = إتقان) */
const PASS_MAPS = ["letterPass", "engPass"]

const orMap = (x: S = {}, y: S = {}) => {
  const r: S = {}
  for (const k in x) if (x[k]) r[k] = x[k]
  for (const k in y) if (y[k] && !r[k]) r[k] = y[k]
  return r
}
const unionDates = (x: S = {}, y: S = {}) => {
  const r: S = {}
  for (const src of [x, y]) for (const k in src) r[k] = Array.from(new Set([...(r[k] || []), ...(src[k] || [])])).sort()
  return r
}
const later = (a: any, b: any) => (!a ? b : !b ? a : (b.date || "") > (a.date || "") ? b : a)

function mergeMission(a: any, b: any) {
  if (!a) return b
  if (!b) return a
  if (a.date !== b.date) return a.date > b.date ? a : b
  if (!!a.done !== !!b.done) return a.done ? a : b
  return (b.i || 0) >= (a.i || 0) ? b : a
}

function streakFrom(dates: string[]) {
  const set = new Set(dates)
  const sorted = [...set].sort()
  if (!sorted.length) return { last: null as string | null, streak: 0 }
  const last = sorted[sorted.length - 1]
  let streak = 0
  let d = new Date(last + "T12:00:00Z")
  while (set.has(d.toISOString().slice(0, 10))) { streak++; d = new Date(d.getTime() - 864e5) }
  return { last, streak }
}

/** a = المخزّن في السحابة، b = القادم من جهاز */
export function mergeStates(a: S | null, b: S): S {
  const inc = { ...b }
  delete inc.pendingReports
  if (!a) return inc
  const out: S = { ...a, ...inc }
  for (const k of FLAG_MAPS) out[k] = orMap(a[k], inc[k])
  for (const k of PASS_MAPS) out[k] = unionDates(a[k], inc[k])

  // القرآن — مفاتيح «سورة:آية»
  out.ayat = orMap(a.ayat, inc.ayat)
  out.ayahPass = unionDates(a.ayahPass, inc.ayahPass)
  const qi: S = { ...(a.qIntro || {}) }
  for (const k in inc.qIntro || {}) if (!qi[k] || inc.qIntro[k] < qi[k]) qi[k] = inc.qIntro[k]
  out.qIntro = qi
  out.qSurah = Math.max(a.qSurah || 0, inc.qSurah || 0)
  out.quranArchive = { ...(a.quranArchive || {}), ...(inc.quranArchive || {}) }
  // آيات السور المؤرشفة لا تبقى في «تحت الحفظ»
  for (const s in out.quranArchive) for (const k of Object.keys(out.qIntro)) if (k.startsWith(s + ":")) delete out.qIntro[k]

  // المتعثّرات: الأحدث لكل عنصر، وتُحذف ما قُرئ صحيحًا بعدها
  const td: S = { ...(a.troubleDone || {}) }
  for (const k in inc.troubleDone || {}) if (!td[k] || td[k] < inc.troubleDone[k]) td[k] = inc.troubleDone[k]
  out.troubleDone = td
  const tm = new Map<string, any>()
  for (const t of [...(a.trouble || []), ...(inc.trouble || [])]) {
    const p = tm.get(t.t)
    if (!p || (p.date || "") < (t.date || "")) tm.set(t.t, t)
  }
  out.trouble = [...tm.values()]
    .filter((t) => !(td[t.t] && td[t.t] >= t.date))
    .sort((x, y) => ((x.date || "") < (y.date || "") ? -1 : 1))
    .slice(-20)

  // نتائج الدروس: أفضل نتيجة
  const lr: S = { ...(a.lessonBest || {}) }
  for (const k in inc.lessonBest || {}) if (!lr[k] || inc.lessonBest[k] > lr[k]) lr[k] = inc.lessonBest[k]
  out.lessonBest = lr

  out.stars = Math.max(a.stars || 0, inc.stars || 0)
  const logs = new Map<string, any>()
  for (const l of [...(a.missionLog || []), ...(inc.missionLog || [])]) logs.set(`${l.date}|${l.id || ""}`, l)
  out.missionLog = [...logs.values()].sort((x, y) => (x.date < y.date ? -1 : 1)).slice(-90)
  const st = streakFrom(out.missionLog.map((l: any) => l.date))
  out.lastMission = st.last
  out.streak = st.streak
  out.badgesSeen = Array.from(new Set([...(a.badgesSeen || []), ...(inc.badgesSeen || [])]))
  out.wordsOk = orMap(a.wordsOk, inc.wordsOk)
  // إعدادات الأم (وضع المدرسة، حرف الأسبوع، السورة): آخر تعديل يفوز — جهاز قديم لا يرجّعها
  const sa = a.school || null, sb = inc.school || null
  out.school = !sa ? sb : !sb ? sa : (sb.since || 0) >= (sa.since || 0) ? sb : sa
  out.mission = mergeMission(a.mission, inc.mission)
  return out
}

export const mergeState = mutation({
  // الحالة تُنقل وتُخزَّن كنص JSON: مفاتيحها حروف عربية، وConvex لا يقبل أسماء حقول غير ASCII
  args: { code: v.string(), kid: v.string(), json: v.string() },
  handler: async (ctx, a) => {
    if (!process.env.WRITE_CODE || a.code !== process.env.WRITE_CODE) throw new Error("unauthorized")
    if (!KID.test(a.kid)) throw new Error("bad kid")
    if (a.json.length > 400000) throw new Error("too big")
    const doc = await ctx.db.query("kidState").withIndex("by_kid", (q) => q.eq("kid", a.kid)).unique()
    const prev = doc ? (typeof doc.state === "string" ? JSON.parse(doc.state) : doc.state) : null
    const merged = JSON.stringify(mergeStates(prev, JSON.parse(a.json || "{}")))
    if (doc) await ctx.db.patch(doc._id, { state: merged, updatedAt: Date.now() })
    else await ctx.db.insert("kidState", { kid: a.kid, state: merged, updatedAt: Date.now() })
    return merged
  },
})
