import SwiftUI

/// Semantic colors for health metrics
extension Color {
    // MARK: - Metric Colors

    /// Recovery score color (green)
    static let recovery = Color(hue: 0.39, saturation: 0.71, brightness: 0.45)

    /// Strain score color (orange)
    static let strain = Color(hue: 0.067, saturation: 0.95, brightness: 0.53)

    /// Heart rate color (red)
    static let heartMetric = Color(hue: 0, saturation: 0.84, brightness: 0.60)

    /// Sleep metric color (blue)
    static let sleepMetric = Color(hue: 0.61, saturation: 0.83, brightness: 0.53)

    /// Activity color (dark green)
    static let activityMetric = Color(hue: 0.39, saturation: 0.76, brightness: 0.36)

    /// HRV color (purple)
    static let hrvMetric = Color(hue: 0.78, saturation: 0.70, brightness: 0.55)

    /// Glucose color (amber)
    static let glucoseMetric = Color(hue: 0.125, saturation: 0.93, brightness: 0.47)

    // MARK: - Convenience Aliases

    /// Alias for heartMetric
    static let heart = heartMetric

    /// Alias for sleepMetric
    static let sleep = sleepMetric

    /// Alias for activityMetric
    static let activity = activityMetric

    /// Alias for hrvMetric
    static let hrv = hrvMetric

    /// Alias for danger
    static let error = danger

    // MARK: - Status Colors

    /// Success/positive color
    static let success = Color(hue: 0.39, saturation: 0.71, brightness: 0.45)

    /// Warning color
    static let warning = Color(hue: 0.105, saturation: 0.92, brightness: 0.50)

    /// Error/negative color
    static let danger = Color(hue: 0, saturation: 0.84, brightness: 0.60)

    /// Info color
    static let info = Color(hue: 0.61, saturation: 0.83, brightness: 0.53)

    // MARK: - Surface Colors

    /// Primary surface background
    static let surfacePrimary = Color(uiColor: .systemBackground)

    /// Secondary surface background
    static let surfaceSecondary = Color(uiColor: .secondarySystemBackground)

    /// Tertiary surface background
    static let surfaceTertiary = Color(uiColor: .tertiarySystemBackground)

    /// Grouped background
    static let surfaceGrouped = Color(uiColor: .systemGroupedBackground)

    // MARK: - Text Colors

    /// Primary text color
    static let textPrimary = Color(uiColor: .label)

    /// Secondary text color
    static let textSecondary = Color(uiColor: .secondaryLabel)

    /// Tertiary text color
    static let textTertiary = Color(uiColor: .tertiaryLabel)

    /// Muted text color
    static let textMuted = Color(uiColor: .quaternaryLabel)

    // MARK: - Border Colors

    /// Standard border color
    static let borderDefault = Color(uiColor: .separator)

    /// Muted border color
    static let borderMuted = Color(uiColor: .opaqueSeparator)
}

/// Recovery score ranges and colors
enum RecoveryRange {
    case low      // 0-33
    case moderate // 34-66
    case high     // 67-100

    init(score: Int) {
        switch score {
        case 0..<34: self = .low
        case 34..<67: self = .moderate
        default: self = .high
        }
    }

    var color: Color {
        switch self {
        case .low: return .danger
        case .moderate: return .warning
        case .high: return .recovery
        }
    }

    var label: String {
        switch self {
        case .low: return "Low"
        case .moderate: return "Moderate"
        case .high: return "High"
        }
    }
}

/// Strain level ranges and colors
enum StrainRange {
    case light    // 0-9
    case moderate // 10-13
    case high     // 14-17
    case allOut   // 18-21

    init(strain: Double) {
        switch strain {
        case 0..<10: self = .light
        case 10..<14: self = .moderate
        case 14..<18: self = .high
        default: self = .allOut
        }
    }

    var color: Color {
        switch self {
        case .light: return .recovery
        case .moderate: return .info
        case .high: return .warning
        case .allOut: return .strain
        }
    }

    var label: String {
        switch self {
        case .light: return "Light"
        case .moderate: return "Moderate"
        case .high: return "High"
        case .allOut: return "All Out"
        }
    }
}

/// Sleep quality ranges
enum SleepQualityRange {
    case poor     // 0-59
    case fair     // 60-69
    case good     // 70-84
    case optimal  // 85-100

    init(quality: Int) {
        switch quality {
        case 0..<60: self = .poor
        case 60..<70: self = .fair
        case 70..<85: self = .good
        default: self = .optimal
        }
    }

    var color: Color {
        switch self {
        case .poor: return .danger
        case .fair: return .warning
        case .good: return .info
        case .optimal: return .sleepMetric
        }
    }

    var label: String {
        switch self {
        case .poor: return "Poor"
        case .fair: return "Fair"
        case .good: return "Good"
        case .optimal: return "Optimal"
        }
    }
}
