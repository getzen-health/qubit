'use client'

import { useState } from 'react'
import { FileText, Download, Loader2, CheckCircle } from 'lucide-react'
import { PaywallBanner } from '@/components/paywall-banner'
import { useIsPro } from '@/lib/subscription'

const DATE_OPTIONS = [
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 60 days', days: 60 },
  { label: 'Last 90 days', days: 90 },
]

const INCLUDED_METRICS = [
  { icon: '👣', label: 'Daily Steps & Active Calories' },
  { icon: '😴', label: 'Sleep Duration Averages' },
  { icon: '❤️', label: 'Resting Heart Rate & HRV' },
  { icon: '🤖', label: 'AI Health Insights (last 5)' },
  { icon: '🏃', label: 'Exercise Minutes' },
]

export function ReportClient() {
  const isPro = useIsPro()
  const [selectedDays, setSelectedDays] = useState(30)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDownload() {
    setIsGenerating(true)
    setError(null)
    try {
      const res = await fetch(`/api/report/pdf?days=${selectedDays}`)
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? `HTTP ${res.status}`)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'getzen-health-report.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-accent/10">
            <FileText className="w-6 h-6 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Health Report</h1>
        </div>
        <p className="text-text-secondary text-sm">Share with your doctor</p>
      </div>

      {!isPro && (
        <div className="mb-6">
          <PaywallBanner feature="Doctor Report" />
        </div>
      )}

      {/* Date range selector */}
      <div className="mb-6">
        <p className="text-sm font-medium text-text-primary mb-3">Date range</p>
        <div className="flex gap-2 flex-wrap">
          {DATE_OPTIONS.map(({ label, days }) => (
            <button
              key={days}
              onClick={() => setSelectedDays(days)}
              disabled={!isPro}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedDays === days
                  ? 'bg-accent text-white'
                  : 'bg-surface border border-border text-text-secondary hover:border-accent/50 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* What's included */}
      <div className="mb-6 rounded-xl border border-border bg-surface p-4">
        <p className="text-sm font-semibold text-text-primary mb-3">
          What's included
        </p>
        <ul className="space-y-2">
          {INCLUDED_METRICS.map(({ icon, label }) => (
            <li key={label} className="flex items-center gap-2 text-sm text-text-secondary">
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
              <span>
                {icon} {label}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-text-secondary border-t border-border pt-3">
          Generates a clean A4 PDF suitable for sharing with your healthcare provider.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={!isPro || isGenerating}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-white font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating…
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Download PDF Report
          </>
        )}
      </button>

      <p className="mt-3 text-center text-xs text-text-secondary">
        This report is for informational purposes only and does not constitute medical advice.
      </p>
    </div>
  )
}
