'use client'

import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { ECGData, ECGClass, MonthBucket } from './page'

interface Props {
  data: ECGData
}

// ─── Classification display config ────────────────────────────────────────────

interface ClassConfig {
  label: string
  shortLabel: string
  badgeBg: string
  badgeText: string
  dotColor: string
}

const CLASS_CONFIG: Record<ECGClass, ClassConfig> = {
  sinusRhythm: {
    label: 'Sinus Rhythm',
    shortLabel: 'Sinus',
    badgeBg: 'bg-green-100 dark:bg-green-950/50',
    badgeText: 'text-green-700 dark:text-green-400',
    dotColor: '#16a34a',
  },
  atrialFibrillation: {
    label: 'Atrial Fibrillation',
    shortLabel: 'AFib',
    badgeBg: 'bg-red-100 dark:bg-red-950/50',
    badgeText: 'text-red-700 dark:text-red-400',
    dotColor: '#dc2626',
  },
  inconclusiveHighHR: {
    label: 'Inconclusive (High HR)',
    shortLabel: 'Inc. High HR',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/50',
    badgeText: 'text-amber-700 dark:text-amber-400',
    dotColor: '#d97706',
  },
  inconclusiveLowHR: {
    label: 'Inconclusive (Low HR)',
    shortLabel: 'Inc. Low HR',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/50',
    badgeText: 'text-amber-700 dark:text-amber-400',
    dotColor: '#d97706',
  },
  inconclusive: {
    label: 'Inconclusive',
    shortLabel: 'Inconclusive',
    badgeBg: 'bg-gray-100 dark:bg-gray-800',
    badgeText: 'text-gray-600 dark:text-gray-400',
    dotColor: '#6b7280',
  },
  notClassified: {
    label: 'Not Classified',
    shortLabel: 'Unclassified',
    badgeBg: 'bg-gray-100 dark:bg-gray-800',
    badgeText: 'text-gray-500 dark:text-gray-500',
    dotColor: '#9ca3af',
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDateTime(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function fmtMonth(yyyyMM: string): string {
  const [y, m] = yyyyMM.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

// ─── Tooltip for stacked bar chart ────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0)
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-sm min-w-[160px]">
      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-gray-500 dark:text-gray-400 tabular-nums">
          {p.name}:{' '}
          <span className="font-medium" style={{ color: p.color }}>
            {p.value}
          </span>
        </p>
      ))}
      <p className="mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-500 tabular-nums">
        Total: <span className="font-medium text-gray-600 dark:text-gray-300">{total}</span>
      </p>
    </div>
  )
}

// ─── Percentage metric ────────────────────────────────────────────────────────

function PctMetric({
  label,
  pct,
  color,
  count,
}: {
  label: string
  pct: number
  color: string
  count: number
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <p
        className="text-3xl font-bold tabular-nums leading-none"
        style={{ color }}
      >
        {pct}%
      </p>
      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1.5">{label}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">{count} reading{count !== 1 ? 's' : ''}</p>
    </div>
  )
}

// ─── Main client component ────────────────────────────────────────────────────

export function ECGClient({ data }: Props) {
  const { records, monthBuckets, sinusPct, afibPct, inconclusivePct, total } = data

  const sinusCount = Math.round((sinusPct / 100) * total)
  const afibCount = Math.round((afibPct / 100) * total)
  const inconclusiveCount = total - sinusCount - afibCount

  const recentRecords = [...records].slice(0, 10)

  const chartData = monthBuckets.map((b: MonthBucket) => ({
    label: fmtMonth(b.month),
    Sinus: b.sinusCount,
    AFib: b.afibCount,
    Inconclusive: b.inconclusiveCount,
  }))

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (total === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="w-8 h-8 text-gray-400 dark:text-gray-500"
            >
              <polyline points="2 12 6 12 8 4 10 20 12 12 14 8 16 16 18 12 22 12" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No ECG Data</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
            No ECG recordings have been synced yet. Take an ECG on your Apple Watch and sync your health data to see your results here.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">How to take an ECG</h2>
          <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            <li className="flex gap-2">
              <span className="shrink-0 font-semibold text-gray-400 dark:text-gray-500 tabular-nums">1.</span>
              Open the ECG app on your Apple Watch Series 4 or later.
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 font-semibold text-gray-400 dark:text-gray-500 tabular-nums">2.</span>
              Rest your arm on a flat surface and hold your finger on the Digital Crown for 30 seconds.
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 font-semibold text-gray-400 dark:text-gray-500 tabular-nums">3.</span>
              Sync KQuarks from the iOS app to upload your results.
            </li>
          </ol>
          <p className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
            ECG results are for informational purposes only and do not constitute medical advice. Always consult a qualified healthcare provider with any concerns about your heart health.
          </p>
        </div>
      </div>
    )
  }

  // ── Data state ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── AFib warning ──────────────────────────────────────────────────────── */}
      {afibPct > 0 && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl px-4 py-3 flex gap-3 items-start">
          <span className="shrink-0 mt-0.5 text-red-500 text-base font-bold">!</span>
          <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed font-medium">
            Atrial fibrillation detected — consult your doctor.
          </p>
        </div>
      )}

      {/* ── Summary card ──────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-4">
          Classification Breakdown
        </p>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <PctMetric
            label="Sinus Rhythm"
            pct={sinusPct}
            color="#16a34a"
            count={sinusCount}
          />
          <PctMetric
            label="AFib"
            pct={afibPct}
            color="#dc2626"
            count={afibCount}
          />
          <PctMetric
            label="Inconclusive"
            pct={inconclusivePct}
            color="#6b7280"
            count={inconclusiveCount}
          />
        </div>

        {/* Progress bar */}
        <div className="flex h-2 rounded-full overflow-hidden gap-px mb-3">
          {sinusPct > 0 && (
            <div className="bg-green-500 transition-all" style={{ width: `${sinusPct}%` }} />
          )}
          {afibPct > 0 && (
            <div className="bg-red-500 transition-all" style={{ width: `${afibPct}%` }} />
          )}
          {inconclusivePct > 0 && (
            <div className="bg-gray-300 dark:bg-gray-600 transition-all" style={{ width: `${inconclusivePct}%` }} />
          )}
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
          {total} total ECG recording{total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ── Monthly stacked bar chart ──────────────────────────────────────────── */}
      {chartData.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5">Monthly Breakdown</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">ECG classifications per month</p>

          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={chartData} margin={{ left: -18, bottom: 0 }} barCategoryGap="20%">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                strokeOpacity={0.08}
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'currentColor' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'currentColor' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'currentColor', fillOpacity: 0.05 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar dataKey="Sinus" name="Sinus" stackId="a" fill="#16a34a" opacity={0.85} radius={[0, 0, 0, 0]} />
              <Bar dataKey="AFib" name="AFib" stackId="a" fill="#dc2626" opacity={0.85} radius={[0, 0, 0, 0]} />
              <Bar dataKey="Inconclusive" name="Inconclusive" stackId="a" fill="#9ca3af" opacity={0.85} radius={[3, 3, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Recent recordings list ─────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Recent Recordings</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">Last {recentRecords.length} ECGs, newest first</p>
        </div>

        {recentRecords.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400 dark:text-gray-500 text-center">No recordings yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentRecords.map((record) => {
              const cfg = CLASS_CONFIG[record.classification]
              return (
                <li key={record.id} className="flex items-center gap-3 px-4 py-3">
                  {/* Colored dot */}
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cfg.dotColor }}
                  />

                  {/* Date/time */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                      {fmtDateTime(record.date)}
                    </p>
                    {record.heartRate != null && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                        {Math.round(record.heartRate)} bpm
                      </p>
                    )}
                  </div>

                  {/* Classification badge */}
                  <span
                    className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.badgeBg} ${cfg.badgeText}`}
                  >
                    {cfg.shortLabel}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* ── Info card ─────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">About ECG Classifications</h2>

        <div className="space-y-3">
          {(
            [
              ['sinusRhythm', 'The electrical impulses in your heart are following a normal, regular pattern. This is the expected result.'],
              ['atrialFibrillation', 'An irregular heart rhythm was detected. AFib is a common arrhythmia but requires medical attention. Share this result with your doctor.'],
              ['inconclusiveHighHR', 'Heart rate was too high (above 150 bpm) to generate a reliable classification. Try again when resting.'],
              ['inconclusiveLowHR', 'Heart rate was too low (below 50 bpm) to generate a reliable classification.'],
              ['inconclusive', 'The recording could not be classified, often due to poor electrode contact or movement. Try resting your arm on a flat surface.'],
              ['notClassified', 'The ECG was not analysed, or the recording predates classification support on your device.'],
            ] as [ECGClass, string][]
          ).map(([cls, description]) => {
            const cfg = CLASS_CONFIG[cls]
            return (
              <div key={cls} className="flex gap-3">
                <div
                  className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                  style={{ backgroundColor: cfg.dotColor }}
                />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{cfg.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
                </div>
              </div>
            )
          })}
        </div>

        <p className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
          ECG results from Apple Watch are not intended to replace professional medical evaluation, diagnosis, or treatment. Always consult a qualified healthcare provider with any concerns about your heart health.
        </p>
      </div>

    </div>
  )
}
