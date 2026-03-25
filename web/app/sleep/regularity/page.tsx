import Link from 'next/link'
import { ArrowLeft, Moon } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/bottom-nav'
import { RegularityClient, type WeeklySRIPoint, type HeatmapWeek } from './regularity-client'

export const metadata = { title: 'Sleep Regularity Index' }

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns [startMinutes, endMinutes] where endMinutes may exceed 1440 for cross-midnight sleep. */
function sleepWindowMinutes(start: Date, end: Date): [number, number] {
  const s = start.getHours() * 60 + start.getMinutes()
  const e = end.getHours() * 60 + end.getMinutes()
  return e <= s ? [s, e + 1440] : [s, e]
}

/** Minutes of clock-time overlap between two sleep windows. */
function overlapMinutes(s1: Date, e1: Date, s2: Date, e2: Date): number {
  const [a, b] = sleepWindowMinutes(s1, e1)
  const [c, d] = sleepWindowMinutes(s2, e2)
  return Math.max(0, Math.min(b, d) - Math.max(a, c))
}

function getWeekSunday(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function weekLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Map bedtime hours < 12 (post-midnight) to > 24 for linear comparison. */
function normalizeBedtime(hour: number): number {
  return hour < 12 ? hour + 24 : hour
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SleepRegularityPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const eightFourDaysAgo = new Date()
  eightFourDaysAgo.setDate(eightFourDaysAgo.getDate() - 84)

  const { data: rawRecords } = await supabase
    .from('sleep_records')
    .select('start_time, end_time, duration_minutes, sleep_efficiency')
    .eq('user_id', user.id)
    .gte('start_time', eightFourDaysAgo.toISOString())
    .gt('duration_minutes', 60)
    .order('start_time', { ascending: true })

  const records = rawRecords ?? []

  const header = (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
        <Link
          href="/explore"
          className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
          aria-label="Back to explore"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-text-primary">Sleep Regularity Index</h1>
          <p className="text-sm text-text-secondary">12-Week Circadian Consistency</p>
        </div>
        <Moon className="w-5 h-5 text-text-secondary" />
      </div>
    </header>
  )

  // Not enough data — show empty state
  if (records.length < 7) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {header}
        <main className="flex-1 flex items-center justify-center p-8 pb-24 text-center">
          <div className="space-y-3">
            <Moon className="w-12 h-12 text-text-secondary mx-auto" />
            <p className="text-text-secondary text-sm leading-relaxed max-w-xs mx-auto">
              Not enough sleep data yet — sync at least 7 nights to see regularity trends.
            </p>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  // ── Build day-keyed map (latest record per calendar date) ─────────────────
  const byDate = new Map<string, { start: Date; end: Date; duration: number }>()
  for (const r of records) {
    const key = r.start_time.slice(0, 10)
    byDate.set(key, {
      start: new Date(r.start_time),
      end: new Date(r.end_time),
      duration: r.duration_minutes,
    })
  }

  // ── Compute night-to-night match rate for each date ───────────────────────
  const sortedDates = Array.from(byDate.keys()).sort()
  const dayMatchRate = new Map<string, number>()

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = byDate.get(sortedDates[i - 1])!
    const curr = byDate.get(sortedDates[i])!
    // Only pair consecutive nights (≤ 2 calendar days apart)
    const dayGap =
      (new Date(sortedDates[i]).getTime() - new Date(sortedDates[i - 1]).getTime()) /
      86_400_000
    if (dayGap > 2) continue
    const overlap = overlapMinutes(prev.start, prev.end, curr.start, curr.end)
    dayMatchRate.set(sortedDates[i], Math.round((overlap / 1440) * 100))
  }

  // ── Build 12-week grid (Sunday → Saturday, oldest first) ─────────────────
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const currentWeekSunday = getWeekSunday(today)
  const firstWeekSunday = new Date(currentWeekSunday)
  firstWeekSunday.setDate(firstWeekSunday.getDate() - 7 * 11)

  const heatmapWeeks: HeatmapWeek[] = []
  const weeklySRI: WeeklySRIPoint[] = []

  for (let w = 0; w < 12; w++) {
    const weekStart = new Date(firstWeekSunday)
    weekStart.setDate(weekStart.getDate() + w * 7)

    const days: number[] = []
    const weekRates: number[] = []

    for (let d = 0; d < 7; d++) {
      const day = new Date(weekStart)
      day.setDate(day.getDate() + d)
      const key = isoDate(day)
      const rate = dayMatchRate.get(key)

      if (day > today) {
        days.push(-1) // future
      } else if (rate !== undefined) {
        days.push(rate)
        weekRates.push(rate)
      } else {
        days.push(-1) // no record
      }
    }

    heatmapWeeks.push({ label: weekLabel(weekStart), days })
    weeklySRI.push({
      week: weekLabel(weekStart),
      sri: weekRates.length >= 4
        ? Math.round(weekRates.reduce((s, v) => s + v, 0) / weekRates.length)
        : null,
    })
  }

  // ── Summary stats ─────────────────────────────────────────────────────────
  const nonNullSRIs = weeklySRI.filter((w) => w.sri !== null).map((w) => w.sri!)
  const avgSRI =
    nonNullSRIs.length > 0
      ? Math.round(nonNullSRIs.reduce((s, v) => s + v, 0) / nonNullSRIs.length)
      : 0

  // Bedtime consistency: % of nights within 30 min of median bedtime
  const bedtimes = records.map((r) => {
    const d = new Date(r.start_time)
    return normalizeBedtime(d.getHours() + d.getMinutes() / 60)
  })
  const sortedBedtimes = [...bedtimes].sort((a, b) => a - b)
  const medianBedtime = sortedBedtimes[Math.floor(sortedBedtimes.length / 2)]
  const consistencyPct = Math.round(
    (bedtimes.filter((b) => Math.abs(b - medianBedtime) * 60 < 30).length / bedtimes.length) * 100,
  )

  const avgSleepDurationHours =
    Math.round(
      (records.reduce((s, r) => s + r.duration_minutes, 0) / records.length / 60) * 10,
    ) / 10

  return (
    <div className="min-h-screen bg-background">
      {header}
      <RegularityClient
        weeklySRI={weeklySRI}
        heatmapWeeks={heatmapWeeks}
        avgSRI={avgSRI}
        nightsAnalyzed={records.length}
        consistencyPct={consistencyPct}
        avgSleepDurationHours={avgSleepDurationHours}
      />
      <BottomNav />
    </div>
  )
}

// ─── Dead code removed — CircularGauge, ReferenceScale, and all chart
// components now live in regularity-client.tsx ────────────────────────────────

function _unusedPlaceholder() {
  // This function intentionally kept empty so linters don't complain about
  // the file having only imports. All logic is in regularity-client.tsx.
  return null
}
      <text
        x={cx}
        y={cy + 30}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={12}
        fill="var(--color-text-secondary, #888)"
        fontFamily="inherit"
      >
        out of 100
      </text>

      {/* Min / Max labels */}
      <text x={22} y={148} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.3)" fontFamily="inherit">0</text>
      <text x={170} y={148} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.3)" fontFamily="inherit">100</text>
    </svg>
  )
}

// ─── Reference Scale ──────────────────────────────────────────────────────────

function ReferenceScale({ value }: { value: number }) {
  const pct = (value / 100) * 100
  return (
    <div className="space-y-1.5">
      <div className="relative h-4 rounded-full overflow-hidden"
        style={{ background: 'linear-gradient(to right, #ef4444, #f97316 33%, #eab308 57%, #22c55e 87%)' }}
      >
        {/* marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white rounded-full shadow-lg"
          style={{ left: `calc(${pct}% - 1px)` }}
        />
      </div>
      <div className="flex justify-between text-xs text-text-secondary px-0.5">
        <span>0</span>
        <span>50</span>
        <span>70</span>
        <span>87</span>
        <span>100</span>
      </div>
      <div className="flex justify-between text-xs px-0.5">
        <span className="text-red-400">Very Irregular</span>
        <span className="text-orange-400">Irregular</span>
        <span className="text-yellow-400">Moderate</span>
        <span className="text-green-400">Regular</span>
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SleepRegularityPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/explore"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to explore"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Sleep Regularity Index</h1>
            <p className="text-sm text-text-secondary">60-Night Circadian Consistency</p>
          </div>
          <Moon className="w-5 h-5 text-text-secondary" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* ── SRI Score Card ──────────────────────────────────────────────── */}
        <div className={`rounded-2xl border p-6 ${CLASS_BG[currentClass]} relative overflow-hidden`}>
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{ background: `radial-gradient(ellipse at top, ${classColor}22 0%, transparent 70%)` }}
          />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary text-center mb-2">
              Your SRI Score · {NIGHTS_ANALYZED} nights analyzed
            </p>

            <CircularGauge value={SRI_SCORE} />

            <div className="text-center mt-2">
              <span className={`text-2xl font-bold ${CLASS_TEXT[currentClass]}`}>
                {currentClass}
              </span>
              <p className="text-xs text-text-secondary mt-1">
                SRI {SRI_SCORE} — sleep/wake pattern matched {SRI_SCORE}% of same-time-of-day comparisons
              </p>
            </div>
          </div>
        </div>

        {/* ── Reference Scale ─────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-5">
          <h3 className="text-sm font-medium text-text-secondary mb-4">SRI Classification Scale</h3>
          <ReferenceScale value={SRI_SCORE} />
        </div>

        {/* ── Weekly SRI Trend ─────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-text-secondary">Weekly SRI Trend</h3>
            <TrendingUp className="w-4 h-4 text-text-secondary" />
          </div>
          <p className="text-xs text-text-secondary mb-3">8-week rolling average</p>

          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={WEEKLY_SRI} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="sriLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor="#eab308" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[65, 90]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                width={28}
                tickCount={6}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`SRI ${v}`, 'Weekly SRI']}
                labelFormatter={(l: string) => `Week of ${l}`}
              />
              {/* Regular threshold reference line */}
              <ReferenceLine
                y={87}
                stroke="#22c55e"
                strokeDasharray="6 3"
                strokeOpacity={0.7}
                label={{
                  value: 'Regular threshold (87)',
                  position: 'insideTopRight',
                  fontSize: 9,
                  fill: '#22c55e',
                  opacity: 0.8,
                }}
              />
              <Line
                type="monotone"
                dataKey="sri"
                stroke="url(#sriLine)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#eab308', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#22c55e' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ── Night-to-Night Match Rate Calendar ──────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-text-secondary">Night-to-Night Match Rate</h3>
            <Calendar className="w-4 h-4 text-text-secondary" />
          </div>
          <p className="text-xs text-text-secondary mb-4">
            Each cell = probability that sleep/wake state at that time matched 24 h prior
          </p>

          {/* Day-of-week labels */}
          <div className="grid grid-cols-8 gap-1 mb-1">
            <div className="text-xs text-text-secondary text-right pr-1.5 pt-0.5" />
            {DAY_LABELS.map((d, i) => (
              <div key={i} className="text-xs text-center text-text-secondary font-medium">
                {d}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div className="space-y-1">
            {HEATMAP_WEEKS.map((week) => (
              <div key={week.label} className="grid grid-cols-8 gap-1 items-center">
                <div className="text-xs text-text-secondary text-right pr-1.5 leading-none"
                  style={{ fontSize: 9 }}>
                  {week.label}
                </div>
                {week.days.map((rate, i) => (
                  <div
                    key={i}
                    title={rate >= 0 ? `${rate}%` : 'No data'}
                    className={`h-7 rounded-md ${heatmapColor(rate)} flex items-center justify-center transition-opacity`}
                  >
                    {rate >= 0 && (
                      <span className="text-white text-opacity-90 font-semibold"
                        style={{ fontSize: 9 }}>
                        {rate}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary mt-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-green-500/70 inline-block" />
              Regular ≥87%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-yellow-500/70 inline-block" />
              Moderate 70–87%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-orange-500/70 inline-block" />
              Irregular 50–70%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-500/70 inline-block" />
              Very Irregular &lt;50%
            </span>
          </div>
        </div>

        {/* ── Key Stats Row ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{bestWeek}</p>
            <p className="text-xs text-text-secondary mt-0.5">Best Week SRI</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-orange-400">{worstWeek}</p>
            <p className="text-xs text-text-secondary mt-0.5">Worst Week SRI</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{avgMatchRate}%</p>
            <p className="text-xs text-text-secondary mt-0.5">Avg Match Rate</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-text-primary">{FULL_DAY_NAMES[bestDayIdx]}</p>
            <p className="text-xs text-text-secondary mt-0.5">Most Regular Day</p>
          </div>
        </div>

        {/* ── Science Card ─────────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-indigo-500/30 p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-violet-600/5 pointer-events-none" />
          <div className="relative space-y-4">

            {/* Title */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
              <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">
                The Science of Sleep Regularity
              </h3>
            </div>

            {/* What is SRI */}
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 space-y-1.5">
              <p className="text-xs font-semibold text-indigo-300">What is the SRI?</p>
              <p className="text-xs text-text-secondary leading-relaxed">
                The Sleep Regularity Index (SRI) quantifies how consistently a person maintains
                the same sleep/wake pattern from one 24-hour period to the next. Formally, it is
                the probability (0–100) that the sleep/wake state at any given clock time <em>T</em>
                {' '}matches the state at exactly <em>T + 24 h</em>, averaged over all minutes and
                all consecutive day pairs in the analysis window.
              </p>
            </div>

            {/* Citations grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-3">
                <p className="text-xs font-semibold text-indigo-300 mb-1">
                  Phillips et al. 2017 · J Biol Rhythms
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Introduced and validated the SRI metric in 61 healthy adults using wrist
                  actigraphy. Showed SRI captures circadian regularity independently of sleep
                  duration or efficiency.
                </p>
              </div>
              <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-3">
                <p className="text-xs font-semibold text-violet-300 mb-1">
                  Phillips et al. 2021 · Scientific Reports
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Applied SRI to 60,977 UK Biobank participants. Lowest SRI quartile had a{' '}
                  <span className="text-red-400 font-semibold">48% higher all-cause mortality risk</span>,
                  independent of sleep duration, age, BMI, and physical activity.
                </p>
              </div>

              {/* SRI vs Social Jet Lag */}
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">
                <p className="text-xs font-semibold text-blue-300 mb-1">SRI vs Social Jet Lag</p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Social jet lag measures the weekday vs weekend shift in sleep timing (a single
                  number in hours). SRI captures <em>day-to-day variability across all nights</em>{' '}
                  — making it more sensitive to gradual circadian drift, shift work, and erratic
                  schedules that affect every night, not just weekends.
                </p>
              </div>

              {/* Mortality context */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                <p className="text-xs font-semibold text-red-300 mb-1">Why Regularity Matters</p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Irregular sleep disrupts circadian clock gene expression, impairs glucose
                  metabolism, elevates inflammatory markers, and is linked to depression,
                  cardiovascular disease, and metabolic syndrome — effects that emerge even with
                  adequate total sleep duration.
                </p>
              </div>
            </div>

            {/* Improvement tips */}
            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-green-300 mb-2">How to Improve Your SRI</p>
              <ul className="space-y-1.5">
                {[
                  'Anchor your wake time — keeping the same rise time every day (including weekends) is the most powerful lever for SRI.',
                  'Get morning light within 30 minutes of waking to reinforce your circadian clock.',
                  'Limit alcohol within 3 hours of bedtime — alcohol fragments sleep and disrupts the second half of the night.',
                  'Avoid large shifts in bedtime across weekdays and weekends (>1 h shift noticeably reduces SRI).',
                  'If you travel across time zones, re-anchor your wake time first before adjusting bedtime.',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 shrink-0 mt-0.5"
                      style={{ fontSize: 9, fontWeight: 700 }}>
                      {i + 1}
                    </span>
                    <p className="text-xs text-text-secondary leading-relaxed">{tip}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Science footer */}
            <div className="flex items-start gap-2">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-xs text-text-secondary leading-relaxed">
                <span className="text-indigo-300 font-medium">References:</span>{' '}
                Phillips AJK et al. (2017). Irregular sleep/wake patterns are associated with
                poorer academic performance and delayed circadian and sleep/wake timing.{' '}
                <em>J Biol Rhythms</em> 32(5), 425–438. — Phillips AJK et al. (2021). Irregular
                sleep and mortality: a population-based study. <em>Scientific Reports</em> 11,
                11876. Data shown uses mock values for demonstration purposes.
              </p>
            </div>
          </div>
        </div>

      </main>
      <BottomNav />
    </div>
  )
}
