import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  // Find users with activity today (steps > 0 in daily_summaries)
  const { data: activeToday } = await supabase
    .from('daily_summaries')
    .select('user_id')
    .eq('date', today)
    .gt('steps', 0)

  if (!activeToday?.length) return new Response(JSON.stringify({ updated: 0 }))

  const userIds = activeToday.map(r => r.user_id)

  // For each active user, increment streak if last_active_date was yesterday or today
  for (const userId of userIds) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('current_streak, longest_streak, last_active_date')
      .eq('user_id', userId)
      .single()

    if (!profile) continue
    const lastActive = profile.last_active_date
    const newStreak = (lastActive === yesterday || lastActive === today)
      ? (lastActive === today ? profile.current_streak : profile.current_streak + 1)
      : 1

    await supabase.from('user_profiles').update({
      current_streak: newStreak,
      longest_streak: Math.max(newStreak, profile.longest_streak),
      last_active_date: today,
    }).eq('user_id', userId)
  }

  // Reset streaks for users inactive 2+ days
  await supabase.from('user_profiles')
    .update({ current_streak: 0 })
    .lt('last_active_date', yesterday)
    .gt('current_streak', 0)

  return new Response(JSON.stringify({ updated: userIds.length }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
