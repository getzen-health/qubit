'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Activity, ChevronDown, ChevronUp, Plus, Minus,
  TrendingUp, BarChart2, History, FlaskConical, Info
} from 'lucide-react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend,
} from 'recharts'
import { BottomNav } from '@/components/bottom-nav'
import { cn } from '@/lib/utils'
import {
  analyzeFunctionalFitness,
  analyzeGripStrength,
  analyzeGaitSpeed,
  analyzeChairStand,
  analyzeBalanceEyesOpen,
  analyzeBalanceEyesClosed,
  analyzeWalkTest,
  GRADE_BG,
  GRADE_COLORS,
  RISK_COLORS,
  type FunctionalFitnessTest,
  type FunctionalFitnessAnalysis,
  type TestGrade,
  type Sex,
} from '@/lib/functional-fitness'

// ─── Types ────────────────────────────────────────────────────────────────────

interface HistoryEntry {
  test: FunctionalFitnessTest
  analysis: FunctionalFitnessAnalysis
}

type Tab = 'test' | 'results' | 'history'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function GradeBadge({ grade }: { grade: TestGrade }) {
  return (
    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border', GRADE_BG[grade])}>
      {grade}
    </span>
  )
}

function SectionCard({ title, icon: Icon, open, onToggle, children }: {
  title: string
  icon: React.ElementType
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <span className="font-semibold text-text-primary text-sm">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-text-secondary" /> : <ChevronDown className="w-4 h-4 text-text-secondary" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  )
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 text-xs text-text-secondary">
      <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FunctionalFitnessClient() {
  const [activeTab, setActiveTab] = useState<Tab>('test')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Form state
  const [age, setAge] = useState('')
  const [sex, setSex] = useState<Sex>('male')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')

  // Test values
  const [gripKg, setGripKg] = useState('')
  const [gripLbs, setGripLbs] = useState(false)
  const [gaitDistance, setGaitDistance] = useState('4')
  const [gaitTime, setGaitTime] = useState('')
  const [chairReps, setChairReps] = useState(0)
  const [balanceOpen, setBalanceOpen] = useState('')
  const [balanceClosed, setBalanceClosed] = useState('')
  const [walkMeters, setWalkMeters] = useState('')

  // Section open state
  const [openSections, setOpenSections] = useState({
    grip: true, gait: false, chair: false, balance: false, walk: false,
  })

  // Analysis result after Calculate
  const [liveAnalysis, setLiveAnalysis] = useState<FunctionalFitnessAnalysis | null>(null)
  const [showResults, setShowResults] = useState(false)

  const toggleSection = (k: keyof typeof openSections) =>
    setOpenSections(prev => ({ ...prev, [k]: !prev[k] }))

  // ── Live previews ──────────────────────────────────────────────────────────

  const ageNum = parseInt(age) || 0
  const gripNum = gripLbs
    ? (parseFloat(gripKg) / 2.205)
    : parseFloat(gripKg)
  const gaitMps = gaitTime && parseFloat(gaitTime) > 0
    ? parseFloat(gaitDistance) / parseFloat(gaitTime)
    : undefined
  const heightNum = parseFloat(heightCm) || undefined
  const weightNum = parseFloat(weightKg) || undefined

  const liveGrip = ageNum > 0 && gripNum > 0
    ? analyzeGripStrength(gripNum, ageNum, sex) : null
  const liveGait = gaitMps !== undefined && gaitMps > 0
    ? analyzeGaitSpeed(gaitMps) : null
  const liveChair = ageNum > 0 && chairReps > 0
    ? analyzeChairStand(chairReps, ageNum, sex) : null
  const liveBalOpen = ageNum > 0 && balanceOpen
    ? analyzeBalanceEyesOpen(parseFloat(balanceOpen), ageNum) : null
  const liveBalClosed = ageNum > 0 && balanceClosed
    ? analyzeBalanceEyesClosed(parseFloat(balanceClosed), ageNum) : null
  const liveWalk = ageNum > 0 && walkMeters
    ? analyzeWalkTest(parseFloat(walkMeters), ageNum, sex, heightNum, weightNum) : null

  // ── Load history ───────────────────────────────────────────────────────────

  const loadHistory = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/functional-fitness')
      if (res.ok) {
        const json = await res.json()
        setHistory(json.tests ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  // ── Calculate composite ────────────────────────────────────────────────────

  const handleCalculate = () => {
    if (!ageNum) return
    const test: FunctionalFitnessTest = {
      date: new Date().toISOString().slice(0, 10),
      age: ageNum,
      sex,
      height_cm: heightNum,
      weight_kg: weightNum,
      grip_strength_kg: gripNum > 0 ? gripNum : undefined,
      gait_speed_mps: gaitMps,
      gait_distance_m: parseFloat(gaitDistance) || undefined,
      gait_time_sec: parseFloat(gaitTime) || undefined,
      chair_stand_reps: chairReps > 0 ? chairReps : undefined,
      balance_eyes_open_sec: balanceOpen ? parseFloat(balanceOpen) : undefined,
      balance_eyes_closed_sec: balanceClosed ? parseFloat(balanceClosed) : undefined,
      walk_6min_meters: walkMeters ? parseFloat(walkMeters) : undefined,
    }
    const analysis = analyzeFunctionalFitness(test)
    setLiveAnalysis(analysis)
    setShowResults(true)
    setActiveTab('results')
  }

  // ── Save to DB ─────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!ageNum || !liveAnalysis) return
    setSaving(true)
    setSaveError('')
    try {
      const body: Partial<FunctionalFitnessTest> = {
        date: new Date().toISOString().slice(0, 10),
        age: ageNum,
        sex,
        height_cm: heightNum,
        weight_kg: weightNum,
        grip_strength_kg: gripNum > 0 ? gripNum : undefined,
        gait_distance_m: parseFloat(gaitDistance) || undefined,
        gait_time_sec: parseFloat(gaitTime) || undefined,
        chair_stand_reps: chairReps > 0 ? chairReps : undefined,
        balance_eyes_open_sec: balanceOpen ? parseFloat(balanceOpen) : undefined,
        balance_eyes_closed_sec: balanceClosed ? parseFloat(balanceClosed) : undefined,
        walk_6min_meters: walkMeters ? parseFloat(walkMeters) : undefined,
      }
      const res = await fetch('/api/functional-fitness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        setSaveError(err.error ?? 'Failed to save')
      } else {
        await loadHistory()
      }
    } finally {
      setSaving(false)
    }
  }

  // ─── Radar chart data ────────────────────────────────────────────────────

  const radarData = liveAnalysis ? [
    { subject: 'Grip', value: liveAnalysis.gripStrength?.percentile ?? 0, fullMark: 100 },
    { subject: 'Gait', value: liveAnalysis.gaitSpeed?.percentile ?? 0, fullMark: 100 },
    { subject: 'Chair', value: liveAnalysis.chairStand?.percentile ?? 0, fullMark: 100 },
    { subject: 'Balance', value: Math.round(((liveAnalysis.balanceEyesOpen?.percentile ?? 0) + (liveAnalysis.balanceEyesClosed?.percentile ?? 0)) / 2) || 0, fullMark: 100 },
    { subject: '6-Min Walk', value: liveAnalysis.walkTest?.percentile ?? 0, fullMark: 100 },
  ] : []

  // ─── History trend data ──────────────────────────────────────────────────

  const trendData = [...history].reverse().map(h => ({
    date: h.test.date,
    functionalAge: h.analysis.functionalAge,
    grip: h.analysis.gripStrength?.percentile,
    gait: h.analysis.gaitSpeed?.percentile,
    chair: h.analysis.chairStand?.percentile,
  }))

  // ─── Functional Age color ────────────────────────────────────────────────

  const faColor = (adj: number) => {
    if (adj <= -3) return 'text-green-500'
    if (adj <= 0) return 'text-teal-400'
    if (adj <= 3) return 'text-orange-400'
    return 'text-red-500'
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="p-1.5 rounded-xl hover:bg-surface border border-transparent hover:border-border transition-colors">
            <ArrowLeft className="w-4 h-4 text-text-secondary" />
          </Link>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h1 className="font-bold text-text-primary text-base">Functional Fitness</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4">
        {/* Tabs */}
        <div className="flex bg-surface border border-border rounded-2xl p-1 gap-1 mb-5">
          {([['test', 'Test', FlaskConical], ['results', 'Results', BarChart2], ['history', 'History', History]] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-colors',
                activeTab === id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── TEST TAB ───────────────────────────────────────────────── */}
        {activeTab === 'test' && (
          <div className="space-y-3">
            {/* Basics */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Your Profile</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Age</label>
                  <input
                    type="number" min={10} max={120}
                    value={age} onChange={e => setAge(e.target.value)}
                    placeholder="e.g. 45"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Sex</label>
                  <div className="flex rounded-xl border border-border overflow-hidden">
                    {(['male', 'female'] as Sex[]).map(s => (
                      <button key={s} onClick={() => setSex(s)}
                        className={cn('flex-1 py-2 text-sm capitalize transition-colors',
                          sex === s ? 'bg-primary text-white' : 'bg-background text-text-secondary hover:text-text-primary'
                        )}
                      >{s}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Height (cm) — optional</label>
                  <input
                    type="number" value={heightCm} onChange={e => setHeightCm(e.target.value)}
                    placeholder="e.g. 175"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Weight (kg) — optional</label>
                  <input
                    type="number" value={weightKg} onChange={e => setWeightKg(e.target.value)}
                    placeholder="e.g. 75"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Grip Strength */}
            <SectionCard title="Grip Strength (Leong 2015 · Lancet)" icon={Activity} open={openSections.grip} onToggle={() => toggleSection('grip')}>
              <InfoBox>
                Squeeze a hand dynamometer as hard as possible for 3 seconds. Record the best of 3 attempts.
                Each 5 kg increase in grip strength reduces CVD mortality risk by ~17%.
              </InfoBox>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-text-secondary">Value</label>
                  <button onClick={() => setGripLbs(l => !l)} className="text-xs text-primary underline">
                    Switch to {gripLbs ? 'kg' : 'lbs'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number" step="0.5" value={gripKg} onChange={e => setGripKg(e.target.value)}
                    placeholder={gripLbs ? 'e.g. 88 lbs' : 'e.g. 40 kg'}
                    className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                  />
                  <span className="self-center text-sm text-text-secondary">{gripLbs ? 'lbs' : 'kg'}</span>
                </div>
                {gripLbs && gripKg && (
                  <p className="text-xs text-text-secondary mt-1">= {(parseFloat(gripKg) / 2.205).toFixed(1)} kg</p>
                )}
              </div>
              {liveGrip && (
                <div className="flex items-center gap-2 bg-background border border-border rounded-xl p-3">
                  <GradeBadge grade={liveGrip.grade} />
                  <span className="text-xs text-text-secondary">{liveGrip.description}</span>
                </div>
              )}
            </SectionCard>

            {/* Gait Speed */}
            <SectionCard title="Gait Speed (Studenski 2011 · JAMA)" icon={TrendingUp} open={openSections.gait} onToggle={() => toggleSection('gait')}>
              <InfoBox>
                Walk at your normal comfortable pace. Measure either a 4-meter or 10-meter course.
                Time in seconds from first step to last. ≥1.0 m/s = low mortality risk.
              </InfoBox>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Distance (m)</label>
                  <div className="flex rounded-xl border border-border overflow-hidden">
                    {['4', '10'].map(d => (
                      <button key={d} onClick={() => setGaitDistance(d)}
                        className={cn('flex-1 py-2 text-sm transition-colors',
                          gaitDistance === d ? 'bg-primary text-white' : 'bg-background text-text-secondary hover:text-text-primary'
                        )}
                      >{d} m</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Time (seconds)</label>
                  <input
                    type="number" step="0.1" value={gaitTime} onChange={e => setGaitTime(e.target.value)}
                    placeholder="e.g. 4.5"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              {gaitMps !== undefined && gaitMps > 0 && (
                <p className="text-xs text-text-secondary">Speed: <span className="text-text-primary font-medium">{gaitMps.toFixed(2)} m/s</span></p>
              )}
              {liveGait && (
                <div className="bg-background border border-border rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <GradeBadge grade={liveGait.grade} />
                    <span className="text-xs font-medium" style={{ color: RISK_COLORS[liveGait.risk] }}>
                      {liveGait.risk} Risk
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">{liveGait.mortalityNote}</p>
                </div>
              )}
            </SectionCard>

            {/* Chair Stand */}
            <SectionCard title="30-Sec Chair Stand (Bohannon 2006)" icon={Activity} open={openSections.chair} onToggle={() => toggleSection('chair')}>
              <InfoBox>
                Sit in a chair (seat ~43 cm high), arms crossed on chest. Stand fully upright and
                sit back down — count complete stands in 30 seconds. &lt;10 reps = elevated fall risk.
              </InfoBox>
              <div className="flex items-center gap-3">
                <button onClick={() => setChairReps(r => Math.max(0, r - 1))}
                  className="p-2 rounded-xl bg-background border border-border hover:bg-surface transition-colors">
                  <Minus className="w-4 h-4 text-text-secondary" />
                </button>
                <div className="flex-1 text-center">
                  <span className="text-3xl font-bold text-text-primary">{chairReps}</span>
                  <span className="text-sm text-text-secondary ml-1">reps</span>
                </div>
                <button onClick={() => setChairReps(r => r + 1)}
                  className="p-2 rounded-xl bg-background border border-border hover:bg-surface transition-colors">
                  <Plus className="w-4 h-4 text-text-secondary" />
                </button>
                <input
                  type="number" min={0} value={chairReps} onChange={e => setChairReps(parseInt(e.target.value) || 0)}
                  className="w-20 bg-background border border-border rounded-xl px-2 py-2 text-sm text-center text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
              {liveChair && (
                <div className="flex items-center gap-2 bg-background border border-border rounded-xl p-3">
                  <GradeBadge grade={liveChair.grade} />
                  <span className="text-xs text-text-secondary">{liveChair.description}</span>
                </div>
              )}
            </SectionCard>

            {/* Balance */}
            <SectionCard title="Single-Leg Balance (ACSM)" icon={Activity} open={openSections.balance} onToggle={() => toggleSection('balance')}>
              <InfoBox>
                Stand on one foot. Start timer. Stop when other foot touches down or you grab support.
                Eyes open: natural proprioception. Eyes closed: vestibular system.
              </InfoBox>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Eyes Open (sec)</label>
                  <input
                    type="number" step="0.5" value={balanceOpen} onChange={e => setBalanceOpen(e.target.value)}
                    placeholder="e.g. 30"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                  />
                  {liveBalOpen && <GradeBadge grade={liveBalOpen.grade} />}
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Eyes Closed (sec)</label>
                  <input
                    type="number" step="0.5" value={balanceClosed} onChange={e => setBalanceClosed(e.target.value)}
                    placeholder="e.g. 15"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                  />
                  {liveBalClosed && <GradeBadge grade={liveBalClosed.grade} />}
                </div>
              </div>
            </SectionCard>

            {/* 6-Min Walk */}
            <SectionCard title="6-Minute Walk Test (Enright 2003)" icon={TrendingUp} open={openSections.walk} onToggle={() => toggleSection('walk')}>
              <InfoBox>
                Walk as far as possible in 6 minutes on a flat surface. Measure distance in meters.
                Enter height/weight above for personalized predicted distance.
              </InfoBox>
              <div>
                <label className="text-xs text-text-secondary mb-1 block">Distance walked (meters)</label>
                <input
                  type="number" step="1" value={walkMeters} onChange={e => setWalkMeters(e.target.value)}
                  placeholder="e.g. 550"
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
              {liveWalk && (
                <div className="bg-background border border-border rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <GradeBadge grade={liveWalk.grade} />
                    {liveWalk.percentOfPredicted && (
                      <span className="text-xs text-text-secondary">{liveWalk.percentOfPredicted}% of predicted ({liveWalk.predictedMeters} m)</span>
                    )}
                  </div>
                </div>
              )}
            </SectionCard>

            {/* Calculate Button */}
            <button
              onClick={handleCalculate}
              disabled={!ageNum}
              className={cn(
                'w-full py-4 rounded-2xl font-semibold text-sm transition-colors',
                ageNum
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'bg-surface border border-border text-text-secondary cursor-not-allowed'
              )}
            >
              Calculate Functional Age →
            </button>
          </div>
        )}

        {/* ── RESULTS TAB ────────────────────────────────────────────── */}
        {activeTab === 'results' && (
          <div className="space-y-4">
            {!liveAnalysis ? (
              <div className="text-center py-12 text-text-secondary">
                <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Complete the Test tab first, then tap <strong>Calculate Functional Age</strong>.</p>
              </div>
            ) : (
              <>
                {/* Functional Age Hero */}
                <div className="bg-surface border border-border rounded-2xl p-5 text-center">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">Functional Age</p>
                  <div className={cn('text-6xl font-black mb-1', faColor(liveAnalysis.ageAdjustment))}>
                    {liveAnalysis.functionalAge}
                  </div>
                  <p className="text-sm text-text-secondary">
                    Chronological age: {age} · {liveAnalysis.ageAdjustment === 0 ? 'Same as chronological age' : liveAnalysis.ageAdjustment < 0 ? `${Math.abs(liveAnalysis.ageAdjustment)} years younger` : `${liveAnalysis.ageAdjustment} years older`}
                  </p>
                  <div className="mt-3 bg-background border border-border rounded-xl p-3">
                    <p className="text-xs text-text-secondary">
                      Composite percentile: <span className="text-text-primary font-semibold">{liveAnalysis.compositeScore}th</span>
                    </p>
                  </div>
                </div>

                {/* Radar Chart */}
                {radarData.some(d => d.value > 0) && (
                  <div className="bg-surface border border-border rounded-2xl p-4">
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Performance Radar</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="var(--color-border, #e5e7eb)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-text-secondary, #6b7280)', fontSize: 11 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Percentile" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Individual test cards */}
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { label: 'Grip Strength', result: liveAnalysis.gripStrength, weakest: liveAnalysis.weakestTest === 'Grip Strength' },
                    { label: 'Gait Speed', result: liveAnalysis.gaitSpeed, weakest: liveAnalysis.weakestTest === 'Gait Speed' },
                    { label: 'Chair Stand', result: liveAnalysis.chairStand, weakest: liveAnalysis.weakestTest === 'Chair Stand' },
                    { label: 'Balance (Eyes Open)', result: liveAnalysis.balanceEyesOpen, weakest: liveAnalysis.weakestTest === 'Balance' },
                    { label: 'Balance (Eyes Closed)', result: liveAnalysis.balanceEyesClosed, weakest: liveAnalysis.weakestTest === 'Balance' },
                    { label: '6-Min Walk', result: liveAnalysis.walkTest, weakest: liveAnalysis.weakestTest === '6-Min Walk' },
                  ].filter(t => t.result).map(({ label, result, weakest }) => result && (
                    <div key={label} className={cn(
                      'bg-surface border rounded-2xl p-4',
                      weakest ? 'border-orange-500/40 bg-orange-500/5' : 'border-border'
                    )}>
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <p className="text-xs text-text-secondary font-medium">{label}</p>
                          <p className="text-lg font-bold text-text-primary">{result.label}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <GradeBadge grade={result.grade} />
                          <p className="text-xs text-text-secondary">{result.percentile}th pctl</p>
                        </div>
                      </div>
                      <p className="text-xs text-text-secondary">{result.description}</p>
                      {weakest && (
                        <p className="text-xs text-orange-500 font-medium mt-1.5">⚠ Weakest test — prioritise improvement</p>
                      )}
                      {/* Percentile bar */}
                      <div className="mt-2 h-1.5 bg-background rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${result.percentile}%`, backgroundColor: GRADE_COLORS[result.grade] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recommendations */}
                {liveAnalysis.recommendations.length > 0 && (
                  <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Recommendations</p>
                    {liveAnalysis.recommendations.map((r, i) => (
                      <div key={i} className="flex gap-2 text-xs text-text-secondary">
                        <span className="text-primary mt-0.5">→</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Save button */}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-3 rounded-2xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save to History'}
                </button>
                {saveError && <p className="text-xs text-red-500 text-center">{saveError}</p>}

                {/* Citations */}
                <div className="bg-surface border border-border rounded-2xl p-4 space-y-1.5">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Research Citations</p>
                  {liveAnalysis.citations.map((c, i) => (
                    <p key={i} className="text-[11px] text-text-secondary leading-relaxed">{c}</p>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── HISTORY TAB ────────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-text-secondary text-sm">Loading history…</div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-text-secondary">
                <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No tests yet. Complete the Test tab to get started.</p>
              </div>
            ) : (
              <>
                {/* Functional Age Trend */}
                {trendData.length >= 2 && (
                  <div className="bg-surface border border-border rounded-2xl p-4">
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Functional Age Trend</p>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border,#e5e7eb)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                        <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v: number) => [`${v} yrs`, 'Functional Age']} />
                        <Line type="monotone" dataKey="functionalAge" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Percentile Trends */}
                {trendData.length >= 2 && (
                  <div className="bg-surface border border-border rounded-2xl p-4">
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Test Percentile Trends</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border,#e5e7eb)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="grip" name="Grip" stroke="#ef4444" strokeWidth={2} dot={false} connectNulls />
                        <Line type="monotone" dataKey="gait" name="Gait" stroke="#22c55e" strokeWidth={2} dot={false} connectNulls />
                        <Line type="monotone" dataKey="chair" name="Chair" stroke="#f97316" strokeWidth={2} dot={false} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Best vs Latest */}
                {history.length >= 2 && (() => {
                  const latest = history[0]
                  const best = [...history].sort((a, b) => a.analysis.functionalAge - b.analysis.functionalAge)[0]
                  return (
                    <div className="bg-surface border border-border rounded-2xl p-4">
                      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Best vs Latest</p>
                      <div className="grid grid-cols-2 gap-3">
                        {[['Best', best], ['Latest', latest]].map(([label, entry]) => {
                          const e = entry as HistoryEntry
                          return (
                            <div key={String(label)} className="bg-background border border-border rounded-xl p-3">
                              <p className="text-xs text-text-secondary mb-1">{String(label)} · {e.test.date}</p>
                              <p className={cn('text-2xl font-black', faColor(e.analysis.ageAdjustment))}>{e.analysis.functionalAge}</p>
                              <p className="text-xs text-text-secondary">Functional Age</p>
                              <p className="text-xs text-text-secondary mt-1">{e.analysis.compositeScore}th percentile</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}

                {/* History list */}
                <div className="space-y-2">
                  {history.map(({ test, analysis }) => (
                    <div key={test.id ?? test.date} className="bg-surface border border-border rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-text-primary">{test.date}</p>
                        <div className="flex items-center gap-2">
                          <span className={cn('text-lg font-black', faColor(analysis.ageAdjustment))}>{analysis.functionalAge}</span>
                          <span className="text-xs text-text-secondary">yrs functional</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.gripStrength && (
                          <span className={cn('text-xs px-2 py-0.5 rounded-full border', GRADE_BG[analysis.gripStrength.grade])}>
                            Grip {analysis.gripStrength.label}
                          </span>
                        )}
                        {analysis.gaitSpeed && (
                          <span className={cn('text-xs px-2 py-0.5 rounded-full border', GRADE_BG[analysis.gaitSpeed.grade])}>
                            Gait {analysis.gaitSpeed.label}
                          </span>
                        )}
                        {analysis.chairStand && (
                          <span className={cn('text-xs px-2 py-0.5 rounded-full border', GRADE_BG[analysis.chairStand.grade])}>
                            Chair {analysis.chairStand.label}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Floating show-results hint after calculation */}
        {showResults && activeTab === 'test' && (
          <div className="fixed bottom-24 left-4 right-4 max-w-2xl mx-auto z-20">
            <button
              onClick={() => { setActiveTab('results'); setShowResults(false) }}
              className="w-full py-3 bg-primary text-white rounded-2xl text-sm font-semibold shadow-lg"
            >
              View Results & Functional Age →
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
