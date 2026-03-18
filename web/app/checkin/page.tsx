'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Edit3 } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'

export const metadata = undefined // client component

interface Checkin {
  id: string
  date: string
  energy: number | null
  mood: number | null
  stress: number | null
  notes: string | null
}

const ENERGY_EMOJIS = ['', '😴', '😑', '😐', '🙂', '😄']
const MOOD_EMOJIS   = ['', '😞', '😕', '😐', '🙂', '😁']
const STRESS_EMOJIS = ['', '😌', '🙂', '😐', '😟', '😰']

const ENERGY_LABELS = ['', 'Very Low', 'Low', 'Moderate', 'Good', 'Great']
const MOOD_LABELS   = ['', 'Very Low', 'Low', 'Neutral', 'Good', 'Excellent']
const STRESS_LABELS = ['', 'None', 'Mild', 'Moderate', 'High', 'Very High']

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

function EmojiSelector({
  label,
  emojis,
  labelNames,
  value,
  onChange,
  accentColor,
}: {
  label: string
  emojis: string[]
  labelNames: string[]
  value: number | null
  onChange: (v: number) => void
  accentColor: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {value !== null && (
          <span className="text-xs text-text-secondary">{labelNames[value]}</span>
        )}
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`flex-1 py-2 rounded-xl text-2xl transition-all ${
              value === v
                ? `${accentColor} ring-2 ring-offset-2 ring-offset-background scale-110`
                : 'bg-surface border border-border hover:bg-surface-secondary'
            }`}
          >
            {emojis[v]}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function CheckinPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)

  const [energy, setEnergy] = useState<number | null>(null)
  const [mood, setMood] = useState<number | null>(null)
  const [stress, setStress] = useState<number | null>(null)
  const [notes, setNotes] = useState('')

  const [todayCheckin, setTodayCheckin] = useState<Checkin | null>(null)
  const [history, setHistory] = useState<Checkin[]>([])

  const today = new Date().toISOString().slice(0, 10)

  const load = useCallback(async () => {
    const res = await fetch('/api/checkin?days=30')
    if (res.ok) {
      const { today: td, history: hist } = await res.json()
      setTodayCheckin(td)
      setHistory(hist ?? [])
      if (td) {
        setEnergy(td.energy)
        setMood(td.mood)
        setStress(td.stress)
        setNotes(td.notes ?? '')
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (energy === null && mood === null && stress === null) return
    setSaving(true)
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ energy, mood, stress, notes: notes || null }),
    })
    if (res.ok) {
      const { checkin } = await res.json()
      setTodayCheckin(checkin)
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      await load()
    }
    setSaving(false)
  }

  // Prepare 30-day chart data (filled with nulls for missing days)
  const chartData = (() => {
    const byDate = new Map(history.map((c) => [c.date, c]))
    const result = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const dateStr = d.toISOString().slice(0, 10)
      const c = byDate.get(dateStr)
      result.push({
        date: dateStr,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        energy: c?.energy ?? null,
        mood: c?.mood ?? null,
        stress: c?.stress ?? null,
      })
    }
    return result
  })()

  const hasToday = todayCheckin !== null
  const showForm = !hasToday || editing

  // Averages from last 30 days
  const avgOf = (key: 'energy' | 'mood' | 'stress') => {
    const vals = history.map((c) => c[key]).filter((v): v is number => v !== null)
    if (vals.length === 0) return null
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Daily Check-in</h1>
            <p className="text-sm text-text-secondary">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
          {hasToday && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* Check-in form / today's summary */}
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-5">
          {saved && (
            <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Check-in saved
            </div>
          )}

          {hasToday && !editing ? (
            // Completed view
            <div className="space-y-4">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Today&apos;s Check-in</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Energy', emojis: ENERGY_EMOJIS, value: todayCheckin.energy, color: 'text-yellow-400' },
                  { label: 'Mood', emojis: MOOD_EMOJIS, value: todayCheckin.mood, color: 'text-blue-400' },
                  { label: 'Stress', emojis: STRESS_EMOJIS, value: todayCheckin.stress, color: 'text-orange-400' },
                ].map(({ label, emojis, value, color }) => (
                  <div key={label} className="text-center">
                    <p className="text-xs text-text-secondary mb-1">{label}</p>
                    <span className="text-3xl">{value !== null ? emojis[value] : '—'}</span>
                    <p className={`text-xs font-medium mt-1 ${value !== null ? color : 'text-text-secondary'}`}>
                      {value !== null ? value + '/5' : 'Not set'}
                    </p>
                  </div>
                ))}
              </div>
              {todayCheckin.notes && (
                <p className="text-sm text-text-secondary bg-surface-secondary rounded-lg px-3 py-2 italic">
                  &ldquo;{todayCheckin.notes}&rdquo;
                </p>
              )}
            </div>
          ) : (
            // Edit form
            <div className="space-y-5">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
                {editing ? 'Update Today' : 'How are you feeling today?'}
              </p>

              {loading ? (
                <div className="h-32 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <EmojiSelector
                    label="Energy level"
                    emojis={ENERGY_EMOJIS}
                    labelNames={ENERGY_LABELS}
                    value={energy}
                    onChange={setEnergy}
                    accentColor="bg-yellow-400/20 ring-yellow-400"
                  />
                  <EmojiSelector
                    label="Mood"
                    emojis={MOOD_EMOJIS}
                    labelNames={MOOD_LABELS}
                    value={mood}
                    onChange={setMood}
                    accentColor="bg-blue-400/20 ring-blue-400"
                  />
                  <EmojiSelector
                    label="Stress level"
                    emojis={STRESS_EMOJIS}
                    labelNames={STRESS_LABELS}
                    value={stress}
                    onChange={setStress}
                    accentColor="bg-orange-400/20 ring-orange-400"
                  />

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-text-primary">Notes (optional)</p>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="How's your body feeling? Anything unusual?"
                      rows={2}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    {editing && (
                      <button
                        onClick={() => { setEditing(false); setEnergy(todayCheckin?.energy ?? null); setMood(todayCheckin?.mood ?? null); setStress(todayCheckin?.stress ?? null); setNotes(todayCheckin?.notes ?? '') }}
                        className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={handleSave}
                      disabled={saving || (energy === null && mood === null && stress === null)}
                      className="flex-1 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-40"
                    >
                      {saving ? 'Saving…' : editing ? 'Update' : 'Save Check-in'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 30-day averages */}
        {history.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'energy' as const, label: 'Avg Energy', emoji: '⚡', color: 'text-yellow-400' },
              { key: 'mood' as const, label: 'Avg Mood', emoji: '😊', color: 'text-blue-400' },
              { key: 'stress' as const, label: 'Avg Stress', emoji: '🧘', color: 'text-orange-400' },
            ].map(({ key, label, emoji, color }) => {
              const avg = avgOf(key)
              return (
                <div key={key} className="bg-surface rounded-xl border border-border p-4 text-center">
                  <p className="text-xs text-text-secondary mb-1">{label}</p>
                  <p className={`text-2xl font-bold ${color}`}>{avg !== null ? avg : '—'}</p>
                  <p className="text-xs text-text-secondary opacity-60">{emoji} /5 · 30d</p>
                </div>
              )
            })}
          </div>
        )}

        {/* 30-day trend chart */}
        {history.length >= 3 && (
          <div className="bg-surface rounded-2xl border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">30-Day Trends</h2>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                  interval={6}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: 12 }}
                  labelStyle={{ color: 'var(--text-secondary)' }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Area type="monotone" dataKey="energy" name="Energy" stroke="#facc15" fill="#facc1520" strokeWidth={2} dot={false} connectNulls />
                <Area type="monotone" dataKey="mood" name="Mood" stroke="#60a5fa" fill="#60a5fa20" strokeWidth={2} dot={false} connectNulls />
                <Area type="monotone" dataKey="stress" name="Stress" stroke="#fb923c" fill="#fb923c20" strokeWidth={2} dot={false} connectNulls />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent check-in history */}
        {history.length > 0 && (
          <div className="bg-surface rounded-2xl border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">Recent Check-ins</h2>
            <div className="space-y-3">
              {history.slice(0, 14).map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <div className="w-24 shrink-0">
                    <p className="text-xs text-text-secondary">{fmtDate(c.date)}</p>
                  </div>
                  <div className="flex gap-3 flex-1">
                    <span className="text-base" title={`Energy: ${c.energy}`}>{c.energy !== null ? ENERGY_EMOJIS[c.energy] : '—'}</span>
                    <span className="text-base" title={`Mood: ${c.mood}`}>{c.mood !== null ? MOOD_EMOJIS[c.mood] : '—'}</span>
                    <span className="text-base" title={`Stress: ${c.stress}`}>{c.stress !== null ? STRESS_EMOJIS[c.stress] : '—'}</span>
                  </div>
                  {c.notes && (
                    <p className="text-xs text-text-secondary truncate max-w-[120px] opacity-70 italic">{c.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {history.length === 0 && !loading && (
          <div className="text-center py-12 text-text-secondary">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm font-medium text-text-primary mb-1">No check-ins yet</p>
            <p className="text-xs">Your 30-day trends will appear here once you start checking in daily.</p>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
