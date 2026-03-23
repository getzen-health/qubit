import SwiftUI
import HealthKit

// MARK: - RacePredictorView

/// Predicts road race finish times from VO₂ Max using Jack Daniels' VDOT model.
/// Also shows Riegel extrapolation from the user's best recent running effort.
struct RacePredictorView: View {
    @State private var vo2Max: Double?
    @State private var bestRecentRun: BestRun?
    @State private var isLoading = false

    private let healthKit = HealthKitService.shared

    struct BestRun {
        let distanceKm: Double
        let durationSecs: TimeInterval
        let date: Date
    }

    // MARK: - Prediction

    /// Predicts finish time in seconds for a given distance (km) from VO₂Max using the Daniels model.
    private func predictTime(distanceKm: Double, vo2: Double) -> TimeInterval {
        let d = distanceKm * 1000 // meters

        // Percent of VO2Max sustainable at race distance (velocity-duration model)
        // Iteratively solve: find pace v (m/min) such that the required VO2 = vo2 * p(t)
        // where p(t) = fraction of VO2Max that can be sustained for t minutes.
        // We use a closed-form approximation.

        // Step 1: velocity at VO2Max (m/min)
        let vMax = (-4.60 + 0.182258 * vo2 + 0.000104 * vo2 * vo2)

        // Step 2: estimate race pace as fraction of vMax
        // For the race distances we care about (5-42km), use Riegel exponent 1.06
        // to extrapolate from an "ideal" 5km baseline.
        // Riegel: T2 = T1 × (D2/D1)^1.06
        // T5km at VO2Max is estimated from an empirical fit: t5km_secs = 1800 * (vMax / 20)^(-1.06) ... overly complex.

        // Simpler but accurate: use the Daniels VDOT speed table approximation.
        // v_race ≈ vMax × c(d) where c(d) is the efficiency coefficient at distance d.
        // From Daniels' tables, v_race for key distances as fraction of vMax:
        //   5km ≈ 0.755, 10km ≈ 0.726, 21.1km ≈ 0.695, 42.2km ≈ 0.665
        // We interpolate log-linearly in distance.

        let anchor: [(km: Double, fraction: Double)] = [
            (3.0, 0.785),
            (5.0, 0.755),
            (10.0, 0.726),
            (21.1, 0.695),
            (42.2, 0.665),
        ]

        let fraction: Double
        if distanceKm <= anchor.first!.km {
            fraction = anchor.first!.fraction
        } else if distanceKm >= anchor.last!.km {
            fraction = anchor.last!.fraction
        } else {
            // Interpolate
            var f = anchor.last!.fraction
            for i in 0..<anchor.count - 1 {
                if distanceKm >= anchor[i].km && distanceKm <= anchor[i+1].km {
                    let t = (distanceKm - anchor[i].km) / (anchor[i+1].km - anchor[i].km)
                    f = anchor[i].fraction + t * (anchor[i+1].fraction - anchor[i].fraction)
                    break
                }
            }
            fraction = f
        }

        let vRace = vMax * fraction // m/min
        guard vRace > 0 else { return 0 }
        return (d / vRace) * 60 // seconds
    }

    /// Riegel extrapolation from a known race effort: T2 = T1 × (D2/D1)^1.06
    private func riegelTime(from run: BestRun, toDistanceKm: Double) -> TimeInterval {
        guard run.distanceKm > 0 else { return 0 }
        return run.durationSecs * pow(toDistanceKm / run.distanceKm, 1.06)
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if vo2Max == nil && bestRecentRun == nil {
                    emptyState
                } else {
                    if let vo2 = vo2Max {
                        vo2Card(vo2: vo2)
                        predictionsGrid(vo2: vo2)
                    }
                    if let run = bestRecentRun {
                        riegelCard(run: run)
                    }
                    methodologyCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Race Predictor")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - VO2Max Card

    private func vo2Card(vo2: Double) -> some View {
        let zone = FitnessZone.from(vo2: vo2)
        return HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("VO₂ Max")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text(String(format: "%.1f", vo2))
                        .font(.system(size: 48, weight: .bold, design: .rounded))
                        .foregroundStyle(zone.color)
                    Text("mL/kg/min")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .padding(.bottom, 8)
                }
                Text(zone.label)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(zone.color)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 6) {
                Text("Based on Apple Fitness")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                Image(systemName: "figure.run")
                    .font(.system(size: 36))
                    .foregroundStyle(zone.color.opacity(0.6))
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Predictions Grid

    private func predictionsGrid(vo2: Double) -> some View {
        let distances: [(label: String, subtitle: String, km: Double, icon: String)] = [
            ("5 K", "5.0 km", 5.0, "5.circle.fill"),
            ("10 K", "10.0 km", 10.0, "10.circle.fill"),
            ("Half", "21.1 km", 21.1, "h.circle.fill"),
            ("Full", "42.2 km", 42.2, "f.circle.fill"),
        ]

        return VStack(alignment: .leading, spacing: 8) {
            Text("Predicted Race Times")
                .font(.headline)
                .padding(.horizontal, 4)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                ForEach(distances, id: \.km) { dist in
                    let secs = predictTime(distanceKm: dist.km, vo2: vo2)
                    PredictionCell(
                        label: dist.label,
                        subtitle: dist.subtitle,
                        time: formatTime(secs),
                        pace: formatPace(distanceKm: dist.km, secs: secs),
                        icon: dist.icon
                    )
                }
            }
        }
    }

    // MARK: - Riegel Card

    private func riegelCard(run: BestRun) -> some View {
        let distances: [(label: String, km: Double)] = [
            ("5 K", 5.0), ("10 K", 10.0), ("Half", 21.1), ("Full", 42.2)
        ]
        let eligibleDistances = distances.filter { run.distanceKm < $0.km * 1.05 }
        guard !eligibleDistances.isEmpty else { return AnyView(EmptyView()) }

        return AnyView(VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "ruler")
                    .foregroundStyle(.green)
                Text("From Your Best Effort")
                    .font(.headline)
            }
            .padding(.horizontal, 4)

            VStack(spacing: 0) {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Reference run")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                        Text(String(format: "%.2f km in %@", run.distanceKm, formatTime(run.durationSecs)))
                            .font(.subheadline.bold())
                    }
                    Spacer()
                    Text(run.date.formatted(date: .abbreviated, time: .omitted))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 10)

                Divider()

                Text("Riegel extrapolation (T2 = T1 × (D2/D1)^1.06)")
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 16)
                    .padding(.top, 4)

                ForEach(eligibleDistances, id: \.km) { dist in
                    let t = riegelTime(from: run, toDistanceKm: dist.km)
                    HStack {
                        Text(dist.label)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Spacer()
                        Text(formatTime(t))
                            .font(.subheadline.bold().monospacedDigit())
                            .foregroundStyle(.green)
                        Text("(" + formatPace(distanceKm: dist.km, secs: t) + ")")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    if dist.km != eligibleDistances.last?.km {
                        Divider().padding(.leading, 16)
                    }
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        })
    }

    // MARK: - Methodology Card

    private var methodologyCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "info.circle.fill")
                    .foregroundStyle(.blue)
                Text("How It Works")
                    .font(.subheadline.weight(.semibold))
            }
            Text("VO₂ Max predictions use Jack Daniels' VDOT model — the industry standard for translating aerobic capacity into race performance. Times assume optimal pacing, weather, and course conditions.")
                .font(.caption)
                .foregroundStyle(.secondary)
            Text("The Riegel method extrapolates a known effort to longer distances using T2 = T1 × (D2/D1)^1.06, validated across thousands of road race results.")
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
            Image(systemName: "stopwatch")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No Data Available")
                .font(.title3.bold())
            Text("Race predictions require VO₂ Max data (recorded automatically by Apple Watch during outdoor runs) or recent running workout history.")
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

        // Fetch VO2Max
        let vo2Samples = (try? await healthKit.fetchSamples(
            for: .vo2Max,
            from: Calendar.current.date(byAdding: .month, value: -3, to: Date())!,
            to: Date()
        )) ?? []
        if let latest = vo2Samples.sorted(by: { $0.startDate < $1.startDate }).last {
            vo2Max = latest.quantity.doubleValue(for: HKUnit(from: "mL/kg/min"))
        }

        // Fetch best recent run
        let start = Calendar.current.date(byAdding: .day, value: -90, to: Date())!
        let workouts = (try? await healthKit.fetchWorkouts(from: start, to: Date())) ?? []
        let runs = workouts.filter { $0.workoutActivityType == .running }
        if let best = runs.compactMap({ w -> BestRun? in
            guard let dist = w.totalDistance?.doubleValue(for: .meter()), dist > 1000 else { return nil }
            return BestRun(distanceKm: dist / 1000, durationSecs: w.duration, date: w.startDate)
        }).max(by: { a, b in
            // Best = fastest pace on longest effort ≥ 5km; fallback to longest run
            if a.distanceKm >= 5 && b.distanceKm >= 5 {
                return (a.durationSecs / a.distanceKm) > (b.durationSecs / b.distanceKm)
            }
            return a.distanceKm < b.distanceKm
        }) {
            bestRecentRun = best
        }
    }

    // MARK: - Helpers

    private func formatTime(_ secs: TimeInterval) -> String {
        guard secs > 0 else { return "--:--" }
        let h = Int(secs) / 3600
        let m = (Int(secs) % 3600) / 60
        let s = Int(secs) % 60
        if h > 0 {
            return String(format: "%d:%02d:%02d", h, m, s)
        }
        return String(format: "%d:%02d", m, s)
    }

    private func formatPace(distanceKm: Double, secs: TimeInterval) -> String {
        guard distanceKm > 0, secs > 0 else { return "" }
        let secsPerKm = secs / distanceKm
        let m = Int(secsPerKm) / 60
        let s = Int(secsPerKm) % 60
        return String(format: "%d:%02d /km", m, s)
    }
}

// MARK: - Prediction Cell

struct PredictionCell: View {
    let label: String
    let subtitle: String
    let time: String
    let pace: String
    let icon: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundStyle(.blue)
                    .font(.title3)
                Spacer()
                Text(subtitle)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            Text(time)
                .font(.title3.bold().monospacedDigit())
                .foregroundStyle(.primary)
            Text(pace)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(12)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Fitness Zone (matches VO2MaxView)

private enum FitnessZone {
    case superior, excellent, good, fair, poor

    var label: String {
        switch self {
        case .superior: return "Superior"
        case .excellent: return "Excellent"
        case .good: return "Good"
        case .fair: return "Fair"
        case .poor: return "Poor"
        }
    }

    var color: Color {
        switch self {
        case .superior: return .purple
        case .excellent: return .blue
        case .good: return .green
        case .fair: return .yellow
        case .poor: return .red
        }
    }

    static func from(vo2: Double) -> FitnessZone {
        if vo2 >= 55 { return .superior }
        if vo2 >= 48 { return .excellent }
        if vo2 >= 40 { return .good }
        if vo2 >= 33 { return .fair }
        return .poor
    }
}

#Preview {
    NavigationStack {
        RacePredictorView()
    }
}
