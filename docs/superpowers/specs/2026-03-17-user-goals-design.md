# User-Configurable Health Goals — Design Spec

**Date:** 2026-03-17
**Project:** KQuarks iOS app
**Status:** Approved

---

## Overview

The `HealthMetricDetailView` shows goal progress bars for steps (10,000/day) and active calories (500/day), but these values are hardcoded. This feature lets users set their own daily targets via a new Goals settings screen.

---

## Feature: User Goals in Settings

### Goal

Replace hardcoded goal constants with a `GoalService` that persists user-set values in `UserDefaults` via `@AppStorage`. A new `GoalsSettingsView` gives users a dedicated screen to adjust their targets.

---

## Architecture

### GoalService

New file: `ios/KQuarks/Services/GoalService.swift`

`@Observable` singleton following the existing `ThemeManager` pattern.

```swift
@Observable
final class GoalService {
    static let shared = GoalService()
    private init() {}

    // @AppStorage inside @Observable must use @ObservationIgnored + computed property pair
    // (matching ThemeManager.swift pattern — without @ObservationIgnored the macro conflicts)
    @ObservationIgnored
    @AppStorage("goal_steps") private var storedStepsGoal: Double = 10_000

    @ObservationIgnored
    @AppStorage("goal_activeCalories") private var storedActiveCaloriesGoal: Double = 500

    var stepsGoal: Double {
        get { storedStepsGoal }
        set { storedStepsGoal = newValue }
    }

    var activeCaloriesGoal: Double {
        get { storedActiveCaloriesGoal }
        set { storedActiveCaloriesGoal = newValue }
    }

    func goal(for dataType: HealthDataType) -> Double? {
        switch dataType {
        case .steps: return stepsGoal
        case .activeCalories: return activeCaloriesGoal
        default: return nil
        }
    }

    func reset() {
        stepsGoal = 10_000
        activeCaloriesGoal = 500
    }
}
```

### GoalsSettingsView

New file: `ios/KQuarks/Views/Settings/GoalsSettingsView.swift`

Single `Form` with two sections:

**Section "Daily Activity":**
- Steps row: label + Stepper (range 1,000–30,000, step 500), formatted as "10,000 steps"
- Active Calories row: label + Stepper (range 100–2,000, step 50), formatted as "500 kcal"

**"Reset to Defaults" button** at the bottom (destructive style, calls `GoalService.shared.reset()`).

The view reads/writes directly to `GoalService.shared` properties using `@Bindable`.

### SettingsView changes

Add a "Goals" row to the existing **Health Data** section (between the Health Permissions button and the Delete Synced Data button):

```
Health Data
  └─ Health Permissions     (existing)
  └─ Goals               ← new NavigationLink → GoalsSettingsView
  └─ Delete Synced Data    (existing)
```

### HealthMetricDetailView changes

Remove the `var dailyGoal: Double?` computed property from the `HealthDataType` extension at the bottom of `HealthMetricDetailView.swift`. Replace the call site in the view body with a direct call to `GoalService.shared.goal(for:)`.

The property is currently:
```swift
var dailyGoal: Double? {
    switch self {
    case .steps: return 10_000
    case .activeCalories: return 500
    default: return nil
    }
}
```

The call site in `HealthMetricDetailView.body` currently reads:
```swift
if let goal = dataType.dailyGoal {
    goalBar(goal: goal)
}
```

After change it becomes:
```swift
if let goal = GoalService.shared.goal(for: dataType) {
    goalBar(goal: goal)
}
```

The call must be inline in `body` (not stored in a `@State` variable) so SwiftUI's `@Observable` tracking picks up the dependency and re-renders when the goal changes.

---

## Files Changed/Created

| File | Change |
|------|--------|
| `ios/KQuarks/Services/GoalService.swift` | New — goal persistence singleton |
| `ios/KQuarks/Views/Settings/GoalsSettingsView.swift` | New — goals editing UI |
| `ios/KQuarks/Views/SettingsView.swift` | Add Goals NavigationLink in Health Data section |
| `ios/KQuarks/Views/HealthMetricDetailView.swift` | Remove hardcoded `dailyGoal`, read from GoalService |
| `ios/KQuarks.xcodeproj/project.pbxproj` | Register two new Swift files. `GoalsSettingsView.swift` must be added to the existing `Settings` Xcode group (same group as `AppearanceSettingsView.swift`/`DashboardConfigView.swift`), not a new top-level group. `GoalService.swift` goes in the `Services` group. |

---

## Data Flow

```
GoalService (@Observable singleton)
  ├─ @AppStorage("goal_steps") → UserDefaults
  └─ @AppStorage("goal_activeCalories") → UserDefaults

GoalsSettingsView (@Bindable goalService = GoalService.shared)
  └─ Stepper ↔ goalService.stepsGoal / goalService.activeCaloriesGoal

HealthMetricDetailView
  └─ GoalService.shared.goal(for: dataType) → goal progress bar
```

Changes propagate automatically: `GoalService` is `@Observable`, so any view referencing its properties re-renders when they change.

---

## Error Handling

None required — `@AppStorage` read/write is infallible. Steppers clamp values to valid ranges in the UI.

---

## Success Criteria

- User can open Settings → Goals and adjust step/calorie targets
- Values persist across app restarts
- `HealthMetricDetailView` goal bars reflect the user-set values immediately after change
- Resetting to defaults restores 10,000 steps / 500 kcal
- `xcodebuild` succeeds with no errors
