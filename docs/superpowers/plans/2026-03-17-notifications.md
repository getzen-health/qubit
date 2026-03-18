# Local Push Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fire local notifications when the step goal is reached after a sync, and when AI insights are generated.

**Architecture:** New `NotificationService` singleton (`@Observable`, `UNUserNotificationCenter`). `SyncService` and `AIInsightsService` call it after successful operations. `SettingsView` shows notification status.

**Tech Stack:** Swift 5.9+, SwiftUI, UserNotifications framework

---

## File Map

| File | Action |
|------|--------|
| `ios/KQuarks/Services/NotificationService.swift` | Create |
| `ios/KQuarks/Services/SyncService.swift` | Modify (2 insertions) |
| `ios/KQuarks/Services/AIInsightsService.swift` | Modify (1 insertion) |
| `ios/KQuarks/App/KQuarksApp.swift` | Modify (add refreshAuthorizationStatus call) |
| `ios/KQuarks/Views/SettingsView.swift` | Modify (add Notifications section) |
| `ios/KQuarks.xcodeproj/project.pbxproj` | Modify (fileRef 134, buildFile 038) |

---

### Task 1: Create NotificationService and register in project

**Files:**
- Create: `ios/KQuarks/Services/NotificationService.swift`
- Modify: `ios/KQuarks.xcodeproj/project.pbxproj`

- [ ] **Step 1: Create NotificationService.swift**

Create `ios/KQuarks/Services/NotificationService.swift`:

```swift
import UserNotifications

@Observable
final class NotificationService {
    static let shared = NotificationService()
    private init() {}

    var isAuthorized = false

    private let stepGoalNotifiedKey = "stepGoalNotifiedDate"

    func requestPermission() async {
        do {
            let granted = try await UNUserNotificationCenter.current()
                .requestAuthorization(options: [.alert, .sound, .badge])
            await MainActor.run { isAuthorized = granted }
        } catch {
            await MainActor.run { isAuthorized = false }
        }
    }

    func refreshAuthorizationStatus() async {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        await MainActor.run {
            isAuthorized = settings.authorizationStatus == .authorized
        }
    }

    func notifyAfterSync() async {
        guard isAuthorized else { return }
        guard !alreadyNotifiedStepGoalToday() else { return }

        do {
            let summary = try await HealthKitService.shared.fetchTodaySummary()
            let goal = GoalService.shared.stepsGoal
            if Double(summary.steps) >= goal {
                scheduleStepGoalNotification(steps: Double(summary.steps), goal: goal)
                markStepGoalNotifiedToday()
            }
        } catch { }
    }

    func scheduleInsightsNotification() {
        guard isAuthorized else { return }
        let content = UNMutableNotificationContent()
        content.title = "New Health Insights"
        content.body = "Your AI-powered health insights are ready to view."
        content.sound = .default
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: "insights-ready-\(Date().timeIntervalSince1970)",
            content: content,
            trigger: trigger
        )
        UNUserNotificationCenter.current().add(request)
    }

    private func scheduleStepGoalNotification(steps: Double, goal: Double) {
        let content = UNMutableNotificationContent()
        content.title = "Step Goal Reached!"
        content.body = "You've hit \(Int(steps).formatted()) steps today. Keep it up!"
        content.sound = .default
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: "step-goal-\(Date().timeIntervalSince1970)",
            content: content,
            trigger: trigger
        )
        UNUserNotificationCenter.current().add(request)
    }

    private func alreadyNotifiedStepGoalToday() -> Bool {
        guard let last = UserDefaults.standard.object(forKey: stepGoalNotifiedKey) as? Date else {
            return false
        }
        return Calendar.current.isDateInToday(last)
    }

    private func markStepGoalNotifiedToday() {
        UserDefaults.standard.set(Date(), forKey: stepGoalNotifiedKey)
    }
}
```

- [ ] **Step 2: Register in project.pbxproj**

Edit `ios/KQuarks.xcodeproj/project.pbxproj`:

**2a.** In PBXBuildFile section, after `037 /* GoalsSettingsView.swift in Sources */`:
```
		038 /* NotificationService.swift in Sources */ = {isa = PBXBuildFile; fileRef = 134 /* NotificationService.swift */; };
```

**2b.** In PBXFileReference section, after `133 /* GoalsSettingsView.swift */`:
```
		134 /* NotificationService.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = NotificationService.swift; sourceTree = "<group>"; };
```

**2c.** In Services group (507) children, after `132 /* GoalService.swift */,`:
```
				134 /* NotificationService.swift */,
```

**2d.** In Sources build phase (601) files, after `037 /* GoalsSettingsView.swift in Sources */,`:
```
			038 /* NotificationService.swift in Sources */,
```

- [ ] **Step 3: Verify build**

```bash
cd /Users/qxlsz/projects/kquarks/ios && xcodebuild build \
  -project KQuarks.xcodeproj \
  -scheme KQuarks \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO \
  2>&1 | grep -E "error:|warning:|BUILD SUCCEEDED|BUILD FAILED"
```

Expected: `BUILD SUCCEEDED`.

- [ ] **Step 4: Commit**

```bash
cd /Users/qxlsz/projects/kquarks && git add ios/KQuarks/Services/NotificationService.swift ios/KQuarks.xcodeproj/project.pbxproj
git commit -m "Add NotificationService for local push notifications"
```

---

### Task 2: Wire NotificationService into SyncService

**Files:**
- Modify: `ios/KQuarks/Services/SyncService.swift`

Two insertions needed.

- [ ] **Step 1: Add notification call after performFullSync succeeds**

In `performFullSync()`, after the `await MainActor.run { isSyncing = false }` success block (after `lastSyncDate` is set), add a fire-and-forget call. The current success block ends at the closing `}` of the `do` block. Find:

```swift
            await MainActor.run {
                lastSyncDate = Date()
                UserDefaults.standard.set(lastSyncDate, forKey: lastSyncKey)
                isSyncing = false
            }
```

Replace with:

```swift
            await MainActor.run {
                lastSyncDate = Date()
                UserDefaults.standard.set(lastSyncDate, forKey: lastSyncKey)
                isSyncing = false
            }
            Task { await NotificationService.shared.notifyAfterSync() }
```

- [ ] **Step 2: Add notification call in handleRefreshTask success path**

In `handleRefreshTask(_:)`, the `do` block currently reads:

```swift
        do {
            try await syncTodaySummary()
            task.setTaskCompleted(success: true)
        } catch {
            print("[BGTask] Refresh sync failed: \(error)")
            task.setTaskCompleted(success: false)
        }
```

Replace with:

```swift
        do {
            try await syncTodaySummary()
            Task { await NotificationService.shared.notifyAfterSync() }
            task.setTaskCompleted(success: true)
        } catch {
            print("[BGTask] Refresh sync failed: \(error)")
            task.setTaskCompleted(success: false)
        }
```

- [ ] **Step 3: Verify build**

```bash
cd /Users/qxlsz/projects/kquarks/ios && xcodebuild build \
  -project KQuarks.xcodeproj \
  -scheme KQuarks \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO \
  2>&1 | grep -E "error:|warning:|BUILD SUCCEEDED|BUILD FAILED"
```

Expected: `BUILD SUCCEEDED`.

- [ ] **Step 4: Commit**

```bash
cd /Users/qxlsz/projects/kquarks && git add ios/KQuarks/Services/SyncService.swift
git commit -m "Fire step goal notification after sync completes"
```

---

### Task 3: Wire NotificationService into AIInsightsService

**Files:**
- Modify: `ios/KQuarks/Services/AIInsightsService.swift`

- [ ] **Step 1: Add insights notification before return result**

In `generateInsights()`, the success path currently ends with:

```swift
            await MainActor.run {
                latestRecoveryScore = result.recoveryScore
                latestStrainScore = result.strainScore
            }

            return result
```

Replace with:

```swift
            await MainActor.run {
                latestRecoveryScore = result.recoveryScore
                latestStrainScore = result.strainScore
            }

            NotificationService.shared.scheduleInsightsNotification()
            return result
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/qxlsz/projects/kquarks/ios && xcodebuild build \
  -project KQuarks.xcodeproj \
  -scheme KQuarks \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO \
  2>&1 | grep -E "error:|warning:|BUILD SUCCEEDED|BUILD FAILED"
```

Expected: `BUILD SUCCEEDED`.

- [ ] **Step 3: Commit**

```bash
cd /Users/qxlsz/projects/kquarks && git add ios/KQuarks/Services/AIInsightsService.swift
git commit -m "Fire notification after AI insights are generated"
```

---

### Task 4: Refresh notification status on launch + add Settings section

**Files:**
- Modify: `ios/KQuarks/App/KQuarksApp.swift`
- Modify: `ios/KQuarks/Views/SettingsView.swift`

- [ ] **Step 1: Add refreshAuthorizationStatus call in KQuarksApp**

In `KQuarksApp.body`, add the call inside the existing second `.task` modifier (the one that calls `scheduleBackgroundSync()`), alongside it. Find:

```swift
                .task {
                    SyncService.shared.scheduleBackgroundSync()
                }
```

Replace with:

```swift
                .task {
                    SyncService.shared.scheduleBackgroundSync()
                    await NotificationService.shared.refreshAuthorizationStatus()
                }
```

- [ ] **Step 2: Add Notifications section to SettingsView**

In `ios/KQuarks/Views/SettingsView.swift`:

**2a.** Add a `let` property for `notificationService` alongside the existing service properties. After the line `private let supabaseService = SupabaseService.shared`, add:

```swift
    private let notificationService = NotificationService.shared
```

**2b.** In `SettingsView.body`'s `List`, add a new `Section("Notifications")` just before the existing `App` section. The `App` section currently starts with:

```swift
                // App section
                Section("App") {
```

Insert the new Notifications section immediately before that comment:

The old string to find and replace is:

```swift
                // App section
                Section("App") {
```

Replace with:

```swift
                // Notifications
                Section("Notifications") {
                    HStack {
                        Label("Notifications", systemImage: "bell")
                        Spacer()
                        if notificationService.isAuthorized {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(.green)
                        } else {
                            Button("Enable") {
                                Task { await notificationService.requestPermission() }
                            }
                            .buttonStyle(.borderless)
                        }
                    }
                }

                // App section
                Section("App") {
```

- [ ] **Step 3: Verify build**

```bash
cd /Users/qxlsz/projects/kquarks/ios && xcodebuild build \
  -project KQuarks.xcodeproj \
  -scheme KQuarks \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO \
  2>&1 | grep -E "error:|warning:|BUILD SUCCEEDED|BUILD FAILED"
```

Expected: `BUILD SUCCEEDED`.

- [ ] **Step 4: Commit**

```bash
cd /Users/qxlsz/projects/kquarks && git add ios/KQuarks/App/KQuarksApp.swift ios/KQuarks/Views/SettingsView.swift
git commit -m "Add notification status to Settings and refresh on launch"
```

---

### Task 5: Push to main

- [ ] **Step 1: Push**

```bash
cd /Users/qxlsz/projects/kquarks && git push origin main
```
