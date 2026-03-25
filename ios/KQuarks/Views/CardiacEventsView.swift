import SwiftUI
import Charts
import HealthKit

// MARK: - CardiacEventsView

/// Shows Apple Watch cardiac events: high heart rate alerts, low heart rate alerts,
/// and irregular rhythm (possible AFib) detections over the last 90 days.
struct CardiacEventsView: View {
    @State private var events: [CardiacEvent] = []
    @State private var isLoading = true

    private let healthKit = HealthKitService.shared

    struct CardiacEvent: Identifiable {
        let id = UUID()
        let date: Date
        let type: EventType

        enum EventType {
            case highHR, lowHR, irregularRhythm

            var label: String {
                switch self {
                case .highHR: return "High Heart Rate"
                case .lowHR: return "Low Heart Rate"
                case .irregularRhythm: return "Irregular Rhythm"
                }
            }

            var icon: String {
                switch self {
                case .highHR: return "heart.fill"
                case .lowHR: return "heart.slash.fill"
                case .irregularRhythm: return "waveform.path.ecg.rectangle.fill"
                }
            }

            var color: Color {
                switch self {
                case .highHR: return .orange
                case .lowHR: return .blue
                case .irregularRhythm: return .red
                }
            }

            var description: String {
                switch self {
                case .highHR:
                    return "Your heart rate exceeded 120 BPM while you appeared to be inactive for 10 minutes."
                case .lowHR:
                    return "Your heart rate was below 40 BPM while you were awake."
                case .irregularRhythm:
                    return "An irregular heart rhythm was detected, which may indicate atrial fibrillation (AFib)."
                }
            }
        }
    }

    private var highHREvents: [CardiacEvent] { events.filter { $0.type == .highHR } }
    private var lowHREvents: [CardiacEvent] { events.filter { $0.type == .lowHR } }
    private var irregularEvents: [CardiacEvent] { events.filter { $0.type == .irregularRhythm } }

    private var monthlyBreakdown: [(month: Date, high: Int, low: Int, irregular: Int)] {
        let cal = Calendar.current
        var byMonth: [Date: (high: Int, low: Int, irregular: Int)] = [:]
        for e in events {
            let comps = cal.dateComponents([.year, .month], from: e.date)
            guard let month = cal.date(from: comps) else { continue }
            var current = byMonth[month] ?? (0, 0, 0)
            switch e.type {
            case .highHR: current.high += 1
            case .lowHR: current.low += 1
            case .irregularRhythm: current.irregular += 1
            }
            byMonth[month] = current
        }
        return byMonth.sorted { $0.key < $1.key }.map {
            (month: $0.key, high: $0.value.high, low: $0.value.low, irregular: $0.value.irregular)
        }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if events.isEmpty {
                    emptyState
                } else {
                    summaryCard
                    if monthlyBreakdown.count >= 2 { trendChart }
                    if !irregularEvents.isEmpty { irregularAlert }
                    eventsList
                    infoCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Cardiac Events")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 14) {
            HStack {
                Image(systemName: "heart.text.clipboard.fill")
                    .font(.title2)
                    .foregroundStyle(.red)
                Text("Last 90 Days")
                    .font(.headline)
                Spacer()
                Text("\(events.count) events")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            HStack(spacing: 0) {
                summaryBubble(
                    count: highHREvents.count,
                    label: "High HR",
                    color: .orange,
                    icon: "heart.fill"
                )
                Divider().frame(height: 50)
                summaryBubble(
                    count: lowHREvents.count,
                    label: "Low HR",
                    color: .blue,
                    icon: "heart.slash.fill"
                )
                Divider().frame(height: 50)
                summaryBubble(
                    count: irregularEvents.count,
                    label: "Irregular",
                    color: .red,
                    icon: "waveform.path.ecg"
                )
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func summaryBubble(count: Int, label: String, color: Color, icon: String) -> some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .foregroundStyle(color)
                .font(.title3)
            Text("\(count)")
                .font(.title2.bold())
                .foregroundStyle(count > 0 ? color : .secondary)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
    }

    // MARK: - Trend Chart

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Monthly Breakdown")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                ForEach(monthlyBreakdown, id: \.month) { row in
                    if row.high > 0 {
                        BarMark(
                            x: .value("Month", row.month, unit: .month),
                            y: .value("Count", row.high)
                        )
                        .foregroundStyle(.orange.opacity(0.8))
                        .cornerRadius(3)
                        .position(by: .value("Type", "High HR"))
                    }
                    if row.low > 0 {
                        BarMark(
                            x: .value("Month", row.month, unit: .month),
                            y: .value("Count", row.low)
                        )
                        .foregroundStyle(.blue.opacity(0.8))
                        .cornerRadius(3)
                        .position(by: .value("Type", "Low HR"))
                    }
                    if row.irregular > 0 {
                        BarMark(
                            x: .value("Month", row.month, unit: .month),
                            y: .value("Count", row.irregular)
                        )
                        .foregroundStyle(.red.opacity(0.8))
                        .cornerRadius(3)
                        .position(by: .value("Type", "Irregular"))
                    }
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                    AxisGridLine()
                }
            }
            .frame(height: 160)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Irregular Rhythm Alert

    private var irregularAlert: some View {
        HStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.title2)
                .foregroundStyle(.red)
            VStack(alignment: .leading, spacing: 4) {
                Text("Irregular Rhythm Detected")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.red)
                Text("Apple Watch detected \(irregularEvents.count) possible AFib event\(irregularEvents.count == 1 ? "" : "s"). Consult your doctor, especially if you have symptoms.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color.red.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.red.opacity(0.3), lineWidth: 1)
        )
    }

    // MARK: - Events List

    private var eventsList: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Event History")
                .font(.headline)
                .padding(.horizontal, 4)

            VStack(spacing: 0) {
                ForEach(events.sorted { $0.date > $1.date }.prefix(20)) { event in
                    HStack(spacing: 12) {
                        Image(systemName: event.type.icon)
                            .font(.title3)
                            .foregroundStyle(event.type.color)
                            .frame(width: 32)

                        VStack(alignment: .leading, spacing: 2) {
                            Text(event.type.label)
                                .font(.subheadline.weight(.medium))
                            Text(event.date.formatted(date: .abbreviated, time: .shortened))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }

                        Spacer()

                        // Day of week
                        Text(event.date.formatted(.dateTime.weekday(.abbreviated)))
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    if event.id != events.sorted(by: { $0.date > $1.date }).prefix(20).last?.id {
                        Divider().padding(.leading, 60)
                    }
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Info Card

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: "info.circle.fill")
                    .foregroundStyle(.blue)
                Text("About Cardiac Alerts")
                    .font(.subheadline.weight(.semibold))
            }

            ForEach([CardiacEvent.EventType.highHR, .lowHR, .irregularRhythm], id: \.label) { type in
                VStack(alignment: .leading, spacing: 3) {
                    HStack(spacing: 6) {
                        Image(systemName: type.icon)
                            .foregroundStyle(type.color)
                            .font(.caption)
                        Text(type.label)
                            .font(.caption.weight(.semibold))
                    }
                    Text(type.description)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Text("These alerts require Apple Watch Series 4 or later. Irregular rhythm detection requires Watch OS 7+. Always consult a healthcare provider about cardiac concerns.")
                .font(.caption2)
                .foregroundStyle(.tertiary)
                .padding(.top, 4)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "heart.fill")
                .font(.system(size: 48))
                .foregroundStyle(.green)
            Text("No Cardiac Events")
                .font(.title3.bold())
            Text("No high heart rate, low heart rate, or irregular rhythm events detected in the last 90 days. This is a good sign!")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
            Text("Requires Apple Watch Series 4 or later.")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        let start = Calendar.current.date(byAdding: .day, value: -90, to: Date()) ?? Date()

        async let highRaw = (try? await healthKit.fetchCategoryEvents(.highHeartRateEvent, from: start, to: Date())) ?? []
        async let lowRaw = (try? await healthKit.fetchCategoryEvents(.lowHeartRateEvent, from: start, to: Date())) ?? []
        async let irregularRaw = (try? await healthKit.fetchCategoryEvents(.irregularHeartRhythmEvent, from: start, to: Date())) ?? []

        let (high, low, irregular) = await (highRaw, lowRaw, irregularRaw)

        var all: [CardiacEvent] = []
        all += high.map { CardiacEvent(date: $0.startDate, type: .highHR) }
        all += low.map { CardiacEvent(date: $0.startDate, type: .lowHR) }
        all += irregular.map { CardiacEvent(date: $0.startDate, type: .irregularRhythm) }
        events = all.sorted { $0.date > $1.date }
    }
}

#Preview {
    NavigationStack {
        CardiacEventsView()
    }
}
