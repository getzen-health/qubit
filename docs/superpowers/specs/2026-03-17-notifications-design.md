# Local Push Notifications — Design Spec

**Date:** 2026-03-17
**Project:** KQuarks iOS app
**Status:** Approved

---

## Overview

KQuarks syncs health data and generates AI insights but never tells the user anything happened. This feature adds two local notifications via `UserNotifications`:

1. **Step goal reached** — fires after a sync if today's steps meet or exceed the user's configured goal.
2. **Insights ready** — fires immediately after `AIInsightsService.generateInsights()` succeeds.

---

## Feature: NotificationService

### NotificationService

New file: `ios/KQuarks/Services/NotificationService.swift`

`@Observable` singleton using `UNUserNotificationCenter`.

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

    // Called after a sync completes. Fetches today's steps and fires if goal met.
    // Guards against multiple firings per day using UserDefaults.
    func notifyAfterSync() async {
        guard isAuthorized else { return }
        guard !alreadyNotifiedStepGoalToday() else { return }

        do {
            let summary = try await HealthKitService.shared.fetchTodaySummary()
            let goal = GoalService.shared.stepsGoal
            // summary.steps is Int; cast to Double for comparison with Double goal
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

### SyncService changes

In `performFullSync()`, after the sync succeeds and `isSyncing` is set to `false`, add a non-blocking call:

```swift
Task { await NotificationService.shared.notifyAfterSync() }
```

The same call goes in `handleRefreshTask(_:)` on the **success path only**: insert `Task { await NotificationService.shared.notifyAfterSync() }` after `try await syncTodaySummary()` and before `task.setTaskCompleted(success: true)`. Do not add it on the failure (catch) path.

### AIInsightsService changes

In `generateInsights()`, add the notification call **before** `return result` (not after — a statement after `return` is dead code):

```swift
NotificationService.shared.scheduleInsightsNotification()
return result
```

Because `scheduleInsightsNotification()` is synchronous (no `await`), it can be called directly inside the `do` block.

### KQuarksApp changes

In `KQuarksApp`, call `await NotificationService.shared.refreshAuthorizationStatus()` from the `.task` modifier that handles scheduling (alongside `scheduleBackgroundSync()`). This ensures `isAuthorized` reflects the current system state on launch without re-prompting.

### SettingsView changes

Add a new **"Notifications"** section just before the existing "App" section:

```
Notifications
  └─ Notifications (toggle-like row showing "Enabled" / "Not Enabled")
     └─ If not authorized: shows "Enable in Settings" button (opens app settings)
     └─ If authorized: shows checkmark
```

The row uses `NotificationService.shared.isAuthorized` directly (it's `@Observable`). No `@State` needed in the view — just read the shared singleton.

**Permission request:** Settings shows "Enable Notifications" button only when not authorized. Tapping it opens the system Settings URL (`UIApplication.openSettingsURLString`) since iOS cannot re-prompt after first denial; on first launch before any prompt, tapping "Enable Notifications" calls `NotificationService.shared.requestPermission()`.

The row:
```swift
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
```

`notificationService` is declared as `private let notificationService = NotificationService.shared` in `SettingsView`.

---

## Files Changed/Created

| File | Change |
|------|--------|
| `ios/KQuarks/Services/NotificationService.swift` | New — permission + notification scheduling |
| `ios/KQuarks/Services/SyncService.swift` | Add `Task { await NotificationService.shared.notifyAfterSync() }` after full sync and after refresh task |
| `ios/KQuarks/Services/AIInsightsService.swift` | Add `NotificationService.shared.scheduleInsightsNotification()` after insights success |
| `ios/KQuarks/App/KQuarksApp.swift` | Add `refreshAuthorizationStatus()` call in `.task` |
| `ios/KQuarks/Views/SettingsView.swift` | Add Notifications section |
| `ios/KQuarks.xcodeproj/project.pbxproj` | Register NotificationService.swift (fileRef 134, buildFile 038) |

---

## Data Flow

```
App launch → NotificationService.refreshAuthorizationStatus()
  → isAuthorized updated

SettingsView → "Enable" button → requestPermission()
  → system prompt → isAuthorized updated

SyncService.performFullSync() success
  → Task { NotificationService.notifyAfterSync() }
    → guard isAuthorized, guard !alreadyNotifiedToday
    → HealthKitService.fetchTodaySummary()
    → if steps >= GoalService.stepsGoal → scheduleStepGoalNotification()

AIInsightsService.generateInsights() success
  → NotificationService.scheduleInsightsNotification()
```

---

## Error Handling

- Permission denied: `isAuthorized = false`, all `scheduleX` calls are no-ops (guard at top).
- HealthKit fetch fails in `notifyAfterSync()`: silently ignored (catch { }).
- `UNUserNotificationCenter.add(_:)` failures: silently ignored (no completion handler needed for local notifications).

---

## Success Criteria

- After sync where step goal is met, a local notification fires (once per day maximum)
- After AI insight generation, a local notification fires
- Settings shows notification status with Enable button when not authorized
- `xcodebuild` succeeds with no errors
