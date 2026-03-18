# Web Workout History Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/workouts` page to the web dashboard that displays the user's synced workout history from the `workout_records` Supabase table.

**Architecture:** New server component `page.tsx` fetches the 50 most recent workouts and passes them to a client component `workouts-list.tsx` for rendering. A "Workouts" button is added to the dashboard header for navigation. No new Supabase tables or migrations needed — `workout_records` already exists and is already populated by the iOS sync.

**Tech Stack:** TypeScript, Next.js 14 App Router, Supabase SSR, Tailwind CSS, Lucide icons.

---

## File Map

| File | Action |
|------|--------|
| `web/app/workouts/page.tsx` | Create — server component, auth + data fetch |
| `web/app/workouts/workouts-list.tsx` | Create — client component, renders list |
| `web/app/dashboard/dashboard-stream.tsx` | Modify — add "Workouts" link to header |

---

### Task 1: Create workout history page and wire into dashboard nav

**Files:**
- Create: `web/app/workouts/page.tsx`
- Create: `web/app/workouts/workouts-list.tsx`
- Modify: `web/app/dashboard/dashboard-stream.tsx`

**`workout_records` table columns used (confirmed in migration):**
```
id, user_id, workout_type (text), start_time (timestamptz),
duration_minutes (integer), active_calories (float),
distance_meters (float), avg_heart_rate (integer), created_at (timestamptz)
```
Note: The table also has end_time, total_calories, max_heart_rate, elevation_gain_meters, avg_pace_per_km, source, metadata — but these are not fetched in the query and are not needed for the list view.

- [ ] **Step 1: Create `web/app/workouts/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WorkoutsList } from './workouts-list'

export const metadata = { title: 'Workouts' }

export default async function WorkoutsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: workouts } = await supabase
    .from('workout_records')
    .select('id, workout_type, start_time, duration_minutes, active_calories, distance_meters, avg_heart_rate')
    .eq('user_id', user.id)
    .order('start_time', { ascending: false })
    .limit(50)

  return <WorkoutsList workouts={workouts ?? []} />
}
```

- [ ] **Step 2: Create `web/app/workouts/workouts-list.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Workout {
  id: string
  workout_type: string
  start_time: string
  duration_minutes: number
  active_calories?: number
  distance_meters?: number
  avg_heart_rate?: number
}

const WORKOUT_ICONS: Record<string, string> = {
  Running: '🏃',
  Walking: '🚶',
  Hiking: '🥾',
  Cycling: '🚴',
  Swimming: '🏊',
  'Strength Training': '💪',
  Yoga: '🧘',
  HIIT: '⚡',
  Rowing: '🚣',
  Pilates: '🤸',
  Dance: '💃',
}

function workoutIcon(type: string): string {
  return WORKOUT_ICONS[type] ?? '⚡'
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

interface WorkoutsListProps {
  workouts: Workout[]
}

export function WorkoutsList({ workouts }: WorkoutsListProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Workouts</h1>
            <p className="text-sm text-text-secondary">{workouts.length} sessions</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {workouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">⚡</span>
            <h2 className="text-lg font-semibold text-text-primary mb-2">No workouts yet</h2>
            <p className="text-sm text-text-secondary">
              Sync your iPhone to import workouts from Apple Health.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {workouts.map((workout) => {
              const date = new Date(workout.start_time)
              const stats: string[] = [formatDuration(workout.duration_minutes)]
              if (workout.active_calories && workout.active_calories > 0) {
                stats.push(`${Math.round(workout.active_calories)} cal`)
              }
              if (workout.distance_meters && workout.distance_meters > 0) {
                stats.push(`${(workout.distance_meters / 1000).toFixed(1)} km`)
              }
              if (workout.avg_heart_rate && workout.avg_heart_rate > 0) {
                stats.push(`${workout.avg_heart_rate} bpm avg`)
              }

              return (
                <div
                  key={workout.id}
                  className="flex items-center gap-4 p-4 bg-surface rounded-xl border border-border"
                >
                  <span className="text-3xl">{workoutIcon(workout.workout_type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-text-primary truncate">
                        {workout.workout_type}
                      </span>
                      <span className="text-sm text-text-secondary shrink-0">
                        {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary mt-0.5">{stats.join(' · ')}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Add Workouts link to dashboard header in `dashboard-stream.tsx`**

In the dashboard header's button group (around line 182-198, the `<div className="flex items-center gap-2">` block containing the Settings and LogOut buttons), add a Link to /workouts before the Settings button.

First add `import Link from 'next/link'` after the existing imports at the top of the file (there is no `Link` import currently — search for `import { cn }` and add it nearby).

`Activity` icon is imported from lucide-react (search for `Activity` in the import block at the top of the file).

Then add this button before the Settings button:

```tsx
            <Link
              href="/workouts"
              className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
              title="Workouts"
            >
              <Activity className="w-5 h-5 text-text-secondary" />
            </Link>
```

`Activity` is already imported from lucide-react. `Link` must be added: `import Link from 'next/link'`.

- [ ] **Step 4: TypeScript check**

```bash
cd /Users/qxlsz/projects/kquarks/web && npx tsc --noEmit 2>&1 | head -20
```

Expected: no output

- [ ] **Step 5: Build**

```bash
cd /Users/qxlsz/projects/kquarks/web && npm run build 2>&1 | tail -10
```

Expected: build succeeds

- [ ] **Step 6: Commit**

```bash
cd /Users/qxlsz/projects/kquarks && git add web/app/workouts/page.tsx web/app/workouts/workouts-list.tsx web/app/dashboard/dashboard-stream.tsx
git commit -m "Add web workout history page"
```

---

### Task 2: iOS — Fix empty Sleep tab in HealthDataView

**Files:**
- Modify: `ios/KQuarks/Views/HealthDataView.swift`

**Background:** The Sleep category in `HealthDataView` returns `dataTypes: []`, so the scrollview is empty when the user taps "Sleep". The comment says "Sleep has its own view" but nothing navigates there.

- [ ] **Step 1: Add conditional Sleep content to HealthDataView**

In `HealthDataView.body`, find the `ScrollView` block:

```swift
ScrollView {
    LazyVStack(spacing: 16) {
        ForEach(selectedCategory.dataTypes, id: \.self) { dataType in
            HealthDataRow(dataType: dataType)
        }
    }
    .padding()
}
```

Replace with:

```swift
ScrollView {
    LazyVStack(spacing: 16) {
        if selectedCategory == .sleep {
            NavigationLink(destination: SleepView()) {
                HStack {
                    Image(systemName: "moon.fill")
                        .font(.title2)
                        .foregroundStyle(.indigo)
                        .frame(width: 44, height: 44)
                        .background(Color.indigo.opacity(0.1))
                        .cornerRadius(10)

                    VStack(alignment: .leading, spacing: 4) {
                        Text("Sleep History")
                            .font(.headline)
                            .foregroundStyle(.primary)
                        Text("Last 14 nights")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .padding()
                .background(Color(.secondarySystemBackground))
                .cornerRadius(12)
            }
            .buttonStyle(.plain)
        } else {
            ForEach(selectedCategory.dataTypes, id: \.self) { dataType in
                HealthDataRow(dataType: dataType)
            }
        }
    }
    .padding()
}
```

- [ ] **Step 2: Build to verify**

```bash
cd /Users/qxlsz/projects/kquarks/ios && xcodebuild build \
  -project KQuarks.xcodeproj \
  -scheme KQuarks \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO 2>&1 | grep -E 'error:|BUILD'
```

Expected: `BUILD SUCCEEDED` — SourceKit false-positive errors are normal; ignore them.

- [ ] **Step 3: Commit**

```bash
cd /Users/qxlsz/projects/kquarks && git add ios/KQuarks/Views/HealthDataView.swift
git commit -m "Fix empty Sleep tab — add SleepView navigation link in HealthDataView"
```

---

### Task 3: Push to main

- [ ] **Step 1: Push**

```bash
cd /Users/qxlsz/projects/kquarks && git push origin main
```
