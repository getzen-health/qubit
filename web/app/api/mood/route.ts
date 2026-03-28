import { z } from 'zod'
import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

const postMoodSchema = z.object({
  valence: z.number().int().min(-5).max(5).optional(),
  score: z.number().min(1).max(10).optional(),
  emotions: z.array(z.string().max(100)).max(20).optional(),
  notes: z.string().max(1000).optional(),
}).refine(
  (data) => data.valence !== undefined || data.score !== undefined,
  { message: 'valence (-5 to 5) or score (1-10) required' }
)

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
  { rateLimit: 'healthData', requireAuth: true, bodySchema: postMoodSchema },
  async (_request, { user, supabase, body }) => {
    const { valence: rawValence, score, emotions, notes } = body as z.infer<typeof postMoodSchema>

    // Accept valence (-5..5) or legacy score (1..10) from iOS app
    let valence: number
    if (rawValence !== undefined) {
      valence = Math.round(rawValence)
    } else {
      // Map 1-10 → -5..5 linearly: score 1 → -5, score 10 → +5
      valence = Math.round((Number(score) - 1) * 10 / 9 - 5)
    }
    valence = Math.max(-5, Math.min(5, valence))

    const { data, error } = await supabase
      .from('mood_logs')
      .insert({
        user_id: user!.id,
        valence,
        emotions: Array.isArray(emotions) ? emotions : [],
        notes: notes || null,
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
