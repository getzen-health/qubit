import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'
import { analyzeMindfulness, type MeditationSession } from '@/lib/mindfulness'

export async function GET(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: sessions, error } = await supabase
    .from('meditation_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const analysis = analyzeMindfulness((sessions ?? []) as MeditationSession[])

  return NextResponse.json({ sessions: sessions ?? [], analysis })
}

export async function POST(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: Partial<MeditationSession>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const {
    date,
    type,
    duration_min,
    quality_rating,
    distractions = 0,
    mood_before,
    mood_after,
    stress_before,
    stress_after,
    insight,
    mbsr_week,
  } = body

  if (!date || !type || !duration_min || !quality_rating) {
    return NextResponse.json({ error: 'date, type, duration_min, quality_rating are required' }, { status: 400 })
  }
  if (duration_min < 1 || duration_min > 480) {
    return NextResponse.json({ error: 'duration_min must be 1-480' }, { status: 400 })
  }
  if (quality_rating < 1 || quality_rating > 5) {
    return NextResponse.json({ error: 'quality_rating must be 1-5' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('meditation_sessions')
    .insert({
      user_id: user.id,
      date,
      type,
      duration_min,
      quality_rating,
      distractions,
      mood_before: mood_before ?? null,
      mood_after: mood_after ?? null,
      stress_before: stress_before ?? null,
      stress_after: stress_after ?? null,
      insight: insight ?? null,
      mbsr_week: mbsr_week ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ session: data }, { status: 201 })
}
