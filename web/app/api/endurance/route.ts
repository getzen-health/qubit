import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIdentifier, createRateLimitHeaders } from '@/lib/security'
import { checkRampRate } from '@/lib/endurance-metrics'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const [profileResult, mileageResult] = await Promise.all([
    supabase
      .from('endurance_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('weekly_mileage_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('week_start', { ascending: true })
      .limit(52),
  ])

  if (profileResult.error) {
    return NextResponse.json({ error: profileResult.error.message }, { status: 500 })
  }
  if (mileageResult.error) {
    return NextResponse.json({ error: mileageResult.error.message }, { status: 500 })
  }

  const logs = mileageResult.data ?? []
  const rampRate = checkRampRate(
    logs.map((l) => ({ week: l.week_start, distance_km: Number(l.distance_km) }))
  )

  return NextResponse.json({
    profile: profileResult.data ?? null,
    mileage_logs: logs,
    ramp_rate: rampRate,
  })
}

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const { allowed, remaining, resetIn } = await checkRateLimit(identifier, 'healthData')
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: createRateLimitHeaders(remaining, resetIn) }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await request.json()

  // Log weekly mileage entry
  if (body.type === 'mileage') {
    const { week_start, distance_km, sport = 'running' } = body
    if (!week_start || distance_km == null) {
      return NextResponse.json({ error: 'week_start and distance_km are required' }, { status: 400 })
    }
    const { data, error } = await supabase
      .from('weekly_mileage_logs')
      .upsert(
        { user_id: user.id, week_start, distance_km, sport },
        { onConflict: 'user_id,week_start,sport' }
      )
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ log: data })
  }

  // Save/update endurance profile
  const profileData: Record<string, unknown> = {
    user_id: user.id,
    updated_at: new Date().toISOString(),
  }
  const fields = [
    'vdot', 'best_5k_seconds', 'best_10k_seconds', 'best_hm_seconds',
    'best_marathon_seconds', 'weekly_distance_km', 'ftp_watts', 'weight_kg',
    'vo2max_estimate',
  ] as const
  for (const field of fields) {
    if (body[field] !== undefined) profileData[field] = body[field]
  }

  const { data, error } = await supabase
    .from('endurance_profiles')
    .upsert(profileData, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}
