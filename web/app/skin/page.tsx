'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Sun,
  Droplets,
  Leaf,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  TrendingUp,
  Info,
} from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { cn } from '@/lib/utils'
import {
  calculateSkinScore,
  getUVRisk,
  getUVRiskColor,
  getSkinScoreColor,
  defaultSkinLog,
  SKIN_CONDITIONS,
  BODY_REGIONS,
  INGREDIENT_INFO,
} from '@/lib/skin-health'
import type { SkinLog, SkinScore, SkincareProduct } from '@/lib/skin-health'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ScatterChart,
  Scatter,
} from 'recharts'

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const fill = circ - (score / 100) * circ
  const color = getSkinScoreColor(score)
  return (
    <svg viewBox="0 0 120 120" className="w-32 h-32">
      <circle cx={60} cy={60} r={r} fill="none" stroke="currentColor" strokeWidth={10} className="text-border" />
      <circle
        cx={60} cy={60} r={r} fill="none"
        stroke={color} strokeWidth={10}
        strokeDasharray={circ}
        strokeDashoffset={fill}
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x={60} y={56} textAnchor="middle" fontSize={22} fontWeight="700" fill={color}>{score}</text>
      <text x={60} y={72} textAnchor="middle" fontSize={11} fill="#9ca3af">/ 100</text>
    </svg>
  )
}

// ─── UV Banner ────────────────────────────────────────────────────────────────

function UVBanner({ uvIndex, risk }: { uvIndex: number | null; risk: string }) {
  const color = getUVRiskColor(risk)
  const label: Record<string, string> = {
    low: 'Low UV — No protection needed',
    moderate: 'Moderate UV — SPF recommended',
    high: 'High UV — SPF 30+ required',
    very_high: 'Very High UV — Minimize exposure',
    extreme: 'Extreme UV — Avoid outdoor exposure',
  }
  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 py-3 border"
      style={{ borderColor: color + '40', backgroundColor: color + '15' }}
    >
      <Sun className="w-5 h-5 shrink-0" style={{ color }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color }}>{label[risk] ?? 'UV unknown'}</p>
        {uvIndex !== null && (
          <p className="text-xs text-text-secondary">UV Index: {uvIndex.toFixed(1)}</p>
        )}
      </div>
    </div>
  )
}

// ─── Toggle Switch ─────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-1">
      <span className="text-sm text-text-primary">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 rounded-full transition-colors duration-200',
          checked ? 'bg-primary' : 'bg-border'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </label>
  )
}

// ─── Severity Dot ─────────────────────────────────────────────────────────────

const SEV_COLORS = ['#9ca3af', '#eab308', '#f97316', '#ef4444']
const SEV_LABELS = ['None', 'Mild', 'Moderate', 'Severe']

function SeverityPicker({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex gap-1 items-center justify-center">
      {SEV_COLORS.map((c, i) => (
        <button
          key={i}
          type="button"
          title={SEV_LABELS[i]}
          onClick={() => onChange(i)}
          className={cn(
            'w-5 h-5 rounded-full border-2 transition-transform',
            value === i ? 'scale-125 border-white' : 'border-transparent opacity-60'
          )}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  )
}

// ─── Today Tab ────────────────────────────────────────────────────────────────

function TodayTab({
  log,
  onChange,
  score,
  uvIndex,
  saving,
  onSave,
}: {
  log: SkinLog
  onChange: (patch: Partial<SkinLog>) => void
  score: SkinScore
  uvIndex: number | null
  saving: boolean
  onSave: () => void
}) {
  const spfOptions = [15, 30, 50, 100]

  return (
    <div className="space-y-4 pb-24">
      {/* UV Banner */}
      <UVBanner uvIndex={uvIndex} risk={score.uvRisk} />

      {/* Score Ring */}
      <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col items-center gap-3">
        <ScoreRing score={score.total} />
        <div className="text-center">
          <p
            className="text-lg font-bold"
            style={{ color: getSkinScoreColor(score.total) }}
          >
            {score.grade}
          </p>
          <p className="text-xs text-text-secondary">Skin Health Score</p>
        </div>
        {/* Pillars */}
        <div className="grid grid-cols-2 gap-2 w-full mt-1">
          {[
            { label: 'UV Protection', val: score.pillars.uvProtection, icon: '☀️' },
            { label: 'Hydration', val: score.pillars.hydration, icon: '💧' },
            { label: 'Nutrition', val: score.pillars.nutrition, icon: '🥦' },
            { label: 'Routine', val: score.pillars.routineAdherence, icon: '🧴' },
          ].map(({ label, val, icon }) => (
            <div key={label} className="bg-background rounded-xl p-3 flex items-center gap-2">
              <span className="text-base">{icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-text-secondary leading-none mb-1">{label}</p>
                <div className="h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${val}%`,
                      backgroundColor: getSkinScoreColor(val),
                    }}
                  />
                </div>
              </div>
              <span className="text-xs font-semibold text-text-primary w-7 text-right">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SPF Section */}
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Sun className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-text-primary">Sun Protection</h3>
        </div>
        <Toggle checked={log.spf_applied} onChange={(v) => onChange({ spf_applied: v })} label="Applied sunscreen today" />
        {log.spf_applied && (
          <>
            <div>
              <p className="text-xs text-text-secondary mb-2">SPF Value</p>
              <div className="flex gap-2">
                {spfOptions.map((spf) => (
                  <button
                    key={spf}
                    type="button"
                    onClick={() => onChange({ spf_value: spf })}
                    className={cn(
                      'flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors',
                      log.spf_value === spf
                        ? 'bg-primary text-white border-primary'
                        : 'bg-background border-border text-text-secondary'
                    )}
                  >
                    {spf === 100 ? '50+' : `${spf}`}
                  </button>
                ))}
              </div>
            </div>
            <Toggle checked={log.spf_reapplied} onChange={(v) => onChange({ spf_reapplied: v })} label="Reapplied every 2 hours" />
          </>
        )}
        <div>
          <div className="flex justify-between items-center mb-1">
            <p className="text-xs text-text-secondary">Sun Exposure</p>
            <p className="text-xs font-medium text-text-primary">{log.sun_exposure_min} min</p>
          </div>
          <input
            type="range" min={0} max={180} step={15}
            value={log.sun_exposure_min}
            onChange={(e) => onChange({ sun_exposure_min: Number(e.target.value) })}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-text-secondary mt-0.5">
            <span>0</span><span>90 min</span><span>180 min</span>
          </div>
        </div>
      </div>

      {/* Hydration */}
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Droplets className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-text-primary">Hydration</h3>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <p className="text-xs text-text-secondary">Water Intake</p>
            <p className="text-sm font-semibold text-text-primary">{(log.water_ml / 1000).toFixed(1)} L</p>
          </div>
          <input
            type="range" min={0} max={3000} step={250}
            value={log.water_ml}
            onChange={(e) => onChange({ water_ml: Number(e.target.value) })}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-text-secondary mt-0.5">
            <span>0</span><span>1.5 L</span><span>3 L</span>
          </div>
        </div>
        <div className="h-2 bg-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, (log.water_ml / 2500) * 100)}%`,
              backgroundColor: getSkinScoreColor(Math.min(100, Math.round((log.water_ml / 2500) * 100))),
            }}
          />
        </div>
        <p className="text-[11px] text-text-secondary">Target: 2,500 ml/day for optimal skin density</p>
      </div>

      {/* Nutrition */}
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <Leaf className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-text-primary">Skin Nutrition</h3>
          <span className="text-xs text-text-secondary ml-auto">{
            [log.vit_c_taken, log.omega3_taken, log.lycopene_taken, log.green_tea_taken].filter(Boolean).length
          }/4</span>
        </div>
        {[
          { key: 'vit_c_taken' as const, label: 'Vitamin C', desc: 'Collagen synthesis + antioxidant' },
          { key: 'omega3_taken' as const, label: 'Omega-3', desc: 'Skin barrier + anti-inflammatory' },
          { key: 'lycopene_taken' as const, label: 'Lycopene', desc: 'Tomatoes, watermelon — UV defense' },
          { key: 'green_tea_taken' as const, label: 'Green Tea', desc: 'EGCG antioxidant, reduces redness' },
        ].map(({ key, label, desc }) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange({ [key]: !log[key] })}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors',
              log[key]
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-background border-border text-text-secondary'
            )}
          >
            <CheckCircle2 className={cn('w-4 h-4 shrink-0', log[key] ? 'text-primary' : 'text-border')} />
            <div>
              <p className={cn('text-sm font-medium', log[key] ? 'text-primary' : 'text-text-primary')}>{label}</p>
              <p className="text-[11px] text-text-secondary">{desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Routine */}
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
        <h3 className="text-sm font-semibold text-text-primary mb-2">Skincare Routine</h3>
        <Toggle checked={log.am_routine_done} onChange={(v) => onChange({ am_routine_done: v })} label="AM routine completed" />
        <Toggle checked={log.pm_routine_done} onChange={(v) => onChange({ pm_routine_done: v })} label="PM routine completed" />
      </div>

      {/* Recommendations */}
      {score.recommendations.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Info className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-text-primary">Recommendations</h3>
          </div>
          {score.recommendations.map((r, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-primary text-xs mt-0.5">•</span>
              <p className="text-xs text-text-secondary leading-relaxed">{r}</p>
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-2">Notes</h3>
        <textarea
          rows={3}
          value={log.notes ?? ''}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Any skin observations today…"
          className="w-full bg-background border border-border rounded-xl p-3 text-sm text-text-primary placeholder:text-text-secondary resize-none focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Save */}
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="w-full bg-primary text-white rounded-2xl py-3.5 text-sm font-semibold disabled:opacity-50 transition-opacity"
      >
        {saving ? 'Saving…' : 'Save Today\'s Log'}
      </button>
    </div>
  )
}

// ─── Conditions Tab ───────────────────────────────────────────────────────────

function ConditionsTab({
  log,
  onChange,
}: {
  log: SkinLog
  onChange: (patch: Partial<SkinLog>) => void
}) {
  const [showIngredientInfo, setShowIngredientInfo] = useState(false)
  const [newProduct, setNewProduct] = useState<Partial<SkincareProduct>>({
    step: 'cleanser',
    time_of_day: 'am',
  })
  const [showAddProduct, setShowAddProduct] = useState(false)

  const updateCondition = (condition: string, region: string, severity: number) => {
    const current = log.conditions ?? {}
    const conditionMap = { ...(current[condition] ?? {}) }
    if (severity === 0) {
      delete conditionMap[region]
    } else {
      conditionMap[region] = severity
    }
    onChange({ conditions: { ...current, [condition]: conditionMap } })
  }

  const addProduct = () => {
    if (!newProduct.name?.trim()) return
    const product: SkincareProduct = {
      name: newProduct.name.trim(),
      step: newProduct.step as SkincareProduct['step'],
      time_of_day: newProduct.time_of_day as SkincareProduct['time_of_day'],
      key_ingredient: newProduct.key_ingredient?.trim() || undefined,
    }
    onChange({ skincare_products: [...(log.skincare_products ?? []), product] })
    setNewProduct({ step: 'cleanser', time_of_day: 'am' })
    setShowAddProduct(false)
  }

  const removeProduct = (i: number) => {
    const arr = [...(log.skincare_products ?? [])]
    arr.splice(i, 1)
    onChange({ skincare_products: arr })
  }

  // Active conditions summary
  const activeConditions = SKIN_CONDITIONS.filter((c) => {
    const regionMap = log.conditions?.[c] ?? {}
    return Object.values(regionMap).some((v) => v > 0)
  })

  return (
    <div className="space-y-4 pb-24">
      {/* Condition Tracker Grid */}
      <div className="bg-surface border border-border rounded-2xl p-4 overflow-x-auto">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Condition Tracker</h3>
        <table className="w-full text-xs min-w-[420px]">
          <thead>
            <tr>
              <th className="text-left text-text-secondary pb-2 pr-2 font-medium w-28">Condition</th>
              {BODY_REGIONS.map((r) => (
                <th key={r} className="text-center text-text-secondary pb-2 px-1 font-medium">{r}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SKIN_CONDITIONS.map((condition) => (
              <tr key={condition} className="border-t border-border/50">
                <td className="py-2 pr-2 text-text-primary font-medium text-[11px]">{condition}</td>
                {BODY_REGIONS.map((region) => (
                  <td key={region} className="py-2 px-1 text-center">
                    <SeverityPicker
                      value={(log.conditions?.[condition]?.[region]) ?? 0}
                      onChange={(v) => updateCondition(condition, region, v)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex gap-3 mt-3 pt-2 border-t border-border/50">
          {SEV_LABELS.map((l, i) => (
            <div key={l} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SEV_COLORS[i] }} />
              <span className="text-[10px] text-text-secondary">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Active Conditions Summary */}
      {activeConditions.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
          <h3 className="text-sm font-semibold text-text-primary mb-2">Active Conditions</h3>
          {activeConditions.map((c) => {
            const regionMap = log.conditions?.[c] ?? {}
            return (
              <div key={c} className="p-3 bg-background rounded-xl border border-border">
                <p className="text-sm font-medium text-text-primary mb-1">{c}</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(regionMap)
                    .filter(([, v]) => (v as number) > 0)
                    .map(([region, sev]) => (
                      <span
                        key={region}
                        className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium"
                        style={{ backgroundColor: SEV_COLORS[sev as number] }}
                      >
                        {region}: {SEV_LABELS[sev as number]}
                      </span>
                    ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Skincare Routine Builder */}
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Skincare Routine</h3>
          <button
            type="button"
            onClick={() => setShowAddProduct(!showAddProduct)}
            className="flex items-center gap-1 text-primary text-xs font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Product
          </button>
        </div>

        {showAddProduct && (
          <div className="bg-background border border-border rounded-xl p-3 space-y-2">
            <input
              type="text"
              placeholder="Product name (e.g. CeraVe Moisturizer)"
              value={newProduct.name ?? ''}
              onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newProduct.step}
                onChange={(e) => setNewProduct((p) => ({ ...p, step: e.target.value as SkincareProduct['step'] }))}
                className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none"
              >
                {['cleanser', 'toner', 'serum', 'moisturizer', 'sunscreen', 'treatment', 'other'].map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <select
                value={newProduct.time_of_day}
                onChange={(e) => setNewProduct((p) => ({ ...p, time_of_day: e.target.value as SkincareProduct['time_of_day'] }))}
                className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none"
              >
                <option value="am">AM</option>
                <option value="pm">PM</option>
                <option value="both">AM + PM</option>
              </select>
            </div>
            <input
              type="text"
              placeholder="Key ingredient (e.g. retinol, niacinamide)"
              value={newProduct.key_ingredient ?? ''}
              onChange={(e) => setNewProduct((p) => ({ ...p, key_ingredient: e.target.value }))}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addProduct}
                className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-medium"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddProduct(false)}
                className="px-4 bg-border rounded-lg py-2 text-sm text-text-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {(log.skincare_products ?? []).length === 0 && !showAddProduct && (
          <p className="text-xs text-text-secondary text-center py-2">No products added yet</p>
        )}

        {(log.skincare_products ?? []).map((p, i) => (
          <div key={i} className="flex items-start gap-2 p-3 bg-background rounded-xl border border-border">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">{p.name}</p>
              <p className="text-[11px] text-text-secondary capitalize">
                {p.step} · {p.time_of_day === 'both' ? 'AM + PM' : p.time_of_day.toUpperCase()}
                {p.key_ingredient ? ` · ${p.key_ingredient}` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeProduct(i)}
              className="p-1 rounded-lg hover:bg-surface text-text-secondary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Ingredient Reference */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <button
          type="button"
          onClick={() => setShowIngredientInfo(!showIngredientInfo)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-text-primary">Ingredient Reference</h3>
          </div>
          {showIngredientInfo ? <ChevronUp className="w-4 h-4 text-text-secondary" /> : <ChevronDown className="w-4 h-4 text-text-secondary" />}
        </button>
        {showIngredientInfo && (
          <div className="mt-3 space-y-2">
            {Object.entries(INGREDIENT_INFO).map(([ingredient, info]) => (
              <div key={ingredient} className="p-3 bg-background rounded-xl border border-border">
                <p className="text-sm font-semibold text-text-primary capitalize mb-1">{ingredient.replace('_', ' ')}</p>
                <p className="text-xs text-text-secondary leading-relaxed">{info}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Trends Tab ───────────────────────────────────────────────────────────────

function TrendsTab({
  trend,
  logs,
}: {
  trend: { date: string; score: number; uv_index?: number; water_ml?: number; spf_applied?: boolean }[]
  logs: SkinLog[]
}) {
  const spfCompliance =
    logs.length > 0
      ? Math.round((logs.filter((l) => l.spf_applied).length / logs.length) * 100)
      : 0

  // Condition frequency over 30 days
  const conditionFrequency = SKIN_CONDITIONS.map((c) => ({
    condition: c,
    count: logs.filter((l) => {
      const regionMap = l.conditions?.[c] ?? {}
      return Object.values(regionMap).some((v) => v > 0)
    }).length,
  })).sort((a, b) => b.count - a.count)

  const scatterData = trend
    .filter((t) => t.uv_index != null)
    .map((t) => ({ uv: t.uv_index, score: t.score }))

  return (
    <div className="space-y-4 pb-24">
      {/* 30-day Score Chart */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-text-primary">30-Day Skin Score</h3>
        </div>
        {trend.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickFormatter={(v: string) => v.slice(5)}
                interval="preserveStartEnd"
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                formatter={(val: number) => [`${val}`, 'Score']}
                labelFormatter={(l: string) => `Date: ${l}`}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-xs text-text-secondary text-center py-8">No data yet — log your first entry</p>
        )}
      </div>

      {/* SPF Compliance */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">SPF Compliance (30 days)</h3>
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20">
            <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
              <circle cx={40} cy={40} r={32} fill="none" strokeWidth={8} className="stroke-border" />
              <circle
                cx={40} cy={40} r={32}
                fill="none"
                stroke={spfCompliance >= 70 ? '#10b981' : spfCompliance >= 40 ? '#f59e0b' : '#ef4444'}
                strokeWidth={8}
                strokeDasharray={`${(spfCompliance / 100) * 2 * Math.PI * 32} ${2 * Math.PI * 32}`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-text-primary">{spfCompliance}%</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-text-primary">
              {spfCompliance >= 70 ? 'Great protection habits' : spfCompliance >= 40 ? 'Room to improve' : 'Apply SPF daily for skin protection'}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              {logs.filter(l => l.spf_applied).length} of {logs.length} days logged with SPF
            </p>
          </div>
        </div>
      </div>

      {/* Condition Frequency */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Condition Frequency</h3>
        {conditionFrequency.some((c) => c.count > 0) ? (
          <div className="space-y-2">
            {conditionFrequency
              .filter((c) => c.count > 0)
              .map(({ condition, count }) => (
                <div key={condition} className="flex items-center gap-3">
                  <span className="text-xs text-text-secondary w-28 shrink-0">{condition}</span>
                  <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(count / Math.max(logs.length, 1)) * 100}%`,
                        backgroundColor: count > 15 ? '#ef4444' : count > 7 ? '#f97316' : '#eab308',
                      }}
                    />
                  </div>
                  <span className="text-xs text-text-secondary w-8 text-right">{count}d</span>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-xs text-text-secondary text-center py-4">Log conditions to see patterns</p>
        )}
      </div>

      {/* UV vs Score Scatter */}
      {scatterData.length >= 3 && (
        <div className="bg-surface border border-border rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">UV Index vs Score</h3>
          <ResponsiveContainer width="100%" height={160}>
            <ScatterChart margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="uv" name="UV Index" tick={{ fontSize: 10, fill: '#9ca3af' }} label={{ value: 'UV', position: 'insideBottom', offset: -2, fill: '#9ca3af', fontSize: 10 }} />
              <YAxis dataKey="score" domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                formatter={(val: number, name: string) => [val, name === 'uv' ? 'UV Index' : 'Score']}
              />
              <Scatter data={scatterData} fill="#a855f7" opacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recommendations from frequent conditions */}
      {conditionFrequency.filter((c) => c.count >= 5).length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Info className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-text-primary">Pattern Insights</h3>
          </div>
          {conditionFrequency.filter((c) => c.count >= 5).map(({ condition }) => {
            const tips: Record<string, string> = {
              Acne: 'Frequent acne — reduce glycemic load (Katta & Desai 2014), consider salicylic acid or benzoyl peroxide',
              Dryness: 'Recurring dryness — add ceramides to PM routine; omega-3 improves transepidermal water retention',
              Oiliness: 'Persistent oiliness — niacinamide (2-4%) regulates sebum without over-drying',
              Redness: 'Regular redness — look for irritants; azelaic acid soothes rosacea-type inflammation',
              Eczema: 'Eczema flares — strengthen barrier with ceramides; avoid fragranced products',
              Hyperpigmentation: 'Ongoing hyperpigmentation — retinoids + Vitamin C + daily SPF is the gold standard',
              Sensitivity: 'Sensitive skin — pare back actives, introduce one at a time; prioritize barrier repair',
            }
            return (
              <div key={condition} className="flex items-start gap-2">
                <span className="text-primary text-xs mt-0.5">•</span>
                <p className="text-xs text-text-secondary leading-relaxed">{tips[condition]}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'today' | 'conditions' | 'trends'

export default function SkinHealthPage() {
  const today = new Date().toISOString().slice(0, 10)
  const [tab, setTab] = useState<Tab>('today')
  const [log, setLog] = useState<SkinLog>(defaultSkinLog(today))
  const [score, setScore] = useState<SkinScore>(calculateSkinScore(defaultSkinLog(today)))
  const [uvIndex, setUvIndex] = useState<number | null>(null)
  const [trend, setTrend] = useState<{ date: string; score: number; uv_index?: number; water_ml?: number; spf_applied?: boolean }[]>([])
  const [allLogs, setAllLogs] = useState<SkinLog[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // Fetch data on mount
  useEffect(() => {
    fetch('/api/skin')
      .then((r) => r.json())
      .then((data) => {
        if (data.uvIndex != null) setUvIndex(data.uvIndex)
        if (data.trend) setTrend(data.trend)
        if (data.logs) {
          const typedLogs: SkinLog[] = data.logs
          setAllLogs(typedLogs)
          const todayLog = typedLogs.find((l: SkinLog) => l.date === today)
          if (todayLog) {
            setLog({ ...todayLog, uv_index: data.uvIndex ?? todayLog.uv_index })
          } else {
            setLog((prev) => ({ ...prev, uv_index: data.uvIndex ?? undefined }))
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [today])

  // Recalculate score when log changes
  const handleChange = useCallback((patch: Partial<SkinLog>) => {
    setLog((prev) => {
      const updated = { ...prev, ...patch }
      setScore(calculateSkinScore(updated))
      return updated
    })
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await fetch('/api/skin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...log, uv_index: uvIndex }),
      })
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }, [log, uvIndex])

  const tabs: { id: Tab; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'conditions', label: 'Conditions' },
    { id: 'trends', label: 'Trends' },
  ]

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 pt-safe">
          <div className="flex items-center gap-3 py-4">
            <span className="text-2xl">🧴</span>
            <div>
              <h1 className="text-lg font-bold text-text-primary">Skin Health</h1>
              <p className="text-xs text-text-secondary">UV · Hydration · Conditions · Routine</p>
            </div>
            {!loading && score && (
              <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-surface">
                <span
                  className="text-sm font-bold"
                  style={{ color: getSkinScoreColor(score.total) }}
                >
                  {score.total}
                </span>
                <span className="text-[11px] text-text-secondary">{score.grade}</span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 pb-3">
            {tabs.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  'flex-1 py-2 rounded-xl text-xs font-semibold transition-colors',
                  tab === id
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4">
        {tab === 'today' && (
          <TodayTab
            log={log}
            onChange={handleChange}
            score={score}
            uvIndex={uvIndex}
            saving={saving}
            onSave={handleSave}
          />
        )}
        {tab === 'conditions' && (
          <ConditionsTab log={log} onChange={handleChange} />
        )}
        {tab === 'trends' && (
          <TrendsTab trend={trend} logs={allLogs} />
        )}
      </div>

      <BottomNav />
    </div>
  )
}
