# Health Metric Charts & Background Sync — Design Spec

**Date:** 2026-03-17
**Project:** GetZen iOS app
**Status:** Approved

---

## Overview

Two features shipped in one plan:

1. **Health Metric Detail Views** — tapping any health data row opens a chart-driven detail view showing 7-day history with min/avg/max stats.
2. **Background Sync** — BGTaskScheduler keeps Supabase data fresh automatically, even when the app is closed.

---

## Feature 1: Health Metric Detail Charts

### Goal

Every `HealthDataRow` in `HealthDataView` has a chevron that currently leads nowhere. This feature wires those rows to a `HealthMetricDetailView` showing real historical data via Swift Charts.

### HealthMetricDetailView

**Layout (top to bottom):**
- Large current value + unit label
- Trend badge: percentage vs. 7-day average (green up / red down arrow)
- Swift Charts chart (7 days)
- Summary strip: Min · Avg · Max
- Optional goal progress bar (steps: 10,000/day; active calories: 500/day)

**Chart type by metric:**
| Metric | Chart Type |
|--------|------------|
| Steps, Active Calories, Floors | Bar chart |
| Heart Rate, Resting HR, HRV | Line chart |
| Weight, Body Fat | Line chart |

**Data source:** New `HealthKitService.fetchWeekData(for identifier: HKQuantityTypeIdentifier, isDiscrete: Bool) async throws → [(date: Date, value: Double)]`, fetching per-day samples for the past 7 days using `HKStatisticsCollectionQuery`. The call site uses `dataType.healthKitIdentifier` (which returns `HKQuantityTypeIdentifier?`) — unwrap with `guard let` before calling, showing empty state if nil.

The query option set and value accessor differ by metric type:
- **Cumulative** (steps, active calories, floors): `.cumulativeSum`, access via `statistics.sumQuantity()`
- **Discrete** (heart rate, resting HR, HRV, weight, body fat): `.discreteAverage`, access via `statistics.averageQuantity()`

`HealthDataType` needs a computed property `isDiscrete: Bool` to drive this selection.

### HealthDataView changes

- `HealthDataRow` becomes a `NavigationLink(destination: HealthMetricDetailView(dataType:))`.
- Remove the static `chevron.right` icon (NavigationLink renders its own disclosure indicator).
- `HealthDataView` already wraps its content in its own `NavigationStack`. This is correct — it serves as the push navigation container for iPhone tab navigation. Do not remove it; the `NavigationLink` inside the rows will push into it correctly.

### New file

`ios/KQuarks/Views/HealthMetricDetailView.swift`

---

## Feature 2: Background Sync

### Goal

The app currently only syncs when the user manually taps the sync button or opens the app. BGTaskScheduler enables silent background syncs so data in Supabase is always current.

### Tasks registered

| Identifier | Type | Trigger | Work |
|------------|------|---------|------|
| `com.getzen.sync.refresh` | BGAppRefreshTask | Every ~2h, OS-managed | Fetch today's HealthKit summary, upload to Supabase |
| `com.getzen.sync.full` | BGProcessingTask | Power + wifi, nightly | Full sync: all tables, past 7 days |

### SyncService additions

```swift
func scheduleBackgroundSync()  // schedules both tasks
func handleRefreshTask(_ task: BGAppRefreshTask) async
func handleFullSyncTask(_ task: BGProcessingTask) async
```

`scheduleBackgroundSync()` is called:
- On app launch (from `GetZenApp.init` or `.onAppear`)
- After each sync completes (refresh reschedules itself)

### Registration

**Plist keys (array values):** `UIBackgroundModes` and `BGTaskSchedulerPermittedIdentifiers` are array-typed and cannot be expressed as scalar `INFOPLIST_KEY_*` build settings. Instead, create `ios/KQuarks/Info.plist` with these two keys and set `INFOPLIST_FILE = GetZen/Info.plist` in the Xcode build settings. Xcode 14+ merges a manually-specified plist with the auto-generated one when `GENERATE_INFOPLIST_FILE = YES` is also set.

`Info.plist` contents:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>UIBackgroundModes</key>
    <array>
        <string>fetch</string>
        <string>processing</string>
    </array>
    <key>BGTaskSchedulerPermittedIdentifiers</key>
    <array>
        <string>com.getzen.sync.refresh</string>
        <string>com.getzen.sync.full</string>
    </array>
</dict>
</plist>
```

**Handler registration** must happen synchronously before the app finishes launching. In `GetZenApp.init()` (not `.task` or `.onAppear`), call:
```swift
BGTaskScheduler.shared.register(forTaskWithIdentifier: "com.getzen.sync.refresh", using: nil) { task in
    Task { await SyncService.shared.handleRefreshTask(task as! BGAppRefreshTask) }
}
BGTaskScheduler.shared.register(forTaskWithIdentifier: "com.getzen.sync.full", using: nil) { task in
    Task { await SyncService.shared.handleFullSyncTask(task as! BGProcessingTask) }
}
```

**Scheduling** (submitting requests) can happen later — call `SyncService.shared.scheduleBackgroundSync()` from the app's `.task` modifier or after sign-in.

Both `handleRefreshTask` and `handleFullSyncTask` call `scheduleBackgroundSync()` on completion so that the next occurrence of each task is always scheduled after the current one finishes.

### scheduleBackgroundSync() details

Submits both task requests unconditionally (duplicate submission silently replaces a pending request — harmless):
```swift
func scheduleBackgroundSync() {
    let refreshRequest = BGAppRefreshTaskRequest(identifier: "com.getzen.sync.refresh")
    refreshRequest.earliestBeginDate = Date(timeIntervalSinceNow: 2 * 3600)
    try? BGTaskScheduler.shared.submit(refreshRequest)

    let fullRequest = BGProcessingTaskRequest(identifier: "com.getzen.sync.full")
    fullRequest.requiresNetworkConnectivity = true   // Supabase calls need network
    fullRequest.requiresExternalPower = true          // Full sync only on charger
    try? BGTaskScheduler.shared.submit(fullRequest)
}
```

---

## Architecture

### Files changed/created

| File | Change |
|------|--------|
| `ios/KQuarks/Views/HealthMetricDetailView.swift` | New — chart detail view |
| `ios/KQuarks/Views/HealthDataView.swift` | Add NavigationLink to each row |
| `ios/KQuarks/Services/HealthKitService.swift` | Add `fetchWeekData(for:)`, `isDiscrete` on `HealthDataType` |
| `ios/KQuarks/Services/SyncService.swift` | Add `scheduleBackgroundSync()`, `handleRefreshTask()`, `handleFullSyncTask()`, `import BackgroundTasks` |
| `ios/KQuarks/Info.plist` | New — `UIBackgroundModes` + `BGTaskSchedulerPermittedIdentifiers` |
| `ios/KQuarks.xcodeproj/project.pbxproj` | Register new Swift file + `INFOPLIST_FILE` build setting |
| `ios/KQuarks/App/GetZenApp.swift` | Add `init()`, register BGTaskScheduler handlers, `import BackgroundTasks` |

### Data flow

**Charts:**
```
HealthDataView → tap row → NavigationLink
  → HealthMetricDetailView.task { loadData() }
    → HealthKitService.fetchWeekData(for: dataType.healthKitIdentifier)
      → HKStatisticsCollectionQuery (7 days, daily interval)
        → [(date, value)] → Swift Charts
```

**Background sync:**
```
App launch → SyncService.scheduleBackgroundSync()
  → BGTaskScheduler.shared.submit(BGAppRefreshTaskRequest)
  → BGTaskScheduler.shared.submit(BGProcessingTaskRequest)

OS fires com.getzen.sync.refresh
  → SyncService.handleRefreshTask(_:)
    → HealthKitService.fetchTodaySummary()
    → SupabaseService.uploadDailySummary(_:)
    → task.setTaskCompleted(success:)
    → scheduleBackgroundSync() (reschedule)
```

---

## Error Handling

- **Charts:** If `fetchWeekData` throws (HealthKit not authorized, no data), show an empty state with "No data available for this period."
- **Background sync:** If sync fails, call `task.setTaskCompleted(success: false)` so the OS can retry. Log errors to console only (no user-visible alerts for background work).
- **BGTaskScheduler identifier mismatch:** Any identifier submitted but not declared causes a crash at submission time. Both identifiers must appear in `BGTaskSchedulerPermittedIdentifiers` in `ios/KQuarks/Info.plist`.

---

## Success Criteria

- Tapping any health data row in HealthDataView opens a chart view with real 7-day data
- Charts render correct type (bars vs. line) per metric
- Min/avg/max strip shows accurate computed values
- `xcodebuild` succeeds with no errors
- Background task identifiers appear in the built app's Info.plist
- `BGTaskScheduler.shared.register` calls succeed at launch (no crash)
