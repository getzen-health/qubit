# Health Metric Charts & Background Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 7-day history charts to every health metric detail view, and enable automatic background Supabase sync via BGTaskScheduler.

**Architecture:** `HealthKitService` gains `fetchWeekData(for:isDiscrete:)` using `HKStatisticsCollectionQuery`; a new `HealthMetricDetailView` renders Swift Charts bar/line charts and a min/avg/max strip; `HealthDataView` rows become `NavigationLink`s into it. `SyncService` gains three BGTask methods; `GetZenApp.init()` registers handlers before launch completes; `Info.plist` declares the two task identifiers and background modes.

**Tech Stack:** Swift 5.9+, SwiftUI, HealthKit (`HKStatisticsCollectionQuery`), Swift Charts (`import Charts`), BackgroundTasks framework (`BGTaskScheduler`, `BGAppRefreshTask`, `BGProcessingTask`).

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `ios/KQuarks/Services/HealthKitService.swift` | Modify | Add `fetchWeekData(for:isDiscrete:)` |
| `ios/KQuarks/Models/HealthData.swift` | Modify | Add `isDiscrete: Bool` to `HealthDataType` |
| `ios/KQuarks/Views/HealthMetricDetailView.swift` | **Create** | Chart detail view |
| `ios/KQuarks/Views/HealthDataView.swift` | Modify | Rows → `NavigationLink` |
| `ios/KQuarks/Info.plist` | Modify | Add `UIBackgroundModes` + `BGTaskSchedulerPermittedIdentifiers` |
| `ios/KQuarks/Services/SyncService.swift` | Modify | BGTask scheduling + handlers |
| `ios/KQuarks/App/GetZenApp.swift` | Modify | `init()` with BGTask handler registration |
| `ios/KQuarks.xcodeproj/project.pbxproj` | Modify | Register `HealthMetricDetailView.swift` |

> **Note:** `HealthDataType` is defined in `ios/KQuarks/Models/HealthData.swift`. The `healthKitIdentifier` extension is a separate extension block at the bottom of `HealthDataView.swift`. Add `isDiscrete` to the enum definition in `HealthData.swift`.

---

## Context You Need

- **pbxproj ID scheme:** Numeric strings. Last used: file ref `130`, build file `034`. Use `131` / `035` for the new view.
- **Views group ID:** `506`. **Sources build phase ID:** `601`.
- **Info.plist** already exists at `ios/KQuarks/Info.plist`. `INFOPLIST_FILE = GetZen/Info.plist` and `GENERATE_INFOPLIST_FILE = YES` are already set in pbxproj — no pbxproj change needed for plist.
- **`preferredUnit(for:)`** already exists in `HealthKitService` — reuse it inside `fetchWeekData`.
- **SourceKit** false positives are common (it analyses files in isolation). Only trust `xcodebuild` output.

---

## Task 1: Add `isDiscrete` to `HealthDataType` + `fetchWeekData` to `HealthKitService`

**Files:**
- Modify: `ios/KQuarks/Models/HealthData.swift` (add computed property to `HealthDataType` enum)
- Modify: `ios/KQuarks/Services/HealthKitService.swift`

- [ ] **Step 1: Add `isDiscrete` computed property to `HealthDataType`**

Open `ios/KQuarks/Models/HealthData.swift`. Find the `HealthDataType` enum (starts at line 31). Add the property inside the enum body, after `var displayName`:

```swift
var displayName: String { ... }  // existing

var isDiscrete: Bool {
    switch self {
    case .heartRate, .restingHeartRate, .hrv, .weight, .bodyFat,
         .oxygenSaturation, .respiratoryRate, .bloodPressureSystolic, .bloodPressureDiastolic:
        return true
    default:
        return false
    }
}
```

```swift
var isDiscrete: Bool {
    switch self {
    case .heartRate, .restingHeartRate, .hrv, .weight, .bodyFat,
         .oxygenSaturation, .respiratoryRate, .bloodPressureSystolic, .bloodPressureDiastolic:
        return true
    default:
        return false
    }
}
```

- [ ] **Step 2: Add `fetchWeekData` to `HealthKitService`**

Add after `fetchWeekSummaries(days:)` (around line 130 of `HealthKitService.swift`):

Add after `fetchWeekSummaries(days:)` (around line 130):

```swift
/// Fetch per-day stats for the past 7 days for charting.
/// - Parameters:
///   - identifier: The HealthKit quantity type identifier.
///   - isDiscrete: true → discreteAverage (HR, HRV, weight); false → cumulativeSum (steps, calories).
func fetchWeekData(for identifier: HKQuantityTypeIdentifier, isDiscrete: Bool) async throws -> [(date: Date, value: Double)] {
    let calendar = Calendar.current
    let now = Date()
    let startOfToday = calendar.startOfDay(for: now)
    let startDate = calendar.date(byAdding: .day, value: -6, to: startOfToday)!

    let quantityType = HKQuantityType(identifier)
    let predicate = HKQuery.predicateForSamples(withStart: startDate, end: now, options: .strictStartDate)
    let interval = DateComponents(day: 1)
    let options: HKStatisticsOptions = isDiscrete ? .discreteAverage : .cumulativeSum

    return try await withCheckedThrowingContinuation { continuation in
        let query = HKStatisticsCollectionQuery(
            quantityType: quantityType,
            quantitySamplePredicate: predicate,
            options: options,
            anchorDate: startOfToday,
            intervalComponents: interval
        )

        query.initialResultsHandler = { _, results, error in
            if let error = error {
                continuation.resume(throwing: error)
                return
            }

            guard let results = results else {
                continuation.resume(returning: [])
                return
            }

            let unit = self.preferredUnit(for: identifier)
            var data: [(date: Date, value: Double)] = []

            results.enumerateStatistics(from: startDate, to: now) { statistics, _ in
                let value: Double?
                if isDiscrete {
                    value = statistics.averageQuantity()?.doubleValue(for: unit)
                } else {
                    value = statistics.sumQuantity()?.doubleValue(for: unit)
                }
                if let value = value {
                    data.append((date: statistics.startDate, value: value))
                }
            }

            continuation.resume(returning: data)
        }

        self.healthStore.execute(query)
    }
}
```

- [ ] **Step 3: Build verify**

```bash
cd ios && xcodebuild build \
  -project KQuarks.xcodeproj -scheme GetZen \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug CODE_SIGNING_ALLOWED=NO \
  2>&1 | grep -E "error:|BUILD SUCCEEDED|BUILD FAILED"
```

Expected: `** BUILD SUCCEEDED **`

- [ ] **Step 4: Commit**

```bash
git add ios/KQuarks/Models/HealthData.swift ios/KQuarks/Services/HealthKitService.swift
git commit -m "Add isDiscrete to HealthDataType and fetchWeekData to HealthKitService"
```

---

## Task 2: Create `HealthMetricDetailView.swift`

**Files:**
- Create: `ios/KQuarks/Views/HealthMetricDetailView.swift`
- Modify: `ios/KQuarks.xcodeproj/project.pbxproj`

- [ ] **Step 1: Create the view file**

```swift
import SwiftUI
import Charts
import HealthKit

struct HealthMetricDetailView: View {
    let dataType: HealthDataType

    @State private var weekData: [(date: Date, value: Double)] = []
    @State private var isLoading = true
    @State private var hasError = false

    private let healthKit = HealthKitService.shared

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView()
                    .padding(.top, 80)
            } else if hasError || weekData.isEmpty {
                emptyState
            } else {
                VStack(spacing: 24) {
                    currentValueHeader
                    chartSection
                    statsStrip
                    if let goal = dataType.dailyGoal {
                        goalBar(goal: goal)
                    }
                }
                .padding()
            }
        }
        .navigationTitle(dataType.displayName)
        .navigationBarTitleDisplayMode(.large)
        .task { await loadData() }
    }

    // MARK: - Subviews

    private var currentValueHeader: some View {
        VStack(spacing: 4) {
            if let latest = weekData.last {
                Text(formattedValue(latest.value))
                    .font(.system(size: 52, weight: .bold, design: .rounded))

                HStack(spacing: 4) {
                    Image(systemName: trendIcon)
                        .foregroundStyle(trendColor)
                    Text(trendLabel)
                        .font(.subheadline)
                        .foregroundStyle(trendColor)
                }
            }
        }
        .frame(maxWidth: .infinity)
    }

    private var chartSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Last 7 Days")
                .font(.headline)

            if dataType.isDiscrete {
                // Line chart for discrete metrics
                Chart(weekData, id: \.date) { item in
                    LineMark(
                        x: .value("Date", item.date, unit: .day),
                        y: .value(dataType.displayName, item.value)
                    )
                    .foregroundStyle(dataType.chartColor)
                    .interpolationMethod(.catmullRom)

                    AreaMark(
                        x: .value("Date", item.date, unit: .day),
                        y: .value(dataType.displayName, item.value)
                    )
                    .foregroundStyle(dataType.chartColor.opacity(0.1))
                }
                .frame(height: 180)
                .chartXAxis {
                    AxisMarks(values: .stride(by: .day)) { _ in
                        AxisGridLine()
                        AxisValueLabel(format: .dateTime.weekday(.abbreviated))
                    }
                }
            } else {
                // Bar chart for cumulative metrics
                Chart(weekData, id: \.date) { item in
                    BarMark(
                        x: .value("Date", item.date, unit: .day),
                        y: .value(dataType.displayName, item.value)
                    )
                    .foregroundStyle(dataType.chartColor)
                    .cornerRadius(4)
                }
                .frame(height: 180)
                .chartXAxis {
                    AxisMarks(values: .stride(by: .day)) { _ in
                        AxisGridLine()
                        AxisValueLabel(format: .dateTime.weekday(.abbreviated))
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(16)
    }

    private var statsStrip: some View {
        HStack {
            statCell(label: "Min", value: weekData.map(\.value).min())
            Divider().frame(height: 40)
            statCell(label: "Avg", value: weekData.isEmpty ? nil : weekData.map(\.value).reduce(0, +) / Double(weekData.count))
            Divider().frame(height: 40)
            statCell(label: "Max", value: weekData.map(\.value).max())
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(16)
    }

    private func statCell(label: String, value: Double?) -> some View {
        VStack(spacing: 4) {
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value.map { formattedValue($0) } ?? "--")
                .font(.headline)
        }
        .frame(maxWidth: .infinity)
    }

    private func goalBar(goal: Double) -> some View {
        let todayValue = weekData.last?.value ?? 0
        let progress = min(todayValue / goal, 1.0)

        return VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Today's Goal")
                    .font(.headline)
                Spacer()
                Text("\(formattedValue(todayValue)) / \(formattedValue(goal))")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color(.systemFill))
                        .frame(height: 8)
                    RoundedRectangle(cornerRadius: 4)
                        .fill(dataType.chartColor)
                        .frame(width: geo.size.width * progress, height: 8)
                }
            }
            .frame(height: 8)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(16)
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: dataType.icon)
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No data available for this period")
                .font(.headline)
                .foregroundStyle(.secondary)
        }
        .padding(.top, 80)
    }

    // MARK: - Helpers

    private func loadData() async {
        guard let identifier = dataType.healthKitIdentifier else {
            hasError = true
            isLoading = false
            return
        }
        isLoading = true
        do {
            weekData = try await healthKit.fetchWeekData(for: identifier, isDiscrete: dataType.isDiscrete)
        } catch {
            hasError = true
        }
        isLoading = false
    }

    private func formattedValue(_ value: Double) -> String {
        switch dataType {
        case .steps, .floorsClimbed:
            return Int(value).formatted()
        case .distance:
            return String(format: "%.2f km", value / 1000)
        case .activeCalories, .totalCalories:
            return "\(Int(value)) kcal"
        case .heartRate, .restingHeartRate:
            return "\(Int(value)) bpm"
        case .hrv:
            return "\(Int(value)) ms"
        case .weight:
            return String(format: "%.1f kg", value)
        case .bodyFat:
            return String(format: "%.1f%%", value * 100)
        default:
            return String(format: "%.1f", value)
        }
    }

    private var trendIcon: String {
        guard weekData.count >= 2 else { return "minus" }
        let recentSlice = weekData.suffix(3)
        let olderSlice = weekData.prefix(3)
        let recent = recentSlice.map(\.value).reduce(0, +) / Double(recentSlice.count)
        let older = olderSlice.map(\.value).reduce(0, +) / Double(olderSlice.count)
        if recent > older * 1.05 { return "arrow.up" }
        if recent < older * 0.95 { return "arrow.down" }
        return "minus"
    }

    private var trendColor: Color {
        guard weekData.count >= 2 else { return .secondary }
        let recentSlice = weekData.suffix(3)
        let olderSlice = weekData.prefix(3)
        let recent = recentSlice.map(\.value).reduce(0, +) / Double(recentSlice.count)
        let older = olderSlice.map(\.value).reduce(0, +) / Double(olderSlice.count)
        let higherIsBetter = dataType != .restingHeartRate
        if recent > older * 1.05 { return higherIsBetter ? .green : .red }
        if recent < older * 0.95 { return higherIsBetter ? .red : .green }
        return .secondary
    }

    private var trendLabel: String {
        guard weekData.count >= 2 else { return "No trend" }
        let recentSlice = weekData.suffix(3)
        let olderSlice = weekData.prefix(3)
        let recent = recentSlice.map(\.value).reduce(0, +) / Double(recentSlice.count)
        let older = olderSlice.map(\.value).reduce(0, +) / Double(olderSlice.count)
        guard older > 0 else { return "No trend" }
        let pct = Int(abs((recent - older) / older * 100))
        if pct < 5 { return "Stable" }
        return "\(pct)% vs last week"
    }
}

// MARK: - HealthDataType chart extensions

extension HealthDataType {
    var chartColor: Color {
        switch self {
        case .steps, .distance, .floorsClimbed: return .green
        case .activeCalories, .totalCalories: return .orange
        case .heartRate, .restingHeartRate: return .red
        case .hrv: return .purple
        case .weight, .bodyFat: return .blue
        default: return .accentColor
        }
    }

    var dailyGoal: Double? {
        switch self {
        case .steps: return 10_000
        case .activeCalories: return 500
        default: return nil
        }
    }
}

#Preview {
    NavigationStack {
        HealthMetricDetailView(dataType: .steps)
    }
}
```

- [ ] **Step 2: Register `HealthMetricDetailView.swift` in `project.pbxproj`**

In `project.pbxproj`, make three edits:

**2a — Add PBXBuildFile entry** (after `034 /* SleepView.swift in Sources */`):
```
		035 /* HealthMetricDetailView.swift in Sources */ = {isa = PBXBuildFile; fileRef = 131 /* HealthMetricDetailView.swift */; settings = {}; };
```

**2b — Add PBXFileReference entry** (after `130 /* SleepView.swift */`):
```
		131 /* HealthMetricDetailView.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = HealthMetricDetailView.swift; sourceTree = "<group>"; };
```

**2c — Add to Views group** (group `506`, after `130 /* SleepView.swift */,`):
```
			131 /* HealthMetricDetailView.swift */,
```

**2d — Add to Sources build phase** (phase `601`, after `034 /* SleepView.swift in Sources */,`):
```
			035 /* HealthMetricDetailView.swift in Sources */,
```

- [ ] **Step 3: Build verify**

```bash
cd ios && xcodebuild build \
  -project KQuarks.xcodeproj -scheme GetZen \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug CODE_SIGNING_ALLOWED=NO \
  2>&1 | grep -E "error:|BUILD SUCCEEDED|BUILD FAILED"
```

Expected: `** BUILD SUCCEEDED **`

- [ ] **Step 4: Commit**

```bash
git add ios/KQuarks/Views/HealthMetricDetailView.swift ios/KQuarks.xcodeproj/project.pbxproj
git commit -m "Add HealthMetricDetailView with 7-day Swift Charts"
```

---

## Task 3: Wire `HealthDataView` rows to `NavigationLink`

**Files:**
- Modify: `ios/KQuarks/Views/HealthDataView.swift`

`HealthDataRow` currently has a static `chevron.right` icon and no navigation. Replace it with a `NavigationLink`.

- [ ] **Step 1: Replace `HealthDataRow` body with a NavigationLink**

Find `HealthDataRow` in `HealthDataView.swift`. The `body` property contains an `HStack` with a `chevron.right` icon at the end. Replace the entire `var body: some View` with:

```swift
var body: some View {
    NavigationLink(destination: HealthMetricDetailView(dataType: dataType)) {
        HStack {
            Image(systemName: dataType.icon)
                .font(.title2)
                .foregroundColor(.accentColor)
                .frame(width: 44, height: 44)
                .background(Color.accentColor.opacity(0.1))
                .cornerRadius(10)

            VStack(alignment: .leading, spacing: 4) {
                Text(dataType.displayName)
                    .font(.headline)

                if isLoading {
                    ProgressView()
                        .scaleEffect(0.8)
                } else if let value = latestValue {
                    Text(formatValue(value, for: dataType))
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                } else {
                    Text("No data")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }
    .buttonStyle(.plain)
    .task {
        await loadData()
    }
}
```

Note: `.buttonStyle(.plain)` prevents the NavigationLink from highlighting the entire card blue. The `.task` moves from the old `HStack` modifier to here.

- [ ] **Step 2: Build verify**

```bash
cd ios && xcodebuild build \
  -project KQuarks.xcodeproj -scheme GetZen \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug CODE_SIGNING_ALLOWED=NO \
  2>&1 | grep -E "error:|BUILD SUCCEEDED|BUILD FAILED"
```

Expected: `** BUILD SUCCEEDED **`

- [ ] **Step 3: Commit**

```bash
git add ios/KQuarks/Views/HealthDataView.swift
git commit -m "Wire HealthDataView rows to HealthMetricDetailView"
```

---

## Task 4: Add background modes to `Info.plist`

**Files:**
- Modify: `ios/KQuarks/Info.plist`

The file already exists with `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `UIApplicationSceneManifest`, and `UILaunchScreen`. Add the two new keys inside the root `<dict>`:

- [ ] **Step 1: Edit `Info.plist`**

Add before the closing `</dict>` tag:

```xml
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
```

- [ ] **Step 2: Build verify** (the keys will appear in the built app's merged Info.plist)

```bash
cd ios && xcodebuild build \
  -project KQuarks.xcodeproj -scheme GetZen \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug CODE_SIGNING_ALLOWED=NO \
  2>&1 | grep -E "error:|BUILD SUCCEEDED|BUILD FAILED"
```

Expected: `** BUILD SUCCEEDED **`

- [ ] **Step 3: Commit**

```bash
git add ios/KQuarks/Info.plist
git commit -m "Add UIBackgroundModes and BGTaskSchedulerPermittedIdentifiers to Info.plist"
```

---

## Task 5: Add BGTask methods to `SyncService`

**Files:**
- Modify: `ios/KQuarks/Services/SyncService.swift`

- [ ] **Step 1: Add `import BackgroundTasks` at top of `SyncService.swift`**

Change:
```swift
import Foundation
import HealthKit
```
To:
```swift
import Foundation
import HealthKit
import BackgroundTasks
```

- [ ] **Step 2: Add `scheduleBackgroundSync()`, `handleRefreshTask()`, `handleFullSyncTask()` to `SyncService`**

Add a new `// MARK: - Background Sync` section after the existing `syncWorkouts()` method (before the `HKWorkoutActivityType` extension):

```swift
// MARK: - Background Sync

func scheduleBackgroundSync() {
    let refreshRequest = BGAppRefreshTaskRequest(identifier: "com.getzen.sync.refresh")
    refreshRequest.earliestBeginDate = Date(timeIntervalSinceNow: 2 * 3600)
    try? BGTaskScheduler.shared.submit(refreshRequest)

    let fullRequest = BGProcessingTaskRequest(identifier: "com.getzen.sync.full")
    fullRequest.requiresNetworkConnectivity = true
    fullRequest.requiresExternalPower = true
    try? BGTaskScheduler.shared.submit(fullRequest)
}

func handleRefreshTask(_ task: BGAppRefreshTask) async {
    // Reschedule before doing work so the next refresh is always queued
    scheduleBackgroundSync()

    guard supabase.isAuthenticated else {
        task.setTaskCompleted(success: true)
        return
    }

    do {
        try await syncTodaySummary()
        task.setTaskCompleted(success: true)
    } catch {
        print("[BGTask] Refresh sync failed: \(error)")
        task.setTaskCompleted(success: false)
    }
}

func handleFullSyncTask(_ task: BGProcessingTask) async {
    // Reschedule before doing work
    scheduleBackgroundSync()

    guard supabase.isAuthenticated else {
        task.setTaskCompleted(success: true)
        return
    }

    // Set expiration handler — OS can cancel long-running tasks
    var didExpire = false
    task.expirationHandler = {
        didExpire = true
        print("[BGTask] Full sync task expired")
    }

    await performFullSync()
    // Use local expiration flag + check syncError on MainActor to avoid data race
    let succeeded = await MainActor.run { syncError == nil } && !didExpire
    task.setTaskCompleted(success: succeeded)
}
```

Note: `syncTodaySummary()` is `private` but all three new methods are added to the same `SyncService` class — Swift `private` is accessible within the same class, so no visibility change is needed.

- [ ] **Step 3: Build verify**

```bash
cd ios && xcodebuild build \
  -project KQuarks.xcodeproj -scheme GetZen \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug CODE_SIGNING_ALLOWED=NO \
  2>&1 | grep -E "error:|BUILD SUCCEEDED|BUILD FAILED"
```

Expected: `** BUILD SUCCEEDED **`

- [ ] **Step 4: Commit**

```bash
git add ios/KQuarks/Services/SyncService.swift
git commit -m "Add BGTaskScheduler scheduling and handlers to SyncService"
```

---

## Task 6: Register handlers in `GetZenApp.init()` and schedule on launch

**Files:**
- Modify: `ios/KQuarks/App/GetZenApp.swift`

- [ ] **Step 1: Add `import BackgroundTasks` and an `init()` to `GetZenApp`**

The `GetZenApp` struct currently has no `init()`. Add one. The struct becomes:

```swift
import SwiftUI
import Supabase
import BackgroundTasks

@main
struct GetZenApp: App {
    @State private var appState = AppState()
    @State private var themeManager = ThemeManager.shared

    init() {
        // MUST register handlers before app finishes launching.
        // Do NOT move this to .task or .onAppear.
        BGTaskScheduler.shared.register(forTaskWithIdentifier: "com.getzen.sync.refresh", using: nil) { task in
            Task { await SyncService.shared.handleRefreshTask(task as! BGAppRefreshTask) }
        }
        BGTaskScheduler.shared.register(forTaskWithIdentifier: "com.getzen.sync.full", using: nil) { task in
            Task { await SyncService.shared.handleFullSyncTask(task as! BGProcessingTask) }
        }
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(appState)
                .environment(themeManager)
                .preferredColorScheme(themeManager.appearanceMode.colorScheme)
                .tint(themeManager.accentColor)
                .task {
                    await appState.initializeAuth()
                    // Schedule background sync after auth is ready
                    SyncService.shared.scheduleBackgroundSync()
                }
        }
    }
}
```

- [ ] **Step 2: Build verify**

```bash
cd ios && xcodebuild build \
  -project KQuarks.xcodeproj -scheme GetZen \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug CODE_SIGNING_ALLOWED=NO \
  2>&1 | grep -E "error:|BUILD SUCCEEDED|BUILD FAILED"
```

Expected: `** BUILD SUCCEEDED **`

- [ ] **Step 3: Commit**

```bash
git add ios/KQuarks/App/GetZenApp.swift
git commit -m "Register BGTask handlers in GetZenApp.init and schedule on launch"
```

---

## Task 7: Final build + push

- [ ] **Step 1: Full clean build**

```bash
cd ios && xcodebuild build \
  -project KQuarks.xcodeproj -scheme GetZen \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug CODE_SIGNING_ALLOWED=NO \
  2>&1 | tail -3
```

Expected: `** BUILD SUCCEEDED **`

- [ ] **Step 2: Push to remote**

```bash
git push origin main
```

---

## Manual Verification Checklist

After building and running on device/simulator:

- [ ] Tap any metric row in Health tab → pushes to `HealthMetricDetailView`
- [ ] Steps and Active Calories show bar charts; Heart Rate, HRV show line charts
- [ ] Min/Avg/Max strip shows sensible numbers
- [ ] Steps shows goal progress bar (10,000); Active Calories shows goal bar (500)
- [ ] Empty state shows for metrics with no HealthKit data
- [ ] In Xcode Organizer or Console: no crash on launch related to BGTaskScheduler

**Simulate background task in simulator:**
```
e -l objc -- (void)[[BGTaskScheduler sharedScheduler] _simulateLaunchForTaskWithIdentifier:@"com.getzen.sync.refresh"]
```
(Paste in Xcode debugger console while app is paused)
