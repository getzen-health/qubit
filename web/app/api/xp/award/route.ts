// POST { action: string }
// Awards XP for an action, updates user_stats, checks for new achievements
// Called fire-and-forget from other routes after key actions
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { XP_ACTIONS, LEVELS } from '@/lib/achievements'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action } = await request.json()
  const xp = XP_ACTIONS[action] ?? 5

  // Log XP
  await supabase.from('user_xp_log').insert({ user_id: user.id, action, xp_earned: xp })

  // Update user_stats total XP and level
  const { data: stats } = await supabase.from('user_stats').select('total_xp').eq('user_id', user.id).single()
  const newXP = (stats?.total_xp ?? 0) + xp
  const newLevel = LEVELS.filter(l => newXP >= l.minXP).length

  await supabase.from('user_stats').upsert({
    user_id: user.id,
    total_xp: newXP,
    level: newLevel,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  return NextResponse.json({ xp_earned: xp, total_xp: newXP, level: newLevel })
}
