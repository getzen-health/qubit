import AppIntents
import HealthKit

// App Shortcut definitions for Shortcuts app integration
@available(iOS 16.0, *)
struct LogMoodIntent: AppIntent {
    static var title: LocalizedStringResource = "Log Mood in Qubit"
    static var description = IntentDescription("Log your current mood and energy level")

    @Parameter(title: "Mood", description: "Your current mood (1-10)")
    var mood: Int

    func perform() async throws -> some IntentResult & ProvidesDialog {
        // Store mood via UserDefaults to be picked up by main app sync
        UserDefaults(suiteName: "group.com.kquarks.app")?.set(mood, forKey: "pending_mood_log")
        UserDefaults(suiteName: "group.com.kquarks.app")?.set(Date().timeIntervalSince1970, forKey: "pending_mood_timestamp")
        return .result(dialog: "Mood logged as \(mood)/10 in Qubit")
    }
}

@available(iOS 16.0, *)
struct GetStepsIntent: AppIntent {
    static var title: LocalizedStringResource = "Get Today's Steps from Qubit"

    func perform() async throws -> some IntentResult & ProvidesDialog {
        let steps = UserDefaults(suiteName: "group.com.kquarks.app")?.integer(forKey: "today_steps") ?? 0
        return .result(dialog: "You have walked \(steps) steps today")
    }
}


