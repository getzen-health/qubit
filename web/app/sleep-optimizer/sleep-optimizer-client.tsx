'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, Cell, LineChart, Line, Legend,
} from 'recharts'
import {
  Moon, Sun, Coffee, Activity, ChevronDown, ChevronUp, Plus, Trash2,
  AlertTriangle, CheckCircle2, Info, TrendingUp, TrendingDown, Minus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  MEQ_QUESTIONS,
  scoreMEQ,
  scoreToChronotype,
  CHRONOTYPE_PROFILES,
  calculateSleepDebt,
  caffeineModel,
  caffeineAtBedtime,
  caffeineHourlyCurve,
  generateSleepSchedule,
  socialJetLag,
  twoProcessModel,
  SLEEP_HYGIENE_TIPS,
  type ChronoType,
  type CaffeineDose,
} from '@/lib/sleep-optimizer'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SleepLog {
  date: string
  durationH: number
  quality: number | null
}

interface Settings {
  chronotype?: string
  meq_score?: number
  target_wake_time?: string
  target_bed_time?: string
  sleep_goal_hours?: number
  caffeine_sensitivity?: string
  weekday_wake_time?: string
  weekend_wake_time?: string
}

interface Props {
  initialSettings: Settings | null
  initialSleepLogs: SleepLog[]
  isAuthenticated: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TABS = [
  { id: 'chronotype', label: 'Chronotype', icon: Sun },
  { id: 'schedule', label: 'Schedule', icon: Moon },
  { id: 'debt', label: 'Sleep Debt', icon: TrendingDown },
  { id: 'optimize', label: 'Optimize', icon: Coffee },
] as const

type TabId = (typeof TABS)[number]['id']

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmt12(time24: string): string {
  const [h, m] = time24.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

function fmtShortDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ---------------------------------------------------------------------------
// Chronotype Tab
// ---------------------------------------------------------------------------

function ChronotypeTab({ initialSettings, onSave }: { initialSettings: Settings | null; onSave: (s: Partial<Settings>) => Promise<void> }) {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [quizDone, setQuizDone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [weekdayWake, setWeekdayWake] = useState(initialSettings?.weekday_wake_time?.slice(0, 5) ?? '07:00')
  const [weekendWake, setWeekendWake] = useState(initialSettings?.weekend_wake_time?.slice(0, 5) ?? '08:00')
  const [savedChronotype, setSavedChronotype] = useState<ChronoType | null>(
    (initialSettings?.chronotype as ChronoType) ?? null
  )

  const answeredAll = MEQ_QUESTIONS.every((q) => answers[q.id] !== undefined)
  const { total, chronotype } = answeredAll ? scoreMEQ(answers) : { total: 0, chronotype: 'intermediate' as ChronoType }
  const profile = CHRONOTYPE_PROFILES[quizDone && answeredAll ? chronotype : (savedChronotype ?? 'intermediate')]

  const sjl = useMemo(() => socialJetLag(weekdayWake, weekendWake), [weekdayWake, weekendWake])

  async function handleSaveChronotype() {
    if (!answeredAll) return
    setSaving(true)
    await onSave({
      chronotype,
      meq_score: total,
      meq_answers: answers,
      weekday_wake_time: weekdayWake,
      weekend_wake_time: weekendWake,
    })
    setSavedChronotype(chronotype)
    setSaving(false)
  }

  const displayChronotype = (quizDone && answeredAll ? chronotype : savedChronotype) ?? 'intermediate'
  const displayProfile = CHRONOTYPE_PROFILES[displayChronotype]

  return (
    <div className="space-y-4">
      {/* Saved chronotype card */}
      {savedChronotype && !quizDone && (
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{displayProfile.emoji}</span>
            <div>
              <p className="text-xs text-text-secondary font-medium uppercase tracking-wide">Your Chronotype</p>
              <h2 className="text-lg font-bold text-text-primary">{displayProfile.label}</h2>
              {initialSettings?.meq_score !== undefined && (
                <p className="text-xs text-text-secondary">MEQ Score: {initialSettings.meq_score}/25</p>
              )}
            </div>
          </div>
          <p className="text-sm text-text-secondary">{displayProfile.description}</p>
          <div className="grid grid-cols-2 gap-2">
            <ProfilePill label="Ideal bedtime" value={fmt12(displayProfile.idealBedtime)} />
            <ProfilePill label="Ideal wake" value={fmt12(displayProfile.idealWakeTime)} />
            <ProfilePill label="Peak alertness" value={displayProfile.peakAlertness} />
            <ProfilePill label="Peak creativity" value={displayProfile.peakCreativity} />
            <ProfilePill label="Exercise timing" value={displayProfile.exerciseTiming} />
            <ProfilePill label="Caffeine cutoff" value={fmt12(displayProfile.caffeineIdealCutoff)} />
          </div>
        </div>
      )}

      {/* Quiz results card (after completing) */}
      {quizDone && answeredAll && (
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{profile.emoji}</span>
              <div>
                <p className="text-xs text-text-secondary font-medium uppercase tracking-wide">Assessment Result</p>
                <h2 className="text-lg font-bold text-text-primary">{profile.label}</h2>
                <p className="text-xs text-text-secondary">Score: {total}/25</p>
              </div>
            </div>
            <button
              onClick={handleSaveChronotype}
              disabled={saving}
              className="text-xs px-3 py-1.5 bg-primary text-white rounded-xl font-medium disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
          <p className="text-sm text-text-secondary">{profile.description}</p>
          <div className="grid grid-cols-2 gap-2">
            <ProfilePill label="Ideal bedtime" value={fmt12(profile.idealBedtime)} />
            <ProfilePill label="Ideal wake" value={fmt12(profile.idealWakeTime)} />
            <ProfilePill label="Peak alertness" value={profile.peakAlertness} />
            <ProfilePill label="Peak creativity" value={profile.peakCreativity} />
            <ProfilePill label="Exercise timing" value={profile.exerciseTiming} />
            <ProfilePill label="Caffeine cutoff" value={fmt12(profile.caffeineIdealCutoff)} />
          </div>
        </div>
      )}

      {/* MEQ Quiz */}
      {!quizDone && (
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Reduced MEQ Quiz (7 Questions)</h3>
            <p className="text-xs text-text-secondary mt-0.5">Based on Horne & Östberg 1976 — takes ~2 minutes</p>
          </div>
          {MEQ_QUESTIONS.map((q) => (
            <div key={q.id} className="space-y-2">
              <p className="text-sm font-medium text-text-primary">{q.id}. {q.question}</p>
              <div className="space-y-1">
                {q.options.map((opt) => (
                  <label
                    key={opt.score + opt.label}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-xl border cursor-pointer text-sm transition-colors',
                      answers[q.id] === opt.score
                        ? 'bg-primary/10 border-primary/40 text-text-primary'
                        : 'bg-background border-border text-text-secondary hover:border-border/60'
                    )}
                  >
                    <input
                      type="radio"
                      name={`meq-${q.id}`}
                      className="sr-only"
                      checked={answers[q.id] === opt.score}
                      onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt.score }))}
                    />
                    <span className={cn('w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
                      answers[q.id] === opt.score ? 'border-primary' : 'border-border'
                    )}>
                      {answers[q.id] === opt.score && <span className="w-2 h-2 rounded-full bg-primary" />}
                    </span>
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={() => setQuizDone(true)}
            disabled={!answeredAll}
            className="w-full py-2.5 bg-primary text-white rounded-xl font-medium text-sm disabled:opacity-40 transition-opacity"
          >
            {answeredAll ? 'See My Chronotype →' : `Answer all questions (${Object.keys(answers).length}/7)`}
          </button>
        </div>
      )}

      {quizDone && (
        <button
          onClick={() => { setQuizDone(false); setAnswers({}) }}
          className="text-xs text-text-secondary underline"
        >
          Retake quiz
        </button>
      )}

      {/* Social Jet Lag */}
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">Social Jet Lag Calculator</h3>
        <p className="text-xs text-text-secondary">The difference between your biological and social clock (Roenneberg 2012)</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-text-secondary block mb-1">Weekday wake time</label>
            <input
              type="time"
              value={weekdayWake}
              onChange={(e) => setWeekdayWake(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary"
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">Weekend wake time</label>
            <input
              type="time"
              value={weekendWake}
              onChange={(e) => setWeekendWake(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary"
            />
          </div>
        </div>
        <div className={cn(
          'rounded-xl p-3 text-sm border',
          sjl.severity === 'none' ? 'bg-success/10 border-success/30 text-success' :
          sjl.severity === 'mild' ? 'bg-warning/10 border-warning/30 text-warning' :
          sjl.severity === 'moderate' ? 'bg-warning/10 border-warning/30 text-warning' :
          'bg-error/10 border-error/30 text-error'
        )}>
          <div className="font-semibold mb-0.5">Δ {sjl.deltaHours}h — {sjl.severity.charAt(0).toUpperCase() + sjl.severity.slice(1)}</div>
          <div className="text-xs opacity-90">{sjl.healthNote}</div>
        </div>
      </div>
    </div>
  )
}

function ProfilePill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background border border-border rounded-xl px-3 py-2">
      <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-text-primary mt-0.5">{value}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Schedule Tab
// ---------------------------------------------------------------------------

function ScheduleTab({ initialSettings }: { initialSettings: Settings | null }) {
  const [wakeTime, setWakeTime] = useState(initialSettings?.target_wake_time?.slice(0, 5) ?? '07:00')
  const [chronotype, setChronotype] = useState<ChronoType>(
    (initialSettings?.chronotype as ChronoType) ?? 'intermediate'
  )

  const schedule = useMemo(() => generateSleepSchedule(chronotype, wakeTime), [chronotype, wakeTime])
  const profile = CHRONOTYPE_PROFILES[chronotype]

  // Build 24h timeline entries
  const timelineItems = useMemo(() => {
    const items = [
      { time: schedule.lightExposureTime, label: 'Light exposure', color: '#f59e0b', icon: '☀️' },
      { time: schedule.caffeineLastTime, label: 'Last caffeine', color: '#a78bfa', icon: '☕' },
      { time: schedule.mealLastTime, label: 'Last meal', color: '#34d399', icon: '🍽️' },
      { time: schedule.windDownStart, label: 'Wind-down', color: '#60a5fa', icon: '📵' },
      { time: schedule.bedtime, label: 'Bedtime', color: '#818cf8', icon: '🌙' },
      { time: wakeTime, label: 'Wake time', color: '#fb923c', icon: '⏰' },
    ]
    return items.sort((a, b) => a.time.localeCompare(b.time))
  }, [schedule, wakeTime])

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">Personalise Your Schedule</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-text-secondary block mb-1">Target wake time</label>
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary"
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">Chronotype</label>
            <select
              value={chronotype}
              onChange={(e) => setChronotype(e.target.value as ChronoType)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary"
            >
              {Object.entries(CHRONOTYPE_PROFILES).map(([k, v]) => (
                <option key={k} value={k}>{v.emoji} {v.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Visual timeline */}
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">Daily Anchor Timeline</h3>
        <div className="space-y-2">
          {timelineItems.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div
                className="w-1 h-8 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-sm text-text-primary">{item.label}</span>
                </div>
                <span className="text-sm font-semibold text-text-primary tabular-nums">{fmt12(item.time)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key schedule cards */}
      <div className="grid grid-cols-2 gap-3">
        <ScheduleCard icon="🌙" label="Bedtime" value={fmt12(schedule.bedtime)} subtitle="8h before wake" />
        <ScheduleCard icon="📵" label="Wind-down" value={fmt12(schedule.windDownStart)} subtitle="1h before bed" />
        <ScheduleCard icon="☀️" label="Light exposure" value={fmt12(schedule.lightExposureTime)} subtitle="15 min after wake" />
        <ScheduleCard icon="☕" label="Caffeine cutoff" value={fmt12(schedule.caffeineLastTime)} subtitle={`${profile.label} type`} />
        <ScheduleCard icon="🏃" label="Exercise window" value={profile.exerciseTiming} subtitle="Chronotype-optimised" />
        <ScheduleCard icon="🍽️" label="Last meal" value={fmt12(schedule.mealLastTime)} subtitle="2h before bed" />
      </div>

      {/* Anchor habits */}
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
        <h3 className="text-sm font-semibold text-text-primary">4 Daily Anchor Habits</h3>
        {schedule.anchorHabits.map((habit, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-text-secondary">
            <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
            <span>{habit}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ScheduleCard({ icon, label, value, subtitle }: { icon: string; label: string; value: string; subtitle: string }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-3 space-y-1">
      <div className="flex items-center gap-1.5">
        <span className="text-base">{icon}</span>
        <span className="text-xs text-text-secondary font-medium">{label}</span>
      </div>
      <p className="text-base font-bold text-text-primary">{value}</p>
      <p className="text-[11px] text-text-secondary">{subtitle}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Debt Tab
// ---------------------------------------------------------------------------

function DebtTab({ sleepLogs, initialSettings }: { sleepLogs: SleepLog[]; initialSettings: Settings | null }) {
  const targetH = initialSettings?.sleep_goal_hours ?? 8

  const debt = useMemo(() => calculateSleepDebt(sleepLogs, targetH), [sleepLogs, targetH])

  const chartData = useMemo(() => {
    const last14 = [...sleepLogs].sort((a, b) => a.date.localeCompare(b.date)).slice(-14)
    return last14.map((l) => ({
      date: fmtShortDate(l.date),
      hours: Math.round(l.durationH * 10) / 10,
      target: targetH,
      deficit: Math.max(0, targetH - l.durationH),
    }))
  }, [sleepLogs, targetH])

  const twoProcess = twoProcessModel(
    Math.max(0, 24 - (new Date().getHours() + new Date().getMinutes() / 60)),
    'intermediate'
  )

  if (sleepLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
        <span className="text-5xl">😴</span>
        <h3 className="text-base font-semibold text-text-primary">No sleep data yet</h3>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync Apple Health data or log sleep manually to see your 14-day debt analysis.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Debt summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <DebtCard
          label="14-day debt"
          value={`${debt.totalDebt14d}h`}
          sub={debt.totalDebt14d === 0 ? 'All caught up!' : 'hours behind target'}
          color={debt.totalDebt14d > 5 ? 'text-error' : debt.totalDebt14d > 2 ? 'text-warning' : 'text-success'}
        />
        <DebtCard
          label="Avg duration"
          value={`${debt.avgDuration}h`}
          sub={`Target: ${targetH}h`}
          color={debt.avgDuration >= targetH ? 'text-success' : 'text-warning'}
        />
        <DebtCard
          label="Deficit nights"
          value={`${debt.deficitDays}`}
          sub={`of last ${Math.min(14, sleepLogs.length)} nights`}
          color={debt.deficitDays > 7 ? 'text-error' : 'text-text-primary'}
        />
        <DebtCard
          label="Trend"
          value={debt.trend === 'improving' ? '↑ Improving' : debt.trend === 'worsening' ? '↓ Worsening' : '→ Stable'}
          sub="last 14 days"
          color={debt.trend === 'improving' ? 'text-success' : debt.trend === 'worsening' ? 'text-error' : 'text-text-secondary'}
        />
      </div>

      {/* Bar chart */}
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
        <h3 className="text-sm font-semibold text-text-primary">Nightly Duration (last 14 nights)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #333)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}h`, 'Sleep']} />
            <ReferenceLine y={targetH} stroke="#60a5fa" strokeDasharray="4 4" label={{ value: `${targetH}h target`, fill: '#60a5fa', fontSize: 10 }} />
            <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.hours >= targetH ? '#4ade80' : entry.hours >= targetH - 1 ? '#facc15' : '#f87171'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Payback plan */}
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-info flex-shrink-0" />
          <h3 className="text-sm font-semibold text-text-primary">Recovery Plan</h3>
        </div>
        <p className="text-sm text-text-secondary">{debt.paybackPlan}</p>
        <p className="text-xs text-text-secondary opacity-70">
          Based on Van Dongen et al. 2003 — sleep debt accumulates and cannot be fully reversed by a single long sleep. Maximum ~1h extra per night is recommended.
        </p>
      </div>

      {/* Two-process model */}
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
        <h3 className="text-sm font-semibold text-text-primary">Two-Process Model (Borbély 1982)</h3>
        <p className="text-xs text-text-secondary mb-2">Current sleep drive based on homeostatic (S) and circadian (C) processes</p>
        <div className="space-y-2">
          <ProcessBar label="Process S (sleep pressure)" value={twoProcess.processS} max={10} color="#a78bfa" />
          <ProcessBar label="Process C (circadian alerting)" value={twoProcess.processC} max={10} color="#fb923c" />
          <ProcessBar label="Sleepiness score" value={twoProcess.sleepiness} max={10} color="#60a5fa" />
        </div>
        <p className="text-xs text-text-secondary mt-2">{twoProcess.interpretation}</p>
      </div>
    </div>
  )
}

function DebtCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-3 space-y-1">
      <p className="text-xs text-text-secondary font-medium">{label}</p>
      <p className={cn('text-xl font-bold', color)}>{value}</p>
      <p className="text-[11px] text-text-secondary">{sub}</p>
    </div>
  )
}

function ProcessBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-text-secondary">
        <span>{label}</span>
        <span className="font-semibold">{value}/{max}</span>
      </div>
      <div className="h-2 bg-background rounded-full overflow-hidden border border-border">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${(value / max) * 100}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Optimize Tab (Caffeine + Tips)
// ---------------------------------------------------------------------------

function OptimizeTab({ initialSettings }: { initialSettings: Settings | null }) {
  const [doses, setDoses] = useState<CaffeineDose[]>([
    { timeHour: 7, mgAmount: 100 },
    { timeHour: 13, mgAmount: 80 },
  ])
  const [bedtimeInput, setBedtimeInput] = useState(initialSettings?.target_bed_time?.slice(0, 5) ?? '23:00')
  const [newHour, setNewHour] = useState(9)
  const [newMg, setNewMg] = useState(100)
  const [openTips, setOpenTips] = useState<number[]>([])

  const bedtimeHour = useMemo(() => {
    const [h, m] = bedtimeInput.split(':').map(Number)
    return h + m / 60
  }, [bedtimeInput])

  const curve = useMemo(() => caffeineHourlyCurve(doses), [doses])
  const bedtimeLevel = useMemo(() => caffeineAtBedtime(doses, bedtimeHour), [doses, bedtimeHour])

  const currentHour = new Date().getHours() + new Date().getMinutes() / 60
  const currentLevel = useMemo(() => caffeineModel(doses, currentHour).bloodLevelMg, [doses, currentHour])

  function addDose() {
    setDoses((d) => [...d, { timeHour: newHour, mgAmount: newMg }])
  }

  function removeDose(i: number) {
    setDoses((d) => d.filter((_, idx) => idx !== i))
  }

  function toggleTip(id: number) {
    setOpenTips((t) => t.includes(id) ? t.filter((x) => x !== id) : [...t, id])
  }

  const tipsByCategory = useMemo(() => {
    const map: Record<string, typeof SLEEP_HYGIENE_TIPS> = {}
    for (const tip of SLEEP_HYGIENE_TIPS) {
      if (!map[tip.category]) map[tip.category] = []
      map[tip.category].push(tip)
    }
    return map
  }, [])

  function hourLabel(h: number) {
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}${ampm}`
  }

  return (
    <div className="space-y-4">
      {/* Caffeine dose input */}
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">Caffeine Clearance Calculator</h3>
        <p className="text-xs text-text-secondary">t½ = 5.5h first-order elimination. Enter your doses for the day.</p>

        {/* Existing doses */}
        <div className="space-y-2">
          {doses.map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="text-text-secondary w-14 tabular-nums">{hourLabel(d.timeHour)}</span>
              <span className="text-text-primary font-medium">{d.mgAmount} mg</span>
              <button onClick={() => removeDose(i)} className="ml-auto p-1 text-text-secondary hover:text-error">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add dose */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="text-[11px] text-text-secondary">Time</label>
            <input
              type="number" min={0} max={23} step={1}
              value={newHour}
              onChange={(e) => setNewHour(Number(e.target.value))}
              className="w-full bg-background border border-border rounded-xl px-2 py-1.5 text-sm text-text-primary"
              placeholder="Hour (0–23)"
            />
          </div>
          <div className="flex-1">
            <label className="text-[11px] text-text-secondary">Amount (mg)</label>
            <input
              type="number" min={1} max={1000} step={25}
              value={newMg}
              onChange={(e) => setNewMg(Number(e.target.value))}
              className="w-full bg-background border border-border rounded-xl px-2 py-1.5 text-sm text-text-primary"
              placeholder="mg"
            />
          </div>
          <button
            onClick={addDose}
            className="mt-4 p-2 bg-primary/10 border border-primary/30 text-primary rounded-xl"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="text-[11px] text-text-secondary">Bedtime</label>
          <input
            type="time"
            value={bedtimeInput}
            onChange={(e) => setBedtimeInput(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-sm text-text-primary mt-1"
          />
        </div>
      </div>

      {/* Current level + bedtime warning */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface border border-border rounded-2xl p-3 space-y-1">
          <p className="text-xs text-text-secondary">Current blood level</p>
          <p className="text-xl font-bold text-text-primary">{currentLevel.toFixed(0)} mg</p>
          <p className="text-[11px] text-text-secondary">right now</p>
        </div>
        <div className={cn(
          'rounded-2xl p-3 space-y-1 border',
          bedtimeLevel.disruptionWarning
            ? 'bg-error/10 border-error/30'
            : 'bg-surface border-border'
        )}>
          <p className="text-xs text-text-secondary">At bedtime ({fmt12(bedtimeInput)})</p>
          <p className={cn('text-xl font-bold', bedtimeLevel.disruptionWarning ? 'text-error' : 'text-success')}>
            {bedtimeLevel.levelMg.toFixed(0)} mg
          </p>
          {bedtimeLevel.disruptionWarning && (
            <AlertTriangle className="w-3.5 h-3.5 text-error" />
          )}
        </div>
      </div>

      {bedtimeLevel.disruptionWarning && (
        <div className="flex items-start gap-2 bg-error/10 border border-error/30 rounded-2xl p-3 text-sm text-error">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{bedtimeLevel.message}</span>
        </div>
      )}

      {/* 24h caffeine curve */}
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
        <h3 className="text-sm font-semibold text-text-primary">24-hour Caffeine Curve</h3>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={curve} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #333)" vertical={false} />
            <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} tickFormatter={hourLabel} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(0)} mg`, 'Caffeine']} labelFormatter={hourLabel} />
            <ReferenceLine y={25} stroke="#f87171" strokeDasharray="4 4" label={{ value: '25mg threshold', fill: '#f87171', fontSize: 9 }} />
            <ReferenceLine x={Math.round(bedtimeHour)} stroke="#818cf8" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="level" stroke="#a78bfa" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-[11px] text-text-secondary">Purple dashed line = bedtime. Red dashed = 25 mg disruption threshold.</p>
      </div>

      {/* Temperature guide */}
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
        <h3 className="text-sm font-semibold text-text-primary">Temperature Optimisation</h3>
        <div className="space-y-2 text-sm text-text-secondary">
          <div className="flex items-start gap-2">
            <span className="text-base">🛁</span>
            <div>
              <p className="text-text-primary font-medium">Warm bath/shower: 1–2h before bed</p>
              <p className="text-xs">104–109°F for ≥10 min. Peripheral vasodilation accelerates core temp drop, shortening sleep onset by ~10 min (Haghayegh 2019).</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-base">🌡️</span>
            <div>
              <p className="text-text-primary font-medium">Bedroom: 65–68°F (18–20°C)</p>
              <p className="text-xs">Core body temp must drop ~1–2°F to initiate sleep. A cool room is more important than warm bedding.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-base">🧊</span>
            <div>
              <p className="text-text-primary font-medium">Cold exposure in morning</p>
              <p className="text-xs">Cold shower or cool water on face upon waking boosts norepinephrine and cortisol, anchoring your circadian clock.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-base">🧦</span>
            <div>
              <p className="text-text-primary font-medium">Warm socks or foot warming</p>
              <p className="text-xs">Warming feet 30 min before bed promotes vasodilation and drops core temp more efficiently (Kräuchi et al. 1999).</p>
            </div>
          </div>
        </div>
      </div>

      {/* Light therapy */}
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
        <h3 className="text-sm font-semibold text-text-primary">Light Therapy Timing</h3>
        <div className="space-y-2 text-sm text-text-secondary">
          <div className="flex items-start gap-2">
            <span className="text-base">☀️</span>
            <div>
              <p className="text-text-primary font-medium">Morning: within 30–60 min of waking</p>
              <p className="text-xs">10,000 lux box or outdoor light for 10+ min — sets circadian phase, raises cortisol, and improves alertness. Most important habit.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-base">🌅</span>
            <div>
              <p className="text-text-primary font-medium">Sunset viewing (optional)</p>
              <p className="text-xs">Low-angle orange light in the evening signals the circadian clock that night is approaching, reducing light-sensitivity of melatonin suppression.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-base">🔆</span>
            <div>
              <p className="text-text-primary font-medium">Dim indoors 2h before bed</p>
              <p className="text-xs">&lt;10 lux in the bedroom — bright overhead lights after 9pm delay melatonin onset by 1–3h (Gooley et al. 2011).</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sleep hygiene tips accordion */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-text-primary">20 Evidence-Graded Sleep Tips</h3>
          <p className="text-xs text-text-secondary">A = RCT/meta-analysis · B = observational · C = expert consensus</p>
        </div>
        {Object.entries(tipsByCategory).map(([category, tips]) => (
          <div key={category} className="border-b border-border last:border-0">
            <div className="px-4 py-2 bg-background">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{category}</span>
            </div>
            {tips.map((tip) => (
              <div key={tip.id} className="border-t border-border/50 first:border-0">
                <button
                  onClick={() => toggleTip(tip.id)}
                  className="w-full px-4 py-3 flex items-start gap-2 text-left hover:bg-background transition-colors"
                >
                  <span className={cn(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 mt-0.5',
                    tip.evidenceGrade === 'A' ? 'bg-success/20 text-success' :
                    tip.evidenceGrade === 'B' ? 'bg-warning/20 text-warning' :
                    'bg-info/20 text-info'
                  )}>
                    {tip.evidenceGrade}
                  </span>
                  <span className="flex-1 text-sm text-text-primary line-clamp-2">{tip.tip.split('—')[0].trim()}</span>
                  {openTips.includes(tip.id)
                    ? <ChevronUp className="w-4 h-4 text-text-secondary flex-shrink-0 mt-0.5" />
                    : <ChevronDown className="w-4 h-4 text-text-secondary flex-shrink-0 mt-0.5" />
                  }
                </button>
                {openTips.includes(tip.id) && (
                  <div className="px-4 pb-3 space-y-1">
                    <p className="text-sm text-text-secondary">{tip.tip}</p>
                    <p className="text-[11px] text-text-secondary opacity-60">📚 {tip.citation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SleepOptimizerClient({ initialSettings, initialSleepLogs, isAuthenticated }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('chronotype')
  const [settings, setSettings] = useState<Settings | null>(initialSettings)

  const saveSettings = useCallback(async (updates: Partial<Settings>) => {
    if (!isAuthenticated) return
    try {
      const res = await fetch('/api/sleep-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        const { data } = await res.json()
        setSettings((prev) => ({ ...prev, ...data }))
      }
    } catch {}
  }, [isAuthenticated])

  return (
    <div className="space-y-4">
      {!isAuthenticated && (
        <div className="bg-warning/10 border border-warning/30 rounded-2xl px-4 py-3 text-sm text-warning flex items-center gap-2">
          <Info className="w-4 h-4 flex-shrink-0" />
          Sign in to save your chronotype and sync sleep data.
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 bg-surface border border-border rounded-2xl p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl text-[11px] font-medium transition-colors',
              activeTab === id
                ? 'bg-background text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'chronotype' && (
        <ChronotypeTab initialSettings={settings} onSave={saveSettings} />
      )}
      {activeTab === 'schedule' && (
        <ScheduleTab initialSettings={settings} />
      )}
      {activeTab === 'debt' && (
        <DebtTab sleepLogs={initialSleepLogs} initialSettings={settings} />
      )}
      {activeTab === 'optimize' && (
        <OptimizeTab initialSettings={settings} />
      )}
    </div>
  )
}
