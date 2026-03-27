import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'
import { calculateSocialScore, emptyLog } from '@/lib/social-health'

// GET /api/social — last 30 social health logs + today's computed score
export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const { data: logs, error } = await supabase
      .from('social_health_logs')
      .select('*')
      .eq('user_id', user!.id)
      .order('date', { ascending: false })
      .limit(30)

    if (error) return secureErrorResponse('Failed to fetch social health logs', 500)

    const today = new Date().toISOString().slice(0, 10)
    const todayLog = (logs ?? []).find((l) => l.date === today) ?? emptyLog(today)
    const score = calculateSocialScore(todayLog)

    return secureJsonResponse({ logs: logs ?? [], score, todayLog })
  }
)

// POST /api/social — upsert today's social health log
export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const body = await request.json()
    const today = new Date().toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from('social_health_logs')
      .upsert(
        {
          user_id: user!.id,
          date: body.date ?? today,
          ucla3_q1: Math.min(4, Math.max(1, Number(body.ucla3_q1 ?? 1))),
          ucla3_q2: Math.min(4, Math.max(1, Number(body.ucla3_q2 ?? 1))),
          ucla3_q3: Math.min(4, Math.max(1, Number(body.ucla3_q3 ?? 1))),
          in_person_interactions: Math.max(0, Number(body.in_person_interactions ?? 0)),
          digital_interactions: Math.max(0, Number(body.digital_interactions ?? 0)),
          shared_meals: Math.max(0, Number(body.shared_meals ?? 0)),
          meaningful_convos: Math.max(0, Number(body.meaningful_convos ?? 0)),
          group_activities: Math.max(0, Number(body.group_activities ?? 0)),
          connection_depth: Math.min(5, Math.max(1, Number(body.connection_depth ?? 3))),
          volunteering_minutes: Math.max(0, Number(body.volunteering_minutes ?? 0)),
          notes: body.notes ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,date' }
      )
      .select()
      .single()

    if (error) return secureErrorResponse('Failed to save social health log', 500)

    const score = calculateSocialScore(data)
    return secureJsonResponse({ data, score })
  }
)
