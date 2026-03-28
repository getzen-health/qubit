import SwiftUI
import Charts

// MARK: - Models

enum EnergyLevel: Int, CaseIterable, Identifiable, Codable {
    case exhausted = 1
    case tired = 2
    case low = 3
    case okay = 4
    case good = 5
    case great = 6
    case energized = 7

    var id: Int { rawValue }

    var emoji: String {
        switch self {
        case .exhausted: return "😴"
        case .tired:     return "🥱"
        case .low:       return "😑"
        case .okay:      return "😐"
        case .good:      return "🙂"
        case .great:     return "😊"
        case .energized: return "⚡️"
        }
    }

    var label: String {
        switch self {
        case .exhausted: return "Exhausted"
        case .tired:     return "Tired"
        case .low:       return "Low"
        case .okay:      return "Okay"
        case .good:      return "Good"
        case .great:     return "Great"
        case .energized: return "Energized"
        }
    }

    var color: Color {
        switch self {
        case .exhausted, .tired: return .red
        case .low, .okay:        return .orange
        case .good:              return .yellow
        case .great:             return .green
        case .energized:         return Color(red: 0.0, green: 0.8, blue: 0.4)
        }
    }
}

struct EnergyCheckin: Identifiable, Codable {
    var id: UUID = UUID()
    var level: EnergyLevel
    var note: String
    var timestamp: Date
}

// MARK: - ViewModel

@Observable
class EnergyViewModel {
    var checkins: [EnergyCheckin] = []
    var pendingNote = ""

    var todayCheckin: EnergyCheckin? {
        checkins.first { Calendar.current.isDateInToday($0.timestamp) }
    }

    var last7Days: [(date: Date, avg: Double)] {
        let calendar = Calendar.current
        return (0..<7).reversed().map { daysAgo in
            let day = calendar.date(byAdding: .day, value: -daysAgo, to: Date())!
            let dayCheckins = checkins.filter { calendar.isDate($0.timestamp, inSameDayAs: day) }
            let avg = dayCheckins.isEmpty ? 0.0 : Double(dayCheckins.map { $0.level.rawValue }.reduce(0, +)) / Double(dayCheckins.count)
            return (date: day, avg: avg)
        }
    }

    var weekAverage: Double {
        let values = last7Days.filter { $0.avg > 0 }.map(\.avg)
        guard !values.isEmpty else { return 0 }
        return values.reduce(0, +) / Double(values.count)
    }

    func logCheckin(level: EnergyLevel) {
        let checkin = EnergyCheckin(level: level, note: pendingNote, timestamp: Date())
        checkins.insert(checkin, at: 0)
        pendingNote = ""
    }
}

// MARK: - Main View

struct EnergyView: View {
    @State private var vm = EnergyViewModel()
    @State private var selectedLevel: EnergyLevel?
    @State private var showHistory = false

    var body: some View {
        List {
            checkInSection
            sparklineSection
            insightSection
            historySection
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Energy")
        .navigationBarTitleDisplayMode(.large)
    }

    // MARK: - Sections

    private var checkInSection: some View {
        Section {
            VStack(spacing: 16) {
                if let today = vm.todayCheckin {
                    VStack(spacing: 8) {
                        Text(today.level.emoji)
                            .font(.system(size: 64))
                        Text(today.level.label)
                            .font(.title2.bold())
                            .foregroundStyle(today.level.color)
                        Text("Logged today at \(today.timestamp.kqFormatted(dateStyle: .none, timeStyle: .short))")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                } else {
                    VStack(spacing: 8) {
                        Text("How's your energy right now?")
                            .font(.headline)
                        Text("Tap to log your current energy level")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.top, 8)
                }

                HStack(spacing: 4) {
                    ForEach(EnergyLevel.allCases) { level in
                        Button {
                            withAnimation(.spring(response: 0.3)) {
                                vm.logCheckin(level: level)
                            }
                            let impact = UIImpactFeedbackGenerator(style: .medium)
                            impact.impactOccurred()
                        } label: {
                            VStack(spacing: 4) {
                                Text(level.emoji)
                                    .font(.title2)
                                    .scaleEffect(vm.todayCheckin?.level == level ? 1.3 : 1.0)
                                    .animation(.spring(response: 0.3), value: vm.todayCheckin?.level)
                                Text(String(level.rawValue))
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                            .background(
                                vm.todayCheckin?.level == level
                                    ? level.color.opacity(0.2)
                                    : Color.secondary.opacity(0.07)
                            )
                            .cornerRadius(10)
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(vm.todayCheckin?.level == level ? level.color : Color.clear, lineWidth: 1.5)
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }

                if vm.todayCheckin != nil {
                    TextField("Add a note (optional)", text: $vm.pendingNote)
                        .textFieldStyle(.roundedBorder)
                        .font(.subheadline)
                }
            }
            .padding(.vertical, 8)
        } header: {
            Text("Today's Check-in")
        }
    }

    private var sparklineSection: some View {
        Section("7-Day Trend") {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    if vm.weekAverage > 0 {
                        Text(averageEmoji)
                            .font(.title2)
                        VStack(alignment: .leading) {
                            Text(String(format: "%.1f / 7", vm.weekAverage))
                                .font(.title3.bold())
                            Text("Weekly average")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    } else {
                        Text("No data yet").foregroundStyle(.secondary)
                    }
                }

                Chart(vm.last7Days, id: \.date) { day in
                    if day.avg > 0 {
                        AreaMark(
                            x: .value("Day", day.date, unit: .day),
                            y: .value("Energy", day.avg)
                        )
                        .foregroundStyle(
                            LinearGradient(
                                colors: [Color.yellow.opacity(0.6), Color.yellow.opacity(0.1)],
                                startPoint: .top, endPoint: .bottom
                            )
                        )
                        LineMark(
                            x: .value("Day", day.date, unit: .day),
                            y: .value("Energy", day.avg)
                        )
                        .foregroundStyle(Color.yellow)
                        .lineStyle(StrokeStyle(lineWidth: 2))
                        PointMark(
                            x: .value("Day", day.date, unit: .day),
                            y: .value("Energy", day.avg)
                        )
                        .foregroundStyle(Color.yellow)
                    }
                }
                .chartYScale(domain: 0...7)
                .chartXAxis {
                    AxisMarks(values: .stride(by: .day)) { value in
                        AxisValueLabel(format: .dateTime.weekday(.abbreviated))
                    }
                }
                .frame(height: 100)
            }
        }
    }

    private var insightSection: some View {
        Section("Insights") {
            if vm.weekAverage >= 5 {
                InsightRow(icon: "star.fill", color: .yellow, text: "Great week — your energy averaged \(String(format: "%.1f", vm.weekAverage))/7. Keep it up!")
            } else if vm.weekAverage >= 3 {
                InsightRow(icon: "info.circle.fill", color: .blue, text: "Moderate energy this week. Check sleep quality and caffeine timing for improvement.")
            } else if vm.weekAverage > 0 {
                InsightRow(icon: "exclamationmark.triangle.fill", color: .orange, text: "Low energy trend detected. Prioritize sleep, hydration, and recovery.")
            } else {
                InsightRow(icon: "hand.wave.fill", color: .teal, text: "Start logging your energy to get personalized insights.")
            }
        }
    }

    private var historySection: some View {
        Section("History") {
            if vm.checkins.isEmpty {
                Text("No check-ins yet")
                    .foregroundStyle(.secondary)
                    .font(.subheadline)
            } else {
                ForEach(vm.checkins.prefix(20)) { checkin in
                    HStack(spacing: 12) {
                        Text(checkin.level.emoji).font(.title3)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(checkin.level.label)
                                .font(.subheadline)
                                .foregroundStyle(checkin.level.color)
                            if !checkin.note.isEmpty {
                                Text(checkin.note)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        Spacer()
                        Text(checkin.timestamp.kqFormatted(dateStyle: .abbreviated, timeStyle: .short))
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
                .onDelete { indexSet in
                    vm.checkins.remove(atOffsets: indexSet)
                }
            }
        }
    }

    private var averageEmoji: String {
        let level = EnergyLevel(rawValue: Int(vm.weekAverage.rounded())) ?? .okay
        return level.emoji
    }
}

// MARK: - Supporting Views

private struct InsightRow: View {
    let icon: String
    let color: Color
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(color)
                .font(.subheadline)
            Text(text)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
    }
}

#Preview {
    NavigationStack { EnergyView() }
}
