'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'

interface MonthlySummary {
  month: string
  year: number
  month_num: number
  avg_steps: number
  total_steps: number
  avg_sleep_minutes: number
  avg_recovery_score: number
  days_recorded: number
}

interface YearlySummary {
  year: number
  total_days_recorded: number
  avg_daily_steps: number
  total_steps: number
  best_month_steps: number
  worst_month_steps: number
  avg_sleep_hours: number
  avg_recovery_score: number
  months_with_data: number
}

export default function MonthlyReportPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummary[]>([])
  const [yearlySummary, setYearlySummary] = useState<YearlySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [exportSchedule, setExportSchedule] = useState<'none' | 'weekly' | 'monthly'>('none')

  const supabase = createClient()

  useEffect(() => {
    const fetchMonthlyData = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          setError('Not authenticated')
          setLoading(false)
          return
        }

        const response = await fetch(
          `/api/health/monthly?year=${year}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch monthly data')
        }

        const data = await response.json()

        // Transform data for charts
        const chartData = data.monthly_data.map((month: any) => ({
          month: new Date(month.month).toLocaleString('default', { month: 'short' }),
          month_num: month.month_num,
          avg_steps: month.avg_steps,
          total_steps: month.total_steps,
          avg_sleep_minutes: month.avg_sleep_minutes,
          avg_recovery_score: month.avg_recovery_score,
          days_recorded: month.days_recorded,
        }))

        setMonthlySummaries(chartData)
        setYearlySummary(data.yearly_summary)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchMonthlyData()
  }, [year])

  const handleDownloadPdf = async () => {
    setExportingPdf(true)
    try {
      const response = await fetch('/api/reports/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `health-report-${year}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download PDF')
    } finally {
      setExportingPdf(false)
    }
  }

  const handleExportSchedule = async (schedule: 'none' | 'weekly' | 'monthly') => {
    setExportSchedule(schedule)
    try {
      const response = await fetch('/api/profile/export-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ export_schedule: schedule }),
      })

      if (!response.ok) {
        throw new Error('Failed to update export schedule')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update schedule')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 -ml-2 rounded-lg hover:bg-surface-secondary transition-colors"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <h1 className="text-2xl font-bold text-text-primary">Monthly Report</h1>
          </div>
          <button
            onClick={handleDownloadPdf}
            disabled={exportingPdf}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors"
            aria-label="Download as PDF"
          >
            <Download className="w-4 h-4" />
            {exportingPdf ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* Year Selector and Export Schedule */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setYear(year - 1)}
              className="px-3 py-2 bg-surface rounded-lg border border-border hover:bg-surface-secondary transition-colors"
            >
              ←
            </button>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-text-primary">{year}</h2>
            </div>
            <button
              onClick={() => setYear(year + 1)}
              className="px-3 py-2 bg-surface rounded-lg border border-border hover:bg-surface-secondary transition-colors"
            >
              →
            </button>
          </div>

          {/* Export Schedule Selector */}
          <div className="bg-surface rounded-lg border border-border p-3">
            <label className="text-sm font-medium text-text-secondary block mb-2">
              📧 Auto-Export Schedule
            </label>
            <select
              value={exportSchedule}
              onChange={(e) => handleExportSchedule(e.target.value as 'none' | 'weekly' | 'monthly')}
              className="w-full bg-surface-secondary rounded-lg px-3 py-2 text-sm text-text-primary border border-border focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="none">Disabled</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <p className="text-xs text-text-secondary mt-1">
              {exportSchedule === 'none' ? 'No automatic exports' : `Reports emailed ${exportSchedule}ly`}
            </p>
          </div>
        </div>

        {/* Yearly Summary Cards */}
        {yearlySummary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface rounded-lg border border-border p-4 space-y-2">
              <p className="text-xs text-text-secondary uppercase tracking-wide">Avg Daily Steps</p>
              <p className="text-2xl font-bold text-text-primary">
                {yearlySummary.avg_daily_steps.toLocaleString()}
              </p>
            </div>
            <div className="bg-surface rounded-lg border border-border p-4 space-y-2">
              <p className="text-xs text-text-secondary uppercase tracking-wide">Avg Sleep</p>
              <p className="text-2xl font-bold text-text-primary">{yearlySummary.avg_sleep_hours}h</p>
            </div>
            <div className="bg-surface rounded-lg border border-border p-4 space-y-2">
              <p className="text-xs text-text-secondary uppercase tracking-wide">Best Month</p>
              <p className="text-2xl font-bold text-text-primary">
                {(yearlySummary.best_month_steps / 1000).toFixed(0)}k steps
              </p>
            </div>
            <div className="bg-surface rounded-lg border border-border p-4 space-y-2">
              <p className="text-xs text-text-secondary uppercase tracking-wide">Months Tracked</p>
              <p className="text-2xl font-bold text-text-primary">{yearlySummary.months_with_data}</p>
            </div>
          </div>
        )}

        {/* Monthly Steps Chart */}
        <div className="bg-surface rounded-lg border border-border p-6 space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Monthly Step Totals</h3>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySummaries} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #444' }}
                  formatter={(value: number) => value.toLocaleString()}
                  labelFormatter={(label: string) => `${label} ${year}`}
                />
                <Bar dataKey="total_steps" fill="#a855f7" name="Total Steps" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Sleep Trend */}
        <div className="bg-surface rounded-lg border border-border p-6 space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Average Sleep per Month</h3>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySummaries} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #444' }}
                  formatter={(value: number) => [(value / 60).toFixed(1), 'Hours']}
                  labelFormatter={(label: string) => `${label} ${year}`}
                />
                <Line
                  type="monotone"
                  dataKey="avg_sleep_minutes"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: '#22c55e', r: 4 }}
                  name="Avg Sleep"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Stats Table */}
        <div className="bg-surface rounded-lg border border-border p-6 space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Month-by-Month Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left py-3 px-4 text-text-secondary">Month</th>
                  <th className="text-right py-3 px-4 text-text-secondary">Avg Steps</th>
                  <th className="text-right py-3 px-4 text-text-secondary">Total Steps</th>
                  <th className="text-right py-3 px-4 text-text-secondary">Avg Sleep</th>
                  <th className="text-right py-3 px-4 text-text-secondary">Recovery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {monthlySummaries.map((month, idx) => (
                  <tr key={idx} className="hover:bg-surface-secondary transition-colors">
                    <td className="py-3 px-4 text-text-primary">{month.month}</td>
                    <td className="py-3 px-4 text-right text-text-primary">
                      {month.avg_steps.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-text-primary">
                      {month.total_steps.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-text-primary">
                      {(month.avg_sleep_minutes / 60).toFixed(1)}h
                    </td>
                    <td className="py-3 px-4 text-right text-text-primary">
                      {month.avg_recovery_score ? month.avg_recovery_score.toFixed(1) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
