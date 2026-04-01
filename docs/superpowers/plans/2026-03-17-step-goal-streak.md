# Step Goal Streak Counter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display a consecutive-days step-goal streak counter on the iOS dashboard Activity section and the web dashboard Activity section.

**Architecture:** iOS computes the streak in `DashboardListViewModel.calculateTrends()` by fetching 30 days of summaries from HealthKit and counting consecutive days (newest first) where steps ≥ goal. Web expands its Supabase query from 7 to 30 days and computes the same streak client-side in `DashboardStream`. Both surfaces show the streak as a metric row in the Activity section.

**Tech Stack:** Swift 5.9 SwiftUI `@Observable`, HealthKit `fetchWeekSummaries(days:)`, `GoalService.shared.stepsGoal`; TypeScript, Next.js 14 App Router, Supabase SSR client, Lucide icons.

---

## File Map

| File | Action |
|------|--------|
| `ios/KQuarks/Views/Dashboard/DashboardListView.swift` | Modify — add `currentStreak` property to VM, streak computation in `calculateTrends()`, streak row in `activitySection()` |
| `web/app/dashboard/page.tsx` | Modify — expand query from 7 to 30 days |
| `web/app/dashboard/dashboard-stream.tsx` | Modify — compute streak, add MetricRow in Activity section |

---

### Task 1: iOS — Streak counter in DashboardListViewModel and activitySection

**Files:**
- Modify: `ios/KQuarks/Views/Dashboard/DashboardListView.swift`

**Background:** `DashboardListViewModel` already has `calculateTrends()` which calls `healthKit.fetchWeekSummaries(days: 7)`. `DaySummaryForAI` has `steps: Int`. `GoalService.shared.stepsGoal` returns the user's configured step goal as `Double`. Data is ordered newest-first (index 0 = today).

- [ ] **Step 1: Add `currentStreak` property to `DashboardListViewModel`**

In `DashboardListViewModel` (around line 367, after `var hrvTrend: Int? = nil`), add:

```swift
var currentStreak: Int = 0
```

- [ ] **Step 2: Compute streak in `calculateTrends()`**

In `calculateTrends()` (around line 465), after the existing HRV trend block and before the closing `} catch {`, add:

```swift
// Compute step goal streak (30 days, newest first)
let streakData = try await healthKit.fetchWeekSummaries(days: 30)
let stepGoal = GoalService.shared.stepsGoal
var streak = 0
for day in streakData {
    if Double(day.steps) >= stepGoal {
        streak += 1
    } else {
        break
    }
}
await MainActor.run {
    currentStreak = streak
}
```

- [ ] **Step 3: Display streak row in `activitySection()`**

In `activitySection(summary:)` (around line 256), after the `floorsClimbed` conditional block and before the closing `}` of the inner `VStack`, add:

```swift
if viewModel.currentStreak > 0 {
    MetricRowView(
        icon: "rosette",
        label: "Step Streak",
        value: "\(viewModel.currentStreak)",
        unit: viewModel.currentStreak == 1 ? "day" : "days",
        sublabel: "consecutive days at goal",
        color: .orange
    )
}
```

- [ ] **Step 4: Build to verify**

```bash
cd /Users/qxlsz/projects/getzen/ios && xcodebuild build \
  -project KQuarks.xcodeproj \
  -scheme GetZen \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO 2>&1 | grep -E 'error:|BUILD'
```

Expected: `BUILD SUCCEEDED` — SourceKit false-positive errors in the IDE are normal and expected; only trust `xcodebuild` output.

- [ ] **Step 5: Commit**

```bash
cd /Users/qxlsz/projects/getzen && git add ios/KQuarks/Views/Dashboard/DashboardListView.swift
git commit -m "Add step goal streak counter to iOS dashboard"
```

---

### Task 2: Web — Expand query and display streak in Activity section

**Files:**
- Modify: `web/app/dashboard/page.tsx`
- Modify: `web/app/dashboard/dashboard-stream.tsx`

**Background:** `page.tsx` fetches `daily_summaries` for the past 7 days ordered descending. `dashboard-stream.tsx` receives `summaries` prop (array, newest first). The Activity section has MetricRows for Steps, Active Calories, and Water. The step goal on the web side is hardcoded at 10,000 (no GoalService equivalent).

- [ ] **Step 1: Expand Supabase query from 7 to 30 days in `page.tsx`**

In `web/app/dashboard/page.tsx` line 24-25, change:

```typescript
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
```

to:

```typescript
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
```

And on line 31, change `.gte('date', sevenDaysAgo.toISOString().split('T')[0])` to:

```typescript
    .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
```

- [ ] **Step 2: Compute streak in `dashboard-stream.tsx`**

In `web/app/dashboard/dashboard-stream.tsx`, after the existing `const stepsTrend = ...` line (around line 91), add:

```typescript
  // Compute step goal streak (summaries are newest-first)
  const STEP_GOAL = 10000
  let stepStreak = 0
  for (const day of summaries) {
    if (day.steps >= STEP_GOAL) {
      stepStreak++
    } else {
      break
    }
  }
```

- [ ] **Step 3: Add streak MetricRow to Activity section**

In `web/app/dashboard/dashboard-stream.tsx`, in the Activity `DataStreamSection` (around line 301-329), after the Active Calories `MetricRow` and before the Water `MetricRow`, add:

```tsx
            {stepStreak > 0 && (
              <MetricRow
                icon={<Target className="w-5 h-5" />}
                label="Step Streak"
                value={stepStreak}
                unit={stepStreak === 1 ? 'day' : 'days'}
                sublabel="consecutive days at goal"
                color="activity"
              />
            )}
```

`Target` is already imported from `lucide-react` at line 21.

- [ ] **Step 4: TypeScript check**

```bash
cd /Users/qxlsz/projects/getzen/web && npx tsc --noEmit 2>&1 | head -20
```

Expected: no output (no errors).

- [ ] **Step 5: Production build**

```bash
cd /Users/qxlsz/projects/getzen/web && npm run build 2>&1 | tail -10
```

Expected: build completes with no errors.

- [ ] **Step 6: Commit**

```bash
cd /Users/qxlsz/projects/getzen && git add web/app/dashboard/page.tsx web/app/dashboard/dashboard-stream.tsx
git commit -m "Add step goal streak counter to web dashboard"
```

---

### Task 3: Push to main

- [ ] **Step 1: Push**

```bash
cd /Users/qxlsz/projects/getzen && git push origin main
```

Expected: push succeeds.
