import SwiftUI
import HealthKit

// MARK: - RunningPacingView

@available(iOS 16.0, *)
private struct RunningPacingContent: View {

    // MARK: - Models

    struct RunAnalysis: Identifiable {
        let id = UUID()
        let date: Date
        let distanceKm: Double
        let avgPaceSecPerKm: Double       // overall avg pace
        let firstHalfPaceSecPerKm: Double // first 50% of duration
        let secondHalfPaceSecPerKm: Double // second 50% of duration
        let pacingCV: Double               // coefficient of variation (lower = more consistent)
        let speedSamples: [Double]         // m/s samples for sparkline
        var isNegativeSplit: Bool { secondHalfPaceSecPerKm < firstHalfPaceSecPerKm }
        var splitDelta: Double { firstHalfPaceSecPerKm - secondHalfPaceSecPerKm } // positive = negative split (good)
    }

    // MARK: - State

    @State private var runs:       [RunAnalysis] = []
    @State private var isLoading = true
    @State private var errorMessage: String?

    private let hkStore = HKHealthStore()

    // MARK: - Computed

    private var negativeSplitPct: Double {
        guard !runs.isEmpty else { return 0 }
        return Double(runs.filter(\.isNegativeSplit).count) / Double(runs.count) * 100
    }

    private var avgCV: Double {
        guard !runs.isEmpty else { return 0 }
        return runs.map(\.pacingCV).reduce(0, +) / Double(runs.count)
    }

    private var consistencyRating: (String, Color) {
        switch avgCV {
        case ..<0.04: return ("Elite Pacer", .green)
        case 0.04..<0.07: return ("Consistent", .teal)
        case 0.07..<0.12: return ("Moderate Variation", .orange)
        default:          return ("High Variation", .red)
        }
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if isLoading {
                    ProgressView("Analyzing run pacing…")
                        .frame(maxWidth: .infinity)
                        .padding(.top, 60)
                } else if let err = errorMessage {
                    ContentUnavailableView(err, systemImage: "figure.run")
                } else if runs.isEmpty {
                    ContentUnavailableView(
                        "No Outdoor Run Data",
                        systemImage: "figure.run",
                        description: Text("Record outdoor runs with Apple Watch to see instantaneous pacing analysis.")
                    )
                } else {
                    summaryCards
                    splitHistoryCard
                    runListCard
                    scienceCard
                }
            }
            .padding()
        }
        .navigationTitle("Running Pacing")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Summary Cards

    private var summaryCards: some View {
        HStack(spacing: 10) {
            VStack(spacing: 6) {
                Image(systemName: negativeSplitPct >= 50 ? "checkmark.circle.fill" : "xmark.circle.fill")
                    .font(.title2)
                    .foregroundStyle(negativeSplitPct >= 50 ? .green : .orange)
                Text(String(format: "%.0f%%", negativeSplitPct))
                    .font(.title2.bold())
                Text("Negative Splits")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            .padding(12)
            .background(Color(.secondarySystemBackground))
            .cornerRadius(14)

            VStack(spacing: 6) {
                Image(systemName: "waveform.path")
                    .font(.title2)
                    .foregroundStyle(.blue)
                Text(String(format: "%.1f%%", avgCV * 100))
                    .font(.title2.bold())
                Text("Pacing CV")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                Text(consistencyRating.0)
                    .font(.caption2.bold())
                    .foregroundStyle(consistencyRating.1)
            }
            .frame(maxWidth: .infinity)
            .padding(12)
            .background(Color(.secondarySystemBackground))
            .cornerRadius(14)

            VStack(spacing: 6) {
                Image(systemName: "figure.run.circle.fill")
                    .font(.title2)
                    .foregroundStyle(.orange)
                Text("\(runs.count)")
                    .font(.title2.bold())
                Text("Runs Analyzed")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity)
            .padding(12)
            .background(Color(.secondarySystemBackground))
            .cornerRadius(14)
        }
    }

    // MARK: - Split History Chart

    private var splitHistoryCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Split Delta (last \(runs.count) runs)")
                .font(.headline)

            Text("Positive = negative split (faster second half = good pacing strategy)")
                .font(.caption)
                .foregroundStyle(.secondary)

            let maxDelta = max(runs.map { abs($0.splitDelta) }.max() ?? 30, 30)

            GeometryReader { geo in
                let xStep = geo.size.width / CGFloat(max(runs.count, 1))
                let midY  = geo.size.height / 2

                ZStack {
                    // Baseline
                    Path { p in
                        p.move(to: CGPoint(x: 0, y: midY))
                        p.addLine(to: CGPoint(x: geo.size.width, y: midY))
                    }
                    .stroke(Color.secondary.opacity(0.3), lineWidth: 1)

                    // Bars
                    ForEach(Array(runs.enumerated()), id: \.1.id) { i, run in
                        let x   = CGFloat(i) * xStep + xStep / 2
                        let h   = CGFloat(run.splitDelta / maxDelta) * (midY - 8)
                        let clampedH = min(abs(h), midY - 8)
                        let barColor: Color = run.isNegativeSplit ? .green : .orange
                        let yStart: CGFloat = run.isNegativeSplit ? midY - clampedH : midY
                        let yEnd:   CGFloat = run.isNegativeSplit ? midY : midY + clampedH

                        RoundedRectangle(cornerRadius: 3)
                            .fill(barColor.opacity(0.8))
                            .frame(width: max(xStep - 6, 4), height: abs(yEnd - yStart))
                            .position(x: x, y: (yStart + yEnd) / 2)
                    }
                }
            }
            .frame(height: 120)

            HStack {
                HStack(spacing: 4) {
                    Circle().fill(Color.green).frame(width: 8, height: 8)
                    Text("Negative split (faster 2nd half)")
                }
                Spacer()
                HStack(spacing: 4) {
                    Circle().fill(Color.orange).frame(width: 8, height: 8)
                    Text("Positive split")
                }
            }
            .font(.caption2)
            .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
    }

    // MARK: - Run List Card

    private var runListCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Recent Runs")
                .font(.headline)

            ForEach(runs) { run in
                runRow(run)
                if run.id != runs.last?.id { Divider() }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
    }

    private func runRow(_ run: RunAnalysis) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(run.date, format: .dateTime.month().day().year())
                        .font(.subheadline.weight(.semibold))
                    Text(String(format: "%.1f km", run.distanceKm))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                // Split indicator
                let sign  = run.isNegativeSplit ? "−" : "+"
                let delta = abs(Int(run.splitDelta))
                VStack(alignment: .trailing, spacing: 2) {
                    HStack(spacing: 3) {
                        Image(systemName: run.isNegativeSplit ? "arrow.down" : "arrow.up")
                            .font(.caption)
                            .foregroundStyle(run.isNegativeSplit ? .green : .orange)
                        Text(run.isNegativeSplit ? "Negative split" : "Positive split")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(run.isNegativeSplit ? .green : .orange)
                    }
                    Text("\(sign)\(delta)s/km")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }

            // First vs second half pace
            HStack(spacing: 12) {
                VStack(spacing: 1) {
                    Text(paceStr(run.firstHalfPaceSecPerKm))
                        .font(.caption.bold())
                    Text("1st half").font(.caption2).foregroundStyle(.secondary)
                }
                Text("→").font(.caption2).foregroundStyle(.secondary)
                VStack(spacing: 1) {
                    Text(paceStr(run.secondHalfPaceSecPerKm))
                        .font(.caption.bold())
                        .foregroundStyle(run.isNegativeSplit ? .green : .orange)
                    Text("2nd half").font(.caption2).foregroundStyle(.secondary)
                }
                Spacer()

                // Sparkline from speed samples
                if !run.speedSamples.isEmpty {
                    sparkline(run.speedSamples, color: run.isNegativeSplit ? .green : .orange)
                        .frame(width: 60, height: 22)
                }
            }

            // CV pill
            let cvPct = run.pacingCV * 100
            HStack(spacing: 4) {
                Text("Pacing CV: \(String(format: "%.1f", cvPct))%")
                    .font(.caption2)
                Text("·")
                Text(cvPct < 4 ? "Excellent" : cvPct < 7 ? "Good" : "Variable")
                    .font(.caption2)
                    .foregroundStyle(cvPct < 4 ? .green : cvPct < 7 ? .teal : .orange)
            }
            .foregroundStyle(.secondary)
        }
        .padding(.vertical, 4)
    }

    private func paceStr(_ secPerKm: Double) -> String {
        let m = Int(secPerKm) / 60
        let s = Int(secPerKm) % 60
        return String(format: "%d:%02d /km", m, s)
    }

    @ViewBuilder
    private func sparkline(_ samples: [Double], color: Color) -> some View {
        let minV = samples.min() ?? 0
        let maxV = max(samples.max() ?? 1, minV + 0.1)
        GeometryReader { geo in
            Path { p in
                let xStep = geo.size.width / CGFloat(max(samples.count - 1, 1))
                for (i, v) in samples.enumerated() {
                    let x = CGFloat(i) * xStep
                    let y = geo.size.height * (1 - CGFloat((v - minV) / (maxV - minV)))
                    i == 0 ? p.move(to: CGPoint(x: x, y: y)) : p.addLine(to: CGPoint(x: x, y: y))
                }
            }
            .stroke(color, lineWidth: 1.5)
        }
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Pacing Science", systemImage: "info.circle.fill")
                .font(.headline)
                .foregroundStyle(.orange)

            Text("A negative split (finishing faster than you started) is the gold standard for distance running. Research shows that even-pace or negative-split runners have 3–7% better race times than positive-splitters at equivalent effort levels.")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("Pacing Coefficient of Variation (CV = std/mean) measures consistency. Elite marathoners run at <3% CV. Values <7% are considered good for recreational runners.")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("This analysis uses HKQuantityType(.runningSpeed) — instantaneous speed samples recorded every 5–10 seconds by Apple Watch during outdoor runs (iOS 16+ required).")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.orange.opacity(0.07))
        .cornerRadius(14)
    }

    // MARK: - Data Loading

    private func load() async {
        guard HKHealthStore.isHealthDataAvailable() else {
            errorMessage = "HealthKit not available"
            isLoading = false
            return
        }

        let workoutType  = HKObjectType.workoutType()
        let speedType    = HKQuantityType(.runningSpeed)

        do {
            try await hkStore.requestAuthorization(toShare: [], read: [workoutType, speedType])
        } catch {
            errorMessage = "Authorization failed"
            isLoading = false
            return
        }

        let end   = Date()
        let start = Calendar.current.date(byAdding: .day, value: -90, to: end)!
        let sort  = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

        // Fetch recent outdoor running workouts
        let runPred = NSCompoundPredicate(andPredicateWithSubpredicates: [
            HKQuery.predicateForSamples(withStart: start, end: end),
            HKQuery.predicateForWorkouts(with: .running)
        ])

        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: workoutType, predicate: runPred, limit: 15, sortDescriptors: [sort]) { _, s, _ in
                cont.resume(returning: (s as? [HKWorkout]) ?? [])
            }
            hkStore.execute(q)
        }

        var analyses: [RunAnalysis] = []
        let mpsUnit = HKUnit.meter().unitDivided(by: .second())

        for workout in workouts {
            let wPred = HKQuery.predicateForObjects(from: workout)
            let speedSamples: [HKQuantitySample] = await withCheckedContinuation { cont in
                let q = HKSampleQuery(sampleType: speedType, predicate: wPred, limit: HKObjectQueryNoLimit,
                                      sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]) { _, s, _ in
                    cont.resume(returning: (s as? [HKQuantitySample]) ?? [])
                }
                hkStore.execute(q)
            }

            guard speedSamples.count >= 10 else { continue }

            let speeds = speedSamples.map { $0.quantity.doubleValue(for: mpsUnit) }
            let avgSpeed = speeds.reduce(0, +) / Double(speeds.count)
            guard avgSpeed > 0.5 else { continue }  // filter out near-zero speed sessions

            let avgPaceSecPerKm = 1000.0 / avgSpeed

            // First vs second half
            let mid = speeds.count / 2
            let firstHalfSpeeds  = Array(speeds.prefix(mid))
            let secondHalfSpeeds = Array(speeds.suffix(speeds.count - mid))
            let firstAvg  = firstHalfSpeeds.reduce(0, +) / Double(firstHalfSpeeds.count)
            let secondAvg = secondHalfSpeeds.reduce(0, +) / Double(secondHalfSpeeds.count)
            let firstPace  = firstAvg  > 0 ? 1000.0 / firstAvg  : avgPaceSecPerKm
            let secondPace = secondAvg > 0 ? 1000.0 / secondAvg : avgPaceSecPerKm

            // CV
            let mean   = avgSpeed
            let variance = speeds.map { pow($0 - mean, 2) }.reduce(0, +) / Double(speeds.count)
            let cv = mean > 0 ? sqrt(variance) / mean : 0

            let distM = workout.statistics(for: HKQuantityType(.distanceWalkingRunning))?.sumQuantity()?.doubleValue(for: .meter()) ?? 0

            // Downsample sparkline to ≤20 points
            let step = max(speeds.count / 20, 1)
            let sparkSpeeds = stride(from: 0, to: speeds.count, by: step).map { speeds[$0] }

            analyses.append(RunAnalysis(
                date: workout.startDate,
                distanceKm: distM / 1000,
                avgPaceSecPerKm: avgPaceSecPerKm,
                firstHalfPaceSecPerKm: firstPace,
                secondHalfPaceSecPerKm: secondPace,
                pacingCV: cv,
                speedSamples: sparkSpeeds
            ))
        }

        self.runs      = analyses
        self.isLoading = false
    }
}

// MARK: - Public Wrapper

struct RunningPacingView: View {
    var body: some View {
        if #available(iOS 16.0, *) {
            RunningPacingContent()
        } else {
            ContentUnavailableView(
                "iOS 16 Required",
                systemImage: "figure.run",
                description: Text("Running pacing analysis requires iOS 16+ for instantaneous speed data.")
            )
        }
    }
}

#Preview {
    NavigationStack { RunningPacingView() }
}
