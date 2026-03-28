'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Coffee, ChevronDown, ChevronUp, Trash2, Plus } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { cn } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CaffeineLog {
  id: string
  logged_at: string
  drink_type: string
  amount_ml?: number | null
  caffeine_mg: number
  notes?: string | null
}

interface WeekLog {
  logged_at: string
  caffeine_mg: number
}

interface Props {
  initialLogs: CaffeineLog[]
  weekLogs: WeekLog[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAILY_LIMIT_MG = 400

const DRINK_LABELS: Record<string, string> = {
  coffee: 'Coffee',
  espresso: 'Espresso',
  tea: 'Tea',
  green_tea: 'Green Tea',
  energy_drink: 'Energy Drink',
  soda: 'Soda',
  supplement: 'Supplement',
  other: 'Other',
}

const DRINK_ICONS: Record<string, string> = {
  coffee: '☕',
  espresso: '☕',
  tea: '🍵',
  green_tea: '🍵',
  energy_drink: '⚡',
  soda: '🥤',
  supplement: '💊',
  other: '☕',
}

const QUICK_ADD_PRESETS = [
  { label: 'Espresso', drink_type: 'espresso' as const, caffeine_mg: 63, icon: '☕' },
  { label: 'Coffee', drink_type: 'coffee' as const, caffeine_mg: 95, icon: '☕' },
  { label: 'Tea', drink_type: 'tea' as const, caffeine_mg: 47, icon: '🍵' },
  { label: 'Green Tea', drink_type: 'green_tea' as const, caffeine_mg: 28, icon: '🍵' },
  { label: 'Energy', drink_type: 'energy_drink' as const, caffeine_mg: 80, icon: '⚡' },
]

const DRINK_TYPES = [
  'coffee',
  'espresso',
  'tea',
  'green_tea',
  'energy_drink',
  'soda',
  'supplement',
  'other',
] as const

type DrinkType = (typeof DRINK_TYPES)[number]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mgBadgeClass(mg: number): string {
  if (mg < 200) return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
  if (mg < 400) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
  if (mg < 600) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
  return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function buildWeeklyData(weekLogs: WeekLog[]): { day: string; mg: number }[] {
  const days: { day: string; mg: number }[] = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const label = d.toLocaleDateString([], { weekday: 'short' })
    const dateStr = d.toISOString().slice(0, 10)
    const mg = weekLogs
      .filter((l) => l.logged_at.slice(0, 10) === dateStr)
      .reduce((s, l) => s + l.caffeine_mg, 0)
    days.push({ day: label, mg })
  }
  return days
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CaffeineClient({ initialLogs, weekLogs }: Props) {
  const [logs, setLogs] = useState<CaffeineLog[]>(initialLogs)
  const [weeklyLogs, setWeeklyLogs] = useState<WeekLog[]>(weekLogs)
  const [customOpen, setCustomOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  // Custom form state
  const [customDrink, setCustomDrink] = useState<DrinkType>('coffee')
  const [customMg, setCustomMg] = useState('')
  const [customMl, setCustomMl] = useState('')
  const [customNotes, setCustomNotes] = useState('')
  const [customTime, setCustomTime] = useState('')

  const totalMg = useMemo(
    () => logs.reduce((s, l) => s + l.caffeine_mg, 0),
    [logs]
  )

  const weeklyData = useMemo(() => buildWeeklyData(weeklyLogs), [weeklyLogs])

  const lastLog = logs.length > 0 ? logs[logs.length - 1] : null
  const cutoffWarning = useMemo(() => {
    if (!lastLog) return null
    const lastAt = new Date(lastLog.logged_at)
    const bedtime = new Date(lastAt)
    bedtime.setHours(22, 30, 0, 0)
    const hoursUntilBed = (bedtime.getTime() - lastAt.getTime()) / 3_600_000
    if (hoursUntilBed < 6 && hoursUntilBed >= 0) {
      return {
        time: formatTime(lastLog.logged_at),
        hours: Math.round(hoursUntilBed * 10) / 10,
      }
    }
    return null
  }, [lastLog])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  async function addLog(payload: {
    drink_type: DrinkType
    caffeine_mg: number
    amount_ml?: number
    notes?: string
    logged_at?: string
  }) {
    if (adding) return
    setAdding(true)
    try {
      const res = await fetch('/api/caffeine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed')
      const { log } = await res.json()
      setLogs((prev) => [...prev, log].sort((a, b) => a.logged_at.localeCompare(b.logged_at)))
      setWeeklyLogs((prev) => [
        ...prev,
        { logged_at: log.logged_at, caffeine_mg: log.caffeine_mg },
      ])
      showToast(`+${payload.caffeine_mg}mg added`)
    } catch {
      showToast('Failed to add — please retry')
    } finally {
      setAdding(false)
    }
  }

  async function deleteLog(id: string) {
    const prev = logs
    setLogs((l) => l.filter((e) => e.id !== id))
    try {
      const res = await fetch(`/api/caffeine?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      showToast('Entry removed')
    } catch {
      setLogs(prev)
      showToast('Failed to delete')
    }
  }

  function submitCustom(e: React.FormEvent) {
    e.preventDefault()
    const mg = parseInt(customMg, 10)
    const ml = customMl ? parseInt(customMl, 10) : undefined
    if (!mg || mg < 1 || mg > 1000) return
    addLog({
      drink_type: customDrink,
      caffeine_mg: mg,
      amount_ml: ml,
      notes: customNotes || undefined,
      logged_at: customTime ? new Date(customTime).toISOString() : undefined,
    })
    setCustomMg('')
    setCustomMl('')
    setCustomNotes('')
    setCustomTime('')
    setCustomOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 dark:bg-gray-700 text-white text-sm px-4 py-2 rounded-full shadow-lg pointer-events-none animate-fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xl">☕</span>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Caffeine Today</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-none mt-0.5">Daily limit: 400 mg</p>
              </div>
            </div>
          </div>
          {/* Total badge */}
          <span
            className={cn(
              'text-sm font-semibold px-3 py-1 rounded-full',
              mgBadgeClass(totalMg)
            )}
          >
            {totalMg}mg
          </span>
        </div>
        {/* Limit bar */}
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  totalMg < 200
                    ? 'bg-green-500'
                    : totalMg < 400
                    ? 'bg-yellow-400'
                    : totalMg < 600
                    ? 'bg-orange-500'
                    : 'bg-red-500'
                )}
                style={{ width: `${Math.min(100, (totalMg / DAILY_LIMIT_MG) * 100)}%` }}
              />
            </div>
            <span className="text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
              {DAILY_LIMIT_MG}mg limit
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5 pb-28">
        {/* Quick-add row */}
        <section>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Quick Add
          </p>
          <div className="grid grid-cols-5 gap-2">
            {QUICK_ADD_PRESETS.map((p) => (
              <button
                key={p.drink_type}
                onClick={() => addLog({ drink_type: p.drink_type, caffeine_mg: p.caffeine_mg })}
                disabled={adding}
                className="flex flex-col items-center gap-1 p-2.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-amber-400 dark:hover:border-amber-500 transition-colors disabled:opacity-50 active:scale-95"
              >
                <span className="text-xl leading-none">{p.icon}</span>
                <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 text-center leading-tight">
                  {p.label}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">{p.caffeine_mg}mg</span>
              </button>
            ))}
          </div>
        </section>

        {/* Custom log toggle */}
        <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => setCustomOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Log custom drink
            </span>
            {customOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {customOpen && (
            <form onSubmit={submitCustom} className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Drink type
                  </label>
                  <select
                    value={customDrink}
                    onChange={(e) => setCustomDrink(e.target.value as DrinkType)}
                    className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  >
                    {DRINK_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {DRINK_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Caffeine (mg) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    required
                    value={customMg}
                    onChange={(e) => setCustomMg(e.target.value)}
                    placeholder="e.g. 95"
                    className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Amount (ml, optional)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={2000}
                    value={customMl}
                    onChange={(e) => setCustomMl(e.target.value)}
                    placeholder="e.g. 240"
                    className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Time (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  maxLength={500}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="e.g. double shot latte"
                  className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={adding}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                Add Entry
              </button>
            </form>
          )}
        </section>

        {/* Cutoff insight */}
        {cutoffWarning && (
          <div className="flex items-start gap-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl px-4 py-3">
            <span className="text-orange-500 text-lg leading-none mt-0.5">⚠️</span>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              Last caffeine at <strong>{cutoffWarning.time}</strong> —{' '}
              only <strong>{cutoffWarning.hours}h</strong> before typical bedtime (10:30 PM).
              Caffeine may affect your sleep.
            </p>
          </div>
        )}

        {/* Today's log */}
        <section>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Today&apos;s Log
          </p>
          {logs.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl text-center py-12">
              <span className="text-4xl mb-3 block">☕</span>
              <p className="font-medium text-text-primary">No caffeine logged today</p>
              <p className="text-sm text-text-secondary mt-1">Use the quick-add buttons above</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span className="text-xl leading-none w-7 text-center flex-shrink-0">
                    {DRINK_ICONS[log.drink_type] ?? '☕'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {DRINK_LABELS[log.drink_type] ?? log.drink_type}
                      {log.notes && (
                        <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">
                          · {log.notes}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {formatTime(log.logged_at)}
                      {log.amount_ml ? ` · ${log.amount_ml}ml` : ''}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0',
                      mgBadgeClass(log.caffeine_mg)
                    )}
                  >
                    {log.caffeine_mg}mg
                  </span>
                  <button
                    onClick={() => deleteLog(log.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {/* Running total */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total today</span>
                <span
                  className={cn(
                    'text-sm font-bold px-2.5 py-0.5 rounded-full',
                    mgBadgeClass(totalMg)
                  )}
                >
                  {totalMg}mg
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Weekly chart */}
        <section>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Last 7 Days
          </p>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-4">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  tickLine={false}
                  axisLine={false}
                  className="text-gray-400 dark:text-gray-500"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'currentColor' }}
                  tickLine={false}
                  axisLine={false}
                  className="text-gray-400 dark:text-gray-500"
                />
                <Tooltip
                  formatter={(v: number) => [`${v}mg`, 'Caffeine']}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    backgroundColor: 'var(--background)',
                  }}
                />
                <ReferenceLine
                  y={DAILY_LIMIT_MG}
                  stroke="#f97316"
                  strokeDasharray="4 3"
                  label={{ value: '400mg', position: 'insideTopRight', fontSize: 10, fill: '#f97316' }}
                />
                <Bar
                  dataKey="mg"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-1">
              Dashed line = 400mg recommended daily limit
            </p>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
