import SwiftUI
import Charts
import HealthKit

// MARK: - RunningEfficiencyView
/// Tracks Aerobic Efficiency Index (AEI) over time: speed (m/min) / avg HR × 100.
/// A rising AEI means you're running faster at the same heart rate — aerobic fitness improving.
struct RunningEfficiencyView: View {
    @State private var points: [EffPoint] = []
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    // MARK: - Model

    struct EffPoint: Identifiable {
        let id: UUID
        let date: Date
        let distanceKm: Double
        let durationSecs: Double
        let avgHR: Double
        let aei: Double   // (1000 / paceSecsPerKm) / avgHR * 100

        var paceSecsPerKm: Double { distanceKm > 0 ? durationSecs / distanceKm : 0 }

        var formattedPace: String {
            let s = Int(paceSecsPerKm)
            return "\(s / 60):\(String(format: "%02d", s % 60)) /km"
        }

        var category: String {
            if distanceKm < 5 { return "Short" }
            if distanceKm < 12 { return "Medium" }
            return "Long"
        }

        var categoryColor: Color {
            switch category {
            case "Short": return .blue
            case "Medium": return .green
            default: return .orange
            }
        }
    }

    // MARK: - Computed

    private var avgAEI: Double? {
        guard !points.isEmpty else { return nil }
        return points.map(\.aei).reduce(0, +) / Double(points.count)
    }

    private var trend: Double? {
        guard points.count >= 5 else { return nil }
        let n = Double(points.count)
        let xs = (0..<points.count).map { Double($0) }
        let ys = points.map(\.aei)
        let xMean = xs.reduce(0, +) / n
        let yMean = ys.reduce(0, +) / n
        let num = zip(xs, ys).reduce(0.0) { $0 + ($1.0 - xMean) * ($1.1 - yMean) }
        let den = xs.reduce(0.0) { $0 + ($1 - xMean) * ($1 - xMean) }
        return den > 0 ? num / den : nil
    }

    private var rollingAEI: [(date: Date, aei: Double)] {
        let window = 7
        return points.enumerated().map { (i, p) in
            let slice = points[max(0, i - window + 1)...i]
            let avg = slice.map(\.aei).reduce(0, +) / Double(slice.count)
            return (date: p.date, aei: (avg * 100).rounded() / 100)
        }
    }

    private var recentAEI: Double? {
        let last = points.suffix(7)
        guard !last.isEmpty else { return nil }
        return last.map(\.aei).reduce(0, +) / Double(last.count)
    }

    private var baselineAEI: Double? {
        let first = points.prefix(7)
        guard !first.isEmpty else { return nil }
        return first.map(\.aei).reduce(0, +) / Double(first.count)
    }

    private var changePct: Double? {
        guard let r = recentAEI, let b = baselineAEI, b > 0 else { return nil }
        return (r - b) / b * 100
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if points.count < 3 {
                    emptyState
                } else {
                    summaryCards
                    trendBanner
                    trendChart
                    scatterChart
                    recentRunsCard
                    infoCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Running Efficiency")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Summary Cards

    private var summaryCards: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 2), spacing: 10) {
            EffCard(value: points.last.map { String(format: "%.2f", $0.aei) } ?? "—",
                    label: "Latest AEI", sub: "aerobic efficiency", color: .green)
            EffCard(value: changePct.map { String(format: "%+.1f%%", $0) } ?? "—",
                    label: "90-Day Change", sub: "vs early runs", color: (changePct ?? 0) >= 0 ? .green : .red)
            EffCard(value: points.last.map { String(format: "%.0f bpm", $0.avgHR) } ?? "—",
                    label: "Latest Avg HR", sub: "during run", color: .red)
            EffCard(value: points.last?.formattedPace ?? "—",
                    label: "Latest Pace", sub: "average /km", color: .blue)
        }
    }

    // MARK: - Trend Banner

    private var trendBanner: some View {
        let improving = (trend ?? 0) > 0.002
        let declining = (trend ?? 0) < -0.002

        return HStack(alignment: .top, spacing: 12) {
            Text(improving ? "📈" : declining ? "📉" : "➡️")
                .font(.title2)
            VStack(alignment: .leading, spacing: 4) {
                Text(improving ? "Aerobic efficiency improving" :
                     declining ? "Efficiency declining" : "Efficiency stable")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(improving ? .green : declining ? .red : .secondary)
                Text(improving
                    ? "You're getting more speed per heartbeat. Your aerobic base is building."
                    : declining
                    ? "HR rising faster than pace improvement. Add more easy-zone running."
                    : "AEI is consistent. Continue training to build the trend.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(improving ? Color.green.opacity(0.08) : declining ? Color.red.opacity(0.08) : Color(.secondarySystemGroupedBackground))
        .overlay(RoundedRectangle(cornerRadius: 14)
            .stroke(improving ? Color.green.opacity(0.2) : declining ? Color.red.opacity(0.2) : Color.clear))
        .cornerRadius(14)
    }

    // MARK: - Trend Chart

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("AEI Trend (7-run rolling average)")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Chart {
                if let avg = avgAEI {
                    RuleMark(y: .value("Average", avg))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                        .foregroundStyle(.purple.opacity(0.5))
                }
                ForEach(rollingAEI, id: \.date) { entry in
                    LineMark(x: .value("Date", entry.date), y: .value("AEI", entry.aei))
                        .foregroundStyle(.green)
                        .interpolationMethod(.catmullRom)
                    AreaMark(x: .value("Date", entry.date), y: .value("AEI", entry.aei))
                        .foregroundStyle(.green.opacity(0.08))
                        .interpolationMethod(.catmullRom)
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 21)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                    AxisTick()
                }
            }
            .chartYAxis {
                AxisMarks { val in
                    AxisGridLine()
                    AxisValueLabel { if let v = val.as(Double.self) { Text(String(format: "%.1f", v)) } }
                }
            }
            .frame(height: 180)
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(16)
    }

    // MARK: - Scatter Chart: HR vs AEI

    private var scatterChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Heart Rate vs Efficiency")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Text("Lower HR at high AEI = better aerobic fitness")
                .font(.caption2)
                .foregroundStyle(.tertiary)

            Chart(points) { p in
                PointMark(x: .value("HR", p.avgHR), y: .value("AEI", p.aei))
                    .foregroundStyle(p.categoryColor.opacity(0.7))
                    .symbolSize(30)
            }
            .chartXAxisLabel("Avg HR (bpm)", alignment: .center)
            .chartYAxisLabel("AEI")
            .frame(height: 160)

            HStack(spacing: 12) {
                ForEach(["Short (<5 km)", "Medium", "Long (>12 km)"], id: \.self) { cat in
                    HStack(spacing: 4) {
                        Circle()
                            .fill(cat.contains("Short") ? Color.blue : cat.contains("Med") ? Color.green : Color.orange)
                            .frame(width: 8, height: 8)
                        Text(cat).font(.caption2).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(16)
    }

    // MARK: - Recent Runs

    private var recentRunsCard: some View {
        let avg = avgAEI ?? 0
        return VStack(alignment: .leading, spacing: 10) {
            Text("Recent Runs")
                .font(.subheadline.weight(.semibold))

            ForEach(points.suffix(8).reversed()) { p in
                HStack {
                    VStack(alignment: .leading, spacing: 1) {
                        Text(p.date.formatted(.dateTime.month(.abbreviated).day()))
                            .font(.caption.weight(.medium))
                        Text("\(String(format: "%.1f", p.distanceKm)) km · \(p.formattedPace)")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    Text(String(format: "AEI %.2f", p.aei))
                        .font(.caption.weight(.medium))
                        .foregroundStyle(p.aei > avg * 1.03 ? .green : p.aei < avg * 0.97 ? .red : .primary)
                }
                if p.id != points.suffix(8).first?.id { Divider() }
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(16)
    }

    // MARK: - Info Card

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("What is AEI?")
                .font(.subheadline.weight(.semibold))
            Text("Aerobic Efficiency Index = speed (m/min) ÷ heart rate × 100. As fitness improves, your heart pumps more oxygen per beat — so you run faster at the same heart rate, or the same pace at a lower heart rate. Both increase AEI.")
                .font(.caption)
                .foregroundStyle(.secondary)
            Text("Compare runs of similar distance and conditions. AEI can drop temporarily after hard training — look at the rolling trend over 3–4 weeks.")
                .font(.caption2)
                .foregroundStyle(.tertiary)
                .padding(.top, 2)
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(16)
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "gauge.open.with.lines.needle.33percent")
                .font(.system(size: 44))
                .foregroundStyle(.secondary)
            Text("Not enough run data")
                .font(.headline)
            Text("Log at least 3 outdoor runs with Apple Watch to see your efficiency trends.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(40)
    }

    // MARK: - Data Loading

    private func loadData() async {
        guard !isLoading else { return }
        isLoading = true
        defer { isLoading = false }

        let end = Date()
        let start = Calendar.current.date(byAdding: .day, value: -90, to: end) ?? Date()
        let timePredicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)

        let workoutPredicate = NSCompoundPredicate(andPredicateWithSubpredicates: [
            timePredicate,
            HKQuery.predicateForWorkouts(with: .running),
        ])

        let workoutDescriptor = HKSampleQueryDescriptor(
            predicates: [.workout(workoutPredicate)],
            sortDescriptors: [SortDescriptor(\HKWorkout.startDate)]
        )

        // Fetch all HR samples for the period
        let hrDescriptor = HKSampleQueryDescriptor(
            predicates: [.quantitySample(
                type: HKQuantityType(.heartRate),
                predicate: timePredicate
            )],
            sortDescriptors: [SortDescriptor(\HKQuantitySample.startDate)]
        )

        do {
            async let workoutResults = workoutDescriptor.result(for: HKHealthStore())
            async let hrResults = hrDescriptor.result(for: HKHealthStore())

            let (workouts, hrSamples) = try await (workoutResults, hrResults)

            let hrUnit = HKUnit.count().unitDivided(by: .minute())

            let computed: [EffPoint] = workouts.compactMap { workout in
                let distanceKm = (workout.totalDistance?.doubleValue(for: .meter()) ?? 0) / 1000
                guard distanceKm >= 0.8 else { return nil }
                let duration = workout.duration
                guard duration > 300 else { return nil }  // at least 5 min

                // Average HR during this workout window
                let workoutHR = hrSamples.filter {
                    $0.startDate >= workout.startDate && $0.startDate <= workout.endDate
                }
                guard !workoutHR.isEmpty else { return nil }
                let avgHR = workoutHR.map { $0.quantity.doubleValue(for: hrUnit) }.reduce(0, +) / Double(workoutHR.count)
                guard avgHR > 50 else { return nil }

                let paceSecsPerKm = duration / distanceKm
                let speedMpm = 1000.0 / paceSecsPerKm
                let aei = (speedMpm / avgHR) * 100

                return EffPoint(
                    id: workout.uuid,
                    date: workout.startDate,
                    distanceKm: distanceKm,
                    durationSecs: duration,
                    avgHR: avgHR,
                    aei: (aei * 100).rounded() / 100
                )
            }

            await MainActor.run { points = computed }
        } catch {
            // HealthKit not available
        }
    }
}

// MARK: - Supporting view

struct EffCard: View {
    let value: String
    let label: String
    let sub: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title3.bold())
                .foregroundStyle(color)
                .lineLimit(1).minimumScaleFactor(0.7)
            Text(label)
                .font(.caption.weight(.medium))
                .multilineTextAlignment(.center)
            Text(sub)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

#Preview {
    NavigationStack { RunningEfficiencyView() }
}
