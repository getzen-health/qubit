import SwiftUI

/// Appearance mode options
enum AppearanceMode: String, CaseIterable, Codable {
    case system
    case light
    case dark

    var colorScheme: ColorScheme? {
        switch self {
        case .system: return nil
        case .light: return .light
        case .dark: return .dark
        }
    }

    var displayName: String {
        switch self {
        case .system: return "System"
        case .light: return "Light"
        case .dark: return "Dark"
        }
    }

    var icon: String {
        switch self {
        case .system: return "circle.lefthalf.filled"
        case .light: return "sun.max.fill"
        case .dark: return "moon.fill"
        }
    }
}

/// Observable theme manager for app-wide theming
@Observable
class ThemeManager {
    static let shared = ThemeManager()

    // MARK: - Stored Properties (persisted with @AppStorage)

    /// Current appearance mode
    @ObservationIgnored
    @AppStorage("appearanceMode") private var storedAppearanceMode: String = AppearanceMode.dark.rawValue

    /// Migration flag to reset old purple accent
    @ObservationIgnored
    @AppStorage("themeV2Migrated") private var themeV2Migrated: Bool = false

    /// Accent color hue (0-360)
    @ObservationIgnored
    @AppStorage("accentColorHue") private var storedAccentHue: Double = 195

    /// Accent color saturation (0-1)
    @ObservationIgnored
    @AppStorage("accentColorSaturation") private var storedAccentSaturation: Double = 0.15

    /// Accent color brightness (0-1)
    @ObservationIgnored
    @AppStorage("accentColorBrightness") private var storedAccentBrightness: Double = 0.98

    // MARK: - Init (migrate old purple accent)

    private init() {
        if !themeV2Migrated {
            storedAccentHue = 195
            storedAccentSaturation = 0.15
            storedAccentBrightness = 0.98
            storedAppearanceMode = AppearanceMode.dark.rawValue
            themeV2Migrated = true
        }
    }

    // MARK: - Computed Properties

    var appearanceMode: AppearanceMode {
        get { AppearanceMode(rawValue: storedAppearanceMode) ?? .system }
        set { storedAppearanceMode = newValue.rawValue }
    }

    var accentHue: Double {
        get { storedAccentHue }
        set { storedAccentHue = newValue }
    }

    var accentSaturation: Double {
        get { storedAccentSaturation }
        set { storedAccentSaturation = newValue }
    }

    var accentBrightness: Double {
        get { storedAccentBrightness }
        set { storedAccentBrightness = newValue }
    }

    /// The current accent color based on user settings
    var accentColor: Color {
        Color(
            hue: accentHue / 360,
            saturation: accentSaturation,
            brightness: accentBrightness
        )
    }

    /// Lighter variant of accent color
    var accentColorLight: Color {
        Color(
            hue: accentHue / 360,
            saturation: accentSaturation * 0.3,
            brightness: min(accentBrightness + 0.4, 0.95)
        )
    }

    /// Darker variant of accent color
    var accentColorDark: Color {
        Color(
            hue: accentHue / 360,
            saturation: accentSaturation,
            brightness: max(accentBrightness - 0.15, 0.2)
        )
    }

    // MARK: - Methods

    /// Reset theme to defaults
    func resetToDefaults() {
        appearanceMode = .dark
        accentHue = 195
        accentSaturation = 0.15
        accentBrightness = 0.98
    }

    /// Set appearance mode
    func setAppearanceMode(_ mode: AppearanceMode) {
        appearanceMode = mode
    }

    /// Set accent hue only
    func setAccentHue(_ hue: Double) {
        accentHue = hue
    }

    /// Set accent color from preset
    func setAccentColor(hue: Double, saturation: Double = 0.65, brightness: Double = 0.82) {
        accentHue = hue
        accentSaturation = saturation
        accentBrightness = brightness
    }
}

/// Preset accent colors
struct AccentColorPreset: Identifiable {
    let id = UUID()
    let name: String
    let hue: Double
    let saturation: Double
    let brightness: Double

    var color: Color {
        Color(hue: hue / 360, saturation: saturation, brightness: brightness)
    }

    static let presets: [AccentColorPreset] = [
        AccentColorPreset(name: "Purple", hue: 270, saturation: 0.65, brightness: 0.82),
        AccentColorPreset(name: "Blue", hue: 220, saturation: 0.70, brightness: 0.85),
        AccentColorPreset(name: "Green", hue: 150, saturation: 0.65, brightness: 0.75),
        AccentColorPreset(name: "Orange", hue: 30, saturation: 0.85, brightness: 0.90),
        AccentColorPreset(name: "Pink", hue: 330, saturation: 0.65, brightness: 0.85),
        AccentColorPreset(name: "Teal", hue: 180, saturation: 0.60, brightness: 0.78),
    ]
}
