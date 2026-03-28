'use client'

import { useEffect, useState, useRef } from 'react'

type NoiseLog = {
  id: string
  logged_at: string
  decibel_level: number
  duration_minutes: number
  environment: string
  notes?: string | null
}

type EnvOption = 'concert' | 'workplace' | 'traffic' | 'home' | 'gym' | 'other'

const ENV_LABELS: Record<EnvOption, string> = {
  concert: '🎵 Concert',
  workplace: '🏢 Workplace',
  traffic: '🚗 Traffic',
  home: '🏠 Home',
  gym: '💪 Gym',
  other: '📍 Other',
}

/** NIOSH safe exposure limit: 85 dB for 480 min. Each 3 dB doubles the dose. */
function nioshMinutes(db: number): number {
  if (db < 80) return Infinity
  return 480 / Math.pow(2, (db - 85) / 3)
}

function dbColor(db: number): string {
  if (db < 70) return '#22c55e'
  if (db < 85) return '#eab308'
  if (db <= 100) return '#f97316'
  return '#ef4444'
}

function dbLabel(db: number): string {
  if (db < 70) return 'Safe'
  if (db < 85) return 'Caution'
  if (db <= 100) return 'Dangerous'
  return 'Harmful'
}

function ExposureSummary({ logs }: { logs: NoiseLog[] }) {
  const today = new Date().toDateString()
  const todayLogs = logs.filter(
    (l) => new Date(l.logged_at).toDateString() === today
  )

  if (todayLogs.length === 0) {
    return (
      <div className="text-center py-6 text-text-secondary text-sm">
        No exposure logged today. Log your first session below.
      </div>
    )
  }

  // Calculate NIOSH dose %
  let totalDose = 0
  const buckets: Record<string, number> = {}
  for (const log of todayLogs) {
    const safe = nioshMinutes(log.decibel_level)
    totalDose += log.duration_minutes / safe
    const label = dbLabel(log.decibel_level)
    buckets[label] = (buckets[label] ?? 0) + log.duration_minutes
  }
  const dosePercent = Math.min(Math.round(totalDose * 100), 999)
  const doseColor =
    dosePercent < 50 ? '#22c55e' : dosePercent < 100 ? '#eab308' : '#ef4444'

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center">
      <div
        className="flex flex-col items-center justify-center rounded-2xl px-6 py-5 min-w-[130px]"
        style={{ background: doseColor + '22' }}
      >
        <span className="text-4xl font-bold" style={{ color: doseColor }}>
          {dosePercent}%
        </span>
        <span className="text-xs font-medium mt-1" style={{ color: doseColor }}>
          NIOSH daily dose
        </span>
        <span className="text-xs text-text-secondary mt-0.5">
          {dosePercent >= 100 ? '⚠️ Limit exceeded' : '85 dB / 8 h limit'}
        </span>
      </div>
      <div className="flex flex-col gap-1 text-sm flex-1">
        {Object.entries(buckets).map(([label, mins]) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: dbColor(label === 'Safe' ? 60 : label === 'Caution' ? 75 : label === 'Dangerous' ? 90 : 105) }}
            />
            <span className="text-text-secondary">{label}:</span>
            <span className="font-medium">{mins} min</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function NoiseExposureClient() {
  const [logs, setLogs] = useState<NoiseLog[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [db, setDb] = useState(75)
  const [duration, setDuration] = useState('')
  const [env, setEnv] = useState<EnvOption>('other')
  const [notes, setNotes] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  async function fetchLogs() {
    const res = await fetch('/api/noise')
    if (res.ok) {
      const data = await res.json()
      setLogs(data.logs ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { fetchLogs() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!duration || parseInt(duration) <= 0) {
      setError('Duration must be at least 1 minute')
      return
    }
    setSubmitting(true)
    const res = await fetch('/api/noise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decibel_level: db,
        duration_minutes: parseInt(duration),
        environment: env,
        notes: notes.trim() || undefined,
      }),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? 'Failed to save. Try again.')
    } else {
      setSuccess('Logged!')
      setDuration('')
      setNotes('')
      setDb(75)
      setEnv('other')
      formRef.current?.reset()
      await fetchLogs()
    }
    setSubmitting(false)
  }

  const recent7 = logs.slice(0, 7)

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>👂</span> Hearing Health
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Track noise exposure to protect your hearing over time.
        </p>
      </div>

      {/* Today's summary */}
      <section className="bg-surface border border-border rounded-2xl p-4">
        <h2 className="text-lg font-semibold mb-3">Today&apos;s Exposure</h2>
        {loading ? (
          <p className="text-text-secondary text-sm">Loading…</p>
        ) : (
          <ExposureSummary logs={logs} />
        )}
      </section>

      {/* Log form */}
      <section className="bg-surface border border-border rounded-2xl p-4">
        <h2 className="text-lg font-semibold mb-4">Log Exposure</h2>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {/* dB slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium">Sound Level</label>
              <span
                className="text-lg font-bold"
                style={{ color: dbColor(db) }}
              >
                {db} dB — {dbLabel(db)}
              </span>
            </div>
            <input
              type="range"
              min={60}
              max={120}
              step={1}
              value={db}
              onChange={(e) => setDb(parseInt(e.target.value))}
              className="w-full accent-accent"
            />
            <div className="flex justify-between text-xs text-text-secondary mt-0.5">
              <span>60 dB (conversation)</span>
              <span>120 dB (jet engine)</span>
            </div>
            <div className="text-xs text-text-secondary mt-1">
              Safe limit at {db} dB:{' '}
              <span className="font-medium">
                {isFinite(nioshMinutes(db))
                  ? `${Math.round(nioshMinutes(db))} min`
                  : 'unlimited'}
              </span>{' '}
              per NIOSH
            </div>
          </div>

          {/* Duration + Environment */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs text-text-secondary mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                min={1}
                placeholder="e.g. 60"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:border-accent/60"
                required
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs text-text-secondary mb-1">
                Environment
              </label>
              <select
                value={env}
                onChange={(e) => setEnv(e.target.value as EnvOption)}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:border-accent/60"
              >
                {(Object.keys(ENV_LABELS) as EnvOption[]).map((k) => (
                  <option key={k} value={k}>
                    {ENV_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-text-secondary mb-1">
              Notes (optional)
            </label>
            <input
              type="text"
              maxLength={500}
              placeholder="e.g. festival main stage"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:border-accent/60"
            />
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}
          {success && <p className="text-green-600 text-xs">{success}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-accent text-white font-semibold py-2 rounded-xl text-sm disabled:opacity-50 transition-opacity"
          >
            {submitting ? 'Saving…' : 'Log Exposure'}
          </button>
        </form>
      </section>

      {/* Recent logs */}
      <section className="bg-surface border border-border rounded-2xl p-4">
        <h2 className="text-lg font-semibold mb-3">Recent Entries</h2>
        {loading ? (
          <p className="text-text-secondary text-sm">Loading…</p>
        ) : recent7.length === 0 ? (
          <p className="text-text-secondary text-sm">No entries yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {recent7.map((log) => (
              <li key={log.id} className="py-3 flex items-start gap-3">
                <span
                  className="w-12 text-center text-lg font-bold flex-shrink-0 rounded-xl py-1"
                  style={{
                    color: dbColor(log.decibel_level),
                    background: dbColor(log.decibel_level) + '22',
                  }}
                >
                  {log.decibel_level}
                </span>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">
                      {ENV_LABELS[log.environment as EnvOption] ?? log.environment}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {log.duration_minutes} min
                    </span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                      style={{
                        color: dbColor(log.decibel_level),
                        background: dbColor(log.decibel_level) + '22',
                      }}
                    >
                      {dbLabel(log.decibel_level)}
                    </span>
                  </div>
                  <span className="text-xs text-text-secondary">
                    {new Date(log.logged_at).toLocaleString()}
                  </span>
                  {log.notes && (
                    <span className="text-xs text-text-secondary truncate">
                      {log.notes}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* NIOSH reference */}
      <section className="bg-surface border border-border rounded-2xl p-4">
        <h2 className="text-lg font-semibold mb-2">NIOSH Safe Exposure Guide</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {[
            [85, '8 hours'],
            [88, '4 hours'],
            [91, '2 hours'],
            [94, '1 hour'],
            [97, '30 min'],
            [100, '15 min'],
          ].map(([level, time]) => (
            <div
              key={level}
              className="flex items-center justify-between rounded-xl px-3 py-2 border border-border"
            >
              <span className="font-bold" style={{ color: dbColor(Number(level)) }}>
                {level} dB
              </span>
              <span className="text-text-secondary">{time}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-secondary mt-3">
          Repeated exposure above 85 dB can cause permanent hearing loss. Use ear
          protection at concerts, construction sites, and loud workplaces.
        </p>
      </section>
    </div>
  )
}
