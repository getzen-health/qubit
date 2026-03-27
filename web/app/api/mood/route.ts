import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase
    .from('mood_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('logged_at', { ascending: false })
    .limit(30)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()

  // Accept valence (-5..5) or legacy score (1..10) from iOS app
  let valence: number
  if (body.valence !== undefined) {
    valence = Math.round(Number(body.valence))
  } else if (body.score !== undefined) {
    // Map 1-10 → -5..5 linearly: score 1 → -5, score 10 → +5
    valence = Math.round((Number(body.score) - 1) * 10 / 9 - 5)
  } else {
    return NextResponse.json({ error: 'valence (-5 to 5) or score (1-10) required' }, { status: 400 })
  }
  valence = Math.max(-5, Math.min(5, valence))

  const { data, error } = await supabase
    .from('mood_logs')
    .insert({
      user_id: user.id,
      valence,
      emotions: Array.isArray(body.emotions) ? body.emotions : [],
      notes: body.notes || null,
    })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await supabase.from('mood_logs').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
