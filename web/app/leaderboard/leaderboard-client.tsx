'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeaderboardRow {
  id: string
  display_name: string
  current_streak: number
  longest_streak: number
  last_active_date: string | null
}

interface Props {
  leaderboard: LeaderboardRow[]
  myProfileId: string | null
  myRank: number | null
  myStreak: number
  myLongest: number
  myOptIn: boolean
  myDisplayName: string
}

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export function LeaderboardClient({
  leaderboard,
  myProfileId,
  myRank,
  myStreak,
  myLongest,
  myOptIn,
  myDisplayName,
}: Props) {
  const [optIn, setOptIn] = useState(myOptIn)
  const [displayName, setDisplayName] = useState(myDisplayName)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function saveSettings(newOptIn: boolean, newName: string) {
    setSaved(false)
    startTransition(async () => {
      await fetch('/api/leaderboard/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optIn: newOptIn, displayName: newName || undefined }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  function handleToggle(checked: boolean) {
    setOptIn(checked)
    saveSettings(checked, displayName)
  }

  function handleNameSave() {
    saveSettings(optIn, displayName)
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <Link href="/streaks" aria-label="Back">
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </Link>
        <h1 className="text-lg font-bold">Streak Leaderboard</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* My Streak Card */}
        <div className="rounded-2xl border border-border bg-surface p-5 flex items-center gap-4">
          <span className="text-5xl select-none">🔥</span>
          <div className="flex-1">
            <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Your Streak</p>
            <p className="text-3xl font-bold">
              {myStreak} <span className="text-base font-normal text-text-secondary">days</span>
            </p>
            <p className="text-sm text-text-secondary mt-0.5">
              Longest: <span className="font-medium text-text-primary">{myLongest} days</span>
            </p>
          </div>
          {myRank && (
            <div className="text-right">
              <p className="text-xs text-text-secondary">Your rank</p>
              <p className="text-2xl font-bold text-accent">#{myRank}</p>
            </div>
          )}
        </div>

        {/* Opt-in Settings */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Join Leaderboard</p>
              <p className="text-sm text-text-secondary">Show your streak anonymously</p>
            </div>
            {/* Toggle */}
            <button
              role="switch"
              aria-checked={optIn}
              onClick={() => handleToggle(!optIn)}
              disabled={isPending}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                optIn ? 'bg-accent' : 'bg-border'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200',
                  optIn ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          {optIn && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary" htmlFor="displayName">
                Display name <span className="text-text-secondary font-normal">(optional, anonymous by default)</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="displayName"
                  type="text"
                  maxLength={30}
                  placeholder="Anonymous Quarker"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent/60"
                />
                <button
                  onClick={handleNameSave}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 disabled:opacity-50 transition-colors"
                >
                  {saved ? '✓ Saved' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard Table */}
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold">Top Streaks</h2>
          </div>

          {leaderboard.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <p className="text-4xl">🔥</p>
              <p className="font-semibold text-text-primary">No one&apos;s here yet!</p>
              <p className="text-sm text-text-secondary max-w-xs mx-auto">
                Be the first to join the leaderboard. Stay active every day to build your streak.
              </p>
            </div>
          ) : (
            <ul>
              {leaderboard.map((row, i) => {
                const rank = i + 1
                const isMe = row.id === myProfileId
                return (
                  <li
                    key={row.id}
                    className={cn(
                      'flex items-center gap-3 px-5 py-3 border-b border-border last:border-0 transition-colors',
                      isMe ? 'bg-blue-500/10 dark:bg-blue-400/10' : 'hover:bg-surface-secondary'
                    )}
                  >
                    {/* Rank */}
                    <span className="w-8 text-center text-sm font-bold shrink-0">
                      {MEDALS[rank] ?? rank}
                    </span>

                    {/* Name */}
                    <span className={cn('flex-1 text-sm font-medium truncate', isMe && 'text-blue-600 dark:text-blue-400')}>
                      {row.display_name}
                      {isMe && <span className="ml-1.5 text-xs text-blue-500 font-normal">(you)</span>}
                    </span>

                    {/* Current streak */}
                    <span className="text-sm font-semibold text-text-primary shrink-0">
                      🔥 {row.current_streak}d
                    </span>

                    {/* Longest streak */}
                    <span className="text-xs text-text-secondary shrink-0 hidden sm:block">
                      best&nbsp;{row.longest_streak}d
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
