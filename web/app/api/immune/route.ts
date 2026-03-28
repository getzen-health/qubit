import { z } from 'zod'
import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'
import { calculateImmuneScore } from '@/lib/immune-score'
import type { ImmuneLog } from '@/lib/immune-score'

const postImmuneSchema = z.object({
  sleep_hours: z.number().min(0).max(24).optional(),
  vit_c_mg: z.number().min(0).max(10000).optional(),
  vit_d_iu: z.number().min(0).max(100000).optional(),
  zinc_mg: z.number().min(0).max(100).optional(),
  selenium_mcg: z.number().min(0).max(1000).optional(),
  stress_level: z.number().int().min(1).max(10).optional(),
  exercise_minutes: z.number().min(0).max(1440).optional(),
  exercise_intensity: z.enum(['none', 'light', 'moderate', 'vigorous']).optional(),
  fiber_g: z.number().min(0).max(200).optional(),
  probiotic_taken: z.boolean().optional(),
  symptoms: z.record(z.string(), z.unknown()).optional(),
  notes: z.string().max(1000).nullable().optional(),
})

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const { data: logs, error } = await supabase
      .from('immune_logs')
      .select('*')
      .eq('user_id', user!.id)
      .order('date', { ascending: false })
      .limit(30)

    if (error) return secureErrorResponse('Failed to fetch immune logs', 500)

    const today = new Date().toISOString().slice(0, 10)
    const todayLog = logs?.find((l) => l.date === today) ?? null

    const currentScore = todayLog
      ? calculateImmuneScore(todayLog as ImmuneLog)
      : null

    // 7-day trend: scores for the last 7 logged days
    const trend = (logs ?? []).slice(0, 7).map((l) => ({
      date: l.date,
      score: calculateImmuneScore(l as ImmuneLog).total,
    }))

    return secureJsonResponse({ logs: logs ?? [], currentScore, trend, todayLog })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true, bodySchema: postImmuneSchema },
  async (_req, { user, supabase, body }) => {
    const b = body as z.infer<typeof postImmuneSchema>
    const today = new Date().toISOString().slice(0, 10)

    const payload = {
      user_id: user!.id,
      date: today,
      sleep_hours: Number(b.sleep_hours ?? 0),
      vit_c_mg: Number(b.vit_c_mg ?? 0),
      vit_d_iu: Number(b.vit_d_iu ?? 0),
      zinc_mg: Number(b.zinc_mg ?? 0),
      selenium_mcg: Number(b.selenium_mcg ?? 0),
      stress_level: Number(b.stress_level ?? 5),
      exercise_minutes: Number(b.exercise_minutes ?? 0),
      exercise_intensity: b.exercise_intensity ?? 'none',
      fiber_g: Number(b.fiber_g ?? 0),
      probiotic_taken: Boolean(b.probiotic_taken),
      symptoms: b.symptoms ?? {},
      notes: b.notes ?? null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('immune_logs')
      .upsert(payload, { onConflict: 'user_id,date' })
      .select()
      .single()

    if (error) return secureErrorResponse('Failed to save immune log', 500)

    const score = calculateImmuneScore(data as ImmuneLog)
    return secureJsonResponse({ log: data, score })
  }
)
