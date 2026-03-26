import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'

export async function GET(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: assessments, error } = await supabase
    .from('cognitive_assessments')
    .select('*')
    .eq('user_id', user.id)
    .order('assessed_at', { ascending: false })
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Time-of-day breakdown
  const todBreakdown: Record<string, { count: number; totalScore: number }> = {}
  for (const a of assessments ?? []) {
    const tod = a.time_of_day ?? 'unknown'
    if (!todBreakdown[tod]) todBreakdown[tod] = { count: 0, totalScore: 0 }
    todBreakdown[tod].count++
    todBreakdown[tod].totalScore += a.total_score ?? 0
  }
  const timeOfDayAvg = Object.fromEntries(
    Object.entries(todBreakdown).map(([k, v]) => [
      k,
      v.count > 0 ? Math.round(v.totalScore / v.count) : 0,
    ])
  )

  // 7-day trend
  const recent7 = (assessments ?? []).slice(0, 7).reverse()
  const trend = recent7.map((a) => ({
    date: a.assessed_at?.slice(0, 10),
    score: a.total_score,
  }))

  return NextResponse.json({ assessments, trend, timeOfDayAvg })
}

export async function POST(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json()

  const { data, error } = await supabase
    .from('cognitive_assessments')
    .insert({
      user_id: user.id,
      assessed_at: new Date().toISOString(),
      total_score: body.total_score ?? null,
      reaction_time_ms: body.reaction_time_ms ?? null,
      go_no_go_score: body.go_no_go_score ?? null,
      digit_span: body.digit_span ?? null,
      time_of_day: body.time_of_day ?? null,
      results: body.results ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ assessment: data }, { status: 201 })
}
