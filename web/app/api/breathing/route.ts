import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabase.from('breathing_sessions').select('*').eq('user_id', user.id).order('completed_at', { ascending: false }).limit(30)
  const totalMinutes = (data ?? []).reduce((s: number, r: any) => s + Math.floor(r.duration_seconds / 60), 0)
  return NextResponse.json({ sessions: data ?? [], total_minutes: totalMinutes, total_sessions: data?.length ?? 0 })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { data, error } = await supabase.from('breathing_sessions').insert({ ...body, user_id: user.id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ session: data })
}
