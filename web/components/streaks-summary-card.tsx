import { Trophy } from 'lucide-react'

interface Streak {
  longest_streak: number;
  streak_type: string;
}

interface Props {
  streaks: Streak[];
}

export default function StreaksSummaryCard({ streaks }: Props) {
  if (!streaks || streaks.length === 0) return null
  const longest = streaks.reduce((max: Streak, s: Streak) => s.longest_streak > max.longest_streak ? s : max, streaks[0])
  return (
    <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mt-4 shadow">
      <Trophy className="w-6 h-6 text-yellow-500" />
      <div>
        <div className="font-semibold text-lg">Longest Streak</div>
        <div className="text-sm text-gray-700">{longest.longest_streak} days — <span className="capitalize">{longest.streak_type.replace('_', ' ')}</span></div>
      </div>
    </div>
  )
}
