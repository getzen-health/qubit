import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'
import { calculateToxinBurden } from '@/lib/environmental-toxins'
import type { ToxinLog } from '@/lib/environmental-toxins'

// GET /api/environmental — last 30 logs + trend data + today's score
export async function GET(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().slice(0, 10)
  const since30 = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10)

  const [{ data: logs, error }, { data: todayLog }] = await Promise.all([
    supabase
      .from('toxin_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', since30)
      .order('date', { ascending: true })
      .limit(30),
    supabase
      .from('toxin_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle(),
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const trendData = (logs ?? []).map((l) => {
    const s = calculateToxinBurden(l as ToxinLog)
    return {
      date: (l as ToxinLog).date,
      score: s.total,
      plastics: s.pillars.plastics,
      heavyMetals: s.pillars.heavyMetals,
      pesticides: s.pillars.pesticides,
      vocs: s.pillars.vocs,
    }
  })

  const currentScore = todayLog ? calculateToxinBurden(todayLog as ToxinLog) : null

  return NextResponse.json({ logs: logs ?? [], trendData, todayLog, currentScore })
}

// POST /api/environmental — upsert today's toxin log
export async function POST(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const today = new Date().toISOString().slice(0, 10)

  // Strip client-only fields before upserting
  const { id: _id, user_id: _uid, created_at: _ca, ...fields } = body

  const { data, error } = await supabase
    .from('toxin_logs')
    .upsert(
      { ...fields, user_id: user.id, date: today, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date' },
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const score = calculateToxinBurden(data as ToxinLog)
  return NextResponse.json({ log: data, score })
}
