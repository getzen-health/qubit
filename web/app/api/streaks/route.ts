import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: Return all streaks and achievements for authenticated user
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: streaks } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', user.id)

  const { data: achievements } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', user.id)

  return NextResponse.json({ streaks, achievements })
}

// POST: Increment streak by 1 day (upsert)
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { streak_type } = await req.json()
  if (!streak_type) return NextResponse.json({ error: 'Missing streak_type' }, { status: 400 })

  // Fetch current streak
  const { data: streak } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', user.id)
    .eq('streak_type', streak_type)
    .single()

  const today = new Date().toISOString().slice(0, 10)
  let current_streak = 1
  let longest_streak = 1
  if (streak) {
    const lastDate = streak.last_activity_date
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    if (lastDate === today) {
      // Already updated today
      return NextResponse.json({ streak })
    } else if (lastDate === yesterday) {
      current_streak = streak.current_streak + 1
    } else {
      current_streak = 1
    }
    longest_streak = Math.max(streak.longest_streak, current_streak)
  }

  const { data: upserted, error } = await supabase
    .from('user_streaks')
    .upsert({
      user_id: user.id,
      streak_type,
      current_streak,
      longest_streak,
      last_activity_date: today,
      updated_at: new Date().toISOString()
    }, { onConflict: ['user_id', 'streak_type'] })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ streak: upserted })
}
