'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import {
  calcInflammationScore,
  crpProxyColor,
  crpProxyLabel,
  diiCategoryColor,
  omegaRatioCategory,
  ANTI_INFLAMMATORY_FOODS,
  INFLAMMATORY_TRIGGERS,
  MED_DIET_CHECKLIST,
} from '@/lib/inflammation'
import type { InflammationLog, InflammationScore } from '@/lib/inflammation'

// ─── Score ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 160 }: { score: number; size?: number }) {
  const r = (size - 20) / 2
  const circ = 2 * Math.PI * r
  // For CRP proxy: lower = better, so fill inversely
  const filled = ((100 - score) / 100) * circ
  const color = crpProxyColor(score)
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="10"
        className="text-surface-secondary"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circ - filled}`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    </svg>
  )
}

// ─── Default empty form ───────────────────────────────────────────────────────
function emptyForm(): Omit<InflammationLog, 'user_id' | 'id' | 'created_at' | 'updated_at'> {
  return {
    date: new Date().toISOString().slice(0, 10),
    omega3_servings: 0,
    vegetables_servings: 0,
    berries_servings: 0,
    turmeric_used: false,
    ginger_used: false,
    green_tea_cups: 0,
    fiber_g: 0,
    sugar_drinks: 0,
    processed_meat: 0,
    trans_fat_items: 0,
    cooking_oil_servings: 0,
    processed_snacks: 0,
    grain_fed_meat: 0,
    fatty_fish_servings: 0,
    omega3_supplement: false,
    flax_chia_servings: 0,
    walnuts_servings: 0,
    sleep_hours: 7,
    stress_level: 5,
    exercise_minutes_week: 0,
    waist_cm: null,
    biological_sex: null,
    smoking_status: 'never',
    notes: null,
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  initialLogs: InflammationLog[]
  todayLog: InflammationLog | null
  currentScore: InflammationScore | null
  trend: {
    date: string
    crp_proxy: number
    diet_score: number
    omega_ratio: number
    dii_category: string
  }[]
}

// ─── Rating badge colours ─────────────────────────────────────────────────────
function ratingColor(r: string): string {
  if (r === 'Excellent') return 'bg-green-500/15 text-green-500 border-green-500/30'
  if (r === 'Good') return 'bg-blue-500/15 text-blue-500 border-blue-500/30'
  if (r === 'Moderate') return 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30'
  return 'bg-surface text-text-secondary border-border'
}

// ─── Main component ───────────────────────────────────────────────────────────
export function InflammationClient({ initialLogs, todayLog, currentScore, trend }: Props) {
  const [tab, setTab] = useState<'today' | 'foods' | 'trends'>('today')
  const [form, setForm] = useState<ReturnType<typeof emptyForm>>(
    todayLog
      ? {
          date: todayLog.date,
          omega3_servings: todayLog.omega3_servings,
          vegetables_servings: todayLog.vegetables_servings,
          berries_servings: todayLog.berries_servings,
          turmeric_used: todayLog.turmeric_used,
          ginger_used: todayLog.ginger_used,
          green_tea_cups: todayLog.green_tea_cups,
          fiber_g: todayLog.fiber_g,
          sugar_drinks: todayLog.sugar_drinks,
          processed_meat: todayLog.processed_meat,
          trans_fat_items: todayLog.trans_fat_items,
          cooking_oil_servings: todayLog.cooking_oil_servings,
          processed_snacks: todayLog.processed_snacks,
          grain_fed_meat: todayLog.grain_fed_meat,
          fatty_fish_servings: todayLog.fatty_fish_servings,
          omega3_supplement: todayLog.omega3_supplement,
          flax_chia_servings: todayLog.flax_chia_servings,
          walnuts_servings: todayLog.walnuts_servings,
          sleep_hours: todayLog.sleep_hours,
          stress_level: todayLog.stress_level,
          exercise_minutes_week: todayLog.exercise_minutes_week,
          waist_cm: todayLog.waist_cm,
          biological_sex: todayLog.biological_sex,
          smoking_status: todayLog.smoking_status,
          notes: todayLog.notes ?? null,
        }
      : emptyForm()
  )
  const [liveScore, setLiveScore] = useState<InflammationScore | null>(currentScore)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [medChecked, setMedChecked] = useState<Set<string>>(new Set())

  function num(field: keyof typeof form) {
    return (form[field] as number) ?? 0
  }

  function setNum(field: keyof typeof form, val: number) {
    const updated = { ...form, [field]: val }
    setForm(updated)
    setLiveScore(calcInflammationScore(updated as InflammationLog))
  }

  function setBool(field: keyof typeof form, val: boolean) {
    const updated = { ...form, [field]: val }
    setForm(updated)
    setLiveScore(calcInflammationScore(updated as InflammationLog))
  }

  async function handleSave() {
    setSaving(true)
    setSavedMsg('')
    try {
      const res = await fetch('/api/inflammation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Save failed')
      const { score } = await res.json()
      setLiveScore(score)
      setSavedMsg('Saved ✓')
    } catch (e: unknown) {
      setSavedMsg(e instanceof Error ? e.message : 'Error saving')
    } finally {
      setSaving(false)
    }
  }

  const score = liveScore
  const crpColor = score ? crpProxyColor(score.total) : '#94a3b8'
  const crpLabel = score ? crpProxyLabel(score.total) : '—'

  // DII category badge colour
  const diiBgMap: Record<string, string> = {
    'Anti-inflammatory': 'bg-green-500/15 text-green-600 border-green-500/30',
    Neutral: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30',
    'Pro-inflammatory': 'bg-orange-500/15 text-orange-500 border-orange-500/30',
    'Highly Pro-inflammatory': 'bg-red-500/15 text-red-500 border-red-500/30',
  }

  // ─── DII category frequency for trends tab ────────────────────────────────
  const diiFreqMap: Record<string, number> = {}
  trend.forEach((t) => {
    diiFreqMap[t.dii_category] = (diiFreqMap[t.dii_category] ?? 0) + 1
  })
  const diiFreqData = Object.entries(diiFreqMap).map(([name, count]) => ({ name, count }))

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur pt-4 pb-3 border-b border-border mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-text-primary">🔥 Inflammation</h1>
            <p className="text-xs text-text-secondary">CRP proxy · DII · Omega-6:3</p>
          </div>
          {score && (
            <div className="text-right">
              <span className="text-2xl font-bold" style={{ color: crpColor }}>
                {score.total}
              </span>
              <p className="text-xs text-text-secondary">{crpLabel} risk</p>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {(['today', 'foods', 'trends'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium capitalize transition-colors border ${
                tab === t
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-surface border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              {t === 'today' ? '📊 Today' : t === 'foods' ? '🥗 Foods' : '📈 Trends'}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════ TODAY TAB ═══════════════ */}
      {tab === 'today' && (
        <div className="space-y-5 pb-4">
          {/* CRP Proxy Score Ring */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
              CRP Proxy Score <span className="text-text-muted font-normal normal-case">(lower = better)</span>
            </h2>
            <div className="flex items-center gap-6">
              <div className="relative flex items-center justify-center shrink-0">
                <ScoreRing score={score?.total ?? 0} />
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-bold text-text-primary">{score?.total ?? '—'}</span>
                  <span className="text-xs font-semibold" style={{ color: crpColor }}>
                    {crpLabel}
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {score && (
                  <>
                    <FactorBar label="Diet" value={score.diet_factor} max={100} color={crpProxyColor(score.diet_factor)} />
                    <FactorBar label="Sleep" value={score.sleep_factor} max={50} color={crpProxyColor(score.sleep_factor * 2)} />
                    <FactorBar label="Exercise" value={score.exercise_factor} max={40} color={crpProxyColor(score.exercise_factor * 2.5)} />
                    <FactorBar label="Stress" value={score.stress_factor} max={50} color={crpProxyColor(score.stress_factor * 2)} />
                    <FactorBar label="Adiposity" value={score.adiposity_factor} max={30} color={crpProxyColor(score.adiposity_factor * 3)} />
                    <FactorBar label="Smoking" value={score.smoking_factor} max={50} color={crpProxyColor(score.smoking_factor * 2)} />
                  </>
                )}
                {!score && (
                  <p className="text-sm text-text-secondary">Log your data below to see your score</p>
                )}
              </div>
            </div>
          </div>

          {/* DII + Omega ratio badges */}
          {score && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface border border-border rounded-2xl p-4">
                <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">DII Category</p>
                <span
                  className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${
                    diiBgMap[score.dii_category] ?? ''
                  }`}
                >
                  {score.dii_category}
                </span>
                <p className="text-[11px] text-text-muted mt-1">Shivappa 2014</p>
              </div>
              <div className="bg-surface border border-border rounded-2xl p-4">
                <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Omega-6:3 Ratio</p>
                <p className="text-xl font-bold text-text-primary">{score.omega_ratio}:1</p>
                <p
                  className="text-xs font-semibold mt-0.5"
                  style={{ color: diiCategoryColor(score.dii_category) }}
                >
                  {score.omega_ratio_category}
                </p>
              </div>
            </div>
          )}

          {/* Anti-inflammatory diet score */}
          {score && (
            <div className="bg-surface border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-text-primary">Anti-inflammatory Diet Score</p>
                <span className="text-lg font-bold text-text-primary">{score.anti_inflammatory_diet_score}/100</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-surface-secondary overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${score.anti_inflammatory_diet_score}%`,
                    backgroundColor:
                      score.anti_inflammatory_diet_score >= 70
                        ? '#22c55e'
                        : score.anti_inflammatory_diet_score >= 45
                        ? '#eab308'
                        : '#ef4444',
                  }}
                />
              </div>
            </div>
          )}

          {/* Top inflammation drivers */}
          {score && score.top_drivers.length > 0 && (
            <div className="bg-surface border border-border rounded-2xl p-4">
              <p className="text-sm font-semibold text-text-primary mb-3">⚠️ Top Inflammation Drivers</p>
              <ul className="space-y-2">
                {score.top_drivers.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="text-orange-500 mt-0.5 shrink-0">•</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Form: Lifestyle Quick Inputs ── */}
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">⚡ Lifestyle Factors</h3>

            <NumInput label="Sleep hours last night" value={num('sleep_hours')} min={0} max={14} step={0.5}
              onChange={(v) => setNum('sleep_hours', v)} hint="≥7h → 0pts inflammation; <5h → +50pts" />

            <NumInput label="Stress level (1–10)" value={num('stress_level')} min={1} max={10} step={1}
              onChange={(v) => setNum('stress_level', v)} hint="×5 = stress factor; 10→50pts" />

            <NumInput label="Exercise this week (min)" value={num('exercise_minutes_week')} min={0} max={840} step={10}
              onChange={(v) => setNum('exercise_minutes_week', v)} hint="≥150 min/week → 0pts" />

            <NumInput label="Waist circumference (cm)" value={num('waist_cm') || 0} min={0} max={200} step={1}
              onChange={(v) => setNum('waist_cm', v)} hint="M >102 or F >88 = adiposity factor" />

            <div className="space-y-1">
              <label className="text-sm font-medium text-text-primary">Biological sex</label>
              <div className="flex gap-2">
                {(['male', 'female'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => { const u = { ...form, biological_sex: s }; setForm(u); setLiveScore(calcInflammationScore(u as InflammationLog)) }}
                    className={`px-4 py-1.5 rounded-xl text-sm border capitalize transition-colors ${
                      form.biological_sex === s
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-background border-border text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-text-primary">Smoking status</label>
              <div className="flex gap-2">
                {(['never', 'former', 'current'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => { const u = { ...form, smoking_status: s }; setForm(u); setLiveScore(calcInflammationScore(u as InflammationLog)) }}
                    className={`flex-1 py-1.5 rounded-xl text-xs border capitalize transition-colors ${
                      form.smoking_status === s
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-background border-border text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-text-muted">Current →+50pts · Former →+10pts</p>
            </div>
          </div>

          {/* ── Form: Anti-inflammatory Diet ── */}
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">🥗 Anti-inflammatory Diet Inputs</h3>

            <NumInput label="Omega-3 servings (fish/algae)" value={num('omega3_servings')} min={0} max={6} step={1}
              onChange={(v) => setNum('omega3_servings', v)} hint="+15pts each (EPA/DHA)" />
            <NumInput label="Vegetable servings" value={num('vegetables_servings')} min={0} max={15} step={1}
              onChange={(v) => setNum('vegetables_servings', v)} hint="+10pts each" />
            <NumInput label="Berry servings" value={num('berries_servings')} min={0} max={6} step={1}
              onChange={(v) => setNum('berries_servings', v)} hint="+10pts each (flavonoids)" />
            <NumInput label="Green tea cups" value={num('green_tea_cups')} min={0} max={8} step={1}
              onChange={(v) => setNum('green_tea_cups', v)} hint="+5pts each (EGCG)" />
            <NumInput label="Dietary fiber (g)" value={num('fiber_g')} min={0} max={60} step={1}
              onChange={(v) => setNum('fiber_g', v)} hint="30g/day = +20pts" />
            <NumInput label="Sugar-sweetened drinks" value={num('sugar_drinks')} min={0} max={6} step={1}
              onChange={(v) => setNum('sugar_drinks', v)} hint="-15pts each" />
            <NumInput label="Processed meat servings" value={num('processed_meat')} min={0} max={6} step={1}
              onChange={(v) => setNum('processed_meat', v)} hint="-15pts each" />
            <NumInput label="Trans fat items" value={num('trans_fat_items')} min={0} max={6} step={1}
              onChange={(v) => setNum('trans_fat_items', v)} hint="-20pts each" />

            <div className="flex gap-4">
              <ToggleCheck label="Turmeric used 🟡" checked={!!form.turmeric_used}
                onChange={(v) => setBool('turmeric_used', v)} hint="+5pts (curcumin)" />
              <ToggleCheck label="Ginger used 🫚" checked={!!form.ginger_used}
                onChange={(v) => setBool('ginger_used', v)} hint="+5pts" />
            </div>
          </div>

          {/* ── Form: Omega-6:3 Ratio ── */}
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">⚖️ Omega-6:3 Ratio Calculator</h3>
            <p className="text-xs text-text-secondary">
              Western diet avg ~20:1 · Optimal ≤4:1 · Mediterranean ~2:1 (Simopoulos 2002)
            </p>

            <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide">Omega-6 Sources (pro-inflammatory)</p>
            <NumInput label="Vegetable oil servings (corn/soy/sunflower)" value={num('cooking_oil_servings')} min={0} max={10} step={1}
              onChange={(v) => setNum('cooking_oil_servings', v)} hint="×3 score each" />
            <NumInput label="Processed snack servings" value={num('processed_snacks')} min={0} max={10} step={1}
              onChange={(v) => setNum('processed_snacks', v)} hint="×2 score each" />
            <NumInput label="Grain-fed meat servings" value={num('grain_fed_meat')} min={0} max={6} step={1}
              onChange={(v) => setNum('grain_fed_meat', v)} hint="×1 score each" />

            <p className="text-xs font-semibold text-green-500 uppercase tracking-wide">Omega-3 Sources (anti-inflammatory)</p>
            <NumInput label="Fatty fish servings (salmon/sardines)" value={num('fatty_fish_servings')} min={0} max={6} step={1}
              onChange={(v) => setNum('fatty_fish_servings', v)} hint="×5 score each (EPA/DHA)" />
            <ToggleCheck label="Omega-3 supplement taken" checked={!!form.omega3_supplement}
              onChange={(v) => setBool('omega3_supplement', v)} hint="×4 score" />
            <NumInput label="Flax/chia servings" value={num('flax_chia_servings')} min={0} max={6} step={1}
              onChange={(v) => setNum('flax_chia_servings', v)} hint="×2 score (ALA)" />
            <NumInput label="Walnut servings" value={num('walnuts_servings')} min={0} max={6} step={1}
              onChange={(v) => setNum('walnuts_servings', v)} hint="×1 score" />

            {score && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background">
                <div>
                  <p className="text-xs text-text-secondary">Current ratio</p>
                  <p className="text-xl font-bold text-text-primary">{score.omega_ratio}:1</p>
                </div>
                <div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                      score.omega_ratio <= 4
                        ? 'bg-green-500/15 text-green-600 border-green-500/30'
                        : score.omega_ratio <= 8
                        ? 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30'
                        : score.omega_ratio <= 15
                        ? 'bg-orange-500/15 text-orange-500 border-orange-500/30'
                        : 'bg-red-500/15 text-red-500 border-red-500/30'
                    }`}
                  >
                    {score.omega_ratio_category}
                  </span>
                  <p className="text-[11px] text-text-muted mt-1">≤4 Optimal · ≤8 Good · ≤15 Moderate</p>
                </div>
              </div>
            )}
          </div>

          {/* Recommendations */}
          {score && score.recommendations.length > 0 && (
            <div className="bg-surface border border-border rounded-2xl p-4">
              <p className="text-sm font-semibold text-text-primary mb-3">💡 Personalised Recommendations</p>
              <ul className="space-y-2">
                {score.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="text-green-500 mt-0.5 shrink-0">→</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-2xl bg-primary text-white font-semibold text-sm disabled:opacity-60 transition-opacity"
          >
            {saving ? 'Saving…' : 'Save Today\'s Log'}
          </button>
          {savedMsg && (
            <p className={`text-center text-sm font-medium ${savedMsg.includes('✓') ? 'text-green-500' : 'text-red-500'}`}>
              {savedMsg}
            </p>
          )}
        </div>
      )}

      {/* ═══════════════ FOODS TAB ═══════════════ */}
      {tab === 'foods' && (
        <div className="space-y-5 pb-4">
          {/* Anti-inflammatory foods grid */}
          <div className="bg-surface border border-border rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-text-primary mb-3">🌿 Anti-inflammatory Foods</h2>
            <div className="grid grid-cols-1 gap-2">
              {ANTI_INFLAMMATORY_FOODS.map((food) => (
                <div key={food.name} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-background">
                  <span className="text-xl shrink-0">{food.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-text-primary">{food.name}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${ratingColor(food.inflammation_rating)}`}>
                        {food.inflammation_rating}
                      </span>
                      <span className="text-[10px] text-text-muted">{food.category}</span>
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">{food.tip}</p>
                    {food.omega3_mg_per_serving && (
                      <p className="text-[11px] text-blue-500 mt-0.5">
                        🐟 {food.omega3_mg_per_serving.toLocaleString()} mg omega-3/serving
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {food.key_compounds.map((c) => (
                        <span key={c} className="text-[10px] bg-surface-secondary text-text-secondary px-1.5 py-0.5 rounded-full">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Omega-3 rich foods reference table */}
          <div className="bg-surface border border-border rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-text-primary mb-3">🐟 Omega-3 Reference (EPA+DHA per serving)</h2>
            <div className="space-y-2">
              {ANTI_INFLAMMATORY_FOODS.filter((f) => f.omega3_mg_per_serving).map((f) => (
                <div key={f.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{f.emoji}</span>
                    <span className="text-sm text-text-primary">{f.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-blue-500">
                      {f.omega3_mg_per_serving!.toLocaleString()} mg
                    </span>
                    <p className="text-[10px] text-text-muted">per serving</p>
                  </div>
                </div>
              ))}
              <p className="text-xs text-text-muted mt-2">
                WHO recommendation: ≥250–500 mg EPA+DHA per day. Therapeutic: 1,000–4,000 mg/day.
              </p>
            </div>
          </div>

          {/* Inflammatory triggers */}
          <div className="bg-surface border border-border rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-text-primary mb-3">⚠️ Inflammatory Triggers to Minimise</h2>
            <div className="space-y-3">
              {INFLAMMATORY_TRIGGERS.map((t) => (
                <div key={t.name} className="p-3 rounded-xl border border-border bg-background">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{t.emoji}</span>
                    <span className="text-sm font-semibold text-text-primary">{t.name}</span>
                    <span
                      className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                        t.impact === 'High'
                          ? 'bg-red-500/15 text-red-500 border-red-500/30'
                          : t.impact === 'Medium'
                          ? 'bg-orange-500/15 text-orange-500 border-orange-500/30'
                          : 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30'
                      }`}
                    >
                      {t.impact} Impact
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">{t.mechanism}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {t.examples.map((ex) => (
                      <span key={ex} className="text-[10px] bg-surface-secondary text-text-secondary px-1.5 py-0.5 rounded-full">
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mediterranean diet checklist */}
          <div className="bg-surface border border-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-primary">🫒 Mediterranean Diet Adherence</h2>
              <span className="text-sm font-semibold text-primary">
                {medChecked.size}/{MED_DIET_CHECKLIST.length}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-surface-secondary overflow-hidden mb-4">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-300"
                style={{ width: `${(medChecked.size / MED_DIET_CHECKLIST.length) * 100}%` }}
              />
            </div>
            <div className="space-y-2">
              {MED_DIET_CHECKLIST.map((item) => {
                const checked = medChecked.has(item.id)
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      const next = new Set(medChecked)
                      checked ? next.delete(item.id) : next.add(item.id)
                      setMedChecked(next)
                    }}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${
                      checked
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-background border-border hover:border-border/80'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                        checked ? 'bg-green-500 border-green-500' : 'border-border'
                      }`}
                    >
                      {checked && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${checked ? 'text-green-600' : 'text-text-primary'}`}>
                        {item.label}
                      </p>
                      <p className="text-xs text-text-secondary">{item.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
            {medChecked.size >= 9 && (
              <div className="mt-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                <p className="text-sm font-semibold text-green-600">
                  🌿 Excellent Mediterranean adherence today!
                </p>
                <p className="text-xs text-green-500 mt-0.5">
                  Associated with 30% lower CRP and reduced all-cause mortality
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ TRENDS TAB ═══════════════ */}
      {tab === 'trends' && (
        <div className="space-y-5 pb-4">
          {trend.length === 0 ? (
            <div className="bg-surface border border-border rounded-2xl p-8 text-center">
              <p className="text-text-secondary text-sm">No data yet. Log your first entry in the Today tab.</p>
            </div>
          ) : (
            <>
              {/* 30-day CRP Proxy trend */}
              <div className="bg-surface border border-border rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-text-primary mb-3">📉 CRP Proxy Score (30 days)</h3>
                <p className="text-xs text-text-muted mb-3">Lower is better — green zone ≤20</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={[...trend].reverse()} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        fontSize: 12,
                      }}
                      labelStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="crp_proxy"
                      name="CRP Proxy"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#ef4444' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Anti-inflammatory diet score trend */}
              <div className="bg-surface border border-border rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-text-primary mb-3">🥗 Diet Score Trend (higher = better)</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={[...trend].reverse()} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="diet_score"
                      name="Diet Score"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#22c55e' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Omega ratio trend */}
              <div className="bg-surface border border-border rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-text-primary mb-3">⚖️ Omega-6:3 Ratio Trend (lower = better)</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={[...trend].reverse()} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="omega_ratio"
                      name="Omega Ratio"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#f97316' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* DII category frequency */}
              <div className="bg-surface border border-border rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-text-primary mb-3">📊 DII Category Frequency</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={diiFreqData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--text-secondary)' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="count" name="Days" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Recommendations panel */}
              {currentScore && currentScore.recommendations.length > 0 && (
                <div className="bg-surface border border-border rounded-2xl p-4">
                  <h3 className="text-sm font-semibold text-text-primary mb-3">🎯 Actionable Recommendations</h3>
                  <ul className="space-y-2">
                    {currentScore.recommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                        <span className="text-green-500 mt-0.5 shrink-0">{i + 1}.</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Research citations */}
              <div className="bg-surface border border-border rounded-2xl p-4">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">📚 Research Basis</h3>
                <ul className="space-y-1 text-[11px] text-text-muted">
                  <li>• Shivappa et al. 2014 (Nutr J) — Dietary Inflammatory Index, validated 50+ studies</li>
                  <li>• Calder et al. 2017 (Nutrients) — Omega-3 EPA/DHA reduces CRP, IL-6, TNF-α</li>
                  <li>• Minihane et al. 2015 (Br J Nutr) — Low-grade inflammation & chronic disease</li>
                  <li>• Simopoulos 2002 (Biomed Pharmacother) — Omega-6:3 ratio; Western ~20:1, optimal ≤4:1</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function FactorBar({
  label, value, max, color,
}: {
  label: string
  value: number
  max: number
  color: string
}) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary">{label}</span>
        <span className="text-xs font-medium text-text-primary">{value}</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-surface-secondary overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function NumInput({
  label, value, min, max, step, onChange, hint,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  hint?: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-text-primary">{label}</label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChange(Math.max(min, value - step))}
            className="w-6 h-6 rounded-full bg-surface-secondary border border-border text-text-secondary hover:text-text-primary text-sm flex items-center justify-center"
          >
            −
          </button>
          <span className="text-sm font-semibold text-text-primary w-8 text-center">{value}</span>
          <button
            onClick={() => onChange(Math.min(max, value + step))}
            className="w-6 h-6 rounded-full bg-surface-secondary border border-border text-text-secondary hover:text-text-primary text-sm flex items-center justify-center"
          >
            +
          </button>
        </div>
      </div>
      {hint && <p className="text-[11px] text-text-muted">{hint}</p>}
    </div>
  )
}

function ToggleCheck({
  label, checked, onChange, hint,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  hint?: string
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
        checked
          ? 'bg-green-500/10 border-green-500/30 text-green-600'
          : 'bg-background border-border text-text-secondary hover:text-text-primary'
      }`}
    >
      <div
        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
          checked ? 'bg-green-500 border-green-500' : 'border-border'
        }`}
      >
        {checked && <span className="text-white text-[9px] font-bold leading-none">✓</span>}
      </div>
      <span>{label}</span>
      {hint && <span className="text-[10px] text-text-muted ml-1">{hint}</span>}
    </button>
  )
}
