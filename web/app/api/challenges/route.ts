import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'

// GET: List public challenges + user's participation
export async function GET(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id

  // Get all public challenges
  const { data: challenges, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('is_public', true)
    .order('starts_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get participation for user
  let participation = []
  if (userId) {
    const { data: parts } = await supabase
      .from('challenge_participants')
      .select('challenge_id, current_value')
      .eq('user_id', userId)
    participation = parts || []
  }

  // Get participant counts via raw aggregate query
  const { data: counts } = await supabase
    .from('challenge_participants')
    .select('challenge_id')
  const countMap: Record<string, number> = {}
  for (const row of counts ?? []) {
    countMap[row.challenge_id] = (countMap[row.challenge_id] ?? 0) + 1
  }

  return NextResponse.json({
    challenges: (challenges||[]).map(ch => ({
      ...ch,
      participant_count: countMap[ch.id] || 0,
      joined: participation.some(p => p.challenge_id === ch.id),
      current_value: participation.find(p => p.challenge_id === ch.id)?.current_value || 0
    }))
  })
}

// POST: Create new challenge
export async function POST(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const body = await req.json()
  const { title, description, type, target_value, duration_days, is_public } = body
  if (!title || !target_value) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const starts_at = new Date().toISOString()
  const ends_at = new Date(Date.now() + (duration_days||7)*86400000).toISOString()
  const { data, error } = await supabase.from('challenges').insert({
    title, description, type, target_value, duration_days, is_public,
    starts_at, ends_at, created_by: user.id
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ challenge: data })
}
