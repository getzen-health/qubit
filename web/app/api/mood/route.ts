import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const { data, error } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', user!.id)
      .order('logged_at', { ascending: false })
      .limit(30)
    if (error) return secureErrorResponse('Failed to fetch mood logs', 500)
    return secureJsonResponse({ data })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const body = await request.json()

    // Accept valence (-5..5) or legacy score (1..10) from iOS app
    let valence: number
    if (body.valence !== undefined) {
      valence = Math.round(Number(body.valence))
    } else if (body.score !== undefined) {
      // Map 1-10 → -5..5 linearly: score 1 → -5, score 10 → +5
      valence = Math.round((Number(body.score) - 1) * 10 / 9 - 5)
    } else {
      return secureErrorResponse('valence (-5 to 5) or score (1-10) required', 400)
    }
    valence = Math.max(-5, Math.min(5, valence))

    const { data, error } = await supabase
      .from('mood_logs')
      .insert({
        user_id: user!.id,
        valence,
        emotions: Array.isArray(body.emotions) ? body.emotions : [],
        notes: body.notes || null,
      })
      .select().single()
    if (error) return secureErrorResponse('Failed to create mood log', 500)
    return secureJsonResponse({ data }, 201)
  }
)

export const DELETE = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return secureErrorResponse('id required', 400)
    const { error } = await supabase
      .from('mood_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id)
    if (error) return secureErrorResponse('Failed to delete mood log', 500)
    return secureJsonResponse({ success: true })
  }
)
