import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'

// GET /api/injury — active injuries + 90-day history
export async function GET(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const since = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)

  const { data: logs, error } = await supabase
    .from('injury_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('logged_at', since)
    .order('logged_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const active = (logs ?? []).filter((l) => l.recovery_status !== 'resolved')
  const history = (logs ?? []).filter((l) => l.recovery_status === 'resolved')

  return NextResponse.json({ active, history, total: logs?.length ?? 0 })
}

// POST /api/injury — log a new injury or update recovery_status
export async function POST(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Status update for existing log
  if (body.id && body.recovery_status) {
    const { data, error } = await supabase
      .from('injury_logs')
      .update({ recovery_status: body.recovery_status })
      .eq('id', body.id)
      .eq('user_id', user.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ log: data })
  }

  // New injury log
  const { data, error } = await supabase
    .from('injury_logs')
    .insert({
      user_id: user.id,
      body_region: body.body_region,
      pain_type: body.pain_type,
      intensity: body.intensity,
      onset_type: body.onset_type ?? 'acute',
      onset_date: body.onset_date ?? null,
      aggravating_factors: body.aggravating_factors ?? [],
      relieving_factors: body.relieving_factors ?? [],
      recovery_status: 'active',
      notes: body.notes ?? '',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ log: data }, { status: 201 })
}
