import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { data, error } = await supabase
    .from('water_entries')
    .select('id, amount_ml, logged_at')
    .eq('user_id', user.id)
    .gte('logged_at', today.toISOString())
    .order('logged_at', { ascending: false })
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  const total = (data ?? []).reduce((sum, e) => sum + e.amount_ml, 0)
  return NextResponse.json({ data, total })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const { amount_ml } = await request.json()
  if (!amount_ml || amount_ml <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  
  const { data, error } = await supabase
    .from('water_entries')
    .insert({ user_id: user.id, amount_ml })
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
  const { error } = await supabase.from('water_entries').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
