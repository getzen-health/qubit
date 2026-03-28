"use client"
import React, { useRef, useState } from 'react'
import { Upload, FileText, CheckCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

const METRIC_OPTIONS = [
  { value: 'steps', label: 'Steps' },
  { value: 'heart_rate', label: 'Heart Rate' },
  { value: 'weight', label: 'Weight' },
  { value: 'sleep_duration_minutes', label: 'Sleep (minutes)' },
  { value: 'active_calories', label: 'Active Calories' },
  { value: 'distance_km', label: 'Distance (km)' },
  { value: 'body_fat', label: 'Body Fat %' },
  { value: 'hrv', label: 'HRV' },
  { value: 'resting_heart_rate', label: 'Resting HR' },
  { value: 'blood_pressure_systolic', label: 'BP Systolic' },
  { value: 'blood_pressure_diastolic', label: 'BP Diastolic' },
  { value: 'oxygen_saturation', label: 'Oxygen Saturation' },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function ImportPage() {
  // Apple Health
  const [appleFile, setAppleFile] = useState<File | null>(null)
  const [appleProgress, setAppleProgress] = useState<string | null>(null)
  const [appleResult, setAppleResult] = useState<any>(null)
  const [appleError, setAppleError] = useState<string | null>(null)
  const appleInputRef = useRef<HTMLInputElement>(null)

  // CSV
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvMetric, setCsvMetric] = useState<string>('steps')
  const [csvPreview, setCsvPreview] = useState<string[][]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvDateCol, setCsvDateCol] = useState<string>('date')
  const [csvValueCol, setCsvValueCol] = useState<string>('value')
  const [csvProgress, setCsvProgress] = useState<string | null>(null)
  const [csvResult, setCsvResult] = useState<any>(null)
  const [csvError, setCsvError] = useState<string | null>(null)
  const csvInputRef = useRef<HTMLInputElement>(null)

  // Apple Health Handlers
  const handleAppleFile = (file: File | null) => {
    setAppleFile(file)
    setAppleResult(null)
    setAppleError(null)
    setAppleProgress(null)
  }
  const handleAppleImport = async () => {
    if (!appleFile) return
    setAppleProgress('Importing...')
    setAppleError(null)
    setAppleResult(null)
    const form = new FormData()
    form.append('file', appleFile)
    try {
      const res = await fetch('/api/import/apple-health', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')
      setAppleResult(data)
      setAppleProgress(null)
    } catch (e: any) {
      setAppleError(e.message)
      setAppleProgress(null)
    }
  }

  // CSV Handlers
  const handleCsvFile = (file: File | null) => {
    setCsvFile(file)
    setCsvResult(null)
    setCsvError(null)
    setCsvProgress(null)
    setCsvPreview([])
    setCsvHeaders([])
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
        if (lines.length > 0) {
          const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''))
          setCsvHeaders(headers)
          setCsvDateCol(headers[0] || 'date')
          setCsvValueCol(headers[1] || 'value')
          setCsvPreview(lines.slice(0, 4).map(l => l.split(',').map(c => c.trim().replace(/['"]/g, ''))))
        }
      }
      reader.readAsText(file)
    }
  }
  const handleCsvImport = async () => {
    if (!csvFile) return
    setCsvProgress('Importing...')
    setCsvError(null)
    setCsvResult(null)
    const form = new FormData()
    form.append('file', csvFile)
    form.append('metric_type', csvMetric)
    form.append('date_column', csvDateCol)
    form.append('value_column', csvValueCol)
    try {
      const res = await fetch('/api/import/csv', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')
      setCsvResult(data)
      setCsvProgress(null)
    } catch (e: any) {
      setCsvError(e.message)
      setCsvProgress(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-text-primary">📥 Import Health Data</h1>
      {/* Apple Health Import */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-2 text-text-primary">Apple Health Import</h2>
        <p className="text-text-secondary mb-2">Export from iPhone Health app → Share → <span className="font-mono">export.xml</span></p>
        <div className="flex items-center gap-4 mb-2">
          <input
            ref={appleInputRef}
            type="file"
            accept=".xml"
            className="hidden"
            onChange={e => handleAppleFile(e.target.files?.[0] || null)}
          />
          <button
            className="px-4 py-2 bg-surface border border-border rounded-2xl text-text-primary flex items-center gap-2 hover:bg-surface-secondary"
            onClick={() => appleInputRef.current?.click()}
          >
            <Upload className="w-5 h-5" />
            {appleFile ? appleFile.name : 'Choose XML File'}
          </button>
          {appleFile && (
            <button
              className="px-4 py-2 bg-primary text-white rounded-2xl hover:bg-primary/90"
              onClick={handleAppleImport}
              disabled={!!appleProgress}
            >
              Import
            </button>
          )}
        </div>
        {appleProgress && <div className="text-sm text-text-secondary">{appleProgress}</div>}
        {appleResult && (
          <div className="mt-2 text-green-700 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> {appleResult.message || `Imported ${appleResult.total_inserted} records`}</div>
        )}
        {appleError && (
          <div className="mt-2 text-red-600 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> {appleError}</div>
        )}
      </section>

      {/* CSV Import */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-2 text-text-primary">CSV Import</h2>
        <p className="text-text-secondary mb-2">Upload CSV from Fitbit, Garmin, or other sources. Minimum columns: <span className="font-mono">Date</span>, <span className="font-mono">Value</span></p>
        <div className="flex items-center gap-4 mb-2">
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={e => handleCsvFile(e.target.files?.[0] || null)}
          />
          <button
            className="px-4 py-2 bg-surface border border-border rounded-2xl text-text-primary flex items-center gap-2 hover:bg-surface-secondary"
            onClick={() => csvInputRef.current?.click()}
          >
            <Upload className="w-5 h-5" />
            {csvFile ? csvFile.name : 'Choose CSV File'}
          </button>
          <select
            className="px-2 py-2 border border-border rounded-2xl bg-surface text-text-primary"
            value={csvMetric}
            onChange={e => setCsvMetric(e.target.value)}
          >
            {METRIC_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {csvPreview.length > 0 && (
          <div className="mb-2">
            <div className="flex gap-2 mb-1">
              <span className="text-xs text-text-secondary">Column mapping:</span>
              <select
                className="px-1 py-0.5 border border-border rounded bg-surface text-xs"
                value={csvDateCol}
                onChange={e => setCsvDateCol(e.target.value)}
              >
                {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              <span className="text-xs text-text-secondary">as Date,</span>
              <select
                className="px-1 py-0.5 border border-border rounded bg-surface text-xs"
                value={csvValueCol}
                onChange={e => setCsvValueCol(e.target.value)}
              >
                {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              <span className="text-xs text-text-secondary">as Value</span>
            </div>
            <table className="w-full text-xs border border-border rounded mb-2">
              <thead>
                <tr>
                  {csvHeaders.map(h => <th key={h} className="px-2 py-1 border-b border-border text-left">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {csvPreview.slice(1).map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => <td key={j} className="px-2 py-1 border-b border-border">{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              className="px-4 py-2 bg-primary text-white rounded-2xl hover:bg-primary/90"
              onClick={handleCsvImport}
              disabled={!!csvProgress}
            >
              Import
            </button>
          </div>
        )}
        {csvProgress && <div className="text-sm text-text-secondary">{csvProgress}</div>}
        {csvResult && (
          <div className="mt-2 text-green-700 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> {csvResult.success ? `Imported ${csvResult.total_inserted} records` : csvResult.message}</div>
        )}
        {csvError && (
          <div className="mt-2 text-red-600 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> {csvError}</div>
        )}
      </section>

      <div className="text-xs text-text-secondary mt-8">
        <div className="mb-2">Format Guide:</div>
        <div className="mb-1"><b>Apple Health:</b> Use <span className="font-mono">export.xml</span> from iOS Health app export.</div>
        <div><b>CSV:</b> Minimum columns: <span className="font-mono">Date</span>, <span className="font-mono">Value</span>. Other columns are ignored.</div>
      </div>
      <div className="mt-8">
        <Link href="/settings" className="text-primary underline">← Back to Settings</Link>
      </div>
    </div>
  )
}

