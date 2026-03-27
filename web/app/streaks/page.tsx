import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import StreaksSummaryCard from '@/components/streaks-summary-card'
import { ShareButton } from '@/components/share-button'

export default async function StreaksPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()
  if (userError || !user) return notFound()

  const { data: streaks } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', user.id)

  const { data: achievements } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', user.id)

  // Example achievements
  const allAchievements = [
    { id: '7-day-streak', label: '7-Day Streak', icon: '🔥' },
    { id: '30-day-streak', label: '30-Day Streak', icon: '🔥' },
    { id: 'first-scan', label: 'First Scan', icon: '🔍' },
    { id: '10-workouts', label: '10 Workouts', icon: '💪' },
    { id: '100-water-logs', label: '100 Water Logs', icon: '💧' }
  ]
  const unlocked = new Set((achievements ?? []).map(a => a.achievement_id))

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Streaks & Achievements</h1>
      <div className="mb-8">
        <h2 className="font-semibold mb-2">Current Streaks</h2>
        {(streaks ?? []).length === 0 ? (
          <div className="text-center py-12 bg-orange-50 rounded-xl border border-orange-100">
            <div className="text-4xl mb-3">🔥</div>
            <p className="text-lg font-semibold text-gray-800 mb-1">No active streaks yet</p>
            <p className="text-sm text-gray-500">Start logging your health data daily to build a streak!</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {(streaks ?? []).map(s => (
              <div key={s.streak_type} className="flex flex-col items-start gap-2 bg-orange-50 rounded-lg px-4 py-3 shadow min-w-[140px]">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔥</span>
                  <span className="capitalize text-gray-700 font-medium">{s.streak_type.replace('_', ' ')}</span>
                </div>
                <p className="text-4xl font-bold text-orange-500 leading-none">{s.current_streak}</p>
                <p className="text-xs text-gray-400">days current</p>
                {(s.longest_streak ?? s.best_streak) > 0 && (
                  <p className="text-xs text-gray-500">Best streak: {s.longest_streak ?? s.best_streak} days</p>
                )}
                {s.current_streak >= 7 && (
                  <ShareButton
                    title={`I'm on a ${s.current_streak}-day health streak on KQuarks!`}
                    text={`🔥 I'm on a ${s.current_streak}-day health streak on KQuarks! Building better habits every day.`}
                    className="mt-1"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <h2 className="font-semibold mb-2">Achievements</h2>
        <div className="flex flex-wrap gap-4">
          {allAchievements.map(a => (
            <div key={a.id} className={`flex flex-col items-center p-3 rounded-lg border shadow w-28 ${unlocked.has(a.id) ? 'bg-green-50 border-green-300' : 'bg-gray-100 border-gray-200 opacity-60'}`}>
              <span className="text-3xl mb-1">{a.icon}</span>
              <span className="text-sm font-medium text-center">{a.label}</span>
              {!unlocked.has(a.id) && <span className="text-xs text-gray-400 mt-1">Locked</span>}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8">
        <StreaksSummaryCard streaks={streaks ?? []} />
      </div>
    </div>
  )
}
