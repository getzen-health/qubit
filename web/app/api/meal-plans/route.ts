import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const weekStart = request.nextUrl.searchParams.get('week') ?? getMonday(new Date())
  
  const [{ data: plans }, { data: recipes }] = await Promise.all([
    supabase.from('meal_plans').select('*, recipe:meal_recipes(*)').eq('user_id', user.id).eq('week_start', weekStart),
    supabase.from('meal_recipes').select('*').eq('is_public', true).order('name'),
  ])

  return NextResponse.json({ plans: plans ?? [], recipes: recipes ?? [], week_start: weekStart })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const weekStart = body.week_start ?? getMonday(new Date())
  const { data, error } = await supabase.from('meal_plans').upsert({
    ...body, user_id: user.id, week_start: weekStart,
  }, { onConflict: 'user_id,week_start,day_of_week,meal_slot' }).select('*, recipe:meal_recipes(*)').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ plan: data })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await request.json()
  const { error: deleteErr } = await supabase.from('meal_plans').delete().eq('id', id).eq('user_id', user.id)
  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

function getMonday(d: Date): string {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  return date.toISOString().slice(0, 10)
}
