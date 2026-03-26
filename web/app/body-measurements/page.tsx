'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Ruler,
  TrendingDown,
  TrendingUp,
  Minus,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { calculateRatios, type BodyMeasurement, type BodyRatios } from '@/lib/body-measurements'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiEntry {
  id: string
  measured_at: string
  weight_kg?: number
  height_cm?: number
  waist_cm?: number
  hips_cm?: number
  chest_cm?: number
  neck_cm?: number
  left_arm_cm?: number
  right_arm_cm?: number
  left_thigh_cm?: number
  right_thigh_cm?: number
  left_calf_cm?: number
  right_calf_cm?: number
  notes?: string
}

interface ApiResponse {
  measurements: ApiEntry[]
  ratios: BodyRatios | null
  trend: string
  change: Partial<BodyMeasurement>
  sex: 'male' | 'female'
}

// ─── Risk badge helpers ───────────────────────────────────────────────────────

const riskColor: Record<string, string> = {
  Low: 'bg-green-500/15 text-green-600 border-green-500/30',
  Normal: 'bg-green-500/15 text-green-600 border-green-500/30',
  Moderate: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30',
  Increased: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30',
  High: 'bg-red-500/15 text-red-600 border-red-500/30',
  'Substantially Increased': 'bg-red-500/15 text-red-600 border-red-500/30',
  Unknown: 'bg-surface border-border text-text-secondary',
  Underweight: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  Normal_bmi: 'bg-green-500/15 text-green-600 border-green-500/30',
  Overweight: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30',
  'Obese I': 'bg-orange-500/15 text-orange-600 border-orange-500/30',
  'Obese II': 'bg-red-500/15 text-red-600 border-red-500/30',
  'Obese III': 'bg-red-700/15 text-red-700 border-red-700/30',
}

function riskBadgeClass(label: string): string {
  return riskColor[label] ?? 'bg-surface border-border text-text-secondary'
}

// ─── Chart line colours ───────────────────────────────────────────────────────

const LINE_COLORS: Record<string, string> = {
  waist_cm: '#f97316',
  hips_cm: '#a855f7',
  chest_cm: '#3b82f6',
  weight_kg: '#10b981',
  left_arm_cm: '#ec4899',
  right_arm_cm: '#f43f5e',
  left_thigh_cm: '#14b8a6',
  right_thigh_cm: '#06b6d4',
  left_calf_cm: '#84cc16',
  right_calf_cm: '#eab308',
}

const CHART_METRICS = [
  { key: 'waist_cm', label: 'Waist' },
  { key: 'hips_cm', label: 'Hips' },
  { key: 'chest_cm', label: 'Chest' },
  { key: 'weight_kg', label: 'Weight (kg)' },
  { key: 'left_arm_cm', label: 'L Arm' },
  { key: 'right_arm_cm', label: 'R Arm' },
  { key: 'left_thigh_cm', label: 'L Thigh' },
  { key: 'right_thigh_cm', label: 'R Thigh' },
]

// ─── Measurement tips ─────────────────────────────────────────────────────────

const TIPS: { site: string; tip: string }[] = [
  { site: 'Waist', tip: 'Measure at the narrowest point of the torso, midway between the lowest rib and the iliac crest, after a normal exhale.' },
  { site: 'Hips', tip: 'Stand with feet together; measure at the widest part of the buttocks, keeping the tape horizontal.' },
  { site: 'Chest', tip: 'Measure around the fullest part of the chest at nipple level, arms relaxed at sides.' },
  { site: 'Arms', tip: 'Flex the bicep; measure around the peak of the muscle at the midpoint of the upper arm.' },
  { site: 'Thighs', tip: 'Measure at the widest part of the upper thigh, just below the gluteal fold.' },
  { site: 'Calves', tip: 'Stand with weight evenly distributed; measure at the widest point of the lower leg.' },
]

// ─── Empty form state ─────────────────────────────────────────────────────────

const EMPTY_FORM = {
  measured_at: new Date().toISOString().split('T')[0],
  weight_kg: '',
  height_cm: '',
  waist_cm: '',
  hips_cm: '',
  chest_cm: '',
  neck_cm: '',
  left_arm_cm: '',
  right_arm_cm: '',
  left_thigh_cm: '',
  right_thigh_cm: '',
  left_calf_cm: '',
  right_calf_cm: '',
  notes: '',
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function BodyMeasurementsPage() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formTab, setFormTab] = useState<'Core' | 'Arms' | 'Legs'>('Core')
  const [form, setForm] = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)
  const [showTips, setShowTips] = useState(false)
  const [chartMetrics, setChartMetrics] = useState(['waist_cm', 'hips_cm', 'weight_kg'])
  const [sex, setSex] = useState<'male' | 'female'>('male')
  const [liveRatios, setLiveRatios] = useState<BodyRatios | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/body-measurements')
      if (res.ok) {
        const json: ApiResponse = await res.json()
        setData(json)
        setSex(json.sex)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Recompute live ratios when form or sex changes
  useEffect(() => {
    const m: BodyMeasurement = {
      date: form.measured_at,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
      height_cm: form.height_cm ? Number(form.height_cm) : undefined,
      waist_cm: form.waist_cm ? Number(form.waist_cm) : undefined,
      hips_cm: form.hips_cm ? Number(form.hips_cm) : undefined,
    }
    const hasData = m.weight_kg || m.waist_cm || m.hips_cm
    setLiveRatios(hasData ? calculateRatios(m, sex) : null)
  }, [form, sex])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const body: Record<string, unknown> = { measured_at: form.measured_at }
      const numericFields = [
        'weight_kg', 'height_cm', 'waist_cm', 'hips_cm', 'chest_cm', 'neck_cm',
        'left_arm_cm', 'right_arm_cm', 'left_thigh_cm', 'right_thigh_cm',
        'left_calf_cm', 'right_calf_cm',
      ] as const
      for (const f of numericFields) {
        const v = form[f]
        if (v !== '') body[f] = Number(v)
      }
      if (form.notes) body.notes = form.notes

      const res = await fetch('/api/body-measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setForm(EMPTY_FORM)
        setShowForm(false)
        await fetchData()
      }
    } finally {
      setSaving(false)
    }
  }

  function handleField(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function toggleMetric(key: string) {
    setChartMetrics(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  // Build chart data
  const chartData = [...(data?.measurements ?? [])]
    .sort((a, b) => a.measured_at.localeCompare(b.measured_at))
    .map(e => ({
      date: e.measured_at,
      waist_cm: e.waist_cm,
      hips_cm: e.hips_cm,
      chest_cm: e.chest_cm,
      weight_kg: e.weight_kg,
      left_arm_cm: e.left_arm_cm,
      right_arm_cm: e.right_arm_cm,
      left_thigh_cm: e.left_thigh_cm,
      right_thigh_cm: e.right_thigh_cm,
    }))

  const displayRatios = liveRatios ?? data?.ratios ?? null
  const trend = data?.trend ?? ''
  const change = data?.change ?? {}

  function deltaIcon(val?: number) {
    if (!val) return <Minus className="w-3 h-3 inline" />
    if (val < 0) return <TrendingDown className="w-3 h-3 inline text-green-500" />
    return <TrendingUp className="w-3 h-3 inline text-orange-500" />
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <Link href="/dashboard" className="p-2 rounded-xl hover:bg-surface transition-colors">
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </Link>
        <div className="flex items-center gap-2">
          <Ruler className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold text-text-primary">Body Measurements</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={sex}
            onChange={e => setSex(e.target.value as 'male' | 'female')}
            className="text-xs bg-surface border border-border rounded-lg px-2 py-1 text-text-secondary"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <button
            onClick={() => setShowForm(p => !p)}
            className="text-xs bg-primary text-white px-3 py-1.5 rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            {showForm ? 'Cancel' : '+ Add'}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Entry form */}
        {showForm && (
          <div className="bg-surface border border-border rounded-2xl p-4">
            <h2 className="font-semibold text-text-primary mb-3 text-sm">New Entry</h2>

            {/* Date */}
            <div className="mb-3">
              <label className="text-xs text-text-secondary block mb-1">Date</label>
              <input
                type="date"
                value={form.measured_at}
                onChange={e => handleField('measured_at', e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary"
              />
            </div>

            {/* Tab selector */}
            <div className="flex gap-1 mb-3">
              {(['Core', 'Arms', 'Legs'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFormTab(tab)}
                  className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${
                    formTab === tab
                      ? 'bg-primary text-white'
                      : 'bg-background border border-border text-text-secondary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-2">
                {formTab === 'Core' && (
                  <>
                    {[
                      { key: 'weight_kg', label: 'Weight (kg)' },
                      { key: 'height_cm', label: 'Height (cm)' },
                      { key: 'waist_cm', label: 'Waist (cm)' },
                      { key: 'hips_cm', label: 'Hips (cm)' },
                      { key: 'chest_cm', label: 'Chest (cm)' },
                      { key: 'neck_cm', label: 'Neck (cm)' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="text-xs text-text-secondary block mb-1">{label}</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="—"
                          value={(form as Record<string, string>)[key]}
                          onChange={e => handleField(key, e.target.value)}
                          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/40"
                        />
                      </div>
                    ))}
                  </>
                )}
                {formTab === 'Arms' && (
                  <>
                    {[
                      { key: 'left_arm_cm', label: 'Left Arm (cm)' },
                      { key: 'right_arm_cm', label: 'Right Arm (cm)' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="text-xs text-text-secondary block mb-1">{label}</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="—"
                          value={(form as Record<string, string>)[key]}
                          onChange={e => handleField(key, e.target.value)}
                          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/40"
                        />
                      </div>
                    ))}
                  </>
                )}
                {formTab === 'Legs' && (
                  <>
                    {[
                      { key: 'left_thigh_cm', label: 'Left Thigh (cm)' },
                      { key: 'right_thigh_cm', label: 'Right Thigh (cm)' },
                      { key: 'left_calf_cm', label: 'Left Calf (cm)' },
                      { key: 'right_calf_cm', label: 'Right Calf (cm)' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="text-xs text-text-secondary block mb-1">{label}</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="—"
                          value={(form as Record<string, string>)[key]}
                          onChange={e => handleField(key, e.target.value)}
                          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/40"
                        />
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Notes */}
              <div className="mt-2">
                <label className="text-xs text-text-secondary block mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Optional notes…"
                  value={form.notes}
                  onChange={e => handleField('notes', e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/40"
                />
              </div>

              {/* Live ratios preview */}
              {liveRatios && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {liveRatios.bmi && (
                    <span className={`text-xs px-2 py-1 rounded-lg border font-medium ${riskBadgeClass(liveRatios.bmi_category)}`}>
                      BMI {liveRatios.bmi} · {liveRatios.bmi_category}
                    </span>
                  )}
                  {liveRatios.whr && (
                    <span className={`text-xs px-2 py-1 rounded-lg border font-medium ${riskBadgeClass(liveRatios.whr_risk)}`}>
                      WHR {liveRatios.whr} · {liveRatios.whr_risk}
                    </span>
                  )}
                  {liveRatios.whtr && (
                    <span className={`text-xs px-2 py-1 rounded-lg border font-medium ${riskBadgeClass(liveRatios.whtr_risk)}`}>
                      WHtR {liveRatios.whtr} · {liveRatios.whtr_risk}
                    </span>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="mt-3 w-full bg-primary text-white py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Measurement'}
              </button>
            </form>
          </div>
        )}

        {/* Risk ratios card */}
        {displayRatios && (
          <div className="bg-surface border border-border rounded-2xl p-4">
            <h2 className="font-semibold text-text-primary mb-3 text-sm">Cardiometabolic Risk</h2>
            <div className="grid grid-cols-2 gap-3">
              {/* BMI */}
              <div className="bg-background rounded-xl p-3 border border-border">
                <p className="text-xs text-text-secondary mb-1">BMI</p>
                <p className="text-2xl font-bold text-text-primary">
                  {displayRatios.bmi ?? '—'}
                </p>
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-lg border font-medium ${riskBadgeClass(displayRatios.bmi_category)}`}>
                  {displayRatios.bmi_category}
                </span>
              </div>

              {/* Waist risk */}
              <div className="bg-background rounded-xl p-3 border border-border">
                <p className="text-xs text-text-secondary mb-1">Waist Risk (WHO)</p>
                <p className="text-2xl font-bold text-text-primary">
                  {data?.measurements[0]?.waist_cm ? `${data.measurements[0].waist_cm} cm` : '—'}
                </p>
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-lg border font-medium ${riskBadgeClass(displayRatios.waist_risk)}`}>
                  {displayRatios.waist_risk}
                </span>
              </div>

              {/* WHR */}
              <div className="bg-background rounded-xl p-3 border border-border">
                <p className="text-xs text-text-secondary mb-1">Waist-to-Hip Ratio</p>
                <p className="text-2xl font-bold text-text-primary">
                  {displayRatios.whr?.toFixed(2) ?? '—'}
                </p>
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-lg border font-medium ${riskBadgeClass(displayRatios.whr_risk)}`}>
                  {displayRatios.whr_risk}
                </span>
                <p className="text-[10px] text-text-secondary mt-1">
                  {sex === 'male' ? '>1.0 high risk' : '>0.85 high risk'}
                </p>
              </div>

              {/* WHtR */}
              <div className="bg-background rounded-xl p-3 border border-border">
                <p className="text-xs text-text-secondary mb-1">Waist-to-Height Ratio</p>
                <p className="text-2xl font-bold text-text-primary">
                  {displayRatios.whtr?.toFixed(2) ?? '—'}
                </p>
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-lg border font-medium ${riskBadgeClass(displayRatios.whtr_risk)}`}>
                  {displayRatios.whtr_risk}
                </span>
                <p className="text-[10px] text-text-secondary mt-1">&gt;0.5 increased risk (all)</p>
              </div>
            </div>

            {/* WHO waist thresholds */}
            <div className="mt-3 rounded-xl bg-background border border-border p-3">
              <p className="text-xs font-medium text-text-secondary mb-2">WHO Waist Thresholds</p>
              <div className="flex gap-2 flex-wrap">
                {(sex === 'male'
                  ? [
                      { label: 'Normal', threshold: '≤94 cm', cls: 'text-green-600' },
                      { label: 'Increased risk', threshold: '>94 cm', cls: 'text-yellow-600' },
                      { label: 'High risk', threshold: '>102 cm', cls: 'text-red-600' },
                    ]
                  : [
                      { label: 'Normal', threshold: '≤80 cm', cls: 'text-green-600' },
                      { label: 'Increased risk', threshold: '>80 cm', cls: 'text-yellow-600' },
                      { label: 'High risk', threshold: '>88 cm', cls: 'text-red-600' },
                    ]
                ).map(({ label, threshold, cls }) => (
                  <div key={label} className="flex items-center gap-1 text-xs">
                    <span className={`font-medium ${cls}`}>{label}:</span>
                    <span className="text-text-secondary">{threshold}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Progress summary */}
        {trend && trend !== 'Not enough data' && trend !== 'No changes recorded' && (
          <div className="bg-surface border border-border rounded-2xl p-4">
            <h2 className="font-semibold text-text-primary mb-3 text-sm">Change Since Start</h2>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { key: 'waist_cm', label: 'Waist', unit: 'cm' },
                  { key: 'hips_cm', label: 'Hips', unit: 'cm' },
                  { key: 'chest_cm', label: 'Chest', unit: 'cm' },
                  { key: 'weight_kg', label: 'Weight', unit: 'kg' },
                  { key: 'left_arm_cm', label: 'L Arm', unit: 'cm' },
                  { key: 'right_arm_cm', label: 'R Arm', unit: 'cm' },
                ] as { key: keyof typeof change; label: string; unit: string }[]
              )
                .filter(({ key }) => change[key] != null)
                .map(({ key, label, unit }) => {
                  const delta = change[key] as number
                  const sign = delta > 0 ? '+' : ''
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-1.5 bg-background border border-border rounded-xl px-3 py-2 text-xs"
                    >
                      {deltaIcon(delta)}
                      <span className="text-text-secondary">{label}</span>
                      <span className={`font-semibold ${delta < 0 ? 'text-green-500' : delta > 0 ? 'text-orange-500' : 'text-text-primary'}`}>
                        {sign}{delta}{unit}
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* Chart */}
        {chartData.length > 1 && (
          <div className="bg-surface border border-border rounded-2xl p-4">
            <h2 className="font-semibold text-text-primary mb-3 text-sm">Progress Over Time</h2>

            {/* Metric toggles */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {CHART_METRICS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => toggleMetric(key)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                    chartMetrics.includes(key)
                      ? 'border-transparent text-white'
                      : 'bg-background border-border text-text-secondary'
                  }`}
                  style={chartMetrics.includes(key) ? { backgroundColor: LINE_COLORS[key] } : undefined}
                >
                  {label}
                </button>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={d => d.slice(5)}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {CHART_METRICS.filter(m => chartMetrics.includes(m.key)).map(({ key, label }) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={label}
                    stroke={LINE_COLORS[key]}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* History table */}
        {data?.measurements && data.measurements.length > 0 && (
          <div className="bg-surface border border-border rounded-2xl p-4">
            <h2 className="font-semibold text-text-primary mb-3 text-sm">Recent Entries</h2>
            <div className="space-y-2">
              {data.measurements.slice(0, 10).map(e => (
                <div
                  key={e.id}
                  className="flex items-start justify-between bg-background border border-border rounded-xl px-3 py-2.5 text-xs gap-2"
                >
                  <span className="text-text-secondary font-medium shrink-0">{e.measured_at}</span>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-right">
                    {e.weight_kg && <span className="text-text-primary">{e.weight_kg} kg</span>}
                    {e.waist_cm && <span className="text-text-secondary">W: {e.waist_cm} cm</span>}
                    {e.hips_cm && <span className="text-text-secondary">H: {e.hips_cm} cm</span>}
                    {e.chest_cm && <span className="text-text-secondary">C: {e.chest_cm} cm</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Measurement tips */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <button
            onClick={() => setShowTips(p => !p)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-text-primary text-sm">How to Measure</h2>
            </div>
            {showTips ? (
              <ChevronUp className="w-4 h-4 text-text-secondary" />
            ) : (
              <ChevronDown className="w-4 h-4 text-text-secondary" />
            )}
          </button>
          {showTips && (
            <div className="mt-3 space-y-2.5">
              {TIPS.map(({ site, tip }) => (
                <div key={site} className="bg-background border border-border rounded-xl p-3">
                  <p className="text-xs font-semibold text-text-primary mb-0.5">{site}</p>
                  <p className="text-xs text-text-secondary leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Empty state */}
        {!loading && (!data?.measurements || data.measurements.length === 0) && !showForm && (
          <div className="bg-surface border border-border rounded-2xl p-10 text-center">
            <p className="text-4xl mb-3">📏</p>
            <p className="font-semibold text-text-primary mb-1">No measurements yet</p>
            <p className="text-sm text-text-secondary mb-4">
              Track waist, hips, arms and more to monitor your body composition over time.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-primary text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Add First Measurement
            </button>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  )
}
