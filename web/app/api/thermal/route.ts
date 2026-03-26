import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const user_id = searchParams.get('user_id')
  const since = searchParams.get('since')
  const until = searchParams.get('until')
  let query = supabase
    .from('thermal_sessions')
    .select('*')
    .order('logged_at', { ascending: false })
    .limit(50)
  if (user_id) query = query.eq('user_id', user_id)
  if (since) query = query.gte('logged_at', since)
  if (until) query = query.lte('logged_at', until)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json()
  const { data, error } = await supabase.from('thermal_sessions').insert([body]).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { id } = await req.json()
  const { error } = await supabase.from('thermal_sessions').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
