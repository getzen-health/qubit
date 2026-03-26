'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Shield, ChevronDown, ChevronUp, Info, Zap, Moon, Apple, Dumbbell, Wind } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts'
import {
  ImmuneLog, ImmuneScore, IMMUNE_SYMPTOMS, IMMUNE_NUTRIENTS,
  calculateImmuneScore, gradeColor, scoreRingColor,
} from '@/lib/immune-score'

interface Props {
  initialLogs: ImmuneLog[]
  todayLog: ImmuneLog | null
  currentScore: ImmuneScore | null
  trend: { date: string; score: number }[]
}

const DEFAULT_FORM: Omit<ImmuneLog, 'date' | 'user_id' | 'id' | 'created_at'> = {
  sleep_hours: 7,
  vit_c_mg: 0,
  vit_d_iu: 0,
  zinc_mg: 0,
  selenium_mcg: 0,
  stress_level: 5,
  exercise_minutes: 0,
  exercise_intensity: 'none',
  fiber_g: 0,
  probiotic_taken: false,
  symptoms: {},
  notes: '',
}

function fromLog(log: ImmuneLog | null): typeof DEFAULT_FORM {
  if (!log) return { ...DEFAULT_FORM }
  return {
    sleep_hours: log.sleep_hours,
    vit_c_mg: log.vit_c_mg,
    vit_d_iu: log.vit_d_iu,
    zinc_mg: log.zinc_mg,
    selenium_mcg: log.selenium_mcg,
    stress_level: log.stress_level,
    exercise_minutes: log.exercise_minutes,
    exercise_intensity: log.exercise_intensity,
    fiber_g: log.fiber_g,
    probiotic_taken: log.probiotic_taken,
    symptoms: { ...log.symptoms },
    notes: log.notes ?? '',
  }
}

// SVG circular score ring
function ScoreRing({ score, size = 160 }: { score: number; size?: number }) {
  const r = (size - 20) / 2
  const circ = 2 * Math.PI * r
  const filled = (score / 100) * circ
  const color = scoreRingColor(score)
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor"
        strokeWidth="10" className="text-surface-secondary" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
        strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${filled} ${circ - filled}`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    </svg>
  )
}

// Pillar bar
function PillarBar({ label, value, icon: Icon }: { label: string; value: number; icon: React.ComponentType<{ className?: string }> }) {
  const color = value >= 75 ? 'bg-green-500' : value >= 50 ? 'bg-yellow-500' : value >= 30 ? 'bg-orange-500' : 'bg-red-500'
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-text-secondary"><Icon className="w-3 h-3" />{label}</span>
        <span className="font-semibold text-text-primary">{value}</span>
      </div>
      <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export function ImmuneClient({ initialLogs, todayLog, currentScore: initialScore, trend: initialTrend }: Props) {
  const [tab, setTab] = useState<'today' | 'nutrients' | 'trends'>('today')
  const [form, setForm] = useState(fromLog(todayLog))
  const [liveScore, setLiveScore] = useState<ImmuneScore | null>(initialScore)
  const [logs, setLogs] = useState<ImmuneLog[]>(initialLogs)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [expandedNutrient, setExpandedNutrient] = useState<string | null>(null)

  const today = new Date().toISOString().slice(0, 10)
  const isFlySeason = (() => { const m = new Date().getMonth() + 1; return m >= 10 || m <= 3 })()

  // Recompute live score on form change
  const updateForm = useCallback(<K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      setLiveScore(calculateImmuneScore({ ...next, date: today }))
      return next
    })
  }, [today])

  const updateSymptom = useCallback((name: string, val: number) => {
    setForm((prev) => {
      const next = { ...prev, symptoms: { ...prev.symptoms, [name]: val } }
      setLiveScore(calculateImmuneScore({ ...next, date: today }))
      return next
    })
  }, [today])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/immune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, date: today }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setLiveScore(json.score)
      // Update logs list
      setLogs((prev) => {
        const filtered = prev.filter((l) => l.date !== today)
        return [json.log, ...filtered]
      })
      setSavedMsg('Saved!')
      setTimeout(() => setSavedMsg(''), 2000)
    } catch (e) {
      setSavedMsg('Error saving')
    } finally {
      setSaving(false)
    }
  }

  // Trend data for charts
  const trendData = [...logs]
    .slice(0, 30)
    .reverse()
    .map((l) => ({
      date: l.date.slice(5),
      score: calculateImmuneScore(l as ImmuneLog).total,
    }))

  const symptomFreq: Record<string, number> = {}
  IMMUNE_SYMPTOMS.forEach((s) => { symptomFreq[s] = 0 })
  logs.forEach((l) => {
    Object.entries(l.symptoms ?? {}).forEach(([name, val]) => {
      if ((val as number) > 0) symptomFreq[name] = (symptomFreq[name] ?? 0) + 1
    })
  })
  const symptomFreqData = IMMUNE_SYMPTOMS.map((s) => ({ name: s.split(' ')[0], count: symptomFreq[s] ?? 0 }))

  // Average pillars
  const avgPillars = (() => {
    if (!logs.length) return null
    const sums = { sleep: 0, nutrition: 0, stress: 0, exercise: 0 }
    logs.forEach((l) => {
      const s = calculateImmuneScore(l as ImmuneLog).pillars
      sums.sleep += s.sleep
      sums.nutrition += s.nutrition
      sums.stress += s.stress
      sums.exercise += s.exercise
    })
    const n = logs.length
    return [
      { pillar: 'Sleep', value: Math.round(sums.sleep / n) },
      { pillar: 'Nutrition', value: Math.round(sums.nutrition / n) },
      { pillar: 'Stress', value: Math.round(sums.stress / n) },
      { pillar: 'Exercise', value: Math.round(sums.exercise / n) },
    ]
  })()

  const score = liveScore ?? initialScore
  const gradeColorClass = score ? gradeColor(score.grade) : 'text-text-secondary'

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-surface transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="font-bold text-text-primary text-lg flex-1">Immune Tracker</h1>
          {savedMsg && (
            <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full">{savedMsg}</span>
          )}
        </div>
        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-2">
          {(['today', 'nutrients', 'trends'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium capitalize transition-colors border ${
                tab === t
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-surface border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              {t === 'today' ? '🛡️ Today' : t === 'nutrients' ? '🥝 Nutrients' : '📈 Trends'}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* ─── TODAY TAB ─── */}
        {tab === 'today' && (
          <>
            {/* Seasonal risk banner */}
            {isFlySeason && (
              <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
                <Info className="w-4 h-4 shrink-0" />
                <span><strong>Flu season (Oct–Mar)</strong> — your score is adjusted down 10%. Prioritise sleep, Vitamin D, and hygiene.</span>
              </div>
            )}

            {/* Score ring + pillars */}
            <div className="bg-surface border border-border rounded-2xl p-5">
              <div className="flex items-center gap-6">
                <div className="relative flex items-center justify-center shrink-0">
                  <ScoreRing score={score?.total ?? 0} />
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-bold text-text-primary">{score?.total ?? '—'}</span>
                    <span className={`text-xs font-semibold ${gradeColorClass}`}>{score?.grade ?? 'Log data'}</span>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <p className="text-xs text-text-secondary font-medium uppercase tracking-wide">Resilience Pillars</p>
                  {score && (
                    <>
                      <PillarBar label="Sleep" value={score.pillars.sleep} icon={Moon} />
                      <PillarBar label="Nutrition" value={score.pillars.nutrition} icon={Apple} />
                      <PillarBar label="Stress" value={score.pillars.stress} icon={Wind} />
                      <PillarBar label="Exercise" value={score.pillars.exercise} icon={Dumbbell} />
                      {score.gutBonus && (
                        <p className="text-[11px] text-green-500 font-medium">+5 gut bonus applied ✓</p>
                      )}
                    </>
                  )}
                  {!score && <p className="text-sm text-text-secondary">Fill in your data to see your score</p>}
                </div>
              </div>

              {score && score.recommendations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border space-y-1.5">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Recommendations</p>
                  {score.recommendations.map((r, i) => (
                    <p key={i} className="text-xs text-text-secondary flex gap-2"><span className="text-primary mt-0.5">•</span>{r}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Form */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-6">
              {/* Sleep */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-text-primary flex items-center gap-2"><Moon className="w-4 h-4 text-blue-400" />Sleep Hours</label>
                  <span className="text-primary font-bold text-lg">{form.sleep_hours}h</span>
                </div>
                <input type="range" min={0} max={12} step={0.5} value={form.sleep_hours}
                  onChange={(e) => updateForm('sleep_hours', parseFloat(e.target.value))}
                  className="w-full accent-primary" />
                <div className="flex justify-between text-[10px] text-text-secondary">
                  <span>0h</span><span className="text-green-500">≥7h optimal</span><span>12h</span>
                </div>
              </div>

              {/* Stress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-text-primary flex items-center gap-2"><Wind className="w-4 h-4 text-purple-400" />Stress Level</label>
                  <span className={`font-bold text-lg ${form.stress_level >= 7 ? 'text-red-500' : form.stress_level >= 5 ? 'text-yellow-500' : 'text-green-500'}`}>{form.stress_level}/10</span>
                </div>
                <input type="range" min={1} max={10} step={1} value={form.stress_level}
                  onChange={(e) => updateForm('stress_level', parseInt(e.target.value))}
                  className="w-full accent-primary" />
                <div className="flex justify-between text-[10px] text-text-secondary">
                  <span>1 Calm</span><span>10 Very stressed</span>
                </div>
              </div>

              {/* Exercise */}
              <div className="space-y-3">
                <label className="font-semibold text-text-primary flex items-center gap-2"><Dumbbell className="w-4 h-4 text-green-400" />Exercise</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-text-secondary">Minutes</p>
                    <input type="number" min={0} max={300} value={form.exercise_minutes}
                      onChange={(e) => updateForm('exercise_minutes', parseInt(e.target.value) || 0)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-text-secondary">Intensity</p>
                    <select value={form.exercise_intensity}
                      onChange={(e) => updateForm('exercise_intensity', e.target.value as ImmuneLog['exercise_intensity'])}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-primary">
                      <option value="none">None</option>
                      <option value="light">Light</option>
                      <option value="moderate">Moderate</option>
                      <option value="vigorous">Vigorous</option>
                    </select>
                  </div>
                </div>
                <p className="text-[11px] text-text-secondary">30–60 min moderate = peak immune boost (Gleeson 2011). &gt;90 min vigorous = overtraining risk.</p>
              </div>

              {/* Fiber + Probiotic */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-text-primary">Fiber (g)</label>
                  <input type="number" min={0} max={100} step={0.5} value={form.fiber_g}
                    onChange={(e) => updateForm('fiber_g', parseFloat(e.target.value) || 0)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-primary" />
                  <p className="text-[10px] text-text-secondary">≥25g for gut bonus</p>
                </div>
                <div className="flex flex-col justify-center space-y-2">
                  <label className="text-sm font-semibold text-text-primary">Probiotic Taken</label>
                  <button
                    onClick={() => updateForm('probiotic_taken', !form.probiotic_taken)}
                    className={`w-full py-2 rounded-xl border text-sm font-medium transition-colors ${
                      form.probiotic_taken
                        ? 'bg-green-500/10 border-green-500/40 text-green-500'
                        : 'bg-surface border-border text-text-secondary'
                    }`}
                  >
                    {form.probiotic_taken ? '✓ Yes' : 'No'}
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-text-primary">Notes</label>
                <textarea rows={2} value={form.notes ?? ''}
                  onChange={(e) => updateForm('notes', e.target.value)}
                  placeholder="How are you feeling today?"
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-text-primary text-sm resize-none focus:outline-none focus:border-primary" />
              </div>
            </div>

            {/* Symptoms */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-text-primary">Symptom Diary</h3>
                {score && (
                  <span className="text-xs text-text-secondary">Burden: <strong className={score.symptomBurden > 50 ? 'text-red-500' : 'text-text-primary'}>{score.symptomBurden}%</strong></span>
                )}
              </div>
              <p className="text-xs text-text-secondary">Rate each symptom: 0 none · 1 mild · 2 moderate · 3 severe</p>
              <div className="grid grid-cols-1 gap-3">
                {IMMUNE_SYMPTOMS.map((symptom) => {
                  const val = (form.symptoms[symptom] as number) ?? 0
                  return (
                    <div key={symptom} className="flex items-center gap-3">
                      <span className="text-sm text-text-primary w-28 shrink-0">{symptom}</span>
                      <div className="flex gap-1.5 flex-1">
                        {[0, 1, 2, 3].map((level) => (
                          <button
                            key={level}
                            onClick={() => updateSymptom(symptom, level)}
                            className={`flex-1 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                              val === level
                                ? level === 0 ? 'bg-green-500/20 border-green-500/40 text-green-500'
                                  : level === 1 ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-600'
                                  : level === 2 ? 'bg-orange-500/20 border-orange-500/40 text-orange-500'
                                  : 'bg-red-500/20 border-red-500/40 text-red-500'
                                : 'bg-background border-border text-text-secondary hover:border-border/80'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 rounded-2xl bg-primary text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Today\'s Log'}
            </button>
          </>
        )}

        {/* ─── NUTRIENTS TAB ─── */}
        {tab === 'nutrients' && (
          <>
            {/* Nutrient inputs */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-5">
              <h3 className="font-semibold text-text-primary">Log Immune Nutrients</h3>
              <div className="grid grid-cols-2 gap-4">
                {IMMUNE_NUTRIENTS.map((n) => (
                  <div key={n.key} className="space-y-1">
                    <label className="text-xs text-text-secondary">{n.name} ({n.unit})</label>
                    <input type="number" min={0} step={n.unit === 'IU' ? 50 : 1} value={(form[n.key] as number) ?? 0}
                      onChange={(e) => updateForm(n.key, parseFloat(e.target.value) || 0)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-primary" />
                    <p className="text-[10px] text-text-secondary">RDA: {n.rda}{n.unit}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>

            {/* Nutrient cards */}
            <div className="space-y-4">
              {IMMUNE_NUTRIENTS.map((n) => {
                const intake = (form[n.key] as number) ?? 0
                const rdaPct = Math.min(100, Math.round((intake / n.rda) * 100))
                const therPct = Math.min(100, Math.round((intake / n.therapeutic) * 100))
                const colorMap: Record<string, string> = {
                  orange: 'bg-orange-500',
                  yellow: 'bg-yellow-500',
                  blue: 'bg-blue-500',
                  green: 'bg-green-500',
                }
                const barColor = colorMap[n.color] ?? 'bg-primary'
                const isExpanded = expandedNutrient === n.key

                return (
                  <div key={n.key} className="bg-surface border border-border rounded-2xl overflow-hidden">
                    <div className="p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${barColor}`} />
                          <h4 className="font-semibold text-text-primary">{n.name}</h4>
                        </div>
                        <span className="text-lg font-bold text-text-primary">{intake} {n.unit}</span>
                      </div>

                      {/* RDA bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-text-secondary">
                          <span>vs RDA ({n.rda}{n.unit})</span>
                          <span className={rdaPct >= 100 ? 'text-green-500 font-semibold' : ''}>{rdaPct}%</span>
                        </div>
                        <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${rdaPct}%` }} />
                        </div>
                      </div>

                      {/* Therapeutic bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-text-secondary">
                          <span>vs Therapeutic ({n.therapeutic}{n.unit})</span>
                          <span>{therPct}%</span>
                        </div>
                        <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 opacity-60 ${barColor}`} style={{ width: `${therPct}%` }} />
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {rdaPct >= 100 ? (
                          <span className="text-xs text-green-500 font-medium">✓ RDA met</span>
                        ) : (
                          <span className="text-xs text-orange-500 font-medium">
                            +{Math.round(n.rda - intake)} {n.unit} to reach RDA
                          </span>
                        )}
                      </div>

                      {/* Expandable why-it-matters */}
                      <button
                        onClick={() => setExpandedNutrient(isExpanded ? null : n.key)}
                        className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                      >
                        <Info className="w-3 h-3" />
                        Why it matters
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-0 border-t border-border">
                        <p className="text-xs text-text-secondary leading-relaxed mt-3">{n.why}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ─── TRENDS TAB ─── */}
        {tab === 'trends' && (
          <>
            {logs.length === 0 && (
              <div className="text-center py-12 text-text-secondary">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No data yet</p>
                <p className="text-sm mt-1">Log your first entry in the Today tab</p>
              </div>
            )}

            {logs.length > 0 && (
              <>
                {/* 30-day score line chart */}
                <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
                  <h3 className="font-semibold text-text-primary">Immune Resilience Score — 30 Days</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={trendData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: 12 }}
                        labelStyle={{ color: 'var(--text-primary)' }}
                      />
                      <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3, fill: 'var(--primary)' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Symptom frequency bar chart */}
                <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
                  <h3 className="font-semibold text-text-primary">Symptom Frequency (days reported)</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={symptomFreqData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: 12 }}
                      />
                      <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Average pillars radar */}
                {avgPillars && (
                  <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
                    <h3 className="font-semibold text-text-primary">Average Pillar Scores</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {avgPillars.map(({ pillar, value }) => {
                        const col = value >= 75 ? 'bg-green-500' : value >= 50 ? 'bg-yellow-500' : value >= 30 ? 'bg-orange-500' : 'bg-red-500'
                        return (
                          <div key={pillar} className="bg-background rounded-xl p-3 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-text-secondary">{pillar}</span>
                              <span className="font-bold text-text-primary">{value}</span>
                            </div>
                            <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${col}`} style={{ width: `${value}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <RadarChart data={avgPillars} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                        <PolarGrid stroke="var(--border)" />
                        <PolarAngleAxis dataKey="pillar" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                        <Radar name="Avg" dataKey="value" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Avg Score', value: Math.round(trendData.reduce((a, b) => a + b.score, 0) / trendData.length) },
                    { label: 'Days Logged', value: logs.length },
                    { label: 'Best Score', value: Math.max(...trendData.map((d) => d.score)) },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-surface border border-border rounded-2xl p-4 text-center">
                      <p className="text-2xl font-bold text-text-primary">{value}</p>
                      <p className="text-xs text-text-secondary mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </>
  )
}
