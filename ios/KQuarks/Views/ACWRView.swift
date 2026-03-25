import SwiftUI
import HealthKit
import Charts

// MARK: - ACWRView
// Acute:Chronic Workload Ratio — injury risk prediction from training load spikes.
// ACWR = ATL (7-day EWA) / CTL (28-day EWA)
// Science: Gabbett 2016 (Br J Sports Med): "The training-injury prevention paradox"
//   ACWR 0.8–1.3 = "sweet spot" — high fitness, low injury risk.
//   ACWR > 1.5 = "danger zone" — 2-4× increased injury risk.
// Hulin et al. 2016 (Br J Sports Med): High acute load spikes increase non-contact injury risk.
// Note: Uses 7/28-day time constants (vs Bannister's 7/42) per Gabbett 2016 recommendation.

struct ACWRView: View {

    // MARK: - Models

    struct DayACWR: Identifiable {
        let id = UUID()
        let date: Date
        let atl: Double      // 7-day EWA
        let ctl: Double      // 28-day EWA
        let acwr: Double?    // ATL / CTL (nil if CTL ≈ 0)
        var riskZone: RiskZone {
            guard let a = acwr else { return .unknown }
            switch a {
            case ..<0.8:      return .low
            case 0.8..<1.3:   return .sweet
            case 1.3..<1.5:   return .caution
            default:          return .danger
            }
        }
    }

    enum RiskZone: String {
        case unknown = "Insufficient Data"
        case low     = "Underloaded"
        case sweet   = "Sweet Spot"
        case caution = "Elevated Risk"
        case danger  = "Danger Zone"
        var color: Color {
            switch self {
            case .unknown: return .secondary
            case .low:     return .blue
            case .sweet:   return .green
            case .caution: return .orange
            case .danger:  return .red
            }
        }
        var icon: String {
            switch self {
            case .unknown: return "questionmark.circle"
            case .low:     return "arrow.down.circle"
            case .sweet:   return "checkmark.circle.fill"
            case .caution: return "exclamationmark.circle"
            case .danger:  return "exclamationmark.triangle.fill"
            }
        }
    }

    // MARK: - State

    @State private var days: [DayACWR] = []
    @State private var currentACWR: Double?
    @State private var currentZone: RiskZone = .unknown
    @State private var pctInSweet: Double?
    @State private var peakACWR: Double?
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current
    // Gabbett 2016 recommends shorter time constants than Bannister
    private let eAtl = exp(-1.0 / 7.0)    // ATL 7-day
    private let eCtl = exp(-1.0 / 28.0)   // CTL 28-day
    private let kCalScale = 100.0 / 500.0

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Computing workload ratio…")
                        .padding(.top, 60)
                } else if days.isEmpty {
                    ContentUnavailableView("No Workout Data",
                        systemImage: "shield.lefthalf.filled",
                        description: Text("Log workouts in Apple Health to track injury risk."))
                } else {
                    summaryCard
                    acwrChart
                    zoneGuideCard
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Workload Ratio (ACWR)")
        .toolbarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack(spacing: 0) {
                statBox(
                    value: currentACWR.map { String(format: "%.2f", $0) } ?? "—",
                    label: "ACWR",
                    sub: "7-day ÷ 28-day",
                    color: currentZone.color
                )
                Divider().frame(height: 44)
                statBox(
                    value: pctInSweet.map { String(format: "%.0f%%", $0) } ?? "—",
                    label: "Sweet Spot",
                    sub: "days in 0.8–1.3",
                    color: .green
                )
                Divider().frame(height: 44)
                statBox(
                    value: peakACWR.map { String(format: "%.2f", $0) } ?? "—",
                    label: "Peak ACWR",
                    sub: "30-day max",
                    color: peakACWR.map { $0 > 1.5 ? .red : $0 > 1.3 ? .orange : .green } ?? .secondary
                )
            }
            .padding(.vertical, 12)

            HStack {
                Image(systemName: currentZone.icon)
                    .foregroundStyle(currentZone.color)
                VStack(alignment: .leading, spacing: 2) {
                    Text(currentZone.rawValue)
                        .font(.caption.bold())
                        .foregroundStyle(currentZone.color)
                    Text(zoneAdvice(currentZone))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
            }
            .padding(.horizontal)
            .padding(.bottom, 8)
        }
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func zoneAdvice(_ zone: RiskZone) -> String {
        switch zone {
        case .unknown: return "Need more workout history to compute"
        case .low:     return "Below fitness base — add load gradually"
        case .sweet:   return "Optimal zone — maintain current progression"
        case .caution: return "Elevated risk — hold load for 1–2 weeks"
        case .danger:  return "High injury risk — reduce load immediately"
        }
    }

    private func statBox(value: String, label: String, sub: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.title3.weight(.bold)).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
            Text(sub).font(.caption2).foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - ACWR Chart

    private var acwrChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("ACWR — 60 Days", systemImage: "waveform.path")
                .font(.subheadline).bold()
            Text("Acute (7-day) ÷ Chronic (28-day) workload. Green band = sweet spot (0.8–1.3). Red zone = danger (>1.5).")
                .font(.caption2).foregroundStyle(.secondary)

            let recent = Array(days.suffix(60))
            let validDays = recent.filter { $0.acwr != nil }

            if !validDays.isEmpty {
                Chart {
                    // Danger zone band
                    RectangleMark(
                        xStart: .value("Start", validDays.first!.date),
                        xEnd:   .value("End",   validDays.last!.date),
                        yStart: .value("Lo", 1.5),
                        yEnd:   .value("Hi", 2.2)
                    )
                    .foregroundStyle(Color.red.opacity(0.08))

                    // Sweet spot band
                    RectangleMark(
                        xStart: .value("Start", validDays.first!.date),
                        xEnd:   .value("End",   validDays.last!.date),
                        yStart: .value("Lo", 0.8),
                        yEnd:   .value("Hi", 1.3)
                    )
                    .foregroundStyle(Color.green.opacity(0.12))

                    // ACWR line
                    ForEach(validDays) { day in
                        if let acwr = day.acwr {
                            LineMark(
                                x: .value("Date", day.date, unit: .day),
                                y: .value("ACWR", acwr)
                            )
                            .foregroundStyle(Color.primary.opacity(0.8))
                            .lineStyle(StrokeStyle(lineWidth: 2))
                        }
                    }

                    // Danger reference line
                    RuleMark(y: .value("Danger", 1.5))
                        .foregroundStyle(Color.red.opacity(0.5))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                        .annotation(position: .top, alignment: .trailing) {
                            Text("1.5 danger").font(.caption2).foregroundStyle(.red)
                        }

                    // Sweet spot lines
                    RuleMark(y: .value("Upper", 1.3))
                        .foregroundStyle(Color.green.opacity(0.4))
                        .lineStyle(StrokeStyle(lineWidth: 0.5))
                    RuleMark(y: .value("Lower", 0.8))
                        .foregroundStyle(Color.green.opacity(0.4))
                        .lineStyle(StrokeStyle(lineWidth: 0.5))
                }
                .chartXAxis {
                    AxisMarks(values: .stride(by: .day, count: 10)) { _ in
                        AxisValueLabel(format: .dateTime.month().day())
                    }
                }
                .chartYScale(domain: 0...max(2.2, (peakACWR ?? 1.5) + 0.2))
                .frame(height: 160)
            }

            HStack(spacing: 14) {
                legendRect(color: .green,  label: "Sweet spot (0.8–1.3)")
                legendRect(color: .red,    label: "Danger (>1.5)")
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
            Rectangle().fill(color.opacity(0.4)).frame(width: 14, height: 10).cornerRadius(2)
            Text(label).foregroundStyle(.secondary)
        }
    }

    // MARK: - Zone Guide

    private var zoneGuideCard: some View {
        let zones: [(range: String, name: String, color: Color, desc: String)] = [
            ("< 0.8",      "Underloaded",    .blue,   "Below fitness base — add load gradually"),
            ("0.8 – 1.3",  "Sweet Spot",     .green,  "Optimal — high fitness, low injury risk"),
            ("1.3 – 1.5",  "Elevated Risk",  .orange, "Monitor for fatigue — hold or reduce load"),
            ("> 1.5",      "Danger Zone",    .red,    "2–4× injury risk — reduce load immediately"),
        ]
        return VStack(alignment: .leading, spacing: 8) {
            Label("ACWR Risk Zones (Gabbett 2016)", systemImage: "shield.lefthalf.filled")
                .font(.subheadline).bold()
            ForEach(zones, id: \.range) { z in
                HStack(alignment: .top, spacing: 10) {
                    Text(z.range)
                        .font(.caption.monospaced())
                        .frame(width: 78, alignment: .leading)
                        .foregroundStyle(z.color)
                    VStack(alignment: .leading, spacing: 1) {
                        Text(z.name).font(.caption.bold())
                        Text(z.desc).font(.caption2).foregroundStyle(.secondary)
                    }
                }
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
            Label("Injury Prevention Science", systemImage: "cross.case.fill")
                .font(.subheadline).bold()
            Text("Gabbett 2016 (Br J Sports Med): 'The training-injury prevention paradox.' High training loads build resilience but sudden spikes cause injury. Athletes in the ACWR sweet spot (0.8–1.3) had the lowest injury rates, even with high absolute loads.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Hulin et al. 2016 (Br J Sports Med): ACWR > 1.5 in cricket fast bowlers increased non-contact injury risk 2–4×. Key insight: it is the rapid increase relative to the base, not the absolute load, that drives injury risk.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Time constants: ATL 7-day, CTL 28-day (Gabbett 2016). Differs from the Bannister fitness-fatigue model (7/42-day) used in the Training Load (CTL/ATL) view.")
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
        // 90 days: 28-day warm-up + 62 days visible
        let start = calendar.date(byAdding: .day, value: -90, to: end) ?? Date()

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
        var dailyKcal: [Date: Double] = [:]
        for w in workouts {
            let day = calendar.startOfDay(for: w.startDate)
            let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            dailyKcal[day, default: 0] += kcal
        }

        var atl = 0.0
        var ctl = 0.0
        var results: [DayACWR] = []

        var cursor = calendar.startOfDay(for: start)
        let endDay = calendar.startOfDay(for: end)
        while cursor <= endDay {
            let trimp = (dailyKcal[cursor] ?? 0) * kCalScale
            atl = atl * eAtl + trimp * (1 - eAtl)
            ctl = ctl * eCtl + trimp * (1 - eCtl)
            let acwr: Double? = ctl > 1 ? atl / ctl : nil
            results.append(DayACWR(date: cursor, atl: atl, ctl: ctl, acwr: acwr))
            cursor = calendar.date(byAdding: .day, value: 1, to: cursor) ?? Date()
        }

        let last = results.last
        let recent30 = results.suffix(30)
        let validRecent = recent30.compactMap { $0.acwr }
        let pctSweet = validRecent.isEmpty ? nil :
            Double(validRecent.filter { $0 >= 0.8 && $0 <= 1.3 }.count) / Double(validRecent.count) * 100
        let peak = validRecent.isEmpty ? nil : validRecent.max()

        DispatchQueue.main.async {
            self.days = results
            self.currentACWR = last?.acwr
            self.currentZone = last.flatMap { $0.acwr != nil ? $0.riskZone : nil } ?? .unknown
            self.pctInSweet = pctSweet
            self.peakACWR = peak
            self.isLoading = false
        }
    }
}
