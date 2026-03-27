import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

// GET: List public challenges + user's participation
export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const { data: challenges, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('is_public', true)
      .order('starts_at', { ascending: false })

    if (error) return secureErrorResponse('Failed to fetch challenges', 500)

    const { data: parts } = await supabase
      .from('challenge_participants')
      .select('challenge_id, current_value')
      .eq('user_id', user!.id)

    const challengeIds = (challenges || []).map((c: { id: string }) => c.id)
    const { data: counts } = challengeIds.length > 0
      ? await supabase
          .from('challenge_participants')
          .select('challenge_id')
          .in('challenge_id', challengeIds)
      : { data: [] }

    const countMap: Record<string, number> = {}
    for (const row of counts ?? []) {
      countMap[row.challenge_id] = (countMap[row.challenge_id] ?? 0) + 1
    }

    const participation = parts ?? []
    return secureJsonResponse({
      challenges: (challenges || []).map(ch => ({
        ...ch,
        participant_count: countMap[ch.id] || 0,
        joined: participation.some(p => p.challenge_id === ch.id),
        current_value: participation.find(p => p.challenge_id === ch.id)?.current_value || 0,
      })),
    })
  }
)

// POST: Create new challenge
export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const body = await req.json()
    const { title, description, type, target_value, duration_days, is_public } = body
    if (!title || !target_value) return secureErrorResponse('Missing fields', 400)
    const starts_at = new Date().toISOString()
    const ends_at = new Date(Date.now() + (duration_days || 7) * 86400000).toISOString()
    const { data, error } = await supabase
      .from('challenges')
      .insert({ title, description, type, target_value, duration_days, is_public, starts_at, ends_at, created_by: user!.id })
      .select()
      .single()
    if (error) return secureErrorResponse('Failed to create challenge', 500)
    return secureJsonResponse({ challenge: data })
  }
)
