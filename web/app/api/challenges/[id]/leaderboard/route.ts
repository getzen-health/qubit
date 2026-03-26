import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'

// GET: Top 20 participants for a challenge
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const challenge_id = params.id
  // Join with profiles if available, else anonymize
  const { data: participants, error } = await supabase
    .from('challenge_participants')
    .select('user_id, current_value')
    .eq('challenge_id', challenge_id)
    .order('current_value', { ascending: false })
    .limit(20)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Anonymize: User #abc123
  const leaderboard = (participants||[]).map((p, i) => ({
    rank: i+1,
    name: `User #${p.user_id.slice(-6)}`,
    current_value: p.current_value
  }))
  return NextResponse.json({ leaderboard })
}
