import SwiftUI
import Charts
import HealthKit

// MARK: - PilatesBarreView

/// Analysis of mind-body workouts: Pilates, Barre, Flexibility & Core Training.
///
/// HKWorkoutActivityType mapping:
///   .pilates          — Mat and reformer Pilates
///   .barre            — Ballet-inspired barre classes
///   .flexibility      — Stretching, mobility, foam rolling
///   .coreTraining     — Plank circuits, ab workouts
///
/// Key insight: These modalities typically show lower HR (50–70% HRmax) but
/// significant caloric cost from sustained isometric holds and eccentric loading.
struct PilatesBarreView: View {

    struct Session: Identifiable {
        let id: UUID
        let date: Date
        let type: SessionType
        let minutes: Double
        let calories: Double
        let avgHR: Double?
    }

    struct MonthBucket: Identifiable {
        let id: Date
        let month: Date
        let pilatesCount: Int
        let barreCount: Int
        let flexCount: Int
        let coreCount: Int

        var total: Int { pilatesCount + barreCount + flexCount + coreCount }
    }

    enum SessionType: String, CaseIterable {
        case pilates = "Pilates"
        case barre = "Barre"
        case flexibility = "Flexibility"
        case core = "Core Training"

        var color: Color {
            switch self {
            case .pilates: return .purple
            case .barre: return Color(red: 0.85, green: 0.4, blue: 0.7)
            case .flexibility: return .teal
            case .core: return .indigo
            }
        }

        var icon: String {
            switch self {
            case .pilates: return "figure.pilates"
            case .barre: return "figure.barre"
            case .flexibility: return "figure.flexibility"
            case .core: return "figure.core.training"
            }
        }

        var hkType: HKWorkoutActivityType {
            switch self {
            case .pilates: return .pilates
            case .barre: return .barre
            case .flexibility: return .flexibility
            case .core: return .coreTraining
            }
        }
    }

    @State private var sessions: [Session] = []
    @State private var monthBuckets: [MonthBucket] = []
    @State private var totalSessions: Int = 0
    @State private var avgDuration: Double = 0
    @State private var avgCalories: Double = 0
    @State private var avgHR: Double = 0
    @State private var weeklyFreq: Double = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if sessions.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCard
                    typeBreakdownCard
                    monthlyChart
                    durationCard
                    mindBodyCard
                }
                .padding()
            }
        }
        .background(Color.premiumBackground)
        .navigationTitle("Pilates & Barre")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Mind-Body Training")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text("\(totalSessions)")
                            .font(.system(size: 56, weight: .bold, design: .rounded))
                            .foregroundStyle(.purple)
                        Text("sessions")
                            .font(.title2).foregroundStyle(.secondary).padding(.bottom, 10)
                    }
                    Text("Last 6 months")
                        .font(.subheadline).foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: "figure.pilates")
                    .font(.system(size: 44)).foregroundStyle(.purple)
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "Avg Duration", value: String(format: "%.0f min", avgDuration), color: .purple)
                Divider().frame(height: 36)
                statCell(label: "Avg Calories", value: String(format: "%.0f kcal", avgCalories), color: .orange)
                Divider().frame(height: 36)
                statCell(label: "Avg HR", value: avgHR > 0 ? String(format: "%.0f bpm", avgHR) : "—", color: .red)
                Divider().frame(height: 36)
                statCell(label: "Per Week", value: String(format: "%.1f×", weeklyFreq), color: .teal)
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func statCell(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.subheadline.bold().monospacedDigit()).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 8)
    }

    // MARK: - Type Breakdown Card

    private var typeBreakdownCard: some View {
        let counts = SessionType.allCases.map { type in
            (type, sessions.filter { $0.type == type }.count)
        }.filter { $0.1 > 0 }

        return VStack(alignment: .leading, spacing: 10) {
            Text("Session Type Breakdown").font(.headline)
            ForEach(counts, id: \.0) { type, count in
                HStack(spacing: 10) {
                    Image(systemName: type.icon)
                        .foregroundStyle(type.color)
                        .frame(width: 24)
                    Text(type.rawValue)
                        .font(.subheadline).foregroundStyle(.primary)
                    Spacer()
                    GeometryReader { geo in
                        RoundedRectangle(cornerRadius: 4)
                            .fill(type.color.opacity(0.7))
                            .frame(width: geo.size.width * CGFloat(count) / CGFloat(max(totalSessions, 1)),
                                   height: 8)
                            .frame(maxHeight: .infinity, alignment: .center)
                    }
                    .frame(height: 16)
                    Text("\(count)")
                        .font(.caption.monospacedDigit()).foregroundStyle(.secondary)
                        .frame(width: 28, alignment: .trailing)
                }
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Monthly Chart

    private var monthlyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Monthly Sessions").font(.headline)
            Chart {
                ForEach(monthBuckets) { b in
                    BarMark(x: .value("Month", b.month, unit: .month),
                            y: .value("Pilates", b.pilatesCount))
                    .foregroundStyle(SessionType.pilates.color.opacity(0.8))
                    .position(by: .value("Type", "Pilates"))

                    BarMark(x: .value("Month", b.month, unit: .month),
                            y: .value("Barre", b.barreCount))
                    .foregroundStyle(SessionType.barre.color.opacity(0.8))
                    .position(by: .value("Type", "Barre"))

                    BarMark(x: .value("Month", b.month, unit: .month),
                            y: .value("Flex", b.flexCount))
                    .foregroundStyle(SessionType.flexibility.color.opacity(0.8))
                    .position(by: .value("Type", "Flex"))

                    BarMark(x: .value("Month", b.month, unit: .month),
                            y: .value("Core", b.coreCount))
                    .foregroundStyle(SessionType.core.color.opacity(0.8))
                    .position(by: .value("Type", "Core"))
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxisLabel("Sessions")
            .frame(height: 160)

            // Legend
            HStack(spacing: 12) {
                ForEach(SessionType.allCases, id: \.self) { t in
                    HStack(spacing: 4) {
                        Circle().fill(t.color).frame(width: 7, height: 7)
                        Text(t.rawValue).font(.caption2).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Duration Distribution Card

    private var durationCard: some View {
        let buckets: [(label: String, count: Int, color: Color)] = [
            ("< 30 min", sessions.filter { $0.minutes < 30 }.count, .teal),
            ("30–45 min", sessions.filter { $0.minutes >= 30 && $0.minutes < 45 }.count, .green),
            ("45–60 min", sessions.filter { $0.minutes >= 45 && $0.minutes < 60 }.count, .yellow),
            ("> 60 min", sessions.filter { $0.minutes >= 60 }.count, .orange),
        ]

        return VStack(alignment: .leading, spacing: 10) {
            Text("Session Duration Mix").font(.headline)
            Chart {
                ForEach(buckets, id: \.label) { b in
                    BarMark(x: .value("Count", b.count),
                            y: .value("Duration", b.label))
                    .foregroundStyle(b.color.opacity(0.8))
                    .cornerRadius(4)
                    .annotation(position: .trailing) {
                        Text("\(b.count)").font(.caption2).foregroundStyle(.secondary)
                    }
                }
            }
            .chartXAxis(.hidden)
            .frame(height: 120)
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Mind-Body Benefits Card

    private var mindBodyCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "brain.head.profile").foregroundStyle(.purple)
                Text("Mind-Body Training Benefits").font(.headline)
            }
            VStack(spacing: 5) {
                benefitRow(icon: "figure.pilates", label: "Pilates", detail: "Core stability, spinal alignment & functional strength. Reformer adds resistance for progressive overload.", color: .purple)
                benefitRow(icon: "figure.barre", label: "Barre", detail: "Isometric holds target slow-twitch fibers for endurance. Ballet-inspired movement improves balance & posture.", color: Color(red: 0.85, green: 0.4, blue: 0.7))
                benefitRow(icon: "figure.flexibility", label: "Flexibility", detail: "Regular stretching reduces injury risk, improves joint ROM and parasympathetic activation. Target 2–3× per week.", color: .teal)
                benefitRow(icon: "figure.core.training", label: "Core Training", detail: "Deep stabilizer activation (TVA, multifidus) protects the spine and transfers power to sport performance.", color: .indigo)
            }
            Divider()
            Text("💡 Low-intensity mind-body sessions (45–60 min, 3×/week) have been shown to reduce cortisol, lower resting HR, and improve HRV over 8–12 weeks (Bird et al., 2015; Granath et al., 2006).")
                .font(.caption2).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.purple.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.purple.opacity(0.18), lineWidth: 1))
    }

    private func benefitRow(icon: String, label: String, detail: String, color: Color) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: icon).foregroundStyle(color).frame(width: 24)
            VStack(alignment: .leading, spacing: 1) {
                Text(label).font(.caption.bold()).foregroundStyle(color)
                Text(detail).font(.caption2).foregroundStyle(.secondary)
            }
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "figure.pilates")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Pilates or Barre Data")
                .font(.title3.bold())
            Text("Log Pilates, Barre, Flexibility, or Core Training workouts via the Workout app or a fitness app like Peloton to see your mind-body analytics here.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let types: [(SessionType, HKWorkoutActivityType)] = [
            (.pilates, .pilates), (.barre, .barre),
            (.flexibility, .flexibility), (.core, .coreTraining)
        ]

        let workoutType = HKObjectType.workoutType()
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType])) != nil else { return }

        let sixMonthsAgo = Calendar.current.date(byAdding: .month, value: -6, to: Date()) ?? Date()
        let cal = Calendar.current

        var allSessions: [Session] = []

        for (sType, hkType) in types {
            let pred = HKQuery.predicateForWorkouts(with: hkType)
            let datePred = HKQuery.predicateForSamples(withStart: sixMonthsAgo, end: Date())
            let compound = NSCompoundPredicate(andPredicateWithSubpredicates: [pred, datePred])

            let workouts: [HKWorkout] = await withCheckedContinuation { cont in
                let q = HKSampleQuery(sampleType: workoutType,
                    predicate: compound, limit: HKObjectQueryNoLimit,
                    sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]
                ) { _, s, _ in cont.resume(returning: (s as? [HKWorkout]) ?? []) }
                healthStore.execute(q)
            }

            for w in workouts {
                let mins = w.duration / 60
                let kcal = w.statistics(for: HKQuantityType(.activeEnergyBurned))?
                    .sumQuantity()?.doubleValue(for: .kilocalorie()) ?? 0
                let hrStat = w.statistics(for: HKQuantityType(.heartRate))
                let avgHR = hrStat?.averageQuantity()?.doubleValue(for: HKUnit.count().unitDivided(by: .minute())) ?? 0
                allSessions.append(Session(id: w.uuid, date: w.startDate, type: sType,
                                           minutes: mins, calories: kcal, avgHR: avgHR > 0 ? avgHR : nil))
            }
        }

        guard !allSessions.isEmpty else { return }

        allSessions.sort { $0.date < $1.date }
        sessions = allSessions
        totalSessions = allSessions.count

        let durations = allSessions.map(\.minutes)
        avgDuration = durations.reduce(0, +) / Double(durations.count)
        let cals = allSessions.map(\.calories).filter { $0 > 0 }
        avgCalories = cals.isEmpty ? 0 : cals.reduce(0, +) / Double(cals.count)
        let hrs = allSessions.compactMap(\.avgHR).filter { $0 > 0 }
        avgHR = hrs.isEmpty ? 0 : hrs.reduce(0, +) / Double(hrs.count)

        let weeks = max(1.0, Double(cal.dateComponents([.weekOfYear], from: sixMonthsAgo, to: Date()).weekOfYear ?? 26))
        weeklyFreq = Double(totalSessions) / weeks

        // Monthly buckets
        var mMap: [Date: (Int, Int, Int, Int)] = [:]
        for s in allSessions {
            let comps = cal.dateComponents([.year, .month], from: s.date)
            let monthStart = cal.date(from: comps) ?? s.date
            var cur = mMap[monthStart] ?? (0, 0, 0, 0)
            switch s.type {
            case .pilates:    cur.0 += 1
            case .barre:      cur.1 += 1
            case .flexibility: cur.2 += 1
            case .core:       cur.3 += 1
            }
            mMap[monthStart] = cur
        }
        monthBuckets = mMap.map { date, counts in
            MonthBucket(id: date, month: date,
                        pilatesCount: counts.0, barreCount: counts.1,
                        flexCount: counts.2, coreCount: counts.3)
        }.sorted { $0.month < $1.month }
    }
}

#Preview { NavigationStack { PilatesBarreView() } }
