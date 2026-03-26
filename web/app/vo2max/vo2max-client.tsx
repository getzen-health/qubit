'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowLeft, Wind, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Trophy, Activity, Heart, Footprints } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { cn } from '@/lib/utils'
import {
  estimateCooper,
  estimateRestingHR,
  estimateOneMileWalk,
  getCRFCategory,
  getPercentile,
  analyzeVO2Max,
  predictDecline,
  CRF_BG_COLORS,
  CRF_COLORS,
  MET_ACTIVITIES,
  type VO2MaxTest,
  type VO2MaxAnalysis,
  type TestMethod,
  type Sex,
  type CRFCategory,
} from '@/lib/vo2max'
import {
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'

const LineChart = dynamic(() => import('recharts').then((m) => ({ default: m.LineChart })), { ssr: false })

// ─── types ────────────────────────────────────────────────────────────────────
type Tab = 'test' | 'analysis' | 'history'

// ─── helpers ─────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const METHOD_LABELS: Record<TestMethod, string> = {
  cooper_12min: 'Cooper 12-Min',
  resting_hr: 'Resting HR',
  one_mile_walk: '1-Mile Walk',
}

// ─── sub-components ───────────────────────────────────────────────────────────
function CategoryBadge({ category }: { category: CRFCategory }) {
  return (
    <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold border', CRF_BG_COLORS[category])}>
      {category}
    </span>
  )
}

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-text-primary hover:bg-surface-secondary transition-colors"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4 text-text-secondary" /> : <ChevronDown className="w-4 h-4 text-text-secondary" />}
      </button>
      {open && <div className="px-4 pb-4 text-sm text-text-secondary space-y-1">{children}</div>}
    </div>
  )
}

// ─── Test Tab ─────────────────────────────────────────────────────────────────
function TestTab({
  onSaved,
}: {
  onSaved: (test: VO2MaxTest, analysis: VO2MaxAnalysis) => void
}) {
  const [method, setMethod] = useState<TestMethod>('cooper_12min')
  const [distanceM, setDistanceM] = useState(2400)
  const [restingHR, setRestingHR] = useState(60)
  const [maxHR, setMaxHR] = useState(190)
  const [useAgeFormula, setUseAgeFormula] = useState(false)
  const [walkMinutes, setWalkMinutes] = useState(15)
  const [walkSeconds, setWalkSeconds] = useState(0)
  const [walkEndHR, setWalkEndHR] = useState(120)
  const [weightLbs, setWeightLbs] = useState(154)
  const [age, setAge] = useState(30)
  const [sex, setSex] = useState<Sex>('male')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Derived: live VO2max estimate
  const effectiveMaxHR = useAgeFormula ? 220 - age : maxHR
  const walkTimeMins = walkMinutes + walkSeconds / 60

  let liveVO2 = 0
  if (method === 'cooper_12min') liveVO2 = Math.max(estimateCooper(distanceM), 0)
  else if (method === 'resting_hr') liveVO2 = Math.max(estimateRestingHR(restingHR, effectiveMaxHR), 0)
  else liveVO2 = Math.max(estimateOneMileWalk({ timeMins: walkTimeMins, endHR: walkEndHR, weightLbs, age, sex }), 0)

  const liveCategory = getCRFCategory(liveVO2, age, sex)
  const livePercentile = getPercentile(liveVO2, age, sex)
  const liveMET = Math.round((liveVO2 / 3.5) * 10) / 10

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        date: new Date().toISOString().split('T')[0],
        method,
        age,
        sex,
        notes: notes || null,
      }
      if (method === 'cooper_12min') body.distance_meters = distanceM
      else if (method === 'resting_hr') { body.resting_hr = restingHR; body.max_hr = effectiveMaxHR }
      else { body.walk_time_min = walkTimeMins; body.walk_end_hr = walkEndHR; body.weight_lbs = weightLbs }

      const res = await fetch('/api/vo2max', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to save')
      onSaved(json.test, json.analysis)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  const methodCards: { method: TestMethod; label: string; icon: React.ReactNode; desc: string }[] = [
    { method: 'cooper_12min', label: 'Cooper 12-Min Run', icon: <Footprints className="w-5 h-5" />, desc: 'Distance in 12 minutes' },
    { method: 'resting_hr', label: 'Resting HR Method', icon: <Heart className="w-5 h-5" />, desc: 'Uses HR max & resting HR' },
    { method: 'one_mile_walk', label: '1-Mile Walk Test', icon: <Activity className="w-5 h-5" />, desc: 'Kline et al. 1987' },
  ]

  return (
    <div className="space-y-5">
      {/* Method selector */}
      <div className="grid grid-cols-3 gap-2">
        {methodCards.map((m) => (
          <button
            key={m.method}
            onClick={() => setMethod(m.method)}
            className={cn(
              'flex flex-col items-center gap-2 p-3 rounded-2xl border transition-colors text-center',
              method === m.method
                ? 'bg-primary/10 border-primary/40 text-primary'
                : 'bg-surface border-border text-text-secondary hover:text-text-primary'
            )}
          >
            {m.icon}
            <span className="text-[11px] font-semibold leading-tight">{m.label}</span>
            <span className="text-[10px] leading-tight opacity-70">{m.desc}</span>
          </button>
        ))}
      </div>

      {/* Method-specific inputs */}
      <div className="bg-surface rounded-2xl border border-border p-4 space-y-4">
        {method === 'cooper_12min' && (
          <>
            <Accordion title="How to perform the Cooper 12-Min Run">
              <p>1. Warm up for 5–10 minutes with light jogging.</p>
              <p>2. Run/walk as far as possible for exactly 12 minutes on a measured track.</p>
              <p>3. Record total distance in meters (400m track = 1 lap).</p>
              <p>4. Cool down after the test. Formula: VO2max = (d − 504.9) / 44.73</p>
              <p className="mt-1 text-xs opacity-60">Source: Cooper KH (1968). JAMA 203(3):201–4.</p>
            </Accordion>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Distance covered: {distanceM} m</label>
              <input
                type="range"
                min={500}
                max={4000}
                step={50}
                value={distanceM}
                onChange={(e) => setDistanceM(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-text-secondary mt-0.5">
                <span>500 m</span><span>4 000 m</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Or type distance (m)</label>
              <input
                type="number"
                value={distanceM}
                onChange={(e) => setDistanceM(Number(e.target.value))}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </>
        )}

        {method === 'resting_hr' && (
          <>
            <Accordion title="How to measure resting heart rate">
              <p>1. Measure resting HR first thing in the morning before getting out of bed.</p>
              <p>2. Use a fitness tracker or count pulse for 60 seconds at wrist/neck.</p>
              <p>3. For max HR: use 220 − age (estimated) or recent peak HR from exercise.</p>
              <p>Formula: VO2max = 15 × (HRmax / HRrest)</p>
              <p className="mt-1 text-xs opacity-60">Source: Uth N et al. (2004). Eur J Appl Physiol 91(1):111–5.</p>
            </Accordion>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">Resting HR (bpm)</label>
                <input type="number" value={restingHR} onChange={(e) => setRestingHR(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">
                  Max HR (bpm) {useAgeFormula && <span className="text-primary">= {effectiveMaxHR}</span>}
                </label>
                <input type="number" value={maxHR} onChange={(e) => setMaxHR(Number(e.target.value))} disabled={useAgeFormula}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input type="checkbox" checked={useAgeFormula} onChange={(e) => setUseAgeFormula(e.target.checked)} className="accent-primary" />
              Use 220 − age formula for HRmax
            </label>
          </>
        )}

        {method === 'one_mile_walk' && (
          <>
            <Accordion title="How to perform the 1-Mile Walk Test">
              <p>1. Walk 1 mile (1.609 km) as fast as possible without running.</p>
              <p>2. Record total time (minutes and seconds).</p>
              <p>3. Immediately record your heart rate at finish.</p>
              <p>4. Weigh yourself beforehand in pounds.</p>
              <p className="mt-1 text-xs opacity-60">Source: Kline GM et al. (1987). Med Sci Sports Exerc 19(3):253–9.</p>
            </Accordion>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">Walk time (min)</label>
                <input type="number" value={walkMinutes} onChange={(e) => setWalkMinutes(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">Seconds</label>
                <input type="number" min={0} max={59} value={walkSeconds} onChange={(e) => setWalkSeconds(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">End HR (bpm)</label>
                <input type="number" value={walkEndHR} onChange={(e) => setWalkEndHR(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">Weight (lbs)</label>
                <input type="number" value={weightLbs} onChange={(e) => setWeightLbs(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
            </div>
          </>
        )}

        {/* Age & Sex — shared */}
        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border">
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Age</label>
            <input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Biological Sex</label>
            <select value={sex} onChange={(e) => setSex(e.target.value as Sex)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>
      </div>

      {/* Live Result Card */}
      {liveVO2 > 0 && (
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-end gap-2">
            <span className="text-5xl font-extrabold text-text-primary tabular-nums">{liveVO2.toFixed(1)}</span>
            <span className="text-sm text-text-secondary mb-2">ml/kg/min</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={liveCategory} />
            <span className="text-xs text-text-secondary">ACSM norm for age {age} {sex}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background rounded-xl border border-border p-3 text-center">
              <p className="text-[10px] text-text-secondary uppercase tracking-wide mb-1">Percentile</p>
              <p className="text-xl font-bold text-text-primary">~{Math.round(livePercentile)}%</p>
              <p className="text-[10px] text-text-secondary">of your age/sex group</p>
            </div>
            <div className="bg-background rounded-xl border border-border p-3 text-center">
              <p className="text-[10px] text-text-secondary uppercase tracking-wide mb-1">MET Capacity</p>
              <p className="text-xl font-bold text-text-primary">{liveMET}</p>
              <p className="text-[10px] text-text-secondary">METs sustainable</p>
            </div>
          </div>

          {/* Mortality benefit — Myers et al. 2002 */}
          {liveCategory !== 'Superior' && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 text-xs text-text-secondary">
              <p className="font-semibold text-blue-400 mb-0.5">Mortality Benefit (Myers 2002, NEJM)</p>
              <p>Each 1-MET increase in CRF = ~12% reduction in all-cause mortality risk. Moving up one fitness category substantially extends healthspan.</p>
            </div>
          )}
        </div>
      )}

      {/* Notes & Save */}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Optional notes (conditions, time of day, etc.)"
        rows={2}
        className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving || liveVO2 <= 0}
        className="w-full bg-primary text-white font-semibold py-3 rounded-2xl disabled:opacity-50 transition-opacity hover:opacity-90"
      >
        {saving ? 'Saving…' : 'Save Test Result'}
      </button>
    </div>
  )
}

// ─── Analysis Tab ─────────────────────────────────────────────────────────────
function AnalysisTab({ test, analysis }: { test: VO2MaxTest | null; analysis: VO2MaxAnalysis | null }) {
  if (!test || !analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-secondary space-y-2">
        <Wind className="w-10 h-10 opacity-30" />
        <p className="text-sm">Run a test first to see your analysis.</p>
      </div>
    )
  }

  const age = test.age ?? 30
  const years = Array.from({ length: 11 }, (_, i) => i)
  const declineData = years.map((y) => ({
    year: `+${y}yr`,
    sedentary: analysis.ageAdjustedDecline.sedentary[y],
    active: analysis.ageAdjustedDecline.active[y],
    current: y === 0 ? analysis.vo2max : null,
  }))

  const accessibleActivities = MET_ACTIVITIES.filter((a) => a.mets <= analysis.metCapacity)
  const borderlineActivities = MET_ACTIVITIES.filter(
    (a) => a.mets > analysis.metCapacity && a.mets <= analysis.metCapacity + 2
  )

  return (
    <div className="space-y-5">
      {/* Training recommendation */}
      <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" /> Training Recommendation
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background rounded-xl border border-border p-3 text-center">
            <p className="text-[10px] text-text-secondary uppercase tracking-wide mb-1">Zone 2</p>
            <p className="text-xl font-bold text-text-primary">{analysis.trainingRecommendation.zone2Minutes}</p>
            <p className="text-[10px] text-text-secondary">min/week</p>
          </div>
          <div className="bg-background rounded-xl border border-border p-3 text-center">
            <p className="text-[10px] text-text-secondary uppercase tracking-wide mb-1">HIIT Sessions</p>
            <p className="text-xl font-bold text-text-primary">{analysis.trainingRecommendation.hiitSessions}</p>
            <p className="text-[10px] text-text-secondary">per week</p>
          </div>
        </div>
        <p className="text-xs text-text-secondary">{analysis.trainingRecommendation.rationale}</p>
        <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3 text-xs text-text-secondary">
          <span className="font-semibold text-green-400">12-Week Potential: </span>
          Structured training could improve VO2max by ~{analysis.improvementPotential} ml/kg/min
          {test.age ? ` (≈ ${getCRFCategory(analysis.vo2max + analysis.improvementPotential, test.age, test.sex ?? 'male')} category)` : ''}.
        </div>
      </div>

      {/* 10-year VO2max decline chart */}
      <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
        <h3 className="font-semibold text-text-primary">10-Year VO2max Projection</h3>
        <p className="text-xs text-text-secondary">
          Sedentary decline ~1%/yr · Active decline ~0.5%/yr (Blair 1995, JAMA)
        </p>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={declineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} />
              <Tooltip
                contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="sedentary" stroke="#ef4444" dot={false} strokeWidth={2} name="Sedentary decline" />
              <Line type="monotone" dataKey="active" stroke="#22c55e" dot={false} strokeWidth={2} name="Active decline" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Mortality benefit */}
      <div className="bg-surface rounded-2xl border border-border p-4 space-y-2">
        <h3 className="font-semibold text-text-primary">Cardiorespiratory Fitness & Mortality</h3>
        <p className="text-xs text-text-secondary">Blair et al. 1995 (JAMA): CRF is the strongest independent predictor of all-cause mortality — stronger than smoking, hypertension, or high cholesterol.</p>
        <div className={cn('rounded-xl p-3 border text-sm font-medium', CRF_BG_COLORS[analysis.category])}>
          {analysis.mortalityBenefit}
        </div>
        <div className="space-y-1.5 pt-1">
          {(['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent', 'Superior'] as CRFCategory[]).map((cat, i) => {
            const relRisks = [2.5, 1.9, 1.4, 1.1, 1.0, 0.75]
            const isActive = cat === analysis.category
            return (
              <div key={cat} className={cn('flex items-center gap-2 rounded-lg px-3 py-2', isActive ? CRF_BG_COLORS[cat] : 'bg-background border border-border')}>
                <div className="flex-1">
                  <span className="text-xs font-semibold text-text-primary">{cat}</span>
                </div>
                <div className="text-xs text-text-secondary">
                  Relative risk: <span className="font-bold text-text-primary">{relRisks[i]}×</span>
                </div>
                <div
                  className="h-2 rounded-full bg-current opacity-60"
                  style={{ width: `${(relRisks[i] / 2.5) * 80}px` }}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* MET Activity Table */}
      <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
        <h3 className="font-semibold text-text-primary">
          Activities at Your MET Capacity ({analysis.metCapacity} METs)
        </h3>
        <div className="space-y-1.5">
          {accessibleActivities.map((a) => (
            <div key={a.activity} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
              <span className="text-sm text-text-primary">{a.activity}</span>
              <span className="text-xs font-semibold text-green-500">{a.mets} METs ✓</span>
            </div>
          ))}
          {borderlineActivities.map((a) => (
            <div key={a.activity} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
              <span className="text-sm text-text-secondary">{a.activity}</span>
              <span className="text-xs font-semibold text-yellow-500">{a.mets} METs ≈</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-text-secondary">VO2max / 3.5 = MET capacity. ✓ accessible, ≈ borderline</p>
      </div>
    </div>
  )
}

// ─── History Tab ──────────────────────────────────────────────────────────────
function HistoryTab({ tests }: { tests: VO2MaxTest[] }) {
  if (tests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-secondary space-y-2">
        <Wind className="w-10 h-10 opacity-30" />
        <p className="text-sm">No tests yet. Complete a test to see your history.</p>
      </div>
    )
  }

  const best = [...tests].sort((a, b) => b.vo2max_estimated - a.vo2max_estimated)[0]
  const latest = tests[0]
  const prev = tests[1]
  const delta = prev ? latest.vo2max_estimated - prev.vo2max_estimated : null

  const chartData = [...tests]
    .reverse()
    .map((t) => ({ date: t.date.slice(5), vo2max: t.vo2max_estimated }))

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface rounded-2xl border border-border p-3 text-center">
          <p className="text-[10px] text-text-secondary uppercase tracking-wide mb-1">Best Ever</p>
          <p className="text-xl font-bold text-text-primary">{best.vo2max_estimated.toFixed(1)}</p>
          <p className="text-[10px] text-text-secondary">ml/kg/min</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-3 text-center">
          <p className="text-[10px] text-text-secondary uppercase tracking-wide mb-1">Latest</p>
          <p className="text-xl font-bold text-text-primary">{latest.vo2max_estimated.toFixed(1)}</p>
          <p className="text-[10px] text-text-secondary">ml/kg/min</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-3 text-center">
          <p className="text-[10px] text-text-secondary uppercase tracking-wide mb-1">Change</p>
          <p className={cn('text-xl font-bold', delta == null ? 'text-text-secondary' : delta >= 0 ? 'text-green-500' : 'text-red-500')}>
            {delta == null ? '—' : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}`}
          </p>
          {delta !== null && (
            delta >= 0
              ? <TrendingUp className="w-3 h-3 text-green-500 mx-auto" />
              : <TrendingDown className="w-3 h-3 text-red-500 mx-auto" />
          )}
        </div>
      </div>

      {/* Trend chart */}
      {chartData.length >= 2 && (
        <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
          <h3 className="font-semibold text-text-primary">VO2max Trend</h3>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} />
                <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="vo2max" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 4, fill: 'var(--color-primary)' }} name="VO2max" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Test list */}
      <div className="space-y-2">
        {tests.map((t) => (
          <div key={t.id ?? t.date} className="bg-surface rounded-2xl border border-border p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-text-primary">{t.vo2max_estimated.toFixed(1)} ml/kg/min</span>
                <CategoryBadge category={t.crf_category} />
                <span className="text-[10px] bg-surface-secondary border border-border text-text-secondary px-2 py-0.5 rounded-full">
                  {METHOD_LABELS[t.method]}
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">{fmtDate(t.date)} · {t.met_capacity} METs</p>
              {t.notes && <p className="text-xs text-text-secondary mt-0.5 italic truncate">{t.notes}</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-text-secondary">~{t.percentile}th %ile</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function VO2MaxClient() {
  const [activeTab, setActiveTab] = useState<Tab>('test')
  const [tests, setTests] = useState<VO2MaxTest[]>([])
  const [latestTest, setLatestTest] = useState<VO2MaxTest | null>(null)
  const [analysis, setAnalysis] = useState<VO2MaxAnalysis | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/vo2max')
      if (res.ok) {
        const json = await res.json()
        setTests(json.tests ?? [])
        setLatestTest(json.latest ?? null)
        setAnalysis(json.analysis ?? null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  function handleSaved(test: VO2MaxTest, newAnalysis: VO2MaxAnalysis) {
    setTests((prev) => [test, ...prev])
    setLatestTest(test)
    setAnalysis(newAnalysis)
    setActiveTab('analysis')
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'test', label: 'Test' },
    { id: 'analysis', label: 'Analysis' },
    { id: 'history', label: `History${tests.length > 0 ? ` (${tests.length})` : ''}` },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">VO2max Estimator</h1>
            <p className="text-sm text-text-secondary">Cardiorespiratory fitness tracker</p>
          </div>
          <Wind className="w-5 h-5 text-primary" />
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4 pb-2">
          <div className="flex gap-1 bg-surface rounded-xl p-1 border border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 pb-28">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'test' && <TestTab onSaved={handleSaved} />}
            {activeTab === 'analysis' && <AnalysisTab test={latestTest} analysis={analysis} />}
            {activeTab === 'history' && <HistoryTab tests={tests} />}
          </>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
