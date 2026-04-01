'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Loader } from 'lucide-react'

const EXPORT_OPTIONS = [
  { days: 30, label: 'Last 30 Days', desc: 'Recent health data' },
  { days: 90, label: 'Last 90 Days', desc: '3-month health history' },
  { days: 365, label: 'Last 365 Days', desc: 'Full year of health data' },
]

const FORMATS = [
  { value: 'csv', label: 'CSV' },
  { value: 'json', label: 'JSON' },
]

export default function DataExportPage() {
  const [selectedDays, setSelectedDays] = useState(30)
  const [selectedFormat, setSelectedFormat] = useState('csv')
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const handleExport = async () => {
    setIsExporting(true)
    setExportError(null)

    try {
      const response = await fetch(`/api/health/export?days=${selectedDays}&format=${selectedFormat}`)
      if (!response.ok) {
        const error = await response.json()
        setExportError(error.error || 'Export failed')
        return
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `getzen_health_${selectedDays}d.${selectedFormat}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/settings"
            className="p-2 -ml-2 rounded-lg hover:bg-surface-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <h1 className="text-xl font-bold text-text-primary">Export Health Data</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <div className="space-y-6">
          {/* Description */}
          <p className="text-text-secondary">
            Download your consolidated health data including steps, calories, heart rate, sleep, and weight.
          </p>

          {/* Time Period Selection */}
          <div>
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Time Period</h2>
            <div className="space-y-2">
              {EXPORT_OPTIONS.map(({ days, label, desc }) => (
                <button
                  key={days}
                  onClick={() => setSelectedDays(days)}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                    selectedDays === days
                      ? 'bg-accent/10 border-accent'
                      : 'bg-surface border-border hover:bg-surface-secondary'
                  }`}
                >
                  <div className="flex-1 text-left">
                    <p className="font-medium text-text-primary">{label}</p>
                    <p className="text-sm text-text-secondary">{desc}</p>
                  </div>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedDays === days
                      ? 'bg-accent border-accent'
                      : 'border-border'
                  }`}>
                    {selectedDays === days && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">File Format</h2>
            <div className="flex gap-2">
              {FORMATS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSelectedFormat(value)}
                  className={`px-4 py-3 rounded-lg border font-medium transition-colors ${
                    selectedFormat === value
                      ? 'bg-accent text-white border-accent'
                      : 'bg-surface border-border hover:bg-surface-secondary text-text-primary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {exportError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{exportError}</p>
            </div>
          )}

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-accent text-white rounded-lg font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Export Data
              </>
            )}
          </button>

          {/* Info Box */}
          <div className="p-4 bg-surface-secondary rounded-lg border border-border">
            <p className="text-sm text-text-secondary">
              <span className="font-semibold">Included fields:</span> Date, steps, calories, distance, resting heart rate, HRV, sleep hours, and weight.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
