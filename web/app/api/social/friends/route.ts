import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'
import { z } from 'zod'

// GET /api/social/friends — list accepted friends with their latest daily_summary
export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    auditAction: 'READ',
    auditResource: 'friendship',
  },
  async (_request, { user, supabase }) => {
    // Fetch accepted friendships where the current user is either side
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select('id, requester_id, addressee_id, created_at')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user!.id},addressee_id.eq.${user!.id}`)

    if (error) return secureErrorResponse('Failed to fetch friends', 500)

    const friendIds = (friendships ?? []).map((f) =>
      f.requester_id === user!.id ? f.addressee_id : f.requester_id
    )

    if (friendIds.length === 0) return secureJsonResponse({ friends: [] })

    // Fetch friend profiles
    const { data: profiles } = await supabase
      .from('users')
      .select('id, display_name, email')
      .in('id', friendIds)

    // Fetch today's daily summary for each friend
    const today = new Date().toISOString().slice(0, 10)
    const { data: summaries } = await supabase
      .from('daily_summaries')
      .select('user_id, steps, recovery_score, sleep_duration_minutes')
      .in('user_id', friendIds)
      .eq('date', today)

    const summaryMap = Object.fromEntries((summaries ?? []).map((s) => [s.user_id, s]))

    const friends = (profiles ?? []).map((p) => ({
      id: p.id,
      display_name: p.display_name ?? p.email?.split('@')[0] ?? 'User',
      steps_today: summaryMap[p.id]?.steps ?? null,
      recovery_score: summaryMap[p.id]?.recovery_score ?? null,
      sleep_minutes: summaryMap[p.id]?.sleep_duration_minutes ?? null,
    }))

    return secureJsonResponse({ friends })
  }
)

// POST /api/social/friends — send friend request by email
export const POST = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    bodySchema: z.object({ email: z.string().email() }),
    auditAction: 'CREATE',
    auditResource: 'friendship',
  },
  async (_request, { user, body, supabase }) => {
    const { email } = body as { email: string }

    if (email.toLowerCase() === (user as { email?: string }).email?.toLowerCase()) {
      return secureErrorResponse('Cannot add yourself', 400)
    }

    // Look up target user by email
    const { data: target } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (!target) return secureErrorResponse('User not found', 404)

    const { error } = await supabase.from('friendships').insert({
      requester_id: user!.id,
      addressee_id: target.id,
      status: 'pending',
    })

    if (error) {
      if (error.code === '23505') return secureErrorResponse('Friend request already sent', 409)
      return secureErrorResponse('Failed to send friend request', 500)
    }

    return secureJsonResponse({ success: true }, 201)
  }
)

// PATCH /api/social/friends — accept or reject a pending request
export const PATCH = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    bodySchema: z.object({
      friendship_id: z.string().uuid(),
      action: z.enum(['accepted', 'blocked']),
    }),
    auditAction: 'UPDATE',
    auditResource: 'friendship',
  },
  async (_request, { user, body, supabase }) => {
    const { friendship_id, action } = body as { friendship_id: string; action: 'accepted' | 'blocked' }

    const { error } = await supabase
      .from('friendships')
      .update({ status: action })
      .eq('id', friendship_id)
      .eq('addressee_id', user!.id) // only addressee can accept/reject

    if (error) return secureErrorResponse('Failed to update friendship', 500)

    return secureJsonResponse({ success: true })
  }
)
