'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, AlertCircle, CheckCircle, X } from 'lucide-react'

interface Anomaly {
  id: string
  metric: string
  value: number
  avg_value: number
  deviation: number
  severity: 'low' | 'medium' | 'high'
  claude_explanation: string | null
  detected_at: string
  dismissed_at: string | null
}

function getMetricLabel(metric: string): string {
  const labels: Record<string, string> = {
    avg_hrv: 'Heart Rate Variability',
    resting_heart_rate: 'Resting Heart Rate',
    sleep_duration_minutes: 'Sleep Duration',
    steps: 'Step Count',
  }
  return labels[metric] ?? metric
}

function getMetricUnit(metric: string): string {
  const units: Record<string, string> = {
    avg_hrv: 'ms',
    resting_heart_rate: 'bpm',
    sleep_duration_minutes: 'hours',
    steps: 'steps',
  }
  return units[metric] ?? ''
}

function formatValue(metric: string, value: number): string {
  if (metric === 'sleep_duration_minutes') {
    return `${(value / 60).toFixed(1)} hours`
  }
  return `${Math.round(value)}`
}

function getSeverityIcon(severity: string) {
  switch (severity) {
    case 'high':
      return <AlertTriangle className="w-5 h-5 text-red-500" />
    case 'medium':
      return <AlertCircle className="w-5 h-5 text-yellow-500" />
    default:
      return <CheckCircle className="w-5 h-5 text-blue-500" />
  }
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'high':
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
    case 'medium':
      return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
    default:
      return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
  }
}

export function AnomalyAlertBanner() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [visibleAnomalies, setVisibleAnomalies] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAnomalies = async () => {
      try {
        const response = await fetch('/api/anomalies')
        if (response.ok) {
          const data = await response.json()
          setAnomalies(data.anomalies ?? [])
          setVisibleAnomalies(new Set((data.anomalies ?? []).map((a: Anomaly) => a.id)))
        }
      } catch (err) {
        console.error('Failed to fetch anomalies:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnomalies()
  }, [])

  const handleDismiss = async (id: string) => {
    try {
      const response = await fetch('/api/anomalies/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (response.ok) {
        const newVisible = new Set(visibleAnomalies)
        newVisible.delete(id)
        setVisibleAnomalies(newVisible)
      }
    } catch (err) {
      console.error('Failed to dismiss anomaly:', err)
    }
  }

  if (isLoading || visibleAnomalies.size === 0) {
    return null
  }

  const displayedAnomalies = anomalies.filter(a => visibleAnomalies.has(a.id))

  return (
    <div className="space-y-3">
      {displayedAnomalies.map(anomaly => (
        <div
          key={anomaly.id}
          className={`relative p-4 rounded-lg border ${getSeverityColor(anomaly.severity)}`}
        >
          <div className="flex items-start gap-4">
            <div className="pt-1">{getSeverityIcon(anomaly.severity)}</div>
            <div className="flex-1">
              <h3 className="font-semibold text-text-primary mb-1">
                {getMetricLabel(anomaly.metric)}
              </h3>
              <p className="text-sm text-text-secondary mb-2">
                {anomaly.deviation > 0 ? 'Higher' : 'Lower'} than usual: {formatValue(anomaly.metric, anomaly.value)} vs {formatValue(anomaly.metric, anomaly.avg_value)} average
              </p>
              {anomaly.claude_explanation && (
                <p className="text-sm text-text-secondary italic">
                  {anomaly.claude_explanation}
                </p>
              )}
            </div>
            <button
              onClick={() => handleDismiss(anomaly.id)}
              className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
