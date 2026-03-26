import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const [logsResult, settingsResult] = await Promise.all([
    supabase
      .from('cycle_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', sixMonthsAgo.toISOString().slice(0, 10))
      .order('date', { ascending: false }),
    supabase
      .from('cycle_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  if (logsResult.error) {
    return NextResponse.json({ error: logsResult.error.message }, { status: 500 })
  }

  return NextResponse.json({
    logs: logsResult.data ?? [],
    settings: settingsResult.data ?? null,
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimitResult = await checkRateLimit(user.id, 'healthData')
  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const body = await request.json()
  const { type } = body

  if (type === 'log') {
    const {
      date,
      period_started,
      period_ended,
      flow_level,
      bbt_celsius,
      cervical_mucus,
      symptoms,
      mood,
      energy,
      notes,
    } = body

    if (!date) {
      return NextResponse.json({ error: 'date is required' }, { status: 400 })
    }

    const payload: Record<string, unknown> = {
      user_id: user.id,
      date,
      period_started: period_started ?? false,
      period_ended: period_ended ?? false,
      symptoms: symptoms ?? {},
    }
    if (flow_level !== undefined && flow_level !== null) payload.flow_level = flow_level
    if (bbt_celsius !== undefined && bbt_celsius !== null) payload.bbt_celsius = bbt_celsius
    if (cervical_mucus) payload.cervical_mucus = cervical_mucus
    if (mood !== undefined && mood !== null) payload.mood = mood
    if (energy !== undefined && energy !== null) payload.energy = energy
    if (notes) payload.notes = notes

    const { data, error } = await supabase
      .from('cycle_logs')
      .upsert(payload, { onConflict: 'user_id,date' })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data }, { status: 201 })
  }

  if (type === 'settings') {
    const { avg_cycle_length, avg_period_length, last_period_start, tracking_goal } = body

    const payload: Record<string, unknown> = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
    }
    if (avg_cycle_length !== undefined) payload.avg_cycle_length = avg_cycle_length
    if (avg_period_length !== undefined) payload.avg_period_length = avg_period_length
    if (last_period_start !== undefined) payload.last_period_start = last_period_start
    if (tracking_goal !== undefined) payload.tracking_goal = tracking_goal

    const { data, error } = await supabase
      .from('cycle_settings')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data }, { status: 201 })
  }

  return NextResponse.json({ error: 'type must be "log" or "settings"' }, { status: 400 })
}
