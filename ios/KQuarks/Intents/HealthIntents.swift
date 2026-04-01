import AppIntents
import Foundation

// MARK: - Log Water Intent
@available(iOS 16.0, *)
struct LogWaterIntent: AppIntent {
    static var title: LocalizedStringResource = "Log Water Intake"
    static var description = IntentDescription("Log a water intake amount to GetZen.")
    
    @Parameter(title: "Amount (ml)", description: "Amount of water in milliliters", default: 250)
    var amountMl: Int
    
    static var parameterSummary: some ParameterSummary {
        Summary("Log \(\.$amountMl)ml of water")
    }
    
    func perform() async throws -> some IntentResult & ProvidesDialog {
        guard let supabaseURL = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String,
              let url = URL(string: "\(supabaseURL)/rest/v1/water_entries") else {
            return .result(dialog: "Could not connect to GetZen.")
        }
        
        // Store locally via UserDefaults as offline queue
        var pending = UserDefaults.standard.array(forKey: "pendingWaterEntries") as? [[String: Any]] ?? []
        pending.append(["amount_ml": amountMl, "logged_at": ISO8601DateFormatter().string(from: Date())])
        UserDefaults.standard.set(pending, forKey: "pendingWaterEntries")
        _ = url // Will sync when app opens
        
        let liters = Double(amountMl) / 1000.0
        return .result(dialog: "Logged \(amountMl)ml (\(String(format: "%.2f", liters))L) of water in GetZen.")
    }
}

// MARK: - Log Mood Intent
@available(iOS 16.0, *)
struct LogMoodIntent: AppIntent {
    static var title: LocalizedStringResource = "Log Mood"
    static var description = IntentDescription("Log your current mood score to GetZen.")
    
    @Parameter(title: "Mood Score", description: "Your mood from 1 (terrible) to 5 (excellent)", default: 3)
    var moodScore: Int
    
    @Parameter(title: "Note", description: "Optional note about your mood")
    var note: String?
    
    static var parameterSummary: some ParameterSummary {
        Summary("Log mood as \(\.$moodScore)/5") {
            \.$note
        }
    }
    
    func perform() async throws -> some IntentResult & ProvidesDialog {
        guard moodScore >= 1, moodScore <= 5 else {
            throw IntentError.custom(message: "Mood score must be between 1 and 5.")
        }
        
        var pending = UserDefaults.standard.array(forKey: "pendingMoodEntries") as? [[String: Any]] ?? []
        pending.append(["mood_score": moodScore, "note": note ?? "", "logged_at": ISO8601DateFormatter().string(from: Date())])
        UserDefaults.standard.set(pending, forKey: "pendingMoodEntries")
        
        let moodLabels = ["", "Terrible", "Bad", "Okay", "Good", "Excellent"]
        let label = moodScore < moodLabels.count ? moodLabels[moodScore] : "Unknown"
        return .result(dialog: "Logged mood as \(label) (\(moodScore)/5) in GetZen.")
    }
}

// MARK: - Health Summary Intent
@available(iOS 16.0, *)
struct HealthSummaryIntent: AppIntent {
    static var title: LocalizedStringResource = "Get Health Summary"
    static var description = IntentDescription("Get your today's health summary from GetZen.")
    
    func perform() async throws -> some IntentResult & ProvidesDialog {
        // Read from HealthKit UserDefaults cache
        let defaults = UserDefaults.standard
        let steps = defaults.integer(forKey: "lastKnownSteps")
        let sleepHours = defaults.double(forKey: "lastKnownSleepHours")
        let calories = defaults.integer(forKey: "lastKnownCalories")
        
        var summary = "Today in GetZen: "
        if steps > 0 { summary += "\(steps) steps" }
        if calories > 0 { summary += ", \(calories) active calories" }
        if sleepHours > 0 { summary += ", \(String(format: "%.1f", sleepHours)) hours of sleep last night" }
        if steps == 0 && calories == 0 && sleepHours == 0 {
            summary = "Open KQuarks to sync your latest health data."
        }
        
        return .result(dialog: "\(summary).")
    }
}

// MARK: - Start Workout Intent
@available(iOS 16.0, *)
struct StartWorkoutIntent: AppIntent {
    static var title: LocalizedStringResource = "Start Workout"
    static var description = IntentDescription("Open KQuarks workout tracker.")
    static var openAppWhenRun = true
    
    @Parameter(title: "Workout Type", default: "Running")
    var workoutType: String
    
    static var parameterSummary: some ParameterSummary {
        Summary("Start a \(\.$workoutType) workout in GetZen")
    }
    
    func perform() async throws -> some IntentResult & ProvidesDialog {
        UserDefaults.standard.set(workoutType, forKey: "pendingWorkoutType")
        return .result(dialog: "Opening KQuarks to start your \(workoutType) workout.")
    }
}

// MARK: - Intent Error
@available(iOS 16.0, *)
enum IntentError: Error, CustomLocalizedStringResourceConvertible {
    case custom(message: String)
    
    var localizedStringResource: LocalizedStringResource {
        switch self {
        case .custom(let message): return "\(message)"
        }
    }
}

// MARK: - App Shortcuts Provider
@available(iOS 16.4, *)
struct KQuarksShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: LogWaterIntent(),
            phrases: [
                "Log water in \(.applicationName)",
                "Add water to \(.applicationName)",
                "I drank water in \(.applicationName)"
            ],
            shortTitle: "Log Water",
            systemImageName: "drop.fill"
        )
        AppShortcut(
            intent: LogMoodIntent(),
            phrases: [
                "Log my mood in \(.applicationName)",
                "How I feel in \(.applicationName)"
            ],
            shortTitle: "Log Mood",
            systemImageName: "face.smiling"
        )
        AppShortcut(
            intent: HealthSummaryIntent(),
            phrases: [
                "My health summary in \(.applicationName)",
                "How am I doing in \(.applicationName)"
            ],
            shortTitle: "Health Summary",
            systemImageName: "heart.text.square"
        )
        AppShortcut(
            intent: StartWorkoutIntent(),
            phrases: [
                "Start workout in \(.applicationName)",
                "Start a \(\.$workoutType) in \(.applicationName)"
            ],
            shortTitle: "Start Workout",
            systemImageName: "figure.run"
        )
    }
}
