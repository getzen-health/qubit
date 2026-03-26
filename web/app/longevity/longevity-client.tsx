'use client'

import React, { useState, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  BarChart, Bar, Cell as ReCell,
} from 'recharts'
import {
  LONGEVITY_INTERVENTIONS, BLUEPRINT_CHECKLIST,
  calculateLongevityScore, calculateBlueprintScore, projectedHealthspanGain,
  estimateEpigeneticAge,
  type LongevityIntervention, type EvidenceGrade, type PillarScores,
} from '@/lib/longevity'

// ── Types ────────────────────────────────────────────────────

interface Checkin {
  id: string
  date: string
  pillar_scores: PillarScores
  blueprint_items_completed: string[]
  blueprint_score: number
  overall_score: number
  epigenetic_age_delta: number
  notes?: string | null
}

interface Props {
  checkins: Checkin[]
  latestVO2: number | null
}

// ── Constants ────────────────────────────────────────────────

const PILLARS: { key: keyof PillarScores; label: string; emoji: string; color: string }[] = [
  { key: 'exercise',    label: 'Exercise',     emoji: '💪', color: '#f59e0b' },
  { key: 'sleep',       label: 'Sleep',        emoji: '🌙', color: '#8b5cf6' },
  { key: 'nutrition',   label: 'Nutrition',    emoji: '🥗', color: '#22c55e' },
  { key: 'fasting',     label: 'Fasting',      emoji: '⏱️', color: '#06b6d4' },
  { key: 'stress',      label: 'Stress Mgmt',  emoji: '🧘', color: '#f43f5e' },
  { key: 'supplements', label: 'Supplements',  emoji: '💊', color: '#a78bfa' },
  { key: 'social',      label: 'Social',       emoji: '👥', color: '#fb923c' },
  { key: 'purpose',     label: 'Purpose',      emoji: '🎯', color: '#4ade80' },
]

const GRADE_COLORS: Record<EvidenceGrade, string> = {
  A: '#22c55e',
  B: '#3b82f6',
  C: '#f59e0b',
  D: '#ef4444',
}

const GRADE_BG: Record<EvidenceGrade, string> = {
  A: 'bg-green-500/10 text-green-400 border-green-500/20',
  B: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  C: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  D: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const BLANK_PILLARS: PillarScores = {
  sleep: 50, exercise: 50, nutrition: 50, fasting: 50,
  stress: 50, supplements: 50, social: 50, purpose: 50,
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ── Score Gauge ──────────────────────────────────────────────

function ScoreGauge({ score, label, color }: { score: number; label: string; color: string }) {
  const r = 52
  const circ = 2 * Math.PI * r
  return (
    <svg width={136} height={136} viewBox="0 0 136 136">
      <circle cx={68} cy={68} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={14} />
      <circle
        cx={68} cy={68} r={r}
        fill="none"
        stroke={color}
        strokeWidth={14}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - score / 100)}
        transform="rotate(-90 68 68)"
        style={{ transition: 'stroke-dashoffset 0.9s ease' }}
      />
      <text x={68} y={62} textAnchor="middle" fontSize={30} fontWeight="bold" fill={color}>
        {Math.round(score)}
      </text>
      <text x={68} y={80} textAnchor="middle" fontSize={11} fill="rgba(255,255,255,0.4)">
        {label}
      </text>
    </svg>
  )
}

// ── Pillar Slider ─────────────────────────────────────────────

function PillarSlider({
  pillar, value, onChange,
}: {
  pillar: typeof PILLARS[number]
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-text-secondary">
          {pillar.emoji} {pillar.label}
        </span>
        <span className="text-xs font-bold" style={{ color: pillar.color }}>{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-surface-secondary"
        style={{ accentColor: pillar.color }}
      />
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────

export function LongevityClient({ checkins, latestVO2 }: Props) {
  const [tab, setTab] = useState<'score' | 'interventions' | 'trends'>('score')
  const [gradeFilter, setGradeFilter] = useState<EvidenceGrade | 'all'>('all')
  const [logOpen, setLogOpen] = useState(false)
  const [pillars, setPillars] = useState<PillarScores>(BLANK_PILLARS)
  const [bpCompleted, setBpCompleted] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [localCheckins, setLocalCheckins] = useState<Checkin[]>(checkins)

  const latest = localCheckins[0] ?? null
  const today = new Date().toISOString().slice(0, 10)
  const hasToday = latest?.date === today

  const scoreColor = (s: number) =>
    s >= 80 ? '#22c55e' : s >= 65 ? '#4ade80' : s >= 50 ? '#facc15' : s >= 35 ? '#fb923c' : '#ef4444'

  const scoreLabel = (s: number) =>
    s >= 80 ? 'Elite' : s >= 65 ? 'Excellent' : s >= 50 ? 'Good' : s >= 35 ? 'Average' : 'Below Avg'

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const bpScore = calculateBlueprintScore(bpCompleted)
      const overall = calculateLongevityScore(pillars)
      const epigDelta = estimateEpigeneticAge(35, latestVO2, pillars.sleep, pillars.stress, null, pillars.nutrition)
      const res = await fetch('/api/longevity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today,
          pillar_scores: pillars,
          blueprint_items_completed: bpCompleted,
          blueprint_score: bpScore,
          overall_score: overall,
          epigenetic_age_delta: epigDelta,
        }),
      })
      if (res.ok) {
        const { data } = await res.json()
        setLocalCheckins(prev => {
          const filtered = prev.filter(c => c.date !== today)
          return [data, ...filtered].sort((a, b) => b.date.localeCompare(a.date))
        })
        setLogOpen(false)
      }
    } finally {
      setSaving(false)
    }
  }, [pillars, bpCompleted, today, latestVO2])

  const toggleBp = (id: string) =>
    setBpCompleted(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const filteredInterventions: LongevityIntervention[] =
    gradeFilter === 'all' ? LONGEVITY_INTERVENTIONS : LONGEVITY_INTERVENTIONS.filter(i => i.evidence_grade === gradeFilter)

  // ── Trend data ────────────────────────────────────────────
  const last30 = localCheckins.filter(c => {
    const d = new Date(c.date)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    return d >= cutoff
  }).slice().reverse()

  const trendScore = last30.map(c => ({
    date: new Date(c.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: c.overall_score,
  }))

  const trendEpig = last30.map(c => ({
    date: new Date(c.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    delta: c.epigenetic_age_delta,
  }))

  const trendBlueprint = last30.slice(-7).map(c => ({
    date: new Date(c.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: c.blueprint_score,
  }))

  const radarData = latest
    ? PILLARS.map(p => ({ pillar: p.label, value: latest.pillar_scores[p.key] ?? 0 }))
    : PILLARS.map(p => ({ pillar: p.label, value: 0 }))

  const overallScore = latest?.overall_score ?? 0
  const blueprintScore = latest?.blueprint_score ?? 0
  const epigDelta = latest?.epigenetic_age_delta ?? 0
  const healthspanGain = projectedHealthspanGain(overallScore)

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 bg-surface rounded-2xl border border-border p-1">
        {(['score', 'interventions', 'trends'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-colors capitalize ${
              tab === t
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t === 'score' ? '🧬 Score' : t === 'interventions' ? '🔬 Interventions' : '📈 Trends'}
          </button>
        ))}
      </div>

      {/* ── SCORE TAB ─────────────────────────────────────────── */}
      {tab === 'score' && (
        <div className="space-y-4">
          {/* Main score + epigenetic + blueprint */}
          <div className="grid grid-cols-3 gap-3">
            {/* Longevity score gauge */}
            <div className="col-span-1 bg-surface rounded-2xl border border-border p-4 flex flex-col items-center justify-center">
              <ScoreGauge
                score={overallScore}
                label={scoreLabel(overallScore)}
                color={scoreColor(overallScore)}
              />
            </div>

            {/* Epigenetic age delta */}
            <div className="bg-surface rounded-2xl border border-border p-4 flex flex-col justify-center">
              <p className="text-xs text-text-secondary mb-1">Epigenetic Age</p>
              <p
                className="text-2xl font-bold"
                style={{ color: epigDelta <= 0 ? '#22c55e' : '#ef4444' }}
              >
                {epigDelta < 0
                  ? `${Math.abs(epigDelta)}y younger`
                  : epigDelta > 0
                  ? `${epigDelta}y older`
                  : 'On track'}
              </p>
              <p className="text-xs text-text-secondary mt-1 opacity-60">vs chronological age</p>
            </div>

            {/* Blueprint */}
            <div className="bg-surface rounded-2xl border border-border p-4 flex flex-col justify-center">
              <p className="text-xs text-text-secondary mb-1">Blueprint Score</p>
              <p className="text-2xl font-bold text-primary">{blueprintScore}</p>
              <div className="w-full bg-surface-secondary rounded-full h-1.5 mt-2">
                <div
                  className="h-1.5 rounded-full transition-all bg-primary"
                  style={{ width: `${blueprintScore}%` }}
                />
              </div>
              <p className="text-xs text-text-secondary mt-1 opacity-60">Bryan Johnson protocol</p>
            </div>
          </div>

          {/* Healthspan projection */}
          {overallScore > 0 && (
            <div className="bg-surface rounded-2xl border border-border p-4">
              <p className="text-xs font-semibold text-text-secondary mb-2">Projected Healthspan Gain</p>
              <div className="flex gap-4">
                <div>
                  <p className="text-xl font-bold text-green-400">+{healthspanGain.conservative}y</p>
                  <p className="text-xs text-text-secondary opacity-60">Conservative</p>
                </div>
                <div className="w-px bg-border" />
                <div>
                  <p className="text-xl font-bold text-emerald-300">+{healthspanGain.optimistic}y</p>
                  <p className="text-xs text-text-secondary opacity-60">Optimistic</p>
                </div>
                <p className="text-xs text-text-secondary opacity-40 self-end ml-auto text-right max-w-[140px]">
                  vs sedentary baseline; CALERIE + Blue Zones data
                </p>
              </div>
            </div>
          )}

          {/* 8 Pillar breakdown */}
          <div className="grid grid-cols-2 gap-2">
            {PILLARS.map(p => {
              const val = latest?.pillar_scores[p.key] ?? null
              return (
                <div key={p.key} className="bg-surface rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-secondary">{p.emoji} {p.label}</span>
                    {val !== null
                      ? <span className="text-xs font-bold" style={{ color: p.color }}>{val}</span>
                      : <span className="text-xs text-text-secondary opacity-30">—</span>
                    }
                  </div>
                  <div className="w-full bg-surface-secondary rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${val ?? 0}%`, backgroundColor: p.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Log Today button */}
          <button
            onClick={() => {
              if (hasToday && latest) {
                setPillars(latest.pillar_scores)
                setBpCompleted(latest.blueprint_items_completed)
              }
              setLogOpen(o => !o)
            }}
            className="w-full py-3 rounded-2xl border border-primary text-primary font-semibold text-sm hover:bg-primary/10 transition-colors"
          >
            {logOpen ? '✕ Close' : hasToday ? '✏️ Edit Today\'s Log' : '+ Log Today'}
          </button>

          {/* Log form */}
          {logOpen && (
            <div className="bg-surface rounded-2xl border border-border p-5 space-y-5">
              <p className="text-sm font-semibold text-text-primary">Rate each pillar for today (0–100)</p>

              <div className="space-y-4">
                {PILLARS.map(p => (
                  <PillarSlider
                    key={p.key}
                    pillar={p}
                    value={pillars[p.key]}
                    onChange={v => setPillars(prev => ({ ...prev, [p.key]: v }))}
                  />
                ))}
              </div>

              {/* Blueprint checklist — daily items */}
              <div>
                <p className="text-xs font-semibold text-text-secondary mb-2">Blueprint daily checklist</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {BLUEPRINT_CHECKLIST.filter(i => i.frequency === 'daily').map(item => (
                    <label
                      key={item.id}
                      className="flex items-center gap-2.5 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={bpCompleted.includes(item.id)}
                        onChange={() => toggleBp(item.id)}
                        className="w-4 h-4 rounded accent-primary"
                      />
                      <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors">
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-text-secondary opacity-40 mt-2">
                  Blueprint score preview: {calculateBlueprintScore(bpCompleted)}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <p className="text-xs text-text-secondary opacity-50">
                  Overall score preview: <span className="font-bold text-text-primary">{calculateLongevityScore(pillars)}</span>
                </p>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="ml-auto px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/80 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          )}

          {!latest && !logOpen && (
            <div className="text-center py-10 space-y-2">
              <span className="text-4xl">🧬</span>
              <p className="text-text-secondary text-sm">No longevity data yet. Log your first check-in above.</p>
            </div>
          )}
        </div>
      )}

      {/* ── INTERVENTIONS TAB ─────────────────────────────────── */}
      {tab === 'interventions' && (
        <div className="space-y-4">
          {/* Grade filter */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'A', 'B', 'C', 'D'] as const).map(g => (
              <button
                key={g}
                onClick={() => setGradeFilter(g)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  gradeFilter === g
                    ? g === 'all'
                      ? 'bg-text-primary text-background border-text-primary'
                      : `border-[${GRADE_COLORS[g as EvidenceGrade]}]`
                    : 'bg-surface border-border text-text-secondary hover:text-text-primary'
                }`}
                style={
                  gradeFilter === g && g !== 'all'
                    ? { background: GRADE_COLORS[g as EvidenceGrade] + '22', color: GRADE_COLORS[g as EvidenceGrade], borderColor: GRADE_COLORS[g as EvidenceGrade] + '66' }
                    : undefined
                }
              >
                {g === 'all' ? 'All' : `Grade ${g}`}
                <span className="ml-1.5 opacity-60 text-[10px]">
                  {g === 'all'
                    ? LONGEVITY_INTERVENTIONS.length
                    : LONGEVITY_INTERVENTIONS.filter(i => i.evidence_grade === g).length}
                </span>
              </button>
            ))}
          </div>

          {/* Intervention cards */}
          <div className="space-y-3">
            {filteredInterventions.map(item => (
              <div key={item.name} className="bg-surface rounded-2xl border border-border p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-text-primary leading-snug">{item.name}</p>
                  <span
                    className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${GRADE_BG[item.evidence_grade]}`}
                  >
                    {item.evidence_grade}
                  </span>
                </div>

                <p className="text-xs text-text-secondary opacity-60">{item.category}</p>

                <div>
                  <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-0.5">Mechanism</p>
                  <p className="text-xs text-text-secondary">{item.mechanism}</p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-0.5">Dose / Protocol</p>
                  <p className="text-xs text-text-primary">{item.dose}</p>
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                  {item.citations.map(c => (
                    <span key={c} className="text-[10px] bg-surface-secondary text-text-secondary px-2 py-0.5 rounded-full border border-border">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TRENDS TAB ────────────────────────────────────────── */}
      {tab === 'trends' && (
        <div className="space-y-4">
          {localCheckins.length < 2 ? (
            <div className="text-center py-16 space-y-2">
              <span className="text-4xl">📈</span>
              <p className="text-text-secondary text-sm">Log at least 2 days to see trends.</p>
            </div>
          ) : (
            <>
              {/* Overall score line */}
              <div className="bg-surface rounded-2xl border border-border p-4">
                <p className="text-sm font-medium text-text-secondary mb-3">30-Day Longevity Score</p>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={trendScore} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }} width={28} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [Math.round(v), 'Score']} />
                    <Line type="monotone" dataKey="score" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3, fill: '#a78bfa' }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Epigenetic age delta line */}
              <div className="bg-surface rounded-2xl border border-border p-4">
                <p className="text-sm font-medium text-text-secondary mb-1">Epigenetic Age Delta</p>
                <p className="text-xs text-text-secondary opacity-50 mb-3">Negative = biologically younger</p>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={trendEpig} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }} width={28} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v > 0 ? '+' : ''}${v}y`, 'Δ Age']} />
                    <Line type="monotone" dataKey="delta" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: '#22c55e' }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Pillar radar */}
              <div className="bg-surface rounded-2xl border border-border p-4">
                <p className="text-sm font-medium text-text-secondary mb-3">Pillar Radar (Latest)</p>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.07)" />
                    <PolarAngleAxis dataKey="pillar" tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }} />
                    <Radar name="Pillars" dataKey="value" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.25} />
                    <Tooltip contentStyle={tooltipStyle} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Blueprint bar */}
              {trendBlueprint.length > 0 && (
                <div className="bg-surface rounded-2xl border border-border p-4">
                  <p className="text-sm font-medium text-text-secondary mb-3">Blueprint Compliance (Last 7 days)</p>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={trendBlueprint} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }} width={28} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [Math.round(v), 'Blueprint %']} />
                      <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                        {trendBlueprint.map((entry, i) => (
                          <ReCell key={i} fill={entry.score >= 70 ? '#22c55e' : entry.score >= 50 ? '#facc15' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Scientific disclaimer */}
      <p className="text-[10px] text-text-secondary opacity-30 text-center pb-2">
        For informational purposes only · Not medical advice · Based on published research
      </p>
    </div>
  )
}
