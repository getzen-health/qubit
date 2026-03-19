import SwiftUI
import Charts
import HealthKit

struct HealthMetricDetailView: View {
    let dataType: HealthDataType

    @State private var weekData: [(date: Date, value: Double)] = []
    @State private var selectedDays = 30
    @State private var isLoading = true
    @State private var hasError = false

    private let healthKit = HealthKitService.shared

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView()
                    .padding(.top, 80)
            } else if hasError || weekData.isEmpty {
                emptyState
            } else {
                VStack(spacing: 24) {
                    currentValueHeader
                    chartSection
                    statsStrip
                    if let goal = GoalService.shared.goal(for: dataType) {
                        goalBar(goal: goal)
                    }
                }
                .padding()
            }
        }
        .navigationTitle(dataType.displayName)
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            if dataType == .floorsClimbed {
                ToolbarItem(placement: .topBarTrailing) {
                    NavigationLink(destination: FloorsPatternView()) {
                        Image(systemName: "chart.bar.xaxis")
                    }
                }
            }
            ToolbarItem(placement: .topBarTrailing) {
                Picker("Period", selection: $selectedDays) {
                    Text("7D").tag(7)
                    Text("30D").tag(30)
                }
                .pickerStyle(.segmented)
                .frame(width: 100)
            }
        }
        .task { await loadData() }
        .onChange(of: selectedDays) {
            Task { await loadData() }
        }
    }

    // MARK: - Subviews

    private var currentValueHeader: some View {
        VStack(spacing: 4) {
            if let latest = weekData.last {
                Text(formattedValue(latest.value))
                    .font(.system(size: 52, weight: .bold, design: .rounded))

                HStack(spacing: 4) {
                    Image(systemName: trendIcon)
                        .foregroundStyle(trendColor)
                    Text(trendLabel)
                        .font(.subheadline)
                        .foregroundStyle(trendColor)
                }
            }
        }
        .frame(maxWidth: .infinity)
    }

    private var chartSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Last \(selectedDays) Days")
                .font(.headline)

            let axisStride: Calendar.Component = selectedDays <= 7 ? .day : .weekOfYear
            let axisFormat: Date.FormatStyle = selectedDays <= 7
                ? .dateTime.weekday(.abbreviated)
                : .dateTime.month(.abbreviated).day()

            if dataType.isDiscrete {
                // Line chart for discrete metrics
                Chart(weekData, id: \.date) { item in
                    LineMark(
                        x: .value("Date", item.date, unit: .day),
                        y: .value(dataType.displayName, item.value)
                    )
                    .foregroundStyle(dataType.chartColor)
                    .interpolationMethod(.catmullRom)

                    AreaMark(
                        x: .value("Date", item.date, unit: .day),
                        y: .value(dataType.displayName, item.value)
                    )
                    .foregroundStyle(dataType.chartColor.opacity(0.1))
                }
                .frame(height: 180)
                .chartXAxis {
                    AxisMarks(values: .stride(by: axisStride)) { _ in
                        AxisGridLine()
                        AxisValueLabel(format: axisFormat)
                    }
                }
            } else {
                // Bar chart for cumulative metrics
                Chart(weekData, id: \.date) { item in
                    BarMark(
                        x: .value("Date", item.date, unit: .day),
                        y: .value(dataType.displayName, item.value)
                    )
                    .foregroundStyle(dataType.chartColor)
                    .cornerRadius(4)
                }
                .frame(height: 180)
                .chartXAxis {
                    AxisMarks(values: .stride(by: axisStride)) { _ in
                        AxisGridLine()
                        AxisValueLabel(format: axisFormat)
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(16)
    }

    private var statsStrip: some View {
        HStack {
            statCell(label: "Min", value: weekData.map(\.value).min())
            Divider().frame(height: 40)
            statCell(label: "Avg", value: weekData.isEmpty ? nil : weekData.map(\.value).reduce(0, +) / Double(weekData.count))
            Divider().frame(height: 40)
            statCell(label: "Max", value: weekData.map(\.value).max())
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(16)
    }

    private func statCell(label: String, value: Double?) -> some View {
        VStack(spacing: 4) {
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value.map { formattedValue($0) } ?? "--")
                .font(.headline)
        }
        .frame(maxWidth: .infinity)
    }

    private func goalBar(goal: Double) -> some View {
        let todayValue = weekData.last?.value ?? 0
        let progress = min(todayValue / goal, 1.0)

        return VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Today's Goal")
                    .font(.headline)
                Spacer()
                Text("\(formattedValue(todayValue)) / \(formattedValue(goal))")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color(.systemFill))
                        .frame(height: 8)
                    RoundedRectangle(cornerRadius: 4)
                        .fill(dataType.chartColor)
                        .frame(width: geo.size.width * progress, height: 8)
                }
            }
            .frame(height: 8)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(16)
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: dataType.icon)
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No data available for this period")
                .font(.headline)
                .foregroundStyle(.secondary)
        }
        .padding(.top, 80)
    }

    // MARK: - Helpers

    private func loadData() async {
        guard let identifier = dataType.healthKitIdentifier else {
            hasError = true
            isLoading = false
            return
        }
        isLoading = true
        do {
            weekData = try await healthKit.fetchWeekData(for: identifier, isDiscrete: dataType.isDiscrete, days: selectedDays)
        } catch {
            hasError = true
        }
        isLoading = false
    }

    private func formattedValue(_ value: Double) -> String {
        switch dataType {
        case .steps, .floorsClimbed:
            return Int(value).formatted()
        case .distance:
            return String(format: "%.2f km", value / 1000)
        case .activeCalories, .totalCalories:
            return "\(Int(value)) kcal"
        case .heartRate, .restingHeartRate:
            return "\(Int(value)) bpm"
        case .hrv:
            return "\(Int(value)) ms"
        case .weight:
            return String(format: "%.1f kg", value)
        case .bodyFat:
            return String(format: "%.1f%%", value * 100)
        default:
            return String(format: "%.1f", value)
        }
    }

    private var trendIcon: String {
        guard weekData.count >= 2 else { return "minus" }
        let recentSlice = weekData.suffix(3)
        let olderSlice = weekData.prefix(3)
        let recent = recentSlice.map(\.value).reduce(0, +) / Double(recentSlice.count)
        let older = olderSlice.map(\.value).reduce(0, +) / Double(olderSlice.count)
        if recent > older * 1.05 { return "arrow.up" }
        if recent < older * 0.95 { return "arrow.down" }
        return "minus"
    }

    private var trendColor: Color {
        guard weekData.count >= 2 else { return .secondary }
        let recentSlice = weekData.suffix(3)
        let olderSlice = weekData.prefix(3)
        let recent = recentSlice.map(\.value).reduce(0, +) / Double(recentSlice.count)
        let older = olderSlice.map(\.value).reduce(0, +) / Double(olderSlice.count)
        let higherIsBetter = dataType != .restingHeartRate
        if recent > older * 1.05 { return higherIsBetter ? .green : .red }
        if recent < older * 0.95 { return higherIsBetter ? .red : .green }
        return .secondary
    }

    private var trendLabel: String {
        guard weekData.count >= 2 else { return "No trend" }
        let recentSlice = weekData.suffix(3)
        let olderSlice = weekData.prefix(3)
        let recent = recentSlice.map(\.value).reduce(0, +) / Double(recentSlice.count)
        let older = olderSlice.map(\.value).reduce(0, +) / Double(olderSlice.count)
        guard older > 0 else { return "No trend" }
        let pct = Int(abs((recent - older) / older * 100))
        if pct < 5 { return "Stable" }
        return "\(pct)% vs last week"
    }
}

// MARK: - HealthDataType chart extensions

extension HealthDataType {
    var chartColor: Color {
        switch self {
        case .steps, .distance, .floorsClimbed: return .green
        case .activeCalories, .totalCalories: return .orange
        case .heartRate, .restingHeartRate: return .red
        case .hrv: return .purple
        case .weight, .bodyFat: return .blue
        default: return .accentColor
        }
    }

}

#Preview {
    NavigationStack {
        HealthMetricDetailView(dataType: .steps)
    }
}
