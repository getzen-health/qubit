import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const { data } = await supabase
    .from('break_sessions')
    .select('*')
    .eq('user_id', user.id)
    .gte('logged_at', today.toISOString())
    .order('logged_at', { ascending: false })

  const completed = (data ?? []).filter(b => b.completed)
  const totalSittingMin = (data ?? []).reduce((sum, b) => sum + (b.sitting_minutes_before ?? 0), 0)

  return NextResponse.json({ breaks: data ?? [], completedToday: completed.length, totalSittingMin })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { data, error } = await supabase.from('break_sessions').insert({ ...body, user_id: user.id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
