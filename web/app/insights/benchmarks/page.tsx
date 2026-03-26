'use client'
import { useEffect, useState } from 'react'

export default function BenchmarksPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cohort/compare').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return <div className="flex items-center justify-center min-h-screen text-text-secondary">Loading comparisons...</div>

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Health Benchmarks</h1>
        <p className="text-sm text-text-secondary mb-2">
          How you compare to others in your age group ({data?.age_group})
        </p>
        <p className="text-xs text-text-secondary mb-6 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
          🔒 Comparisons use anonymized population norms (NHANES 2017-2020). Your data is never shared.
        </p>

        <div className="space-y-4">
          {data?.comparisons?.map((c: any) => (
            <div key={c.metric} className="bg-white rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{c.icon}</span>
                  <div>
                    <div className="font-semibold text-text-primary text-sm">{c.label}</div>
                    <div className="text-xs text-text-secondary">{c.age_group} age group (7-day avg)</div>
                  </div>
                </div>
                {c.has_data ? (
                  <div className="text-right">
                    <div className="font-bold text-text-primary">{c.user_value} <span className="text-xs text-text-secondary">{c.unit}</span></div>
                    {c.percentile !== null && (
                      <div className="text-xs font-medium text-primary">Top {100 - c.percentile}%</div>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-text-secondary">No data</span>
                )}
              </div>

              {c.has_data && c.percentile !== null && (
                <>
                  {/* Percentile bar */}
                  <div className="relative h-3 bg-gray-100 rounded-full mb-2">
                    <div
                      className="h-3 rounded-full transition-all"
                      style={{
                        width: `${c.percentile}%`,
                        background: c.percentile >= 70 ? '#10b981' : c.percentile >= 40 ? '#f59e0b' : '#ef4444'
                      }}
                    />
                    {/* Marker */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-primary shadow"
                      style={{ left: `calc(${c.percentile}% - 8px)` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-text-secondary mb-2">
                    <span>Bottom</span><span>Average</span><span>Top</span>
                  </div>
                  <p className="text-xs text-text-secondary">{c.insight}</p>
                </>
              )}

              {!c.has_data && (
                <p className="text-xs text-text-secondary">Start tracking {c.label.toLowerCase()} to see how you compare.</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 text-xs text-text-secondary text-center">
          Data sourced from NHANES 2017–2020 population health surveys
        </div>
      </div>
    </div>
  )
}
