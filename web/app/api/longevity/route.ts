import { z } from 'zod'
import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

const postLongevitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pillar_scores: z.record(z.string(), z.number().min(0).max(100)),
  blueprint_items_completed: z.array(z.string().max(200)).max(100).optional(),
  blueprint_score: z.number().min(0).max(100).optional(),
  overall_score: z.number().min(0).max(100).optional(),
  epigenetic_age_delta: z.number().min(-50).max(50).optional(),
  notes: z.string().max(2000).nullable().optional(),
})

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
  { rateLimit: 'healthData', requireAuth: true, bodySchema: postLongevitySchema },
  async (_req, { user, supabase, body }) => {
    const {
      date,
      pillar_scores,
      blueprint_items_completed,
      blueprint_score,
      overall_score,
      epigenetic_age_delta,
      notes,
    } = body as z.infer<typeof postLongevitySchema>

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
