import SwiftUI
import Charts
import HealthKit

// MARK: - TrainingPolarizationView

/// Shows the intensity distribution of all training sessions across three zones:
/// Easy (Zone 1-2), Moderate (Zone 3), and Hard (Zone 4-5). Based on Stephen
/// Seiler's polarized training model, elite endurance athletes train ~80% easy
/// and ~20% hard with minimal time in the "moderate" gray zone.
///
/// Uses avg HR fraction of estimated max HR to classify each session:
/// - Easy: avgHR < 80% HRmax (Zone 1-2)
/// - Moderate: 80-87% HRmax (Zone 3 — the "garbage zone")
/// - Hard: > 87% HRmax (Zone 4-5 — quality threshold work)
struct TrainingPolarizationView: View {

    // MARK: - Models

    struct ZoneSplit {
        var easy: Int = 0       // session count
        var moderate: Int = 0
        var hard: Int = 0
        var easyMins: Double = 0
        var moderateMins: Double = 0
        var hardMins: Double = 0

        var total: Int { easy + moderate + hard }
        var totalMins: Double { easyMins + moderateMins + hardMins }

        var easyPct: Double { total > 0 ? Double(easy) / Double(total) * 100 : 0 }
        var moderatePct: Double { total > 0 ? Double(moderate) / Double(total) * 100 : 0 }
        var hardPct: Double { total > 0 ? Double(hard) / Double(total) * 100 : 0 }

        var easyMinsPct: Double { totalMins > 0 ? easyMins / totalMins * 100 : 0 }
        var hardMinsPct: Double { totalMins > 0 ? hardMins / totalMins * 100 : 0 }

        var isWellPolarized: Bool { easyPct >= 70 && hardPct >= 15 }
        var polarizationScore: Double { easyPct >= 70 ? min(100, hardPct / 25 * 100) : max(0, easyPct - 30) * 0.8 }
    }

    struct WeekPoint: Identifiable {
        let id: String
        let weekStart: Date
        let easyPct: Double
        let hardPct: Double
        let moderatePct: Double
    }

    struct SportSplit: Identifiable {
        let id: String
        let sport: String
        let easyPct: Double
        let hardPct: Double
        let total: Int
    }

    // MARK: - State

    @State private var overall: ZoneSplit = ZoneSplit()
    @State private var weekPoints: [WeekPoint] = []
    @State private var sportSplits: [SportSplit] = []
    @State private var maxHR: Double = 185  // estimated
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
                    overallCard
                    weeklyTrendChart
                    sportBreakdownCard
                    scienceCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Training Polarization")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Overall Card

    private var overallCard: some View {
        VStack(spacing: 14) {
            HStack {
                VStack(alignment: .leading, spacing: 6) {
                    Text("90-Day Intensity Split")
                        .font(.caption).foregroundStyle(.secondary)
                    Text("\(overall.total) sessions analyzed")
                        .font(.title3.bold())
                    HStack(spacing: 6) {
                        Circle().fill(overall.isWellPolarized ? Color.green : .orange)
                            .frame(width: 8, height: 8)
                        Text(overall.isWellPolarized ? "Well-Polarized Training" : "Needs More Polarization")
                            .font(.subheadline.bold())
                            .foregroundStyle(overall.isWellPolarized ? .green : .orange)
                    }
                }
                Spacer()
                Image(systemName: "chart.bar.fill")
                    .font(.system(size: 44)).foregroundStyle(.teal)
            }

            Divider()

            // Zone bar visualization
            VStack(alignment: .leading, spacing: 8) {
                Text("Distribution by Sessions").font(.caption).foregroundStyle(.secondary)

                GeometryReader { geo in
                    HStack(spacing: 2) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.green.opacity(0.75))
                            .frame(width: max(4, geo.size.width * overall.easyPct / 100))
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.yellow.opacity(0.75))
                            .frame(width: max(4, geo.size.width * overall.moderatePct / 100))
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.red.opacity(0.75))
                    }
                }
                .frame(height: 20)

                HStack {
                    zoneLabel(color: .green, label: "Easy", pct: overall.easyPct, count: overall.easy)
                    Spacer()
                    zoneLabel(color: .yellow, label: "Moderate", pct: overall.moderatePct, count: overall.moderate)
                    Spacer()
                    zoneLabel(color: .red, label: "Hard", pct: overall.hardPct, count: overall.hard)
                }
            }

            Divider()

            HStack(spacing: 0) {
                statCell(label: "Easy Sessions", value: String(format: "%.0f%%", overall.easyPct), color: .green)
                Divider().frame(height: 36)
                statCell(label: "Hard Sessions", value: String(format: "%.0f%%", overall.hardPct), color: .red)
                Divider().frame(height: 36)
                statCell(label: "Polarization", value: String(format: "%.0f/100", overall.polarizationScore), color: overall.polarizationScore >= 70 ? .green : .orange)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func zoneLabel(color: Color, label: String, pct: Double, count: Int) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(spacing: 4) {
                Circle().fill(color).frame(width: 7, height: 7)
                Text(label).font(.caption2).foregroundStyle(.secondary)
            }
            Text(String(format: "%.0f%% (%d)", pct, count)).font(.caption.bold()).foregroundStyle(color)
        }
    }

    private func statCell(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.subheadline.bold().monospacedDigit()).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 8)
    }

    // MARK: - Weekly Trend Chart

    private var weeklyTrendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Easy% Trend")
                .font(.headline)
            Text("Target: ≥ 70% easy sessions")
                .font(.caption).foregroundStyle(.secondary)

            Chart {
                ForEach(weekPoints) { p in
                    LineMark(x: .value("Week", p.weekStart),
                             y: .value("Easy%", p.easyPct))
                    .foregroundStyle(Color.green.opacity(0.7))
                    .interpolationMethod(.catmullRom)
                }
                ForEach(weekPoints) { p in
                    PointMark(x: .value("Week", p.weekStart),
                              y: .value("Easy%", p.easyPct))
                    .foregroundStyle(p.easyPct >= 70 ? Color.green : Color.orange)
                    .symbolSize(25)
                }
                RuleMark(y: .value("Target", 70))
                    .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5, 3]))
                    .foregroundStyle(Color.green.opacity(0.5))
                    .annotation(position: .topTrailing) {
                        Text("80/20 target").font(.caption2).foregroundStyle(.green)
                    }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("%")
            .chartYScale(domain: 0...100)
            .frame(height: 160)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Sport Breakdown Card

    private var sportBreakdownCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Polarization by Sport")
                .font(.headline)
            Text("Sports sorted by training volume")
                .font(.caption).foregroundStyle(.secondary)

            ForEach(sportSplits.prefix(6)) { split in
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(split.sport).font(.subheadline)
                        Spacer()
                        Text(String(format: "%.0f%% easy", split.easyPct)).font(.caption.bold()).foregroundStyle(.green)
                        Text("·").foregroundStyle(.secondary)
                        Text(String(format: "%.0f%% hard", split.hardPct)).font(.caption.bold()).foregroundStyle(.red)
                    }
                    GeometryReader { geo in
                        HStack(spacing: 2) {
                            RoundedRectangle(cornerRadius: 3)
                                .fill(Color.green.opacity(0.7))
                                .frame(width: max(2, geo.size.width * split.easyPct / 100))
                            RoundedRectangle(cornerRadius: 3)
                                .fill(Color.yellow.opacity(0.7))
                                .frame(width: max(2, geo.size.width * (100 - split.easyPct - split.hardPct) / 100))
                            RoundedRectangle(cornerRadius: 3)
                                .fill(Color.red.opacity(0.7))
                        }
                    }
                    .frame(height: 8)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Polarized Training Science", systemImage: "chart.bar.fill")
                .font(.headline).foregroundStyle(.teal)

            Text("Stephen Seiler's research on elite endurance athletes shows they consistently train ~80% at low intensity (Zone 1-2) and ~20% at high intensity (Zone 4-5), with very little time in the 'moderate' zone (Zone 3).")
                .font(.caption).foregroundStyle(.secondary)

            Text("The 'Gray Zone' (Zone 3 / threshold) is counterproductive: it's too hard to allow full recovery but not hard enough to produce maximum training adaptation. Paradoxically, avoiding it leads to better performance gains.")
                .font(.caption).foregroundStyle(.secondary)

            Text("Classification uses avg HR for each session. Easy < 80% HRmax, Moderate 80–87%, Hard > 87%. Your estimated max HR is \(Int(maxHR)) bpm.")
                .font(.caption).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.teal.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - No Data State

    private var noDataState: some View {
        VStack(spacing: 16) {
            Image(systemName: "chart.bar.fill")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("Not Enough Data")
                .font(.title3.bold())
            Text("Polarization analysis requires at least 10 workouts with heart rate data recorded on Apple Watch.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let workoutType = HKObjectType.workoutType()
        let hrType = HKQuantityType(.heartRate)

        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType, hrType])) != nil else {
            hasNoData = true; return
        }

        let ninetyDaysAgo = Calendar.current.date(byAdding: .day, value: -90, to: Date()) ?? Date()
        let hrUnit = HKUnit.count().unitDivided(by: .minute())

        // Get all workouts with HR data
        let pred = HKQuery.predicateForSamples(withStart: ninetyDaysAgo, end: Date())
        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKWorkout]) ?? []) }
            healthStore.execute(q)
        }

        let validWorkouts = workouts.filter { w in
            w.statistics(for: hrType)?.averageQuantity()?.doubleValue(for: hrUnit) != nil
        }

        guard validWorkouts.count >= 10 else { hasNoData = true; return }

        // Estimate max HR from peak observed HR, or use 220-35 estimate
        let peakHR = validWorkouts.compactMap { w in
            w.statistics(for: hrType)?.maximumQuantity()?.doubleValue(for: hrUnit)
        }.max() ?? 0
        maxHR = peakHR > 150 ? min(peakHR * 1.05, 220) : 185

        // Classify each workout
        var split = ZoneSplit()
        var sportMap: [String: (Int, Int, Int)] = [:]  // sport: (easy, mod, hard)
        var weekMap: [String: (Date, Int, Int, Int)] = [:]  // week: (weekStart, easy, mod, hard)

        var cal = Calendar.current; cal.firstWeekday = 2
        let df = DateFormatter(); df.dateFormat = "yyyy-Www"

        for w in validWorkouts {
            let avgHR = w.statistics(for: hrType)?.averageQuantity()?.doubleValue(for: hrUnit) ?? 0
            let fraction = avgHR / maxHR
            let durationMins = w.duration / 60

            let zone: Int
            if fraction < 0.80 { zone = 0 }       // easy
            else if fraction < 0.87 { zone = 1 }   // moderate
            else { zone = 2 }                       // hard

            switch zone {
            case 0: split.easy += 1; split.easyMins += durationMins
            case 1: split.moderate += 1; split.moderateMins += durationMins
            default: split.hard += 1; split.hardMins += durationMins
            }

            // Sport mapping
            let sportName = sportDisplayName(w.workoutActivityType)
            var sc = sportMap[sportName] ?? (0, 0, 0)
            switch zone {
            case 0: sc.0 += 1
            case 1: sc.1 += 1
            default: sc.2 += 1
            }
            sportMap[sportName] = sc

            // Week mapping
            let comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: w.startDate)
            let wkey = "\(comps.yearForWeekOfYear ?? 0)-\(comps.weekOfYear ?? 0)"
            let ws = cal.date(from: comps) ?? w.startDate
            var wc = weekMap[wkey] ?? (ws, 0, 0, 0)
            switch zone {
            case 0: wc.1 += 1
            case 1: wc.2 += 1
            default: wc.3 += 1
            }
            weekMap[wkey] = wc
        }

        overall = split

        weekPoints = weekMap.map { key, val in
            let total = val.1 + val.2 + val.3
            return WeekPoint(
                id: key, weekStart: val.0,
                easyPct: total > 0 ? Double(val.1) / Double(total) * 100 : 0,
                hardPct: total > 0 ? Double(val.3) / Double(total) * 100 : 0,
                moderatePct: total > 0 ? Double(val.2) / Double(total) * 100 : 0
            )
        }.sorted { $0.weekStart < $1.weekStart }

        sportSplits = sportMap.map { sport, sc in
            let total = sc.0 + sc.1 + sc.2
            return SportSplit(
                id: sport, sport: sport,
                easyPct: total > 0 ? Double(sc.0) / Double(total) * 100 : 0,
                hardPct: total > 0 ? Double(sc.2) / Double(total) * 100 : 0,
                total: total
            )
        }.sorted { $0.total > $1.total }
    }

    private func sportDisplayName(_ type: HKWorkoutActivityType) -> String {
        switch type {
        case .running:             return "Running"
        case .cycling:             return "Cycling"
        case .swimming:            return "Swimming"
        case .hiking:              return "Hiking"
        case .walking:             return "Walking"
        case .traditionalStrengthTraining: return "Strength"
        case .functionalStrengthTraining:  return "Functional"
        case .highIntensityIntervalTraining: return "HIIT"
        case .yoga:                return "Yoga"
        case .crossTraining:       return "Cross-Training"
        case .rowing:              return "Rowing"
        case .elliptical:          return "Elliptical"
        case .stairClimbing:       return "Stair Climbing"
        case .tennis:              return "Tennis"
        case .soccer:              return "Soccer"
        case .basketball:          return "Basketball"
        case .kickboxing:          return "Kickboxing"
        default:                   return "Other"
        }
    }
}

#Preview { NavigationStack { TrainingPolarizationView() } }
