# 7-Day Trend Charts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "7-Day Trends" section to the web dashboard using the already-fetched 7-day summaries data and Recharts (already installed).

**Architecture:** New `WeeklyCharts` client component renders steps, sleep, and resting-HR charts. Inserted into `DashboardStream` after the Activity section.

**Tech Stack:** TypeScript, React, Next.js 14 App Router, Recharts 2.10

---

## File Map

| File | Action |
|------|--------|
| `web/app/dashboard/components/weekly-charts.tsx` | Create |
| `web/app/dashboard/dashboard-stream.tsx` | Modify (import + section) |

---

### Task 1: Create WeeklyCharts component and wire into dashboard

**Files:**
- Create: `web/app/dashboard/components/weekly-charts.tsx`
- Modify: `web/app/dashboard/dashboard-stream.tsx`

- [ ] **Step 1: Create weekly-charts.tsx**

Create `web/app/dashboard/components/weekly-charts.tsx`:

```tsx
'use client'

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface WeeklyChartsProps {
  summaries: Array<{
    date: string
    steps: number
    active_calories: number
    sleep_duration_minutes?: number
    resting_heart_rate?: number
  }>
}

export function WeeklyCharts({ summaries }: WeeklyChartsProps) {
  // Reverse to ascending order (oldest → newest left → right)
  // Append T00:00:00 to force local-time parsing and avoid UTC day-shift
  const chartData = [...summaries].reverse().map((s) => ({
    day: new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
    }),
    steps: s.steps,
    sleepHours: s.sleep_duration_minutes
      ? +(s.sleep_duration_minutes / 60).toFixed(1)
      : null,
    restingHR: s.resting_heart_rate ?? null,
  }))

  const hasSleepData = chartData.some((d) => d.sleepHours !== null)
  const hasHRData = chartData.some((d) => d.restingHR !== null)

  return (
    <div className="space-y-6">
      {/* Steps */}
      <div>
        <h3 className="text-sm font-medium text-text-secondary mb-2">Steps</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #888)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface, #1a1a1a)',
                border: '1px solid var(--color-border, #333)',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number) => [value.toLocaleString(), 'Steps']}
            />
            <Bar dataKey="steps" fill="#22c55e" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sleep */}
      {hasSleepData && (
        <div>
          <h3 className="text-sm font-medium text-text-secondary mb-2">Sleep (hours)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface, #1a1a1a)',
                  border: '1px solid var(--color-border, #333)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number) => [`${value}h`, 'Sleep']}
              />
              <Bar dataKey="sleepHours" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Resting Heart Rate */}
      {hasHRData && (
        <div>
          <h3 className="text-sm font-medium text-text-secondary mb-2">
            Resting Heart Rate (bpm)
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface, #1a1a1a)',
                  border: '1px solid var(--color-border, #333)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number) => [`${value} bpm`, 'Resting HR']}
              />
              <Line
                type="monotone"
                dataKey="restingHR"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: '#ef4444', r: 3 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add WeeklyCharts to dashboard-stream.tsx**

Edit `web/app/dashboard/dashboard-stream.tsx`:

**2a.** Add import after the existing `import { cn } from '@/lib/utils'` line:

```ts
import { WeeklyCharts } from './components/weekly-charts'
```

**2b.** Insert a new `DataStreamSection` after the Activity section's closing `</DataStreamSection>` tag (currently at line 319) and before the `{/* AI Insights */}` comment. Find:

```tsx
        </DataStreamSection>

        {/* AI Insights */}
```

Replace with:

```tsx
        </DataStreamSection>

        {/* 7-Day Trends */}
        <DataStreamSection title="7-Day Trends">
          <WeeklyCharts summaries={summaries} />
        </DataStreamSection>

        {/* AI Insights */}
```

- [ ] **Step 3: Verify TypeScript build**

```bash
cd /Users/qxlsz/projects/kquarks/web && npx tsc --noEmit 2>&1 | head -30
```

If errors appear, fix them. Then run:

```bash
cd /Users/qxlsz/projects/kquarks/web && npm run build 2>&1 | tail -20
```

Expected: build completes successfully.

- [ ] **Step 4: Commit and push**

```bash
cd /Users/qxlsz/projects/kquarks && git add web/app/dashboard/components/weekly-charts.tsx web/app/dashboard/dashboard-stream.tsx
git commit -m "Add 7-day trend charts to web dashboard"
git push origin main
```
