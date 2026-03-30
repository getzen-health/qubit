import SwiftUI
import Charts
import HealthKit

// MARK: - LactateThresholdView

/// Estimates lactate threshold (LT1 and LT2) from running workout data.
/// Uses the HR-pace relationship across workouts to identify the aerobic
/// (LT1 ≈ 75–80% HRmax) and anaerobic (LT2 ≈ 85–90% HRmax) thresholds.
///
/// Without a lab test, estimates are derived from the LTHR approach:
/// - LT2 (race threshold / LTHR) ≈ average HR during a ~30-min all-out effort
/// - LT1 (aerobic threshold) ≈ LT2 - 20 bpm for most trained runners
/// We use the best-effort 5K, 10K approximation from workout data.
struct LactateThresholdView: View {

    // MARK: - Models

    struct WorkoutPoint: Identifiable {
        let id = UUID()
        let date: Date
        let avgHR: Double     // bpm
        let pace: Double      // min/km
        let durationMins: Double
        let effortClass: EffortClass

        enum EffortClass: String {
            case easy       = "Easy (Z1–2)"
            case moderate   = "Moderate (Z3)"
            case threshold  = "Threshold (Z4)"
            case hard       = "Hard (Z5)"

            var color: Color {
                switch self {
                case .easy:      return .green
                case .moderate:  return .teal
                case .threshold: return .orange
                case .hard:      return .red
                }
            }

            static func classify(hrFraction: Double) -> EffortClass {
                if hrFraction < 0.75 { return .easy }
                if hrFraction < 0.82 { return .moderate }
                if hrFraction < 0.90 { return .threshold }
                return .hard
            }
        }
    }

    struct ThresholdEstimate {
        let lt1HR: Double      // Aerobic threshold HR
        let lt2HR: Double      // Lactate threshold HR (LTHR)
        let lt1Pace: Double    // min/km at LT1
        let lt2Pace: Double    // min/km at LT2
        let maxHR: Double
        let confidence: String
    }

    // MARK: - State

    @State private var points: [WorkoutPoint] = []
    @State private var estimate: ThresholdEstimate?
    @State private var isLoading = true
    @State private var hasNoData = false

    private let healthStore = HKHealthStore()

    // MARK: - Body

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if hasNoData {
                noDataState
            } else {
                VStack(spacing: 16) {
                    if let est = estimate {
                        thresholdCard(est)
                        zonesCard(est)
                    }
                    hrPaceChart
                    scienceCard
                }
                .padding()
            }
        }
        .background(Color.premiumBackground)
        .navigationTitle("Lactate Threshold")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Threshold Card

    private func thresholdCard(_ est: ThresholdEstimate) -> some View {
        VStack(spacing: 14) {
            HStack {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Estimated Thresholds")
                        .font(.caption).foregroundStyle(.secondary)
                    Text("Based on \(points.count) runs")
                        .font(.title3.bold())
                    Text("Confidence: \(est.confidence)")
                        .font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: "waveform.path.ecg")
                    .font(.system(size: 44)).foregroundStyle(.orange)
            }

            Divider()

            HStack(spacing: 0) {
                thresholdCell(
                    label: "LT1 (Aerobic)",
                    hr: est.lt1HR,
                    pace: est.lt1Pace,
                    color: .teal
                )
                Divider().frame(height: 56)
                thresholdCell(
                    label: "LT2 (Anaerobic)",
                    hr: est.lt2HR,
                    pace: est.lt2Pace,
                    color: .orange
                )
                Divider().frame(height: 56)
                VStack(spacing: 4) {
                    Text("\(Int(est.maxHR)) bpm")
                        .font(.subheadline.bold().monospacedDigit()).foregroundStyle(.red)
                    Text("Est. Max HR").font(.caption2).foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity).padding(.vertical, 8)
            }

            Divider()

            Text("LT2 is your race pace HR for half marathon to 10K efforts. Training at LT1 pace (Zone 2 / \"comfortably hard\") is the most efficient way to raise both thresholds.")
                .font(.caption).foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func thresholdCell(label: String, hr: Double, pace: Double, color: Color) -> some View {
        VStack(spacing: 4) {
            Text("\(Int(hr)) bpm")
                .font(.subheadline.bold().monospacedDigit()).foregroundStyle(color)
            Text(paceString(pace)).font(.caption.monospacedDigit()).foregroundStyle(color.opacity(0.7))
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 8)
    }

    // MARK: - Training Zones Card

    private func zonesCard(_ est: ThresholdEstimate) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Your Training Zones")
                .font(.headline)

            let zones: [(String, String, Double, Double, Color)] = [
                ("Z1 — Recovery", "Easy aerobic base", 0, est.lt1HR * 0.85, .blue),
                ("Z2 — Aerobic", "Zone 2 / fat burning", est.lt1HR * 0.85, est.lt1HR, .green),
                ("Z3 — Tempo", "Between thresholds", est.lt1HR, est.lt2HR * 0.95, .teal),
                ("Z4 — Threshold", "LTHR training zone", est.lt2HR * 0.95, est.lt2HR * 1.02, .orange),
                ("Z5 — VO₂ Max", "High intensity intervals", est.lt2HR * 1.02, est.maxHR, .red),
            ]

            ForEach(zones, id: \.0) { zone in
                HStack(spacing: 12) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(zone.4)
                        .frame(width: 6, height: 40)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(zone.0).font(.subheadline.bold())
                        Text(zone.1).font(.caption).foregroundStyle(.secondary)
                    }
                    Spacer()
                    Text("\(Int(zone.2))–\(Int(zone.3)) bpm")
                        .font(.caption.monospacedDigit().bold()).foregroundStyle(zone.4)
                }
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - HR vs Pace Chart

    private var hrPaceChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("HR vs Pace — All Runs")
                .font(.headline)
            Text("Each point is one run. Better fitness = faster pace at same HR.")
                .font(.caption).foregroundStyle(.secondary)

            Chart {
                ForEach(points) { p in
                    PointMark(x: .value("Pace (min/km)", p.pace),
                              y: .value("HR (bpm)", p.avgHR))
                    .foregroundStyle(p.effortClass.color)
                    .symbolSize(45)
                }

                if let est = estimate {
                    RuleMark(y: .value("LT1", est.lt1HR))
                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [4, 3]))
                        .foregroundStyle(Color.teal.opacity(0.6))
                        .annotation(position: .topLeading) {
                            Text("LT1").font(.caption2).foregroundStyle(.teal)
                        }
                    RuleMark(y: .value("LT2", est.lt2HR))
                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [4, 3]))
                        .foregroundStyle(Color.orange.opacity(0.6))
                        .annotation(position: .topLeading) {
                            Text("LT2").font(.caption2).foregroundStyle(.orange)
                        }
                }
            }
            .chartXAxisLabel("Pace (min/km)")
            .chartYAxisLabel("Avg HR (bpm)")
            .chartYScale(domain: .automatic(includesZero: false))
            .frame(height: 220)

            // Legend
            HStack(spacing: 16) {
                ForEach([WorkoutPoint.EffortClass.easy, .moderate, .threshold, .hard], id: \.rawValue) { ec in
                    HStack(spacing: 4) {
                        Circle().fill(ec.color).frame(width: 7, height: 7)
                        Text(ec.rawValue).font(.caption2).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Lactate Threshold Science", systemImage: "waveform.path.ecg")
                .font(.headline).foregroundStyle(.orange)

            Text("Lactate Threshold 1 (LT1) is the exercise intensity where blood lactate first rises above resting levels — your \"comfortably hard\" sustainable aerobic pace. Training here (Zone 2) is the biggest driver of endurance base.")
                .font(.caption).foregroundStyle(.secondary)

            Text("Lactate Threshold 2 (LT2 / LTHR) is where lactate accumulates faster than your body can clear it — typically your hour-race effort. Raising LT2 is the goal of threshold intervals and tempo runs.")
                .font(.caption).foregroundStyle(.secondary)

            Text("Without a lab test, estimates are based on the HR-pace relationship across your recent runs. A 20–30 min all-out time trial gives the most accurate LTHR (average HR of the final 20 minutes).")
                .font(.caption).foregroundStyle(.secondary)

            Text("Note: These are estimates. For precision, use a lab lactate test or a structured LTHR field test.")
                .font(.caption2).foregroundStyle(.secondary).italic()
        }
        .padding()
        .background(Color.orange.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - No Data State

    private var noDataState: some View {
        VStack(spacing: 16) {
            Image(systemName: "waveform.path.ecg")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("Not Enough Run Data")
                .font(.title3.bold())
            Text("Lactate threshold estimation requires at least 5 runs of varying intensity recorded on Apple Watch with heart rate data.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Helpers

    private func paceString(_ minPerKm: Double) -> String {
        let mins = Int(minPerKm)
        let secs = Int((minPerKm - Double(mins)) * 60)
        return String(format: "%d:%02d /km", mins, secs)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let workoutType = HKObjectType.workoutType()
        let hrType = HKQuantityType(.heartRate)
        let distType = HKQuantityType(.distanceWalkingRunning)

        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType, hrType, distType])) != nil else {
            hasNoData = true; return
        }

        let sixMonthsAgo = Calendar.current.date(byAdding: .month, value: -6, to: Date()) ?? Date()

        let pred = NSCompoundPredicate(andPredicateWithSubpredicates: [
            HKQuery.predicateForSamples(withStart: sixMonthsAgo, end: Date()),
            HKQuery.predicateForWorkouts(with: .running)
        ])

        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKWorkout]) ?? []) }
            healthStore.execute(q)
        }

        let hrUnit = HKUnit.count().unitDivided(by: .minute())
        let kmUnit = HKUnit.meterUnit(with: .kilo)

        var validPoints: [WorkoutPoint] = []
        var maxHR: Double = 0

        for w in workouts {
            guard w.duration >= 15 * 60 else { continue }  // min 15 min runs
            guard let avgHR = w.statistics(for: hrType)?.averageQuantity()?.doubleValue(for: hrUnit),
                  avgHR > 80,
                  let dist = w.statistics(for: distType)?.sumQuantity()?.doubleValue(for: kmUnit),
                  dist > 1 else { continue }

            let pace = (w.duration / 60) / dist  // min/km
            guard pace > 3 && pace < 15 else { continue }  // sane pace range

            if let peak = w.statistics(for: hrType)?.maximumQuantity()?.doubleValue(for: hrUnit) {
                maxHR = max(maxHR, peak)
            }
            validPoints.append(WorkoutPoint(
                date: w.startDate,
                avgHR: avgHR,
                pace: pace,
                durationMins: w.duration / 60,
                effortClass: .easy
            ))
        }

        guard validPoints.count >= 5 else { hasNoData = true; return }

        // Estimate max HR from highest observed or 220 - age fallback (use 220-35 = 185)
        if maxHR < 150 { maxHR = 185 }
        maxHR = min(maxHR, 220)

        // Classify effort by HR fraction
        let classified = validPoints.map { p in
            WorkoutPoint(
                date: p.date, avgHR: p.avgHR, pace: p.pace, durationMins: p.durationMins,
                effortClass: WorkoutPoint.EffortClass.classify(hrFraction: p.avgHR / maxHR)
            )
        }
        points = classified

        // Estimate LT2: 85–90th percentile of all avgHR values (conservative)
        let sortedHR = classified.map(\.avgHR).sorted()
        let lt2Index = max(0, Int(Double(sortedHR.count) * 0.85) - 1)
        let lt2HR = sortedHR[lt2Index]
        let lt1HR = lt2HR - 20

        // Estimate paces at LT1 and LT2 using linear regression on HR-pace data
        // Simple approach: find runs with HR closest to LT1 and LT2
        let lt2Runs = classified.filter { abs($0.avgHR - lt2HR) < 10 }
        let lt1Runs = classified.filter { abs($0.avgHR - lt1HR) < 10 }

        let lt2Pace = lt2Runs.isEmpty ? 0 : lt2Runs.map(\.pace).reduce(0, +) / Double(lt2Runs.count)
        let lt1Pace = lt1Runs.isEmpty ? 0 : lt1Runs.map(\.pace).reduce(0, +) / Double(lt1Runs.count)

        let confidence: String
        if classified.count >= 20 { confidence = "High (\(classified.count) runs)" }
        else if classified.count >= 10 { confidence = "Moderate (\(classified.count) runs)" }
        else { confidence = "Low (\(classified.count) runs — run more for accuracy)" }

        estimate = ThresholdEstimate(
            lt1HR: lt1HR, lt2HR: lt2HR,
            lt1Pace: lt1Pace > 0 ? lt1Pace : lt2Pace * 1.12,
            lt2Pace: lt2Pace > 0 ? lt2Pace : 0,
            maxHR: maxHR,
            confidence: confidence
        )
    }
}

#Preview { NavigationStack { LactateThresholdView() } }
