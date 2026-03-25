'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DateRange {
  from: Date
  to: Date
}

interface DateRangePickerProps {
  value?: DateRange
  onChange: (range: DateRange) => void
  presets?: Array<{ label: string; value: number }>
  defaultDays?: number
  className?: string
}

export function DateRangePicker({
  value,
  onChange,
  presets = [
    { label: '7 days', value: 7 },
    { label: '30 days', value: 30 },
    { label: '90 days', value: 90 },
  ],
  defaultDays = 7,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')

  // Initialize with value or default
  useEffect(() => {
    if (value) {
      setFromDate(formatDateToInput(value.from))
      setToDate(formatDateToInput(value.to))
    } else {
      const today = new Date()
      const past = new Date()
      past.setDate(today.getDate() - defaultDays)
      setFromDate(formatDateToInput(past))
      setToDate(formatDateToInput(today))
    }
  }, [value, defaultDays])

  const handlePresetClick = (days: number) => {
    const today = new Date()
    const from = new Date()
    from.setDate(today.getDate() - days)
    
    setFromDate(formatDateToInput(from))
    setToDate(formatDateToInput(today))
    onChange({ from, to: today })
    setIsOpen(false)
  }

  const handleApply = () => {
    if (fromDate && toDate) {
      const from = parseInputDate(fromDate)
      const to = parseInputDate(toDate)
      if (from && to && from <= to) {
        onChange({ from, to })
        setIsOpen(false)
      }
    }
  }

  const handleClear = () => {
    const today = new Date()
    const past = new Date()
    past.setDate(today.getDate() - defaultDays)
    const range = { from: past, to: today }
    onChange(range)
    setFromDate(formatDateToInput(past))
    setToDate(formatDateToInput(today))
    setIsOpen(false)
  }

  const formatDateDisplay = () => {
    if (!fromDate || !toDate) return 'Select dates'
    const from = parseInputDate(fromDate)
    const to = parseInputDate(toDate)
    if (!from || !to) return 'Select dates'
    
    if (from.toDateString() === to.toDateString()) {
      return from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    return `${from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${to.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background-secondary text-text-secondary hover:text-text-primary transition-colors text-sm border border-border"
      >
        <Calendar className="w-4 h-4" />
        <span className="hidden sm:inline">{formatDateDisplay()}</span>
        <ChevronRight className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-90')} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full right-0 z-50 mt-2 w-80 bg-background rounded-lg shadow-lg border border-border overflow-hidden">
            <div className="p-4 space-y-4">
              {/* Presets */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary uppercase">Quick Select</label>
                <div className="grid grid-cols-3 gap-2">
                  {presets.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => handlePresetClick(preset.value)}
                      className="px-3 py-2 text-sm rounded-lg border border-border hover:bg-background-secondary hover:border-accent transition-colors text-text-secondary hover:text-text-primary"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom dates */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary uppercase">Custom Range</label>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-text-secondary mb-1 block">From</label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary mb-1 block">To</label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text-primary text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-border">
                <button
                  onClick={handleClear}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-border hover:bg-background-secondary transition-colors text-text-secondary"
                >
                  Reset
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-border hover:bg-background-secondary transition-colors text-text-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 px-3 py-2 text-sm rounded-lg bg-accent hover:bg-accent/90 transition-colors text-accent-foreground font-medium"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Helper functions
function formatDateToInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseInputDate(input: string): Date | null {
  try {
    const [year, month, day] = input.split('-').map(Number)
    if (year && month && day) {
      return new Date(year, month - 1, day)
    }
  } catch {
    // Continue
  }
  return null
}
