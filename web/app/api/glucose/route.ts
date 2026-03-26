import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const days = parseInt(new URL(request.url).searchParams.get('days') ?? '30')
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await supabase
    .from('blood_glucose_entries')
    .select('id, value_mmol, value_mgdl, context, notes, logged_at')
    .eq('user_id', user.id)
    .gte('logged_at', since.toISOString())
    .order('logged_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { value_mmol, context, notes } = body

  if (!value_mmol || value_mmol <= 0 || value_mmol > 30) {
    return NextResponse.json({ error: 'Invalid glucose value (must be 0.1–30 mmol/L)' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('blood_glucose_entries')
    .insert({ user_id: user.id, value_mmol, context: context ?? 'random', notes })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  const { error } = await supabase.from('blood_glucose_entries').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
