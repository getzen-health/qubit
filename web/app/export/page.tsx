'use client'

import { useState, useEffect, useCallback } from 'react'
import { Download, FileJson, FileSpreadsheet, FileText, Calendar, Shield, Clock, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { buildFHIRBundle, type ExportData } from '@/lib/fhir-export'
import {
  metricsToCSV,
  sleepToCSV,
  foodScansToCSV,
  labResultsToCSV,
  medicationsToCSV,
  downloadFile,
} from '@/lib/csv-export'
import { generateHealthReportPDF, type HealthReportData } from '@/lib/generate-pdf-report'
import { useIsPro } from '@/lib/subscription'
import { PaywallBanner } from '@/components/paywall-banner'

type ExportFormat = 'fhir' | 'csv' | 'pdf'
type DatePreset = '30d' | '90d' | '1y' | 'all' | 'custom'

interface ExportLog {
  id: string
  exported_at: string
  format: string
  date_range_start: string | null
  date_range_end: string | null
  record_count: number | null
  filename: string | null
}

function getPresetDates(preset: DatePreset): { start: string; end: string } {
  const today = new Date()
  const end = today.toISOString().split('T')[0]
  if (preset === 'all') return { start: '', end: '' }
  const start = new Date(today)
  if (preset === '30d') start.setDate(today.getDate() - 30)
  else if (preset === '90d') start.setDate(today.getDate() - 90)
  else if (preset === '1y') start.setFullYear(today.getFullYear() - 1)
  return { start: start.toISOString().split('T')[0], end }
}

const FORMAT_CARDS: Array<{
  id: ExportFormat
  icon: React.ElementType
  label: string
  description: string
}> = [
  {
    id: 'fhir',
    icon: FileJson,
    label: 'FHIR R4 JSON',
    description: 'Standard healthcare format — share with doctors, import into Apple Health, compatible with Epic/Cerner',
  },
  {
    id: 'csv',
    icon: FileSpreadsheet,
    label: 'CSV Bundle',
    description: 'Spreadsheet-ready — open in Excel/Google Sheets for custom analysis',
  },
  {
    id: 'pdf',
    icon: FileText,
    label: 'PDF Summary',
    description: 'Doctor-ready health report — includes charts, scores, and trends',
  },
]

const DATA_TYPES = [
  { key: 'include_metrics', label: 'Health metrics', description: 'Steps, calories, HRV, weight' },
  { key: 'include_sleep', label: 'Sleep data', description: 'Sleep stages, duration, quality' },
  { key: 'include_food_scans', label: 'Food scans', description: 'Scanned products and scores' },
  { key: 'include_workouts', label: 'Workouts', description: 'Exercise sessions and stats' },
  { key: 'include_lab_results', label: 'Lab results', description: 'Biomarkers and blood panels' },
  { key: 'include_medications', label: 'Medications', description: 'Current and past medications' },
] as const

type DataTypeKey = (typeof DATA_TYPES)[number]['key']

export default function ExportPage() {
  const [format, setFormat] = useState<ExportFormat>('fhir')
  const [preset, setPreset] = useState<DatePreset>('30d')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [dataTypes, setDataTypes] = useState<Record<DataTypeKey, boolean>>({
    include_metrics: true,
    include_sleep: true,
    include_food_scans: true,
    include_workouts: true,
    include_lab_results: true,
    include_medications: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [history, setHistory] = useState<ExportLog[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const isPro = useIsPro()

  const fetchHistory = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('export_logs')
      .select('id, exported_at, format, date_range_start, date_range_end, record_count, filename')
      .order('exported_at', { ascending: false })
      .limit(10)
    setHistory(data ?? [])
    setHistoryLoading(false)
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const dateRange = preset === 'custom'
    ? { start: customStart, end: customEnd }
    : getPresetDates(preset)

  async function handleExport() {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          options: { date_range: dateRange, ...dataTypes },
        }),
      })

      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({ error: 'Export failed' }))
        throw new Error(msg ?? 'Export failed')
      }

      const { data }: { data: ExportData } = await res.json()
      const dateTag = new Date().toISOString().split('T')[0]

      if (format === 'fhir') {
        const bundle = buildFHIRBundle(data)
        downloadFile(JSON.stringify(bundle, null, 2), `kquarks-fhir-${dateTag}.json`, 'application/json')
      } else if (format === 'csv') {
        if (data.metrics?.length) downloadFile(metricsToCSV(data.metrics), `kquarks-metrics-${dateTag}.csv`, 'text/csv')
        if (data.sleep?.length) downloadFile(sleepToCSV(data.sleep), `kquarks-sleep-${dateTag}.csv`, 'text/csv')
        if (data.food_scans?.length) downloadFile(foodScansToCSV(data.food_scans), `kquarks-food-scans-${dateTag}.csv`, 'text/csv')
        if (data.lab_results?.length) downloadFile(labResultsToCSV(data.lab_results), `kquarks-labs-${dateTag}.csv`, 'text/csv')
        if (data.medications?.length) downloadFile(medicationsToCSV(data.medications), `kquarks-medications-${dateTag}.csv`, 'text/csv')
      } else if (format === 'pdf') {
        const metrics = data.metrics ?? []
        const allSteps = metrics.map(r => r.steps).filter((v): v is number => v != null)
        const allHR = metrics.map(r => r.resting_heart_rate).filter((v): v is number => v != null)
        const allSleep = metrics.map(r => r.sleep_duration_minutes).filter((v): v is number => v != null)
        const allWeight = metrics.map(r => r.weight_kg).filter((v): v is number => v != null)

        const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : null

        const pdfData: HealthReportData = {
          period: {
            start: dateRange.start || metrics[metrics.length - 1]?.date || dateTag,
            end: dateRange.end || metrics[0]?.date || dateTag,
          },
          stats: {
            steps: {
              avg: avg(allSteps),
              total: allSteps.reduce((a, b) => a + b, 0),
              days: allSteps.length,
            },
            sleep: {
              avg_hours: allSleep.length ? Math.round(avg(allSleep)! / 6) / 10 : null,
              days: allSleep.length,
            },
            resting_hr: { avg: avg(allHR) },
            weight: {
              start: allWeight[allWeight.length - 1] ?? null,
              end: allWeight[0] ?? null,
              change: allWeight.length >= 2 ? Math.round((allWeight[0] - allWeight[allWeight.length - 1]) * 10) / 10 : null,
            },
            mood: { avg: null, logs: 0 },
            workouts: {
              count: data.workouts?.length ?? 0,
              total_minutes: (data.workouts ?? []).reduce((s, w) => s + (w.duration_minutes ?? 0), 0),
            },
          },
          labs: (data.lab_results ?? []).map(l => ({
            biomarker_name: l.biomarker_key,
            value: l.value,
            unit: l.unit ?? '',
            status: 'normal',
            tested_at: l.lab_date,
          })),
          recent_workouts: (data.workouts ?? []).slice(0, 5).map(w => ({
            name: w.type ?? 'Workout',
            duration_minutes: w.duration_minutes ?? 0,
            calories: w.calories ?? 0,
            started_at: w.workout_date ?? '',
          })),
          generated_at: new Date().toISOString(),
        }
        generateHealthReportPDF(pdfData)
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
      fetchHistory()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed')
    } finally {
      setLoading(false)
    }
  }

  const noneSelected = !Object.values(dataTypes).some(Boolean)

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Export Health Data</h1>
          <p className="text-sm text-text-secondary mt-1">Download your data in standard healthcare formats.</p>
        </div>

        {/* Date Range */}
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
          <p className="font-semibold text-text-primary">Date Range</p>
          <div className="flex flex-wrap gap-2">
            {(['30d', '90d', '1y', 'all', 'custom'] as DatePreset[]).map(p => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                  preset === p
                    ? 'bg-primary/10 border-primary/40 text-primary'
                    : 'border-border text-text-secondary hover:text-text-primary'
                )}
              >
                {p === '30d' ? 'Last 30 days' : p === '90d' ? 'Last 90 days' : p === '1y' ? 'Last year' : p === 'all' ? 'All time' : 'Custom'}
              </button>
            ))}
          </div>
          {preset === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-secondary block mb-1">From</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background text-text-primary"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary block mb-1">To</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background text-text-primary"
                />
              </div>
            </div>
          )}
          {preset !== 'all' && preset !== 'custom' && (
            <p className="text-xs text-text-secondary flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {dateRange.start} → {dateRange.end}
            </p>
          )}
        </div>

        {/* Data Types */}
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-3">
          <p className="font-semibold text-text-primary">Data to Include</p>
          <div className="space-y-2">
            {DATA_TYPES.map(({ key, label, description }) => (
              <label key={key} className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={dataTypes[key]}
                  onChange={e => setDataTypes(prev => ({ ...prev, [key]: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 rounded border-border accent-primary"
                />
                <div>
                  <span className="text-sm font-medium text-text-primary">{label}</span>
                  <span className="text-xs text-text-secondary ml-2">{description}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Format Selector */}
        <div className="space-y-2">
          <p className="font-semibold text-text-primary px-1">Export Format</p>
          <div className="grid grid-cols-1 gap-3">
            {FORMAT_CARDS.map(({ id, icon: Icon, label, description }) => (
              <button
                key={id}
                onClick={() => setFormat(id)}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-2xl border text-left transition-colors',
                  format === id
                    ? 'bg-primary/10 border-primary/50'
                    : 'bg-surface border-border hover:border-border/80'
                )}
              >
                <div className={cn('p-2 rounded-xl', format === id ? 'bg-primary/20' : 'bg-surface-secondary')}>
                  <Icon className={cn('w-5 h-5', format === id ? 'text-primary' : 'text-text-secondary')} />
                </div>
                <div>
                  <p className={cn('text-sm font-semibold', format === id ? 'text-primary' : 'text-text-primary')}>{label}</p>
                  <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Error / Success */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-sm text-green-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Export downloaded successfully!
          </div>
        )}

        {/* Export Button */}
        {!isPro ? (
          <PaywallBanner feature="Health Data Export" />
        ) : (
        <button
          onClick={handleExport}
          disabled={loading || noneSelected}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all',
            loading || noneSelected
              ? 'bg-surface border border-border text-text-secondary cursor-not-allowed'
              : 'bg-primary text-white hover:opacity-90 active:scale-[0.98]'
          )}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Preparing export…
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Export {format === 'fhir' ? 'FHIR R4 JSON' : format === 'csv' ? 'CSV Bundle' : 'PDF Report'}
            </>
          )}
        </button>
        )}

        {/* Privacy Notice */}
        <div className="flex items-start gap-2 px-1">
          <Shield className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
          <p className="text-xs text-text-secondary">
            All exports are generated on your device. No data is sent to third parties.
          </p>
        </div>

        {/* Export History */}
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-3">
          <p className="font-semibold text-text-primary flex items-center gap-2">
            <Clock className="w-4 h-4 text-text-secondary" />
            Export History
          </p>
          {historyLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 bg-surface-secondary rounded-lg animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-text-secondary">No exports yet.</p>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-text-secondary">
                    <th className="text-left pb-2 pr-3 font-medium">Date</th>
                    <th className="text-left pb-2 pr-3 font-medium">Format</th>
                    <th className="text-left pb-2 pr-3 font-medium">Range</th>
                    <th className="text-right pb-2 font-medium">Records</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history.map(log => (
                    <tr key={log.id} className="text-text-secondary hover:text-text-primary transition-colors">
                      <td className="py-2 pr-3 font-mono">
                        {new Date(log.exported_at).toLocaleDateString()}
                      </td>
                      <td className="py-2 pr-3 uppercase font-semibold text-primary">
                        {log.format}
                      </td>
                      <td className="py-2 pr-3">
                        {log.date_range_start && log.date_range_end
                          ? `${log.date_range_start} – ${log.date_range_end}`
                          : log.date_range_start
                          ? `From ${log.date_range_start}`
                          : 'All time'}
                      </td>
                      <td className="py-2 text-right">{log.record_count ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
