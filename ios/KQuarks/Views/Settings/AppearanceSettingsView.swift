import SwiftUI

/// Appearance settings - theme, accent color, appearance mode
struct AppearanceSettingsView: View {
    @Environment(ThemeManager.self) private var themeManager

    var body: some View {
        List {
            // Appearance Mode
            Section {
                ForEach(AppearanceMode.allCases, id: \.self) { mode in
                    AppearanceModeRow(
                        mode: mode,
                        isSelected: themeManager.appearanceMode == mode,
                        onSelect: { themeManager.setAppearanceMode(mode) }
                    )
                }
            } header: {
                Text("Theme")
            } footer: {
                Text("Choose how KQuarks appears on your device.")
            }

            // Accent Color
            Section {
                AccentColorPicker(
                    selectedHue: themeManager.accentHue,
                    onSelect: { themeManager.setAccentHue($0) }
                )
            } header: {
                Text("Accent Color")
            } footer: {
                Text("Customize your interface color.")
            }

            // Preview
            Section {
                PreviewCard()
            } header: {
                Text("Preview")
            }

            // Dashboard Widgets
            Section {
                NavigationLink {
                    DashboardConfigView()
                } label: {
                    Label("Dashboard Widgets", systemImage: "square.grid.2x2")
                }

                NavigationLink {
                    WidgetOrderView()
                } label: {
                    Label("Widget Order", systemImage: "arrow.up.arrow.down")
                }
            } header: {
                Text("Dashboard")
            }
        }
        .navigationTitle("Appearance")
        .toolbarTitleDisplayMode(.inline)
    }
}

/// Row for appearance mode selection
struct AppearanceModeRow: View {
    let mode: AppearanceMode
    let isSelected: Bool
    let onSelect: () -> Void

    var icon: String {
        switch mode {
        case .system: "circle.lefthalf.filled"
        case .light: "sun.max.fill"
        case .dark: "moon.fill"
        }
    }

    var body: some View {
        Button(action: onSelect) {
            HStack {
                Image(systemName: icon)
                    .foregroundStyle(isSelected ? .accent : .secondary)
                    .frame(width: 28)

                Text(mode.rawValue.capitalized)
                    .foregroundStyle(.primary)

                Spacer()

                if isSelected {
                    Image(systemName: "checkmark")
                        .foregroundStyle(.accent)
                }
            }
        }
        .buttonStyle(.plain)
    }
}

/// Accent color picker with presets and custom slider
struct AccentColorPicker: View {
    let selectedHue: Double
    let onSelect: (Double) -> Void

    private let presets: [(hue: Double, name: String)] = [
        (270, "Purple"),
        (220, "Blue"),
        (160, "Teal"),
        (142, "Green"),
        (48, "Yellow"),
        (24, "Orange"),
        (0, "Red"),
        (330, "Pink"),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Preset colors
            HStack(spacing: 8) {
                ForEach(presets, id: \.hue) { preset in
                    Button {
                        onSelect(preset.hue)
                    } label: {
                        Circle()
                            .fill(Color(hue: preset.hue / 360, saturation: 0.7, brightness: 0.6))
                            .frame(width: 36, height: 36)
                            .overlay {
                                if abs(selectedHue - preset.hue) < 5 {
                                    Circle()
                                        .strokeBorder(.white, lineWidth: 2)
                                        .frame(width: 32, height: 32)
                                }
                            }
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(preset.name)
                }
            }

            // Custom hue slider
            VStack(alignment: .leading, spacing: 8) {
                Text("Custom")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                HueSlider(value: Binding(
                    get: { selectedHue },
                    set: { onSelect($0) }
                ))
            }
        }
        .padding(.vertical, 8)
    }
}

/// Custom hue slider
struct HueSlider: View {
    @Binding var value: Double

    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                // Rainbow gradient background
                LinearGradient(
                    colors: (0...6).map { i in
                        Color(hue: Double(i) / 6, saturation: 0.7, brightness: 0.6)
                    },
                    startPoint: .leading,
                    endPoint: .trailing
                )
                .frame(height: 24)
                .clipShape(Capsule())

                // Thumb
                Circle()
                    .fill(Color(hue: value / 360, saturation: 0.7, brightness: 0.6))
                    .frame(width: 28, height: 28)
                    .overlay {
                        Circle()
                            .strokeBorder(.white, lineWidth: 3)
                    }
                    .shadow(radius: 2)
                    .offset(x: thumbOffset(in: geometry.size.width))
                    .gesture(
                        DragGesture()
                            .onChanged { gesture in
                                let x = min(max(0, gesture.location.x), geometry.size.width)
                                value = (x / geometry.size.width) * 360
                            }
                    )
            }
        }
        .frame(height: 28)
    }

    private func thumbOffset(in width: CGFloat) -> CGFloat {
        let position = (value / 360) * width
        let clampedPosition = min(max(0, position - 14), width - 28)
        return clampedPosition
    }
}

/// Preview card showing theme colors
struct PreviewCard: View {
    @Environment(ThemeManager.self) private var themeManager

    var body: some View {
        VStack(spacing: 12) {
            // Header
            HStack {
                Circle()
                    .fill(themeManager.accentColor)
                    .frame(width: 40, height: 40)
                    .overlay {
                        Text("K")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundStyle(.white)
                    }

                VStack(alignment: .leading, spacing: 2) {
                    Text("KQuarks Health")
                        .font(.subheadline)
                        .fontWeight(.semibold)

                    Text("Your health companion")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()
            }

            // Buttons
            HStack(spacing: 8) {
                Button("Primary") {}
                    .buttonStyle(.borderedProminent)

                Button("Secondary") {}
                    .buttonStyle(.bordered)
            }

            // Metric badges
            HStack(spacing: 6) {
                MetricBadge(label: "Recovery", color: .recovery)
                MetricBadge(label: "Strain", color: .strain)
                MetricBadge(label: "Sleep", color: .sleep)
                MetricBadge(label: "Heart", color: .heart)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

/// Small metric badge
struct MetricBadge: View {
    let label: String
    let color: Color

    var body: some View {
        Text(label)
            .font(.caption2)
            .fontWeight(.medium)
            .foregroundStyle(color)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color.opacity(0.15))
            .clipShape(RoundedRectangle(cornerRadius: 4))
    }
}

#Preview {
    NavigationStack {
        AppearanceSettingsView()
    }
    .environment(ThemeManager.shared)
}
