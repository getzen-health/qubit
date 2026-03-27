import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error: fetchErr } = await supabase.from('lab_results').select('*').eq('user_id', user.id).order('lab_date', { ascending: false }).limit(200)
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  // Latest per biomarker
  const latest: Record<string, any> = {}
  for (const r of (data ?? [])) {
    if (!latest[r.biomarker_key]) latest[r.biomarker_key] = r
  }
  return NextResponse.json({ results: data ?? [], latest })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { data, error } = await supabase.from('lab_results').insert({ ...body, user_id: user.id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ result: data })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await request.json()
  const { error: deleteErr } = await supabase.from('lab_results').delete().eq('id', id).eq('user_id', user.id)
  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
