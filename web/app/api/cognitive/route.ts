import { z } from 'zod'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

const cognitiveLogSchema = z.object({
  session_type: z.string().min(1).max(50),
  duration_minutes: z.number().int().positive().max(480),
  focus_score: z.number().int().min(1).max(10).optional(),
  notes: z.string().max(500).optional(),
  logged_at: z.string().datetime().optional(),
})

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const { data: assessments, error } = await supabase
      .from('cognitive_assessments')
      .select('*')
      .eq('user_id', user!.id)
      .order('assessed_at', { ascending: false })
      .limit(30)

    if (error) return secureErrorResponse(error.message, 500)

    // Time-of-day breakdown
    const todBreakdown: Record<string, { count: number; totalScore: number }> = {}
    for (const a of assessments ?? []) {
      const tod = a.time_of_day ?? 'unknown'
      if (!todBreakdown[tod]) todBreakdown[tod] = { count: 0, totalScore: 0 }
      todBreakdown[tod].count++
      todBreakdown[tod].totalScore += a.total_score ?? 0
    }
    const timeOfDayAvg = Object.fromEntries(
      Object.entries(todBreakdown).map(([k, v]) => [
        k,
        v.count > 0 ? Math.round(v.totalScore / v.count) : 0,
      ])
    )

    // 7-day trend
    const recent7 = (assessments ?? []).slice(0, 7).reverse()
    const trend = recent7.map((a) => ({
      date: a.assessed_at?.slice(0, 10),
      score: a.total_score,
    }))

    return secureJsonResponse({ assessments, trend, timeOfDayAvg })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true, bodySchema: cognitiveLogSchema },
  async (_req, { user, supabase, body }) => {
    const { session_type, duration_minutes, focus_score, notes, logged_at } = body as z.infer<typeof cognitiveLogSchema>

    const { data, error } = await supabase
      .from('cognitive_assessments')
      .insert({
        user_id: user!.id,
        assessed_at: logged_at ?? new Date().toISOString(),
        session_type,
        duration_minutes,
        focus_score: focus_score ?? null,
        notes: notes ?? null,
      })
      .select()
      .single()

    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ assessment: data }, 201)
  }
)
