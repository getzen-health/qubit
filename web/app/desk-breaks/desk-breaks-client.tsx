'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { BottomNav } from '@/components/bottom-nav'
import { cn } from '@/lib/utils'

// ─── Types & constants ────────────────────────────────────────────────────────

const INTERVAL_OPTIONS = [30, 45, 60, 90] as const
type Interval = (typeof INTERVAL_OPTIONS)[number]

const BREAK_SUGGESTIONS = [
  { icon: '🚶', title: 'Walk', desc: 'Walk for 2 minutes' },
  { icon: '🧘', title: 'Stretch', desc: 'Stretch for 1 minute' },
  { icon: '💧', title: 'Hydrate', desc: 'Drink some water' },
  { icon: '👁️', title: '20-20-20', desc: 'Look 20ft away for 20 seconds' },
]

const LS_LAST_BREAK = 'kq_last_break'
const LS_BREAKS_TODAY = 'kq_breaks_today_v2'
const LS_INTERVAL = 'kq_break_interval'
const LS_START_TIME = 'kq_session_start'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

interface BreakRecord {
  date: string
  breaks: number
}

function loadBreaksToday(): number {
  try {
    const raw = localStorage.getItem(LS_BREAKS_TODAY)
    if (!raw) return 0
    const rec = JSON.parse(raw) as BreakRecord
    return rec.date === todayKey() ? rec.breaks : 0
  } catch {
    return 0
  }
}

function saveBreaksToday(count: number) {
  localStorage.setItem(LS_BREAKS_TODAY, JSON.stringify({ date: todayKey(), breaks: count }))
}

function fmtDuration(secs: number): string {
  if (secs < 0) secs = 0
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function fmtHm(secs: number): string {
  if (secs < 60) return `${secs}s`
  const m = Math.floor(secs / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem ? `${h}h ${rem}m` : `${h}h`
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DeskBreaksClient() {
  const [interval, setInterval_] = useState<Interval>(60)
  const [secondsLeft, setSecondsLeft] = useState(60 * 60)
  const [breaksDue, setBreaksDue] = useState(false)
  const [breaksToday, setBreaksToday] = useState(0)
  const [totalSitting, setTotalSitting] = useState(0)
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>('default')
  const [lastBreakAgo, setLastBreakAgo] = useState<number | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const notifiedRef = useRef(false)

  // Load persisted state on mount
  useEffect(() => {
    const savedInterval = parseInt(localStorage.getItem(LS_INTERVAL) ?? '60') as Interval
    if (INTERVAL_OPTIONS.includes(savedInterval)) setInterval_(savedInterval)

    const savedBreaks = loadBreaksToday()
    setBreaksToday(savedBreaks)

    if (typeof Notification !== 'undefined') {
      setNotifPerm(Notification.permission)
    }

    // Restore session start time for total sitting calc
    const startStr = localStorage.getItem(LS_START_TIME)
    if (!startStr) {
      localStorage.setItem(LS_START_TIME, Date.now().toString())
    }
  }, [])

  // Tick every second
  useEffect(() => {
    tickRef.current = setInterval(() => {
      const lastBreakStr = localStorage.getItem(LS_LAST_BREAK)
      const startStr = localStorage.getItem(LS_START_TIME)
      const intervalSecs = (parseInt(localStorage.getItem(LS_INTERVAL) ?? '60')) * 60

      const now = Date.now()

      // Compute seconds since last break (or since session start)
      const lastBreakMs = lastBreakStr ? parseInt(lastBreakStr) : (startStr ? parseInt(startStr) : now)
      const elapsedSecs = Math.floor((now - lastBreakMs) / 1000)
      const remaining = Math.max(0, intervalSecs - elapsedSecs)

      setSecondsLeft(remaining)
      setLastBreakAgo(elapsedSecs)

      // Total sitting time since session start
      if (startStr) {
        setTotalSitting(Math.floor((now - parseInt(startStr)) / 1000))
      }

      // Break due?
      const due = remaining === 0
      setBreaksDue(due)

      // Fire notification once per break cycle
      if (due && !notifiedRef.current) {
        notifiedRef.current = true
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('🪑 Time for a desk break!', {
            body: 'You\'ve been sitting for a while. Stand up and move!',
            icon: '/favicon.ico',
          })
        }
      } else if (!due) {
        notifiedRef.current = false
      }
    }, 1000)

    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  }, [])

  const handleInterval = useCallback((val: Interval) => {
    setInterval_(val)
    localStorage.setItem(LS_INTERVAL, val.toString())
  }, [])

  const takeBreak = useCallback(() => {
    localStorage.setItem(LS_LAST_BREAK, Date.now().toString())
    notifiedRef.current = false
    setBreaksDue(false)
    const updated = loadBreaksToday() + 1
    saveBreaksToday(updated)
    setBreaksToday(updated)
  }, [])

  const requestNotifPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return
    const perm = await Notification.requestPermission()
    setNotifPerm(perm)
  }, [])

  const intervalSecs = interval * 60
  const progress = intervalSecs > 0 ? Math.min(1, (intervalSecs - secondsLeft) / intervalSecs) : 0
  const avgBreakInterval = breaksToday > 0 ? Math.floor(totalSitting / breaksToday) : null

  return (
    <div className="min-h-screen bg-background text-text-primary pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>🪑</span> Desk Breaks
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">Stand up, stretch, and stay healthy.</p>
        </div>

        {/* Timer card */}
        <div className={cn(
          'rounded-2xl border p-5 text-center transition-colors',
          breaksDue ? 'bg-accent/10 border-accent/40' : 'bg-surface border-border'
        )}>
          {breaksDue ? (
            <>
              <p className="text-4xl mb-1">🏃</p>
              <p className="text-lg font-bold text-accent">Break time!</p>
              <p className="text-sm text-text-secondary mt-1">You&apos;ve been sitting for {fmtHm(lastBreakAgo ?? 0)}</p>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Next break in</p>
              <p className="text-5xl font-mono font-bold tabular-nums">{fmtDuration(secondsLeft)}</p>
              {lastBreakAgo !== null && lastBreakAgo > 60 && (
                <p className="text-xs text-text-secondary mt-2">Sitting for {fmtHm(lastBreakAgo)}</p>
              )}
            </>
          )}

          {/* Progress bar */}
          <div className="mt-4 h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', breaksDue ? 'bg-accent' : 'bg-accent/60')}
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          <button
            onClick={takeBreak}
            className="mt-4 w-full py-3 rounded-xl bg-accent text-white font-semibold hover:bg-accent/90 active:scale-95 transition-all"
          >
            ✅ Take a break now
          </button>
        </div>

        {/* Today's stats */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Today&apos;s Stats</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold">{breaksToday}</p>
              <p className="text-[11px] text-text-secondary mt-0.5">Breaks taken</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{fmtHm(totalSitting)}</p>
              <p className="text-[11px] text-text-secondary mt-0.5">Total sitting</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{avgBreakInterval ? fmtHm(avgBreakInterval) : '—'}</p>
              <p className="text-[11px] text-text-secondary mt-0.5">Avg interval</p>
            </div>
          </div>
        </div>

        {/* Break suggestions (shown when break is due) */}
        {breaksDue && (
          <div className="bg-surface border border-accent/20 rounded-2xl p-4">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Break suggestions</p>
            <div className="grid grid-cols-2 gap-2">
              {BREAK_SUGGESTIONS.map((s) => (
                <div key={s.title} className="flex items-start gap-2 bg-background rounded-xl border border-border p-3">
                  <span className="text-xl">{s.icon}</span>
                  <div>
                    <p className="text-xs font-semibold">{s.title}</p>
                    <p className="text-[11px] text-text-secondary">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Settings</p>

          {/* Interval selector */}
          <div>
            <p className="text-sm font-medium mb-2">Remind me every</p>
            <div className="flex gap-2 flex-wrap">
              {INTERVAL_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleInterval(opt)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors',
                    interval === opt
                      ? 'bg-accent text-white border-accent'
                      : 'bg-background border-border text-text-secondary hover:border-accent/40'
                  )}
                >
                  {opt}m
                </button>
              ))}
            </div>
          </div>

          {/* Notification permission */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Desktop notifications</p>
              <p className="text-[11px] text-text-secondary">
                {notifPerm === 'granted' ? '✅ Enabled' : notifPerm === 'denied' ? '❌ Blocked — allow in browser settings' : 'Get notified when a break is due'}
              </p>
            </div>
            {notifPerm === 'default' && (
              <button
                onClick={() => void requestNotifPermission()}
                className="text-xs bg-accent/10 text-accent border border-accent/20 px-3 py-1.5 rounded-lg hover:bg-accent/20 transition-colors"
              >
                Enable
              </button>
            )}
          </div>
        </div>

      </div>
      <BottomNav />
    </div>
  )
}
