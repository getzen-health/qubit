'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Users, Star, Plus, Minus, AlertTriangle, TrendingUp, Heart, CalendarDays } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import {
  SocialLog, SocialScore, UCLA3_QUESTIONS, UCLA3_OPTIONS,
  calculateSocialScore, GRADE_COLORS, RISK_CONFIG, emptyLog,
} from '@/lib/social-health'
import { cn } from '@/lib/utils'

type Tab = 'today' | 'connections' | 'trends'

interface Props {
  initialLogs: SocialLog[]
  todayLog: SocialLog
  currentScore: SocialScore
}

// ── Score ring ──────────────────────────────────────────────────────────────
function ScoreRing({ score, grade, size = 160 }: { score: number; grade: SocialScore['grade']; size?: number }) {
  const r = (size - 20) / 2
  const circ = 2 * Math.PI * r
  const filled = (score / 100) * circ
  const color = GRADE_COLORS[grade]
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 absolute inset-0">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor"
          strokeWidth="10" className="text-surface-secondary" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
          strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${filled} ${circ - filled}`}
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
      </svg>
      <div className="text-center z-10">
        <div className="text-3xl font-bold text-text-primary">{score}</div>
        <div className="text-xs font-semibold mt-0.5" style={{ color }}>{grade}</div>
      </div>
    </div>
  )
}

// ── Star rating ──────────────────────────────────────────────────────────────
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}
          className="transition-transform hover:scale-110 active:scale-95">
          <Star className={cn('w-6 h-6', n <= value ? 'fill-amber-400 text-amber-400' : 'text-border')} />
        </button>
      ))}
    </div>
  )
}

// ── Counter ──────────────────────────────────────────────────────────────────
function Counter({ value, onChange, min = 0, max = 20 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-text-secondary hover:border-primary hover:text-primary transition-colors">
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-8 text-center font-bold text-text-primary">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))}
        className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-text-secondary hover:border-primary hover:text-primary transition-colors">
        <Plus className="w-3 h-3" />
      </button>
    </div>
  )
}

// ── Pillar bar ───────────────────────────────────────────────────────────────
function PillarBar({ label, value }: { label: string; value: number }) {
  const color = value >= 75 ? 'bg-green-500' : value >= 50 ? 'bg-indigo-500' : value >= 30 ? 'bg-amber-500' : 'bg-rose-500'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-text-secondary">{label}</span>
        <span className="font-semibold text-text-primary">{value}</span>
      </div>
      <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

// ── Format date for chart ────────────────────────────────────────────────────
function fmtDate(d: string) {
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Main component ──────────────────────────────────────────────────────────
export function SocialClient({ initialLogs, todayLog, currentScore }: Props) {
  const [tab, setTab] = useState<Tab>('today')
  const [form, setForm] = useState<SocialLog>({ ...todayLog })
  const [liveScore, setLiveScore] = useState<SocialScore>(currentScore)
  const [logs, setLogs] = useState<SocialLog[]>(initialLogs)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const today = new Date().toISOString().slice(0, 10)

  // Recompute score on every form change
  const update = useCallback(<K extends keyof SocialLog>(key: K, val: SocialLog[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: val }
      setLiveScore(calculateSocialScore(next))
      return next
    })
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const { data, score } = await res.json()
        setLogs((prev) => {
          const rest = prev.filter((l) => l.date !== today)
          return [data, ...rest]
        })
        setLiveScore(score)
        setSavedMsg('Saved ✓')
        setTimeout(() => setSavedMsg(''), 2000)
      }
    } finally {
      setSaving(false)
    }
  }

  // Chart data helpers
  const last30 = [...logs].sort((a, b) => a.date.localeCompare(b.date)).slice(-30)
  const last7 = last30.slice(-7)

  const trendData = last30.map((l) => ({
    date: fmtDate(l.date),
    score: calculateSocialScore(l).total,
    ucla3: l.ucla3_q1 + l.ucla3_q2 + l.ucla3_q3,
  }))

  const connectionData = last7.map((l) => ({
    date: fmtDate(l.date),
    'In-person': l.in_person_interactions,
    Digital: l.digital_interactions,
    Meals: l.shared_meals,
    Groups: l.group_activities,
    depth: l.connection_depth,
  }))

  // Weekly summary
  const weekLogs = last7
  const avgScore = weekLogs.length
    ? Math.round(weekLogs.reduce((s, l) => s + calculateSocialScore(l).total, 0) / weekLogs.length)
    : 0
  const totalInPerson = weekLogs.reduce((s, l) => s + l.in_person_interactions, 0)
  const avgUCLA3 = weekLogs.length
    ? Math.round((weekLogs.reduce((s, l) => s + l.ucla3_q1 + l.ucla3_q2 + l.ucla3_q3, 0) / weekLogs.length) * 10) / 10
    : 0

  const riskCfg = RISK_CONFIG[liveScore.lonelinessRisk]
  const showAlert = liveScore.lonelinessRisk !== 'low'

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'today', label: 'Today', icon: Heart },
    { id: 'connections', label: 'Connections', icon: Users },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-surface transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Social Health</h1>
            <p className="text-xs text-text-secondary">UCLA-3 Loneliness Screener · Social Vitality Score</p>
          </div>
          <Users className="w-5 h-5 text-text-secondary" />
        </div>
        {/* Tabs */}
        <div className="flex gap-1 px-4 pb-3">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors',
                tab === id ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-surface')}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-5 space-y-4">

        {/* ── TODAY TAB ──────────────────────────────────────────────────── */}
        {tab === 'today' && (
          <>
            {/* Loneliness risk alert */}
            {showAlert && (
              <div className={cn('flex items-start gap-3 p-4 rounded-2xl border', riskCfg.bg)}>
                <AlertTriangle className={cn('w-5 h-5 mt-0.5 flex-shrink-0', riskCfg.color)} />
                <div>
                  <p className={cn('text-sm font-semibold', riskCfg.color)}>
                    {riskCfg.label} — UCLA-3 score {liveScore.ucla3Score}/12
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    Loneliness carries the same mortality risk as smoking 15 cigarettes/day (Holt-Lunstad 2015). Try:
                  </p>
                  <ul className="text-xs text-text-secondary mt-1 space-y-0.5 list-disc list-inside">
                    <li>Join a group fitness class or local meetup</li>
                    <li>Volunteer 1 hr/week — reduces loneliness 30%</li>
                    <li>Join a club that meets regularly</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Live score ring */}
            <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col items-center gap-4">
              <ScoreRing score={liveScore.total} grade={liveScore.grade} />
              <div className="w-full space-y-2">
                <PillarBar label="Connection Quality (35%)" value={liveScore.pillars.connectionQuality} />
                <PillarBar label="Social Frequency (30%)" value={liveScore.pillars.socialFrequency} />
                <PillarBar label="Loneliness Inverse (35%)" value={liveScore.pillars.lonelinessInverse} />
              </div>
              <p className="text-xs text-text-secondary text-center">
                Thriving ≥75 · Connected 50-74 · Moderate 30-49 · Isolated &lt;30
              </p>
            </div>

            {/* UCLA-3 Screener */}
            <section className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <div>
                <h2 className="font-semibold text-text-primary">UCLA-3 Loneliness Screener</h2>
                <p className="text-xs text-text-secondary mt-0.5">Russell, 1996 — validated 3-item scale</p>
              </div>

              {UCLA3_QUESTIONS.map((q, i) => {
                const key = `ucla3_q${i + 1}` as 'ucla3_q1' | 'ucla3_q2' | 'ucla3_q3'
                return (
                  <div key={q.id} className="space-y-2">
                    <p className="text-sm text-text-primary font-medium">{i + 1}. {q.text}</p>
                    <div className="grid grid-cols-4 gap-2">
                      {UCLA3_OPTIONS.map((opt, j) => {
                        const val = j + 1
                        const selected = form[key] === val
                        return (
                          <button key={opt} type="button" onClick={() => update(key, val as 1 | 2 | 3 | 4)}
                            className={cn('py-2 px-1 rounded-xl border text-xs font-medium transition-colors',
                              selected
                                ? 'bg-primary/10 border-primary/50 text-primary'
                                : 'bg-background border-border text-text-secondary hover:border-primary/30')}>
                            {opt}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-sm text-text-secondary">Total Score</span>
                <span className={cn('text-lg font-bold', riskCfg.color)}>
                  {liveScore.ucla3Score}/12 — {riskCfg.label}
                </span>
              </div>
              <p className="text-xs text-text-secondary">Score ≥6 = at-risk · Score ≥9 = high loneliness</p>
            </section>

            {/* Connection Log */}
            <section className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <h2 className="font-semibold text-text-primary">Connection Log</h2>

              <div className="space-y-3">
                {[
                  { label: '👥 In-person interactions', key: 'in_person_interactions' as const },
                  { label: '�� Digital interactions', key: 'digital_interactions' as const },
                  { label: '🍽️ Shared meals', key: 'shared_meals' as const },
                  { label: '💬 Meaningful conversations', key: 'meaningful_convos' as const },
                  { label: '🤝 Group activities', key: 'group_activities' as const },
                ].map(({ label, key }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">{label}</span>
                    <Counter value={form[key] as number} onChange={(v) => update(key, v)} />
                  </div>
                ))}

                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-text-secondary">⭐ Connection depth</span>
                    <span className="text-xs text-text-secondary">{form.connection_depth}/5</span>
                  </div>
                  <StarRating value={form.connection_depth} onChange={(v) => update('connection_depth', v)} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">🙌 Volunteering (minutes)</span>
                  <Counter value={form.volunteering_minutes} onChange={(v) => update('volunteering_minutes', v)} max={480} />
                </div>
              </div>

              <textarea
                placeholder="Notes (optional)…"
                rows={2}
                value={form.notes ?? ''}
                onChange={(e) => update('notes', e.target.value)}
                className="w-full text-sm bg-background border border-border rounded-xl px-3 py-2 text-text-primary placeholder-text-secondary resize-none focus:outline-none focus:border-primary/50"
              />

              {liveScore.recommendations.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Recommendations</p>
                  {liveScore.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={save} disabled={saving}
                className="w-full py-3 rounded-2xl bg-primary text-white font-semibold text-sm transition-opacity disabled:opacity-60">
                {saving ? 'Saving…' : savedMsg || 'Save Today\'s Log'}
              </button>
            </section>
          </>
        )}

        {/* ── CONNECTIONS TAB ────────────────────────────────────────────── */}
        {tab === 'connections' && (
          <>
            {connectionData.length === 0 ? (
              <div className="bg-surface border border-border rounded-2xl p-8 text-center">
                <CalendarDays className="w-10 h-10 text-text-secondary mx-auto mb-3" />
                <p className="text-text-secondary text-sm">Log your first day to see charts</p>
              </div>
            ) : (
              <>
                {/* 7-day stacked bar chart */}
                <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
                  <h2 className="font-semibold text-text-primary">7-Day Interaction Mix</h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={connectionData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border,#333)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary,#888)' }} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary,#888)' }} />
                      <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="In-person" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Digital" stackId="a" fill="#818cf8" />
                      <Bar dataKey="Meals" stackId="a" fill="#f59e0b" />
                      <Bar dataKey="Groups" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Connection depth trend */}
                <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
                  <h2 className="font-semibold text-text-primary">Connection Depth Trend</h2>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={connectionData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border,#333)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary,#888)' }} />
                      <YAxis domain={[1, 5]} tick={{ fontSize: 10, fill: 'var(--color-text-secondary,#888)' }} />
                      <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 12 }} />
                      <Line type="monotone" dataKey="depth" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Depth (1-5)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Social prescription */}
                {liveScore.total < 50 && (
                  <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
                    <h2 className="font-semibold text-text-primary">🩺 Social Prescription</h2>
                    <p className="text-xs text-text-secondary">Evidence-based actions to improve your Social Vitality Score:</p>
                    {[
                      { tip: 'Schedule 2+ in-person interactions daily — face-to-face contact releases oxytocin and lowers cortisol (Uvnäs-Moberg, 1998)', icon: '👥' },
                      { tip: 'Volunteer 1 hour/week — reduces loneliness by ~30% and increases life satisfaction (Okun et al., 2013)', icon: '🤝' },
                      { tip: 'Join a recurring group (sport, book club, choir) — regular contact builds belonging and predictable social rhythm', icon: '🗓️' },
                    ].map(({ tip, icon }, i) => (
                      <div key={i} className="flex gap-3 text-sm">
                        <span className="text-lg flex-shrink-0">{icon}</span>
                        <p className="text-text-secondary">{tip}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── TRENDS TAB ────────────────────────────────────────────────── */}
        {tab === 'trends' && (
          <>
            {/* Weekly summary */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Avg Score', value: avgScore, suffix: '/100' },
                { label: 'In-person', value: totalInPerson, suffix: ' this week' },
                { label: 'Avg UCLA-3', value: avgUCLA3, suffix: '/12' },
              ].map(({ label, value, suffix }) => (
                <div key={label} className="bg-surface border border-border rounded-2xl p-3 text-center">
                  <div className="text-xl font-bold text-text-primary">{value}</div>
                  <div className="text-[10px] text-text-secondary leading-tight mt-0.5">{label}<br /><span className="text-[9px]">{suffix}</span></div>
                </div>
              ))}
            </div>

            {trendData.length === 0 ? (
              <div className="bg-surface border border-border rounded-2xl p-8 text-center">
                <TrendingUp className="w-10 h-10 text-text-secondary mx-auto mb-3" />
                <p className="text-text-secondary text-sm">Log your first day to see trends</p>
              </div>
            ) : (
              <>
                {/* 30-day Social Vitality Score */}
                <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
                  <h2 className="font-semibold text-text-primary">30-Day Social Vitality Score</h2>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border,#333)" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--color-text-secondary,#888)' }} interval="preserveStartEnd" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--color-text-secondary,#888)' }} />
                      <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 12 }} />
                      <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} dot={false} name="Vitality Score" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* UCLA-3 trend */}
                <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
                  <div>
                    <h2 className="font-semibold text-text-primary">UCLA-3 Loneliness Trend</h2>
                    <p className="text-xs text-text-secondary mt-0.5">Lower is better · ≥6 at-risk · ≥9 high</p>
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border,#333)" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--color-text-secondary,#888)' }} interval="preserveStartEnd" />
                      <YAxis domain={[3, 12]} tick={{ fontSize: 10, fill: 'var(--color-text-secondary,#888)' }} />
                      <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 12 }} />
                      {/* Reference lines for risk zones */}
                      <Line type="monotone" dataKey="ucla3" stroke="#f59e0b" strokeWidth={2.5} dot={false} name="UCLA-3 Score" />
                    </LineChart>
                  </ResponsiveContainer>
                  {/* Risk band legend */}
                  <div className="flex gap-3 text-xs text-text-secondary justify-center">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />3–5 Low</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />6–8 At-Risk</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />9–12 High</span>
                  </div>
                </div>
              </>
            )}

            {/* Research note */}
            <div className="bg-surface border border-border rounded-2xl p-4">
              <p className="text-xs text-text-secondary leading-relaxed">
                <span className="font-semibold text-text-primary">Research basis: </span>
                UCLA Loneliness Scale v3 (Russell, 1996). Holt-Lunstad et al. 2015 — loneliness equivalent to 15 cigarettes/day mortality risk.
                Yang et al. 2016 meta-analysis (n=3.4M) — social isolation increases mortality risk 29%.
                Cacioppo &amp; Hawkley 2010 — social isolation triggers HPA axis dysregulation.
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
