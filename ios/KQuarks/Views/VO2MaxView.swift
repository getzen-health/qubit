import SwiftUI
import Charts
import HealthKit

// MARK: - VO2MaxView

/// Shows VO2 Max cardio fitness trend from Apple Health.
struct VO2MaxView: View {
    @State private var samples: [(date: Date, value: Double)] = []
    @State private var isLoading = true

    private let healthKit = HealthKitService.shared

    private var latest: Double? { samples.last?.value }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if samples.isEmpty {
                    emptyState
                } else {
                    heroCard
                    trendChart
                    classificationTable
                    infoCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Cardio Fitness")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                NavigationLink(destination: VO2PatternView()) {
                    Image(systemName: "chart.bar.xaxis")
                }
            }
        }
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Hero Card

    private var heroCard: some View {
        let level = latest.map { FitnessLevel.from(vo2Max: $0) }
        return VStack(spacing: 16) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("VO₂ Max")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                    if let v = latest {
                        HStack(alignment: .firstTextBaseline, spacing: 4) {
                            Text(String(format: "%.1f", v))
                                .font(.system(size: 48, weight: .bold, design: .rounded))
                                .foregroundStyle(level?.color ?? .primary)
                            Text("mL/kg/min")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .padding(.bottom, 8)
                        }
                    }
                    if let level = level {
                        Text(level.label)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(level.color)
                    }
                }
                Spacer()
                if let v = latest {
                    ZStack {
                        Circle()
                            .stroke(Color(.systemFill), lineWidth: 10)
                            .frame(width: 80, height: 80)
                        Circle()
                            .trim(from: 0, to: FitnessLevel.progress(vo2Max: v))
                            .stroke(level?.color ?? .blue, style: StrokeStyle(lineWidth: 10, lineCap: .round))
                            .frame(width: 80, height: 80)
                            .rotationEffect(.degrees(-90))
                            .animation(.easeInOut(duration: 0.6), value: v)
                        VStack(spacing: 0) {
                            Image(systemName: "heart.fill")
                                .font(.caption2)
                                .foregroundStyle(level?.color ?? .blue)
                            Text(level?.emoji ?? "")
                                .font(.title2)
                        }
                    }
                }
            }

            if samples.count >= 2, let firstSample = samples.first, let last = latest {
                let first = firstSample.value
                let change = last - first
                HStack {
                    Image(systemName: change >= 0 ? "arrow.up.right" : "arrow.down.right")
                        .foregroundStyle(change >= 0 ? .green : .orange)
                    Text(String(format: "%+.1f mL/kg/min over \(samples.count) readings", change))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Trend Chart

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Trend")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                ForEach(samples, id: \.date) { s in
                    LineMark(
                        x: .value("Date", s.date),
                        y: .value("VO₂ Max", s.value)
                    )
                    .foregroundStyle(.blue)
                    .interpolationMethod(.catmullRom)

                    AreaMark(
                        x: .value("Date", s.date),
                        y: .value("VO₂ Max", s.value)
                    )
                    .foregroundStyle(.blue.opacity(0.1))
                    .interpolationMethod(.catmullRom)

                    PointMark(
                        x: .value("Date", s.date),
                        y: .value("VO₂ Max", s.value)
                    )
                    .foregroundStyle(.blue)
                    .symbolSize(30)
                }
            }
            .chartYScale(domain: chartYDomain)
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                    AxisGridLine()
                }
            }
            .frame(height: 200)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    private var chartYDomain: ClosedRange<Double> {
        let values = samples.map(\.value)
        let min = (values.min() ?? 30) - 3
        let max = (values.max() ?? 60) + 3
        return min...max
    }

    // MARK: - Classification Table

    private var classificationTable: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Fitness Levels")
                .font(.headline)
                .padding(.horizontal, 4)

            VStack(spacing: 0) {
                ForEach(FitnessLevel.allCases, id: \.label) { level in
                    HStack {
                        Text(level.emoji)
                            .frame(width: 28)
                        Text(level.label)
                            .font(.subheadline)
                            .foregroundStyle(level == FitnessLevel.from(vo2Max: latest ?? 0) ? level.color : .primary)
                            .fontWeight(level == FitnessLevel.from(vo2Max: latest ?? 0) ? .bold : .regular)
                        Spacer()
                        Text(level.range)
                            .font(.caption.monospacedDigit())
                            .foregroundStyle(.secondary)
                        if level == FitnessLevel.from(vo2Max: latest ?? 0) {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(level.color)
                                .font(.caption)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    if level != FitnessLevel.allCases.last {
                        Divider().padding(.leading, 56)
                    }
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Info Card

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "info.circle.fill")
                    .foregroundStyle(.blue)
                Text("About VO₂ Max")
                    .font(.subheadline.weight(.semibold))
            }
            Text("VO₂ Max is the maximum rate of oxygen your body can use during exercise. It's one of the best indicators of cardiovascular fitness and long-term health. Apple Watch estimates it from outdoor runs and walks using heart rate data.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "heart.circle")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No VO₂ Max Data")
                .font(.title3.bold())
            Text("Apple Watch estimates VO₂ Max during outdoor runs and walks. Ensure Location Services are enabled for the Health app.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let start = Calendar.current.date(byAdding: .year, value: -2, to: Date()) ?? Date()
        let raw = (try? await healthKit.fetchSamples(for: .vo2Max, from: start, to: Date())) ?? []
        let unit = HKUnit.literUnit(with: .milli)
            .unitDivided(by: HKUnit.gramUnit(with: .kilo).unitMultiplied(by: .minute()))
        samples = raw.map { s in
            (date: s.startDate, value: s.quantity.doubleValue(for: unit))
        }.sorted { $0.date < $1.date }
    }
}

// MARK: - Fitness Level

enum FitnessLevel: CaseIterable {
    case poor, belowAverage, average, good, excellent, superior

    var label: String {
        switch self {
        case .poor: return "Poor"
        case .belowAverage: return "Below Average"
        case .average: return "Average"
        case .good: return "Good"
        case .excellent: return "Excellent"
        case .superior: return "Superior"
        }
    }

    var emoji: String {
        switch self {
        case .poor: return "🟤"
        case .belowAverage: return "🔴"
        case .average: return "🟡"
        case .good: return "🟢"
        case .excellent: return "🔵"
        case .superior: return "🟣"
        }
    }

    var color: Color {
        switch self {
        case .poor: return .brown
        case .belowAverage: return .red
        case .average: return .yellow
        case .good: return .green
        case .excellent: return .blue
        case .superior: return .purple
        }
    }

    // Approximate ranges for adult males (Apple uses age/sex for exact cutoffs)
    var range: String {
        switch self {
        case .poor: return "< 30"
        case .belowAverage: return "30–37"
        case .average: return "38–43"
        case .good: return "44–50"
        case .excellent: return "51–58"
        case .superior: return "> 58"
        }
    }

    static func from(vo2Max: Double) -> FitnessLevel {
        if vo2Max < 30 { return .poor }
        if vo2Max < 38 { return .belowAverage }
        if vo2Max < 44 { return .average }
        if vo2Max < 51 { return .good }
        if vo2Max < 59 { return .excellent }
        return .superior
    }

    static func progress(vo2Max: Double) -> Double {
        min(max((vo2Max - 20) / 60, 0), 1.0)
    }
}

#Preview {
    NavigationStack {
        VO2MaxView()
    }
}
