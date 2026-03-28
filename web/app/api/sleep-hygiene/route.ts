import { z } from 'zod'
import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

const postSleepHygieneSchema = z.object({
  consistent_schedule: z.boolean().optional(),
  no_alcohol: z.boolean().optional(),
  no_caffeine_6h: z.boolean().optional(),
  no_screens_1h: z.boolean().optional(),
  room_temp_celsius: z.number().min(0).max(50).nullable().optional(),
  room_dark: z.boolean().optional(),
  room_quiet: z.boolean().optional(),
  logged_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

function calcHygieneScore(log: {
  consistent_schedule?: boolean
  no_alcohol?: boolean
  no_caffeine_6h?: boolean
  no_screens_1h?: boolean
  room_temp_celsius?: number | null
  room_dark?: boolean
  room_quiet?: boolean
}): { score: number; grade: string } {
  let score = 0
  if (log.consistent_schedule) score += 20
  if (log.no_alcohol) score += 20
  if (log.no_caffeine_6h) score += 15
  if (log.no_screens_1h) score += 15
  if (log.room_temp_celsius && log.room_temp_celsius >= 18 && log.room_temp_celsius <= 22) score += 15
  else if (!log.room_temp_celsius) score += 7 // neutral if not tracked
  if (log.room_dark && log.room_quiet) score += 15
  else if (log.room_dark || log.room_quiet) score += 7

  const grade = score >= 85 ? 'A+' : score >= 70 ? 'A' : score >= 55 ? 'B' : score >= 35 ? 'C' : 'D'
  return { score, grade }
}

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const { data } = await supabase
      .from('sleep_hygiene_logs')
      .select('*')
      .eq('user_id', user!.id)
      .order('logged_date', { ascending: false })
      .limit(30)
    const today = new Date().toISOString().slice(0, 10)
    const todayLog = data?.find(l => l.logged_date === today) ?? null
    return secureJsonResponse({ logs: data ?? [], today: todayLog })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true, bodySchema: postSleepHygieneSchema },
  async (_request, { user, supabase, body }) => {
    const { score, grade } = calcHygieneScore(body as z.infer<typeof postSleepHygieneSchema>)
    const b = body as z.infer<typeof postSleepHygieneSchema>
    const today = new Date().toISOString().slice(0, 10)
    const { data, error } = await supabase
      .from('sleep_hygiene_logs')
      .upsert(
        { ...b, user_id: user!.id, logged_date: b.logged_date ?? today, hygiene_score: score, hygiene_grade: grade },
        { onConflict: 'user_id,logged_date' }
      )
      .select()
      .single()
    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ log: data, score, grade })
  }
)
