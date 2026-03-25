'use client'

import { useState, useEffect } from 'react'
import { DateRangePicker, type DateRange } from '@/components/ui/date-range-picker'
import { TrendsClient } from './trends-client'

interface Summary {
  date: string
  steps: number
  active_calories: number
  sleep_duration_minutes?: number
  avg_hrv?: number
  recovery_score?: number
  resting_heart_rate?: number
}

interface TrendsWrapperProps {
  initialSummaries: Summary[]
}

export function TrendsWrapper({ initialSummaries }: TrendsWrapperProps) {
  const [dateRange, setDateRange] = useState<DateRange>()
  const [filteredSummaries, setFilteredSummaries] = useState<Summary[]>(initialSummaries)

  useEffect(() => {
    if (!dateRange) {
      setFilteredSummaries(initialSummaries)
      return
    }

    const filtered = initialSummaries.filter((summary) => {
      const date = new Date(summary.date + 'T00:00:00')
      return date >= dateRange.from && date <= dateRange.to
    })

    setFilteredSummaries(filtered)
  }, [dateRange, initialSummaries])

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Analysis Period</h2>
          <p className="text-sm text-text-secondary">Select date range to filter trends</p>
        </div>
        <DateRangePicker
          value={dateRange}
          onChange={handleDateRangeChange}
          presets={[
            { label: '7 days', value: 7 },
            { label: '30 days', value: 30 },
            { label: '90 days', value: 90 },
          ]}
          defaultDays={90}
        />
      </div>
      <TrendsClient summaries={filteredSummaries} />
    </div>
  )
}
