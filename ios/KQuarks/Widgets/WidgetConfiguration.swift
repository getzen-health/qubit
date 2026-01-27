import Foundation

/// Widget size options
enum WidgetSize: String, Codable, CaseIterable {
    case small
    case medium
    case large
    case full
}

/// Widget category for organization
enum WidgetCategory: String, Codable, CaseIterable {
    case metrics
    case activity
    case insights
    case analysis

    var displayName: String {
        switch self {
        case .metrics: "Core Metrics"
        case .activity: "Activity"
        case .insights: "Insights"
        case .analysis: "Analysis"
        }
    }
}

/// Definition of a dashboard widget
struct WidgetDefinition: Identifiable, Codable {
    let id: String
    let name: String
    let description: String
    let category: WidgetCategory
    let icon: String
    let defaultEnabled: Bool
    let defaultOrder: Int
    let defaultSize: WidgetSize
    let minSize: WidgetSize
}

/// User's configuration for a specific widget
struct WidgetConfig: Identifiable, Codable {
    let id: String
    var enabled: Bool
    var order: Int
    var size: WidgetSize
}

/// Registry of all available widgets
struct WidgetRegistry {
    static let widgets: [WidgetDefinition] = [
        // Metrics
        WidgetDefinition(
            id: "ai-essence",
            name: "AI Essence",
            description: "Recovery, strain, and AI insights",
            category: .metrics,
            icon: "sparkles",
            defaultEnabled: true,
            defaultOrder: 0,
            defaultSize: .full,
            minSize: .medium
        ),
        WidgetDefinition(
            id: "quick-stats",
            name: "Quick Stats",
            description: "At-a-glance metrics grid",
            category: .metrics,
            icon: "square.grid.2x2",
            defaultEnabled: true,
            defaultOrder: 1,
            defaultSize: .full,
            minSize: .medium
        ),
        WidgetDefinition(
            id: "recovery",
            name: "Recovery",
            description: "Daily recovery score",
            category: .metrics,
            icon: "bolt.fill",
            defaultEnabled: true,
            defaultOrder: 2,
            defaultSize: .medium,
            minSize: .small
        ),
        WidgetDefinition(
            id: "strain",
            name: "Strain",
            description: "Daily strain score",
            category: .metrics,
            icon: "flame.fill",
            defaultEnabled: true,
            defaultOrder: 3,
            defaultSize: .medium,
            minSize: .small
        ),
        WidgetDefinition(
            id: "sleep",
            name: "Sleep",
            description: "Sleep duration and stages",
            category: .metrics,
            icon: "moon.fill",
            defaultEnabled: true,
            defaultOrder: 4,
            defaultSize: .medium,
            minSize: .small
        ),
        WidgetDefinition(
            id: "heart-rate",
            name: "Heart Rate",
            description: "Resting HR and HRV",
            category: .metrics,
            icon: "heart.fill",
            defaultEnabled: true,
            defaultOrder: 5,
            defaultSize: .medium,
            minSize: .small
        ),

        // Activity
        WidgetDefinition(
            id: "steps",
            name: "Steps",
            description: "Daily step count",
            category: .activity,
            icon: "figure.walk",
            defaultEnabled: true,
            defaultOrder: 6,
            defaultSize: .small,
            minSize: .small
        ),
        WidgetDefinition(
            id: "calories",
            name: "Calories",
            description: "Active calories burned",
            category: .activity,
            icon: "flame.fill",
            defaultEnabled: true,
            defaultOrder: 7,
            defaultSize: .small,
            minSize: .small
        ),
        WidgetDefinition(
            id: "distance",
            name: "Distance",
            description: "Walking/running distance",
            category: .activity,
            icon: "map",
            defaultEnabled: false,
            defaultOrder: 8,
            defaultSize: .small,
            minSize: .small
        ),
        WidgetDefinition(
            id: "water",
            name: "Water",
            description: "Water intake tracking",
            category: .activity,
            icon: "drop.fill",
            defaultEnabled: true,
            defaultOrder: 9,
            defaultSize: .small,
            minSize: .small
        ),

        // Insights
        WidgetDefinition(
            id: "ai-insights",
            name: "AI Insights",
            description: "Personalized health insights",
            category: .insights,
            icon: "sparkles",
            defaultEnabled: true,
            defaultOrder: 10,
            defaultSize: .full,
            minSize: .medium
        ),
        WidgetDefinition(
            id: "trends",
            name: "Trends",
            description: "Weekly/monthly trend charts",
            category: .insights,
            icon: "chart.line.uptrend.xyaxis",
            defaultEnabled: false,
            defaultOrder: 11,
            defaultSize: .large,
            minSize: .medium
        ),

        // Analysis
        WidgetDefinition(
            id: "correlations",
            name: "Correlations",
            description: "Discover metric correlations",
            category: .analysis,
            icon: "arrow.triangle.branch",
            defaultEnabled: false,
            defaultOrder: 12,
            defaultSize: .large,
            minSize: .medium
        ),
    ]

    static func widget(for id: String) -> WidgetDefinition? {
        widgets.first { $0.id == id }
    }

    static func widgets(for category: WidgetCategory) -> [WidgetDefinition] {
        widgets.filter { $0.category == category }
    }

    static func defaultConfig() -> [WidgetConfig] {
        widgets.map { widget in
            WidgetConfig(
                id: widget.id,
                enabled: widget.defaultEnabled,
                order: widget.defaultOrder,
                size: widget.defaultSize
            )
        }
    }
}

/// Manager for widget configuration persistence
@Observable
class WidgetConfigurationManager {
    static let shared = WidgetConfigurationManager()

    private let storageKey = "widgetConfiguration"
    private(set) var configs: [WidgetConfig]

    var enabledWidgets: [WidgetDefinition] {
        configs
            .filter { $0.enabled }
            .sorted { $0.order < $1.order }
            .compactMap { config in
                WidgetRegistry.widget(for: config.id)
            }
    }

    private init() {
        if let data = UserDefaults.standard.data(forKey: storageKey),
           let stored = try? JSONDecoder().decode([WidgetConfig].self, from: data) {
            // Merge stored with registry to handle new widgets
            var merged = WidgetRegistry.defaultConfig()
            for stored in stored {
                if let index = merged.firstIndex(where: { $0.id == stored.id }) {
                    merged[index] = stored
                }
            }
            self.configs = merged
        } else {
            self.configs = WidgetRegistry.defaultConfig()
        }
    }

    func isEnabled(_ widgetId: String) -> Bool {
        configs.first { $0.id == widgetId }?.enabled ?? false
    }

    func toggleWidget(_ widgetId: String) {
        if let index = configs.firstIndex(where: { $0.id == widgetId }) {
            configs[index].enabled.toggle()
            save()
        }
    }

    func setEnabled(_ widgetId: String, enabled: Bool) {
        if let index = configs.firstIndex(where: { $0.id == widgetId }) {
            configs[index].enabled = enabled
            save()
        }
    }

    func setSize(_ widgetId: String, size: WidgetSize) {
        guard let widget = WidgetRegistry.widget(for: widgetId) else { return }

        // Ensure size is at least minSize
        let sizeOrder: [WidgetSize] = [.small, .medium, .large, .full]
        let minIndex = sizeOrder.firstIndex(of: widget.minSize) ?? 0
        let requestedIndex = sizeOrder.firstIndex(of: size) ?? 0
        let validSize = requestedIndex >= minIndex ? size : widget.minSize

        if let index = configs.firstIndex(where: { $0.id == widgetId }) {
            configs[index].size = validSize
            save()
        }
    }

    func reorder(from source: IndexSet, to destination: Int) {
        var enabled = configs.filter { $0.enabled }.sorted { $0.order < $1.order }
        enabled.move(fromOffsets: source, toOffset: destination)

        // Update orders
        for (index, config) in enabled.enumerated() {
            if let configIndex = configs.firstIndex(where: { $0.id == config.id }) {
                configs[configIndex].order = index
            }
        }
        save()
    }

    func resetToDefaults() {
        configs = WidgetRegistry.defaultConfig()
        save()
    }

    private func save() {
        if let data = try? JSONEncoder().encode(configs) {
            UserDefaults.standard.set(data, forKey: storageKey)
        }
    }
}
