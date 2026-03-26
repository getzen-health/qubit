'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Zap, AlertTriangle } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid,
} from 'recharts'
import { BottomNav } from '@/components/bottom-nav'
import {
  calculateVDOT,
  calculateCyclingZones,
  calculateTSS,
  checkRampRate,
  timeToSeconds,
  secondsToTime,
  type VDOTResult,
  type CyclingResult,
  type WeeklyMileage,
} from '@/lib/endurance-metrics'

// ─── Constants ────────────────────────────────────────────────────────────────

type Tab = 'running' | 'cycling' | 'history'

const DISTANCES = [
  { label: '1500 m', meters: 1500 },
  { label: '1 mile', meters: 1609 },
  { label: '3 K', meters: 3000 },
  { label: '5 K', meters: 5000 },
  { label: '10 K', meters: 10000 },
  { label: '15 K', meters: 15000 },
  { label: 'Half Marathon', meters: 21097 },
  { label: 'Marathon', meters: 42195 },
]

const ZONE_COLORS = ['#94a3b8', '#60a5fa', '#34d399', '#facc15', '#f97316', '#ef4444', '#a855f7']

const FITNESS_BADGE: Record<VDOTResult['fitness_level'], string> = {
  Beginner: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  Recreational: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Competitive: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  Advanced: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Elite: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
}

const CATEGORY_BADGE: Record<string, string> = {
  'Untrained': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  'Cat 5': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Cat 4': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  'Cat 4+': 'bg-teal-600/20 text-teal-300 border-teal-600/30',
  'Cat 3': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Cat 2': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Cat 1': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Pro / Elite': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

const RISK_COLORS: Record<WeeklyMileage['risk_level'], string> = {
  Safe: '#22c55e',
  Caution: '#f59e0b',
  'High Risk': '#ef4444',
}

// ─── Small helpers ─────────────────────────────────────────────────────────────

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${className}`}>
      {label}
    </span>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-surface border border-border p-4 space-y-3">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  )
}

// ─── Running Tab ──────────────────────────────────────────────────────────────

function RunningTab() {
  const [distIdx, setDistIdx] = useState(4) // default 10 K
  const [timeStr, setTimeStr] = useState('')
  const [result, setResult] = useState<VDOTResult | null>(null)
  const [mileageInput, setMileageInput] = useState('')
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay() + 1) // Monday
    return d.toISOString().slice(0, 10)
  })
  const [ramp, setRamp] = useState<WeeklyMileage[]>([])
  const [saving, setSaving] = useState(false)

  const loadRamp = useCallback(async () => {
    try {
      const res = await fetch('/api/endurance')
      if (!res.ok) return
      const json = await res.json()
      if (Array.isArray(json.ramp_rate)) setRamp(json.ramp_rate.slice(-8))
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => { loadRamp() }, [loadRamp])

  function handleCalculate() {
    const secs = timeToSeconds(timeStr)
    if (!secs || secs <= 0) return
    const dist = DISTANCES[distIdx].meters
    const r = calculateVDOT(dist, secs)
    setResult(r)
    saveProfile(r)
  }

  async function saveProfile(r: VDOTResult) {
    const dist = DISTANCES[distIdx].label
    const body: Record<string, unknown> = {
      vdot: r.vdot,
      vo2max_estimate: r.vo2max_estimate,
    }
    const secs = timeToSeconds(timeStr)
    if (dist === '5 K') body.best_5k_seconds = secs
    if (dist === '10 K') body.best_10k_seconds = secs
    if (dist === 'Half Marathon') body.best_hm_seconds = secs
    if (dist === 'Marathon') body.best_marathon_seconds = secs

    await fetch('/api/endurance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  async function logMileage() {
    const km = parseFloat(mileageInput)
    if (!km || km <= 0) return
    setSaving(true)
    try {
      await fetch('/api/endurance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'mileage', week_start: weekStart, distance_km: km, sport: 'running' }),
      })
      setMileageInput('')
      loadRamp()
    } finally {
      setSaving(false)
    }
  }

  const latestChange = ramp.length > 0 ? ramp[ramp.length - 1].change_percent : 0
  const showWarning = latestChange > 10

  return (
    <div className="space-y-4">
      {/* Input */}
      <Section title="Race Time → VDOT">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-text-secondary mb-1 block">Distance</label>
            <select
              value={distIdx}
              onChange={(e) => setDistIdx(Number(e.target.value))}
              className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {DISTANCES.map((d, i) => (
                <option key={d.label} value={i}>{d.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-secondary mb-1 block">Finish time (hh:mm:ss or mm:ss)</label>
            <input
              type="text"
              placeholder="e.g. 45:30 or 1:38:00"
              value={timeStr}
              onChange={(e) => setTimeStr(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button
            onClick={handleCalculate}
            className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold active:scale-95 transition-transform"
          >
            Calculate VDOT
          </button>
        </div>
      </Section>

      {/* Results */}
      {result && (
        <>
          {/* VDOT card */}
          <div className="rounded-2xl bg-surface border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-text-secondary uppercase tracking-wide">VDOT / VO₂max</p>
                <p className="text-4xl font-bold text-text-primary mt-0.5">
                  {result.vdot}
                  <span className="text-base font-normal text-text-secondary ml-1">ml/kg/min</span>
                </p>
              </div>
              <Badge label={result.fitness_level} className={FITNESS_BADGE[result.fitness_level]} />
            </div>
          </div>

          {/* Training paces */}
          <Section title="Training Paces">
            <div className="space-y-2">
              {Object.entries(result.training_paces).map(([zone, paces]) => (
                <div key={zone} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                  <span className="text-sm font-medium text-text-primary capitalize">{zone}</span>
                  <div className="text-right">
                    <p className="text-sm text-text-primary">{paces.min_per_km}</p>
                    <p className="text-xs text-text-secondary">{paces.min_per_mile}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Race predictions */}
          <Section title="Race Predictions">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(result.race_predictions).map(([dist, time]) => (
                <div key={dist} className="bg-surface border border-border rounded-xl p-2.5">
                  <p className="text-xs text-text-secondary">{dist}</p>
                  <p className="text-sm font-semibold text-text-primary mt-0.5">{time}</p>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}

      {/* Weekly mileage logger */}
      <Section title="Weekly Mileage Log">
        {showWarning && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-300">
              Current week is +{latestChange}% vs last week. The 10% ramp-rate rule recommends staying under 10% to reduce injury risk.
            </p>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="flex-1 bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none"
          />
          <input
            type="number"
            placeholder="km"
            value={mileageInput}
            min={0}
            onChange={(e) => setMileageInput(e.target.value)}
            className="w-24 bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none"
          />
          <button
            onClick={logMileage}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50"
          >
            Log
          </button>
        </div>
        {ramp.length > 0 && (
          <div className="mt-3 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ramp} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #94a3b8)' }} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #94a3b8)' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-surface, #1e293b)', border: '1px solid var(--color-border, #334155)', borderRadius: 12, fontSize: 12 }}
                  formatter={(val: number) => [`${val} km`, 'Distance']}
                />
                <Bar dataKey="distance_km" radius={[6, 6, 0, 0]}>
                  {ramp.map((entry, idx) => (
                    <Cell key={idx} fill={RISK_COLORS[entry.risk_level]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {ramp.length > 0 && (
          <div className="flex gap-3 text-xs text-text-secondary mt-1">
            {(['Safe', 'Caution', 'High Risk'] as const).map((lvl) => (
              <span key={lvl} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: RISK_COLORS[lvl] }} />
                {lvl}
              </span>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}

// ─── Cycling Tab ──────────────────────────────────────────────────────────────

function CyclingTab() {
  const [ftp, setFtp] = useState('')
  const [weight, setWeight] = useState('')
  const [result, setResult] = useState<CyclingResult | null>(null)
  const [tssDuration, setTssDuration] = useState('')
  const [tssWatts, setTssWatts] = useState('')
  const [tss, setTss] = useState<number | null>(null)

  function calculate() {
    const f = parseInt(ftp)
    const w = parseFloat(weight)
    if (!f || f <= 0 || !w || w <= 0) return
    const r = calculateCyclingZones(f, w)
    setResult(r)
    // Save profile
    fetch('/api/endurance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ftp_watts: f, weight_kg: w }),
    }).catch(() => {})
  }

  function calcTSS() {
    if (!result) return
    const dur = parseFloat(tssDuration)
    const avg = parseFloat(tssWatts)
    if (!dur || !avg) return
    setTss(calculateTSS(dur, avg, result.ftp_watts))
  }

  return (
    <div className="space-y-4">
      {/* FTP input */}
      <Section title="FTP & Bodyweight">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-text-secondary mb-1 block">FTP (watts)</label>
            <input
              type="number"
              placeholder="e.g. 250"
              value={ftp}
              onChange={(e) => setFtp(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary mb-1 block">Bodyweight (kg)</label>
            <input
              type="number"
              placeholder="e.g. 70"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
        <button
          onClick={calculate}
          className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold active:scale-95 transition-transform mt-1"
        >
          Calculate Zones
        </button>
        <div className="p-3 rounded-xl bg-surface border border-border/50 mt-1">
          <p className="text-xs font-semibold text-text-secondary mb-1">20-min FTP Test</p>
          <p className="text-xs text-text-secondary">Ride all-out for 20 minutes. Best average power × 0.95 = FTP.</p>
        </div>
      </Section>

      {/* Results */}
      {result && (
        <>
          <div className="rounded-2xl bg-surface border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text-secondary uppercase tracking-wide">Watts per Kg</p>
                <p className="text-4xl font-bold text-text-primary mt-0.5">
                  {result.watts_per_kg}
                  <span className="text-base font-normal text-text-secondary ml-1">W/kg</span>
                </p>
                <p className="text-sm text-text-secondary mt-1">FTP: {result.ftp_watts} W</p>
              </div>
              <Badge
                label={result.category}
                className={CATEGORY_BADGE[result.category] ?? 'bg-slate-500/20 text-slate-400 border-slate-500/30'}
              />
            </div>
          </div>

          {/* 7 Power zones */}
          <Section title="7 Coggan Power Zones">
            <div className="space-y-2">
              {result.zones.map((z) => (
                <div key={z.zone} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: ZONE_COLORS[z.zone - 1] }}
                      />
                      <span className="text-sm font-medium text-text-primary">Z{z.zone} – {z.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-text-primary">
                      {z.watts_low}–{z.watts_high === 9999 ? `${z.watts_low}+` : z.watts_high} W
                    </span>
                  </div>
                  <div className="pl-5 space-y-0.5">
                    <p className="text-xs text-text-secondary">{z.description} · {z.typical_duration}</p>
                    <p className="text-xs text-text-secondary/70">{z.physiological_adaptation}</p>
                  </div>
                  {z.zone < 7 && <div className="border-b border-border/30 mt-1" />}
                </div>
              ))}
            </div>
          </Section>

          {/* TSS calculator */}
          <Section title="TSS Calculator">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-secondary mb-1 block">Duration (min)</label>
                <input
                  type="number"
                  placeholder="60"
                  value={tssDuration}
                  onChange={(e) => setTssDuration(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary mb-1 block">Avg watts</label>
                <input
                  type="number"
                  placeholder="220"
                  value={tssWatts}
                  onChange={(e) => setTssWatts(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={calcTSS}
              className="w-full py-2 rounded-xl bg-primary/10 border border-primary/30 text-primary text-sm font-semibold"
            >
              Calculate TSS
            </button>
            {tss !== null && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border">
                <span className="text-sm text-text-secondary">Training Stress Score</span>
                <span className="text-2xl font-bold text-text-primary">{tss}</span>
              </div>
            )}
            <p className="text-xs text-text-secondary">
              TSS &lt;150 = recovery ride · 150–300 = moderate · &gt;300 = hard day
            </p>
          </Section>
        </>
      )}
    </div>
  )
}

// ─── History Tab ──────────────────────────────────────────────────────────────

interface HistoryEntry {
  date: string
  vdot?: number | null
  ftp?: number | null
}

function HistoryTab() {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/endurance')
      .then((r) => r.json())
      .then((json) => {
        if (json.profile) {
          setEntries([
            {
              date: json.profile.updated_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
              vdot: json.profile.vdot,
              ftp: json.profile.ftp_watts,
            },
          ])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl bg-surface border border-border p-8 text-center">
        <Zap className="w-10 h-10 text-text-secondary mx-auto mb-3" />
        <p className="text-text-secondary text-sm">No history yet. Calculate your VDOT or FTP to start tracking progress.</p>
      </div>
    )
  }

  const vdotData = entries.filter((e) => e.vdot != null).map((e) => ({ date: e.date, value: e.vdot }))
  const ftpData = entries.filter((e) => e.ftp != null).map((e) => ({ date: e.date, value: e.ftp }))

  const chartProps = {
    margin: { top: 8, right: 8, left: -24, bottom: 0 },
  }

  return (
    <div className="space-y-4">
      {vdotData.length > 0 && (
        <div className="rounded-2xl bg-surface border border-border p-4">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">VDOT Trend</h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vdotData} {...chartProps}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #334155)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #94a3b8)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #94a3b8)' }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-surface, #1e293b)', border: '1px solid var(--color-border, #334155)', borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => [v, 'VDOT']}
                />
                <Line type="monotone" dataKey="value" stroke="#a78bfa" strokeWidth={2} dot={{ fill: '#a78bfa', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      {ftpData.length > 0 && (
        <div className="rounded-2xl bg-surface border border-border p-4">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">FTP Trend</h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ftpData} {...chartProps}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #334155)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #94a3b8)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #94a3b8)' }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-surface, #1e293b)', border: '1px solid var(--color-border, #334155)', borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => [`${v} W`, 'FTP']}
                />
                <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EndurancePage() {
  const [tab, setTab] = useState<Tab>('running')

  const tabs: { key: Tab; label: string }[] = [
    { key: 'running', label: 'Running' },
    { key: 'cycling', label: 'Cycling' },
    { key: 'history', label: 'History' },
  ]

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3 max-w-2xl mx-auto">
          <Link href="/dashboard" className="p-1.5 rounded-lg hover:bg-surface transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <Zap className="w-5 h-5 text-primary" />
          <h1 className="text-base font-semibold text-text-primary">Endurance</h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-[53px] z-30 bg-background border-b border-border">
        <div className="flex max-w-2xl mx-auto px-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                tab === t.key
                  ? 'text-primary border-primary'
                  : 'text-text-secondary border-transparent hover:text-text-primary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="px-4 py-4 max-w-2xl mx-auto">
        {tab === 'running' && <RunningTab />}
        {tab === 'cycling' && <CyclingTab />}
        {tab === 'history' && <HistoryTab />}
      </main>

      <BottomNav />
    </div>
  )
}
