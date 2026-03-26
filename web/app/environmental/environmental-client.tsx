'use client'

import { useState, useRef, useCallback } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts'
import { ChevronDown, ChevronRight, Leaf } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  calculateToxinBurden,
  DIRTY_DOZEN_2023,
  CLEAN_FIFTEEN_2023,
  MERCURY_FISH,
  type ToxinLog,
  type ToxinScore,
} from '@/lib/environmental-toxins'

type TrendPoint = {
  date: string
  score: number
  plastics: number
  heavyMetals: number
  pesticides: number
  vocs: number
}

interface Props {
  initialLog: ToxinLog
  trendData: TrendPoint[]
}

const RISK_CONFIG = {
  Low: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', hex: '#22c55e' },
  Moderate: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', hex: '#eab308' },
  High: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', hex: '#f97316' },
  'Very High': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', hex: '#ef4444' },
} as const

const PILLAR_META = {
  plastics: { label: '🧴 Plastics', color: '#a78bfa' },
  heavyMetals: { label: '🐟 Heavy Metals', color: '#60a5fa' },
  pesticides: { label: '🌱 Pesticides', color: '#34d399' },
  vocs: { label: '🏠 VOCs', color: '#fb923c' },
} as const

// ─── Primitive UI pieces ────────────────────────────────────────────────────

function Counter({
  value,
  onChange,
  min = 0,
  max = 10,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}) {
  return (
    <div className="flex items-center gap-3 flex-shrink-0">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-8 rounded-full bg-surface-secondary text-text-secondary flex items-center justify-center text-lg leading-none hover:bg-surface-tertiary transition-colors"
      >
        −
      </button>
      <span className="w-8 text-center font-semibold text-text-primary tabular-nums">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-8 h-8 rounded-full bg-surface-secondary text-text-secondary flex items-center justify-center text-lg leading-none hover:bg-surface-tertiary transition-colors"
      >
        +
      </button>
    </div>
  )
}

function StepCounter({
  value,
  onChange,
  step,
  unit,
  min = 0,
  max = 100,
}: {
  value: number
  onChange: (v: number) => void
  step: number
  unit: string
  min?: number
  max?: number
}) {
  const fmt = Number.isInteger(step) ? value.toString() : value.toFixed(1)
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <button
        onClick={() => onChange(Math.max(min, parseFloat((value - step).toFixed(2))))}
        className="w-8 h-8 rounded-full bg-surface-secondary text-text-secondary flex items-center justify-center text-lg hover:bg-surface-tertiary transition-colors"
      >
        −
      </button>
      <span className="w-14 text-center font-semibold text-text-primary tabular-nums">
        {fmt}
        {unit}
      </span>
      <button
        onClick={() => onChange(Math.min(max, parseFloat((value + step).toFixed(2))))}
        className="w-8 h-8 rounded-full bg-surface-secondary text-text-secondary flex items-center justify-center text-lg hover:bg-surface-tertiary transition-colors"
      >
        +
      </button>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'w-11 h-6 rounded-full transition-colors relative flex-shrink-0',
        checked ? 'bg-green-500' : 'bg-surface-secondary',
      )}
    >
      <span
        className={cn(
          'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  )
}

function Section({
  title,
  emoji,
  children,
  defaultOpen = true,
}: {
  title: string
  emoji: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="font-semibold text-text-primary flex items-center gap-2">
          <span className="text-base">{emoji}</span>
          {title}
        </span>
        {open ? (
          <ChevronDown className="w-4 h-4 text-text-secondary flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-text-secondary flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="border-t border-border px-4 py-3 space-y-3">{children}</div>
      )}
    </div>
  )
}

function Row({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 min-h-[2.25rem]">
      <div className="flex-1 min-w-0">
        <span className="text-sm text-text-secondary leading-tight">{label}</span>
        {sub && <p className="text-xs text-text-muted">{sub}</p>}
      </div>
      {children}
    </div>
  )
}

function PillarBar({
  label,
  value,
  max = 25,
  color,
}: {
  label: string
  value: number
  max?: number
  color: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-text-secondary">{label}</span>
        <span className="font-medium text-text-primary tabular-nums">
          {value}/{max}
        </span>
      </div>
      <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(value / max) * 100}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function EnvironmentalClient({ initialLog, trendData }: Props) {
  const [tab, setTab] = useState<'today' | 'references' | 'trends'>('today')
  const [log, setLog] = useState<ToxinLog>(initialLog)
  const [score, setScore] = useState<ToxinScore>(() => calculateToxinBurden(initialLog))
  const [saving, setSaving] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const update = useCallback(<K extends keyof ToxinLog>(key: K, value: ToxinLog[K]) => {
    setLog((prev) => {
      const next = { ...prev, [key]: value }
      setScore(calculateToxinBurden(next))

      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        setSaving(true)
        try {
          await fetch('/api/environmental', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(next),
          })
        } finally {
          setSaving(false)
        }
      }, 800)

      return next
    })
  }, [])

  const rc = RISK_CONFIG[score.risk]
  const TABS = [
    { id: 'today', label: 'Today' },
    { id: 'references', label: 'References' },
    { id: 'trends', label: 'Trends' },
  ] as const

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="px-4 pt-4 pb-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-green-500" />
              <h1 className="text-lg font-bold text-text-primary">Toxin Tracker</h1>
            </div>
            {saving && (
              <span className="text-xs text-text-muted animate-pulse">Saving…</span>
            )}
          </div>
          <div className="flex">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors',
                  tab === t.id
                    ? 'border-primary-500 text-primary-500'
                    : 'border-transparent text-text-secondary hover:text-text-primary',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* ══════════════════════════════════════════════════════════════════
            TODAY TAB
        ══════════════════════════════════════════════════════════════════ */}
        {tab === 'today' && (
          <>
            {/* Score card */}
            <div
              className={cn(
                'rounded-2xl border p-5 text-center',
                rc.bg,
                rc.border,
              )}
            >
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1">
                Toxin Burden Score · Lower is better
              </p>
              <div className="flex items-end justify-center gap-2 my-2">
                <span className={cn('text-7xl font-extrabold tabular-nums leading-none', rc.text)}>
                  {score.total}
                </span>
                <span className="text-text-secondary text-sm pb-2">/ 90</span>
              </div>
              <span
                className={cn(
                  'inline-block px-3 py-1 rounded-full text-sm font-semibold border',
                  rc.bg,
                  rc.text,
                  rc.border,
                )}
              >
                {score.risk} Risk
              </span>
              {score.detoxOffset > 0 && (
                <p className="text-xs text-green-600 mt-2 font-medium">
                  🌿 Detox practices saving you −{score.detoxOffset} pts
                </p>
              )}
            </div>

            {/* Pillar breakdown */}
            <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
              <p className="text-sm font-semibold text-text-primary">Pillar Breakdown</p>
              {Object.entries(PILLAR_META).map(([key, meta]) => (
                <PillarBar
                  key={key}
                  label={meta.label}
                  value={score.pillars[key as keyof typeof score.pillars]}
                  color={meta.color}
                />
              ))}
            </div>

            {/* Top exposures */}
            {score.topExposures.length > 0 && (
              <div className="bg-surface rounded-2xl border border-border p-4">
                <p className="text-sm font-semibold text-text-primary mb-2">⚠️ Top Exposures</p>
                <ul className="space-y-1">
                  {score.topExposures.map((e, i) => (
                    <li key={i} className="text-sm text-text-secondary flex gap-2">
                      <span className="text-orange-500 flex-shrink-0">•</span>
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── Plastics ── */}
            <Section emoji="🧴" title="Plastics & Endocrine Disruptors">
              <Row
                label="Heated food in plastic containers"
                sub="BPA/phthalate migration increases with heat"
              >
                <Counter
                  value={log.heated_plastic_containers}
                  onChange={(v) => update('heated_plastic_containers', v)}
                />
              </Row>
              <Row label="Thermal receipts handled" sub="BPA skin absorption via thermal paper">
                <Counter
                  value={log.receipt_handling}
                  onChange={(v) => update('receipt_handling', v)}
                />
              </Row>
              <Row label="Canned food servings" sub="BPA in can linings leaches into food">
                <Counter
                  value={log.canned_food_servings}
                  onChange={(v) => update('canned_food_servings', v)}
                />
              </Row>
              <Row label="Plastic water/beverage bottles" sub="Microplastics + phthalates">
                <Counter
                  value={log.plastic_bottles}
                  onChange={(v) => update('plastic_bottles', v)}
                />
              </Row>
            </Section>

            {/* ── Heavy Metals ── */}
            <Section emoji="🐟" title="Heavy Metals">
              <Row
                label="High-mercury fish servings"
                sub="Shark, swordfish, king mackerel, bigeye tuna"
              >
                <Counter
                  value={log.high_mercury_fish}
                  onChange={(v) => update('high_mercury_fish', v)}
                  max={5}
                />
              </Row>
              <Row
                label="Medium-mercury fish servings"
                sub="Albacore tuna, halibut, sea bass, snapper"
              >
                <Counter
                  value={log.medium_mercury_fish}
                  onChange={(v) => update('medium_mercury_fish', v)}
                />
              </Row>
              <Row label="Unfiltered tap water concern" sub="Old pipes, lead solder, agricultural runoff">
                <Toggle
                  checked={log.tap_water_concern}
                  onChange={(v) => update('tap_water_concern', v)}
                />
              </Row>
              <Row label="Old paint exposure" sub="Pre-1978 homes may have lead paint">
                <Toggle
                  checked={log.old_paint_exposure}
                  onChange={(v) => update('old_paint_exposure', v)}
                />
              </Row>
            </Section>

            {/* ── Pesticides ── */}
            <Section emoji="🌱" title="Pesticides">
              <Row
                label="Dirty Dozen servings (non-organic)"
                sub="Strawberries, spinach, kale, apples, grapes…"
              >
                <Counter
                  value={log.dirty_dozen_servings}
                  onChange={(v) => update('dirty_dozen_servings', v)}
                />
              </Row>
              <Row label="Other conventional produce servings" sub="Excludes Clean Fifteen">
                <Counter
                  value={log.conventional_produce_servings}
                  onChange={(v) => update('conventional_produce_servings', v)}
                />
              </Row>
              <Row label="Organic produce servings ✓" sub="Zero pesticide score — keep it up!">
                <Counter
                  value={log.organic_produce_servings}
                  onChange={(v) => update('organic_produce_servings', v)}
                />
              </Row>
            </Section>

            {/* ── VOCs ── */}
            <Section emoji="🏠" title="VOCs & Indoor Air">
              <Row label="Cleaning products used" sub="Sprays, bleach, drain cleaners, solvents">
                <Counter
                  value={log.cleaning_products_used}
                  onChange={(v) => update('cleaning_products_used', v)}
                />
              </Row>
              <Row label="Air fresheners or scented candles" sub="Benzene, formaldehyde off-gassing">
                <Toggle
                  checked={log.air_fresheners_used}
                  onChange={(v) => update('air_fresheners_used', v)}
                />
              </Row>
              <Row label="New furniture off-gassing" sub="VOCs peak in first 3–6 months after purchase">
                <Toggle
                  checked={log.new_furniture_offgassing}
                  onChange={(v) => update('new_furniture_offgassing', v)}
                />
              </Row>
              <Row label="Dry-cleaned items brought home" sub="Perchloroethylene (PERC) residue">
                <Counter
                  value={log.dry_cleaned_items}
                  onChange={(v) => update('dry_cleaned_items', v)}
                  max={5}
                />
              </Row>
            </Section>

            {/* ── Detox Practices ── */}
            <Section emoji="🌿" title="Detox Practices">
              <Row label="Cruciferous veg servings" sub="Broccoli, cauliflower, kale — Phase II liver enzymes">
                <Counter
                  value={log.cruciferous_veg_servings}
                  onChange={(v) => update('cruciferous_veg_servings', v)}
                />
              </Row>
              <Row label="Dietary fibre" sub="Binds toxins in gut for elimination">
                <StepCounter
                  value={log.fiber_g}
                  onChange={(v) => update('fiber_g', v)}
                  step={5}
                  unit="g"
                  max={60}
                />
              </Row>
              <Row label="Sauna session today" sub="Sweat-based toxin excretion">
                <Toggle
                  checked={log.sauna_minutes > 0}
                  onChange={(v) => update('sauna_minutes', v ? 20 : 0)}
                />
              </Row>
              <Row label="Water intake" sub="Renal clearance of water-soluble toxins">
                <StepCounter
                  value={log.water_l}
                  onChange={(v) => update('water_l', v)}
                  step={0.5}
                  unit="L"
                  max={6}
                />
              </Row>
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-sm text-text-secondary">Total detox offset</span>
                <span className="font-bold text-green-600 text-sm">−{score.detoxOffset} pts</span>
              </div>
            </Section>

            {/* Recommendations */}
            <div className="bg-surface rounded-2xl border border-border p-4">
              <p className="font-semibold text-text-primary mb-3">💡 Recommendations</p>
              <ul className="space-y-2">
                {score.recommendations.map((r, i) => (
                  <li key={i} className="flex gap-2 text-sm text-text-secondary">
                    <span className="text-green-500 flex-shrink-0 mt-0.5">→</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            REFERENCES TAB
        ══════════════════════════════════════════════════════════════════ */}
        {tab === 'references' && (
          <>
            {/* Dirty Dozen */}
            <div className="bg-surface rounded-2xl border border-border p-4">
              <p className="font-semibold text-text-primary">🍓 EWG Dirty Dozen 2023</p>
              <p className="text-xs text-text-secondary mt-0.5 mb-3">
                Highest pesticide residues — always buy organic for these
              </p>
              <div className="flex flex-wrap gap-2">
                {DIRTY_DOZEN_2023.map((item) => (
                  <span
                    key={item}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Clean Fifteen */}
            <div className="bg-surface rounded-2xl border border-border p-4">
              <p className="font-semibold text-text-primary">🥑 EWG Clean Fifteen 2023</p>
              <p className="text-xs text-text-secondary mt-0.5 mb-3">
                Lowest pesticide load — conventional is generally safe
              </p>
              <div className="flex flex-wrap gap-2">
                {CLEAN_FIFTEEN_2023.map((item) => (
                  <span
                    key={item}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Mercury fish guide */}
            <div className="bg-surface rounded-2xl border border-border p-4">
              <p className="font-semibold text-text-primary">🐟 FDA Mercury Fish Guide</p>
              <p className="text-xs text-text-secondary mt-0.5 mb-4">
                Source: FDA 2021 Fish Advice. Especially important for pregnant women & children.
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-xs font-bold text-red-600 mb-2">⚠️ High — limit 1/wk</p>
                  <ul className="space-y-1">
                    {MERCURY_FISH.high.map((f) => (
                      <li key={f} className="text-xs text-text-secondary">
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold text-yellow-600 mb-2">⚡ Medium — limit 1/wk</p>
                  <ul className="space-y-1">
                    {MERCURY_FISH.medium.map((f) => (
                      <li key={f} className="text-xs text-text-secondary">
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold text-green-600 mb-2">✓ Low — 2–3/wk OK</p>
                  <ul className="space-y-1">
                    {MERCURY_FISH.low.map((f) => (
                      <li key={f} className="text-xs text-text-secondary">
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Plastic-free swaps */}
            <div className="bg-surface rounded-2xl border border-border p-4">
              <p className="font-semibold text-text-primary mb-3">♻️ 5 Plastic-Free Swaps</p>
              <ul className="space-y-3">
                {(
                  [
                    ['🫙', 'Glass containers', 'Replace plastic Tupperware — never heat food in plastic'],
                    ['🧴', 'Stainless steel bottle', 'Eliminates microplastics & phthalates from plastic bottles'],
                    ['🐝', 'Beeswax wrap', 'Replaces plastic cling wrap for food storage'],
                    ['🧼', 'Bar soap & shampoo bars', 'Removes plastic pump/bottle waste & added preservatives'],
                    ['🎋', 'Bamboo utensils', 'Replaces plastic kitchen tools & single-use cutlery'],
                  ] as [string, string, string][]
                ).map(([icon, title, desc]) => (
                  <li key={title} className="flex gap-3">
                    <span className="text-xl flex-shrink-0">{icon}</span>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{title}</p>
                      <p className="text-xs text-text-secondary">{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* VOC reduction tips */}
            <div className="bg-surface rounded-2xl border border-border p-4">
              <p className="font-semibold text-text-primary mb-3">🌬️ Reducing Indoor VOCs</p>
              <p className="text-xs text-text-secondary mb-3">
                Source: WHO Guidelines for Indoor Air Quality 2021
              </p>
              <ul className="space-y-3">
                {(
                  [
                    ['🪟', 'Ventilate daily', 'Open windows ≥10 min/day — single most effective VOC reduction step'],
                    ['🌿', 'Add air-purifying plants', 'Spider plant, peace lily, snake plant reduce benzene & formaldehyde'],
                    ['🧹', 'Fragrance-free cleaners', 'Choose VOC-free or enzyme-based products; avoid aerosol sprays'],
                    ['🔘', 'HEPA air purifier', 'Especially in bedroom — run on low overnight for continuous filtration'],
                    ['🛋️', 'Air new furniture outside', 'Let new pieces off-gas outdoors for 24–48h before bringing inside'],
                  ] as [string, string, string][]
                ).map(([icon, title, desc]) => (
                  <li key={title} className="flex gap-3">
                    <span className="text-xl flex-shrink-0">{icon}</span>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{title}</p>
                      <p className="text-xs text-text-secondary">{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Research citations */}
            <div className="bg-surface rounded-2xl border border-border p-4 space-y-2 text-xs text-text-secondary">
              <p className="font-semibold text-text-primary text-sm">📚 Research Basis</p>
              <p>
                <strong>Landrigan et al. 2018</strong> (Lancet Commission on Pollution & Health):
                Pollution causes ~9 million premature deaths/year worldwide.
              </p>
              <p>
                <strong>Trasande et al. 2016</strong> (J Clin Endocrinol Metab): Endocrine
                disruptors including BPA and phthalates cost $340 billion/year in US health burden.
              </p>
              <p>
                <strong>EWG Dirty Dozen / Clean Fifteen 2023</strong>: Annual pesticide residue
                testing across 46 fruits and vegetables (USDA/FDA data).
              </p>
              <p>
                <strong>FDA 2021 Fish Advice</strong>: Mercury content by species; guidance for
                pregnant women, breastfeeding mothers, and young children.
              </p>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TRENDS TAB
        ══════════════════════════════════════════════════════════════════ */}
        {tab === 'trends' && (
          <>
            {trendData.length === 0 ? (
              <div className="bg-surface rounded-2xl border border-border p-12 text-center">
                <Leaf className="w-12 h-12 text-green-500 mx-auto mb-4 opacity-40" />
                <p className="text-text-secondary font-medium">No trend data yet</p>
                <p className="text-sm text-text-muted mt-1">
                  Log a few days to track your toxin burden over time.
                </p>
              </div>
            ) : (
              <>
                {/* Summary stats */}
                {(() => {
                  const avg = Math.round(trendData.reduce((s, d) => s + d.score, 0) / trendData.length)
                  const best = Math.min(...trendData.map((d) => d.score))
                  const worst = Math.max(...trendData.map((d) => d.score))
                  const avgRisk: keyof typeof RISK_CONFIG =
                    avg <= 15 ? 'Low' : avg <= 35 ? 'Moderate' : avg <= 55 ? 'High' : 'Very High'
                  return (
                    <div className="grid grid-cols-3 gap-3">
                      {(
                        [
                          { label: 'Avg Score', value: avg, color: RISK_CONFIG[avgRisk].text },
                          { label: 'Best Day', value: best, color: 'text-green-600' },
                          { label: 'Worst Day', value: worst, color: 'text-red-500' },
                        ] as { label: string; value: number; color: string }[]
                      ).map((stat) => (
                        <div
                          key={stat.label}
                          className="bg-surface rounded-2xl border border-border p-3 text-center"
                        >
                          <p className={cn('text-2xl font-bold tabular-nums', stat.color)}>
                            {stat.value}
                          </p>
                          <p className="text-xs text-text-secondary mt-0.5">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  )
                })()}

                {/* 30-day burden line chart */}
                <div className="bg-surface rounded-2xl border border-border p-4">
                  <p className="font-semibold text-text-primary mb-0.5">
                    30-Day Toxin Burden Trend
                  </p>
                  <p className="text-xs text-text-secondary mb-4">
                    Lower score = better. Green = Low risk (≤15).
                  </p>
                  <ResponsiveContainer width="100%" height={210}>
                    <LineChart data={trendData} margin={{ top: 6, right: 12, bottom: 0, left: -20 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        opacity={0.5}
                      />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(d: string) => d.slice(5)}
                        tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        domain={[0, 90]}
                        tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                        labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                        formatter={(v: number) => [v, 'Burden Score']}
                        labelFormatter={(d: string) => `📅 ${d}`}
                      />
                      <ReferenceLine
                        y={15}
                        stroke="#22c55e"
                        strokeDasharray="4 3"
                        label={{ value: 'Low', position: 'right', fill: '#22c55e', fontSize: 9 }}
                      />
                      <ReferenceLine
                        y={35}
                        stroke="#eab308"
                        strokeDasharray="4 3"
                        label={{ value: 'Mod', position: 'right', fill: '#eab308', fontSize: 9 }}
                      />
                      <ReferenceLine
                        y={55}
                        stroke="#f97316"
                        strokeDasharray="4 3"
                        label={{ value: 'High', position: 'right', fill: '#f97316', fontSize: 9 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#22c55e', strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Stacked pillar bar chart */}
                <div className="bg-surface rounded-2xl border border-border p-4">
                  <p className="font-semibold text-text-primary mb-0.5">Pillar Breakdown Trend</p>
                  <p className="text-xs text-text-secondary mb-4">
                    Daily contribution of each toxin category (0–25 each, stacked)
                  </p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={trendData} margin={{ top: 4, right: 12, bottom: 0, left: -20 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        opacity={0.5}
                      />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(d: string) => d.slice(5)}
                        tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                        labelFormatter={(d: string) => `📅 ${d}`}
                      />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Bar
                        dataKey="plastics"
                        name="Plastics"
                        fill="#a78bfa"
                        stackId="burden"
                        radius={[0, 0, 0, 0]}
                      />
                      <Bar
                        dataKey="heavyMetals"
                        name="Heavy Metals"
                        fill="#60a5fa"
                        stackId="burden"
                      />
                      <Bar
                        dataKey="pesticides"
                        name="Pesticides"
                        fill="#34d399"
                        stackId="burden"
                      />
                      <Bar
                        dataKey="vocs"
                        name="VOCs"
                        fill="#fb923c"
                        stackId="burden"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* 30-day daily tile heatmap */}
                <div className="bg-surface rounded-2xl border border-border p-4">
                  <p className="font-semibold text-text-primary mb-3">📅 Daily Burden Heatmap</p>
                  <div className="flex flex-wrap gap-1.5">
                    {trendData.map((d) => {
                      const bg =
                        d.score <= 15
                          ? '#dcfce7'
                          : d.score <= 35
                            ? '#fef9c3'
                            : d.score <= 55
                              ? '#ffedd5'
                              : '#fee2e2'
                      const fg =
                        d.score <= 15
                          ? '#166534'
                          : d.score <= 35
                            ? '#854d0e'
                            : d.score <= 55
                              ? '#9a3412'
                              : '#991b1b'
                      return (
                        <div
                          key={d.date}
                          title={`${d.date}: ${d.score}`}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold cursor-default"
                          style={{ background: bg, color: fg }}
                        >
                          {d.score}
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-xs text-text-muted mt-2">
                    🟢 Low (≤15) &nbsp; 🟡 Moderate (16–35) &nbsp; 🟠 High (36–55) &nbsp; 🔴 Very
                    High (&gt;55)
                  </p>
                </div>

                {/* Average pillar breakdown */}
                {(() => {
                  const n = trendData.length
                  const avgPillars = {
                    plastics: Math.round(trendData.reduce((s, d) => s + d.plastics, 0) / n),
                    heavyMetals: Math.round(trendData.reduce((s, d) => s + d.heavyMetals, 0) / n),
                    pesticides: Math.round(trendData.reduce((s, d) => s + d.pesticides, 0) / n),
                    vocs: Math.round(trendData.reduce((s, d) => s + d.vocs, 0) / n),
                  }
                  const sorted = Object.entries(avgPillars).sort(([, a], [, b]) => b - a)
                  return (
                    <div className="bg-surface rounded-2xl border border-border p-4">
                      <p className="font-semibold text-text-primary mb-3">
                        📊 Avg Pillar Scores ({n}-day period)
                      </p>
                      <div className="space-y-3">
                        {sorted.map(([key, val]) => (
                          <PillarBar
                            key={key}
                            label={PILLAR_META[key as keyof typeof PILLAR_META].label}
                            value={val}
                            color={PILLAR_META[key as keyof typeof PILLAR_META].color}
                          />
                        ))}
                      </div>
                      {sorted[0][1] > 10 && (
                        <p className="text-xs text-text-secondary mt-3 border-t border-border pt-2">
                          💡 Your highest average exposure is{' '}
                          <strong>{PILLAR_META[sorted[0][0] as keyof typeof PILLAR_META].label}</strong>.
                          Focus your detox efforts there first.
                        </p>
                      )}
                    </div>
                  )
                })()}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
