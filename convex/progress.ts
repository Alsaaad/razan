import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

const KID = /^[a-z0-9-]{1,32}$/

function assertWrite(code: string, kid: string) {
  const expected = process.env.WRITE_CODE
  if (!expected || code !== expected) throw new Error("unauthorized")
  if (!KID.test(kid)) throw new Error("bad kid")
}

async function upsertSnapshot(ctx: any, kid: string, progress: unknown) {
  const snap = await ctx.db
    .query("snapshots")
    .withIndex("by_kid", (q: any) => q.eq("kid", kid))
    .unique()
  if (snap) await ctx.db.patch(snap._id, { progress, updatedAt: Date.now() })
  else await ctx.db.insert("snapshots", { kid, progress, updatedAt: Date.now() })
}

/** يُستدعى من آيباد جهاد عند انتهاء كل مهمة */
export const report = mutation({
  args: {
    code: v.string(),
    kid: v.string(),
    date: v.string(),
    summary: v.string(),
    stats: v.any(),
    progress: v.any(),
    clientId: v.string(),
  },
  handler: async (ctx, a) => {
    assertWrite(a.code, a.kid)
    if (a.summary.length > 6000) throw new Error("too long")
    // منع التكرار إذا أُعيد الإرسال بعد انقطاع الإنترنت
    const recent = await ctx.db
      .query("sessions")
      .withIndex("by_kid_created", (q) => q.eq("kid", a.kid))
      .order("desc")
      .take(20)
    const existing = recent.find((s) => s.stats && s.stats.clientId === a.clientId)
    if (existing) {
      await ctx.db.patch(existing._id, { summary: a.summary, stats: { ...(a.stats || {}), clientId: a.clientId } })
    } else {
      await ctx.db.insert("sessions", {
        kid: a.kid,
        date: a.date,
        summary: a.summary,
        stats: { ...(a.stats || {}), clientId: a.clientId },
        createdAt: Date.now(),
      })
    }
    await upsertSnapshot(ctx, a.kid, a.progress)
    return true
  },
})

/** تحديث صورة التقدّم فقط (عند فتح اللوحة مثلًا) */
export const snapshot = mutation({
  args: { code: v.string(), kid: v.string(), progress: v.any() },
  handler: async (ctx, a) => {
    assertWrite(a.code, a.kid)
    await upsertSnapshot(ctx, a.kid, a.progress)
    return true
  },
})

/** صفحة المتابعة لعبدالله — تحتاج رمز المتابعة */
export const dashboard = query({
  args: { code: v.string(), kid: v.string() },
  handler: async (ctx, a) => {
    const expected = process.env.PARENT_CODE
    if (!expected || a.code !== expected) return null
    const snap = await ctx.db
      .query("snapshots")
      .withIndex("by_kid", (q) => q.eq("kid", a.kid))
      .unique()
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_kid_created", (q) => q.eq("kid", a.kid))
      .order("desc")
      .take(60)
    return {
      snapshot: snap ? { progress: snap.progress, updatedAt: snap.updatedAt } : null,
      sessions: sessions.map((s) => ({ date: s.date, summary: s.summary, stats: s.stats, createdAt: s.createdAt })),
    }
  },
})
