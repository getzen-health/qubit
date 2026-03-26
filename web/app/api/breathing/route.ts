import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'
import { analyzeBreathing, type BreathingLog } from '@/lib/breathing-health'

export async function GET(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const since = new Date()
  since.setDate(since.getDate() - 30)
  const sinceStr = since.toISOString().slice(0, 10)

  const { data: logs, error } = await supabase
    .from('breathing_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', sinceStr)
    .order('date', { ascending: false })
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const typedLogs = (logs ?? []) as BreathingLog[]
  const analysis = typedLogs.length > 0 ? analyzeBreathing(typedLogs[0]) : null

  // Trend data for charts
  const trend = typedLogs.map(l => ({
    date: l.date,
    rate: l.resting_breathing_rate,
    mrc: l.mrc_scale,
    pattern: l.breathing_pattern,
    sessionsCount: (l.exercises_completed ?? []).length,
    peak_flow: l.peak_flow_measured ?? null,
    avgStressBefore: (l.exercises_completed ?? []).length > 0
      ? Math.round(
          (l.exercises_completed ?? []).reduce((s, e) => s + (e.stress_before ?? 0), 0) /
            (l.exercises_completed ?? []).length * 10
        ) / 10
      : null,
    avgStressAfter: (l.exercises_completed ?? []).length > 0
      ? Math.round(
          (l.exercises_completed ?? []).reduce((s, e) => s + (e.stress_after ?? 0), 0) /
            (l.exercises_completed ?? []).length * 10
        ) / 10
      : null,
  })).reverse()

  return NextResponse.json({ logs: typedLogs, analysis, trend })
}

export async function POST(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json()
  const date = body.date ?? new Date().toISOString().slice(0, 10)

  const rate = Number(body.resting_breathing_rate ?? 14)
  if (rate < 4 || rate > 60) {
    return NextResponse.json({ error: 'Breathing rate must be between 4 and 60 breaths/min' }, { status: 400 })
  }
  const mrc = Number(body.mrc_scale ?? 0)
  if (mrc < 0 || mrc > 4) {
    return NextResponse.json({ error: 'MRC scale must be 0–4' }, { status: 400 })
  }

  const payload = {
    user_id: user.id,
    date,
    resting_breathing_rate: rate,
    breathing_pattern: body.breathing_pattern ?? 'nasal',
    breathing_type: body.breathing_type ?? 'diaphragmatic',
    mrc_scale: mrc,
    symptoms: body.symptoms ?? [],
    exercises_completed: body.exercises_completed ?? [],
    peak_flow_measured: body.peak_flow_measured ? Number(body.peak_flow_measured) : null,
    height_cm: body.height_cm ? Number(body.height_cm) : null,
    age: body.age ? Number(body.age) : null,
    sex: body.sex ?? null,
    notes: body.notes ?? '',
  }

  const { data, error } = await supabase
    .from('breathing_logs')
    .upsert(payload, { onConflict: 'user_id,date' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ log: data })
}
