import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'
import { z } from 'zod'

// GET /api/social/challenges — active challenges the current user is participating in
export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    auditAction: 'READ',
    auditResource: 'challenge',
  },
  async (_request, { user, supabase }) => {
    const today = new Date().toISOString().slice(0, 10)

    const { data: participations, error } = await supabase
      .from('challenge_participants')
      .select(
        `current_value, joined_at,
         challenges(id, title, metric, target_value, starts_at, ends_at, creator_id)`
      )
      .eq('user_id', user!.id)

    if (error) return secureErrorResponse('Failed to fetch challenges', 500)

    const active = (participations ?? []).filter((p) => {
      const c = p.challenges as unknown as { starts_at: string; ends_at: string } | null
      return c && c.starts_at <= today && c.ends_at >= today
    })

    return secureJsonResponse({ challenges: active })
  }
)

// POST /api/social/challenges — create a new challenge and auto-join as participant
export const POST = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    bodySchema: z.object({
      title: z.string().min(1).max(120),
      metric: z.enum(['steps', 'calories', 'sleep_hours', 'hrv']),
      target_value: z.number().positive(),
      starts_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      ends_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }),
    auditAction: 'CREATE',
    auditResource: 'challenge',
  },
  async (_request, { user, body, supabase }) => {
    const { title, metric, target_value, starts_at, ends_at } = body as {
      title: string
      metric: string
      target_value: number
      starts_at: string
      ends_at: string
    }

    if (ends_at < starts_at) return secureErrorResponse('ends_at must be after starts_at', 400)

    const { data: challenge, error } = await supabase
      .from('challenges')
      .insert({ creator_id: user!.id, title, metric, target_value, starts_at, ends_at })
      .select()
      .single()

    if (error) return secureErrorResponse('Failed to create challenge', 500)

    // Auto-join the creator as a participant
    await supabase
      .from('challenge_participants')
      .insert({ challenge_id: challenge.id, user_id: user!.id, current_value: 0 })

    return secureJsonResponse({ challenge }, 201)
  }
)

// PUT /api/social/challenges — update the current user's progress for a challenge
export const PUT = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    bodySchema: z.object({
      challenge_id: z.string().uuid(),
      current_value: z.number().min(0),
    }),
    auditAction: 'UPDATE',
    auditResource: 'challenge',
  },
  async (_request, { user, body, supabase }) => {
    const { challenge_id, current_value } = body as { challenge_id: string; current_value: number }

    const { error } = await supabase
      .from('challenge_participants')
      .upsert(
        { challenge_id, user_id: user!.id, current_value },
        { onConflict: 'challenge_id,user_id' }
      )

    if (error) return secureErrorResponse('Failed to update progress', 500)

    return secureJsonResponse({ success: true })
  }
)
