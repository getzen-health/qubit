'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Upload, FileText, CheckCircle2, AlertCircle, Clock, ChevronRight, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { parseAuto, type ParseResult, type WearableFormat } from '@/lib/wearable-parsers'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step = 'upload' | 'preview' | 'importing' | 'result'
type ConflictMode = 'skip' | 'overwrite'

interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
  date_range: { start: string; end: string }
}

interface ImportLog {
  id: string
  imported_at: string
  source_format: string
  filename: string
  total_records: number
  imported_records: number
  skipped_records: number
  date_range_start: string | null
  date_range_end: string | null
  status: 'completed' | 'partial' | 'failed'
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FORMAT_META: Record<WearableFormat, { label: string; emoji: string; color: string; instructions: string }> = {
  garmin_activities: {
    label: 'Garmin Activities',
    emoji: '🟢',
    color: 'text-green-400',
    instructions: 'Garmin Connect → Health Stats → Activities → Export CSV',
  },
  garmin_sleep: {
    label: 'Garmin Sleep',
    emoji: '🟢',
    color: 'text-green-400',
    instructions: 'Garmin Connect → Health Stats → Sleep → Export CSV',
  },
  fitbit_sleep: {
    label: 'Fitbit Sleep',
    emoji: '🔵',
    color: 'text-blue-400',
    instructions: 'Fitbit Dashboard → Settings → Data Export → Download Archive → sleep-YYYY-MM-DD.json',
  },
  fitbit_heart: {
    label: 'Fitbit Heart Rate',
    emoji: '🔵',
    color: 'text-blue-400',
    instructions: 'Fitbit Dashboard → Settings → Data Export → Download Archive → activities-heart-YYYY-MM-DD.json',
  },
  whoop: {
    label: 'Whoop',
    emoji: '⚫',
    color: 'text-text-secondary',
    instructions: 'Whoop App → Profile → Privacy & Security → Download My Data → physiological_cycles.csv',
  },
  apple_health: {
    label: 'Apple Health',
    emoji: '❤️',
    color: 'text-red-400',
    instructions: 'Health App → Profile photo → Export All Health Data → export.xml',
  },
  unknown: {
    label: 'Unknown',
    emoji: '❓',
    color: 'text-text-secondary',
    instructions: '',
  },
}

const PREVIEW_COLUMNS: Array<{ key: keyof import('@/lib/wearable-parsers').ParsedHealthRecord; label: string; fmt?: (v: unknown) => string }> = [
  { key: 'date', label: 'Date' },
  { key: 'steps', label: 'Steps', fmt: v => v != null ? Number(v).toLocaleString() : '—' },
  { key: 'sleep_hours', label: 'Sleep', fmt: v => v != null ? `${Number(v).toFixed(1)} h` : '—' },
  { key: 'resting_hr', label: 'Resting HR', fmt: v => v != null ? `${v} bpm` : '—' },
  { key: 'hrv_ms', label: 'HRV', fmt: v => v != null ? `${Number(v).toFixed(1)} ms` : '—' },
  { key: 'recovery_score', label: 'Recovery', fmt: v => v != null ? `${v}%` : '—' },
  { key: 'calories_burned', label: 'Calories', fmt: v => v != null ? Number(v).toLocaleString() : '—' },
]

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function statusBadge(status: ImportLog['status']) {
  if (status === 'completed') return <span className="inline-flex items-center gap-1 text-xs font-medium text-success"><CheckCircle2 className="w-3 h-3" />Done</span>
  if (status === 'partial')   return <span className="inline-flex items-center gap-1 text-xs font-medium text-warning"><AlertCircle className="w-3 h-3" />Partial</span>
  return <span className="inline-flex items-center gap-1 text-xs font-medium text-error"><AlertCircle className="w-3 h-3" />Failed</span>
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ImportPage() {
  const [step, setStep] = useState<Step>('upload')
  const [fileInfo, setFileInfo] = useState<{ name: string; content: string; size: number } | null>(null)
  const [parsed, setParsed] = useState<ParseResult | null>(null)
  const [conflict, setConflict] = useState<ConflictMode>('skip')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [history, setHistory] = useState<ImportLog[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetchHistory()
    return () => { if (progressRef.current) clearInterval(progressRef.current) }
  }, [])

  const fetchHistory = async () => {
    setHistoryLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('import_logs')
        .select('id, imported_at, source_format, filename, total_records, imported_records, skipped_records, date_range_start, date_range_end, status')
        .order('imported_at', { ascending: false })
        .limit(20)
      setHistory(data ?? [])
    } finally {
      setHistoryLoading(false)
    }
  }

  const processFile = useCallback(async (file: File) => {
    setFileError(null)
    if (file.size > 50 * 1024 * 1024) {
      setFileError('File too large (max 50 MB). For large Apple Health exports, try exporting a shorter date range.')
      return
    }
    if (file.name.toLowerCase().endsWith('.zip')) {
      setFileError('ZIP import is not yet supported. Please extract and import individual CSV, JSON, or XML files.')
      return
    }

    const content = await file.text()
    const result = parseAuto(file.name, content)
    setFileInfo({ name: file.name, content, size: file.size })
    setParsed(result)
    setStep('preview')
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) processFile(f)
  }, [processFile])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) processFile(f)
  }

  const handleImport = async () => {
    if (!fileInfo || !parsed) return
    setStep('importing')
    setProgress(5)

    progressRef.current = setInterval(() => {
      setProgress(prev => Math.min(prev + 8, 88))
    }, 300)

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: fileInfo.name, content: fileInfo.content, conflict }),
      })
      const data: ImportResult = await res.json()
      if (progressRef.current) clearInterval(progressRef.current)
      setProgress(100)
      setResult(data)
      setStep('result')
      fetchHistory()
    } catch {
      if (progressRef.current) clearInterval(progressRef.current)
      setResult({ imported: 0, skipped: 0, errors: ['Network error — import failed.'], date_range: { start: '', end: '' } })
      setStep('result')
    }
  }

  const reset = () => {
    setStep('upload')
    setFileInfo(null)
    setParsed(null)
    setResult(null)
    setProgress(0)
    setFileError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Import Health Data</h1>
          <p className="text-sm text-text-secondary mt-1">
            Upload exports from Garmin, Fitbit, Whoop, or Apple Health
          </p>
        </div>

        {/* Supported formats */}
        {step === 'upload' && (
          <div className="flex flex-wrap gap-2">
            {(['garmin_activities', 'garmin_sleep', 'fitbit_sleep', 'fitbit_heart', 'whoop', 'apple_health'] as WearableFormat[]).map(fmt => (
              <span key={fmt} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-border text-xs text-text-secondary font-medium">
                <span>{FORMAT_META[fmt].emoji}</span>
                <span>{FORMAT_META[fmt].label}</span>
              </span>
            ))}
          </div>
        )}

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors
                ${isDragging
                  ? 'border-accent bg-accent/5'
                  : 'border-border hover:border-accent/50 hover:bg-surface/50'}
              `}
            >
              <Upload className="w-10 h-10 text-text-secondary mx-auto mb-3" />
              <p className="text-text-primary font-medium">Drop your file here</p>
              <p className="text-text-secondary text-sm mt-1">or click to browse</p>
              <p className="text-text-tertiary text-xs mt-3">.csv  .json  .xml  (max 50 MB)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json,.xml,.zip"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {fileError && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {fileError}
              </div>
            )}

            {/* How-to export instructions */}
            <div className="rounded-2xl bg-surface border border-border divide-y divide-border">
              <p className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">How to export</p>
              {(['garmin_sleep', 'fitbit_sleep', 'whoop', 'apple_health'] as WearableFormat[]).map(fmt => (
                <div key={fmt} className="flex items-start gap-3 px-4 py-3">
                  <span className="text-lg leading-none mt-0.5">{FORMAT_META[fmt].emoji}</span>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{FORMAT_META[fmt].label}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{FORMAT_META[fmt].instructions}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && parsed && fileInfo && (
          <div className="space-y-4">
            {/* Format badge + file info */}
            <div className="rounded-2xl bg-surface border border-border p-4 flex items-center gap-3">
              <FileText className="w-5 h-5 text-text-secondary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{fileInfo.name}</p>
                <p className="text-xs text-text-secondary">{(fileInfo.size / 1024).toFixed(0)} KB</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-secondary text-xs font-semibold ${FORMAT_META[parsed.format].color}`}>
                <span>{FORMAT_META[parsed.format].emoji}</span>
                {FORMAT_META[parsed.format].label}
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-surface border border-border p-3 text-center">
                <p className="text-xl font-bold text-text-primary">{parsed.total_rows.toLocaleString()}</p>
                <p className="text-xs text-text-secondary mt-0.5">Records</p>
              </div>
              <div className="rounded-xl bg-surface border border-border p-3 text-center">
                <p className="text-sm font-bold text-text-primary">{fmtDate(parsed.date_range.start)}</p>
                <p className="text-xs text-text-secondary mt-0.5">Start</p>
              </div>
              <div className="rounded-xl bg-surface border border-border p-3 text-center">
                <p className="text-sm font-bold text-text-primary">{fmtDate(parsed.date_range.end)}</p>
                <p className="text-xs text-text-secondary mt-0.5">End</p>
              </div>
            </div>

            {/* Data types found */}
            {(() => {
              const types: string[] = []
              const first = parsed.records[0]
              if (!first) return null
              if (parsed.records.some(r => r.steps != null)) types.push('Steps')
              if (parsed.records.some(r => r.sleep_hours != null)) types.push('Sleep')
              if (parsed.records.some(r => r.resting_hr != null)) types.push('Heart Rate')
              if (parsed.records.some(r => r.hrv_ms != null)) types.push('HRV')
              if (parsed.records.some(r => r.recovery_score != null)) types.push('Recovery')
              if (parsed.records.some(r => r.calories_burned != null)) types.push('Calories')
              return types.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {types.map(t => (
                    <span key={t} className="px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">{t}</span>
                  ))}
                </div>
              ) : null
            })()}

            {/* Warnings / errors from parse */}
            {parsed.warnings.length > 0 && (
              <div className="rounded-xl border border-warning/20 bg-warning/5 p-3 space-y-1">
                {parsed.warnings.slice(0, 3).map((w, i) => (
                  <p key={i} className="text-xs text-warning">{w}</p>
                ))}
              </div>
            )}

            {/* Preview table */}
            <div className="rounded-2xl bg-surface border border-border overflow-hidden">
              <p className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide border-b border-border">
                Preview (first {Math.min(10, parsed.records.length)} of {parsed.total_rows} records)
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {PREVIEW_COLUMNS.map(col => (
                        <th key={col.key} className="px-3 py-2 text-left text-text-secondary font-medium whitespace-nowrap">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {parsed.records.slice(0, 10).map((rec, i) => (
                      <tr key={i} className="hover:bg-surface-secondary/40 transition-colors">
                        {PREVIEW_COLUMNS.map(col => (
                          <td key={col.key} className="px-3 py-2 text-text-primary whitespace-nowrap">
                            {col.fmt
                              ? col.fmt(rec[col.key])
                              : rec[col.key] != null ? String(rec[col.key]) : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Conflict resolution */}
            <div className="rounded-2xl bg-surface border border-border p-4 space-y-3">
              <p className="text-sm font-medium text-text-primary">If data already exists for a date…</p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="conflict"
                  value="skip"
                  checked={conflict === 'skip'}
                  onChange={() => setConflict('skip')}
                  className="accent-accent"
                />
                <div>
                  <p className="text-sm text-text-primary font-medium">Skip existing dates</p>
                  <p className="text-xs text-text-secondary">Keeps your current data; only imports new dates</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="conflict"
                  value="overwrite"
                  checked={conflict === 'overwrite'}
                  onChange={() => setConflict('overwrite')}
                  className="accent-accent"
                />
                <div>
                  <p className="text-sm text-text-primary font-medium">Overwrite existing dates</p>
                  <p className="text-xs text-text-secondary">Replaces existing records with imported values</p>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 py-3 rounded-xl border border-border text-text-secondary text-sm font-medium hover:bg-surface transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={parsed.total_rows === 0}
                className="flex-1 py-3 rounded-xl bg-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                Import {parsed.total_rows.toLocaleString()} records
              </button>
            </div>
          </div>
        )}

        {/* Step 3a: Importing (progress) */}
        {step === 'importing' && (
          <div className="rounded-2xl bg-surface border border-border p-8 text-center space-y-4">
            <RefreshCw className="w-8 h-8 text-accent mx-auto animate-spin" />
            <p className="text-text-primary font-medium">Importing data…</p>
            <div className="w-full bg-surface-secondary rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-text-secondary">{progress}%</p>
          </div>
        )}

        {/* Step 3b: Result */}
        {step === 'result' && result && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-surface border border-border p-5 space-y-4">
              <h2 className="text-base font-semibold text-text-primary">Import complete</h2>

              {/* Progress bar */}
              <div className="w-full bg-surface-secondary rounded-full h-2">
                <div className="h-full bg-accent rounded-full w-full" />
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-success/10 border border-success/20 p-3 text-center">
                  <p className="text-xl font-bold text-success">{result.imported.toLocaleString()}</p>
                  <p className="text-xs text-text-secondary mt-0.5">✅ Imported</p>
                </div>
                <div className="rounded-xl bg-surface-secondary border border-border p-3 text-center">
                  <p className="text-xl font-bold text-text-secondary">{result.skipped.toLocaleString()}</p>
                  <p className="text-xs text-text-secondary mt-0.5">⏭️ Skipped</p>
                </div>
                <div className="rounded-xl bg-error/10 border border-error/20 p-3 text-center">
                  <p className="text-xl font-bold text-error">{result.errors.length}</p>
                  <p className="text-xs text-text-secondary mt-0.5">❌ Errors</p>
                </div>
              </div>

              {/* Date range */}
              {(result.date_range.start || result.date_range.end) && (
                <p className="text-xs text-text-secondary text-center">
                  {fmtDate(result.date_range.start)} → {fmtDate(result.date_range.end)}
                </p>
              )}

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="rounded-xl bg-error/5 border border-error/20 p-3 space-y-1 max-h-32 overflow-y-auto">
                  {result.errors.slice(0, 10).map((e, i) => (
                    <p key={i} className="text-xs text-error">{e}</p>
                  ))}
                  {result.errors.length > 10 && (
                    <p className="text-xs text-text-secondary">…and {result.errors.length - 10} more</p>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={reset}
              className="w-full py-3 rounded-xl bg-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Import another file
            </button>
          </div>
        )}

        {/* Import History */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-primary">Import History</h2>
            <button onClick={fetchHistory} className="p-1.5 rounded-lg hover:bg-surface transition-colors">
              <RefreshCw className="w-4 h-4 text-text-secondary" />
            </button>
          </div>

          {historyLoading ? (
            <div className="rounded-2xl bg-surface border border-border p-6 text-center text-sm text-text-secondary">
              Loading…
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-2xl bg-surface border border-border p-6 text-center text-sm text-text-secondary">
              No imports yet
            </div>
          ) : (
            <div className="rounded-2xl bg-surface border border-border divide-y divide-border overflow-hidden">
              {history.map(log => (
                <div key={log.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="text-lg shrink-0">
                    {FORMAT_META[log.source_format as WearableFormat]?.emoji ?? '📂'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-text-primary truncate">{log.filename ?? log.source_format}</p>
                      {statusBadge(log.status)}
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {new Date(log.imported_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {' · '}
                      {log.imported_records ?? 0} imported
                      {log.date_range_start && log.date_range_end
                        ? ` · ${fmtDate(log.date_range_start)} → ${fmtDate(log.date_range_end)}`
                        : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
