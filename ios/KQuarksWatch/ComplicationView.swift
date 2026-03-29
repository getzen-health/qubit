import SwiftUI
import WidgetKit

// Complication provider for Apple Watch faces
struct KQuarksComplicationEntry: TimelineEntry {
    let date: Date
    let steps: Int
    let healthScore: Int
}

struct KQuarksComplicationProvider: TimelineProvider {
    func placeholder(in context: Context) -> KQuarksComplicationEntry {
        KQuarksComplicationEntry(date: Date(), steps: 0, healthScore: 0)
    }
    func getSnapshot(in context: Context, completion: @escaping (KQuarksComplicationEntry) -> Void) {
        let steps = UserDefaults(suiteName: "group.app.kquarks")?.integer(forKey: "todaySteps") ?? 0
        let score = UserDefaults(suiteName: "group.app.kquarks")?.integer(forKey: "healthScore") ?? 0
        completion(KQuarksComplicationEntry(date: Date(), steps: steps, healthScore: score))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<KQuarksComplicationEntry>) -> Void) {
        getSnapshot(in: context) { entry in
            completion(Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(3600))))
        }
    }
}

struct KQuarksComplicationEntryView: View {
    var entry: KQuarksComplicationProvider.Entry
    var body: some View {
        VStack(spacing: 2) {
            Text("🏃 \(entry.steps)")
                .font(.system(size: 12, weight: .bold))
            Text("⭐ \(entry.healthScore)")
                .font(.system(size: 10))
        }
    }
}

@main
struct KQuarksComplication: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "KQuarksComplication", provider: KQuarksComplicationProvider()) { entry in
            KQuarksComplicationEntryView(entry: entry)
        }
        .configurationDisplayName("KQuarks")
        .description("Daily steps and health score on your watch face.")
        .supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryCorner])
    }
}
