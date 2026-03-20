import SwiftUI
import HealthKit
import Charts

// MARK: - CircadianPerformanceView
// Identifies optimal training time by analysing HR efficiency (kcal·min⁻¹ / avgHR) grouped
// by five time-of-day windows across all HealthKit workout sessions.
// Higher efficiency = more caloric output per heartbeat = better aerobic performance window.
// Science: Chtourou & Souissi 2012 (J Strength Cond Res): Afternoon peak in muscular performance.
// Youngstedt & O'Connor 1999 (Br J Sports Med): Time-of-day effects on exercise performance.
// Kolbe et al. 2019 (Current Biol): Circadian phase regulates muscle adaptation magnitude.
// Distinct from TrainingPatternView (when you train) — this analyses performance quality, not frequency.

struct CircadianPerformanceView: View {

    // MARK: - Models

    struct TimeWindow: Identifiable {
        let id = UUID()
        let name: String
        let hourRange: String
        let icon: String
        let color: Color
        let sessions: Int
        let avgEfficiency: Double      // normalized 0–100
        let avgHR: Double
        let avgKcalPerMin: Double
        let isOptimal: Bool
    }

    struct WorkoutPoint: Identifiable {
        let id = UUID()
        let date: Date
        let hour: Int
        let efficiency: Double
        let sport: String
        let windowIndex: Int
    }

    private static let windowDefs: [(name: String, start: Int, end: Int, icon: String, color: Color)] = [
        ("Early Morning", 4,  8,  "sunrise.fill",      .yellow),
        ("Morning",       8,  12, "sun.max.fill",       .orange),
        ("Afternoon",     12, 16, "sun.haze.fill",      .red),
        ("Late Afternoon",16, 20, "sunset.fill",        .purple),
        ("Evening",       20, 24, "moon.stars.fill",    .blue),
    ]

    // MARK: - State

    @State private var windows: [TimeWindow] = []
    @State private var points: [WorkoutPoint] = []
    @State private var optimalWindow: TimeWindow?
    @State private var totalWorkouts: Int = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Analysing circadian performance…")
                        .padding(.top, 60)
                } else if windows.isEmpty || windows.allSatisfy({ $0.sessions == 0 }) {
                    ContentUnavailableView("Insufficient Data",
                        systemImage: "clock.circle",
                        description: Text("Need workouts at varied times of day with heart rate data to identify your optimal window."))
                } else {
                    if let opt = optimalWindow { optimalBanner(opt) }
                    radarCard
                    windowsListCard
                    scatterCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Circadian Performance")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
    }

    // MARK: - Cards

    private func optimalBanner(_ w: TimeWindow) -> some View {
        HStack(spacing: 14) {
            Image(systemName: w.icon)
                .font(.system(size: 32))
                .foregroundStyle(w.color)
            VStack(alignment: .leading, spacing: 4) {
                Text("Peak Performance Window")
                    .font(.caption).foregroundStyle(.secondary)
                Text(w.name)
                    .font(.title2.weight(.bold))
                    .foregroundStyle(w.color)
                Text("\(w.hourRange) · \(w.sessions) sessions analysed")
                    .font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                Text(String(format: "%.0f", w.avgEfficiency))
                    .font(.title.weight(.black))
                    .foregroundStyle(w.color)
                Text("Efficiency")
                    .font(.caption2).foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(w.color.opacity(0.12))
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(w.color.opacity(0.3), lineWidth: 1))
        )
        .padding(.horizontal)
    }

    private var radarCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Performance by Time of Day", systemImage: "chart.bar.fill")
                .font(.subheadline).bold()
            Text("Normalized efficiency score (kcal·min⁻¹ / avg HR × 100). Higher = more aerobic output per heartbeat.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(windows.filter { $0.sessions > 0 }) { w in
                BarMark(
                    x: .value("Window", w.name),
                    y: .value("Efficiency", w.avgEfficiency)
                )
                .foregroundStyle(w.isOptimal ? w.color.gradient : w.color.opacity(0.5).gradient)
                .cornerRadius(6)
                .annotation(position: .top) {
                    if w.isOptimal {
                        Image(systemName: "crown.fill")
                            .font(.caption2)
                            .foregroundStyle(w.color)
                    }
                }
            }
            .chartYScale(domain: 0...100)
            .chartXAxis {
                AxisMarks { val in
                    AxisValueLabel(centered: true)
                }
            }
            .frame(height: 160)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var windowsListCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Window Breakdown", systemImage: "list.bullet.clipboard")
                .font(.subheadline).bold()

            ForEach(windows) { w in
                HStack(spacing: 10) {
                    Image(systemName: w.icon)
                        .foregroundStyle(w.color)
                        .frame(width: 20)
                    VStack(alignment: .leading, spacing: 1) {
                        HStack {
                            Text(w.name).font(.caption.weight(.semibold))
                            if w.isOptimal {
                                Text("BEST")
                                    .font(.system(size: 9, weight: .bold))
                                    .padding(.horizontal, 5).padding(.vertical, 2)
                                    .background(w.color.opacity(0.2))
                                    .foregroundStyle(w.color)
                                    .clipShape(Capsule())
                            }
                        }
                        Text(w.hourRange).font(.caption2).foregroundStyle(.tertiary)
                    }
                    Spacer()
                    if w.sessions > 0 {
                        VStack(alignment: .trailing, spacing: 1) {
                            Text(String(format: "%.1f", w.avgKcalPerMin) + " kcal/min")
                                .font(.caption2).foregroundStyle(.secondary)
                            Text(String(format: "%.0f bpm avg HR", w.avgHR))
                                .font(.caption2).foregroundStyle(.tertiary)
                        }
                        Text("\(w.sessions) sessions")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                            .frame(width: 62, alignment: .trailing)
                    } else {
                        Text("No data").font(.caption2).foregroundStyle(.tertiary)
                    }
                }
                .padding(.vertical, 4)
                if w.id != windows.last?.id { Divider() }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var scatterCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Efficiency Over Time", systemImage: "chart.line.uptrend.xyaxis")
                .font(.subheadline).bold()
            Text("Each point = one workout session, coloured by time of day. Upward trend = improving fitness.")
                .font(.caption2).foregroundStyle(.secondary)

            let windowColors = Dictionary(uniqueKeysWithValues: CircadianPerformanceView.windowDefs.enumerated().map { ($0.offset, $0.element.color) })

            Chart(points.suffix(100)) { p in
                PointMark(
                    x: .value("Date", p.date),
                    y: .value("Efficiency", p.efficiency)
                )
                .foregroundStyle(windowColors[p.windowIndex] ?? .gray)
                .symbolSize(40)
            }
            .frame(height: 130)
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }

            // Legend
            HStack(spacing: 10) {
                ForEach(CircadianPerformanceView.windowDefs.indices, id: \.self) { i in
                    let def = CircadianPerformanceView.windowDefs[i]
                    HStack(spacing: 3) {
                        Circle().fill(def.color).frame(width: 7, height: 7)
                        Text(def.name.components(separatedBy: " ").first ?? "")
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Circadian Biology & Performance", systemImage: "sun.and.horizon.circle.fill")
                .font(.subheadline).bold()
            Text("Core body temperature peaks in late afternoon (4–7 pm), elevating muscle enzyme activity, reaction time, and cardiovascular efficiency. Chtourou & Souissi 2012 (J Strength Cond Res, 53 studies) found consistent afternoon peaks in strength, endurance, and repeated sprint performance.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Kolbe et al. 2019 (Current Biology): Muscle molecular clocks regulate adaptation magnitude — training at your circadian peak amplifies gains. However, habitual morning exercisers may adapt their clock, making consistency more important than timing for most people.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Efficiency score = (kcal/min) ÷ (avg HR) × 1000, normalized 0–100 within your personal range.")
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
        let start = calendar.date(byAdding: .year, value: -2, to: end)!
        let pred = HKQuery.predicateForSamples(withStart: start, end: end)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)

        var rawWorkouts: [HKWorkout] = []
        await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                                  limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, samples, _ in
                rawWorkouts = (samples as? [HKWorkout]) ?? []
                cont.resume()
            }
            healthStore.execute(q)
        }

        processWorkouts(rawWorkouts)
        isLoading = false
    }

    private func processWorkouts(_ workouts: [HKWorkout]) {
        // Only use workouts with both HR and calorie data
        let valid = workouts.filter { w in
            let hr = w.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) ?? 0
            let kcal = w.statistics(for: HKQuantityType(.activeEnergyBurned))?.sumQuantity()?.doubleValue(for: .kilocalorie()) ?? 0
            let dur = w.duration
            return hr > 40 && kcal > 0 && dur > 300
        }

        totalWorkouts = valid.count

        // Compute raw efficiency for each workout
        struct WorkoutEff { let date: Date; let hour: Int; let eff: Double; let hr: Double; let kcalPerMin: Double; let windowIdx: Int }
        var effItems: [WorkoutEff] = []

        for w in valid {
            let hr = w.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) ?? 0
            let kcal = w.statistics(for: HKQuantityType(.activeEnergyBurned))?.sumQuantity()?.doubleValue(for: .kilocalorie()) ?? 0
            let mins = w.duration / 60
            let kcalPerMin = kcal / max(1, mins)
            let rawEff = kcalPerMin / hr * 1000

            let hour = calendar.component(.hour, from: w.startDate)
            let wIdx = CircadianPerformanceView.windowDefs.firstIndex { d in hour >= d.start && hour < d.end } ?? -1
            if wIdx >= 0 {
                effItems.append(WorkoutEff(date: w.startDate, hour: hour, eff: rawEff,
                                           hr: hr, kcalPerMin: kcalPerMin, windowIdx: wIdx))
            }
        }

        guard !effItems.isEmpty else { return }

        // Normalize efficiency 0–100
        let effValues = effItems.map(\.eff)
        let minEff = effValues.min()!
        let maxEff = effValues.max()!
        let range = max(0.001, maxEff - minEff)
        let normalized: [WorkoutEff] = effItems.map { item in
            WorkoutEff(date: item.date, hour: item.hour,
                       eff: (item.eff - minEff) / range * 100,
                       hr: item.hr, kcalPerMin: item.kcalPerMin, windowIdx: item.windowIdx)
        }

        // Group by window
        var byWindow: [[WorkoutEff]] = Array(repeating: [], count: CircadianPerformanceView.windowDefs.count)
        for item in normalized { byWindow[item.windowIdx].append(item) }

        let avgEffByWindow = byWindow.map { items -> Double in
            items.isEmpty ? 0 : items.map(\.eff).reduce(0, +) / Double(items.count)
        }
        let bestIdx = avgEffByWindow.enumerated().max(by: { $0.element < $1.element })?.offset ?? 0

        let windows: [TimeWindow] = CircadianPerformanceView.windowDefs.enumerated().map { i, def in
            let items = byWindow[i]
            let avgHR = items.isEmpty ? 0 : items.map(\.hr).reduce(0, +) / Double(items.count)
            let avgKcal = items.isEmpty ? 0 : items.map(\.kcalPerMin).reduce(0, +) / Double(items.count)
            let hourEnd = def.end == 24 ? 0 : def.end
            let hourStr = "\(def.start < 12 ? "\(def.start) AM" : def.start == 12 ? "12 PM" : "\(def.start - 12) PM")–\(hourEnd < 12 ? "\(hourEnd) AM" : hourEnd == 12 ? "12 PM" : hourEnd == 0 ? "12 AM" : "\(hourEnd - 12) PM")"
            return TimeWindow(name: def.name, hourRange: hourStr, icon: def.icon,
                              color: def.color, sessions: items.count,
                              avgEfficiency: avgEffByWindow[i], avgHR: avgHR,
                              avgKcalPerMin: avgKcal, isOptimal: i == bestIdx && !items.isEmpty)
        }

        let points = normalized.map { item in
            WorkoutPoint(date: item.date, hour: item.hour, efficiency: item.eff,
                         sport: "", windowIndex: item.windowIdx)
        }

        DispatchQueue.main.async {
            self.windows = windows
            self.points = points
            self.optimalWindow = windows.first { $0.isOptimal }
        }
    }
}
