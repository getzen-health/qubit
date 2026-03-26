import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: Return today's entries grouped by meal_type, with totals
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date()
  today.setHours(0,0,0,0)
  const iso = today.toISOString()

  const { data, error } = await supabase
    .from('food_diary_entries')
    .select('*')
    .eq('user_id', user.id)
    .gte('logged_at', iso)
    .order('logged_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Group by meal_type
  const grouped = { breakfast: [], lunch: [], dinner: [], snack: [] }
  let totals = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  for (const entry of data) {
    grouped[entry.meal_type].push(entry)
    totals.calories += entry.calories || 0
    totals.protein_g += Number(entry.protein_g) || 0
    totals.carbs_g += Number(entry.carbs_g) || 0
    totals.fat_g += Number(entry.fat_g) || 0
  }
  return NextResponse.json({ grouped, totals })
}

// POST: Add entry
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { meal_type, food_name, calories, protein_g, carbs_g, fat_g, fiber_g, serving_size } = body
  if (!meal_type || !food_name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const { error } = await supabase.from('food_diary_entries').insert({
    user_id: user.id, meal_type, food_name, calories, protein_g, carbs_g, fat_g, fiber_g, serving_size
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE: Remove entry by id
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { error } = await supabase.from('food_diary_entries').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
