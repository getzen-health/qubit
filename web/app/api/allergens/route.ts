import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase
    .from('user_allergens')
    .select('*')
    .eq('user_id', user.id)
    .order('allergen')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ allergens: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const allergen = typeof body.allergen === 'string' ? body.allergen.trim() : ''
  const severity = body.severity ?? 'moderate'
  if (!allergen) return NextResponse.json({ error: 'allergen is required' }, { status: 400 })
  const { data, error } = await supabase
    .from('user_allergens')
    .insert({ user_id: user.id, allergen, severity })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ allergen: data }, { status: 201 })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  const { error } = await supabase
    .from('user_allergens')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
