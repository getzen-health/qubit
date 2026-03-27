import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const [{ data: profile }, { data: userRow }] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('user_id', user!.id).single(),
      supabase.from('users').select('display_name, full_name, avatar_url, height_cm, weight_kg, step_goal, calorie_goal, sleep_goal_minutes, biological_sex, age, date_of_birth, fitness_goal').eq('id', user!.id).single(),
    ])

    return secureJsonResponse({ data: { ...(userRow ?? {}), ...(profile ?? {}) } })
  }
)

export const PUT = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const body = await request.json()

    // Write the full payload to user_profiles (onboarding/health data)
    const { error: profileErr } = await supabase
      .from('user_profiles')
      .upsert({ user_id: user!.id, ...body, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    if (profileErr) return secureErrorResponse('Failed to update profile', 500)

    // Mirror subset of key fields to users table so pages querying users work.
    // Also map onboarding's `sex` → `biological_sex` and `primary_goal` → `fitness_goal`.
    const bodyMap = body as Record<string, unknown>
    const userFields: Record<string, unknown> = {}
    const mirror = ['full_name', 'age', 'date_of_birth', 'biological_sex', 'fitness_goal', 'height_cm', 'weight_kg'] as const
    for (const key of mirror) {
      if (key in bodyMap) userFields[key] = bodyMap[key]
    }
    // Onboarding sends `sex` (not `biological_sex`) — normalize
    if ('sex' in bodyMap && !('biological_sex' in bodyMap)) userFields['biological_sex'] = bodyMap['sex']
    // Onboarding sends `primary_goal` (not `fitness_goal`) — normalize
    if ('primary_goal' in bodyMap && !('fitness_goal' in bodyMap)) userFields['fitness_goal'] = bodyMap['primary_goal']

    if (Object.keys(userFields).length > 0) {
      const { error: userErr } = await supabase.from('users').update(userFields).eq('id', user!.id)
      if (userErr) return secureErrorResponse('Failed to update user', 500)
    }

    return secureJsonResponse({ success: true })
  }
)
