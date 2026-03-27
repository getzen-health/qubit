import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const [{ data: assessments, error: ae }, { data: moods, error: me }] = await Promise.all([
      supabase
        .from('mental_health_assessments')
        .select('*')
        .eq('user_id', user!.id)
        .gte('date', since)
        .order('date', { ascending: false }),
      supabase
        .from('mood_logs')
        .select('*')
        .eq('user_id', user!.id)
        .gte('logged_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('logged_at', { ascending: false }),
    ])

    if (ae) return secureErrorResponse('Failed to fetch assessments', 500)
    if (me) return secureErrorResponse('Failed to fetch moods', 500)

    // Compute latest score per assessment type
    const latestByType: Record<string, typeof assessments[0]> = {}
    for (const a of assessments ?? []) {
      if (!latestByType[a.assessment_type]) latestByType[a.assessment_type] = a
    }

    return secureJsonResponse({
      assessments: assessments ?? [],
      moods: moods ?? [],
      latestByType,
    })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const body = await req.json()

    if (body.type === 'mood') {
      const { valence, arousal, emotions, notes } = body
      const { data, error } = await supabase
        .from('mood_logs')
        .insert({
          user_id: user!.id,
          valence: Math.max(-5, Math.min(5, Number(valence) || 0)),
          arousal: Math.max(-5, Math.min(5, Number(arousal) || 0)),
          emotions: Array.isArray(emotions) ? emotions : [],
          notes: notes || null,
        })
        .select()
        .single()

      if (error) return secureErrorResponse('Failed to log mood', 500)
      return secureJsonResponse({ mood: data })
    }

    if (body.type === 'assessment') {
      const { assessment_type, scores, composite_score, notes } = body
      const today = new Date().toISOString().slice(0, 10)

      const { data, error } = await supabase
        .from('mental_health_assessments')
        .upsert(
          {
            user_id: user!.id,
            date: today,
            assessment_type,
            scores: scores ?? {},
            composite_score: composite_score ?? null,
            notes: notes || null,
          },
          { onConflict: 'user_id,date,assessment_type' },
        )
        .select()
        .single()

      if (error) return secureErrorResponse('Failed to save assessment', 500)
      return secureJsonResponse({ assessment: data })
    }

    return secureErrorResponse('Invalid type. Use "mood" or "assessment".', 400)
  }
)
