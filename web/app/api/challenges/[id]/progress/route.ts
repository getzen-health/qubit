import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'

// PUT: Update user's current_value for a challenge
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const { id: challenge_id } = await params
  const { data: challenge, error: challengeErr } = await supabase.from('challenges').select('*').eq('id', challenge_id).single()
  if (challengeErr) console.error('challenges fetch error', challengeErr)
  let value = 0
  if (challenge?.type === 'steps') {
    // Sum steps for challenge duration
    const { data: metrics } = await supabase
      .from('health_metrics')
      .select('value, date')
      .eq('user_id', user.id)
      .eq('type', 'steps')
      .gte('date', challenge.starts_at)
      .lte('date', challenge.ends_at)
    value = (metrics||[]).reduce((sum, m) => sum + (m.value||0), 0)
  } else {
    // Accept value from body
    const body = await req.json()
    value = body.value || 0
  }
  const { error } = await supabase.from('challenge_participants')
    .update({ current_value: value })
    .eq('challenge_id', challenge_id)
    .eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, value })
}
