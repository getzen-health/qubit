import Link from 'next/link'
import { Zap, Flame } from 'lucide-react'
import { getLevelInfo } from '@/lib/achievements'

export default function XpCard({ totalXP = 0, currentStreak = 0 }: { totalXP: number, currentStreak: number }) {
  const levelInfo = getLevelInfo(totalXP)
  return (
    <Link
      href="/achievements"
      className="block bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[hsl(var(--color-glucose))]" />
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">Progress</span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-semibold">
          Level {levelInfo.current.level}
        </span>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-bold text-text-primary">{levelInfo.current.name}</span>
      </div>

      {/* XP progress bar */}
      <div className="w-full bg-surface-secondary rounded-full h-2 overflow-hidden mb-1">
        <div
          className="bg-accent h-2 rounded-full transition-all duration-500"
          style={{ width: `${levelInfo.progressToNext}%` }}
        />
      </div>
      <p className="text-xs text-text-secondary">
        {levelInfo.next
          ? `${levelInfo.totalXP.toLocaleString()} / ${levelInfo.next.minXP.toLocaleString()} XP`
          : 'Max level reached! 🎉'}
      </p>

      {currentStreak > 0 && (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-semibold text-text-primary">{currentStreak} day streak</span>
        </div>
      )}
    </Link>
  )
}
