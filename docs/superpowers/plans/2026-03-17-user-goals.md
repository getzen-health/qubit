# User-Configurable Health Goals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users set their own daily step and active-calorie targets via Settings, replacing hardcoded values in the goal bars shown in HealthMetricDetailView.

**Architecture:** A new `GoalService` singleton (`@Observable` + `@AppStorage`) stores goals in UserDefaults, following the exact same pattern as `ThemeManager`. A new `GoalsSettingsView` edits them via steppers. `HealthMetricDetailView` reads from `GoalService.shared` instead of a hardcoded property on `HealthDataType`.

**Tech Stack:** Swift 5.9+, SwiftUI, @Observable macro, @AppStorage, UserDefaults

---

## File Map

| File | Action | Notes |
|------|--------|-------|
| `ios/KQuarks/Services/GoalService.swift` | **Create** | GoalService singleton |
| `ios/KQuarks/Views/Settings/GoalsSettingsView.swift` | **Create** | Goal editing UI |
| `ios/KQuarks/Views/SettingsView.swift` | **Modify** | Add Goals NavigationLink in Health Data section |
| `ios/KQuarks/Views/HealthMetricDetailView.swift` | **Modify** | Remove `dailyGoal` extension, read from GoalService |
| `ios/KQuarks.xcodeproj/project.pbxproj` | **Modify** | Register both new files (IDs: fileRef 132/133, buildFile 036/037) |

---

### Task 1: Create GoalService and register in project

**Files:**
- Create: `ios/KQuarks/Services/GoalService.swift`
- Modify: `ios/KQuarks.xcodeproj/project.pbxproj`

- [ ] **Step 1: Write GoalService.swift**

Create `ios/KQuarks/Services/GoalService.swift` with this exact content:

```swift
import SwiftUI

@Observable
final class GoalService {
    static let shared = GoalService()
    private init() {}

    // @AppStorage inside @Observable must use @ObservationIgnored + computed property pair
    // Without @ObservationIgnored the @Observable macro conflicts with @AppStorage's machinery.
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

- [ ] **Step 2: Register GoalService.swift in project.pbxproj**

In `ios/KQuarks.xcodeproj/project.pbxproj`, make three edits:

**2a. Add PBXBuildFile entry** — in the `/* Begin PBXBuildFile section */` block, after the line for `035 /* HealthMetricDetailView.swift in Sources */`:

```
		036 /* GoalService.swift in Sources */ = {isa = PBXBuildFile; fileRef = 132 /* GoalService.swift */; };
```

**2b. Add PBXFileReference entry** — in the `/* Begin PBXFileReference section */` block, after the line for `131 /* HealthMetricDetailView.swift */`:

```
		132 /* GoalService.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = GoalService.swift; sourceTree = "<group>"; };
```

**2c. Add to Services group (507)** — find the `507 /* Services */` group children array (currently ends with `128 /* AIInsightsService.swift */`), add after it:

```
				132 /* GoalService.swift */,
```

**2d. Add to Sources build phase (601)** — find the `601 /* Sources */` files array, add after `035 /* HealthMetricDetailView.swift in Sources */`:

```
			036 /* GoalService.swift in Sources */,
```

- [ ] **Step 3: Verify build succeeds**

```bash
cd /Users/qxlsz/projects/getzen/ios && xcodebuild build \
  -project KQuarks.xcodeproj \
  -scheme GetZen \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO \
  2>&1 | grep -E "error:|warning:|BUILD SUCCEEDED|BUILD FAILED"
```

Expected: `BUILD SUCCEEDED` with no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/qxlsz/projects/getzen && git add ios/KQuarks/Services/GoalService.swift ios/KQuarks.xcodeproj/project.pbxproj
git commit -m "Add GoalService for user-configurable health goals"
```

---

### Task 2: Create GoalsSettingsView and register in project

**Files:**
- Create: `ios/KQuarks/Views/Settings/GoalsSettingsView.swift`
- Modify: `ios/KQuarks.xcodeproj/project.pbxproj`

- [ ] **Step 1: Write GoalsSettingsView.swift**

Create `ios/KQuarks/Views/Settings/GoalsSettingsView.swift`:

```swift
import SwiftUI

struct GoalsSettingsView: View {
    @Bindable var goalService = GoalService.shared

    var body: some View {
        Form {
            Section("Daily Activity") {
                HStack {
                    Label("Steps", systemImage: "figure.walk")
                    Spacer()
                    Stepper(
                        "\(Int(goalService.stepsGoal).formatted()) steps",
                        value: $goalService.stepsGoal,
                        in: 1_000...30_000,
                        step: 500
                    )
                }

                HStack {
                    Label("Active Calories", systemImage: "flame")
                    Spacer()
                    Stepper(
                        "\(Int(goalService.activeCaloriesGoal)) kcal",
                        value: $goalService.activeCaloriesGoal,
                        in: 100...2_000,
                        step: 50
                    )
                }
            }

            Section {
                Button("Reset to Defaults", role: .destructive) {
                    goalService.reset()
                }
            }
        }
        .navigationTitle("Health Goals")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    NavigationStack {
        GoalsSettingsView()
    }
}
```

- [ ] **Step 2: Register GoalsSettingsView.swift in project.pbxproj**

In `ios/KQuarks.xcodeproj/project.pbxproj`, make three edits:

**2a. Add PBXBuildFile entry** — after `036 /* GoalService.swift in Sources */`:

```
		037 /* GoalsSettingsView.swift in Sources */ = {isa = PBXBuildFile; fileRef = 133 /* GoalsSettingsView.swift */; };
```

**2b. Add PBXFileReference entry** — after `132 /* GoalService.swift */`:

```
		133 /* GoalsSettingsView.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = GoalsSettingsView.swift; sourceTree = "<group>"; };
```

**2c. Add to Settings group (512)** — find the `512 /* Settings */` group children array (contains `124 /* AppearanceSettingsView.swift */` and `125 /* DashboardConfigView.swift */`), add after `125`:

```
				133 /* GoalsSettingsView.swift */,
```

**2d. Add to Sources build phase (601)** — after `036 /* GoalService.swift in Sources */`:

```
			037 /* GoalsSettingsView.swift in Sources */,
```

- [ ] **Step 3: Verify build succeeds**

```bash
cd /Users/qxlsz/projects/getzen/ios && xcodebuild build \
  -project KQuarks.xcodeproj \
  -scheme GetZen \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO \
  2>&1 | grep -E "error:|warning:|BUILD SUCCEEDED|BUILD FAILED"
```

Expected: `BUILD SUCCEEDED` with no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/qxlsz/projects/getzen && git add ios/KQuarks/Views/Settings/GoalsSettingsView.swift ios/KQuarks.xcodeproj/project.pbxproj
git commit -m "Add GoalsSettingsView for editing daily health targets"
```

---

### Task 3: Wire Goals into SettingsView

**Files:**
- Modify: `ios/KQuarks/Views/SettingsView.swift`

- [ ] **Step 1: Add Goals NavigationLink to the Health Data section**

In `ios/KQuarks/Views/SettingsView.swift`, find the `Health Data` section. The current Health Permissions button is at line 100. Insert a `NavigationLink` to `GoalsSettingsView` between the Health Permissions button and the Delete Synced Data button:

```swift
// Health section
Section("Health Data") {
    Button {
        if let url = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(url)
        }
    } label: {
        Label("Health Permissions", systemImage: "heart.text.square")
    }

    NavigationLink {
        GoalsSettingsView()
    } label: {
        Label("Goals", systemImage: "target")
    }

    Button(role: .destructive) {
        showingDeleteDataAlert = true
    } label: {
        HStack {
            Label("Delete Synced Data", systemImage: "trash")
            Spacer()
            if isDeletingData {
                ProgressView()
            }
        }
    }
    .disabled(isDeletingData)
}
```

- [ ] **Step 2: Verify build succeeds**

```bash
cd /Users/qxlsz/projects/getzen/ios && xcodebuild build \
  -project KQuarks.xcodeproj \
  -scheme GetZen \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO \
  2>&1 | grep -E "error:|warning:|BUILD SUCCEEDED|BUILD FAILED"
```

Expected: `BUILD SUCCEEDED` with no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/qxlsz/projects/getzen && git add ios/KQuarks/Views/SettingsView.swift
git commit -m "Add Goals link in Settings Health Data section"
```

---

### Task 4: Update HealthMetricDetailView to read goals from GoalService

**Files:**
- Modify: `ios/KQuarks/Views/HealthMetricDetailView.swift`

This task removes the hardcoded `dailyGoal` extension and replaces the call site with `GoalService.shared.goal(for:)`. Because `GoalService` is `@Observable`, reading its properties inside `body` creates a SwiftUI observation dependency — the view will re-render automatically when goals change.

- [ ] **Step 1: Replace the call site in the view body**

In `HealthMetricDetailView.body`, at line 26, change:

```swift
if let goal = dataType.dailyGoal {
    goalBar(goal: goal)
}
```

to:

```swift
if let goal = GoalService.shared.goal(for: dataType) {
    goalBar(goal: goal)
}
```

- [ ] **Step 2: Remove the hardcoded `dailyGoal` computed property**

At the bottom of `HealthMetricDetailView.swift`, in the `extension HealthDataType` block (lines 265–271), remove the entire `dailyGoal` property:

```swift
    var dailyGoal: Double? {
        switch self {
        case .steps: return 10_000
        case .activeCalories: return 500
        default: return nil
        }
    }
```

After removal the extension should contain only `chartColor`.

- [ ] **Step 3: Verify build succeeds**

```bash
cd /Users/qxlsz/projects/getzen/ios && xcodebuild build \
  -project KQuarks.xcodeproj \
  -scheme GetZen \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO \
  2>&1 | grep -E "error:|warning:|BUILD SUCCEEDED|BUILD FAILED"
```

Expected: `BUILD SUCCEEDED` with no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/qxlsz/projects/getzen && git add ios/KQuarks/Views/HealthMetricDetailView.swift
git commit -m "Read daily goals from GoalService instead of hardcoded values"
```

---

### Task 5: Merge to main

- [ ] **Step 1: Push to main**

```bash
cd /Users/qxlsz/projects/getzen && git push origin main
```

Expected: All 4 commits pushed successfully.
