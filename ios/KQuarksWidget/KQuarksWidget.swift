import WidgetKit
import SwiftUI

struct HealthEntry: TimelineEntry {
    let date: Date
    let steps: Int
    let waterLiters: Double
    let sleepHours: Double
    let healthScore: Int
}

struct HealthProvider: TimelineProvider {
    func placeholder(in context: Context) -> HealthEntry {
        HealthEntry(date: Date(), steps: 8432, waterLiters: 1.8, sleepHours: 7.5, healthScore: 72)
    }

    func getSnapshot(in context: Context, completion: @escaping (HealthEntry) -> Void) {
        completion(placeholder(in: context))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<HealthEntry>) -> Void) {
        Task {
            let entry = await fetchHealthData()
            let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
            completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
        }
    }

    func fetchHealthData() async -> HealthEntry {
        guard let baseURL = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String,
              let url = URL(string: "\(baseURL)/api/health-score") else {
            return HealthEntry(date: Date(), steps: 0, waterLiters: 0, sleepHours: 0, healthScore: 0)
        }
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
            let score = json?["score"] as? Int ?? 0
            return HealthEntry(date: Date(), steps: 0, waterLiters: 0, sleepHours: 0, healthScore: score)
        } catch {
            return HealthEntry(date: Date(), steps: 0, waterLiters: 0, sleepHours: 0, healthScore: 0)
        }
    }
}

// Small widget view
struct SmallWidgetView: View {
    let entry: HealthEntry
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("GetZen").font(.caption2).foregroundColor(.secondary)
            Spacer()
            Text("\(entry.healthScore)").font(.system(size: 44, weight: .bold, design: .rounded))
                .foregroundColor(scoreColor(entry.healthScore))
            Text("Health Score").font(.caption2).foregroundColor(.secondary)
        }
        .padding()
        .containerBackground(.background, for: .widget)
    }
}

// Medium widget view
struct MediumWidgetView: View {
    let entry: HealthEntry
    var body: some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading) {
                Text("GetZen").font(.caption2).foregroundColor(.secondary)
                Text("\(entry.healthScore)").font(.system(size: 36, weight: .bold, design: .rounded))
                    .foregroundColor(scoreColor(entry.healthScore))
                Text("Health Score").font(.caption2).foregroundColor(.secondary)
            }
            Divider()
            VStack(alignment: .leading, spacing: 8) {
                Label("\(entry.steps)", systemImage: "figure.walk").font(.caption)
                Label(String(format: "%.1fL", entry.waterLiters), systemImage: "drop.fill").font(.caption)
                Label(String(format: "%.1fh", entry.sleepHours), systemImage: "moon.fill").font(.caption)
            }
        }
        .padding()
        .containerBackground(.background, for: .widget)
    }
}

func scoreColor(_ score: Int) -> Color {
    if score >= 80 { return .green }
    if score >= 60 { return .yellow }
    if score >= 40 { return .orange }
    return .red
}

@main
struct KQuarksWidget: Widget {
    let kind = "KQuarksWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: HealthProvider()) { entry in
            if #available(iOS 17.0, *) {
                MediumWidgetView(entry: entry)
            } else {
                MediumWidgetView(entry: entry)
            }
        }
        .configurationDisplayName("Health Summary")
        .description("See your daily health score and key metrics")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct KQuarksWidgetSmall: Widget {
    let kind = "KQuarksWidgetSmall"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: HealthProvider()) { entry in
            SmallWidgetView(entry: entry)
        }
        .configurationDisplayName("Health Score")
        .description("Your daily health score at a glance")
        .supportedFamilies([.systemSmall])
    }
}
