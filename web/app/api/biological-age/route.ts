import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIdentifier, createRateLimitHeaders } from '@/lib/security'

export async function GET(_request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const [{ data: assessments, error }, { data: summaries }, { data: recoveryLogs }] =
    await Promise.all([
      supabase
        .from('biological_age_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('assessed_at', { ascending: false })
        .limit(30),
      // Prefill: 30-day daily summary averages
      supabase
        .from('daily_summaries')
        .select('avg_hrv, resting_heart_rate, steps, sleep_duration_minutes')
        .eq('user_id', user.id)
        .gte(
          'date',
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        )
        .not('date', 'is', null),
      // Prefill: last 30 recovery logs
      supabase
        .from('recovery_logs')
        .select('hrv_ms, resting_hr, sleep_hours, sleep_quality')
        .eq('user_id', user.id)
        .gte(
          'logged_at',
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        ),
    ])

  if (error && error.code !== '42P01') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  function avg(vals: (number | null | undefined)[]): number | null {
    const v = vals.filter((x): x is number => x != null && x > 0)
    return v.length > 0 ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null
  }

  const s = summaries ?? []
  const r = recoveryLogs ?? []

  const prefill = {
    resting_hr: avg([...s.map((x) => x.resting_heart_rate), ...r.map((x) => x.resting_hr)]),
    hrv_ms: avg([...s.map((x) => x.avg_hrv), ...r.map((x) => x.hrv_ms)]),
    sleep_hours: avg([
      ...s.map((x) => (x.sleep_duration_minutes ? x.sleep_duration_minutes / 60 : null)),
      ...r.map((x) => x.sleep_hours),
    ]),
    sleep_quality: avg(r.map((x) => x.sleep_quality)),
    steps_per_day: avg(s.map((x) => x.steps)),
  }

  return NextResponse.json({ assessments: assessments ?? [], prefill })
}

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const { allowed, remaining, resetIn } = await checkRateLimit(identifier, 'healthData')
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: createRateLimitHeaders(remaining, resetIn) },
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await request.json()

  const { data, error } = await supabase
    .from('biological_age_assessments')
    .insert({
      user_id: user.id,
      assessed_at: new Date().toISOString().slice(0, 10),
      chronological_age: body.chronological_age ?? null,
      biological_age: body.biological_age ?? null,
      pace_of_aging: body.pace_of_aging ?? null,
      blue_zone_score: body.blue_zone_score ?? null,
      inputs: body.inputs ?? null,
      result: body.result ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ assessment: data }, { status: 201 })
}
