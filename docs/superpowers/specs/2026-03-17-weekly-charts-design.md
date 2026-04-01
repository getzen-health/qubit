# 7-Day Trend Charts — Design Spec

**Date:** 2026-03-17
**Project:** GetZen web dashboard
**Status:** Approved

---

## Overview

`DashboardStream` already receives 7 days of `summaries` from Supabase but only uses `summaries[0]` (today). This feature adds a "7-Day Trends" section with Recharts bar/line charts powered by the already-fetched data. No new data fetching required.

---

## Feature

### New component: WeeklyCharts

File: `web/app/dashboard/components/weekly-charts.tsx`

A `'use client'` component that accepts the `summaries` array and renders three stacked charts:

1. **Steps** — `BarChart` (cumulative daily count)
2. **Sleep** — `BarChart` (sleep_duration_minutes converted to hours, only rendered if any day has sleep data)
3. **Resting Heart Rate** — `LineChart` (only rendered if any day has resting_heart_rate data)

Each chart:
- `ResponsiveContainer` width 100%, height 160px
- X-axis: abbreviated weekday label ("Mon", "Tue", etc.) derived from the date string
- Tooltip showing exact value + unit
- Color matches the existing color scheme: steps = `#22c55e` (green/activity), sleep = `#3b82f6` (blue/sleep), heart rate = `#ef4444` (red/heart)
- Bar/line uses `stroke` or `fill` directly; no Recharts theme dependency

**Data preparation:**
```ts
const chartData = [...summaries]
  .reverse()  // ascending date order (oldest → newest)
  .map(s => ({
    day: new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
    steps: s.steps,
    sleepHours: s.sleep_duration_minutes ? +(s.sleep_duration_minutes / 60).toFixed(1) : null,
    restingHR: s.resting_heart_rate ?? null,
  }))
```

Note: append `T00:00:00` to the date string before passing to `new Date()` to force local-time parsing and avoid UTC-offset day-shift bugs.

**Layout:** Each chart lives in a `div` with `mb-6`. A section title `<h3>` precedes each chart.

**Conditional rendering:** If all values for a metric are `null`/`0`, omit that chart.

**Props:**
```ts
interface WeeklyChartsProps {
  summaries: Array<{
    date: string
    steps: number
    active_calories: number
    sleep_duration_minutes?: number
    resting_heart_rate?: number
  }>
}
```

### DashboardStream changes

In `web/app/dashboard/dashboard-stream.tsx`:
- Import `WeeklyCharts` from `./components/weekly-charts`
- Add a `<DataStreamSection title="7-Day Trends">` section after the `Activity` section and before the AI Insights block
- Pass `summaries` to `WeeklyCharts`

---

## Files Changed/Created

| File | Change |
|------|--------|
| `web/app/dashboard/components/weekly-charts.tsx` | New — chart component |
| `web/app/dashboard/dashboard-stream.tsx` | Add WeeklyCharts section |

---

## Success Criteria

- Dashboard shows three charts using real Supabase data
- Charts only appear for metrics that have data
- Date labels show weekday abbreviations in correct order (oldest left → newest right)
- No UTC day-shift bug on date labels
- `next build` succeeds with no errors
