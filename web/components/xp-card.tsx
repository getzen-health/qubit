import Link from 'next/link'
import { getLevelInfo } from '@/lib/achievements'

export default function XpCard({ totalXP = 0, currentStreak = 0 }: { totalXP: number, currentStreak: number }) {
  const levelInfo = getLevelInfo(totalXP)
  return (
    <Link href="/achievements" className="block bg-surface border border-border rounded-2xl p-4 shadow hover:shadow-lg transition">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg font-bold">{levelInfo.current.name}</span>
        <span className="ml-2 px-2 py-1 rounded bg-primary text-white text-xs">Level {levelInfo.current.level}</span>
      </div>
      <div className="w-full bg-border rounded-2xl h-3 overflow-hidden mb-1">
        <div
          className="bg-primary h-3 rounded-2xl transition-all"
          style={{ width: `${levelInfo.progressToNext}%` }}
        />
      </div>
      <div className="text-xs text-text-secondary mb-1">
        {levelInfo.next
          ? `${levelInfo.totalXP} / ${levelInfo.next.minXP} XP to Level ${levelInfo.next.level}`
          : 'Max level reached!'}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-2xl">🔥</span>
        <span className="font-semibold text-primary">{currentStreak} day streak</span>
      </div>
    </Link>
  )
}
