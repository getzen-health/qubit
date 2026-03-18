import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/checkin?days=30  — returns today's check-in + history
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const days = parseInt(request.nextUrl.searchParams.get('days') ?? '30', 10)
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('daily_checkins')
    .select('id, date, energy, mood, stress, notes, created_at')
    .eq('user_id', user.id)
    .gte('date', since)
    .order('date', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to fetch check-ins' }, { status: 500 })

  const today = new Date().toISOString().slice(0, 10)
  const todayCheckin = data?.find((c) => c.date === today) ?? null

  return NextResponse.json({ today: todayCheckin, history: data ?? [] })
}

// POST /api/checkin — upsert today's check-in
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { energy, mood, stress, notes, date } = body

  if (energy !== undefined && (energy < 1 || energy > 5)) {
    return NextResponse.json({ error: 'energy must be 1–5' }, { status: 400 })
  }
  if (mood !== undefined && (mood < 1 || mood > 5)) {
    return NextResponse.json({ error: 'mood must be 1–5' }, { status: 400 })
  }
  if (stress !== undefined && (stress < 1 || stress > 5)) {
    return NextResponse.json({ error: 'stress must be 1–5' }, { status: 400 })
  }

  const today = date ?? new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('daily_checkins')
    .upsert(
      { user_id: user.id, date: today, energy, mood, stress, notes: notes ?? null },
      { onConflict: 'user_id,date' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to save check-in' }, { status: 500 })
  return NextResponse.json({ checkin: data }, { status: 201 })
}
