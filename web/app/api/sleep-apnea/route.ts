import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIdentifier } from '@/lib/security'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('sleep_apnea_screens')
    .select('*')
    .eq('user_id', user.id)
    .order('screened_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const { allowed } = await checkRateLimit(identifier, 'healthData')
  if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { stopbang_score, ess_score, stopbang_risk, ess_category, answers } = body

  if (
    typeof stopbang_score !== 'number' ||
    stopbang_score < 0 ||
    stopbang_score > 8 ||
    !stopbang_risk
  ) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('sleep_apnea_screens')
    .insert({
      user_id: user.id,
      screened_at: new Date().toISOString().slice(0, 10),
      stopbang_score,
      ess_score: typeof ess_score === 'number' ? ess_score : null,
      stopbang_risk,
      ess_category: ess_category ?? null,
      answers: answers ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
