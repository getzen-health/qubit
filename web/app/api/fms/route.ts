import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIdentifier } from '@/lib/security'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: assessments, error } = await supabase
    .from('fms_assessments')
    .select('id, assessed_at, total_score, risk_level, weak_links, asymmetries, scores, notes, created_at')
    .eq('user_id', user.id)
    .order('assessed_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('FMS GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 })
  }

  const trend = (assessments ?? [])
    .slice()
    .reverse()
    .map((a) => ({ date: a.assessed_at, total: a.total_score, risk_level: a.risk_level }))

  return NextResponse.json({ assessments: assessments ?? [], trend })
}

export async function POST(req: NextRequest) {
  const identifier = getClientIdentifier(req)
  const { allowed, remaining } = await checkRateLimit(identifier, 'healthData')
  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    scores: unknown
    total_score: number
    risk_level: string
    weak_links?: string[]
    asymmetries?: string[]
    notes?: string
    assessed_at?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { scores, total_score, risk_level, weak_links, asymmetries, notes, assessed_at } = body

  if (typeof total_score !== 'number' || total_score < 0 || total_score > 21) {
    return NextResponse.json({ error: 'Invalid total_score' }, { status: 400 })
  }
  if (!['Low', 'Elevated', 'High'].includes(risk_level)) {
    return NextResponse.json({ error: 'Invalid risk_level' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('fms_assessments')
    .insert({
      user_id: user.id,
      assessed_at: assessed_at ?? new Date().toISOString().slice(0, 10),
      scores,
      total_score,
      risk_level,
      weak_links: weak_links ?? [],
      asymmetries: asymmetries ?? [],
      notes: notes ?? null,
    })
    .select('id, assessed_at, total_score, risk_level')
    .single()

  if (error) {
    console.error('FMS POST error:', error)
    return NextResponse.json({ error: 'Failed to save assessment' }, { status: 500 })
  }

  return NextResponse.json(
    { assessment: data },
    { status: 201, headers: { 'X-RateLimit-Remaining': remaining.toString() } }
  )
}
