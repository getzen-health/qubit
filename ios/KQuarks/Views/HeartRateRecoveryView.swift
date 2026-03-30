import SwiftUI
import HealthKit
import Charts

// MARK: - Models

private struct RecoveryPoint: Identifiable {
    let id = UUID()
    let date: Date
    let workoutType: String
    let peakHR: Double
    let hrr1: Double?   // drop at 1 min
    let hrr2: Double?   // drop at 2 min
    let durationMinutes: Double
}

private enum HRRClass {
    case poor, normal, good, excellent

    init(hrr1: Double) {
        if hrr1 >= 25 { self = .excellent }
        else if hrr1 >= 18 { self = .good }
        else if hrr1 >= 12 { self = .normal }
        else { self = .poor }
    }

    var label: String {
        switch self {
        case .poor: return "Poor"
        case .normal: return "Normal"
        case .good: return "Good"
        case .excellent: return "Excellent"
        }
    }

    var color: Color {
        switch self {
        case .poor: return .orange
        case .normal: return .yellow
        case .good: return Color(red: 0.53, green: 0.94, blue: 0.67)
        case .excellent: return .green
        }
    }
}

// MARK: - HeartRateRecoveryView

struct HeartRateRecoveryView: View {
    @State private var points: [RecoveryPoint] = []
    @State private var isLoading = true
    @State private var errorMsg: String?
    @State private var selectedPoint: RecoveryPoint?

    private let healthStore = HKHealthStore()

    private var validPoints: [RecoveryPoint] { points.filter { $0.hrr1 != nil } }

    private var avgHRR1: Double? {
        let vals = validPoints.compactMap(\.hrr1)
        return vals.isEmpty ? nil : vals.reduce(0, +) / Double(vals.count)
    }

    private var latestClass: HRRClass? {
        guard let v = validPoints.last?.hrr1 else { return nil }
        return HRRClass(hrr1: v)
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().frame(maxWidth: .infinity).padding(.top, 60)
                } else if let err = errorMsg {
                    errorView(err)
                } else if validPoints.isEmpty {
                    emptyState
                } else {
                    heroSection
                    classificationBand
                    if validPoints.count >= 3 { trendChart }
                    if !byTypeData.isEmpty { byTypeChart }
                    recentTable
                    educationCard
                }
            }
            .padding()
        }
        .background(Color.premiumBackground)
        .navigationTitle("HR Recovery")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Hero

    private var heroSection: some View {
        let latest = validPoints.last
        let cls = latestClass

        return HStack(spacing: 0) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Latest HRR1")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text(latest?.hrr1.map { String(format: "%.0f", $0) } ?? "—")
                        .font(.system(size: 48, weight: .bold, design: .rounded))
                        .foregroundStyle(cls?.color ?? .primary)
                    Text("bpm")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .padding(.bottom, 8)
                }
                if let cls {
                    Text(cls.label)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(cls.color)
                }
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 8) {
                if let avg = avgHRR1 {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(String(format: "%.0f bpm", avg))
                            .font(.title3.bold())
                        Text("avg HRR1")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
                VStack(alignment: .trailing, spacing: 2) {
                    Text("\(validPoints.count)")
                        .font(.title3.bold())
                    Text("workouts")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Classification Band

    private var classificationBand: some View {
        HStack(spacing: 8) {
            ForEach([
                (label: "Poor", range: "<12", color: Color.orange),
                (label: "Normal", range: "12–17", color: Color.yellow),
                (label: "Good", range: "18–24", color: Color(red: 0.53, green: 0.94, blue: 0.67)),
                (label: "Excellent", range: "≥25", color: Color.green),
            ], id: \.label) { item in
                VStack(spacing: 3) {
                    Text(item.label)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(item.color)
                    Text(item.range)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    Text("bpm")
                        .font(.system(size: 8))
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .background(item.color.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: 8))
            }
        }
    }

    // MARK: - Trend Chart

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("HRR1 Trend")
                .font(.headline)
                .padding(.horizontal, 4)

            // 5-point rolling avg
            let rolling = computeRolling(validPoints.compactMap(\.hrr1))

            Chart {
                // Reference lines
                RuleMark(y: .value("Poor", 12))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(Color.orange.opacity(0.5))
                RuleMark(y: .value("Good", 18))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(Color.yellow.opacity(0.5))
                RuleMark(y: .value("Excellent", 25))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(Color.green.opacity(0.5))

                ForEach(Array(validPoints.enumerated()), id: \.element.id) { i, pt in
                    if let hrr1 = pt.hrr1 {
                        PointMark(x: .value("Date", pt.date), y: .value("HRR1", hrr1))
                            .foregroundStyle(HRRClass(hrr1: hrr1).color)
                            .symbolSize(30)
                    }
                }

                // Rolling avg line
                ForEach(Array(rolling.enumerated()), id: \.offset) { (i, avg) in
                    if i < validPoints.count {
                        LineMark(
                            x: .value("Date", validPoints[i].date),
                            y: .value("Rolling", avg)
                        )
                        .foregroundStyle(Color.yellow.opacity(0.8))
                        .lineStyle(StrokeStyle(lineWidth: 2, dash: [5, 3]))
                        .interpolationMethod(.catmullRom)
                    }
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 14)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .frame(height: 200)
            .padding()
            .background(Color.premiumBackground)
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - By Type Chart

    private var byTypeData: [(type: String, avg: Double, count: Int)] {
        var buckets: [String: [Double]] = [:]
        for pt in validPoints {
            if let hrr1 = pt.hrr1 { buckets[pt.workoutType, default: []].append(hrr1) }
        }
        return buckets.map { entry -> (type: String, avg: Double, count: Int) in
            let avg = entry.value.reduce(0, +) / Double(entry.value.count)
            return (type: entry.key, avg: avg, count: entry.value.count)
        }
        .filter { $0.count >= 2 }
        .sorted { $0.avg > $1.avg }
        .prefix(6)
        .map { $0 }
    }

    private var byTypeChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Avg HRR1 by Sport")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                ForEach(byTypeData, id: \.type) { item in
                    BarMark(
                        x: .value("Type", String(item.type.prefix(12))),
                        y: .value("HRR1", item.avg)
                    )
                    .foregroundStyle(HRRClass(hrr1: item.avg).color)
                    .cornerRadius(4)
                }
            }
            .chartYAxis {
                AxisMarks { val in
                    if let v = val.as(Double.self) {
                        AxisValueLabel { Text("\(Int(v))") }
                    }
                }
            }
            .frame(height: 160)
            .padding()
            .background(Color.premiumBackground)
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Recent Table

    private var recentTable: some View {
        let recent = validPoints.suffix(8).reversed()
        return VStack(alignment: .leading, spacing: 8) {
            Text("Recent Workouts")
                .font(.headline)
                .padding(.horizontal, 4)

            VStack(spacing: 0) {
                // Header
                HStack {
                    Text("Date").frame(maxWidth: .infinity, alignment: .leading)
                    Text("Sport").frame(width: 80, alignment: .leading)
                    Text("Peak").frame(width: 50, alignment: .trailing)
                    Text("HRR1").frame(width: 50, alignment: .trailing)
                }
                .font(.caption2)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 12)
                .padding(.bottom, 6)

                ForEach(Array(recent), id: \.id) { pt in
                    HStack {
                        Text(pt.date, style: .date)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        Text(String(pt.workoutType.prefix(10)))
                            .frame(width: 80, alignment: .leading)
                        Text(String(format: "%.0f", pt.peakHR))
                            .frame(width: 50, alignment: .trailing)
                            .foregroundStyle(.secondary)
                        if let hrr1 = pt.hrr1 {
                            Text(String(format: "%.0f", hrr1))
                                .frame(width: 50, alignment: .trailing)
                                .foregroundStyle(HRRClass(hrr1: hrr1).color)
                                .fontWeight(.semibold)
                        } else {
                            Text("—").frame(width: 50, alignment: .trailing).foregroundStyle(.secondary)
                        }
                    }
                    .font(.caption)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)

                    if pt.id != recent.first?.id {
                        Divider().opacity(0.3).padding(.leading, 12)
                    }
                }
            }
            .padding(.vertical, 8)
            .background(Color.premiumBackground)
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Education

    private var educationCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("About HR Recovery")
                .font(.headline)
            VStack(alignment: .leading, spacing: 6) {
                Text("HRR1 (1-minute recovery) is the bpm drop in the first minute after stopping exercise. It reflects parasympathetic reactivation — the same system that governs HRV.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Text("An HRR1 ≤ 12 bpm is clinically linked to increased cardiovascular risk. Elite athletes typically recover 30+ bpm per minute. Zone 2 training improves recovery speed over months.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Empty / Error

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "heart.slash")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No Recovery Data")
                .font(.title3.bold())
            Text("HR recovery requires workouts with heart rate monitoring. Complete workouts in the Workout app or third-party apps that record HR samples immediately after exercise.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    private func errorView(_ msg: String) -> some View {
        VStack(spacing: 8) {
            Image(systemName: "exclamationmark.triangle")
                .font(.largeTitle)
                .foregroundStyle(.orange)
            Text(msg)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.top, 60)
    }

    // MARK: - Rolling Average

    private func computeRolling(_ points: [Double], window: Int = 5) -> [Double] {
        var result: [Double] = []
        for i in points.indices {
            let slice = points[max(0, i - window + 1)...i]
            result.append(slice.reduce(0, +) / Double(slice.count))
        }
        return result
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        guard HKHealthStore.isHealthDataAvailable() else {
            errorMsg = "HealthKit not available"
            return
        }

        let workoutType = HKObjectType.workoutType()
        let hrType = HKQuantityType(.heartRate)
        let types: Set<HKSampleType> = [workoutType, hrType]

        do {
            try await healthStore.requestAuthorization(toShare: [], read: types)
        } catch {
            errorMsg = "HealthKit authorization failed"
            return
        }

        let ninetyDaysAgo = Calendar.current.date(byAdding: .day, value: -90, to: Date()) ?? Date()
        let workoutPredicate = HKQuery.predicateForSamples(withStart: ninetyDaysAgo, end: Date())
        let hrPredicate = HKQuery.predicateForSamples(withStart: ninetyDaysAgo, end: Date())

        do {
            // Fetch workouts
            let workoutDescriptor = HKSampleQueryDescriptor(
                predicates: [.workout(workoutPredicate)],
                sortDescriptors: [SortDescriptor(\HKWorkout.startDate, order: .forward)]
            )
            let hrDescriptor = HKSampleQueryDescriptor(
                predicates: [.quantitySample(type: hrType, predicate: hrPredicate)],
                sortDescriptors: [SortDescriptor(\HKQuantitySample.startDate, order: .forward)]
            )

            async let workoutResults = workoutDescriptor.result(for: healthStore)
            async let hrResults = hrDescriptor.result(for: healthStore)
            let (workouts, hrSamples) = try await (workoutResults, hrResults)

            let hrUnit = HKUnit.count().unitDivided(by: .minute())

            // Index HR by minute
            var hrByMinute: [String: [Double]] = [:]
            let minFmt = ISO8601DateFormatter()
            minFmt.formatOptions = [.withInternetDateTime]
            for sample in hrSamples {
                let key = minuteKey(sample.startDate)
                hrByMinute[key, default: []].append(sample.quantity.doubleValue(for: hrUnit))
            }

            func avgHr(at date: Date) -> Double? {
                let key = minuteKey(date)
                guard let vals = hrByMinute[key], !vals.isEmpty else { return nil }
                return vals.reduce(0, +) / Double(vals.count)
            }

            var result: [RecoveryPoint] = []
            for workout in workouts {
                guard workout.duration > 600 else { continue } // min 10 min

                let endDate = workout.endDate

                // Peak HR: max in last 5 min of workout
                var peak = 0.0
                for offset in stride(from: -5, through: 0, by: 1) {
                    let checkDate = Calendar.current.date(byAdding: .minute, value: offset, to: endDate) ?? Date()
                    if let v = avgHr(at: checkDate), v > peak { peak = v }
                }
                guard peak > 100 else { continue }

                // HRR1 and HRR2
                let hr1Date = Calendar.current.date(byAdding: .minute, value: 1, to: endDate) ?? Date()
                let hr2Date = Calendar.current.date(byAdding: .minute, value: 2, to: endDate) ?? Date()
                let hrr1 = avgHr(at: hr1Date).map { peak - $0 }
                let hrr2 = avgHr(at: hr2Date).map { peak - $0 }

                guard hrr1 != nil || hrr2 != nil else { continue }

                result.append(RecoveryPoint(
                    date: workout.startDate,
                    workoutType: workout.workoutActivityType.displayName,
                    peakHR: peak,
                    hrr1: hrr1,
                    hrr2: hrr2,
                    durationMinutes: workout.duration / 60
                ))
            }

            points = result
        } catch {
            errorMsg = error.localizedDescription
        }
    }

    private func minuteKey(_ date: Date) -> String {
        let cal = Calendar.current
        let comps = cal.dateComponents([.year, .month, .day, .hour, .minute], from: date)
        return String(format: "%04d-%02d-%02dT%02d:%02d",
                      comps.year ?? 0, comps.month ?? 0, comps.day ?? 0, comps.hour ?? 0, comps.minute ?? 0)
    }
}

#Preview {
    NavigationStack {
        HeartRateRecoveryView()
    }
}
