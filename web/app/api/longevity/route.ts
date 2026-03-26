import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const since = new Date()
  since.setDate(since.getDate() - 90)

  const { data, error } = await supabase
    .from('longevity_checkins')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', since.toISOString().slice(0, 10))
    .order('date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimitResult = await checkRateLimit(user.id, 'healthData')
  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const body = await request.json()
  const { date, pillar_scores, blueprint_items_completed, blueprint_score, overall_score, epigenetic_age_delta, notes } = body

  if (!date || !pillar_scores) {
    return NextResponse.json({ error: 'date and pillar_scores required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('longevity_checkins')
    .upsert(
      {
        user_id: user.id,
        date,
        pillar_scores,
        blueprint_items_completed: blueprint_items_completed ?? [],
        blueprint_score: blueprint_score ?? 0,
        overall_score: overall_score ?? 0,
        epigenetic_age_delta: epigenetic_age_delta ?? 0,
        notes: notes ?? null,
      },
      { onConflict: 'user_id,date' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
