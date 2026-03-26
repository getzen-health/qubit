'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface CorrelationData {
  metrics: string[]
  values: number[][]
  data_points: number
  date_range: { start: string; end: string }
}

const metricLabels: Record<string, string> = {
  steps: 'Steps',
  sleep: 'Sleep Duration',
  hrv: 'HRV',
  resting_hr: 'Resting HR',
  calories: 'Active Calories',
  recovery_score: 'Recovery Score',
}

function getCorrelationColor(value: number): string {
  if (value > 0.5) return 'bg-green-100 text-green-900'
  if (value > 0.2) return 'bg-lime-50 text-lime-900'
  if (value > -0.2) return 'bg-gray-50 text-gray-700'
  if (value > -0.5) return 'bg-orange-50 text-orange-900'
  return 'bg-red-100 text-red-900'
}

export default function CorrelationsPage() {
  const [days, setDays] = useState(90)
  const [correlations, setCorrelations] = useState<CorrelationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchCorrelations = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          setError('Not authenticated')
          setLoading(false)
          return
        }

        const response = await fetch(`/api/health/correlations?days=${days}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch correlation data')
        }

        const data = await response.json()
        setCorrelations(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchCorrelations()
  }, [days, supabase.auth])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            <p className="text-gray-600">Loading correlation data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            <p className="text-red-600">Error: {error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!correlations) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            <p className="text-gray-600">No data available</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/reports/monthly"
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6 font-medium"
        >
          <ArrowLeft size={18} />
          Back to Reports
        </Link>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 sm:px-8 py-6 sm:py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Health Correlation Matrix</h1>
                <p className="text-indigo-100 mt-2">
                  Pearson correlation coefficients for last {days} days ({correlations.data_points} days of data)
                </p>
              </div>

              <div className="flex gap-2">
                {[30, 90, 180, 365].map(d => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      days === d
                        ? 'bg-white text-indigo-600 shadow-md'
                        : 'bg-indigo-500 text-white hover:bg-indigo-400'
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8">
            {correlations.data_points === 0 ? (
              <p className="text-gray-600 text-center py-8">
                Not enough data to calculate correlations. Please wait for more health data to be synced.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="bg-gray-50 p-2 sm:p-3 text-left border border-gray-200" />
                      {correlations.metrics.map(metric => (
                        <th
                          key={metric}
                          className="bg-gray-50 p-2 sm:p-3 text-center text-xs sm:text-sm font-semibold border border-gray-200 text-gray-700 max-w-[60px] sm:max-w-[100px]"
                        >
                          <div className="truncate">{metricLabels[metric] || metric}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {correlations.metrics.map((rowMetric, i) => (
                      <tr key={rowMetric}>
                        <td className="bg-gray-50 p-2 sm:p-3 text-xs sm:text-sm font-semibold border border-gray-200 text-gray-700 sticky left-0 z-10 whitespace-nowrap max-w-[100px]">
                          {metricLabels[rowMetric] || rowMetric}
                        </td>
                        {correlations.values[i].map((value, j) => (
                          <td
                            key={`${i}-${j}`}
                            className={`p-2 sm:p-3 text-center border border-gray-200 text-xs sm:text-sm font-semibold ${getCorrelationColor(
                              value
                            )}`}
                          >
                            {value.toFixed(2)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Legend */}
            <div className="mt-8 bg-gray-50 rounded-lg p-4 sm:p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Interpretation</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-100 rounded" />
                  <span className="text-gray-700">Strong positive (0.5+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-lime-50 rounded" />
                  <span className="text-gray-700">Weak positive (0.2-0.5)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-50 rounded border border-gray-200" />
                  <span className="text-gray-700">No correlation (-0.2 to 0.2)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-orange-50 rounded" />
                  <span className="text-gray-700">Weak negative (-0.5 to -0.2)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-100 rounded" />
                  <span className="text-gray-700">Strong negative (-0.5-)</span>
                </div>
              </div>

              <p className="text-gray-600 mt-4 text-xs sm:text-sm">
                <strong>Example:</strong> A positive correlation between sleep and HRV means longer sleep is associated with higher HRV.
                A negative correlation between stress and sleep means higher stress is associated with shorter sleep.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
