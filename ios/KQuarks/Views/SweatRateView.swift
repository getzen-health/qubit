import SwiftUI
import HealthKit
import Charts

// MARK: - SweatRateView
// Estimates sweat rate from body mass measurements taken before and after workouts.
// Science: Sawka et al. 2007 (ACSM position stand, Med Sci Sports Exerc):
//   Sweat rate = (pre-exercise mass − post-exercise mass) / exercise duration
//   Dehydration >2% body mass impairs aerobic performance (Cheuvront & Kenefick 2014).
//   Casa et al. 2000 (J Athl Train): Replace fluid to prevent >2% body mass loss during exercise.
// Average sweat rate: 0.5–2.0 L/hr (varies by intensity, temperature, individual).
// 1 kg body mass loss ≈ 1 litre of fluid (since 1 L water = 1 kg).

struct SweatRateView: View {

    // MARK: - Models

    struct SweatSession: Identifiable {
        let id = UUID()
        let date: Date
        let sport: String
        let durationHours: Double
        let preMassKg: Double
        let postMassKg: Double
        var fluidLossL: Double { preMassKg - postMassKg }          // litres
        var sweatRateLPerH: Double { fluidLossL / durationHours }  // L/hr
        var bodyMassLossPct: Double { fluidLossL / preMassKg * 100 }
        var dehydrationRisk: DehydrationRisk {
            switch bodyMassLossPct {
            case ..<1:   return .none
            case 1..<2:  return .mild
            case 2..<3:  return .moderate
            default:     return .severe
            }
        }
    }

    enum DehydrationRisk: String {
        case none     = "Optimal"
        case mild     = "Mild"
        case moderate = "Caution"
        case severe   = "Significant"
        var color: Color {
            switch self {
            case .none:     return .green
            case .mild:     return .blue
            case .moderate: return .orange
            case .severe:   return .red
            }
        }
    }

    // MARK: - State

    @State private var sessions: [SweatSession] = []
    @State private var avgSweatRate: Double?
    @State private var peakSweatRate: Double?
    @State private var avgMassLossPct: Double?
    @State private var currentBodyMassKg: Double?
    @State private var hasInsufficientData = false
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current
    private let massWindow = 90.0 * 60  // 90-minute window each side of workout

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Analysing sweat rate…")
                        .padding(.top, 60)
                } else if sessions.isEmpty {
                    noDataView
                } else {
                    summaryCard
                    sweatRateChart
                    sessionListCard
                    hydrationTargetCard
                    scienceCard
                }
                if !isLoading && sessions.isEmpty {
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Sweat Rate Estimator")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - No Data View

    private var noDataView: some View {
        VStack(spacing: 16) {
            ContentUnavailableView("No Weigh-in Data Near Workouts",
                systemImage: "scalemass.fill",
                description: Text("To estimate sweat rate, weigh yourself within 90 min before AND after a workout in Apple Health."))
            VStack(alignment: .leading, spacing: 6) {
                Text("How it works")
                    .font(.headline)
                Text("1. Weigh yourself just before your workout")
                    .font(.caption)
                Text("2. Record the same weight type in Health after your workout")
                    .font(.caption)
                Text("3. Fluid loss = pre-weight − post-weight (1 kg ≈ 1 litre)")
                    .font(.caption)
                Text("4. Sweat rate = fluid loss ÷ workout duration (L/hr)")
                    .font(.caption)
            }
            .foregroundStyle(.secondary)
            .padding()
            .background(Color(.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .padding(.horizontal)

            if let mass = currentBodyMassKg {
                hydrationTargetCard(bodyMass: mass)
            }
        }
    }

    // MARK: - Summary

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack(spacing: 0) {
                statBox(
                    value: avgSweatRate.map { String(format: "%.2f L/hr", $0) } ?? "—",
                    label: "Avg Sweat Rate",
                    sub: "litres per hour",
                    color: .blue
                )
                Divider().frame(height: 44)
                statBox(
                    value: peakSweatRate.map { String(format: "%.2f L/hr", $0) } ?? "—",
                    label: "Peak Rate",
                    sub: "most intense session",
                    color: .orange
                )
                Divider().frame(height: 44)
                statBox(
                    value: avgMassLossPct.map { String(format: "%.1f%%", $0) } ?? "—",
                    label: "Avg Mass Loss",
                    sub: "target: < 2%",
                    color: avgMassLossPct.map { $0 < 2 ? .green : .orange } ?? .secondary
                )
            }
            .padding(.vertical, 12)

            if let pct = avgMassLossPct {
                HStack {
                    Image(systemName: pct < 2 ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                        .foregroundStyle(pct < 2 ? .green : .orange)
                    Text(pct < 2
                         ? "Good hydration — body mass loss under the 2% performance threshold"
                         : "Average loss exceeds 2% — increase fluid intake during workouts")
                        .font(.caption)
                        .foregroundStyle(pct < 2 ? .green : .orange)
                }
                .padding(.horizontal)
                .padding(.bottom, 8)
            }
        }
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func statBox(value: String, label: String, sub: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.title3.weight(.bold)).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
            Text(sub).font(.caption2).foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Sweat Rate Chart

    private var sweatRateChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Sweat Rate by Session", systemImage: "drop.fill")
                .font(.subheadline).bold()
            Text("Fluid loss rate (L/hr) per measured workout. Target: replace 80% of fluid loss during exercise.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(sessions.suffix(12)) { s in
                BarMark(
                    x: .value("Date", s.date, unit: .day),
                    y: .value("L/hr", s.sweatRateLPerH)
                )
                .foregroundStyle(s.sweatRateLPerH > 1.5 ? Color.orange.gradient : Color.blue.gradient)
                .cornerRadius(3)
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 7)) { _ in
                    AxisValueLabel(format: .dateTime.month().day())
                }
            }
            .frame(height: 120)

            HStack {
                RoundedRectangle(cornerRadius: 2).fill(Color.orange).frame(width: 12, height: 8)
                Text("> 1.5 L/hr (high sweater)").font(.caption2).foregroundStyle(.secondary)
                Spacer()
                RoundedRectangle(cornerRadius: 2).fill(Color.blue).frame(width: 12, height: 8)
                Text("< 1.5 L/hr (typical)").font(.caption2).foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Session List

    private var sessionListCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Measured Sessions", systemImage: "list.bullet")
                .font(.subheadline).bold()

            ForEach(sessions.suffix(6).reversed()) { s in
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 6) {
                            Text(s.sport).font(.caption.bold())
                            Text(s.dehydrationRisk.rawValue)
                                .font(.caption2)
                                .padding(.horizontal, 5).padding(.vertical, 1)
                                .background(s.dehydrationRisk.color.opacity(0.18))
                                .foregroundStyle(s.dehydrationRisk.color)
                                .clipShape(Capsule())
                        }
                        Text(s.date, format: .dateTime.month(.abbreviated).day())
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(String(format: "%.2f L/hr", s.sweatRateLPerH))
                            .font(.caption.bold()).foregroundStyle(.blue)
                        Text(String(format: "−%.2f kg (%.1f%%)", s.fluidLossL, s.bodyMassLossPct))
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                }
                if s.id != sessions.suffix(6).reversed().last?.id {
                    Divider()
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Hydration Target Card

    private var hydrationTargetCard: some View {
        guard let mass = currentBodyMassKg, let rate = avgSweatRate else {
            return AnyView(EmptyView())
        }
        return AnyView(hydrationTargetCard(bodyMass: mass, sweatRate: rate))
    }

    private func hydrationTargetCard(bodyMass: Double, sweatRate: Double? = nil) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Personalised Hydration Targets", systemImage: "drop.triangle.fill")
                .font(.subheadline).bold()

            if let rate = sweatRate {
                Group {
                    targetRow(label: "30-min workout",  value: String(format: "%.0f ml / %.0f ml replacement", rate * 0.5 * 1000, rate * 0.5 * 800))
                    targetRow(label: "60-min workout",  value: String(format: "%.0f ml / %.0f ml replacement", rate * 1.0 * 1000, rate * 1.0 * 800))
                    targetRow(label: "90-min workout",  value: String(format: "%.0f ml / %.0f ml replacement", rate * 1.5 * 1000, rate * 1.5 * 800))
                    targetRow(label: "2-hour workout",  value: String(format: "%.0f ml / %.0f ml replacement", rate * 2.0 * 1000, rate * 2.0 * 800))
                }
                Text("Replace ~80% of sweat loss during exercise (Burke & Hawley 2006). Drink remaining after.")
                    .font(.caption2).foregroundStyle(.tertiary)
            } else {
                let baseRate = 1.0 // generic L/hr estimate
                Group {
                    targetRow(label: "General 1-hr target",  value: String(format: "~%.0f–%.0f ml", bodyMass * 10, bodyMass * 15))
                    targetRow(label: "Hot/humid bonus",       value: "+200–400 ml extra")
                    targetRow(label: "Post-workout (24h)",    value: String(format: "%.0f ml per kg lost", 1500))
                }
                Text("Without personal sweat rate data, use 10–15 ml/kg body mass per hour of moderate exercise as a starting point.")
                    .font(.caption2).foregroundStyle(.tertiary)
                let _ = baseRate // suppress unused warning
            }
        }
        .padding()
        .background(Color.blue.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func targetRow(label: String, value: String) -> some View {
        HStack {
            Text(label).font(.caption).foregroundStyle(.secondary).frame(width: 120, alignment: .leading)
            Text(value).font(.caption.bold())
        }
    }

    // MARK: - Science

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Hydration Science", systemImage: "drop.halffull")
                .font(.subheadline).bold()
            Text("Sawka et al. 2007 (ACSM position stand, Med Sci Sports Exerc): Sweat rate = (pre-exercise mass − post-exercise mass + fluid intake) / exercise duration. Average: 0.5–2.0 L/hr, varying by intensity, heat, and individual.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Cheuvront & Kenefick 2014 (Compr Physiol): Dehydration >2% body mass impairs aerobic performance by 3–7% in temperate conditions and more in heat. Casa et al. 2000 (J Athl Train): Hyponatraemia risk if overdrinking — match intake to sweat rate, not a fixed schedule.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Method: Weigh yourself within 90 min before and after a workout (same clothes, after urinating). Each 1 kg difference ≈ 1 litre of fluid deficit.")
                .font(.caption).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.blue.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Data Loading

    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let massType = HKQuantityType(.bodyMass)
        let workoutType = HKObjectType.workoutType()
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [massType, workoutType])) != nil else {
            isLoading = false; return
        }

        let end = Date()
        let start = calendar.date(byAdding: .day, value: -180, to: end)!

        // Fetch all body mass samples
        var massSamples: [HKQuantitySample] = []
        await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: start, end: end)
            let q = HKSampleQuery(sampleType: massType, predicate: pred, limit: HKObjectQueryNoLimit,
                                   sortDescriptors: nil) { _, samples, _ in
                massSamples = (samples as? [HKQuantitySample]) ?? []
                cont.resume()
            }
            healthStore.execute(q)
        }

        // Fetch workouts
        var rawWorkouts: [HKWorkout] = []
        await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: start, end: end)
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred, limit: HKObjectQueryNoLimit,
                                   sortDescriptors: nil) { _, samples, _ in
                rawWorkouts = (samples as? [HKWorkout]) ?? []
                cont.resume()
            }
            healthStore.execute(q)
        }

        // Most recent body mass
        let latestMass = massSamples.sorted { $0.startDate > $1.startDate }.first?
            .quantity.doubleValue(for: .gramUnit(with: .kilo))

        processData(workouts: rawWorkouts, massSamples: massSamples)

        DispatchQueue.main.async {
            self.currentBodyMassKg = latestMass
            self.isLoading = false
        }
    }

    private func processData(workouts: [HKWorkout], massSamples: [HKQuantitySample]) {
        var results: [SweatSession] = []

        for w in workouts {
            let durationHours = w.duration / 3600
            guard durationHours >= 0.25 else { continue }  // min 15 minutes

            let preWindowStart = w.startDate.addingTimeInterval(-massWindow)
            let preWindowEnd   = w.startDate

            let postWindowStart = w.endDate
            let postWindowEnd   = w.endDate.addingTimeInterval(massWindow)

            let preSamples = massSamples.filter {
                $0.startDate >= preWindowStart && $0.startDate <= preWindowEnd
            }.sorted { $0.startDate > $1.startDate }

            let postSamples = massSamples.filter {
                $0.startDate >= postWindowStart && $0.startDate <= postWindowEnd
            }.sorted { $0.startDate < $1.startDate }

            guard let pre = preSamples.first, let post = postSamples.first else { continue }

            let preKg  = pre.quantity.doubleValue(for: .gramUnit(with: .kilo))
            let postKg = post.quantity.doubleValue(for: .gramUnit(with: .kilo))
            let fluidLoss = preKg - postKg
            guard fluidLoss > 0 else { continue }  // ignore weight gain sessions

            results.append(SweatSession(
                date: w.startDate,
                sport: w.workoutActivityType.sweatName,
                durationHours: durationHours,
                preMassKg: preKg,
                postMassKg: postKg
            ))
        }

        results.sort { $0.date < $1.date }

        let rates = results.map(\.sweatRateLPerH)
        let pcts  = results.map(\.bodyMassLossPct)

        DispatchQueue.main.async {
            self.sessions = results
            self.avgSweatRate    = rates.isEmpty ? nil : rates.reduce(0, +) / Double(rates.count)
            self.peakSweatRate   = rates.max()
            self.avgMassLossPct  = pcts.isEmpty  ? nil : pcts.reduce(0, +)  / Double(pcts.count)
            self.isLoading = false
        }
    }
}

private extension HKWorkoutActivityType {
    var sweatName: String {
        switch self {
        case .running:         return "Running"
        case .cycling:         return "Cycling"
        case .swimming:        return "Swimming"
        case .walking:         return "Walking"
        case .hiking:          return "Hiking"
        case .rowing:          return "Rowing"
        case .highIntensityIntervalTraining: return "HIIT"
        case .functionalStrengthTraining, .traditionalStrengthTraining: return "Strength"
        case .crossTraining:   return "Cross Training"
        default:               return "Workout"
        }
    }
}
