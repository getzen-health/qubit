import WidgetKit
import SwiftUI

struct RingsEntry: TimelineEntry {
    let date: Date
    let steps: Int
    let stepGoal: Int
    let readinessScore: Int
    let activeCalories: Int
    let calorieGoal: Int
}

struct RingsComplicationProvider: TimelineProvider {
    func placeholder(in context: Context) -> RingsEntry {
        RingsEntry(date: Date(), steps: 7500, stepGoal: 10000, readinessScore: 72, activeCalories: 320, calorieGoal: 500)
    }
    
    func getSnapshot(in context: Context, completion: @escaping (RingsEntry) -> Void) {
        let defaults = UserDefaults(suiteName: "group.com.qxlsz.kquarks")
        let entry = RingsEntry(
            date: Date(),
            steps: defaults?.integer(forKey: "todaySteps") ?? 0,
            stepGoal: (defaults?.integer(forKey: "stepGoal") ?? 0) == 0 ? 10000 : (defaults?.integer(forKey: "stepGoal") ?? 10000),
            readinessScore: defaults?.integer(forKey: "readinessScore") ?? 0,
            activeCalories: defaults?.integer(forKey: "activeCalories") ?? 0,
            calorieGoal: (defaults?.integer(forKey: "calorieGoal") ?? 0) == 0 ? 500 : (defaults?.integer(forKey: "calorieGoal") ?? 500)
        )
        completion(entry)
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<RingsEntry>) -> Void) {
        getSnapshot(in: context) { entry in
            let nextRefresh = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
            completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
        }
    }
}

@main
struct RingsComplicationWidget: Widget {
    let kind = "RingsComplication"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: RingsComplicationProvider()) { entry in
            RingsComplicationView(
                steps: entry.steps, stepGoal: entry.stepGoal,
                readinessScore: entry.readinessScore,
                activeCalories: entry.activeCalories, calorieGoal: entry.calorieGoal
            )
        }
        .configurationDisplayName("KQuarks Rings")
        .description("Steps, readiness, and calories at a glance.")
        .supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryInline])
    }
}
