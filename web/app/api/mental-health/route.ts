import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: Return last 3 screenings per type for the current user
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get last 3 screenings per type
  const { data, error } = await supabase.from('mental_health_screenings')
    .select('*')
    .eq('user_id', user.id)
    .order('screened_at', { ascending: false })
    .limit(9) // 3 per type, will filter in JS
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Group by screener_type, take 3 most recent per type
  const grouped: Record<string, any[]> = {}
  for (const row of data || []) {
    if (!grouped[row.screener_type]) grouped[row.screener_type] = []
    if (grouped[row.screener_type].length < 3) grouped[row.screener_type].push(row)
  }
  const flat = Object.values(grouped).flat()
  return NextResponse.json(flat)
}

// POST: Save a new screening
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { screener_type, answers, total_score, severity_label } = body
  if (!['phq9', 'gad7', 'pss4'].includes(screener_type)) {
    return NextResponse.json({ error: 'Invalid screener type' }, { status: 400 })
  }
  const { error } = await supabase.from('mental_health_screenings').insert({
    user_id: user.id,
    screener_type,
    answers,
    total_score,
    severity_label,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
