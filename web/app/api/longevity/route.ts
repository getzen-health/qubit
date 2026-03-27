import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const since = new Date()
    since.setDate(since.getDate() - 90)

    const { data, error } = await supabase
      .from('longevity_checkins')
      .select('*')
      .eq('user_id', user!.id)
      .gte('date', since.toISOString().slice(0, 10))
      .order('date', { ascending: false })

    if (error) return secureErrorResponse('Failed to fetch longevity data', 500)
    return secureJsonResponse({ data })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const body = await req.json()
    const { date, pillar_scores, blueprint_items_completed, blueprint_score, overall_score, epigenetic_age_delta, notes } = body

    if (!date || !pillar_scores) {
      return secureErrorResponse('date and pillar_scores required', 400)
    }

    const { data, error } = await supabase
      .from('longevity_checkins')
      .upsert(
        {
          user_id: user!.id,
          date,
          pillar_scores,
          blueprint_items_completed: blueprint_items_completed ?? [],
          blueprint_score: blueprint_score ?? 0,
          overall_score: overall_score ?? 0,
          epigenetic_age_delta: epigenetic_age_delta ?? 0,
          notes: notes ?? null,
        },
        { onConflict: 'user_id,date' }
      )
      .select()
      .single()

    if (error) return secureErrorResponse('Failed to save longevity data', 500)
    return secureJsonResponse({ data }, 201)
  }
)
