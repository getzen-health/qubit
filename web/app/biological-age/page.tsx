'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Dna,
  Save,
  TrendingDown,
  TrendingUp,
  Minus,
  Flame,
  Shield,
} from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import {
  estimateBiologicalAge,
  assessBlueZone,
  getAgeColor,
  type BioAgeInputs,
  type BlueZoneInputs,
} from '@/lib/biological-age'

// ─── Tooltip style ────────────────────────────────────────────────────────────

const TT_STYLE = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── SliderInput ──────────────────────────────────────────────────────────────

function SliderInput({
  label, value, min, max, step = 1, unit = '', description = '', onChange,
}: {
  label: string; value: number; min: number; max: number
  step?: number; unit?: string; description?: string; onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-text-primary leading-tight">{label}</span>
        <span className="text-sm font-bold text-primary shrink-0">
          {Number.isInteger(step) ? value : value.toFixed(1)}{unit}
        </span>
      </div>
      {description && <p className="text-xs text-text-secondary">{description}</p>}
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary bg-surface-secondary"
      />
      <div className="flex justify-between text-[10px] text-text-secondary">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  )
}

// ─── ToggleInput ──────────────────────────────────────────────────────────────

function ToggleInput({
  label, value, description, onChange,
}: {
  label: string; value: boolean; description?: string; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        {description && <p className="text-xs text-text-secondary mt-0.5">{description}</p>}
      </div>
      <button
        type="button" onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${value ? 'bg-red-500' : 'bg-surface-secondary'}`}
        aria-pressed={value}
      >
        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${value ? 'translate-x-5' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}

// ─── SpeedometerGauge ─────────────────────────────────────────────────────────

function SpeedometerGauge({ pace }: { pace: number }) {
  const cx = 100, cy = 90, r = 68
  const paceMin = 0.7, paceMax = 1.3

  const toAngle = (p: number) =>
    180 + (Math.max(paceMin, Math.min(paceMax, p)) - paceMin) / (paceMax - paceMin) * 180

  // sweep=1 traces the upper (positive-angle) semicircle
  const arcPath = (p1: number, p2: number) => {
    const a1 = (toAngle(p1) * Math.PI) / 180
    const a2 = (toAngle(p2) * Math.PI) / 180
    const x1 = (cx + r * Math.cos(a1)).toFixed(2), y1 = (cy + r * Math.sin(a1)).toFixed(2)
    const x2 = (cx + r * Math.cos(a2)).toFixed(2), y2 = (cy + r * Math.sin(a2)).toFixed(2)
    const large = ((p2 - p1) / (paceMax - paceMin)) * 180 > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
  }

  const nAngle = (toAngle(pace) * Math.PI) / 180
  const nx = (cx + r * 0.62 * Math.cos(nAngle)).toFixed(2)
  const ny = (cy + r * 0.62 * Math.sin(nAngle)).toFixed(2)

  return (
    <svg width="200" height="108" viewBox="0 0 200 108"
      className="w-full max-w-[220px] mx-auto"
      aria-label={`Pace of aging: ${pace.toFixed(2)}x`}
    >
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="#374151" strokeWidth="11" strokeLinecap="round" />
      <path d={arcPath(0.70, 0.90)} fill="none" stroke="#22c55e" strokeWidth="11" strokeLinecap="round" opacity="0.85" />
      <path d={arcPath(0.90, 1.05)} fill="none" stroke="#eab308" strokeWidth="11" strokeLinecap="round" opacity="0.85" />
      <path d={arcPath(1.05, 1.20)} fill="none" stroke="#f97316" strokeWidth="11" strokeLinecap="round" opacity="0.85" />
      <path d={arcPath(1.20, 1.30)} fill="none" stroke="#ef4444" strokeWidth="11" strokeLinecap="round" opacity="0.85" />
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="white" strokeWidth="3" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="5" fill="white" />
      <text x="20" y={cy + 18} fontSize="9" fill="#9ca3af" textAnchor="middle">Slower</text>
      <text x={cx} y="11" fontSize="9" fill="#9ca3af" textAnchor="middle">1.0×</text>
      <text x="180" y={cy + 18} fontSize="9" fill="#9ca3af" textAnchor="middle">Faster</text>
      <text x={cx} y={cy + 20} fontSize="15" fontWeight="bold" fill="white" textAnchor="middle">
        {pace.toFixed(2)}×
      </text>
    </svg>
  )
}

// ─── Grade badge colours ──────────────────────────────────────────────────────

const GRADE_CLS: Record<string, string> = {
  A: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
  B: 'text-green-400   border-green-500/40   bg-green-500/10',
  C: 'text-yellow-400  border-yellow-500/40  bg-yellow-500/10',
  D: 'text-orange-400  border-orange-500/40  bg-orange-500/10',
  F: 'text-red-400     border-red-500/40     bg-red-500/10',
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_BIO: BioAgeInputs = {
  chronological_age: 35, resting_hr: 65, hrv_ms: 45, sleep_hours: 7.5,
  sleep_quality: 7, vo2max_estimate: 35, bmi: 23, waist_cm: 82,
  steps_per_day: 8000, smoking: false, alcohol_units_per_week: 5,
  stress_level: 5, social_connection: 6, sense_of_purpose: 6,
}

const DEFAULT_BLUE: BlueZoneInputs = {
  natural_movement: 6, purpose: 6, stress_management: 5, mindful_eating: 5,
  plant_based: 5, alcohol_moderation: 6, community: 5, family_first: 6, social_tribe: 5,
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Assessment {
  id: string; assessed_at: string; chronological_age: number | null
  biological_age: number | null; pace_of_aging: number | null; blue_zone_score: number | null
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BiologicalAgePage() {
  const [bio, setBio] = useState<BioAgeInputs>(DEFAULT_BIO)
  const [blue, setBlue] = useState<BlueZoneInputs>(DEFAULT_BLUE)
  const [history, setHistory] = useState<Assessment[]>([])
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const bioResult = estimateBiologicalAge(bio)
  const blueResult = assessBlueZone(blue)

  useEffect(() => {
    fetch('/api/biological-age')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return
        setHistory(data.assessments ?? [])
        const p = data.prefill
        if (!p) return
        setBio((prev) => ({
          ...prev,
          ...(p.resting_hr != null && { resting_hr: Math.round(p.resting_hr) }),
          ...(p.hrv_ms != null && { hrv_ms: Math.round(p.hrv_ms) }),
          ...(p.sleep_hours != null && { sleep_hours: Math.round(p.sleep_hours * 2) / 2 }),
          ...(p.sleep_quality != null && { sleep_quality: Math.min(10, Math.max(1, Math.round(p.sleep_quality))) }),
          ...(p.steps_per_day != null && { steps_per_day: Math.round(p.steps_per_day / 500) * 500 }),
        }))
      })
      .catch(() => {})
  }, [])

  async function handleSave() {
    setSaving(true); setSavedMsg('')
    try {
      const res = await fetch('/api/biological-age', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chronological_age: bio.chronological_age,
          biological_age: bioResult.biological_age,
          pace_of_aging: bioResult.pace_of_aging,
          blue_zone_score: blueResult.total_score,
          inputs: { bio, blue },
          result: { bio: bioResult, blue: blueResult },
        }),
      })
      if (res.ok) {
        const { assessment } = await res.json()
        setHistory((prev) => [assessment, ...prev])
        setSavedMsg('Assessment saved ✓')
        setTimeout(() => setSavedMsg(''), 3000)
      }
    } finally { setSaving(false) }
  }

  function setBioField<K extends keyof BioAgeInputs>(key: K, val: BioAgeInputs[K]) {
    setBio((prev) => ({ ...prev, [key]: val }))
  }
  function setBlueField(key: keyof BlueZoneInputs, val: number) {
    setBlue((prev) => ({ ...prev, [key]: val }))
  }

  const diff = bioResult.age_difference
  const colorClass = getAgeColor(diff)
  const diffEmoji = diff < -5 ? '🎉' : diff < -1 ? '😊' : diff <= 1 ? '😐' : diff <= 5 ? '😟' : '😰'

  const radarData = [
    { subject: 'Movement', value: blue.natural_movement },
    { subject: 'Purpose',  value: blue.purpose },
    { subject: 'Stress',   value: blue.stress_management },
    { subject: 'Eating',   value: blue.mindful_eating },
    { subject: 'PlantDiet',value: blue.plant_based },
    { subject: 'Alcohol',  value: blue.alcohol_moderation },
    { subject: 'Community',value: blue.community },
    { subject: 'Family',   value: blue.family_first },
    { subject: 'Social',   value: blue.social_tribe },
  ]

  const historyData = [...history].reverse().map((a) => ({
    date: a.assessed_at?.slice(5) ?? '',
    bio: a.biological_age,
    chrono: a.chronological_age,
    pace: a.pace_of_aging,
  }))

  const BLUE_SLIDERS: { key: keyof BlueZoneInputs; label: string; desc: string }[] = [
    { key: 'natural_movement',  label: 'Natural Movement',    desc: 'Daily walking, gardening, stairs — non-exercise movement' },
    { key: 'purpose',           label: 'Purpose (Ikigai)',    desc: 'Your reason for getting up each morning' },
    { key: 'stress_management', label: 'Stress Management',  desc: 'Daily downshift rituals: meditation, prayer, napping' },
    { key: 'mindful_eating',    label: 'Mindful Eating',     desc: 'Hara hachi bu — stop at 80% full, eat slowly' },
    { key: 'plant_based',       label: 'Plant-Based Diet',   desc: 'Legumes, vegetables, whole grains as dietary foundation' },
    { key: 'alcohol_moderation',label: 'Alcohol Moderation', desc: '0-2 drinks/day max; abstaining also scores 10' },
    { key: 'community',         label: 'Community Belonging',desc: 'Regular participation in faith, purpose, or interest groups' },
    { key: 'family_first',      label: 'Family First',       desc: 'Quality time with partner, parents, children' },
    { key: 'social_tribe',      label: 'Social Tribe',       desc: 'Close circle of health-conscious, supportive friends' },
  ]

  return (
    <div className="min-h-screen bg-background">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/explore" className="p-2 rounded-lg hover:bg-surface transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <Dna className="w-6 h-6 text-primary" />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-text-primary">Biological Age</h1>
            <p className="text-xs text-text-secondary">PhenoAge-inspired · Blue Zone Power 9</p>
          </div>
          <button
            onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-50 shrink-0"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
        {savedMsg && <div className="text-center text-xs text-emerald-400 pb-2">{savedMsg}</div>}
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-28 space-y-8">

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 1 — BIOLOGICAL AGE CALCULATOR
        ══════════════════════════════════════════════════════════════════════ */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-text-primary">🧬 Biological Age Calculator</h2>

          {/* Result display */}
          <div className="bg-surface border border-border rounded-2xl p-6 text-center space-y-3">
            <div className={`text-7xl font-black tabular-nums ${colorClass}`}>
              {bioResult.biological_age}
            </div>
            <div className="text-sm text-text-secondary">biological age</div>
            <div className="text-sm text-text-secondary">
              vs <span className="font-semibold text-text-primary">{bio.chronological_age}</span> chronological
            </div>
            <div className={`text-xl font-bold ${colorClass} flex items-center justify-center gap-1.5`}>
              {diff < -1 ? <TrendingDown className="w-5 h-5" />
                : diff > 1 ? <TrendingUp className="w-5 h-5" />
                : <Minus className="w-5 h-5" />}
              {Math.abs(diff)} yr {diff < 0 ? 'younger' : diff > 0 ? 'older' : 'same'} {diffEmoji}
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-secondary border border-border text-sm font-medium text-text-primary">
              {bioResult.category}
            </span>

            {/* Pace of aging */}
            <div className="pt-2">
              <p className="text-xs font-medium text-text-secondary mb-2">Pace of Aging</p>
              <SpeedometerGauge pace={bioResult.pace_of_aging} />
              <p className="text-xs text-text-secondary mt-1">
                {bioResult.pace_of_aging < 0.98
                  ? 'Aging slower than chronological time ✓'
                  : bioResult.pace_of_aging > 1.02
                  ? 'Aging faster than chronological time'
                  : 'Aging at same rate as chronological time'}
              </p>
            </div>
          </div>

          {/* Improvement potential */}
          {bioResult.improvement_potential > 0 && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
              <p className="text-sm font-semibold text-emerald-400 mb-1">
                💡 You could be {bioResult.improvement_potential} years younger
              </p>
              <p className="text-xs text-text-secondary">
                Focus on:{' '}
                {bioResult.top_aging_factors
                  .filter((f) => f.improvable)
                  .slice(0, 3)
                  .map((f) => f.factor)
                  .join(' · ')}
              </p>
            </div>
          )}

          {/* Factors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {bioResult.top_aging_factors.length > 0 && (
              <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-red-400" />
                  <h3 className="text-sm font-semibold text-red-400">Aging Factors</h3>
                </div>
                {bioResult.top_aging_factors.map((f, i) => (
                  <div key={i} className="flex items-start justify-between gap-2">
                    <span className="text-xs text-text-secondary flex-1 leading-snug">
                      {f.factor}
                      {f.improvable && (
                        <span className="ml-1 text-[10px] text-yellow-500 font-medium">✦ improvable</span>
                      )}
                    </span>
                    <span className="text-xs font-bold text-red-400 shrink-0">+{f.impact_years} yr</span>
                  </div>
                ))}
              </div>
            )}
            {bioResult.top_protective_factors.length > 0 && (
              <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-green-400" />
                  <h3 className="text-sm font-semibold text-green-400">Protective Factors</h3>
                </div>
                {bioResult.top_protective_factors.map((f, i) => (
                  <div key={i} className="flex items-start justify-between gap-2">
                    <span className="text-xs text-text-secondary flex-1 leading-snug">{f.factor}</span>
                    <span className="text-xs font-bold text-green-400 shrink-0">-{f.benefit_years} yr</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inputs */}
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-6">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Your Biomarkers</h3>
            <SliderInput label="Chronological Age" value={bio.chronological_age} min={18} max={100} unit=" yr"
              onChange={(v) => setBioField('chronological_age', v)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <SliderInput label="Resting Heart Rate" value={bio.resting_hr ?? 65} min={40} max={120} unit=" bpm"
                description="Lower is generally better"
                onChange={(v) => setBioField('resting_hr', v)} />
              <SliderInput label="HRV (RMSSD)" value={bio.hrv_ms ?? 45} min={5} max={150} unit=" ms"
                description="Higher = better recovery"
                onChange={(v) => setBioField('hrv_ms', v)} />
              <SliderInput label="Sleep Duration" value={bio.sleep_hours ?? 7.5} min={4} max={12} step={0.5} unit=" h"
                description="Optimal: 7-9 h/night"
                onChange={(v) => setBioField('sleep_hours', v)} />
              <SliderInput label="Sleep Quality" value={bio.sleep_quality ?? 7} min={1} max={10}
                description="1 = very poor · 10 = excellent"
                onChange={(v) => setBioField('sleep_quality', v)} />
              <SliderInput label="VO₂max Estimate" value={bio.vo2max_estimate ?? 35} min={15} max={75} unit=" mL/kg/min"
                description="Strongest single mortality predictor"
                onChange={(v) => setBioField('vo2max_estimate', v)} />
              <SliderInput label="Daily Steps (7-day avg)" value={bio.steps_per_day ?? 8000} min={0} max={20000} step={500}
                description="Target ≥7,500 steps/day"
                onChange={(v) => setBioField('steps_per_day', v)} />
              <SliderInput label="BMI" value={bio.bmi ?? 23} min={15} max={50} step={0.5}
                description="Healthy range: 18.5-25"
                onChange={(v) => setBioField('bmi', v)} />
              <SliderInput label="Waist Circumference" value={bio.waist_cm ?? 82} min={50} max={150} unit=" cm"
                description="Visceral fat proxy"
                onChange={(v) => setBioField('waist_cm', v)} />
              <SliderInput label="Alcohol (units/week)" value={bio.alcohol_units_per_week ?? 5} min={0} max={50}
                description="1 unit ≈ 125 mL wine / 250 mL beer"
                onChange={(v) => setBioField('alcohol_units_per_week', v)} />
              <SliderInput label="Chronic Stress" value={bio.stress_level ?? 5} min={1} max={10}
                description="1 = very low · 10 = overwhelming"
                onChange={(v) => setBioField('stress_level', v)} />
              <SliderInput label="Social Connection" value={bio.social_connection ?? 6} min={1} max={10}
                description="Quality and frequency of relationships"
                onChange={(v) => setBioField('social_connection', v)} />
              <SliderInput label="Sense of Purpose" value={bio.sense_of_purpose ?? 6} min={1} max={10}
                description="Ikigai — reason you get up each day"
                onChange={(v) => setBioField('sense_of_purpose', v)} />
            </div>
            <ToggleInput label="Smoking" value={bio.smoking}
              description="+5 years — accelerates telomere shortening"
              onChange={(v) => setBioField('smoking', v)} />
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 2 — BLUE ZONE ASSESSMENT
        ══════════════════════════════════════════════════════════════════════ */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-text-primary">🌿 Blue Zone Lifestyle Assessment</h2>
          <p className="text-sm text-text-secondary">
            {"Buettner's Power 9 — lifestyle factors shared by the world's longest-lived populations (Okinawa, Sardinia, Nicoya, Ikaria, Loma Linda)."}
          </p>

          {/* Score card */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="text-5xl font-black text-primary tabular-nums">
                  {blueResult.total_score}
                  <span className="text-xl font-medium text-text-secondary">/100</span>
                </div>
                <div className="text-sm text-text-secondary mt-1">Blue Zone score</div>
              </div>
              <div className={`text-4xl font-black border-2 rounded-2xl px-4 py-2 ${GRADE_CLS[blueResult.grade] ?? ''}`}>
                {blueResult.grade}
              </div>
            </div>
            <div className="text-sm text-text-secondary">
              Estimated longevity bonus:{' '}
              <span className="font-bold text-emerald-400">+{blueResult.longevity_bonus_years} years</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-xs font-semibold text-green-400 mb-1">✓ Strongest</p>
                <ul className="space-y-0.5">
                  {blueResult.strongest_pillars.map((p) => (
                    <li key={p} className="text-xs text-text-secondary">{p}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-red-400 mb-1">✗ Needs work</p>
                <ul className="space-y-0.5">
                  {blueResult.weakest_pillars.map((p) => (
                    <li key={p} className="text-xs text-text-secondary">{p}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Radar chart */}
          <div className="bg-surface border border-border rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Power 9 Radar</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                  <Radar dataKey="value"
                    fill="var(--color-primary, #6366f1)" fillOpacity={0.3}
                    stroke="var(--color-primary, #6366f1)" strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Power 9 sliders */}
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-5">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Rate Your Power 9</h3>
            {BLUE_SLIDERS.map(({ key, label, desc }) => (
              <SliderInput key={key} label={label} value={blue[key]} min={1} max={10}
                description={desc} onChange={(v) => setBlueField(key, v)} />
            ))}
          </div>

          {/* Recommendations */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Top Recommendations</h3>
            {blueResult.recommendations.map((rec, i) => (
              <div key={i} className="bg-surface border border-border rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full">
                    Improve
                  </span>
                  <span className="text-sm font-semibold text-text-primary">{rec.pillar}</span>
                </div>
                <p className="text-xs text-text-primary leading-relaxed">{rec.action}</p>
                <p className="text-[11px] text-text-secondary italic leading-relaxed">📚 {rec.research}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 3 — HISTORY
        ══════════════════════════════════════════════════════════════════════ */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-text-primary">📈 Historical Trend</h2>

          {historyData.length < 2 ? (
            <div className="bg-surface border border-border rounded-2xl p-8 text-center">
              <Dna className="w-10 h-10 text-text-secondary mx-auto mb-3 opacity-40" />
              <p className="text-sm text-text-secondary">Save at least 2 assessments to see your trend.</p>
              <p className="text-xs text-text-secondary mt-1">Re-assess monthly to track changes over time.</p>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-text-secondary mb-2">Biological Age Over Time</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} width={28} />
                      <Tooltip contentStyle={TT_STYLE} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="bio" name="Biological Age"
                        stroke="var(--color-primary, #6366f1)" strokeWidth={2}
                        dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="chrono" name="Chronological"
                        stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-text-secondary mb-2">Pace of Aging Trend</h3>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                      <YAxis domain={[0.7, 1.3]} tick={{ fontSize: 10, fill: '#9ca3af' }} width={32} />
                      <Tooltip contentStyle={TT_STYLE} />
                      <Line type="monotone" dataKey="pace" name="Pace of Aging"
                        stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[11px] text-text-secondary mt-1">1.0 = same pace · &lt;1.0 = aging slower · &gt;1.0 = aging faster</p>
              </div>
            </div>
          )}
        </section>

      </main>
      <BottomNav />
    </div>
  )
}
