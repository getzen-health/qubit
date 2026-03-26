'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
interface WaterChartProps { data: Array<{ date: string; ml: number }> }
export function WaterChart({ data }: WaterChartProps) {
  return (
    <div className="rounded-xl border border-border p-4">
      <h3 className="text-sm font-semibold mb-3">Last 7 Days</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data}>
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} unit="ml" />
          <Tooltip formatter={(v: number) => [`${v}ml`, 'Water']} />
          <ReferenceLine y={2000} stroke="#3b82f6" strokeDasharray="4 2" label={{ value: 'Goal', fontSize: 10 }} />
          <Bar dataKey="ml" fill="#3b82f6" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
