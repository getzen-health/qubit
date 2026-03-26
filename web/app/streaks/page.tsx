import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import StreaksSummaryCard from '@/components/streaks-summary-card'

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
        <div className="flex flex-wrap gap-4">
          {(streaks ?? []).map(s => (
            <div key={s.streak_type} className="flex items-center gap-2 bg-orange-50 rounded-lg px-4 py-2 shadow">
              <span className="text-2xl">🔥</span>
              <span className="font-bold text-lg">{s.current_streak}</span>
              <span className="capitalize text-gray-700">{s.streak_type.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
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
