'use client'

import { useState, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, CartesianGrid, Legend,
  AreaChart, Area,
} from 'recharts'
import { Moon, Thermometer, Eye, Volume2, BedDouble, CheckCircle2, Star, Zap, FlaskConical, ChevronRight, RotateCcw } from 'lucide-react'
import {
  calculateSleepEnvironmentScore,
  WIND_DOWN_ACTIVITIES,
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  type SleepEnvironmentLog,
  type SleepEnvironmentScore,
} from '@/lib/sleep-environment'

// ─── Types ─────────────────────────────────────────────────────────────────

type ScoredLog = SleepEnvironmentLog & { score: SleepEnvironmentScore }

interface Props {
  initialLogs: ScoredLog[]
  latestLog: ScoredLog | null
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const today = new Date().toISOString().slice(0, 10)

function defaultLog(): SleepEnvironmentLog {
  return {
    date: today,
    room_temp_f: 68,
    use_celsius: false,
    blackout_curtains: false,
    eye_mask: false,
    no_electronics_light: false,
    noise_level: 3,
    white_noise_used: false,
    earplugs_used: false,
    no_screens_30min: false,
    last_meal_hours_before: 2,
    wind_down_activities: [],
    consistent_bedtime: false,
    screen_time_before_bed_min: 60,
    mattress_age_years: 5,
    pillow_comfortable: true,
    sleep_onset_min: 20,
    perceived_sleep_quality: 3,
    notes: '',
  }
}

const GRADE_COLOR: Record<SleepEnvironmentScore['grade'], string> = {
  Optimal: '#22c55e',
  Good: '#3b82f6',
  Fair: '#f59e0b',
  Poor: '#ef4444',
}

// ─── Score Ring ──────────────────────────────────────────────────────────

function ScoreRing({ score, grade }: { score: number; grade: SleepEnvironmentScore['grade'] }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = GRADE_COLOR[grade]
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#1e2533" strokeWidth="12" />
        <circle
          cx="64" cy="64" r={r} fill="none"
          stroke={color} strokeWidth="12"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 64 64)"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x="64" y="60" textAnchor="middle" fill={color} fontSize="28" fontWeight="700" dominantBaseline="middle">{score}</text>
        <text x="64" y="82" textAnchor="middle" fill="#9ca3af" fontSize="11" dominantBaseline="middle">/100</text>
      </svg>
      <span className="text-sm font-semibold px-3 py-0.5 rounded-full" style={{ background: color + '22', color }}>
        {grade}
      </span>
    </div>
  )
}

// ─── Toggle ──────────────────────────────────────────────────────────────

function Toggle({ label, value, onChange, description }: {
  label: string; value: boolean; onChange: (v: boolean) => void; description?: string
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer py-2">
      <div>
        <span className="text-sm font-medium text-text-primary">{label}</span>
        {description && <p className="text-xs text-text-secondary mt-0.5">{description}</p>}
      </div>
      <div
        role="switch" aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-primary' : 'bg-surface-secondary border border-border'}`}
      >
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
    </label>
  )
}

// ─── Slider ──────────────────────────────────────────────────────────────

function SliderField({ label, min, max, step = 1, value, onChange, unit = '', color = '' }: {
  label: string; min: number; max: number; step?: number;
  value: number; onChange: (v: number) => void; unit?: string; color?: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        <span className={`text-sm font-bold ${color || 'text-primary'}`}>{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  )
}

// ─── Star Rating ─────────────────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type="button" onClick={() => onChange(s)} className="transition-transform hover:scale-110">
          <Star className={`w-7 h-7 ${s <= value ? 'fill-yellow-400 text-yellow-400' : 'text-border'}`} />
        </button>
      ))}
    </div>
  )
}

// ─── Pillar Bar ───────────────────────────────────────────────────────────

function PillarBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-text-secondary">{label}</span>
        <span className="font-semibold" style={{ color }}>{value}</span>
      </div>
      <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  )
}

// ─── Tab: Tonight ────────────────────────────────────────────────────────

function TonightTab({
  form, setForm, score, saving, onSave,
}: {
  form: SleepEnvironmentLog
  setForm: (f: SleepEnvironmentLog) => void
  score: SleepEnvironmentScore
  saving: boolean
  onSave: () => void
}) {
  const set = useCallback((patch: Partial<SleepEnvironmentLog>) => {
    setForm({ ...form, ...patch })
  }, [form, setForm])

  const displayTemp = form.use_celsius
    ? Math.round(fahrenheitToCelsius(form.room_temp_f) * 10) / 10
    : form.room_temp_f

  const tempColor =
    score.tempStatus === 'optimal' ? '#22c55e'
    : score.tempStatus === 'too_warm' ? '#ef4444'
    : '#3b82f6'

  const noiseLabel = (n: number) =>
    n === 0 ? 'Silent' : n <= 2 ? 'Very Quiet' : n <= 4 ? 'Quiet' : n <= 6 ? 'Moderate' : n <= 8 ? 'Loud' : 'Very Loud'

  const screenColor = form.screen_time_before_bed_min > 30 ? 'text-red-400' : 'text-green-400'

  const mattressColor =
    form.mattress_age_years < 7 ? 'text-green-400'
    : form.mattress_age_years < 10 ? 'text-yellow-400'
    : 'text-red-400'

  return (
    <div className="space-y-4">
      {/* Score overview */}
      <div className="bg-surface rounded-2xl p-5 border border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Tonight's Score</h2>
            <p className="text-xs text-text-secondary">{form.date}</p>
          </div>
          <ScoreRing score={score.total} grade={score.grade} />
        </div>
        <div className="grid grid-cols-5 gap-2 mt-2">
          {[
            { label: 'Temp', value: score.pillars.temperature, color: '#f59e0b' },
            { label: 'Dark', value: score.pillars.darkness, color: '#8b5cf6' },
            { label: 'Noise', value: score.pillars.noise, color: '#06b6d4' },
            { label: 'Routine', value: score.pillars.preSleep, color: '#22c55e' },
            { label: 'Comfort', value: score.pillars.comfort, color: '#ec4899' },
          ].map(p => (
            <div key={p.label} className="flex flex-col items-center gap-1">
              <span className="text-lg font-bold" style={{ color: p.color }}>{p.value}</span>
              <span className="text-[10px] text-text-secondary leading-tight text-center">{p.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Wins */}
      {score.quickWins.length > 0 && (
        <div className="bg-surface rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-bold text-text-primary">Quick Wins</span>
          </div>
          <div className="space-y-2">
            {score.quickWins.map((w, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                <ChevronRight className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                {w}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Temperature */}
      <div className="bg-surface rounded-2xl p-4 border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4" style={{ color: tempColor }} />
            <span className="font-semibold text-text-primary">Temperature</span>
          </div>
          <Toggle
            label={form.use_celsius ? '°C' : '°F'}
            value={form.use_celsius}
            onChange={v => set({ use_celsius: v })}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-primary">Room Temperature</span>
            <span className="text-sm font-bold" style={{ color: tempColor }}>
              {displayTemp}{form.use_celsius ? '°C' : '°F'} · {score.tempStatus === 'optimal' ? '✅ Optimal' : score.tempStatus === 'too_warm' ? '🔥 Too Warm' : '❄️ Too Cold'}
            </span>
          </div>
          <input
            type="range"
            min={form.use_celsius ? Math.round(fahrenheitToCelsius(55) * 10) / 10 : 55}
            max={form.use_celsius ? Math.round(fahrenheitToCelsius(85) * 10) / 10 : 85}
            step={form.use_celsius ? 0.5 : 1}
            value={displayTemp}
            onChange={e => {
              const v = Number(e.target.value)
              set({ room_temp_f: form.use_celsius ? Math.round(celsiusToFahrenheit(v)) : v })
            }}
            className="w-full accent-primary"
          />
          {/* Optimal zone indicator */}
          <div className="relative h-4 rounded-full bg-surface-secondary overflow-hidden mt-1">
            <div
              className="absolute h-full bg-green-500/30 rounded-full"
              style={{
                left: `${((65 - 55) / 30) * 100}%`,
                width: `${((68 - 65) / 30) * 100}%`,
              }}
            />
            <div
              className="absolute top-0.5 w-3 h-3 rounded-full border-2 border-white shadow transition-all"
              style={{
                left: `calc(${((form.room_temp_f - 55) / 30) * 100}% - 6px)`,
                background: tempColor,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-text-secondary">
            <span>55°F</span>
            <span className="text-green-400">Optimal: 65–68°F</span>
            <span>85°F</span>
          </div>
        </div>
      </div>

      {/* Darkness */}
      <div className="bg-surface rounded-2xl p-4 border border-border space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="w-4 h-4 text-purple-400" />
          <span className="font-semibold text-text-primary">Darkness</span>
          <span className="ml-auto text-xs font-bold text-purple-400">{score.pillars.darkness}/100</span>
        </div>
        <Toggle label="Blackout curtains" value={form.blackout_curtains} onChange={v => set({ blackout_curtains: v })} description="+40 pts · blocks all ambient light" />
        <Toggle label="Eye mask" value={form.eye_mask} onChange={v => set({ eye_mask: v })} description="+30 pts · even dim light suppresses melatonin 50%" />
        <Toggle label="No electronics lights" value={form.no_electronics_light} onChange={v => set({ no_electronics_light: v })} description="+30 pts · cover standby LEDs" />
      </div>

      {/* Noise */}
      <div className="bg-surface rounded-2xl p-4 border border-border space-y-3">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-text-primary">Noise</span>
          <span className="ml-auto text-xs font-bold text-cyan-400">{score.pillars.noise}/100</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-text-primary">Noise level</span>
            <span className="text-sm font-bold text-cyan-400">{form.noise_level} · {noiseLabel(form.noise_level)}</span>
          </div>
          <input
            type="range" min={0} max={10} value={form.noise_level}
            onChange={e => set({ noise_level: Number(e.target.value) })}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-text-secondary">
            <span>0 Silent</span><span>3 Quiet</span><span>6 Moderate</span><span>10 Loud</span>
          </div>
        </div>
        <Toggle label="White noise / sound machine" value={form.white_noise_used} onChange={v => set({ white_noise_used: v })} description="+20 pts" />
        <Toggle label="Earplugs" value={form.earplugs_used} onChange={v => set({ earplugs_used: v })} />
      </div>

      {/* Pre-Sleep Routine */}
      <div className="bg-surface rounded-2xl p-4 border border-border space-y-3">
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-green-400" />
          <span className="font-semibold text-text-primary">Pre-Sleep Routine</span>
          <span className="ml-auto text-xs font-bold text-green-400">{score.pillars.preSleep}/100</span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-text-primary">Screen time before bed</span>
            <span className={`text-sm font-bold ${screenColor}`}>{form.screen_time_before_bed_min} min</span>
          </div>
          <input
            type="range" min={0} max={120} step={5} value={form.screen_time_before_bed_min}
            onChange={e => {
              const mins = Number(e.target.value)
              set({ screen_time_before_bed_min: mins, no_screens_30min: mins <= 0 })
            }}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-text-secondary">
            <span>0 min</span><span className="text-green-400">≤30 ideal</span><span>120 min</span>
          </div>
        </div>

        <SliderField
          label="Last meal before bed"
          min={0} max={8} step={0.5}
          value={form.last_meal_hours_before}
          onChange={v => set({ last_meal_hours_before: v })}
          unit="h"
          color={form.last_meal_hours_before >= 3 ? 'text-green-400' : 'text-yellow-400'}
        />

        <Toggle label="Consistent bedtime tonight" value={form.consistent_bedtime} onChange={v => set({ consistent_bedtime: v })} />

        <div className="space-y-2 pt-1">
          <span className="text-sm font-medium text-text-primary">Wind-down activities</span>
          <div className="flex flex-wrap gap-2">
            {WIND_DOWN_ACTIVITIES.map(a => {
              const active = form.wind_down_activities.includes(a.id)
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    const next = active
                      ? form.wind_down_activities.filter(x => x !== a.id)
                      : [...form.wind_down_activities, a.id]
                    set({ wind_down_activities: next })
                  }}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                    active
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-surface-secondary border-border text-text-secondary hover:border-primary/50'
                  }`}
                  title={a.benefit}
                >
                  {a.label}
                </button>
              )
            })}
          </div>
          {form.wind_down_activities.length > 0 && (
            <p className="text-xs text-green-400">
              ✓ {form.wind_down_activities.length} activit{form.wind_down_activities.length > 1 ? 'ies' : 'y'} selected
            </p>
          )}
        </div>
      </div>

      {/* Comfort */}
      <div className="bg-surface rounded-2xl p-4 border border-border space-y-3">
        <div className="flex items-center gap-2">
          <BedDouble className="w-4 h-4 text-pink-400" />
          <span className="font-semibold text-text-primary">Comfort</span>
          <span className="ml-auto text-xs font-bold text-pink-400">{score.pillars.comfort}/100</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-text-primary">Mattress age</span>
            <span className={`text-sm font-bold ${mattressColor}`}>
              {form.mattress_age_years} yr{form.mattress_age_years >= 10 ? ' ⚠️' : form.mattress_age_years >= 7 ? ' 🟡' : ' ✅'}
            </span>
          </div>
          <input
            type="range" min={0} max={20} step={0.5} value={form.mattress_age_years}
            onChange={e => set({ mattress_age_years: Number(e.target.value) })}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-text-secondary">
            <span className="text-green-400">0–6yr ideal</span>
            <span className="text-yellow-400">7–9yr aging</span>
            <span className="text-red-400">10+yr replace</span>
          </div>
        </div>
        <Toggle label="Pillow is comfortable" value={form.pillow_comfortable} onChange={v => set({ pillow_comfortable: v })} description="+20 pts bonus" />
      </div>

      {/* Next morning */}
      <div className="bg-surface rounded-2xl p-4 border border-border space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-yellow-400" />
          <span className="font-semibold text-text-primary">Next Morning Outcomes</span>
        </div>
        <SliderField
          label="Time to fall asleep"
          min={0} max={90} step={5}
          value={form.sleep_onset_min}
          onChange={v => set({ sleep_onset_min: v })}
          unit=" min"
          color={form.sleep_onset_min <= 20 ? 'text-green-400' : form.sleep_onset_min <= 30 ? 'text-yellow-400' : 'text-red-400'}
        />
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-text-primary">Perceived sleep quality</span>
          <StarRating value={form.perceived_sleep_quality} onChange={v => set({ perceived_sleep_quality: v })} />
        </div>
        <div className="space-y-1">
          <span className="text-sm font-medium text-text-primary">Notes</span>
          <textarea
            value={form.notes ?? ''}
            onChange={e => set({ notes: e.target.value })}
            placeholder="Any observations about your sleep tonight…"
            rows={2}
            className="w-full text-sm bg-surface-secondary border border-border rounded-xl px-3 py-2 text-text-primary placeholder:text-text-secondary resize-none focus:outline-none focus:border-primary/60"
          />
        </div>
      </div>

      {/* Recommendations */}
      {score.recommendations.length > 0 && (
        <div className="bg-surface rounded-2xl p-4 border border-border">
          <h3 className="text-sm font-bold text-text-primary mb-3">Recommendations</h3>
          <div className="space-y-2">
            {score.recommendations.map((r, i) => (
              <div key={i} className="flex gap-2 text-xs text-text-secondary">
                <span className="text-primary flex-shrink-0 mt-0.5">•</span>
                {r}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save */}
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="w-full py-3.5 rounded-2xl bg-primary text-white font-semibold text-base shadow-md hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save Tonight\'s Log'}
      </button>
    </div>
  )
}

// ─── Tab: Science ─────────────────────────────────────────────────────────

function ScienceTab() {
  return (
    <div className="space-y-4">
      {/* Temperature */}
      <div className="bg-surface rounded-2xl p-5 border border-border space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Thermometer className="w-5 h-5 text-yellow-400" />
          <h3 className="font-bold text-text-primary">Temperature Science</h3>
        </div>
        <div className="space-y-2 text-sm text-text-secondary leading-relaxed">
          <p>
            <strong className="text-text-primary">Optimal range: 65–68°F (18–20°C).</strong> Okamoto-Mizuno & Mizuno (2012, J Physiol Anthropol) demonstrated elevated room temperature significantly increases wakefulness and reduces Slow-Wave Sleep (SWS) — your most restorative sleep stage.
          </p>
          <p>
            <strong className="text-text-primary">Core body temperature must drop 2–3°F</strong> to initiate and maintain sleep (Walker 2017). Your bedroom acts as a thermoregulation aid.
          </p>
          <p>
            <strong className="text-text-primary">Hot bath paradox:</strong> A warm bath/shower 1–2h before bed paradoxically helps. The rapid skin vasodilation afterward accelerates core temperature drop, expediting sleep onset.
          </p>
          <div className="bg-surface-secondary rounded-xl p-3 text-xs mt-2">
            <div className="font-semibold text-text-primary mb-1">Temperature → Sleep Quality</div>
            <div className="flex gap-2 flex-wrap">
              {[['60–63°F', '60pts', 'text-blue-400'], ['64°F', '85pts', 'text-cyan-400'], ['65–68°F', '100pts', 'text-green-400'], ['69°F', '85pts', 'text-cyan-400'], ['70–72°F', '60pts', 'text-yellow-400'], ['>72°F', '30pts', 'text-red-400']].map(([range, pts, color]) => (
                <span key={range} className="px-2 py-1 bg-background rounded-lg">
                  <span className="text-text-secondary">{range} </span>
                  <span className={`font-bold ${color}`}>{pts}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Light */}
      <div className="bg-surface rounded-2xl p-5 border border-border space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Eye className="w-5 h-5 text-purple-400" />
          <h3 className="font-bold text-text-primary">Light & Melatonin Science</h3>
        </div>
        <div className="space-y-2 text-sm text-text-secondary leading-relaxed">
          <p>
            <strong className="text-text-primary">Even dim light matters.</strong> Halperin (2014, Curr Sleep Med Rep): 10 lux (a typical nightlight level) suppresses melatonin production by 50%.
          </p>
          <p>
            <strong className="text-text-primary">Blue light is the biggest culprit.</strong> Gooley et al. (2011) showed blue light at 480nm maximally suppresses melatonin and can delay sleep onset by 1.5 hours when used before bed.
          </p>
          <p>
            <strong className="text-text-primary">Practical tips:</strong> Enable Night Shift (iOS) or f.lux after sunset. Use "grayscale" mode as an extra deterrent. Cover router and TV standby LEDs with black electrical tape.
          </p>
          <div className="bg-surface-secondary rounded-xl p-3 text-xs mt-2">
            <div className="font-semibold text-text-primary mb-2">Lux Reference Levels</div>
            {[['Moonlight', '0.01', '#e2e8f0'], ['Starlight', '0.001', '#e2e8f0'], ['Nightlight', '10', '#c084fc'], ['Office', '500', '#fb923c'], ['Outdoor day', '10,000+', '#fbbf24']].map(([source, lux, color]) => (
              <div key={source} className="flex justify-between py-0.5" style={{ color }}>
                <span>{source}</span><span className="font-mono">{lux} lux</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Noise */}
      <div className="bg-surface rounded-2xl p-5 border border-border space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Volume2 className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-text-primary">Noise Science</h3>
        </div>
        <div className="space-y-2 text-sm text-text-secondary leading-relaxed">
          <p>
            <strong className="text-text-primary">Road traffic noise above 55 dB</strong> disrupts sleep architecture (Basner et al. 2011, Lancet). Each 10 dB increase causes 14% more awakenings.
          </p>
          <p>
            <strong className="text-text-primary">White noise works</strong> by raising the ambient floor, reducing the contrast of sudden sounds that trigger arousal responses.
          </p>
          <div className="bg-surface-secondary rounded-xl p-3 text-xs mt-2">
            <div className="font-semibold text-text-primary mb-2">dB Reference Chart</div>
            {[['Rustling leaves', '20 dB', '#86efac'], ['Whisper', '30 dB', '#86efac'], ['Quiet bedroom', '40 dB', '#86efac'], ['White noise', '50 dB', '#6ee7b7'], ['Normal speech', '60 dB', '#fbbf24'], ['Road traffic', '70 dB', '#fb923c'], ['Loud music', '80+ dB', '#f87171']].map(([source, db, color]) => (
              <div key={source} className="flex justify-between py-0.5" style={{ color }}>
                <span>{source}</span><span className="font-mono">{db}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mattress */}
      <div className="bg-surface rounded-2xl p-5 border border-border space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <BedDouble className="w-5 h-5 text-pink-400" />
          <h3 className="font-bold text-text-primary">Mattress & Comfort Guide</h3>
        </div>
        <div className="space-y-2 text-sm text-text-secondary leading-relaxed">
          <p>
            <strong className="text-text-primary">Replace every 7–10 years.</strong> Ohayon et al. (2001) found significant correlation between mattress age and self-reported sleep quality. Most mattresses lose 25–30% of support by year 7.
          </p>
          <p>
            <strong className="text-text-primary">Signs it's time:</strong> You wake with stiffness/pain, visible sagging &gt;1.5 inches, mattress more than 10 years old, or noticeably better sleep elsewhere.
          </p>
          <p>
            <strong className="text-text-primary">Key considerations when buying:</strong> Medium-firm for back/stomach sleepers, softer for side sleepers. Look for CertiPUR-US certified foam (low VOC off-gassing). 100-night trials are standard.
          </p>
        </div>
      </div>

      {/* Pre-sleep routine */}
      <div className="bg-surface rounded-2xl p-5 border border-border space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Moon className="w-5 h-5 text-green-400" />
          <h3 className="font-bold text-text-primary">Evidence-Based Wind-Down Activities</h3>
        </div>
        <div className="space-y-2">
          {WIND_DOWN_ACTIVITIES.map(a => (
            <div key={a.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
              <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-text-primary">{a.label}</p>
                <p className="text-xs text-text-secondary mt-0.5">{a.benefit}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-secondary pt-1">
          University of Sussex (2009): Reading for 6 minutes reduces muscle tension by 57% and heart rate measurably, outperforming tea, music, and walking.
        </p>
      </div>
    </div>
  )
}

// ─── Tab: Trends ──────────────────────────────────────────────────────────

function TrendsTab({ logs }: { logs: ScoredLog[] }) {
  const chartData = [...logs].reverse().map(l => ({
    date: l.date.slice(5),
    score: l.score.total,
    temperature: l.score.pillars.temperature,
    darkness: l.score.pillars.darkness,
    noise: l.score.pillars.noise,
    preSleep: l.score.pillars.preSleep,
    comfort: l.score.pillars.comfort,
    onset: l.sleep_onset_min,
    quality: l.perceived_sleep_quality,
    tempF: l.room_temp_f,
  }))

  const scatterOnset = logs
    .filter(l => l.sleep_onset_min != null)
    .map(l => ({ score: l.score.total, onset: l.sleep_onset_min }))

  const scatterQuality = logs
    .filter(l => l.perceived_sleep_quality != null)
    .map(l => ({ score: l.score.total, quality: l.perceived_sleep_quality }))

  // Activity frequency
  const activityCount: Record<string, number> = {}
  for (const l of logs) {
    for (const a of l.wind_down_activities ?? []) {
      activityCount[a] = (activityCount[a] || 0) + 1
    }
  }
  const activityData = WIND_DOWN_ACTIVITIES
    .map(a => ({ label: a.label.slice(0, 18), count: activityCount[a.id] ?? 0 }))
    .filter(a => a.count > 0)
    .sort((a, b) => b.count - a.count)

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <Moon className="w-12 h-12 text-border" />
        <p className="text-text-secondary text-sm">No logs yet. Start tracking tonight to see trends.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* 30-day score line */}
      <div className="bg-surface rounded-2xl p-4 border border-border">
        <h3 className="text-sm font-bold text-text-primary mb-3">Sleep Environment Score — 30 Days</h3>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2533" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
            <Tooltip contentStyle={{ background: '#0f1117', border: '1px solid #1e2533', borderRadius: 12, fontSize: 12 }} />
            <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={false} name="Score" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Score vs Sleep Onset scatter */}
      <div className="bg-surface rounded-2xl p-4 border border-border">
        <h3 className="text-sm font-bold text-text-primary mb-1">Score vs Sleep Onset</h3>
        <p className="text-xs text-text-secondary mb-3">Higher score → faster sleep onset</p>
        <ResponsiveContainer width="100%" height={160}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2533" />
            <XAxis dataKey="score" name="Score" domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} label={{ value: 'Score', position: 'insideBottom', offset: -4, fill: '#9ca3af', fontSize: 10 }} />
            <YAxis dataKey="onset" name="Min to Sleep" tick={{ fontSize: 10, fill: '#9ca3af' }} label={{ value: 'Min', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 10 }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: '#0f1117', border: '1px solid #1e2533', borderRadius: 12, fontSize: 12 }} />
            <Scatter data={scatterOnset} fill="#22c55e" name="Nights" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Score vs Quality scatter */}
      <div className="bg-surface rounded-2xl p-4 border border-border">
        <h3 className="text-sm font-bold text-text-primary mb-1">Score vs Sleep Quality</h3>
        <p className="text-xs text-text-secondary mb-3">Higher score → better perceived quality</p>
        <ResponsiveContainer width="100%" height={150}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2533" />
            <XAxis dataKey="score" name="Score" domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
            <YAxis dataKey="quality" name="Quality" domain={[1, 5]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
            <Tooltip contentStyle={{ background: '#0f1117', border: '1px solid #1e2533', borderRadius: 12, fontSize: 12 }} />
            <Scatter data={scatterQuality} fill="#f59e0b" name="Nights" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Pillar stacked area */}
      <div className="bg-surface rounded-2xl p-4 border border-border">
        <h3 className="text-sm font-bold text-text-primary mb-3">Pillar Breakdown Over Time</h3>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2533" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
            <Tooltip contentStyle={{ background: '#0f1117', border: '1px solid #1e2533', borderRadius: 12, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="temperature" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="Temp" />
            <Area type="monotone" dataKey="darkness" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="Dark" />
            <Area type="monotone" dataKey="noise" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} name="Noise" />
            <Area type="monotone" dataKey="preSleep" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} name="Routine" />
            <Area type="monotone" dataKey="comfort" stackId="1" stroke="#ec4899" fill="#ec4899" fillOpacity={0.6} name="Comfort" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Temperature history */}
      <div className="bg-surface rounded-2xl p-4 border border-border">
        <h3 className="text-sm font-bold text-text-primary mb-3">Room Temperature History</h3>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2533" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} />
            <YAxis domain={[55, 85]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
            <Tooltip contentStyle={{ background: '#0f1117', border: '1px solid #1e2533', borderRadius: 12, fontSize: 12 }} />
            {/* optimal zone reference lines rendered via custom shape */}
            <Line type="monotone" dataKey="tempF" stroke="#f59e0b" strokeWidth={2} dot={false} name="Temp °F" />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-[10px] text-green-400 mt-1">Optimal zone: 65–68°F</p>
      </div>

      {/* Wind-down activity frequency */}
      {activityData.length > 0 && (
        <div className="bg-surface rounded-2xl p-4 border border-border">
          <h3 className="text-sm font-bold text-text-primary mb-3">Wind-Down Activities Frequency</h3>
          <div className="space-y-2">
            {activityData.map(a => (
              <div key={a.label} className="space-y-0.5">
                <div className="flex justify-between text-xs">
                  <span className="text-text-secondary">{a.label}</span>
                  <span className="font-semibold text-text-primary">{a.count}×</span>
                </div>
                <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-green-500"
                    style={{ width: `${Math.min(100, (a.count / logs.length) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Client Component ────────────────────────────────────────────────

const TABS = ['Tonight', 'Science', 'Trends'] as const
type Tab = typeof TABS[number]

export function SleepEnvClient({ initialLogs, latestLog }: Props) {
  const [tab, setTab] = useState<Tab>('Tonight')
  const [logs, setLogs] = useState<ScoredLog[]>(initialLogs)
  const [form, setForm] = useState<SleepEnvironmentLog>(
    latestLog?.date === today ? { ...latestLog } : defaultLog()
  )
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const score = calculateSleepEnvironmentScore(form)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/sleep-environment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to save')
      const { log, score: saved } = await res.json()
      const newLog: ScoredLog = { ...log, score: saved }
      setLogs(prev => {
        const filtered = prev.filter(l => l.date !== log.date)
        return [newLog, ...filtered].sort((a, b) => b.date.localeCompare(a.date))
      })
      showToast(`Saved! Score: ${saved.total} (${saved.grade})`)
    } catch {
      showToast('Save failed — please try again')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setForm(defaultLog())
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Moon className="w-5 h-5 text-primary" /> Sleep Environment
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">Science-backed optimization</p>
        </div>
        {tab === 'Tonight' && (
          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-xl border border-border bg-surface hover:bg-surface-secondary transition-colors"
            title="Reset to defaults"
          >
            <RotateCcw className="w-4 h-4 text-text-secondary" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-surface rounded-2xl p-1 border border-border gap-1">
        {TABS.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
              tab === t
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'Tonight' && (
        <TonightTab form={form} setForm={setForm} score={score} saving={saving} onSave={handleSave} />
      )}
      {tab === 'Science' && <ScienceTab />}
      {tab === 'Trends' && <TrendsTab logs={logs} />}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-surface border border-border rounded-2xl text-sm font-medium text-text-primary shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
