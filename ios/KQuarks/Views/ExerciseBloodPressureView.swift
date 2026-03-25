import SwiftUI
import HealthKit
import Charts

// MARK: - ExerciseBloodPressureView
// Analyzes the relationship between exercise habits and resting blood pressure,
// tracking whether training is producing the expected cardiometabolic benefit.
//
// Science:
//   Cornelissen & Smart 2013 (J Am Coll Cardiol): meta-analysis of 93 trials —
//     aerobic exercise reduces resting SBP by avg 3.5 mmHg, DBP by 2.5 mmHg.
//     Effect is independent of weight loss and is sustained with continued training.
//   Fagard 2011 (Eur J Cardiovasc Prev Rehabil): ≥150 min/week moderate aerobic
//     exercise required for clinically significant BP reduction.
//   Hegde & Solomon 2015 (Curr Hypertens Rep): HIIT reduces BP comparably to
//     moderate continuous exercise in hypertensive patients.
//   WHO 2023: hypertension (≥140/90 mmHg) affects 1.28 billion adults globally;
//     leading modifiable risk factor for cardiovascular disease.
//
// BP Classification (AHA 2017 Guidelines):
//   Normal:       <120 / <80 mmHg
//   Elevated:     120–129 / <80 mmHg
//   Stage 1 HTN:  130–139 / 80–89 mmHg
//   Stage 2 HTN:  ≥140 / ≥90 mmHg

struct ExerciseBloodPressureView: View {

    // MARK: - Models

    struct BPReading: Identifiable {
        let id = UUID()
        let date: Date
        let label: String
        let systolic: Double     // mmHg
        let diastolic: Double    // mmHg

        var classification: BPClass {
            if systolic >= 140 || diastolic >= 90 { return .stage2 }
            if systolic >= 130 || diastolic >= 80 { return .stage1 }
            if systolic >= 120 && diastolic < 80  { return .elevated }
            return .normal
        }

        var pulse: Double { systolic - diastolic }  // pulse pressure
    }

    enum BPClass: String {
        case normal   = "Normal"
        case elevated = "Elevated"
        case stage1   = "Stage 1 HTN"
        case stage2   = "Stage 2 HTN"

        var color: Color {
            switch self {
            case .normal:   return .green
            case .elevated: return .yellow
            case .stage1:   return .orange
            case .stage2:   return .red
            }
        }

        var icon: String {
            switch self {
            case .normal:   return "heart.fill"
            case .elevated: return "exclamationmark.circle"
            case .stage1:   return "exclamationmark.circle.fill"
            case .stage2:   return "exclamationmark.triangle.fill"
            }
        }
    }

    struct WeeklyPoint: Identifiable {
        let id = UUID()
        let weekLabel: String
        let date: Date
        let avgSystolic: Double
        let avgDiastolic: Double
        let workoutMinutes: Double    // aerobic workout minutes that week
    }

    // MARK: - State

    @State private var readings: [BPReading] = []
    @State private var weeklyPoints: [WeeklyPoint] = []
    @State private var avgSystolic: Double = 0
    @State private var avgDiastolic: Double = 0
    @State private var slopePerWeek: Double = 0       // systolic trend (mmHg/week)
    @State private var weeklyMinsAvg: Double = 0      // avg aerobic min/week
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Reading blood pressure & workouts…")
                        .padding(.top, 60)
                } else if readings.isEmpty {
                    noDataCard
                } else {
                    summaryCard
                    bpTrendChart
                    correlationCard
                    classificationCard
                    exerciseRecommendationCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Exercise & Blood Pressure")
        .toolbarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        let latest = readings.last
        let bpClass = latest?.classification ?? .normal

        return VStack(spacing: 14) {
            HStack(spacing: 0) {
                statBox(
                    value: latest.map { "\(Int($0.systolic))/\(Int($0.diastolic))" } ?? "—",
                    label: "Latest",
                    sub: bpClass.rawValue,
                    color: bpClass.color
                )
                Divider().frame(height: 44)
                statBox(
                    value: avgSystolic > 0 ? "\(Int(avgSystolic))/\(Int(avgDiastolic))" : "—",
                    label: "90-Day Avg",
                    sub: classifyBP(systolic: avgSystolic, diastolic: avgDiastolic).rawValue,
                    color: classifyBP(systolic: avgSystolic, diastolic: avgDiastolic).color
                )
                Divider().frame(height: 44)
                statBox(
                    value: slopePerWeek != 0 ? String(format: "%+.1f mmHg/wk", slopePerWeek) : "—",
                    label: "SBP Trend",
                    sub: slopePerWeek < -0.2 ? "Improving" : slopePerWeek > 0.2 ? "Rising" : "Stable",
                    color: slopePerWeek < -0.2 ? .green : slopePerWeek > 0.2 ? .red : .secondary
                )
            }
            .padding(.vertical, 12)

            HStack {
                Image(systemName: bpClass.icon)
                    .foregroundStyle(bpClass.color)
                Text(statusMessage(bpClass))
                    .font(.caption)
                    .foregroundStyle(bpClass.color)
            }
            .padding(.horizontal)
            .padding(.bottom, 8)
        }
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func statusMessage(_ bpClass: BPClass) -> String {
        switch bpClass {
        case .normal:   return "Blood pressure is in the normal range. Maintain your exercise habits to keep it that way."
        case .elevated: return "Slightly elevated. 150 min/week aerobic exercise can reduce SBP by 3–5 mmHg (Fagard 2011)."
        case .stage1:   return "Stage 1 hypertension. Regular aerobic exercise should be part of treatment — consult your physician."
        case .stage2:   return "Stage 2 hypertension. Medical evaluation is recommended. Exercise is beneficial but clearance is important."
        }
    }

    private func classifyBP(systolic: Double, diastolic: Double) -> BPClass {
        if systolic >= 140 || diastolic >= 90 { return .stage2 }
        if systolic >= 130 || diastolic >= 80 { return .stage1 }
        if systolic >= 120 && diastolic < 80  { return .elevated }
        return .normal
    }

    // MARK: - BP Trend Chart

    private var bpTrendChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Blood Pressure — 90 Days", systemImage: "heart.circle.fill")
                .font(.subheadline).bold()
            Text("Systolic (top, red) and diastolic (bottom, blue). Target: <120/80 mmHg (AHA 2017). Consistent aerobic exercise provides sustained reduction (Cornelissen 2013).")
                .font(.caption2).foregroundStyle(.secondary)

            if !weeklyPoints.isEmpty {
                Chart {
                    ForEach(weeklyPoints) { w in
                        LineMark(
                            x: .value("Week", w.weekLabel),
                            y: .value("Systolic", w.avgSystolic),
                            series: .value("Type", "SBP")
                        )
                        .foregroundStyle(Color.red.gradient)
                        .symbol(.circle)

                        LineMark(
                            x: .value("Week", w.weekLabel),
                            y: .value("Diastolic", w.avgDiastolic),
                            series: .value("Type", "DBP")
                        )
                        .foregroundStyle(Color.blue.gradient)
                        .symbol(.circle)
                    }

                    // 120 mmHg normal threshold
                    RuleMark(y: .value("Normal SBP", 120))
                        .foregroundStyle(Color.red.opacity(0.3))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                        .annotation(position: .trailing, alignment: .leading) {
                            Text("120").font(.caption2).foregroundStyle(.red.opacity(0.6))
                        }

                    // 80 mmHg diastolic normal threshold
                    RuleMark(y: .value("Normal DBP", 80))
                        .foregroundStyle(Color.blue.opacity(0.3))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                        .annotation(position: .trailing, alignment: .leading) {
                            Text("80").font(.caption2).foregroundStyle(.blue.opacity(0.6))
                        }
                }
                .frame(height: 180)
                .chartYScale(domain: max(60, (weeklyPoints.map(\.avgDiastolic).min() ?? 70) - 5)...max(180, (weeklyPoints.map(\.avgSystolic).max() ?? 130) + 10))
            } else {
                Chart(readings) { r in
                    LineMark(
                        x: .value("Date", r.date),
                        y: .value("Systolic", r.systolic),
                        series: .value("Type", "SBP")
                    )
                    .foregroundStyle(Color.red.gradient)

                    LineMark(
                        x: .value("Date", r.date),
                        y: .value("Diastolic", r.diastolic),
                        series: .value("Type", "DBP")
                    )
                    .foregroundStyle(Color.blue.gradient)

                    RuleMark(y: .value("Normal SBP", 120))
                        .foregroundStyle(Color.red.opacity(0.3))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    RuleMark(y: .value("Normal DBP", 80))
                        .foregroundStyle(Color.blue.opacity(0.3))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                }
                .frame(height: 180)
                .chartXAxis {
                    AxisMarks(values: .stride(by: .weekOfYear, count: 2)) { _ in
                        AxisGridLine()
                        AxisTick()
                        AxisValueLabel(format: .dateTime.month().day())
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Correlation Card

    private var correlationCard: some View {
        let active = weeklyMinsAvg >= 150
        let aboveTarget = weeklyMinsAvg >= 150

        return VStack(alignment: .leading, spacing: 8) {
            Label("Exercise Volume vs BP", systemImage: "chart.dots.scatter")
                .font(.subheadline).bold()

            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(String(format: "%.0f min/wk", weeklyMinsAvg))
                        .font(.title3.bold())
                        .foregroundStyle(aboveTarget ? .green : .orange)
                    Text("avg aerobic exercise")
                        .font(.caption2).foregroundStyle(.secondary)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 4) {
                    Text(aboveTarget ? "≥150 min ✓" : "<150 min")
                        .font(.caption.bold())
                        .foregroundStyle(aboveTarget ? .green : .orange)
                    Text("WHO/AHA weekly target")
                        .font(.caption2).foregroundStyle(.secondary)
                }
            }

            if !active {
                Text("You're averaging below the 150 min/week aerobic threshold. Reaching this target is associated with ~3.5 mmHg reduction in systolic BP (Cornelissen & Smart 2013).")
                    .font(.caption).foregroundStyle(.secondary)
            } else {
                Text("You're meeting the aerobic exercise target. This volume is associated with clinically meaningful BP reduction in hypertensive individuals. Sustained over months, expect 3–5 mmHg systolic improvement.")
                    .font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Classification Card

    private var classificationCard: some View {
        let classes: [(BPClass, Int)] = [
            (.normal, readings.filter { $0.classification == .normal }.count),
            (.elevated, readings.filter { $0.classification == .elevated }.count),
            (.stage1, readings.filter { $0.classification == .stage1 }.count),
            (.stage2, readings.filter { $0.classification == .stage2 }.count),
        ]
        let total = Double(readings.count)

        return VStack(alignment: .leading, spacing: 10) {
            Label("Reading Distribution", systemImage: "chart.bar.xaxis")
                .font(.subheadline).bold()

            ForEach(classes, id: \.0.rawValue) { cls, count in
                let pct = total > 0 ? Double(count) / total * 100 : 0
                HStack {
                    Text(cls.rawValue).font(.caption2).frame(width: 90, alignment: .leading)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color.secondary.opacity(0.1)).frame(height: 10)
                            Capsule().fill(cls.color.gradient).frame(width: geo.size.width * pct / 100, height: 10)
                        }
                    }
                    .frame(height: 10)
                    Text(String(format: "%.0f%%", pct))
                        .font(.caption2.bold()).foregroundStyle(cls.color).frame(width: 32, alignment: .trailing)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Exercise Recommendation Card

    private var exerciseRecommendationCard: some View {
        let bpClass = classifyBP(systolic: avgSystolic, diastolic: avgDiastolic)

        return VStack(alignment: .leading, spacing: 8) {
            Label("Exercise Recommendations", systemImage: "figure.walk.motion")
                .font(.subheadline).bold()
                .foregroundStyle(.teal)

            switch bpClass {
            case .normal:
                Text("Maintain current habits. Continue ≥150 min/week moderate aerobic exercise (walking, cycling, swimming). Resistance training 2×/week provides additional cardiovascular benefit.")
                    .font(.caption).foregroundStyle(.secondary)
            case .elevated:
                Text("Target 150–300 min/week of moderate aerobic exercise. Zone 2 training (conversation-pace) is most effective for BP reduction. Monitor readings monthly.")
                    .font(.caption).foregroundStyle(.secondary)
            case .stage1:
                Text("Aerobic exercise is first-line treatment for Stage 1 HTN alongside dietary changes (DASH diet, sodium reduction). Target 150 min/week. Avoid heavy isometric exercises (heavy weightlifting) without physician clearance.")
                    .font(.caption).foregroundStyle(.secondary)
            case .stage2:
                Text("Stage 2 hypertension typically requires medication alongside lifestyle changes. Consult a physician before increasing exercise intensity. Walking, swimming, and cycling at moderate intensity are generally safe starting points.")
                    .font(.caption).foregroundStyle(.orange)
            }
        }
        .padding()
        .background(Color.teal.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Exercise & BP Science", systemImage: "books.vertical")
                .font(.subheadline).bold()
            Text("Regular aerobic exercise is one of the most effective lifestyle interventions for blood pressure. Unlike medications, the benefit compounds: each year of consistent training produces sustained reductions.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Cornelissen & Smart 2013 (J Am Coll Cardiol): in a meta-analysis of 93 trials, endurance exercise reduced resting SBP by 3.5 mmHg and DBP by 2.5 mmHg on average. The effect was greatest in hypertensive individuals (5.2 / 3.7 mmHg reduction).")
                .font(.caption).foregroundStyle(.secondary)
            Text("Fagard 2011 (Eur J Cardiovasc Prev Rehabil): ≥150 min/week of moderate aerobic exercise is the minimum effective dose. Hegde & Solomon 2015 (Curr Hypertens Rep): HIIT reduces BP comparably to continuous moderate exercise with less time investment.")
                .font(.caption2).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.red.opacity(0.05))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - No Data

    private var noDataCard: some View {
        VStack(spacing: 12) {
            Image(systemName: "heart.circle.fill")
                .font(.largeTitle).foregroundStyle(.secondary)
            Text("No blood pressure data")
                .font(.headline)
            Text("Log blood pressure readings manually in the Health app, or pair a compatible Bluetooth blood pressure monitor to start tracking. Apple Watch cannot measure blood pressure directly.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal)
        }
        .padding(40)
    }

    // MARK: - Helpers

    private func statBox(value: String, label: String, sub: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.title3.weight(.bold)).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
            Text(sub).font(.caption2).foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Data Loading

    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }

        let bpType    = HKCorrelationType(.bloodPressure)
        let sysType   = HKQuantityType(.bloodPressureSystolic)
        let diaType   = HKQuantityType(.bloodPressureDiastolic)
        let wType     = HKObjectType.workoutType()

        guard (try? await healthStore.requestAuthorization(
            toShare: [],
            read: [bpType, sysType, diaType, wType]
        )) != nil else { isLoading = false; return }

        let end   = Date()
        let start = calendar.date(byAdding: .day, value: -90, to: end) ?? Date()

        // Fetch BP correlations
        var bpSamples: [HKCorrelation] = []
        await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: start, end: end)
            let q = HKCorrelationQuery(type: bpType, predicate: pred, samplePredicates: nil) { _, results, _ in
                bpSamples = results ?? []
                cont.resume()
            }
            healthStore.execute(q)
        }

        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        var readings: [BPReading] = []
        for bp in bpSamples {
            let sysSample  = bp.objects(for: sysType).first as? HKQuantitySample
            let diaSample  = bp.objects(for: diaType).first as? HKQuantitySample
            guard let sys = sysSample?.quantity.doubleValue(for: HKUnit.millimeterOfMercury()),
                  let dia = diaSample?.quantity.doubleValue(for: HKUnit.millimeterOfMercury()),
                  sys > 60, sys < 250, dia > 40, dia < 150
            else { continue }
            readings.append(BPReading(date: bp.startDate, label: fmt.string(from: bp.startDate), systolic: sys, diastolic: dia))
        }
        readings.sort { $0.date < $1.date }

        // Fetch workouts for aerobic volume
        var rawWorkouts: [HKWorkout] = []
        await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: start, end: end)
            let q = HKSampleQuery(sampleType: wType, predicate: pred,
                                  limit: HKObjectQueryNoLimit,
                                  sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]) { _, s, _ in
                rawWorkouts = (s as? [HKWorkout]) ?? []
                cont.resume()
            }
            healthStore.execute(q)
        }

        let aerobicTypes: Set<HKWorkoutActivityType> = [
            .running, .cycling, .swimming, .walking, .hiking,
            .highIntensityIntervalTraining, .elliptical, .rowing, .other
        ]
        let aerobicWorkouts = rawWorkouts.filter { aerobicTypes.contains($0.workoutActivityType) }

        // Build weekly points (weeks with both BP and workout data)
        let weekFmt = DateFormatter(); weekFmt.dateFormat = "M/d"
        var weeklyPoints: [WeeklyPoint] = []
        var weekCursor = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: start)) ?? Date()
        while weekCursor <= end {
            let weekEnd = calendar.date(byAdding: .weekOfYear, value: 1, to: weekCursor) ?? Date()
            let weekBP = readings.filter { $0.date >= weekCursor && $0.date < weekEnd }
            let weekWorkouts = aerobicWorkouts.filter { $0.startDate >= weekCursor && $0.startDate < weekEnd }

            if !weekBP.isEmpty {
                let avgSys = weekBP.map(\.systolic).reduce(0, +) / Double(weekBP.count)
                let avgDia = weekBP.map(\.diastolic).reduce(0, +) / Double(weekBP.count)
                let workoutMins = weekWorkouts.reduce(0.0) { $0 + $1.duration / 60 }
                weeklyPoints.append(WeeklyPoint(
                    weekLabel: weekFmt.string(from: weekCursor),
                    date: weekCursor,
                    avgSystolic: avgSys,
                    avgDiastolic: avgDia,
                    workoutMinutes: workoutMins
                ))
            }
            weekCursor = weekEnd
        }

        let avgSys = readings.isEmpty ? 0.0 : readings.map(\.systolic).reduce(0, +) / Double(readings.count)
        let avgDia = readings.isEmpty ? 0.0 : readings.map(\.diastolic).reduce(0, +) / Double(readings.count)

        // Systolic trend
        let slopePerWeek: Double
        if readings.count >= 4 {
            let xs = readings.enumerated().map { Double($0.offset) }
            let ys = readings.map(\.systolic)
            let n  = Double(xs.count)
            let mx = xs.reduce(0, +) / n; let my = ys.reduce(0, +) / n
            let num = zip(xs, ys).map { ($0 - mx) * ($1 - my) }.reduce(0, +)
            let den = xs.map { pow($0 - mx, 2) }.reduce(0, +)
            let slopePerDay = den == 0 ? 0 : num / den
            slopePerWeek = slopePerDay * 7
        } else { slopePerWeek = 0 }

        let totalAerobicMinutes = aerobicWorkouts.reduce(0.0) { $0 + $1.duration / 60 }
        let weekCount = max(1, Double(calendar.dateComponents([.weekOfYear], from: start, to: end).weekOfYear ?? 12))
        let avgMinsPerWeek = totalAerobicMinutes / weekCount

        DispatchQueue.main.async {
            self.readings      = readings
            self.weeklyPoints  = weeklyPoints
            self.avgSystolic   = avgSys
            self.avgDiastolic  = avgDia
            self.slopePerWeek  = slopePerWeek
            self.weeklyMinsAvg = avgMinsPerWeek
            self.isLoading     = false
        }
    }
}
