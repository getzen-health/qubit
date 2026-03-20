import SwiftUI
import HealthKit

// MARK: - PAIScoreView

/// Personal Activity Intelligence (PAI) — a clinically validated weekly fitness score
/// developed by NTNU (Norway). Score is earned by spending time in elevated heart rate zones.
/// Target: ≥100 PAI/week is associated with 46% lower all-cause mortality risk.
struct PAIScoreView: View {

    // MARK: - Models

    struct DailyPAI: Identifiable {
        let id = UUID()
        let date: Date
        let points: Double
        let sessionCount: Int
    }

    struct ZoneMinutes: Identifiable {
        let id = UUID()
        let zoneName: String
        let minutes: Double
        let paiPerMin: Double
        let color: Color
        var paiEarned: Double { minutes * paiPerMin }
    }

    enum PAICategory {
        case inactive      // <25
        case low           // 25–49
        case moderate      // 50–99
        case active        // 100–149
        case highlyActive  // 150+

        init(score: Double) {
            switch score {
            case ..<25:   self = .inactive
            case 25..<50: self = .low
            case 50..<100: self = .moderate
            case 100..<150: self = .active
            default:       self = .highlyActive
            }
        }

        var label: String {
            switch self {
            case .inactive:     return "Inactive"
            case .low:          return "Low Activity"
            case .moderate:     return "Moderately Active"
            case .active:       return "Active (target!)"
            case .highlyActive: return "Highly Active"
            }
        }

        var color: Color {
            switch self {
            case .inactive:     return .gray
            case .low:          return .red
            case .moderate:     return .orange
            case .active:       return .green
            case .highlyActive: return .purple
            }
        }

        var icon: String {
            switch self {
            case .inactive:     return "bed.double.fill"
            case .low:          return "figure.walk"
            case .moderate:     return "figure.walk.circle.fill"
            case .active:       return "checkmark.circle.fill"
            case .highlyActive: return "star.circle.fill"
            }
        }

        var interpretation: String {
            switch self {
            case .inactive:     return "No meaningful cardiovascular stress detected. Even 20 min brisk walks earn PAI."
            case .low:          return "Some activity but below the health threshold. Aim for 100+ PAI."
            case .moderate:     return "Good start — you're building the habit. Push to 100+ for full longevity benefits."
            case .active:       return "You've hit the magic threshold. NTNU research shows 46% lower all-cause mortality risk."
            case .highlyActive: return "Excellent — you're exceeding the minimum. Elite cardiovascular health territory."
            }
        }
    }

    // PAI points per minute by zone (NTNU-inspired approximation)
    // Higher zones earn exponentially more — 1 min Z5 ≈ 20 min Z1
    private let zoneRates: [(name: String, hrmaxLow: Double, hrmaxHigh: Double, paiPerMin: Double, color: Color)] = [
        ("Z1 Recovery",   0.50, 0.60, 0.5,  .blue),
        ("Z2 Aerobic",    0.60, 0.70, 1.0,  .green),
        ("Z3 Tempo",      0.70, 0.80, 2.5,  .yellow),
        ("Z4 Threshold",  0.80, 0.90, 6.0,  .orange),
        ("Z5 VO₂ Max",    0.90, 1.00, 14.0, .red),
    ]

    // MARK: - State

    @State private var weeklyPAI: Double = 0
    @State private var daily: [DailyPAI] = []
    @State private var zoneMinutes: [ZoneMinutes] = []
    @State private var historicalWeeks: [(weekStart: Date, score: Double)] = []
    @State private var isLoading = true
    @State private var errorMessage: String?

    private let hkStore = HKHealthStore()
    private let age: Double = 35

    private var hrmax: Double { 208 - 0.7 * age }

    // MARK: - Computed

    private var category: PAICategory { PAICategory(score: weeklyPAI) }
    private var progressToTarget: Double { min(weeklyPAI / 100.0, 1.5) }
    private var paiNeeded: Double { max(100 - weeklyPAI, 0) }

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if isLoading {
                    ProgressView("Computing PAI score…")
                        .frame(maxWidth: .infinity)
                        .padding(.top, 60)
                } else if let err = errorMessage {
                    ContentUnavailableView(err, systemImage: "waveform.path.ecg")
                } else {
                    weeklyScoreCard
                    progressGaugeCard
                    dailyBarChart
                    zoneBreakdownCard
                    historicalTrendCard
                    scienceCard
                }
            }
            .padding()
        }
        .navigationTitle("PAI Score")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Weekly Score Card

    private var weeklyScoreCard: some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 8) {
                Text("7-Day PAI Score")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                HStack(alignment: .lastTextBaseline, spacing: 4) {
                    Text(String(format: "%.0f", weeklyPAI))
                        .font(.system(size: 56, weight: .bold, design: .rounded))
                        .foregroundStyle(category.color)
                    Text("PAI")
                        .font(.title3)
                        .foregroundStyle(.secondary)
                        .offset(y: -8)
                }

                HStack(spacing: 6) {
                    Image(systemName: category.icon)
                    Text(category.label)
                }
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(category.color)

                if paiNeeded > 0 {
                    Text("\(Int(paiNeeded)) more PAI to reach 100")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                } else {
                    Text("Target achieved this week!")
                        .font(.caption)
                        .foregroundStyle(.green)
                }
            }

            Spacer()

            // Circular indicator
            ZStack {
                Circle()
                    .stroke(Color(.systemFill), lineWidth: 10)
                Circle()
                    .trim(from: 0, to: min(CGFloat(progressToTarget / 1.5), 1.0))
                    .stroke(category.color, style: StrokeStyle(lineWidth: 10, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                    .animation(.easeOut(duration: 1), value: weeklyPAI)
                Text("100\ntarget")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
            .frame(width: 80, height: 80)
        }
        .padding()
        .background(category.color.opacity(0.1))
        .cornerRadius(16)
    }

    // MARK: - Progress Gauge

    private var progressGaugeCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(category.interpretation)
                .font(.subheadline)
                .foregroundStyle(.secondary)

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    // Background gradient bar
                    LinearGradient(
                        colors: [.gray, .red, .orange, .green, .purple],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                    .frame(height: 10)
                    .cornerRadius(5)
                    .opacity(0.3)

                    // Fill bar
                    Rectangle()
                        .fill(category.color)
                        .frame(width: geo.size.width * CGFloat(min(weeklyPAI / 150.0, 1.0)), height: 10)
                        .cornerRadius(5)

                    // Target marker at 100/150
                    let targetX = geo.size.width * CGFloat(100.0 / 150.0)
                    Rectangle()
                        .fill(Color.green)
                        .frame(width: 2, height: 18)
                        .offset(x: targetX - 1, y: -4)
                }
            }
            .frame(height: 18)

            HStack {
                Text("0")
                Spacer()
                Text("100 ✓")
                    .foregroundStyle(.green.opacity(0.8))
                Spacer()
                Text("150+ PAI")
            }
            .font(.caption2)
            .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
    }

    // MARK: - Daily Bar Chart

    private var dailyBarChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Daily PAI (last 7 days)")
                .font(.headline)

            let maxPAI = max(daily.map(\.points).max() ?? 20, 20)

            GeometryReader { geo in
                HStack(alignment: .bottom, spacing: 4) {
                    ForEach(Array(daily.enumerated()), id: \.1.id) { _, day in
                        VStack(spacing: 4) {
                            Text(String(format: "%.0f", day.points))
                                .font(.system(size: 9))
                                .foregroundStyle(.secondary)
                            let h = geo.size.height * CGFloat(day.points / maxPAI)
                            RoundedRectangle(cornerRadius: 4)
                                .fill(day.points >= 14 ? Color.green : day.points >= 7 ? Color.orange : Color.gray.opacity(0.5))
                                .frame(height: max(h, 4))
                            Text(day.date, format: .dateTime.weekday(.abbreviated))
                                .font(.system(size: 9))
                                .foregroundStyle(.secondary)
                        }
                        .frame(maxWidth: .infinity)
                    }
                }
            }
            .frame(height: 120)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
    }

    // MARK: - Zone Breakdown Card

    private var zoneBreakdownCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Zone Breakdown (7 days)")
                .font(.headline)

            ForEach(zoneMinutes.filter { $0.minutes > 0 }) { zm in
                HStack(spacing: 10) {
                    RoundedRectangle(cornerRadius: 3).fill(zm.color)
                        .frame(width: 4, height: 34)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(zm.zoneName).font(.subheadline.weight(.medium))
                        Text("\(Int(zm.minutes)) minutes").font(.caption).foregroundStyle(.secondary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(String(format: "+%.0f PAI", zm.paiEarned))
                            .font(.subheadline.bold())
                            .foregroundStyle(zm.color)
                        Text("\(String(format: "%.1f", zm.paiPerMin)) PAI/min")
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                }
            }

            if zoneMinutes.allSatisfy({ $0.minutes == 0 }) {
                Text("No workout HR data this week. Record workouts with heart rate for zone analysis.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
    }

    // MARK: - Historical Trend Card

    private var historicalTrendCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("12-Week PAI Trend")
                .font(.headline)

            let maxScore = max(historicalWeeks.map(\.score).max() ?? 50, 100)

            GeometryReader { geo in
                ZStack(alignment: .bottomLeading) {
                    // 100 PAI target line
                    let targetY = geo.size.height * (1 - CGFloat(100.0 / maxScore))
                    Path { p in
                        p.move(to: CGPoint(x: 0, y: targetY))
                        p.addLine(to: CGPoint(x: geo.size.width, y: targetY))
                    }
                    .stroke(Color.green.opacity(0.5), style: StrokeStyle(lineWidth: 1.5, dash: [6, 4]))

                    // Score area
                    if !historicalWeeks.isEmpty {
                        let xStep = geo.size.width / CGFloat(max(historicalWeeks.count - 1, 1))
                        let yFor: (Double) -> CGFloat = { val in
                            geo.size.height * (1 - CGFloat(val / maxScore))
                        }

                        Path { p in
                            let first = historicalWeeks[0].score
                            p.move(to: CGPoint(x: 0, y: geo.size.height))
                            p.addLine(to: CGPoint(x: 0, y: yFor(first)))
                            for (i, wk) in historicalWeeks.enumerated().dropFirst() {
                                p.addLine(to: CGPoint(x: CGFloat(i) * xStep, y: yFor(wk.score)))
                            }
                            p.addLine(to: CGPoint(x: geo.size.width, y: geo.size.height))
                            p.closeSubpath()
                        }
                        .fill(Color.green.opacity(0.15))

                        Path { p in
                            let first = historicalWeeks[0].score
                            p.move(to: CGPoint(x: 0, y: yFor(first)))
                            for (i, wk) in historicalWeeks.enumerated().dropFirst() {
                                p.addLine(to: CGPoint(x: CGFloat(i) * xStep, y: yFor(wk.score)))
                            }
                        }
                        .stroke(Color.green, lineWidth: 2)
                    }
                }
            }
            .frame(height: 120)

            HStack {
                Text("12 weeks ago")
                Spacer()
                Text("— 100 PAI target", comment: "green dashed")
                    .foregroundStyle(.green.opacity(0.8))
                Spacer()
                Text("This week")
            }
            .font(.caption2)
            .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("About PAI", systemImage: "info.circle.fill")
                .font(.headline)
                .foregroundStyle(.green)

            Text("Personal Activity Intelligence (PAI) was developed by researchers at the Norwegian University of Science and Technology (NTNU). It converts time in elevated heart rate zones into a single weekly score.")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("The landmark HUNT study (200,000+ person-years follow-up) found that maintaining ≥100 PAI/week was associated with a 46% reduction in cardiovascular mortality and a 17% reduction in all-cause mortality.")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("Unlike step counts, PAI captures cardiovascular intensity. 10 minutes at 85% HRmax earns more PAI than 60 minutes of casual walking — reflecting actual cardiac stress and adaptation.")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("This implementation uses an NTNU-inspired approximation based on HR zone minutes weighted by cardiovascular intensity, using Tanaka HRmax (208 − 0.7 × age).")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.green.opacity(0.07))
        .cornerRadius(14)
    }

    // MARK: - Data Loading

    @MainActor
    private func load() async {
        guard HKHealthStore.isHealthDataAvailable() else {
            errorMessage = "HealthKit not available"
            isLoading = false
            return
        }

        let workoutType = HKObjectType.workoutType()
        let hrType      = HKQuantityType(.heartRate)

        do {
            try await hkStore.requestAuthorization(toShare: [], read: [workoutType, hrType])
        } catch {
            errorMessage = "Authorization failed"
            isLoading = false
            return
        }

        let end      = Date()
        let start7   = Calendar.current.date(byAdding: .day, value: -7, to: end)!
        let start84  = Calendar.current.date(byAdding: .day, value: -84, to: end)!

        // Fetch all workouts in last 84 days
        let pred84 = HKQuery.predicateForSamples(withStart: start84, end: end)
        let sort   = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)

        let allWorkouts: [HKWorkout] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred84, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, samples, _ in
                cont.resume(returning: (samples as? [HKWorkout]) ?? [])
            }
            hkStore.execute(q)
        }

        // For each workout, fetch HR samples and compute PAI
        var weekPAIByDay: [String: Double] = [:]
        var weekSessionCountByDay: [String: Int] = [:]
        var weekZoneMin: [Int: Double] = Dictionary(uniqueKeysWithValues: (0..<5).map { ($0, 0.0) })
        var weekPAIByWeek: [String: Double] = [:]

        let dayFmt  = DateFormatter(); dayFmt.dateFormat = "yyyy-MM-dd"
        let weekFmt = DateFormatter(); weekFmt.dateFormat = "yyyy-ww"
        let bpmUnit = HKUnit.count().unitDivided(by: .minute())

        let hrmaxVal = self.hrmax

        for workout in allWorkouts {
            let wPred = HKQuery.predicateForObjects(from: workout)
            let hrSamples: [HKQuantitySample] = await withCheckedContinuation { cont in
                let hq = HKSampleQuery(sampleType: hrType, predicate: wPred, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, s, _ in
                    cont.resume(returning: (s as? [HKQuantitySample]) ?? [])
                }
                hkStore.execute(hq)
            }

            guard !hrSamples.isEmpty else { continue }

            // Compute PAI for this workout from HR samples
            var workoutPAI: Double = 0
            var zoneContribs: [Int: Double] = [:]

            for (idx, s) in hrSamples.enumerated() {
                let bpm = s.quantity.doubleValue(for: bpmUnit)
                let pct = bpm / hrmaxVal
                let minutes: Double
                if idx + 1 < hrSamples.count {
                    minutes = min(hrSamples[idx + 1].startDate.timeIntervalSince(s.startDate) / 60.0, 5.0)
                } else {
                    minutes = 1.0
                }

                for (zIdx, zone) in zoneRates.enumerated() {
                    if pct >= zone.hrmaxLow && pct < zone.hrmaxHigh {
                        let pts = minutes * zone.paiPerMin
                        workoutPAI += pts
                        zoneContribs[zIdx, default: 0] += minutes
                        break
                    }
                }
            }

            let dayKey  = dayFmt.string(from: workout.startDate)
            let weekKey = weekFmt.string(from: workout.startDate)

            weekPAIByWeek[weekKey, default: 0] += workoutPAI

            if workout.startDate >= start7 {
                weekPAIByDay[dayKey, default: 0]         += workoutPAI
                weekSessionCountByDay[dayKey, default: 0] += 1
                for (zIdx, mins) in zoneContribs {
                    weekZoneMin[zIdx, default: 0] += mins
                }
            }
        }

        // Build daily array for last 7 days
        let cal = Calendar.current
        var dailyPoints: [DailyPAI] = []
        for offset in (0..<7).reversed() {
            guard let date = cal.date(byAdding: .day, value: -offset, to: end) else { continue }
            let key   = dayFmt.string(from: date)
            let pts   = weekPAIByDay[key] ?? 0
            let count = weekSessionCountByDay[key] ?? 0
            dailyPoints.append(DailyPAI(date: date, points: pts, sessionCount: count))
        }

        // Zone breakdown for last 7 days
        let zoneMinutesData = zoneRates.enumerated().map { (zIdx, z) in
            ZoneMinutes(zoneName: z.name, minutes: weekZoneMin[zIdx] ?? 0, paiPerMin: z.paiPerMin, color: z.color)
        }

        // Historical 12-week PAI
        var histWeeks: [(weekStart: Date, score: Double)] = []
        for weekOffset in (0..<12).reversed() {
            guard let weekDate = cal.date(byAdding: .weekOfYear, value: -weekOffset, to: end) else { continue }
            let key = weekFmt.string(from: weekDate)
            let score = weekPAIByWeek[key] ?? 0
            // Rolling 7-day window for current week
            histWeeks.append((weekStart: weekDate, score: score))
        }

        let totalWeeklyPAI = dailyPoints.map(\.points).reduce(0, +)

        self.weeklyPAI       = totalWeeklyPAI
        self.daily           = dailyPoints
        self.zoneMinutes     = zoneMinutesData
        self.historicalWeeks = histWeeks
        self.isLoading       = false
    }
}

#Preview {
    NavigationStack { PAIScoreView() }
}
