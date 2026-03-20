'use client'

import Link from 'next/link'
import { ArrowLeft, Stethoscope, AlertTriangle } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity = 'mild' | 'moderate' | 'severe'

interface SymptomEvent {
  id: string
  date: string // YYYY-MM-DD
  symptom: string
  severity: Severity
  emoji: string
}

// ─── Mock data — ~18 events over the last 30 days ─────────────────────────────
// Reference date: 2026-03-19

const MOCK_EVENTS: SymptomEvent[] = [
  { id: '1',  date: '2026-02-18', symptom: 'Fatigue',             severity: 'mild',     emoji: '😴' },
  { id: '2',  date: '2026-02-20', symptom: 'Headache',            severity: 'mild',     emoji: '🤕' },
  { id: '3',  date: '2026-02-21', symptom: 'Nausea',              severity: 'mild',     emoji: '🤢' },
  { id: '4',  date: '2026-02-23', symptom: 'Fatigue',             severity: 'moderate', emoji: '😴' },
  { id: '5',  date: '2026-02-24', symptom: 'Body Ache',           severity: 'moderate', emoji: '💪' },
  { id: '6',  date: '2026-02-25', symptom: 'Headache',            severity: 'mild',     emoji: '🤕' },
  { id: '7',  date: '2026-02-26', symptom: 'Fatigue',             severity: 'mild',     emoji: '😴' },
  { id: '8',  date: '2026-02-28', symptom: 'Nausea',              severity: 'mild',     emoji: '🤢' },
  { id: '9',  date: '2026-03-01', symptom: 'Body Ache',           severity: 'moderate', emoji: '💪' },
  { id: '10', date: '2026-03-03', symptom: 'Fatigue',             severity: 'moderate', emoji: '😴' },
  { id: '11', date: '2026-03-04', symptom: 'Headache',            severity: 'mild',     emoji: '🤕' },
  { id: '12', date: '2026-03-05', symptom: 'Shortness of Breath', severity: 'mild',     emoji: '😮‍💨' },
  { id: '13', date: '2026-03-07', symptom: 'Fatigue',             severity: 'mild',     emoji: '😴' },
  { id: '14', date: '2026-03-09', symptom: 'Nausea',              severity: 'mild',     emoji: '🤢' },
  { id: '15', date: '2026-03-10', symptom: 'Body Ache',           severity: 'moderate', emoji: '💪' },
  { id: '16', date: '2026-03-12', symptom: 'Fatigue',             severity: 'mild',     emoji: '😴' },
  { id: '17', date: '2026-03-14', symptom: 'Rapid Heartbeat',     severity: 'mild',     emoji: '💓' },
  { id: '18', date: '2026-03-16', symptom: 'Headache',            severity: 'mild',     emoji: '🤕' },
]

// Symptoms that warrant the urgent warning banner
const URGENT_SYMPTOMS = new Set(['Shortness of Breath', 'Chest Pain/Tightness', 'Rapid Heartbeat'])

// Color palette per symptom type
const SYMPTOM_COLORS: Record<string, string> = {
  'Fatigue':             '#f97316',
  'Headache':            '#8b5cf6',
  'Body Ache':           '#3b82f6',
  'Shortness of Breath': '#ef4444',
  'Dizziness':           '#eab308',
  'Chest Pain/Tightness':'#dc2626',
  'Rapid Heartbeat':     '#ec4899',
  'Nausea':              '#22c55e',
  'Coughing':            '#14b8a6',
  'Vomiting':            '#6366f1',
}

// ─── Severity helpers ─────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<Severity, {
  label: string
  bgClass: string
  textClass: string
  borderClass: string
  calendarColor: string
}> = {
  mild: {
    label: 'Mild',
    bgClass: 'bg-yellow-100 dark:bg-yellow-950/40',
    textClass: 'text-yellow-700 dark:text-yellow-400',
    borderClass: 'border-yellow-200 dark:border-yellow-900/50',
    calendarColor: '#eab308',
  },
  moderate: {
    label: 'Moderate',
    bgClass: 'bg-orange-100 dark:bg-orange-950/40',
    textClass: 'text-orange-700 dark:text-orange-400',
    borderClass: 'border-orange-200 dark:border-orange-900/50',
    calendarColor: '#f97316',
  },
  severe: {
    label: 'Severe',
    bgClass: 'bg-red-100 dark:bg-red-950/40',
    textClass: 'text-red-700 dark:text-red-400',
    borderClass: 'border-red-200 dark:border-red-900/50',
    calendarColor: '#ef4444',
  },
}

// ─── Derived stats ────────────────────────────────────────────────────────────

function buildStats(events: SymptomEvent[]) {
  const totalEvents = events.length
  const daysWithSymptoms = new Set(events.map((e) => e.date)).size
  const severeCnt = events.filter((e) => e.severity === 'severe').length
  const mildCnt = events.filter((e) => e.severity === 'mild').length
  const moderateCnt = events.filter((e) => e.severity === 'moderate').length

  // Frequency by symptom type
  const freqMap: Record<string, number> = {}
  for (const e of events) {
    freqMap[e.symptom] = (freqMap[e.symptom] ?? 0) + 1
  }
  const sortedByFreq = Object.entries(freqMap).sort(([, a], [, b]) => b - a)
  const mostCommon = sortedByFreq[0]?.[0] ?? '—'

  const freqChartData = sortedByFreq.map(([symptom, count]) => ({
    symptom,
    count,
    color: SYMPTOM_COLORS[symptom] ?? '#6b7280',
  }))

  // Urgent check
  const hasUrgent = events.some((e) => URGENT_SYMPTOMS.has(e.symptom))

  return {
    totalEvents,
    daysWithSymptoms,
    severeCnt,
    mildCnt,
    moderateCnt,
    mostCommon,
    freqChartData,
    hasUrgent,
  }
}

// Build 30-day calendar data
// Reference: last 30 days ending 2026-03-19
function buildCalendarData(events: SymptomEvent[]): { date: string; color: string; severity: Severity | null }[] {
  // worst severity per day
  const worstByDay: Record<string, Severity> = {}
  for (const e of events) {
    const existing = worstByDay[e.date]
    if (!existing) {
      worstByDay[e.date] = e.severity
    } else {
      const order: Severity[] = ['mild', 'moderate', 'severe']
      if (order.indexOf(e.severity) > order.indexOf(existing)) {
        worstByDay[e.date] = e.severity
      }
    }
  }

  const today = new Date('2026-03-19')
  const cells: { date: string; color: string; severity: Severity | null }[] = []

  // 30 days: 6 rows × 5 cols
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const severity = worstByDay[dateStr] ?? null
    const color = severity ? SEVERITY_CONFIG[severity].calendarColor : '#374151'
    cells.push({ date: dateStr, color, severity })
  }

  return cells
}

// ─── Tooltip style ────────────────────────────────────────────────────────────

const tooltipStyle = {
  background: 'var(--color-surface, #1f2937)',
  border: '1px solid var(--color-border, #374151)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: Severity }) {
  const cfg = SEVERITY_CONFIG[severity]
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bgClass} ${cfg.textClass}`}
    >
      {cfg.label}
    </span>
  )
}

function ScienceCard() {
  return (
    <div className="bg-teal-50 dark:bg-teal-950/30 rounded-2xl border border-teal-200 dark:border-teal-900/50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-teal-500/20 flex items-center justify-center shrink-0">
          <span className="text-sm">🔬</span>
        </div>
        <h2 className="font-semibold text-teal-800 dark:text-teal-300 text-sm">Health Insights</h2>
      </div>

      <div className="space-y-3 text-sm text-teal-900 dark:text-teal-200 leading-relaxed">
        <div>
          <p className="font-medium text-teal-800 dark:text-teal-300 mb-0.5">
            Exercise-induced symptoms — normal vs. concerning
          </p>
          <p className="text-xs text-teal-700 dark:text-teal-400">
            Muscle soreness and mild fatigue 24–48 h post-exercise are expected. Symptoms that worsen
            with activity — especially chest tightness or dizziness — warrant a rest day and medical
            evaluation if they persist.
          </p>
        </div>

        <div>
          <p className="font-medium text-teal-800 dark:text-teal-300 mb-0.5">
            Fatigue & HRV connection
          </p>
          <p className="text-xs text-teal-700 dark:text-teal-400">
            HRV typically drops 10–20% in the 24 h before illness symptoms peak. Tracking both together
            can help you catch early signs of overtraining or infection.
          </p>
        </div>

        <div>
          <p className="font-medium text-teal-800 dark:text-teal-300 mb-0.5">
            Headache & hydration
          </p>
          <p className="text-xs text-teal-700 dark:text-teal-400">
            Dehydration is a leading trigger of exercise headaches. Aim for ~500 ml before a workout
            and ~200 ml every 20 minutes during sustained activity.
          </p>
        </div>

        <div>
          <p className="font-medium text-teal-800 dark:text-teal-300 mb-0.5">
            Symptom–HRV correlation
          </p>
          <p className="text-xs text-teal-700 dark:text-teal-400">
            Research shows subjective symptoms often precede measurable HRV drops by 24–48 h. Logging
            symptoms consistently improves the accuracy of AI-powered recovery insights.
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-teal-200 dark:border-teal-900/50 flex gap-2 items-start">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-teal-700 dark:text-teal-400 leading-relaxed">
          <strong className="text-teal-800 dark:text-teal-300">Wellness only.</strong> KQuarks is not a
          medical device. Any chest pain, pressure, or sudden shortness of breath warrants immediate
          medical attention — call emergency services if in doubt.
        </p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SymptomsPage() {
  const events = MOCK_EVENTS
  const stats = buildStats(events)
  const calendarCells = buildCalendarData(events)

  // Most recent 15 entries
  const recentLog = [...events].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Symptoms Log</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Last 30 days · Apple Health data</p>
          </div>
          <Stethoscope className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-24">

        {/* ── 1. Hero summary card ────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-4">
            Summary · 30 days
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Total events */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 flex flex-col gap-1">
              <p className="text-xs text-gray-400 dark:text-gray-500">Total Events</p>
              <p className="text-3xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
                {stats.totalEvents}
              </p>
            </div>

            {/* Days with symptoms */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 flex flex-col gap-1">
              <p className="text-xs text-gray-400 dark:text-gray-500">Days w/ Symptoms</p>
              <p className="text-3xl font-bold tabular-nums text-orange-500">
                {stats.daysWithSymptoms}
              </p>
            </div>

            {/* Most common */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 flex flex-col gap-1">
              <p className="text-xs text-gray-400 dark:text-gray-500">Most Common</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight mt-1">
                {stats.mostCommon}
              </p>
            </div>

            {/* Severe events */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 flex flex-col gap-1">
              <p className="text-xs text-gray-400 dark:text-gray-500">Severe Events</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-3xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
                  {stats.severeCnt}
                </p>
                {stats.severeCnt > 0 && (
                  <span className="shrink-0 px-1.5 py-0.5 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400">
                    ⚠
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. Symptom frequency bar chart ──────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5">Symptom Frequency</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Events per symptom type — last 30 days</p>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={stats.freqChartData}
              layout="vertical"
              margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                strokeOpacity={0.07}
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: 'currentColor' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="symptom"
                tick={{ fontSize: 10, fill: 'currentColor' }}
                tickLine={false}
                axisLine={false}
                width={110}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [v, 'Events']}
                cursor={{ fill: 'currentColor', opacity: 0.04 }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
                {stats.freqChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── 3. Severity breakdown ────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Severity Breakdown</h2>
          <div className="flex flex-wrap gap-3">
            {(
              [
                { key: 'mild',     count: stats.mildCnt,     desc: 'Mild symptoms' },
                { key: 'moderate', count: stats.moderateCnt, desc: 'Moderate symptoms' },
                { key: 'severe',   count: stats.severeCnt,   desc: 'Severe symptoms' },
              ] as { key: Severity; count: number; desc: string }[]
            ).map(({ key, count, desc }) => {
              const cfg = SEVERITY_CONFIG[key]
              return (
                <div
                  key={key}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${cfg.bgClass} ${cfg.borderClass}`}
                >
                  <span className={`text-2xl font-bold tabular-nums ${cfg.textClass}`}>{count}</span>
                  <span className={`text-xs font-medium ${cfg.textClass}`}>{desc}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── 4. Urgent warning banner ─────────────────────────────────────────── */}
        {stats.hasUrgent && (
          <div className="bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-900/50 p-4 flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-0.5">
                Concerning symptoms were logged
              </p>
              <p className="text-xs text-red-600 dark:text-red-500 leading-relaxed">
                Shortness of breath, chest pain/tightness, or rapid heartbeat was recorded in this
                period. If these symptoms are ongoing or severe, please seek medical evaluation
                promptly.
              </p>
            </div>
          </div>
        )}

        {/* ── 5. 30-day symptom calendar ──────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">30-Day Calendar</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            Each cell = one day, colored by worst severity logged
          </p>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
            <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="w-3 h-3 rounded-sm inline-block bg-gray-300 dark:bg-gray-700" />
              No symptoms
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="w-3 h-3 rounded-sm inline-block bg-yellow-400" />
              Mild
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="w-3 h-3 rounded-sm inline-block bg-orange-500" />
              Moderate
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="w-3 h-3 rounded-sm inline-block bg-red-500" />
              Severe
            </span>
          </div>

          {/* 6×5 grid */}
          <div className="grid grid-cols-6 gap-1.5">
            {calendarCells.map((cell) => {
              const d = new Date(cell.date + 'T12:00:00')
              const dayLabel = d.getDate()
              const monthLabel = d.toLocaleDateString('en-US', { month: 'short' })
              const showMonth = d.getDate() === 1

              return (
                <div
                  key={cell.date}
                  title={`${cell.date}${cell.severity ? ` — ${SEVERITY_CONFIG[cell.severity].label}` : ' — No symptoms'}`}
                  className="relative aspect-square rounded-md flex flex-col items-center justify-center cursor-default"
                  style={{ backgroundColor: cell.severity ? cell.color : undefined }}
                  data-no-color={!cell.severity || undefined}
                >
                  {/* Use Tailwind bg for empty days so dark mode works */}
                  {!cell.severity && (
                    <div className="absolute inset-0 rounded-md bg-gray-200 dark:bg-gray-800" />
                  )}
                  <span
                    className="relative z-10 text-[10px] font-semibold leading-none"
                    style={{ color: cell.severity ? 'white' : undefined }}
                    data-no-color={!cell.severity || undefined}
                  >
                    <span
                      className={
                        cell.severity
                          ? 'text-white'
                          : 'text-gray-500 dark:text-gray-400'
                      }
                    >
                      {showMonth ? monthLabel : dayLabel}
                    </span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── 6. Recent symptom log table ──────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Recent Log</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">Last {recentLog.length} entries</p>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[auto_1fr_auto] gap-3 px-4 py-2 border-b border-gray-100 dark:border-gray-800">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              Date
            </p>
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              Symptom
            </p>
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide text-right">
              Severity
            </p>
          </div>

          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentLog.map((entry) => {
              const d = new Date(entry.date + 'T12:00:00')
              const dateStr = d.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })
              return (
                <li
                  key={entry.id}
                  className="grid grid-cols-[auto_1fr_auto] gap-3 px-4 py-3 items-center hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                >
                  <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums whitespace-nowrap">
                    {dateStr}
                  </span>
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="text-base leading-none">{entry.emoji}</span>
                    <span className="text-sm text-gray-900 dark:text-gray-100 truncate font-medium">
                      {entry.symptom}
                    </span>
                  </span>
                  <SeverityBadge severity={entry.severity} />
                </li>
              )
            })}
          </ul>
        </div>

        {/* ── 7. Science card ──────────────────────────────────────────────────── */}
        <ScienceCard />

      </main>
    </div>
  )
}
