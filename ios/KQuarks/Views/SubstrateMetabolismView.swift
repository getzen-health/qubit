import SwiftUI
import HealthKit
import Charts

// MARK: - SubstrateMetabolismView
// Estimates fuel substrate use (fat vs carbohydrate oxidation) at different exercise intensities.
// Science: Brooks & Mercier 1994 (J Appl Physiol): The "crossover concept" — the exercise
//   intensity at which CHO and fat contribute equally shifts with fitness.
//   Achten & Jeukendrup 2004 (Sports Med): Peak fat oxidation occurs at ~40–65% VO₂max.
//   Romijn et al. 1993 (Am J Physiol): Fat contribution: 70% at light, 45% at moderate,
//   15% at vigorous, ~0% at maximal intensity.
// Respiratory Exchange Ratio (RER): O2 to CO2 ratios identify substrate use.
//   RER ~0.70 = fat oxidation; ~1.0 = pure carbohydrate; >1.0 = supramaximal effort.
// Implication: Zone 2 training ("fat burning zone") maximises mitochondrial biogenesis
//   (Holloszy 1975) and metabolic flexibility (Volek 2016).

struct SubstrateMetabolismView: View {

    // MARK: - Models

    struct WorkoutSubstrate: Identifiable {
        let id = UUID()
        let date: Date
        let sport: String
        let durationMins: Double
        let totalKcal: Double
        let kcalPerMin: Double
        var intensityLabel: String {
            switch kcalPerMin {
            case ..<5:  return "Light"
            case 5..<10: return "Moderate"
            case 10..<15: return "Vigorous"
            default:     return "Maximal"
            }
        }
        var fatFraction: Double {
            switch kcalPerMin {
            case ..<5:  return 0.70
            case 5..<10: return 0.45
            case 10..<15: return 0.15
            default:     return 0.02
            }
        }
        var rer: Double {
            switch kcalPerMin {
            case ..<5:  return 0.72
            case 5..<10: return 0.85
            case 10..<15: return 0.95
            default:     return 1.05
            }
        }
        var fatKcal: Double { totalKcal * fatFraction }
        var carbKcal: Double { totalKcal * (1 - fatFraction) }
        var fatG: Double { fatKcal / 9.0 }      // 9 kcal/g fat
        var carbG: Double { carbKcal / 4.0 }    // 4 kcal/g carb
        var intensityColor: Color {
            switch kcalPerMin {
            case ..<5:  return .blue
            case 5..<10: return .green
            case 10..<15: return .orange
            default:     return .red
            }
        }
    }

    struct IntensityZone: Identifiable {
        let id = UUID()
        let label: String
        let rer: String
        let fatPct: Int
        let carbPct: Int
        let color: Color
        let example: String
    }

    // MARK: - State

    @State private var workouts: [WorkoutSubstrate] = []
    @State private var totalFatG: Double?
    @State private var totalCarbG: Double?
    @State private var fatPctOverall: Double?
    @State private var avgRER: Double?
    @State private var zone2Pct: Double?    // % of workouts that are Zone 2 (fat-burning)
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Computing substrate metabolism…")
                        .padding(.top, 60)
                } else if workouts.isEmpty {
                    ContentUnavailableView("No Workout Data",
                        systemImage: "chart.pie.fill",
                        description: Text("Log workouts in Apple Health to estimate fuel substrate use."))
                } else {
                    summaryCard
                    substrateChart
                    intensityZonesCard
                    recentWorkoutsCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Substrate Metabolism")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Summary

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack(spacing: 0) {
                statBox(
                    value: totalFatG.map { String(format: "%.0fg", $0) } ?? "—",
                    label: "Fat Burned",
                    sub: "30-day total",
                    color: .orange
                )
                Divider().frame(height: 44)
                statBox(
                    value: fatPctOverall.map { String(format: "%.0f%%", $0) } ?? "—",
                    label: "Fat %",
                    sub: "of energy mix",
                    color: fatPctOverall.map { $0 > 50 ? .green : $0 > 30 ? .orange : .red } ?? .secondary
                )
                Divider().frame(height: 44)
                statBox(
                    value: avgRER.map { String(format: "%.2f", $0) } ?? "—",
                    label: "Avg RER",
                    sub: "0.7=fat, 1.0=carb",
                    color: avgRER.map { $0 < 0.85 ? .green : $0 < 0.95 ? .orange : .red } ?? .secondary
                )
            }
            .padding(.vertical, 12)

            if let zone2 = zone2Pct {
                HStack {
                    Image(systemName: zone2 > 60 ? "checkmark.circle.fill" : "info.circle.fill")
                        .foregroundStyle(zone2 > 60 ? .green : .orange)
                    Text(zone2 > 60
                         ? String(format: "%.0f%% of sessions in fat-burning zone — great metabolic base", zone2)
                         : String(format: "%.0f%% of sessions in fat-burning zone — consider more Zone 2 for metabolic flexibility", zone2))
                        .font(.caption)
                        .foregroundStyle(zone2 > 60 ? .green : .orange)
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

    // MARK: - Substrate Bar Chart

    private var substrateChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Fat vs Carbohydrate — Recent 12 Sessions", systemImage: "chart.bar.fill")
                .font(.subheadline).bold()
            Text("Estimated fuel mix per workout. Low intensity = more fat; high intensity = more carbohydrate.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(workouts.suffix(12)) { w in
                BarMark(
                    x: .value("Date", w.date, unit: .day),
                    y: .value("Fat kcal", w.fatKcal),
                    stacking: .normalized
                )
                .foregroundStyle(Color.orange.opacity(0.8))
                BarMark(
                    x: .value("Date", w.date, unit: .day),
                    y: .value("Carb kcal", w.carbKcal),
                    stacking: .normalized
                )
                .foregroundStyle(Color.blue.opacity(0.8))
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 3)) { _ in
                    AxisValueLabel(format: .dateTime.month().day())
                }
            }
            .frame(height: 120)

            HStack(spacing: 16) {
                legendRect(color: .orange, label: "Fat")
                legendRect(color: .blue, label: "Carbohydrate")
            }
            .font(.caption2)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func legendRect(color: Color, label: String) -> some View {
        HStack(spacing: 6) {
            RoundedRectangle(cornerRadius: 2).fill(color).frame(width: 14, height: 8)
            Text(label).foregroundStyle(.secondary)
        }
    }

    // MARK: - Intensity Zones Card

    private var intensityZonesCard: some View {
        let zones = [
            IntensityZone(label: "Light (<5 kcal/min)",    rer: "~0.72", fatPct: 70, carbPct: 30, color: .blue,   example: "Easy walk, gentle yoga, Z1 cycling"),
            IntensityZone(label: "Moderate (5–10)",        rer: "~0.85", fatPct: 45, carbPct: 55, color: .green,  example: "Zone 2 run, brisk walk, tempo ride"),
            IntensityZone(label: "Vigorous (10–15)",       rer: "~0.95", fatPct: 15, carbPct: 85, color: .orange, example: "Threshold run, hard cycling, HIIT"),
            IntensityZone(label: "Maximal (>15)",          rer: "≥1.0",  fatPct:  2, carbPct: 98, color: .red,    example: "Sprints, max effort intervals"),
        ]
        return VStack(alignment: .leading, spacing: 8) {
            Label("Intensity → Fuel Substrate", systemImage: "flame.fill")
                .font(.subheadline).bold()

            ForEach(zones) { z in
                VStack(spacing: 4) {
                    HStack {
                        Circle().fill(z.color).frame(width: 8, height: 8)
                        Text(z.label).font(.caption.bold()).foregroundStyle(z.color)
                        Spacer()
                        Text("RER \(z.rer)").font(.caption2.monospaced()).foregroundStyle(.secondary)
                    }
                    GeometryReader { geo in
                        HStack(spacing: 0) {
                            Rectangle()
                                .fill(Color.orange.opacity(0.7))
                                .frame(width: geo.size.width * Double(z.fatPct) / 100)
                            Rectangle()
                                .fill(Color.blue.opacity(0.7))
                        }
                    }
                    .frame(height: 8)
                    .clipShape(RoundedRectangle(cornerRadius: 4))
                    HStack {
                        Text("🔥 \(z.fatPct)% fat · 🍬 \(z.carbPct)% carb")
                            .font(.caption2).foregroundStyle(.secondary)
                        Spacer()
                        Text(z.example).font(.caption2).foregroundStyle(.tertiary)
                    }
                }
                if z.id != zones.last?.id { Divider() }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Recent Workouts

    private var recentWorkoutsCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Recent Sessions", systemImage: "list.bullet")
                .font(.subheadline).bold()

            ForEach(workouts.prefix(6)) { w in
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 6) {
                            Text(w.sport).font(.caption.bold())
                            Text(w.intensityLabel)
                                .font(.caption2)
                                .padding(.horizontal, 5).padding(.vertical, 1)
                                .background(w.intensityColor.opacity(0.15))
                                .foregroundStyle(w.intensityColor)
                                .clipShape(Capsule())
                        }
                        Text(w.date, format: .dateTime.month(.abbreviated).day())
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        HStack(spacing: 4) {
                            Text(String(format: "%.0fg fat", w.fatG))
                                .font(.caption.bold()).foregroundStyle(.orange)
                            Text("+").font(.caption2).foregroundStyle(.secondary)
                            Text(String(format: "%.0fg carb", w.carbG))
                                .font(.caption.bold()).foregroundStyle(.blue)
                        }
                        Text(String(format: "RER %.2f · %.0f kcal", w.rer, w.totalKcal))
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                }
                if w.id != workouts.prefix(6).last?.id { Divider() }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Science

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Substrate Metabolism Science", systemImage: "flask.fill")
                .font(.subheadline).bold()
            Text("Brooks & Mercier 1994 (J Appl Physiol): The 'crossover concept' — as exercise intensity increases, fuel use shifts from fat to carbohydrate. Peak fat oxidation occurs at ~40–65% VO₂max (Zone 2); at maximal effort, carbohydrates dominate entirely.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Achten & Jeukendrup 2004 (Sports Med): Peak fat oxidation rates in trained athletes are 0.5–1.0 g/min. Zone 2 training increases mitochondrial density and fat oxidation capacity (Holloszy 1975, J Biol Chem).")
                .font(.caption).foregroundStyle(.secondary)
            Text("Respiratory Exchange Ratio (RER): The ratio VCO₂/VO₂ is measured in lab calorimetry. RER 0.70 = pure fat; 1.0 = pure carbohydrate; >1.0 = supramaximal with lactate buffering. This view uses intensity (kcal/min) as a proxy for RER estimation.")
                .font(.caption).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.orange.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Data Loading

    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let workoutType = HKObjectType.workoutType()
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType])) != nil else {
            isLoading = false; return
        }

        let end = Date()
        let start = Calendar.current.date(byAdding: .day, value: -30, to: end) ?? Date()

        var rawWorkouts: [HKWorkout] = []
        await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: start, end: end)
            let sort = [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                                   limit: HKObjectQueryNoLimit, sortDescriptors: sort) { _, s, _ in
                rawWorkouts = (s as? [HKWorkout]) ?? []
                cont.resume()
            }
            healthStore.execute(q)
        }

        processWorkouts(rawWorkouts)
        isLoading = false
    }

    private func processWorkouts(_ rawWorkouts: [HKWorkout]) {
        var results: [WorkoutSubstrate] = []
        for w in rawWorkouts {
            let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            guard kcal > 10 else { continue }
            let mins = w.duration / 60
            guard mins > 5 else { continue }
            results.append(WorkoutSubstrate(
                date: w.startDate,
                sport: w.workoutActivityType.subName,
                durationMins: mins,
                totalKcal: kcal,
                kcalPerMin: kcal / mins
            ))
        }

        let totalFat  = results.map(\.fatG).reduce(0, +)
        let totalCarb = results.map(\.carbG).reduce(0, +)
        let totalFatKcal  = results.map(\.fatKcal).reduce(0, +)
        let totalCarbKcal = results.map(\.carbKcal).reduce(0, +)
        let fatPct = (totalFatKcal + totalCarbKcal) > 0 ? totalFatKcal / (totalFatKcal + totalCarbKcal) * 100 : nil
        let avgRER = results.isEmpty ? nil : results.map(\.rer).reduce(0, +) / Double(results.count)
        let zone2Count = results.filter { $0.kcalPerMin < 10 }.count
        let zone2Pct = results.isEmpty ? nil : Double(zone2Count) / Double(results.count) * 100

        DispatchQueue.main.async {
            self.workouts = results
            self.totalFatG = totalFat > 0 ? totalFat : nil
            self.totalCarbG = totalCarb > 0 ? totalCarb : nil
            self.fatPctOverall = fatPct
            self.avgRER = avgRER
            self.zone2Pct = zone2Pct
            self.isLoading = false
        }
    }
}

private extension HKWorkoutActivityType {
    var subName: String {
        switch self {
        case .running:        return "Running"
        case .cycling:        return "Cycling"
        case .swimming:       return "Swimming"
        case .walking:        return "Walking"
        case .hiking:         return "Hiking"
        case .rowing:         return "Rowing"
        case .yoga:           return "Yoga"
        case .functionalStrengthTraining, .traditionalStrengthTraining: return "Strength"
        case .highIntensityIntervalTraining: return "HIIT"
        case .crossTraining:  return "Cross Training"
        default:              return "Workout"
        }
    }
}
