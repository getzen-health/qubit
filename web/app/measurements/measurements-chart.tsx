'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
interface MeasurementsChartProps { data: Array<{ date: string; weight_kg: number }> }
export function MeasurementsChart({ data }: MeasurementsChartProps) {
  return (
    <div className="rounded-xl border border-border p-4">
      <h3 className="text-sm font-semibold mb-3">Weight Trend</h3>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} unit="kg" domain={['auto', 'auto']} />
          <Tooltip formatter={(v: number) => [`${v}kg`, 'Weight']} />
          <Line type="monotone" dataKey="weight_kg" stroke="#8b5cf6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
