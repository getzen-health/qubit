'use client'
import { useState } from 'react'
import { generateHealthReportPDF, HealthReportData } from '@/lib/generate-pdf-report'

export default function ReportsPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/reports/health-summary')
      if (!res.ok) throw new Error('Failed to fetch health data')
      const data: HealthReportData = await res.json()
      generateHealthReportPDF(data)
      setGenerated(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-8">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Health Reports</h1>
        <p className="text-text-secondary mb-8">Export your health data as a professional PDF report</p>

        {/* Main report card */}
        <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="text-4xl">📋</div>
            <div>
              <h2 className="font-semibold text-text-primary text-lg">30-Day Health Summary</h2>
              <p className="text-text-secondary text-sm mt-1">Includes activity, sleep, vitals, mood, lab results, and workout history</p>
            </div>
          </div>

          {/* What's included */}
          <div className="space-y-2 mb-6">
            {[
              ['📊', 'Activity & Workouts', 'Steps, active days, workout sessions'],
              ['😴', 'Sleep Analysis', 'Average duration, nights tracked'],
              ['❤️', 'Vitals', 'Resting HR, weight trends'],
              ['😊', 'Mood & Wellbeing', 'Average mood score, check-in count'],
              ['🧪', 'Lab Results', 'Recent biomarkers with status'],
              ['🏋️', 'Workout Log', 'Last 5 workout sessions'],
            ].map(([icon, title, desc]) => (
              <div key={title} className="flex items-center gap-3">
                <span className="text-lg">{icon}</span>
                <div>
                  <span className="text-sm font-medium text-text-primary">{title}</span>
                  <span className="text-xs text-text-secondary ml-2">{desc}</span>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-red-600 text-sm">⚠️ {error}</p>
            </div>
          )}

          {generated && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
              <p className="text-green-700 text-sm font-medium">✅ Report downloaded successfully!</p>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-primary text-white py-4 rounded-xl font-semibold text-base disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <span className="animate-spin">⏳</span> Generating report…
              </>
            ) : (
              <>📥 Download PDF Report</>
            )}
          </button>
        </div>

        {/* Privacy note */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">🔒</span>
            <div>
              <p className="text-sm font-medium text-text-primary">Your data stays private</p>
              <p className="text-xs text-text-secondary mt-1">The PDF is generated entirely on your device. Nothing is sent to external servers.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
