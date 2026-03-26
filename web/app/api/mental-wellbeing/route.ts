import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'

export async function GET(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [{ data: assessments, error: ae }, { data: moods, error: me }] = await Promise.all([
    supabase
      .from('mental_health_assessments')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', since)
      .order('date', { ascending: false }),
    supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('logged_at', { ascending: false }),
  ])

  if (ae) return NextResponse.json({ error: ae.message }, { status: 500 })
  if (me) return NextResponse.json({ error: me.message }, { status: 500 })

  // Compute latest score per assessment type
  const latestByType: Record<string, typeof assessments[0]> = {}
  for (const a of assessments ?? []) {
    if (!latestByType[a.assessment_type]) latestByType[a.assessment_type] = a
  }

  return NextResponse.json({
    assessments: assessments ?? [],
    moods: moods ?? [],
    latestByType,
  })
}

export async function POST(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json()

  if (body.type === 'mood') {
    const { valence, arousal, emotions, notes } = body
    const { data, error } = await supabase
      .from('mood_logs')
      .insert({
        user_id: user.id,
        valence: Math.max(-5, Math.min(5, Number(valence) || 0)),
        arousal: Math.max(-5, Math.min(5, Number(arousal) || 0)),
        emotions: Array.isArray(emotions) ? emotions : [],
        notes: notes || null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ mood: data })
  }

  if (body.type === 'assessment') {
    const { assessment_type, scores, composite_score, notes } = body
    const today = new Date().toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from('mental_health_assessments')
      .upsert(
        {
          user_id: user.id,
          date: today,
          assessment_type,
          scores: scores ?? {},
          composite_score: composite_score ?? null,
          notes: notes || null,
        },
        { onConflict: 'user_id,date,assessment_type' },
      )
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ assessment: data })
  }

  return NextResponse.json({ error: 'Invalid type. Use "mood" or "assessment".' }, { status: 400 })
}
