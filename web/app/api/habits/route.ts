import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/habits?days=30 — returns habits + completions window
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const days = Math.min(parseInt(request.nextUrl.searchParams.get('days') ?? '30', 10), 90)
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)

  const [{ data: habits }, { data: completions }] = await Promise.all([
    supabase
      .from('habits')
      .select('id, name, emoji, target_days, sort_order, created_at')
      .eq('user_id', user.id)
      .is('archived_at', null)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('habit_completions')
      .select('habit_id, date')
      .eq('user_id', user.id)
      .gte('date', since),
  ])

  return NextResponse.json({ habits: habits ?? [], completions: completions ?? [] })
}

// POST /api/habits — toggle completion for a date
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { habit_id, date, completed } = body

  if (!habit_id || !date) {
    return NextResponse.json({ error: 'habit_id and date required' }, { status: 400 })
  }

  // Verify habit belongs to user
  const { data: habit } = await supabase
    .from('habits')
    .select('id')
    .eq('id', habit_id)
    .eq('user_id', user.id)
    .single()

  if (!habit) return NextResponse.json({ error: 'Habit not found' }, { status: 404 })

  if (completed) {
    const { error } = await supabase
      .from('habit_completions')
      .upsert({ habit_id, user_id: user.id, date }, { onConflict: 'habit_id,date' })
    if (error) return NextResponse.json({ error: 'Failed to record completion' }, { status: 500 })
  } else {
    const { error } = await supabase
      .from('habit_completions')
      .delete()
      .eq('habit_id', habit_id)
      .eq('date', date)
    if (error) return NextResponse.json({ error: 'Failed to remove completion' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
