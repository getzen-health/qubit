'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Upload, FileText, CheckCircle2, AlertCircle, Clock, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActiveTab = 'garmin' | 'oura'
type GarminStep = 'upload' | 'preview' | 'importing' | 'done'
type OuraStep   = 'input'  | 'preview' | 'importing' | 'done'

interface ImportResult {
  imported: number
  skipped:  number
  errors?:  string[]
}

interface ImportHistoryEntry {
  id:              string
  imported_at:     string
  source_format:   string
  filename:        string | null
  imported_records: number
  skipped_records:  number
  status:          string
}

// ---------------------------------------------------------------------------
// CSV row preview helper
// ---------------------------------------------------------------------------

function parseCSVPreview(csv: string, maxRows = 3): { headers: string[]; rows: string[][] } {
  const lines = csv.trim().split('\n').filter(Boolean)
  if (lines.length === 0) return { headers: [], rows: [] }

  function splitLine(line: string): string[] {
    const fields: string[] = []
    let current = ''
    let inQ = false
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ }
      else if (ch === ',' && !inQ) { fields.push(current.trim()); current = '' }
      else { current += ch }
    }
    fields.push(current.trim())
    return fields
  }

  const headers = splitLine(lines[0])
  const rows = lines.slice(1, 1 + maxRows).map(splitLine)
  return { headers, rows }
}

// ---------------------------------------------------------------------------
// Oura JSON parser (client-side)
// ---------------------------------------------------------------------------

interface OuraSummary { sleepCount: number; activityCount: number }

function parseOuraJSON(raw: string): {
  ok: boolean
  summary: OuraSummary
  payload: { sleepData: unknown[]; activityData: unknown[] }
  error?: string
} {
  try {
    const data = JSON.parse(raw)
    const sleepData    = Array.isArray(data.sleep)    ? data.sleep    :
                         Array.isArray(data.sleepData) ? data.sleepData : []
    const activityData = Array.isArray(data.daily_activity) ? data.daily_activity :
                         Array.isArray(data.activityData)    ? data.activityData    : []
    return {
      ok: true,
      summary: { sleepCount: sleepData.length, activityCount: activityData.length },
      payload: { sleepData, activityData },
    }
  } catch {
    return { ok: false, summary: { sleepCount: 0, activityCount: 0 }, payload: { sleepData: [], activityData: [] }, error: 'Invalid JSON' }
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
      ${type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
      {type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      {message}
    </div>
  )
}

function ImportHistory({ entries }: { entries: ImportHistoryEntry[] }) {
  if (entries.length === 0) return null
  return (
    <div className="mt-6">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Imports</p>
      <div className="space-y-2">
        {entries.map((e) => (
          <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary border border-border">
            <Clock size={14} className="text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{e.filename ?? e.source_format}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(e.imported_at).toLocaleDateString()} · {e.imported_records} imported
                {e.skipped_records > 0 && `, ${e.skipped_records} skipped`}
              </p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              e.status === 'completed' ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'
            }`}>
              {e.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Garmin Tab
// ---------------------------------------------------------------------------

function GarminTab({ onRefreshHistory }: { onRefreshHistory: () => void }) {
  const [step, setStep]         = useState<GarminStep>('upload')
  const [dragging, setDragging] = useState(false)
  const [csvText, setCsvText]   = useState('')
  const [filename, setFilename] = useState('')
  const [preview, setPreview]   = useState<{ headers: string[]; rows: string[][] } | null>(null)
  const [result, setResult]     = useState<ImportResult | null>(null)
  const [toast, setToast]       = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleFile = useCallback((file: File) => {
    setFilename(file.name)
    file.text().then((text) => {
      setCsvText(text)
      setPreview(parseCSVPreview(text))
      setStep('preview')
    })
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleImport = async () => {
    setStep('importing')
    try {
      const formData = new FormData()
      formData.append('file', new Blob([csvText], { type: 'text/csv' }), filename)
      const res = await fetch('/api/import/garmin', { method: 'POST', body: formData })
      const data: ImportResult = await res.json()
      if (!res.ok) throw new Error((data as unknown as { error?: string }).error ?? 'Import failed')
      setResult(data)
      setStep('done')
      showToast(`Imported ${data.imported} activities`, 'success')
      onRefreshHistory()
    } catch (err) {
      setStep('preview')
      showToast(err instanceof Error ? err.message : 'Import failed', 'error')
    }
  }

  const reset = () => { setStep('upload'); setCsvText(''); setFilename(''); setPreview(null); setResult(null) }

  return (
    <div>
      <div className="p-4 mb-4 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-400">
        📤 Export from <strong>Garmin Connect → Health Stats → Activities → Export CSV</strong>
      </div>

      {step === 'upload' && (
        <div
          className={`flex flex-col items-center justify-center gap-3 p-10 rounded-2xl border-2 border-dashed transition-colors cursor-pointer
            ${dragging ? 'border-green-500 bg-green-500/10' : 'border-border hover:border-green-500/50 hover:bg-surface-secondary'}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={32} className="text-green-400" />
          <p className="font-medium">Drop your Garmin CSV here</p>
          <p className="text-sm text-muted-foreground">or click to browse</p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      )}

      {step === 'preview' && preview && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-green-400" />
            <span className="text-sm font-medium">{filename}</span>
            <span className="text-xs text-muted-foreground ml-auto">Preview (first 3 rows)</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border mb-4">
            <table className="text-xs w-full">
              <thead>
                <tr className="bg-surface-secondary">
                  {preview.headers.map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-2 whitespace-nowrap">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <button onClick={reset} className="flex-1 py-2 rounded-xl border border-border text-sm hover:bg-surface-secondary transition-colors">
              Back
            </button>
            <button onClick={handleImport} className="flex-1 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors">
              Import Activities
            </button>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <div className="flex flex-col items-center gap-3 py-10">
          <RefreshCw size={28} className="text-green-400 animate-spin" />
          <p className="text-sm text-muted-foreground">Importing activities…</p>
        </div>
      )}

      {step === 'done' && result && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <CheckCircle2 size={24} className="text-green-400" />
            <div>
              <p className="font-semibold text-green-400">{result.imported} activities imported</p>
              {result.skipped > 0 && <p className="text-xs text-muted-foreground">{result.skipped} skipped</p>}
            </div>
          </div>
          {result.errors && result.errors.length > 0 && (
            <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400 space-y-1">
              {result.errors.slice(0, 3).map((e, i) => <p key={i}>{e}</p>)}
            </div>
          )}
          <button onClick={reset} className="w-full py-2 rounded-xl border border-border text-sm hover:bg-surface-secondary transition-colors">
            Import another file
          </button>
        </div>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Oura Tab
// ---------------------------------------------------------------------------

function OuraTab({ onRefreshHistory }: { onRefreshHistory: () => void }) {
  const [step, setStep]         = useState<OuraStep>('input')
  const [jsonText, setJsonText] = useState('')
  const [filename, setFilename] = useState('')
  const [summary, setSummary]   = useState<OuraSummary | null>(null)
  const [payload, setPayload]   = useState<{ sleepData: unknown[]; activityData: unknown[] } | null>(null)
  const [result, setResult]     = useState<ImportResult | null>(null)
  const [toast, setToast]       = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleParse = useCallback((text: string) => {
    const result = parseOuraJSON(text)
    if (!result.ok) {
      showToast(result.error ?? 'Invalid JSON', 'error')
      return
    }
    setSummary(result.summary)
    setPayload(result.payload)
    setStep('preview')
  }, [])

  const handleFile = useCallback((file: File) => {
    setFilename(file.name)
    file.text().then((text) => {
      setJsonText(text)
      handleParse(text)
    })
  }, [handleParse])

  const handleImport = async () => {
    if (!payload) return
    setStep('importing')
    try {
      const res = await fetch('/api/import/oura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data: ImportResult = await res.json()
      if (!res.ok) throw new Error((data as unknown as { error?: string }).error ?? 'Import failed')
      setResult(data)
      setStep('done')
      showToast(`Imported ${data.imported} days`, 'success')
      onRefreshHistory()
    } catch (err) {
      setStep('preview')
      showToast(err instanceof Error ? err.message : 'Import failed', 'error')
    }
  }

  const reset = () => { setStep('input'); setJsonText(''); setFilename(''); setSummary(null); setPayload(null); setResult(null) }

  return (
    <div>
      <div className="p-4 mb-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-sm text-purple-400">
        📱 Export from <strong>Oura App → Profile → Data Export → Download JSON</strong>
      </div>

      {step === 'input' && (
        <div className="space-y-4">
          <div
            className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-border hover:border-purple-500/50 hover:bg-surface-secondary transition-colors cursor-pointer"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={28} className="text-purple-400" />
            <p className="text-sm font-medium">Upload Oura JSON file</p>
            <p className="text-xs text-muted-foreground">or paste JSON below</p>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
          <div className="text-center text-xs text-muted-foreground">— or —</div>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder='Paste Oura JSON here, e.g. {"sleep":[...],"daily_activity":[...]}'
            className="w-full h-32 p-3 text-xs rounded-xl bg-surface-secondary border border-border font-mono resize-none focus:outline-none focus:border-purple-500 transition-colors"
          />
          <button
            disabled={!jsonText.trim()}
            onClick={() => handleParse(jsonText)}
            className="w-full py-2 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Parse JSON
          </button>
        </div>
      )}

      {step === 'preview' && summary && (
        <div className="space-y-4">
          {filename && (
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-purple-400" />
              <span className="text-sm font-medium">{filename}</span>
            </div>
          )}
          <div className="p-4 rounded-xl bg-surface-secondary border border-border space-y-2">
            <p className="text-sm font-semibold">Found:</p>
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                {summary.sleepCount} sleep records
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                {summary.activityCount} activity records
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={reset} className="flex-1 py-2 rounded-xl border border-border text-sm hover:bg-surface-secondary transition-colors">
              Back
            </button>
            <button
              onClick={handleImport}
              disabled={summary.sleepCount + summary.activityCount === 0}
              className="flex-1 py-2 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import {summary.sleepCount + summary.activityCount} records
            </button>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <div className="flex flex-col items-center gap-3 py-10">
          <RefreshCw size={28} className="text-purple-400 animate-spin" />
          <p className="text-sm text-muted-foreground">Importing records…</p>
        </div>
      )}

      {step === 'done' && result && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <CheckCircle2 size={24} className="text-purple-400" />
            <div>
              <p className="font-semibold text-purple-400">{result.imported} days imported</p>
              {result.skipped > 0 && <p className="text-xs text-muted-foreground">{result.skipped} skipped</p>}
            </div>
          </div>
          <button onClick={reset} className="w-full py-2 rounded-xl border border-border text-sm hover:bg-surface-secondary transition-colors">
            Import another file
          </button>
        </div>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function ImportClient() {
  const [tab, setTab]         = useState<ActiveTab>('garmin')
  const [history, setHistory] = useState<ImportHistoryEntry[]>([])
  const [historyKey, setHistoryKey] = useState(0)

  const supabase = createClient()

  const loadHistory = useCallback(async () => {
    const { data } = await supabase
      .from('import_logs')
      .select('id, imported_at, source_format, filename, imported_records, skipped_records, status')
      .in('source_format', ['garmin_activities', 'garmin_sleep', 'oura_sleep', 'oura_activity', 'garmin', 'oura'])
      .order('imported_at', { ascending: false })
      .limit(3)
    if (data) setHistory(data as ImportHistoryEntry[])
  }, [supabase])

  useEffect(() => { loadHistory() }, [loadHistory, historyKey])

  const refreshHistory = () => setHistoryKey((k) => k + 1)

  const tabs: { id: ActiveTab; label: string; emoji: string }[] = [
    { id: 'garmin', label: 'Garmin', emoji: '🟢' },
    { id: 'oura',   label: 'Oura',   emoji: '🌙' },
  ]

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Import Data</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload exports from Garmin Connect or Oura Ring</p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-surface rounded-2xl p-1 border border-border mb-6">
          {tabs.map(({ id, label, emoji }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all
                ${tab === id ? 'bg-foreground text-background shadow' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <span>{emoji}</span>
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-4 rounded-2xl bg-surface border border-border">
          {tab === 'garmin' && <GarminTab onRefreshHistory={refreshHistory} />}
          {tab === 'oura'   && <OuraTab   onRefreshHistory={refreshHistory} />}
        </div>

        {/* Import history */}
        <ImportHistory entries={history} />
      </div>
    </div>
  )
}
