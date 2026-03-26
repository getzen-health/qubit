import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIdentifier } from '@/lib/security'
import { calculateSleepDebt } from '@/lib/sleep-analytics'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [{ data: sleepRecords, error: sleepErr }, { data: assessments, error: assessErr }, { data: profile }] =
    await Promise.all([
      supabase
        .from('sleep_records')
        .select('start_time, duration_minutes')
        .eq('user_id', user.id)
        .gte('start_time', thirtyDaysAgo.toISOString())
        .gt('duration_minutes', 60)
        .order('start_time', { ascending: true }),
      supabase
        .from('sleep_quality_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('assessed_at', { ascending: false })
        .limit(12),
      supabase.from('users').select('sleep_goal_minutes').eq('id', user.id).single(),
    ])

  if (sleepErr) return NextResponse.json({ error: sleepErr.message }, { status: 500 })
  if (assessErr) return NextResponse.json({ error: assessErr.message }, { status: 500 })

  const targetHours = profile?.sleep_goal_minutes ? profile.sleep_goal_minutes / 60 : 8

  const logs = (sleepRecords ?? []).map((r) => ({
    date: r.start_time.slice(0, 10),
    hours: r.duration_minutes / 60,
  }))

  const debtResult = calculateSleepDebt(logs, targetHours)

  return NextResponse.json({
    sleep_logs: logs,
    debt: debtResult,
    assessments: assessments ?? [],
    target_hours: targetHours,
  })
}

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const { allowed } = await checkRateLimit(identifier, 'healthData')
  if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { psqi_global_score, psqi_answers, psqi_components, sleep_efficiency_pct } = body

  if (
    typeof psqi_global_score !== 'number' ||
    psqi_global_score < 0 ||
    psqi_global_score > 21
  ) {
    return NextResponse.json({ error: 'Invalid PSQI score' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('sleep_quality_assessments')
    .insert({
      user_id: user.id,
      assessed_at: new Date().toISOString().slice(0, 10),
      psqi_global_score,
      psqi_answers: psqi_answers ?? null,
      psqi_components: psqi_components ?? null,
      sleep_efficiency_pct: typeof sleep_efficiency_pct === 'number' ? sleep_efficiency_pct : null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
