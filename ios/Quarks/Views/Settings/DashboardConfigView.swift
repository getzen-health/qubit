import SwiftUI

/// Dashboard widget configuration view
struct DashboardConfigView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var widgetManager = WidgetConfigurationManager.shared

    var body: some View {
        List {
            ForEach(WidgetCategory.allCases, id: \.self) { category in
                Section {
                    ForEach(WidgetRegistry.widgets(for: category)) { widget in
                        WidgetConfigRow(
                            widget: widget,
                            isEnabled: widgetManager.isEnabled(widget.id),
                            onToggle: { widgetManager.toggleWidget(widget.id) }
                        )
                    }
                } header: {
                    Text(category.displayName)
                }
            }

            Section {
                Button(role: .destructive) {
                    widgetManager.resetToDefaults()
                } label: {
                    Label("Reset to Defaults", systemImage: "arrow.counterclockwise")
                }
            }
        }
        .navigationTitle("Dashboard Widgets")
        .navigationBarTitleDisplayMode(.inline)
    }
}

/// Individual widget configuration row
struct WidgetConfigRow: View {
    let widget: WidgetDefinition
    let isEnabled: Bool
    let onToggle: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: widget.icon)
                .font(.system(size: 18))
                .foregroundStyle(isEnabled ? .accent : .secondary)
                .frame(width: 28, height: 28)
                .background(
                    (isEnabled ? Color.accentColor : Color(.secondarySystemBackground))
                        .opacity(isEnabled ? 0.15 : 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: 6))

            VStack(alignment: .leading, spacing: 2) {
                Text(widget.name)
                    .font(.body)
                    .foregroundStyle(.primary)

                Text(widget.description)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Toggle("", isOn: Binding(
                get: { isEnabled },
                set: { _ in onToggle() }
            ))
            .labelsHidden()
        }
        .contentShape(Rectangle())
        .onTapGesture {
            onToggle()
        }
    }
}

/// Reorderable list of enabled widgets
struct WidgetOrderView: View {
    @State private var widgetManager = WidgetConfigurationManager.shared

    var body: some View {
        List {
            Section {
                ForEach(widgetManager.enabledWidgets) { widget in
                    HStack(spacing: 12) {
                        Image(systemName: "line.3.horizontal")
                            .foregroundStyle(.tertiary)

                        Image(systemName: widget.icon)
                            .font(.system(size: 16))
                            .foregroundStyle(.accent)

                        Text(widget.name)
                            .font(.body)
                    }
                }
                .onMove { source, destination in
                    widgetManager.reorder(from: source, to: destination)
                }
            } header: {
                Text("Drag to reorder")
            } footer: {
                Text("Widgets at the top will appear first on your dashboard.")
            }
        }
        .navigationTitle("Widget Order")
        .navigationBarTitleDisplayMode(.inline)
        .environment(\.editMode, .constant(.active))
    }
}

#Preview {
    NavigationStack {
        DashboardConfigView()
    }
}

#Preview("Widget Order") {
    NavigationStack {
        WidgetOrderView()
    }
}
