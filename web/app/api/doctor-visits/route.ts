import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'

export async function GET(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('doctor_visits')
    .select('*')
    .eq('user_id', user.id)
    .order('visit_date', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ visits: data ?? [] })
}

export async function POST(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { data, error } = await supabase
    .from('doctor_visits')
    .insert({
      user_id: user.id,
      visit_date: body.visit_date,
      provider_name: body.provider_name ?? null,
      visit_type: body.visit_type ?? null,
      chief_complaint: body.chief_complaint ?? null,
      diagnoses: body.diagnoses ?? [],
      medications_changed: body.medications_changed ?? [],
      follow_up_date: body.follow_up_date ?? null,
      notes: body.notes ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ visit: data })
}
