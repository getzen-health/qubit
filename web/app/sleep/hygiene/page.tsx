'use client'
import { useState, useEffect } from 'react'

const CHECKLIST_ITEMS = [
  { key: 'consistent_schedule', label: 'Consistent sleep schedule', detail: 'Same bedtime ±30 min as usual', points: 20, icon: '🕐' },
  { key: 'no_alcohol', label: 'No alcohol 4h before bed', detail: 'Alcohol disrupts REM sleep even at low doses', points: 20, icon: '🚫🍷' },
  { key: 'no_caffeine_6h', label: 'No caffeine 6h before bed', detail: 'Caffeine half-life is 5-7 hours', points: 15, icon: '☕' },
  { key: 'no_screens_1h', label: 'Screens off 1h before bed', detail: 'Blue light suppresses melatonin for 2 hours', points: 15, icon: '📵' },
  { key: 'room_dark', label: 'Dark bedroom', detail: 'Blackout curtains or sleep mask', points: 8, icon: '🌑' },
  { key: 'room_quiet', label: 'Quiet bedroom', detail: 'White noise OK, sudden sounds disrupt sleep', points: 7, icon: '🤫' },
]

function calcLiveScore(checks: Record<string, boolean>, temp: string): number {
  let score = 0
  for (const item of CHECKLIST_ITEMS) {
    if (checks[item.key]) score += item.points
  }
  const t = parseFloat(temp)
  if (!isNaN(t) && t >= 18 && t <= 22) score += 15
  else if (!temp) score += 7
  return Math.min(100, score)
}

function scoreGrade(s: number): { grade: string; color: string; label: string } {
  if (s >= 85) return { grade: 'A+', color: 'text-green-600', label: 'Excellent' }
  if (s >= 70) return { grade: 'A', color: 'text-green-500', label: 'Great' }
  if (s >= 55) return { grade: 'B', color: 'text-yellow-500', label: 'Good' }
  if (s >= 35) return { grade: 'C', color: 'text-orange-500', label: 'Fair' }
  return { grade: 'D', color: 'text-red-500', label: 'Poor' }
}

export default function SleepHygienePage() {
  const [checks, setChecks] = useState<Record<string, boolean>>({
    consistent_schedule: false, no_alcohol: true, no_caffeine_6h: true, no_screens_1h: false, room_dark: false, room_quiet: false,
  })
  const [temp, setTemp] = useState('')
  const [bedTime, setBedTime] = useState('')
  const [wakeTime, setWakeTime] = useState('')
  const [quality, setQuality] = useState<number | null>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [todayLog, setTodayLog] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/sleep-hygiene').then(r => r.json()).then(d => {
      setLogs(d.logs ?? [])
      if (d.today) {
        setTodayLog(d.today)
        setChecks({
          consistent_schedule: d.today.consistent_schedule,
          no_alcohol: d.today.no_alcohol,
          no_caffeine_6h: d.today.no_caffeine_6h,
          no_screens_1h: d.today.no_screens_1h,
          room_dark: d.today.room_dark,
          room_quiet: d.today.room_quiet,
        })
        if (d.today.room_temp_celsius) setTemp(String(d.today.room_temp_celsius))
        if (d.today.bed_time) setBedTime(d.today.bed_time.slice(0,5))
        if (d.today.wake_time) setWakeTime(d.today.wake_time.slice(0,5))
        if (d.today.sleep_quality) setQuality(d.today.sleep_quality)
      }
    })
  }, [])

  const liveScore = calcLiveScore(checks, temp)
  const { grade, color, label } = scoreGrade(liveScore)

  const toggle = (key: string) => setChecks(p => ({ ...p, [key]: !p[key] }))

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/sleep-hygiene', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...checks,
        room_temp_celsius: temp ? parseFloat(temp) : null,
        bed_time: bedTime || null,
        wake_time: wakeTime || null,
        sleep_quality: quality,
      }),
    })
    const d = await res.json()
    if (d.log) { setTodayLog(d.log); setSaved(true); setTimeout(() => setSaved(false), 2000) }
    // Refresh logs
    fetch('/api/sleep-hygiene').then(r => r.json()).then(d => setLogs(d.logs ?? []))
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Sleep Hygiene</h1>
        <p className="text-sm text-text-secondary mb-6">Habits that improve sleep quality tonight</p>

        {/* Live score card */}
        <div className="bg-white rounded-2xl border border-border p-5 mb-6 text-center">
          <div className={`text-5xl font-black mb-1 ${color}`}>{grade}</div>
          <div className="text-2xl font-bold text-text-primary">{liveScore}/100</div>
          <div className={`text-sm font-medium ${color}`}>{label}</div>
          {liveScore < 70 && (
            <p className="text-xs text-text-secondary mt-2">
              {100 - liveScore} more points possible tonight
            </p>
          )}
        </div>

        {/* Checklist */}
        <div className="bg-white rounded-2xl border border-border divide-y divide-border mb-4">
          {CHECKLIST_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => toggle(item.key)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface transition-colors"
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${checks[item.key] ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                {checks[item.key] && <span className="text-white text-xs">✓</span>}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  <span className="text-sm font-medium text-text-primary">{item.label}</span>
                  <span className="text-xs text-green-600 ml-auto">+{item.points}pts</span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">{item.detail}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Environment */}
        <div className="bg-white rounded-2xl border border-border p-4 mb-4">
          <h3 className="font-semibold text-text-primary mb-3">Room Environment</h3>
          <div>
            <label className="text-xs text-text-secondary block mb-1">Room temperature (°C) — optimal: 18-22°C +15pts</label>
            <input type="number" placeholder="e.g. 19" value={temp} onChange={e => setTemp(e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-primary bg-surface" />
          </div>
        </div>

        {/* Bed/wake times */}
        <div className="bg-white rounded-2xl border border-border p-4 mb-4">
          <h3 className="font-semibold text-text-primary mb-3">Sleep Times</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-secondary block mb-1">Bed time</label>
              <input type="time" value={bedTime} onChange={e => setBedTime(e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-primary bg-surface" />
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">Wake time</label>
              <input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-primary bg-surface" />
            </div>
          </div>
          <div className="mt-3">
            <label className="text-xs text-text-secondary block mb-2">Sleep quality (1-10)</label>
            <div className="flex gap-1">
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <button key={n} onClick={() => setQuality(n)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${quality === n ? 'bg-primary text-white' : 'bg-surface border border-border text-text-secondary'}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={save} disabled={saving}
          className="w-full bg-primary text-white py-3 rounded-2xl font-semibold mb-6 disabled:opacity-50">
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Tonight\'s Hygiene Log'}
        </button>

        {/* History */}
        {logs.length > 1 && (
          <div className="bg-white rounded-2xl border border-border p-4">
            <h3 className="font-semibold text-text-primary mb-3">Recent Scores</h3>
            <div className="space-y-2">
              {logs.slice(0, 7).map((l: any) => (
                <div key={l.id} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                  <span className="text-sm text-text-secondary">{new Date(l.logged_date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  <div className="flex items-center gap-2">
                    {l.sleep_quality && <span className="text-xs text-text-secondary">😴 {l.sleep_quality}/10</span>}
                    <span className={`font-bold text-sm ${scoreGrade(l.hygiene_score ?? 0).color}`}>{l.hygiene_grade} ({l.hygiene_score})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-text-secondary text-center mt-4">
          Based on AASM 2021 sleep hygiene guidelines and CBTi research
        </p>
      </div>
    </div>
  )
}
