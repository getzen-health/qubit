# KQuarks: Workouts View, Sleep View, Delete Data

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace two placeholder screens (Workouts, Sleep) with real data-driven views, and implement the Delete Synced Data action in Settings.

**Architecture:** All three features read from HealthKit (local) and/or Supabase (cloud). No new services needed — `HealthKitService` and `SupabaseService` already have the required methods. New views are self-contained files added to the project.

**Tech Stack:** Swift 5.9+ / SwiftUI / HealthKit / @Observable

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `ios/KQuarks/Views/WorkoutsView.swift` | Full workout history list with detail rows |
| `ios/KQuarks/Views/SleepView.swift` | Sleep history with stages breakdown and weekly average |

### Modified Files

| File | Changes |
|------|---------|
| `ios/KQuarks/Views/Navigation/SidebarView.swift` | Replace `WorkoutsPlaceholderView` and `SleepPlaceholderView` with real views |
| `ios/KQuarks/Services/SupabaseService.swift` | Add `deleteAllUserData()` method |
| `ios/KQuarks/Views/SettingsView.swift` | Wire delete button to `SupabaseService.deleteAllUserData()` |

---

## Task 1: WorkoutsView

**Files:**
- Create: `ios/KQuarks/Views/WorkoutsView.swift`
- Modify: `ios/KQuarks/Views/Navigation/SidebarView.swift`

- [ ] **Step 1: Create WorkoutsView.swift**

```swift
import SwiftUI
import HealthKit

struct WorkoutsView: View {
    @State private var workouts: [HKWorkout] = []
    @State private var isLoading = false
    @State private var selectedPeriod: WorkoutPeriod = .month

    private let healthKit = HealthKitService.shared

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if workouts.isEmpty {
                    ContentUnavailableView(
                        "No Workouts",
                        systemImage: "figure.run",
                        description: Text("No workouts found for this period. Start tracking workouts in the Apple Health app.")
                    )
                } else {
                    List {
                        ForEach(workouts, id: \.uuid) { workout in
                            WorkoutRow(workout: workout)
                        }
                    }
                    .listStyle(.insetGrouped)
                }
            }
            .navigationTitle("Workouts")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Picker("Period", selection: $selectedPeriod) {
                        ForEach(WorkoutPeriod.allCases, id: \.self) { period in
                            Text(period.label).tag(period)
                        }
                    }
                    .pickerStyle(.menu)
                }
            }
            .task(id: selectedPeriod) {
                await loadWorkouts()
            }
        }
    }

    private func loadWorkouts() async {
        isLoading = true
        let calendar = Calendar.current
        let startDate = calendar.date(byAdding: selectedPeriod.dateComponent, value: -selectedPeriod.value, to: Date())!
        workouts = (try? await healthKit.fetchWorkouts(from: startDate, to: Date())) ?? []
        isLoading = false
    }
}

// MARK: - Workout Row

struct WorkoutRow: View {
    let workout: HKWorkout

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: workout.workoutActivityType.icon)
                .font(.title2)
                .foregroundColor(workout.workoutActivityType.color)
                .frame(width: 44, height: 44)
                .background(workout.workoutActivityType.color.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 10))

            VStack(alignment: .leading, spacing: 3) {
                Text(workout.workoutActivityType.name)
                    .font(.headline)

                Text(workout.startDate, style: .date)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 3) {
                Text(formatDuration(workout.duration))
                    .font(.subheadline.monospacedDigit())

                if let calories = workout.totalEnergyBurned?.doubleValue(for: .kilocalorie()) {
                    Text("\(Int(calories)) cal")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(.vertical, 4)
    }

    private func formatDuration(_ seconds: TimeInterval) -> String {
        let h = Int(seconds) / 3600
        let m = (Int(seconds) % 3600) / 60
        if h > 0 {
            return "\(h)h \(m)m"
        }
        return "\(m)m"
    }
}

// MARK: - Period Picker

enum WorkoutPeriod: CaseIterable {
    case week, month, threeMonths

    var label: String {
        switch self {
        case .week: return "1W"
        case .month: return "1M"
        case .threeMonths: return "3M"
        }
    }

    var dateComponent: Calendar.Component { .day }

    var value: Int {
        switch self {
        case .week: return 7
        case .month: return 30
        case .threeMonths: return 90
        }
    }
}

// MARK: - HKWorkoutActivityType Extensions

extension HKWorkoutActivityType {
    var icon: String {
        switch self {
        case .running: return "figure.run"
        case .cycling: return "figure.outdoor.cycle"
        case .walking: return "figure.walk"
        case .swimming: return "figure.pool.swim"
        case .yoga: return "figure.mind.and.body"
        case .functionalStrengthTraining, .traditionalStrengthTraining: return "dumbbell"
        case .highIntensityIntervalTraining: return "bolt.heart"
        case .hiking: return "figure.hiking"
        case .elliptical: return "figure.elliptical"
        case .rowing: return "figure.rowing"
        case .stairClimbing: return "figure.stair.stepper"
        case .pilates: return "figure.pilates"
        case .dance: return "figure.dance"
        default: return "figure.mixed.cardio"
        }
    }

    var color: Color {
        switch self {
        case .running, .walking, .hiking: return .green
        case .cycling: return .orange
        case .swimming: return .blue
        case .yoga, .pilates: return .purple
        case .functionalStrengthTraining, .traditionalStrengthTraining: return .red
        case .highIntensityIntervalTraining: return .orange
        default: return .teal
        }
    }
}

#Preview {
    WorkoutsView()
}
```

- [ ] **Step 2: Replace WorkoutsPlaceholderView usage in SidebarView.swift**

In `SidebarContentView`, replace:
```swift
case .workouts:
    WorkoutsPlaceholderView()
```
with:
```swift
case .workouts:
    WorkoutsView()
```

Also delete the `WorkoutsPlaceholderView` struct from the file entirely.

- [ ] **Step 3: Add WorkoutsView.swift to Xcode project**

Add to `project.pbxproj`: PBXFileReference, PBXBuildFile in Sources, add to Views PBXGroup.

- [ ] **Step 4: Build and verify**

```bash
cd ios && xcodebuild build \
  -project KQuarks.xcodeproj \
  -scheme KQuarks \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO 2>&1 | tail -5
```
Expected: BUILD SUCCEEDED

- [ ] **Step 5: Commit**

```bash
git add ios/KQuarks/Views/WorkoutsView.swift ios/KQuarks/Views/Navigation/SidebarView.swift ios/KQuarks.xcodeproj/project.pbxproj
git commit -m "Add WorkoutsView with real HealthKit workout history"
```

---

## Task 2: SleepView

**Files:**
- Create: `ios/KQuarks/Views/SleepView.swift`
- Modify: `ios/KQuarks/Views/Navigation/SidebarView.swift`

- [ ] **Step 1: Create SleepView.swift**

```swift
import SwiftUI
import HealthKit

struct SleepView: View {
    @State private var sessions: [SleepSession] = []
    @State private var isLoading = false

    private let healthKit = HealthKitService.shared

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if sessions.isEmpty {
                    ContentUnavailableView(
                        "No Sleep Data",
                        systemImage: "moon.zzz",
                        description: Text("No sleep data found for the past 14 days. Enable sleep tracking in your Apple Watch or iPhone.")
                    )
                } else {
                    List {
                        // Weekly average header
                        if sessions.count >= 3 {
                            Section {
                                SleepWeeklyAverageRow(sessions: sessions)
                            }
                        }

                        // Individual nights
                        Section("Recent Nights") {
                            ForEach(sessions) { session in
                                SleepSessionRow(session: session)
                            }
                        }
                    }
                    .listStyle(.insetGrouped)
                }
            }
            .navigationTitle("Sleep")
            .task {
                await loadSleep()
            }
        }
    }

    private func loadSleep() async {
        isLoading = true
        let calendar = Calendar.current
        let twoWeeksAgo = calendar.date(byAdding: .day, value: -14, to: Date())!
        let samples = (try? await healthKit.fetchSleepAnalysis(from: twoWeeksAgo, to: Date())) ?? []
        sessions = groupSamplesIntoSessions(samples)
        isLoading = false
    }

    /// Group HealthKit sleep samples into nightly sessions
    private func groupSamplesIntoSessions(_ samples: [HKCategorySample]) -> [SleepSession] {
        guard !samples.isEmpty else { return [] }

        // Group by calendar day (the day you wake up)
        let calendar = Calendar.current
        var byDay: [DateComponents: [HKCategorySample]] = [:]

        for sample in samples {
            // Use the wake-up day as the key
            let wakeDay = calendar.dateComponents([.year, .month, .day], from: sample.endDate)
            byDay[wakeDay, default: []].append(sample)
        }

        return byDay.compactMap { (dayComponents, daySamples) -> SleepSession? in
            guard let date = calendar.date(from: dayComponents) else { return nil }

            var deep = 0, rem = 0, core = 0, awake = 0
            for sample in daySamples {
                let mins = Int(sample.endDate.timeIntervalSince(sample.startDate) / 60)
                switch HKCategoryValueSleepAnalysis(rawValue: sample.value) {
                case .asleepDeep: deep += mins
                case .asleepREM: rem += mins
                case .asleepCore, .asleepUnspecified: core += mins
                case .awake, .inBed: awake += mins
                default: break
                }
            }

            let total = deep + rem + core
            guard total > 60 else { return nil } // Filter out very short fragments

            return SleepSession(
                date: date,
                totalMinutes: total,
                deepMinutes: deep,
                remMinutes: rem,
                coreMinutes: core,
                awakeMinutes: awake
            )
        }
        .sorted { $0.date > $1.date }
    }
}

// MARK: - Sleep Session Model

struct SleepSession: Identifiable {
    let id = UUID()
    let date: Date
    let totalMinutes: Int
    let deepMinutes: Int
    let remMinutes: Int
    let coreMinutes: Int
    let awakeMinutes: Int

    var formattedTotal: String {
        let h = totalMinutes / 60
        let m = totalMinutes % 60
        return "\(h)h \(m)m"
    }

    var deepPercent: Double {
        guard totalMinutes > 0 else { return 0 }
        return Double(deepMinutes) / Double(totalMinutes)
    }

    var remPercent: Double {
        guard totalMinutes > 0 else { return 0 }
        return Double(remMinutes) / Double(totalMinutes)
    }
}

// MARK: - Weekly Average Row

struct SleepWeeklyAverageRow: View {
    let sessions: [SleepSession]

    private var avgMinutes: Int {
        sessions.prefix(7).reduce(0) { $0 + $1.totalMinutes } / max(min(sessions.count, 7), 1)
    }

    private var avgDeep: Int {
        sessions.prefix(7).reduce(0) { $0 + $1.deepMinutes } / max(min(sessions.count, 7), 1)
    }

    private var avgRem: Int {
        sessions.prefix(7).reduce(0) { $0 + $1.remMinutes } / max(min(sessions.count, 7), 1)
    }

    private func fmt(_ minutes: Int) -> String {
        let h = minutes / 60
        let m = minutes % 60
        return h > 0 ? "\(h)h \(m)m" : "\(m)m"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("7-Day Average")
                .font(.headline)

            HStack(spacing: 0) {
                StatBubble(label: "Total", value: fmt(avgMinutes), color: .indigo)
                Divider().frame(height: 40)
                StatBubble(label: "Deep", value: fmt(avgDeep), color: .blue)
                Divider().frame(height: 40)
                StatBubble(label: "REM", value: fmt(avgRem), color: .purple)
            }
            .frame(maxWidth: .infinity)
            .background(Color(.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 10))
        }
        .padding(.vertical, 4)
    }
}

struct StatBubble: View {
    let label: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.subheadline.bold().monospacedDigit())
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
    }
}

// MARK: - Sleep Session Row

struct SleepSessionRow: View {
    let session: SleepSession

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(session.date, style: .date)
                    .font(.headline)
                Spacer()
                Text(session.formattedTotal)
                    .font(.subheadline.monospacedDigit().bold())
                    .foregroundStyle(.indigo)
            }

            // Stage bar
            SleepStagesBar(session: session)

            // Stage breakdown
            HStack(spacing: 16) {
                SleepStagePill(label: "Deep", minutes: session.deepMinutes, color: .blue)
                SleepStagePill(label: "REM", minutes: session.remMinutes, color: .purple)
                SleepStagePill(label: "Light", minutes: session.coreMinutes, color: .indigo.opacity(0.5))
                if session.awakeMinutes > 0 {
                    SleepStagePill(label: "Awake", minutes: session.awakeMinutes, color: .orange)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

struct SleepStagesBar: View {
    let session: SleepSession

    var total: Int { session.totalMinutes + session.awakeMinutes }

    var body: some View {
        GeometryReader { geo in
            HStack(spacing: 1) {
                let w = geo.size.width
                if session.deepMinutes > 0 {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color.blue)
                        .frame(width: w * CGFloat(session.deepMinutes) / CGFloat(max(total, 1)))
                }
                if session.remMinutes > 0 {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color.purple)
                        .frame(width: w * CGFloat(session.remMinutes) / CGFloat(max(total, 1)))
                }
                if session.coreMinutes > 0 {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color.indigo.opacity(0.5))
                        .frame(width: w * CGFloat(session.coreMinutes) / CGFloat(max(total, 1)))
                }
                if session.awakeMinutes > 0 {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color.orange.opacity(0.4))
                        .frame(width: w * CGFloat(session.awakeMinutes) / CGFloat(max(total, 1)))
                }
            }
        }
        .frame(height: 8)
        .clipShape(RoundedRectangle(cornerRadius: 4))
    }
}

struct SleepStagePill: View {
    let label: String
    let minutes: Int
    let color: Color

    private func fmt(_ m: Int) -> String {
        let h = m / 60
        let min = m % 60
        return h > 0 ? "\(h)h\(min)m" : "\(min)m"
    }

    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)
            Text("\(label) \(fmt(minutes))")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}

#Preview {
    SleepView()
}
```

- [ ] **Step 2: Replace SleepPlaceholderView usage in SidebarView.swift**

In `SidebarContentView`, replace:
```swift
case .sleep:
    SleepPlaceholderView()
```
with:
```swift
case .sleep:
    SleepView()
```

Delete the `SleepPlaceholderView` struct entirely.

- [ ] **Step 3: Add SleepView.swift to Xcode project**

Add to `project.pbxproj`: PBXFileReference, PBXBuildFile in Sources, add to Views PBXGroup.

- [ ] **Step 4: Build and verify**

```bash
cd ios && xcodebuild build \
  -project KQuarks.xcodeproj \
  -scheme KQuarks \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO 2>&1 | tail -5
```
Expected: BUILD SUCCEEDED

- [ ] **Step 5: Commit**

```bash
git add ios/KQuarks/Views/SleepView.swift ios/KQuarks/Views/Navigation/SidebarView.swift ios/KQuarks.xcodeproj/project.pbxproj
git commit -m "Add SleepView with session breakdown and weekly averages"
```

---

## Task 3: Implement Delete Synced Data

**Files:**
- Modify: `ios/KQuarks/Services/SupabaseService.swift`
- Modify: `ios/KQuarks/Views/SettingsView.swift`

- [ ] **Step 1: Add deleteAllUserData() to SupabaseService**

Add this method to `SupabaseService.swift` after `fetchInsights()`:

```swift
/// Deletes all synced health data for the current user from Supabase.
/// Does NOT delete the user account itself.
func deleteAllUserData() async throws {
    guard let session = currentSession else {
        throw SupabaseError.notAuthenticated
    }
    let userId = session.user.id.uuidString

    // Delete from all health tables in order (no FK constraints to worry about)
    try await client.from("health_insights").delete().eq("user_id", value: userId).execute()
    try await client.from("sleep_records").delete().eq("user_id", value: userId).execute()
    try await client.from("workout_records").delete().eq("user_id", value: userId).execute()
    try await client.from("health_records").delete().eq("user_id", value: userId).execute()
    try await client.from("daily_summaries").delete().eq("user_id", value: userId).execute()
}
```

- [ ] **Step 2: Wire the delete button in SettingsView**

In `SettingsView`, add a state variable for tracking deletion progress:

```swift
@State private var isDeletingData = false
@State private var showingDeleteErrorAlert = false
@State private var deleteErrorMessage = ""
```

Replace the empty delete button handler:
```swift
// OLD:
Button(role: .destructive) {
    showingDeleteDataAlert = true
} label: {
    Label("Delete Synced Data", systemImage: "trash")
}
```

Keep the button the same but wire the alert action:

Find the delete alert:
```swift
.alert("Delete Data", isPresented: $showingDeleteDataAlert) {
    Button("Cancel", role: .cancel) { }
    Button("Delete", role: .destructive) {
        // TODO: Delete synced data
    }
} message: {
    Text("This will delete all your synced health data from the cloud. This action cannot be undone.")
}
```

Replace with:
```swift
.alert("Delete Data", isPresented: $showingDeleteDataAlert) {
    Button("Cancel", role: .cancel) { }
    Button("Delete", role: .destructive) {
        Task {
            isDeletingData = true
            do {
                try await SupabaseService.shared.deleteAllUserData()
            } catch {
                deleteErrorMessage = error.localizedDescription
                showingDeleteErrorAlert = true
            }
            isDeletingData = false
        }
    }
} message: {
    Text("This will delete all your synced health data from the cloud. This action cannot be undone.")
}
.alert("Delete Failed", isPresented: $showingDeleteErrorAlert) {
    Button("OK", role: .cancel) { }
} message: {
    Text(deleteErrorMessage)
}
```

Also show a progress indicator when deleting — add this inside the "Health Data" section, below the delete button:

```swift
if isDeletingData {
    HStack {
        ProgressView()
            .scaleEffect(0.8)
        Text("Deleting data...")
            .font(.caption)
            .foregroundColor(.secondary)
    }
}
```

- [ ] **Step 3: Build and verify**

```bash
cd ios && xcodebuild build \
  -project KQuarks.xcodeproj \
  -scheme KQuarks \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO 2>&1 | tail -5
```
Expected: BUILD SUCCEEDED

- [ ] **Step 4: Commit**

```bash
git add ios/KQuarks/Services/SupabaseService.swift ios/KQuarks/Views/SettingsView.swift
git commit -m "Implement delete synced data with progress and error handling"
```
