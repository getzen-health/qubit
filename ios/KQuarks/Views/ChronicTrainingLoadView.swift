import SwiftUI
import HealthKit
import Charts

// MARK: - ChronicTrainingLoadView
// Implements Bannister's (1991) Fitness-Fatigue (impulse-response) model.
// CTL (Chronic Training Load, 42-day EWA) = Fitness
// ATL (Acute Training Load, 7-day EWA) = Fatigue
// TSB (Training Stress Balance) = CTL − ATL = Form
// Science: Bannister et al. 1991 (J Appl Physiol), Busso 2003 (Med Sci Sports Exerc)
//   Coggan & Allen: "Training and Racing with a Power Meter"
// Optimal race TSB: +10 to +25. Overreaching risk: TSB < -30.

struct ChronicTrainingLoadView: View {

    // MARK: - Models

    struct DayLoad: Identifiable {
        let id = UUID()
        let date: Date
        let trimp: Double   // daily stress score (kcal-derived proxy)
        let atl: Double     // 7-day EWA = fatigue
        let ctl: Double     // 42-day EWA = fitness
        let tsb: Double     // form = CTL − ATL
    }

    enum Form: String {
        case peak      = "Peak Form"
        case optimal   = "Optimal"
        case fresh     = "Fresh"
        case fatigue   = "Fatigued"
        case overreach = "Overreaching"

        var color: Color {
            switch self {
            case .peak:      return .cyan
            case .optimal:   return .blue
            case .fresh:     return .green
            case .fatigue:   return .orange
            case .overreach: return .red
            }
        }

        static func from(tsb: Double) -> Form {
            switch tsb {
            case 25...:    return .peak
            case 10..<25:  return .optimal
            case 0..<10:   return .fresh
            case -30..<0:  return .fatigue
            default:       return .overreach
            }
        }
    }

    // MARK: - State

    @State private var loads: [DayLoad] = []
    @State private var currentCTL: Double?
    @State private var currentATL: Double?
    @State private var currentTSB: Double?
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current
    // Bannister time constants
    private let eCtl = exp(-1.0 / 42.0)   // 42-day fitness decay
    private let eAtl = exp(-1.0 / 7.0)    // 7-day fatigue decay
    // kcal → TSS proxy: 500 kcal ≈ 100 stress units for a recreational athlete
    private let kCalScale = 100.0 / 500.0

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Computing training load…")
                        .padding(.top, 60)
                } else if loads.isEmpty {
                    ContentUnavailableView("No Workout Data",
                        systemImage: "chart.line.uptrend.xyaxis",
                        description: Text("Log workouts in Apple Health to track chronic training load."))
                } else {
                    summaryCard
                    pmcChart
                    formGuideCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Training Load (CTL/ATL)")
        .toolbarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Cards

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack(spacing: 0) {
                statBox(
                    value: currentCTL.map { String(format: "%.0f", $0) } ?? "—",
                    label: "CTL (Fitness)",
                    sub: "42-day load",
                    color: .blue
                )
                Divider().frame(height: 44)
                statBox(
                    value: currentATL.map { String(format: "%.0f", $0) } ?? "—",
                    label: "ATL (Fatigue)",
                    sub: "7-day load",
                    color: .orange
                )
                Divider().frame(height: 44)
                statBox(
                    value: currentTSB.map { String(format: "%+.0f", $0) } ?? "—",
                    label: "TSB (Form)",
                    sub: "CTL − ATL",
                    color: currentTSB.map { Form.from(tsb: $0).color } ?? .secondary
                )
            }
            .padding(.vertical, 12)

            if let tsb = currentTSB {
                let form = Form.from(tsb: tsb)
                HStack {
                    Image(systemName: formIcon(form))
                        .foregroundStyle(form.color)
                    Text(formMessage(tsb: tsb, form: form))
                        .font(.caption)
                        .foregroundStyle(form.color)
                }
                .padding(.horizontal)
                .padding(.bottom, 8)
            }
        }
        .background(Color.cardSurface)
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

    private func formIcon(_ form: Form) -> String {
        switch form {
        case .peak:      return "star.fill"
        case .optimal:   return "checkmark.circle.fill"
        case .fresh:     return "leaf.fill"
        case .fatigue:   return "battery.25percent"
        case .overreach: return "exclamationmark.triangle.fill"
        }
    }

    private func formMessage(tsb: Double, form: Form) -> String {
        switch form {
        case .peak:      return "Peak form — ideal race window"
        case .optimal:   return "Optimal form (TSB \(String(format: "%+.0f", tsb))) — ready for quality sessions"
        case .fresh:     return "Fresh (TSB \(String(format: "%+.0f", tsb))) — slightly underloaded"
        case .fatigue:   return "Fatigued (TSB \(String(format: "%+.0f", tsb))) — absorbing training load"
        case .overreach: return "Overreaching risk (TSB \(String(format: "%+.0f", tsb))) — prioritise recovery"
        }
    }

    // MARK: - Performance Management Chart

    private var pmcChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Performance Management Chart — 90 Days", systemImage: "chart.line.uptrend.xyaxis")
                .font(.subheadline).bold()
            Text("CTL (blue) = fitness base. ATL (orange) = acute fatigue. TSB (shaded) = form = CTL − ATL.")
                .font(.caption2).foregroundStyle(.secondary)

            let recent = Array(loads.suffix(90))

            Chart {
                // TSB shaded area
                ForEach(recent) { day in
                    AreaMark(
                        x: .value("Date", day.date, unit: .day),
                        yStart: .value("Zero", 0),
                        yEnd: .value("TSB", day.tsb)
                    )
                    .foregroundStyle(day.tsb >= 0
                        ? Color.green.opacity(0.15)
                        : Color.red.opacity(0.15))
                }
                // TSB line
                ForEach(recent) { day in
                    LineMark(
                        x: .value("Date", day.date, unit: .day),
                        y: .value("TSB", day.tsb),
                        series: .value("Metric", "TSB")
                    )
                    .foregroundStyle(Color.green)
                    .lineStyle(StrokeStyle(lineWidth: 1.5))
                }
                // ATL line
                ForEach(recent) { day in
                    LineMark(
                        x: .value("Date", day.date, unit: .day),
                        y: .value("ATL", day.atl),
                        series: .value("Metric", "ATL")
                    )
                    .foregroundStyle(Color.orange)
                    .lineStyle(StrokeStyle(lineWidth: 2))
                }
                // CTL line
                ForEach(recent) { day in
                    LineMark(
                        x: .value("Date", day.date, unit: .day),
                        y: .value("CTL", day.ctl),
                        series: .value("Metric", "CTL")
                    )
                    .foregroundStyle(Color.blue)
                    .lineStyle(StrokeStyle(lineWidth: 2.5))
                }
                // Zero baseline
                RuleMark(y: .value("Zero", 0))
                    .foregroundStyle(Color.secondary.opacity(0.35))
                    .lineStyle(StrokeStyle(lineWidth: 0.5))
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 14)) { _ in
                    AxisValueLabel(format: .dateTime.month().day())
                }
            }
            .frame(height: 180)

            HStack(spacing: 16) {
                legendLine(color: .blue,   label: "CTL",  width: 2.5)
                legendLine(color: .orange, label: "ATL",  width: 2.0)
                legendLine(color: .green,  label: "TSB",  width: 1.5)
            }
            .font(.caption2)
        }
        .padding()
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func legendLine(color: Color, label: String, width: CGFloat) -> some View {
        HStack(spacing: 6) {
            Rectangle().fill(color).frame(width: 16, height: width).cornerRadius(1)
            Text(label).foregroundStyle(.secondary)
        }
    }

    // MARK: - Form Guide

    private var formGuideCard: some View {
        let zones: [(range: String, name: String, color: Color, desc: String)] = [
            ("> +25",      "Peak Form",    .cyan,   "Ideal race day or maximal performance test"),
            ("+10 to +25", "Optimal",      .blue,   "Ready for quality workouts & target races"),
            ("0 to +10",   "Fresh",        .green,  "Slightly underloaded — consider adding volume"),
            ("-30 to 0",   "Fatigued",     .orange, "Normal training load — adaptation in progress"),
            ("< -30",      "Overreaching", .red,    "Recovery priority — injury/illness risk elevated"),
        ]
        return VStack(alignment: .leading, spacing: 8) {
            Label("TSB Form Zones", systemImage: "gauge.with.dots.needle.67percent")
                .font(.subheadline).bold()
            ForEach(zones, id: \.range) { z in
                HStack(alignment: .top, spacing: 10) {
                    Text(z.range)
                        .font(.caption.monospaced())
                        .frame(width: 84, alignment: .leading)
                        .foregroundStyle(z.color)
                    VStack(alignment: .leading, spacing: 1) {
                        Text(z.name).font(.caption.bold())
                        Text(z.desc).font(.caption2).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Science

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Training Science", systemImage: "brain.head.profile")
                .font(.subheadline).bold()
            Text("Bannister et al. 1991 (J Appl Physiol): The impulse-response model decomposes training into a positive fitness effect (τ ≈ 42 days) and a negative fatigue effect (τ ≈ 7 days). Performance ≈ CTL − ATL (TSB).")
                .font(.caption).foregroundStyle(.secondary)
            Text("Busso 2003 (Med Sci Sports Exerc): Non-linear extensions validated the 6-week fitness vs 1-week fatigue asymmetry. Friel practical guideline: CTL ramp rate limit = 3–7 TSS/week to avoid overreaching.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Stress proxy: workout energy (kcal) scaled so 500 kcal/day ≈ 100 TSS. For power-meter runners: TSS = (duration × NP × IF) / (FTP × 3600) × 100.")
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
        let workoutType = HKObjectType.workoutType()
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [workoutType])) != nil else {
            isLoading = false; return
        }

        let end = Date()
        // 180 days: 42-day warm-up + 138 days of visible history
        let start = calendar.date(byAdding: .day, value: -180, to: end) ?? Date()

        var workouts: [HKWorkout] = []
        await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: start, end: end)
            let sort = [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            let q = HKSampleQuery(
                sampleType: workoutType,
                predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: sort
            ) { _, samples, _ in
                workouts = (samples as? [HKWorkout]) ?? []
                cont.resume()
            }
            healthStore.execute(q)
        }

        processWorkouts(workouts, start: start, end: end)
    }

    private func processWorkouts(_ workouts: [HKWorkout], start: Date, end: Date) {
        // Aggregate daily kcal
        var dailyKcal: [Date: Double] = [:]
        for w in workouts {
            let day = calendar.startOfDay(for: w.startDate)
            let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            dailyKcal[day, default: 0] += kcal
        }

        // Walk every day, compute EWA
        var ctl = 0.0
        var atl = 0.0
        var results: [DayLoad] = []

        var cursor = calendar.startOfDay(for: start)
        let endDay = calendar.startOfDay(for: end)
        while cursor <= endDay {
            let trimp = (dailyKcal[cursor] ?? 0) * kCalScale
            ctl = ctl * eCtl + trimp * (1 - eCtl)
            atl = atl * eAtl + trimp * (1 - eAtl)
            results.append(DayLoad(date: cursor, trimp: trimp, atl: atl, ctl: ctl, tsb: ctl - atl))
            cursor = calendar.date(byAdding: .day, value: 1, to: cursor) ?? Date()
        }

        let last = results.last
        DispatchQueue.main.async {
            self.loads = results
            self.currentCTL = last?.ctl
            self.currentATL = last?.atl
            self.currentTSB = last?.tsb
            self.isLoading = false
        }
    }
}
