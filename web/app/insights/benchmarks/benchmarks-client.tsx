'use client'

interface Norms {
  p25: number
  p50: number
  p75: number
}

interface Metric {
  key: string
  label: string
  value: number | null
  unit: string
  norms: Norms
  higherIsBetter: boolean
  icon: string
  insight: string | null
  percentile: number | null
}

interface Props {
  metrics: Metric[]
  age: number
  sex: string
}

function PercentileBar({ value, percentile }: { value: number; percentile: number }) {
  const color =
    percentile >= 75 ? 'bg-green-500' :
    percentile >= 50 ? 'bg-blue-500' :
    percentile >= 25 ? 'bg-yellow-500' : 'bg-red-400'

  const label =
    percentile >= 75 ? 'Top 25%' :
    percentile >= 50 ? 'Above average' :
    percentile >= 25 ? 'Below average' : 'Bottom 25%'

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-text-secondary">
        <span>Population percentile</span>
        <span className="font-semibold text-text-primary">{label}</span>
      </div>
      <div className="relative h-3 bg-surface-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${percentile}%` }}
        />
        {/* Median marker */}
        <div className="absolute top-0 left-1/2 w-0.5 h-full bg-border opacity-60" />
      </div>
      <div className="flex justify-between text-xs text-text-muted">
        <span>0</span>
        <span>50th</span>
        <span>100th</span>
      </div>
    </div>
  )
}

export function BenchmarksClient({ metrics, age, sex }: Props) {
  return (
    <div className="space-y-4">
      <div className="bg-surface rounded-xl border border-border px-4 py-3 text-xs text-text-secondary">
        Based on your profile: <span className="font-medium text-text-primary">{age} yrs · {sex}</span>. 
        Benchmarks from CDC, AHA, and WHO population studies. Showing 30-day averages.
      </div>

      {metrics.map((m) => (
        <div key={m.key} className="bg-surface rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{m.icon}</span>
              <div>
                <h3 className="font-semibold text-text-primary">{m.label}</h3>
                {m.value !== null ? (
                  <p className="text-2xl font-bold text-text-primary leading-tight">
                    {typeof m.value === 'number' && m.value % 1 !== 0
                      ? m.value.toFixed(1)
                      : m.value}
                    <span className="text-sm font-normal text-text-secondary ml-1">{m.unit}</span>
                  </p>
                ) : (
                  <p className="text-sm text-text-muted italic">No data yet</p>
                )}
              </div>
            </div>
            {m.percentile !== null && (
              <div className="text-right">
                <span className={`text-2xl font-bold ${
                  m.percentile >= 75 ? 'text-green-500' :
                  m.percentile >= 50 ? 'text-blue-500' :
                  m.percentile >= 25 ? 'text-yellow-500' : 'text-red-400'
                }`}>{m.percentile}th</span>
                <p className="text-xs text-text-secondary">percentile</p>
              </div>
            )}
          </div>

          {m.value !== null && m.percentile !== null && (
            <PercentileBar value={m.value} percentile={m.percentile} />
          )}

          {/* Population norms reference */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: '25th %ile', val: m.norms.p25 },
              { label: 'Median', val: m.norms.p50 },
              { label: '75th %ile', val: m.norms.p75 },
            ].map(({ label, val }) => (
              <div key={label} className="bg-surface-secondary rounded-xl py-2 px-1">
                <p className="text-xs text-text-secondary">{label}</p>
                <p className="text-sm font-semibold text-text-primary">
                  {typeof val === 'number' && val % 1 !== 0 ? val.toFixed(1) : val}
                </p>
              </div>
            ))}
          </div>

          {m.insight && (
            <p className="text-xs text-text-secondary bg-surface-secondary rounded-xl px-3 py-2">
              💡 {m.insight}
            </p>
          )}

          {m.value === null && (
            <p className="text-xs text-text-muted text-center py-2">
              Log {m.label.toLowerCase()} data to see where you rank
            </p>
          )}
        </div>
      ))}

      <p className="text-xs text-text-muted text-center pb-4">
        Reference ranges are population averages and not medical advice. Consult your doctor for personalised guidance.
      </p>
    </div>
  )
}
