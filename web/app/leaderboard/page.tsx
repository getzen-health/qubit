import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LeaderboardClient } from './leaderboard-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata: Metadata = { title: 'Streak Leaderboard' }

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: leaderboard }, { data: myProfile }] = await Promise.all([
    supabase
      .from('streak_leaderboard')
      .select('id, display_name, current_streak, longest_streak, last_active_date')
      .limit(50),
    supabase
      .from('user_profiles')
      .select('id, current_streak, longest_streak, leaderboard_opt_in, display_name')
      .eq('user_id', user.id)
      .single(),
  ])

  const rows = leaderboard ?? []
  const myRank = myProfile?.leaderboard_opt_in
    ? (rows.findIndex((r) => r.id === myProfile?.id) + 1) || null
    : null

  return (
    <>
      <LeaderboardClient
        leaderboard={rows}
        myProfileId={myProfile?.id ?? null}
        myRank={myRank}
        myStreak={myProfile?.current_streak ?? 0}
        myLongest={myProfile?.longest_streak ?? 0}
        myOptIn={myProfile?.leaderboard_opt_in ?? false}
        myDisplayName={myProfile?.display_name ?? ''}
      />
      <BottomNav />
    </>
  )
}
