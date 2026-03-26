'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ArrowLeft, Flame, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import {
  checkMetabolicSyndrome,
  calculateMetabolicScore,
  metabolicFlexibilityScore,
  type MetabolicMarkers,
  type MetabolicHealthScore,
  type MetabolicSyndromeCheck,
} from '@/lib/metabolic-health'

type Sex = 'male' | 'female'
type Tab = 'score' | 'syndrome' | 'flexibility' | 'history'

interface Assessment {
  id: string
  assessed_at: string
  metabolic_score: number | null
  metabolic_syndrome_criteria: number | null
  has_metabolic_syndrome: boolean | null
  insulin_resistance_proxy: string | null
  tg_hdl_ratio: number | null
  flexibility_score: number | null
}

const IR_COLORS: Record<string, string> = {
  Low: 'bg-green-500/20 text-green-400 border-green-500/30',
  Moderate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  High: 'bg-red-500/20 text-red-400 border-red-500/30',
  Unknown: 'bg-surface text-text-secondary border-border',
}

const GRADE_COLORS: Record<string, string> = {
  A: 'text-green-400',
  B: 'text-emerald-400',
  C: 'text-yellow-400',
  D: 'text-orange-400',
  F: 'text-red-400',
}

function ScoreBar({ label, value, max = 25 }: { label: string; value: number; max?: number }) {
  const pct = Math.round((value / max) * 100)
  const color = pct >= 70 ? 'bg-green-500' : pct >= 45 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-text-secondary">{label}</span>
        <span className="text-text-primary font-medium">
          {value}/{max}
        </span>
      </div>
      <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function Slider({
  label,
  sublabel,
  value,
  onChange,
}: {
  label: string
  sublabel: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-secondary">{sublabel}</p>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-primary"
        />
        <span className="w-6 text-center font-bold text-primary">{value}</span>
      </div>
      <div className="flex justify-between text-xs text-text-secondary">
        <span>1 — Low</span>
        <span>10 — High</span>
      </div>
    </div>
  )
}

export default function MetabolicPage() {
  const [tab, setTab] = useState<Tab>('score')
  const [sex, setSex] = useState<Sex>('male')
  const [markers, setMarkers] = useState<MetabolicMarkers>({})
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [prefillLoading, setPrefillLoading] = useState(false)
  const [prefill, setPrefill] = useState<Partial<MetabolicMarkers>>({})

  // Flexibility sliders
  const [fastingEase, setFastingEase] = useState(5)
  const [postprandial, setPostprandial] = useState(5)
  const [morningEnergy, setMorningEnergy] = useState(5)
  const [sugarCravings, setSugarCravings] = useState(5)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/metabolic')
      if (res.ok) {
        const json = await res.json()
        setAssessments(json.assessments ?? [])
        setPrefill(json.prefill ?? {})
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function applyPrefill() {
    setPrefillLoading(true)
    setMarkers((prev) => ({ ...prev, ...prefill }))
    setTimeout(() => setPrefillLoading(false), 400)
  }

  function setMarker(key: keyof MetabolicMarkers, raw: string) {
    const num = raw === '' ? undefined : parseFloat(raw)
    setMarkers((prev) => ({ ...prev, [key]: isNaN(num as number) ? undefined : num }))
  }

  const fullMarkers: MetabolicMarkers = {
    ...markers,
    fasting_ease: fastingEase,
    postprandial_energy: postprandial,
    morning_energy: morningEnergy,
    sugar_cravings: sugarCravings,
  }

  const score: MetabolicHealthScore = calculateMetabolicScore(fullMarkers, sex)
  const syndromeCheck: MetabolicSyndromeCheck = checkMetabolicSyndrome(fullMarkers, sex)
  const flexScore = metabolicFlexibilityScore(fastingEase, postprandial, morningEnergy, sugarCravings)

  async function saveAssessment() {
    setSaving(true)
    try {
      await fetch('/api/metabolic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metabolic_score: score.overall,
          metabolic_syndrome_criteria: syndromeCheck.criteria_met,
          has_metabolic_syndrome: syndromeCheck.has_metabolic_syndrome,
          insulin_resistance_proxy: score.insulin_resistance_proxy,
          tg_hdl_ratio: score.tg_hdl_ratio ?? null,
          flexibility_score: flexScore,
          inputs: fullMarkers,
        }),
      })
      await fetchData()
    } finally {
      setSaving(false)
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'score', label: 'Score' },
    { key: 'syndrome', label: 'Syndrome Check' },
    { key: 'flexibility', label: 'Flexibility' },
    { key: 'history', label: 'History' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <Flame className="w-5 h-5 text-primary" />
              Metabolic Health
            </h1>
            <p className="text-xs text-text-secondary">IDF/AHA 2009 · Syndrome X screening</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value as Sex)}
              className="text-xs bg-surface border border-border rounded-lg px-2 py-1 text-text-primary"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4 pb-2 flex gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                tab === t.key
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── SCORE TAB ── */}
            {tab === 'score' && (
              <div className="space-y-4">
                {/* Auto-fill from labs button */}
                {Object.keys(prefill).length > 0 && (
                  <button
                    onClick={applyPrefill}
                    disabled={prefillLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-primary/40 bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${prefillLoading ? 'animate-spin' : ''}`} />
                    Update from Lab Results &amp; Measurements
                  </button>
                )}

                {/* Overall score card */}
                <div className="bg-surface border border-border rounded-2xl p-5 text-center">
                  <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">
                    Metabolic Health Score
                  </p>
                  <div className="flex items-end justify-center gap-3">
                    <span className="text-6xl font-black text-text-primary">{score.overall}</span>
                    <span className={`text-4xl font-black mb-1 ${GRADE_COLORS[score.grade]}`}>
                      {score.grade}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mt-1">out of 100</p>

                  <div
                    className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full border text-xs font-medium ${
                      IR_COLORS[score.insulin_resistance_proxy]
                    }`}
                  >
                    Insulin Resistance Risk: {score.insulin_resistance_proxy}
                  </div>

                  {score.tg_hdl_ratio !== undefined && (
                    <p className="text-xs text-text-secondary mt-2">
                      TG/HDL ratio:{' '}
                      <span
                        className={
                          score.tg_hdl_ratio < 2.0
                            ? 'text-green-400'
                            : score.tg_hdl_ratio < 3.5
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }
                      >
                        {score.tg_hdl_ratio.toFixed(2)}
                      </span>
                      <span className="text-text-secondary"> (good &lt;2.0, risk ≥3.5)</span>
                    </p>
                  )}
                </div>

                {/* Component bars */}
                <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-text-primary">Score Components</h3>
                  <ScoreBar label="Glucose Control" value={score.components.glucose_control} />
                  <ScoreBar label="Lipid Profile" value={score.components.lipid_profile} />
                  <ScoreBar label="Body Composition" value={score.components.body_composition} />
                  <ScoreBar label="Metabolic Flexibility" value={score.components.lifestyle_flexibility} />
                </div>

                {/* Risks */}
                {score.top_risks.length > 0 && (
                  <div className="bg-surface border border-border rounded-2xl p-5 space-y-2">
                    <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" /> Top Risks
                    </h3>
                    <ul className="space-y-1.5">
                      {score.top_risks.map((r) => (
                        <li key={r} className="text-sm text-text-secondary flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {score.recommendations.length > 0 && (
                  <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-text-primary">Recommendations</h3>
                    {score.recommendations.map((rec, i) => (
                      <div key={i} className="border border-border rounded-xl p-3 space-y-1">
                        <p className="text-sm font-medium text-text-primary">{rec.action}</p>
                        <p className="text-xs text-green-400">Impact: {rec.impact}</p>
                        <p className="text-xs text-text-secondary">Evidence: {rec.evidence}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input markers */}
                <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-text-primary">Lab & Measurement Inputs</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        ['fasting_glucose_mgdl', 'Fasting Glucose (mg/dL)'],
                        ['hba1c_pct', 'HbA1c (%)'],
                        ['triglycerides_mgdl', 'Triglycerides (mg/dL)'],
                        ['hdl_mgdl', 'HDL (mg/dL)'],
                        ['ldl_mgdl', 'LDL (mg/dL)'],
                        ['waist_cm', 'Waist (cm)'],
                        ['weight_kg', 'Weight (kg)'],
                        ['height_cm', 'Height (cm)'],
                        ['systolic_bp', 'Systolic BP'],
                        ['diastolic_bp', 'Diastolic BP'],
                      ] as [keyof MetabolicMarkers, string][]
                    ).map(([key, label]) => (
                      <div key={key}>
                        <label className="block text-xs text-text-secondary mb-1">{label}</label>
                        <input
                          type="number"
                          value={markers[key] ?? ''}
                          onChange={(e) => setMarker(key, e.target.value)}
                          placeholder="—"
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={saveAssessment}
                  disabled={saving}
                  className="w-full py-3 rounded-2xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save Assessment'}
                </button>
              </div>
            )}

            {/* ── SYNDROME CHECK TAB ── */}
            {tab === 'syndrome' && (
              <div className="space-y-4">
                <div
                  className={`rounded-2xl p-5 border ${
                    syndromeCheck.has_metabolic_syndrome
                      ? 'bg-red-500/10 border-red-500/30'
                      : syndromeCheck.criteria_met >= 2
                      ? 'bg-yellow-500/10 border-yellow-500/30'
                      : 'bg-green-500/10 border-green-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-bold text-text-primary">
                      Metabolic Syndrome Screening
                    </h2>
                    <span
                      className={`text-2xl font-black ${
                        syndromeCheck.has_metabolic_syndrome
                          ? 'text-red-400'
                          : syndromeCheck.criteria_met >= 2
                          ? 'text-yellow-400'
                          : 'text-green-400'
                      }`}
                    >
                      {syndromeCheck.criteria_met}/5
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">
                    {syndromeCheck.has_metabolic_syndrome
                      ? '⚠️ Meets criteria for metabolic syndrome (≥3 of 5)'
                      : syndromeCheck.criteria_met >= 2
                      ? 'Borderline — monitor closely'
                      : 'Below metabolic syndrome threshold'}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    Risk level: <span className="font-medium text-text-primary">{syndromeCheck.risk_level}</span>
                  </p>
                </div>

                {/* Criteria list */}
                <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                  {(
                    [
                      ['waist', 'Waist Circumference', 'Abdominal obesity indicator'],
                      ['triglycerides', 'Triglycerides', 'Blood fat marker'],
                      ['hdl', 'HDL Cholesterol', '"Good" cholesterol'],
                      ['blood_pressure', 'Blood Pressure', 'Cardiovascular strain'],
                      ['fasting_glucose', 'Fasting Glucose', 'Blood sugar regulation'],
                    ] as [keyof typeof syndromeCheck.criteria, string, string][]
                  ).map(([key, name, sub], idx) => {
                    const c = syndromeCheck.criteria[key]
                    return (
                      <div
                        key={key}
                        className={`flex items-start gap-3 p-4 ${
                          idx < 4 ? 'border-b border-border' : ''
                        }`}
                      >
                        {c.value !== undefined ? (
                          c.met ? (
                            <XCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                          )
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-border mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-text-primary">{name}</p>
                            {c.value !== undefined && (
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  c.met
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-green-500/20 text-green-400'
                                }`}
                              >
                                {c.met ? 'Risk' : 'OK'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-secondary">{sub}</p>
                          <p className="text-xs text-text-secondary mt-0.5">
                            Threshold: <span className="text-text-primary">{c.threshold}</span>
                          </p>
                          {c.value !== undefined && (
                            <p className="text-xs mt-0.5">
                              Your value:{' '}
                              <span
                                className={c.met ? 'text-red-400 font-medium' : 'text-green-400 font-medium'}
                              >
                                {c.value}
                              </span>
                            </p>
                          )}
                          {c.value === undefined && (
                            <p className="text-xs text-text-secondary/60 italic mt-0.5">No data — enter in Score tab</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="bg-surface border border-border rounded-2xl p-4 flex gap-2">
                  <Info className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
                  <p className="text-xs text-text-secondary">
                    <span className="font-medium text-text-primary">Screening tool only.</span>{' '}
                    Based on IDF/AHA 2009 consensus criteria. Consult your doctor for a formal
                    diagnosis and before making medical decisions.
                  </p>
                </div>
              </div>
            )}

            {/* ── FLEXIBILITY TAB ── */}
            {tab === 'flexibility' && (
              <div className="space-y-4">
                {/* Score gauge */}
                <div className="bg-surface border border-border rounded-2xl p-5 text-center">
                  <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">
                    Metabolic Flexibility Score
                  </p>
                  <p className="text-5xl font-black text-text-primary">{flexScore}</p>
                  <p className="text-sm text-text-secondary mt-1">out of 100</p>
                  <div className="mt-3 h-3 bg-surface-secondary rounded-full overflow-hidden mx-auto max-w-xs">
                    <div
                      className={`h-full rounded-full transition-all ${
                        flexScore >= 70 ? 'bg-green-500' : flexScore >= 45 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${flexScore}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-secondary mt-2">
                    {flexScore >= 70
                      ? '✅ Good metabolic flexibility'
                      : flexScore >= 45
                      ? '⚠️ Moderate flexibility — room to improve'
                      : '❌ Low flexibility — primarily glucose-dependent'}
                  </p>
                </div>

                {/* Sliders */}
                <div className="bg-surface border border-border rounded-2xl p-5 space-y-5">
                  <h3 className="text-sm font-semibold text-text-primary">Lifestyle Proxies</h3>
                  <Slider
                    label="Fasting Ease"
                    sublabel="How easily can you skip breakfast without feeling irritable or foggy?"
                    value={fastingEase}
                    onChange={setFastingEase}
                  />
                  <Slider
                    label="Post-meal Energy"
                    sublabel="How is your energy 2 hours after a carb-heavy meal?"
                    value={postprandial}
                    onChange={setPostprandial}
                  />
                  <Slider
                    label="Morning Energy"
                    sublabel="How is your energy in the morning before eating?"
                    value={morningEnergy}
                    onChange={setMorningEnergy}
                  />
                  <Slider
                    label="Sugar Cravings"
                    sublabel="How often do you experience strong sugar or carb cravings? (lower = better)"
                    value={sugarCravings}
                    onChange={setSugarCravings}
                  />
                </div>

                {/* Education */}
                <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-text-primary">What is Metabolic Flexibility?</h3>
                  <p className="text-sm text-text-secondary">
                    Metabolic flexibility is your body's ability to efficiently switch between burning
                    glucose and fat as fuel sources depending on availability and demand — a hallmark of
                    good metabolic health (Volek &amp; Phinney, 2012).
                  </p>
                  <div className="space-y-2">
                    {[
                      {
                        icon: '🍽️',
                        title: 'Time-restricted eating',
                        body: 'A 16:8 eating window trains your body to tap into fat reserves. Benefits appear within 4–12 weeks.',
                      },
                      {
                        icon: '🏃',
                        title: 'Zone 2 cardio',
                        body: 'Low-intensity aerobic exercise (able to hold a conversation) maximises fat oxidation and builds mitochondria.',
                      },
                      {
                        icon: '🥗',
                        title: 'Carb periodisation',
                        body: 'Cycling low-carb days with higher-carb days around workouts improves insulin sensitivity.',
                      },
                      {
                        icon: '💪',
                        title: 'Resistance training',
                        body: 'Muscle tissue is your primary glucose buffer. More muscle = better glucose disposal after meals.',
                      },
                    ].map((item) => (
                      <div key={item.title} className="flex gap-3 p-3 rounded-xl bg-background border border-border">
                        <span className="text-xl">{item.icon}</span>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{item.title}</p>
                          <p className="text-xs text-text-secondary">{item.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── HISTORY TAB ── */}
            {tab === 'history' && (
              <div className="space-y-4">
                {assessments.length === 0 ? (
                  <div className="text-center py-12 text-text-secondary">
                    <Flame className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No assessments yet.</p>
                    <p className="text-xs mt-1">Complete your first assessment in the Score tab.</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-surface border border-border rounded-2xl p-4">
                      <h3 className="text-sm font-semibold text-text-primary mb-3">Metabolic Score Trend</h3>
                      <ResponsiveContainer width="100%" height={160}>
                        <LineChart
                          data={[...assessments].reverse().map((a) => ({
                            date: a.assessed_at?.slice(5),
                            score: a.metabolic_score,
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--text-secondary)" />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="var(--text-secondary)" />
                          <Tooltip
                            contentStyle={{
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              borderRadius: 8,
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke="var(--primary)"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-surface border border-border rounded-2xl p-4">
                      <h3 className="text-sm font-semibold text-text-primary mb-3">
                        Syndrome Criteria Trend
                      </h3>
                      <ResponsiveContainer width="100%" height={140}>
                        <LineChart
                          data={[...assessments].reverse().map((a) => ({
                            date: a.assessed_at?.slice(5),
                            criteria: a.metabolic_syndrome_criteria,
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--text-secondary)" />
                          <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 10 }} stroke="var(--text-secondary)" />
                          <Tooltip
                            contentStyle={{
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              borderRadius: 8,
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="criteria"
                            stroke="#f97316"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {assessments.some((a) => a.tg_hdl_ratio !== null) && (
                      <div className="bg-surface border border-border rounded-2xl p-4">
                        <h3 className="text-sm font-semibold text-text-primary mb-3">TG/HDL Ratio Trend</h3>
                        <ResponsiveContainer width="100%" height={140}>
                          <LineChart
                            data={[...assessments]
                              .reverse()
                              .filter((a) => a.tg_hdl_ratio !== null)
                              .map((a) => ({
                                date: a.assessed_at?.slice(5),
                                ratio: a.tg_hdl_ratio,
                              }))}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--text-secondary)" />
                            <YAxis tick={{ fontSize: 10 }} stroke="var(--text-secondary)" />
                            <Tooltip
                              contentStyle={{
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                                borderRadius: 8,
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="ratio"
                              stroke="#a855f7"
                              strokeWidth={2}
                              dot={{ r: 3 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* History list */}
                    <div className="space-y-2">
                      {assessments.map((a) => (
                        <div
                          key={a.id}
                          className="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium text-text-primary">{a.assessed_at}</p>
                            <p className="text-xs text-text-secondary">
                              Syndrome criteria: {a.metabolic_syndrome_criteria ?? '—'}/5
                              {a.has_metabolic_syndrome && (
                                <span className="ml-2 text-red-400 font-medium">Met Syn</span>
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black text-text-primary">
                              {a.metabolic_score ?? '—'}
                            </p>
                            {a.tg_hdl_ratio !== null && (
                              <p className="text-xs text-text-secondary">
                                TG/HDL {Number(a.tg_hdl_ratio).toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
