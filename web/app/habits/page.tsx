'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, CheckCircle2, Circle, Flame, Trophy, X, ChevronRight, Star } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import {
  HABIT_TEMPLATES,
  ACHIEVEMENTS,
  type Habit,
  type HabitStreak,
  type UserLevel,
} from '@/lib/habits'

const CATEGORIES = ['morning', 'fitness', 'nutrition', 'sleep', 'mental', 'social', 'custom'] as const
type Category = typeof CATEGORIES[number]

const CATEGORY_LABELS: Record<Category, string> = {
  morning: '🌅 Morning', fitness: '💪 Fitness', nutrition: '🥗 Nutrition',
  sleep: '😴 Sleep', mental: '🧠 Mental', social: '👥 Social', custom: '✨ Custom',
}

const TIME_SECTIONS = ['morning', 'afternoon', 'evening', 'anytime'] as const
const TIME_LABELS: Record<string, string> = {
  morning: '🌅 Morning', afternoon: '☀️ Afternoon', evening: '🌙 Evening', anytime: '⏰ Anytime',
}

interface ApiResponse {
  habits: Habit[]
  todayLogs: { habit_id: string; skipped: boolean; completed_at: string }[]
  streaks: Record<string, HabitStreak>
  level: UserLevel
  achievements: { achievement_id: string; unlocked_at: string }[]
}

function XPBar({ level }: { level: UserLevel }) {
  const pct = Math.min(100, Math.round(((level.total_xp - (level.total_xp - level.xp_to_next < 0 ? 0 : level.total_xp - level.xp_to_next)) / (level.xp_to_next + (level.total_xp - level.xp_to_next < 0 ? 0 : level.total_xp - level.xp_to_next))) * 100))
  const xpInLevel = level.total_xp % (level.xp_to_next || 1)
  const xpNeeded = level.xp_to_next
  return (
    <div className="bg-surface rounded-2xl border border-border p-4 flex items-center gap-3">
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-2xl">
        ⚡
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-text-primary">Lv {level.level} · {level.level_name}</span>
          <span className="text-xs text-text-secondary">{level.total_xp} XP</span>
        </div>
        <div className="w-full h-2 bg-surface-secondary rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.round((xpInLevel / (xpInLevel + xpNeeded)) * 100))}%` }} />
        </div>
        <p className="text-[10px] text-text-secondary mt-1">{xpNeeded} XP to next level</p>
      </div>
    </div>
  )
}

function HabitCard({
  habit,
  streak,
  isComplete,
  isSkipped,
  onComplete,
  onSkip,
}: {
  habit: Habit
  streak: HabitStreak
  isComplete: boolean
  isSkipped: boolean
  onComplete: () => void
  onSkip: () => void
}) {
  return (
    <div className={`bg-surface rounded-2xl border transition-all duration-200 p-4 flex items-center gap-3 ${isComplete ? 'border-green-500/40 bg-green-500/5' : 'border-border'}`}>
      <button
        onClick={isComplete ? undefined : onComplete}
        className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${isComplete ? 'bg-green-500 border-green-500 text-white' : 'border-border text-text-secondary hover:border-accent hover:text-accent'}`}
      >
        {isComplete ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-xl">{habit.emoji}</span>}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${isComplete ? 'text-green-400 line-through decoration-green-400/50' : 'text-text-primary'}`}>{habit.name}</p>
        {habit.tiny_version && !isComplete && (
          <p className="text-[11px] text-text-secondary truncate">Tiny: {habit.tiny_version}</p>
        )}
        {habit.anchor && !isComplete && (
          <p className="text-[11px] text-accent/70 truncate">📎 {habit.anchor}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {streak.current > 0 && (
          <span className="flex items-center gap-0.5 text-xs font-semibold text-orange-400">
            <Flame className="w-3.5 h-3.5" />{streak.current}
          </span>
        )}
        {!isComplete && !isSkipped && (
          <button onClick={onSkip} className="text-[10px] text-text-secondary/50 hover:text-text-secondary px-1.5 py-1 rounded-lg hover:bg-surface-secondary transition-colors">Skip</button>
        )}
        {isSkipped && <span className="text-[10px] text-text-secondary/50">Skipped</span>}
      </div>
    </div>
  )
}

export default function HabitsPage() {
  const [tab, setTab] = useState<'today' | 'manage' | 'progress'>('today')
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState<string | null>(null)
  const [newAchievements, setNewAchievements] = useState<typeof ACHIEVEMENTS[number][]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [addCategory, setAddCategory] = useState<Category>('morning')
  const [customName, setCustomName] = useState('')
  const [customEmoji, setCustomEmoji] = useState('✅')
  const [customFreq, setCustomFreq] = useState<'daily' | 'weekdays' | 'custom'>('daily')
  const [customTod, setCustomTod] = useState<'morning' | 'afternoon' | 'evening' | 'anytime'>('anytime')
  const [customAnchor, setCustomAnchor] = useState('')
  const [addMode, setAddMode] = useState<'template' | 'custom'>('template')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/habits')
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleComplete = async (habitId: string, skipped = false) => {
    setCompleting(habitId)
    const res = await fetch(`/api/habits/${habitId}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skipped }),
    })
    if (res.ok) {
      const json = await res.json()
      if (json.new_achievements?.length) {
        setNewAchievements(json.new_achievements)
        setTimeout(() => setNewAchievements([]), 4000)
      }
      await load()
    }
    setCompleting(null)
  }

  const handleArchive = async (habitId: string) => {
    await fetch('/api/habits', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: habitId }),
    })
    await load()
  }

  const handleAddTemplate = async (tpl: typeof HABIT_TEMPLATES[number]) => {
    setSaving(true)
    await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: tpl.name,
        emoji: tpl.emoji,
        category: tpl.category,
        frequency: tpl.default_frequency === 'weekly' ? 'custom' : tpl.default_frequency,
        time_of_day: tpl.category === 'morning' ? 'morning' : tpl.category === 'sleep' ? 'evening' : 'anytime',
        anchor: tpl.anchor_suggestion,
        tiny_version: tpl.tiny_version,
        target_streak: 66,
        xp_per_completion: 10,
      }),
    })
    setSaving(false)
    setShowAddModal(false)
    await load()
  }

  const handleAddCustom = async () => {
    if (!customName.trim()) return
    setSaving(true)
    await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: customName.trim(),
        emoji: customEmoji,
        category: addCategory,
        frequency: customFreq,
        time_of_day: customTod,
        anchor: customAnchor || null,
        tiny_version: null,
        target_streak: 66,
        xp_per_completion: 10,
      }),
    })
    setSaving(false)
    setShowAddModal(false)
    setCustomName('')
    setCustomEmoji('✅')
    await load()
  }

  const todayStr = new Date().toISOString().slice(0, 10)
  const today = data ? [...data.habits].filter(h => h.is_active) : []
  const todayLogMap: Record<string, { skipped: boolean }> = {}
  if (data) {
    for (const l of data.todayLogs) {
      todayLogMap[l.habit_id] = { skipped: l.skipped }
    }
  }

  const doneToday = today.filter(h => todayLogMap[h.id] && !todayLogMap[h.id].skipped).length
  const totalToday = today.length

  // Group by time_of_day
  const grouped: Record<string, Habit[]> = { morning: [], afternoon: [], evening: [], anytime: [] }
  for (const h of today) {
    const tod = (h.time_of_day as string) || 'anytime'
    if (grouped[tod]) grouped[tod].push(h)
    else grouped.anytime.push(h)
  }

  // Weekly trend data for recharts
  const weeklyTrend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000)
    const ds = d.toISOString().slice(0, 10)
    const dayLogs = data?.todayLogs ?? []
    const completed = (data?.habits ?? []).filter(h => {
      const log = (data?.todayLogs ?? []).find(l => l.habit_id === h.id && (l as any).completed_at === ds)
      return log && !log.skipped
    }).length
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3),
      completed,
    }
  })

  // Sorted streaks for leaderboard
  const streakLeaderboard = [...today]
    .sort((a, b) => (data?.streaks[b.id]?.current ?? 0) - (data?.streaks[a.id]?.current ?? 0))
    .slice(0, 10)

  const unlockedAchievementIds = new Set((data?.achievements ?? []).map(a => a.achievement_id))

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Achievement toast */}
      {newAchievements.length > 0 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
          {newAchievements.map(a => (
            <div key={a.id} className="bg-yellow-400 text-black px-4 py-2 rounded-2xl text-sm font-semibold shadow-xl flex items-center gap-2 animate-bounce">
              <span className="text-xl">{a.emoji}</span>
              <span>Achievement: {a.name}!</span>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-xl hover:bg-surface-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <h1 className="text-lg font-bold text-text-primary flex-1">Habit Tracker</h1>
          {tab === 'manage' && (
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-white text-sm font-semibold">
              <Plus className="w-4 h-4" /> Add
            </button>
          )}
        </div>

        {/* Tab bar */}
        <div className="max-w-2xl mx-auto px-4 pb-2 flex gap-1">
          {(['today', 'manage', 'progress'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'}`}
            >
              {t === 'today' ? '📅 Today' : t === 'manage' ? '⚙️ Manage' : '📊 Progress'}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* ── TODAY TAB ── */}
        {tab === 'today' && (
          <div className="space-y-4">
            {/* XP bar */}
            {data?.level && <XPBar level={data.level} />}

            {/* Daily progress */}
            <div className="bg-surface rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-text-primary">Today's Progress</span>
                <span className="text-sm font-bold text-accent">{doneToday}/{totalToday} {doneToday === totalToday && totalToday > 0 ? '🔥' : ''}</span>
              </div>
              <div className="w-full h-2.5 bg-surface-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: totalToday > 0 ? `${Math.round((doneToday / totalToday) * 100)}%` : '0%' }}
                />
              </div>
            </div>

            {/* Time sections */}
            {today.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">✨</p>
                <p className="text-text-secondary text-sm mb-4">No habits yet. Start building your routine!</p>
                <button onClick={() => { setTab('manage'); setShowAddModal(true) }} className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-semibold">
                  Add Your First Habit
                </button>
              </div>
            ) : (
              TIME_SECTIONS.map(section => {
                const habits = grouped[section]
                if (!habits.length) return null
                return (
                  <div key={section} className="space-y-2">
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">{TIME_LABELS[section]}</p>
                    {habits.map(habit => (
                      <HabitCard
                        key={habit.id}
                        habit={habit}
                        streak={data?.streaks[habit.id] ?? { current: 0, best: 0, total_completions: 0, completion_rate_7d: 0, completion_rate_30d: 0 }}
                        isComplete={!!(todayLogMap[habit.id] && !todayLogMap[habit.id].skipped)}
                        isSkipped={!!(todayLogMap[habit.id]?.skipped)}
                        onComplete={() => handleComplete(habit.id)}
                        onSkip={() => handleComplete(habit.id, true)}
                      />
                    ))}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ── MANAGE TAB ── */}
        {tab === 'manage' && (
          <div className="space-y-4">
            {today.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-text-secondary text-sm mb-4">No habits yet.</p>
                <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-semibold">
                  Add Habit
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {today.map(habit => {
                  const streak = data?.streaks[habit.id]
                  return (
                    <div key={habit.id} className="bg-surface rounded-2xl border border-border p-4 flex items-center gap-3">
                      <span className="text-2xl">{habit.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary">{habit.name}</p>
                        <p className="text-xs text-text-secondary capitalize">{habit.category} · {habit.frequency} · {habit.time_of_day}</p>
                        {streak && streak.current > 0 && (
                          <p className="text-xs text-orange-400 flex items-center gap-0.5 mt-0.5">
                            <Flame className="w-3 h-3" />{streak.current} day streak
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleArchive(habit.id)}
                        className="p-2 rounded-xl text-text-secondary/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        aria-label="Archive habit"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── PROGRESS TAB ── */}
        {tab === 'progress' && (
          <div className="space-y-4">
            {/* XP + Level */}
            {data?.level && <XPBar level={data.level} />}

            {/* Weekly trend chart */}
            <div className="bg-surface rounded-2xl border border-border p-4">
              <p className="text-sm font-semibold text-text-primary mb-3">Weekly Completions</p>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} width={20} />
                  <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                  <Line type="monotone" dataKey="completed" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Streak leaderboard */}
            {streakLeaderboard.length > 0 && (
              <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
                <p className="text-sm font-semibold text-text-primary">🏆 Streak Leaderboard</p>
                {streakLeaderboard.map((habit, i) => {
                  const streak = data?.streaks[habit.id]
                  return (
                    <div key={habit.id} className="flex items-center gap-3">
                      <span className="text-text-secondary text-sm w-5 text-right">{i + 1}</span>
                      <span className="text-lg">{habit.emoji}</span>
                      <span className="flex-1 text-sm text-text-primary">{habit.name}</span>
                      <span className="flex items-center gap-1 text-sm font-semibold text-orange-400">
                        <Flame className="w-3.5 h-3.5" />{streak?.current ?? 0}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* 7-day heatmap */}
            {today.length > 0 && (
              <div className="bg-surface rounded-2xl border border-border p-4">
                <p className="text-sm font-semibold text-text-primary mb-3">7-Day Completion</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className="text-left text-text-secondary font-medium pb-2 pr-2 min-w-[100px]">Habit</th>
                        {Array.from({ length: 7 }, (_, i) => {
                          const d = new Date(Date.now() - (6 - i) * 86400000)
                          const isToday = d.toISOString().slice(0, 10) === todayStr
                          return (
                            <th key={i} className={`text-center font-medium pb-2 w-9 ${isToday ? 'text-accent' : 'text-text-secondary'}`}>
                              {d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)}
                            </th>
                          )
                        })}
                        <th className="text-right text-text-secondary font-medium pb-2 pl-2">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {today.map(habit => {
                        const streak = data?.streaks[habit.id]
                        return (
                          <tr key={habit.id}>
                            <td className="text-text-primary py-1.5 pr-2 truncate max-w-[100px]">{habit.emoji} {habit.name}</td>
                            {Array.from({ length: 7 }, (_, i) => {
                              const d = new Date(Date.now() - (6 - i) * 86400000)
                              const ds = d.toISOString().slice(0, 10)
                              const log = (data?.todayLogs as any[])?.find((l: any) => l.habit_id === habit.id && l.completed_at === ds)
                              const done = log && !log.skipped
                              const skipped = log?.skipped
                              return (
                                <td key={ds} className="text-center py-1.5">
                                  <span className={`inline-block w-6 h-6 rounded-md ${done ? 'bg-green-500/80' : skipped ? 'bg-yellow-500/30' : 'bg-surface-secondary'}`} />
                                </td>
                              )
                            })}
                            <td className="text-right text-text-secondary py-1.5 pl-2">
                              {streak ? `${Math.round(streak.completion_rate_7d)}%` : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Achievements */}
            <div className="bg-surface rounded-2xl border border-border p-4">
              <p className="text-sm font-semibold text-text-primary mb-3">🏅 Achievements</p>
              <div className="grid grid-cols-3 gap-2">
                {ACHIEVEMENTS.map(a => {
                  const unlocked = unlockedAchievementIds.has(a.id)
                  return (
                    <div
                      key={a.id}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all ${unlocked ? 'bg-yellow-400/10 border-yellow-400/30' : 'bg-surface-secondary border-border opacity-40'}`}
                    >
                      <span className={`text-2xl ${unlocked ? '' : 'grayscale'}`}>{a.emoji}</span>
                      <span className="text-[10px] font-semibold text-text-primary leading-tight">{a.name}</span>
                      {unlocked && <Star className="w-3 h-3 text-yellow-400" />}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Habit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end">
          <div className="bg-background w-full max-w-2xl mx-auto rounded-t-3xl border-t border-border max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background px-4 pt-4 pb-3 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-primary">Add Habit</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl hover:bg-surface-secondary">
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            {/* Mode switcher */}
            <div className="px-4 py-3 flex gap-2">
              <button onClick={() => setAddMode('template')} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${addMode === 'template' ? 'bg-accent text-white' : 'bg-surface-secondary text-text-secondary'}`}>
                Browse Templates
              </button>
              <button onClick={() => setAddMode('custom')} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${addMode === 'custom' ? 'bg-accent text-white' : 'bg-surface-secondary text-text-secondary'}`}>
                Custom
              </button>
            </div>

            <div className="px-4 pb-8">
              {addMode === 'template' ? (
                <div className="space-y-4">
                  {/* Category filter */}
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setAddCategory(cat)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${addCategory === cat ? 'bg-accent text-white' : 'bg-surface-secondary text-text-secondary hover:bg-surface'}`}
                      >
                        {CATEGORY_LABELS[cat]}
                      </button>
                    ))}
                  </div>

                  {/* Templates grid */}
                  <div className="grid grid-cols-1 gap-2">
                    {HABIT_TEMPLATES.filter(t => t.category === addCategory).map(tpl => (
                      <button
                        key={tpl.id}
                        onClick={() => handleAddTemplate(tpl)}
                        disabled={saving}
                        className="text-left bg-surface border border-border rounded-2xl p-3 hover:border-accent/50 hover:bg-accent/5 transition-all flex items-start gap-3"
                      >
                        <span className="text-2xl flex-shrink-0">{tpl.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text-primary">{tpl.name}</p>
                          <p className="text-[11px] text-text-secondary mt-0.5">{tpl.tiny_version}</p>
                          <p className="text-[10px] text-accent/70 mt-1 italic">{tpl.science_note}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-text-secondary/40 flex-shrink-0 mt-1" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Emoji */}
                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-widest block mb-2">Emoji</label>
                    <div className="flex gap-2 flex-wrap">
                      {['✅', '💧', '🏃', '📚', '🧘', '🥗', '😴', '💊', '🚶', '✍️', '🎯', '💪', '🌿', '☀️', '🍎', '🚿', '🫀', '🧠', '📵', '🌙'].map(e => (
                        <button
                          key={e}
                          onClick={() => setCustomEmoji(e)}
                          className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${customEmoji === e ? 'bg-accent/20 border-2 border-accent' : 'bg-surface-secondary'}`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-widest block mb-1.5">Name</label>
                    <input
                      value={customName}
                      onChange={e => setCustomName(e.target.value)}
                      placeholder="e.g. Morning walk"
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-widest block mb-1.5">Category</label>
                    <div className="grid grid-cols-3 gap-2">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setAddCategory(cat)}
                          className={`py-2 rounded-xl text-xs font-semibold transition-all ${addCategory === cat ? 'bg-accent text-white' : 'bg-surface-secondary text-text-secondary'}`}
                        >
                          {CATEGORY_LABELS[cat]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Frequency */}
                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-widest block mb-1.5">Frequency</label>
                    <div className="flex gap-2">
                      {(['daily', 'weekdays', 'custom'] as const).map(f => (
                        <button
                          key={f}
                          onClick={() => setCustomFreq(f)}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all capitalize ${customFreq === f ? 'bg-accent text-white' : 'bg-surface-secondary text-text-secondary'}`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time of day */}
                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-widest block mb-1.5">Time of Day</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['morning', 'afternoon', 'evening', 'anytime'] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setCustomTod(t)}
                          className={`py-2 rounded-xl text-xs font-semibold transition-all capitalize ${customTod === t ? 'bg-accent text-white' : 'bg-surface-secondary text-text-secondary'}`}
                        >
                          {TIME_LABELS[t]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Anchor */}
                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-widest block mb-1.5">Anchor (optional)</label>
                    <input
                      value={customAnchor}
                      onChange={e => setCustomAnchor(e.target.value)}
                      placeholder='e.g. "After making coffee"'
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent"
                    />
                    <p className="text-[10px] text-text-secondary mt-1">Anchoring to an existing routine helps habits stick (Fogg 2020)</p>
                  </div>

                  <button
                    onClick={handleAddCustom}
                    disabled={saving || !customName.trim()}
                    className="w-full py-3 bg-accent text-white rounded-xl font-semibold text-sm disabled:opacity-50 transition-opacity"
                  >
                    {saving ? 'Saving…' : 'Add Habit'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
