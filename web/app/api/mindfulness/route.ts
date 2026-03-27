import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'
import { analyzeMindfulness, type MeditationSession } from '@/lib/mindfulness'

export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
  },
  async (_request, { user, supabase }) => {
    const { data: sessions, error } = await supabase
      .from('meditation_sessions')
      .select('*')
      .eq('user_id', user!.id)
      .order('date', { ascending: false })
      .limit(200)

    if (error) return secureErrorResponse(error.message, 500)

    const analysis = analyzeMindfulness((sessions ?? []) as MeditationSession[])

    return secureJsonResponse({ sessions: sessions ?? [], analysis })
  }
)

export const POST = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
  },
  async (request, { user, supabase }) => {
    let body: Partial<MeditationSession>
    try {
      body = await request.json()
    } catch {
      return secureErrorResponse('invalid json', 400)
    }

    const {
      date,
      type,
      duration_min,
      quality_rating,
      distractions = 0,
      mood_before,
      mood_after,
      stress_before,
      stress_after,
      insight,
      mbsr_week,
    } = body

    if (!date || !type || !duration_min || !quality_rating) {
      return secureErrorResponse('date, type, duration_min, quality_rating are required', 400)
    }
    if (duration_min < 1 || duration_min > 480) {
      return secureErrorResponse('duration_min must be 1-480', 400)
    }
    if (quality_rating < 1 || quality_rating > 5) {
      return secureErrorResponse('quality_rating must be 1-5', 400)
    }

    const { data, error } = await supabase
      .from('meditation_sessions')
      .insert({
        user_id: user!.id,
        date,
        type,
        duration_min,
        quality_rating,
        distractions,
        mood_before: mood_before ?? null,
        mood_after: mood_after ?? null,
        stress_before: stress_before ?? null,
        stress_after: stress_after ?? null,
        insight: insight ?? null,
        mbsr_week: mbsr_week ?? null,
      })
      .select()
      .single()

    if (error) return secureErrorResponse(error.message, 500)

    return secureJsonResponse({ session: data }, 201)
  }
)
