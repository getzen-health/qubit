import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: profile }, { data: userRow }] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('users').select('display_name, full_name, avatar_url, height_cm, weight_kg, step_goal, calorie_goal, sleep_goal_minutes, biological_sex, age, date_of_birth, fitness_goal').eq('id', user.id).single(),
  ])

  return NextResponse.json({ data: { ...(userRow ?? {}), ...(profile ?? {}) } })
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  // Write the full payload to user_profiles (onboarding/health data)
  const { error: profileErr } = await supabase
    .from('user_profiles')
    .upsert({ user_id: user.id, ...body, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 })

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
    const { error: userErr } = await supabase.from('users').update(userFields).eq('id', user.id)
    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
