import SwiftUI
import HealthKit
import Charts

// MARK: - GLP1View

/// Comprehensive daily dashboard for users on GLP-1/GIP receptor agonist medications
/// (Zepbound/tirzepatide, Ozempic/Wegovy/semaglutide, or other GLP-1s).
/// Tracks injection cycle phase, weight progress, protein targets, glucose trends,
/// and exercise — all informed by the current point in the weekly medication cycle.
struct GLP1View: View {

    // MARK: - Persistent Settings

    @AppStorage("glp1Enabled") var glp1Enabled: Bool = false
    @AppStorage("glp1MedType") var medType: String = "tirzepatide"
    @AppStorage("glp1InjectionWeekday") var injectionWeekday: Int = 1   // 1=Sun … 7=Sat
    @AppStorage("glp1StartDate") var startDateTimestamp: Double = 0
    @AppStorage("glp1StartWeight") var startWeightKg: Double = 0
    @AppStorage("glp1Dose") var currentDose: String = "5 mg"

    // MARK: - HealthKit Data State

    @State private var weightReadings: [(date: Date, kg: Double)] = []
    @State private var glucoseReadings: [(date: Date, mgdl: Double)] = []
    @State private var leanMassReadings: [(date: Date, percent: Double)] = []
    @State private var heightMeters: Double? = nil
    @State private var todaySteps: Int = 0
    @State private var weeklyStrengthSessions: Int = 0
    @State private var isLoading = true
    @State private var showingSetup = false

    private let healthKit = HealthKitService.shared

    // MARK: - Computed: Injection Cycle

    /// Days elapsed since the most recent injection (0 = injection day itself).
    var daysIntoCurrentCycle: Int {
        let today = Calendar.current.component(.weekday, from: Date()) // 1=Sun, 7=Sat
        return (today - injectionWeekday + 7) % 7
    }

    var daysUntilNextInjection: Int {
        7 - daysIntoCurrentCycle
    }

    var cyclePhase: CyclePhase {
        switch daysIntoCurrentCycle {
        case 0:    return CyclePhase(name: "Injection Day",        color: .purple, icon: "syringe",                         description: "Take your dose today. Light-intensity activity is recommended.")
        case 1, 2: return CyclePhase(name: "Side Effect Window",   color: .orange, icon: "exclamationmark.triangle.fill",   description: "Nausea most common days 1–2 post-dose. Prioritise hydration and gentle movement.")
        case 3, 4: return CyclePhase(name: "Peak Action",          color: .blue,   icon: "bolt.fill",                       description: "GLP-1 at peak concentration. Appetite suppressed — prioritise protein to preserve muscle.")
        case 5, 6: return CyclePhase(name: "Pre-Dose Window",      color: .green,  icon: "figure.run",                      description: "Medication waning — best days for high-intensity training. Appetite returns slightly.")
        default:   return CyclePhase(name: "Active",               color: .blue,   icon: "checkmark.circle.fill",            description: "")
        }
    }

    // MARK: - Computed: Weight

    var startDate: Date? {
        startDateTimestamp > 0 ? Date(timeIntervalSince1970: startDateTimestamp) : nil
    }

    /// Weight readings from start date onwards (or last 90 days if no start date).
    var trackedWeightReadings: [(date: Date, kg: Double)] {
        let cutoff = startDate ?? Calendar.current.date(byAdding: .day, value: -90, to: Date()) ?? Date()
        return weightReadings.filter { $0.date >= cutoff }
    }

    /// Weekly averages for the weight chart.
    var weeklyWeightAverages: [(date: Date, kg: Double)] {
        guard !trackedWeightReadings.isEmpty else { return [] }
        let cal = Calendar.current
        var grouped: [Date: [Double]] = [:]
        for r in trackedWeightReadings {
            guard let weekStart = cal.date(from: cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: r.date)) else { continue }
            grouped[weekStart, default: []].append(r.kg)
        }
        return grouped
            .map { (date: $0.key, kg: $0.value.isEmpty ? 0 : $0.value.reduce(0, +) / Double($0.value.count)) }
            .sorted { $0.date < $1.date }
    }

    var currentWeightKg: Double? { weightReadings.last?.kg }

    var totalLossKg: Double? {
        guard let current = currentWeightKg, startWeightKg > 0 else { return nil }
        return startWeightKg - current
    }

    var weeklyLossRate: Double? {
        let avgs = weeklyWeightAverages
        guard avgs.count >= 2 else { return nil }
        let first = avgs.first!.kg
        let last = avgs.last!.kg
        let weeks = Double(avgs.count - 1)
        return (first - last) / weeks
    }

    // MARK: - Computed: Protein Target

    /// Ideal body weight (IBW) using Devine formula in kg, or a heuristic if height unknown.
    var idealBodyWeightKg: Double {
        if let h = heightMeters {
            let heightCm = h * 100
            // Devine formula (gender-neutral midpoint)
            let ibw = 50.0 + 0.9 * (heightCm - 152.4)
            return max(45, ibw)
        }
        // Fallback: 85% of current weight (approximates lean + modest fat target)
        let fallback = startWeightKg > 0 ? startWeightKg : 80.0
        return (currentWeightKg ?? fallback) * 0.85
    }

    /// Daily protein target: 1.6 g per kg ideal body weight.
    var dailyProteinTargetG: Int {
        Int((idealBodyWeightKg * 1.6).rounded())
    }

    // MARK: - Computed: Glucose

    var avgGlucose7Day: Double? {
        let cutoff = Calendar.current.date(byAdding: .day, value: -7, to: Date()) ?? Date()
        let recent = glucoseReadings.filter { $0.date >= cutoff }
        guard !recent.isEmpty else { return nil }
        return recent.map(\.mgdl).reduce(0, +) / Double(recent.count)
    }

    // MARK: - Science Tips

    private let scienceTips: [ScienceTip] = [
        ScienceTip(icon: "dumbbell.fill",         color: .indigo,  headline: "Muscle is your metabolic armour",
                   body: "GLP-1 medications reduce appetite significantly — which also means less dietary protein reaching your muscles. Resistance training 3× per week combined with high protein intake (1.6 g/kg) has been shown to preserve lean mass during rapid weight loss."),
        ScienceTip(icon: "fork.knife",             color: .orange,  headline: "Protein first, every meal",
                   body: "Eating protein before carbohydrates at each meal blunts the post-meal glucose spike and enhances satiety. On GLP-1 medications, smaller meal volumes mean protein density matters more than ever."),
        ScienceTip(icon: "figure.walk",            color: .teal,    headline: "Walking accelerates results",
                   body: "Studies on semaglutide and tirzepatide show that participants who walked 8,000+ steps/day lost ~30% more body fat than sedentary participants on the same dose — without additional muscle loss."),
        ScienceTip(icon: "drop.fill",              color: .blue,    headline: "Hydration drives fat oxidation",
                   body: "GLP-1 medications can cause nausea and reduced thirst signals. Dehydration impairs fat metabolism. Aim for 35 mL per kg body weight daily, especially in the 48 hours post-injection."),
        ScienceTip(icon: "moon.zzz.fill",          color: .purple,  headline: "Sleep amplifies GLP-1 effects",
                   body: "Poor sleep elevates ghrelin and cortisol, working directly against GLP-1's appetite suppression. Seven or more hours of sleep per night is associated with 2× greater fat loss per kg weight lost on GLP-1 therapy."),
        ScienceTip(icon: "heart.fill",             color: .red,     headline: "Cardiovascular benefit beyond weight",
                   body: "The SELECT trial showed semaglutide reduced major cardiovascular events by 20% independent of weight loss. The SURMOUNT-MMO trial for tirzepatide shows similar cardioprotective signals. These medications benefit the heart directly."),
    ]

    @State private var activeTipIndex: Int = 0

    // MARK: - Body

    var body: some View {
        Group {
            if !glp1Enabled {
                onboardingView
            } else {
                mainDashboard
            }
        }
        .navigationTitle("GLP-1 Tracker")
        .toolbarTitleDisplayMode(.inline)
        .toolbar {
            if glp1Enabled {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showingSetup = true
                    } label: {
                        Image(systemName: "slider.horizontal.3")
                    }
                }
            }
        }
        .sheet(isPresented: $showingSetup) {
            GLP1SetupSheet(
                medType: $medType,
                injectionWeekday: $injectionWeekday,
                startDateTimestamp: $startDateTimestamp,
                startWeightKg: $startWeightKg,
                currentDose: $currentDose,
                glp1Enabled: $glp1Enabled
            )
        }
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Onboarding View

    private var onboardingView: some View {
        ScrollView {
            VStack(spacing: 24) {
                Spacer().frame(height: 20)

                Image(systemName: "syringe")
                    .font(.system(size: 64))
                    .foregroundStyle(.purple.gradient)

                VStack(spacing: 8) {
                    Text("GLP-1 Tracker")
                        .font(.title.bold())
                    Text("Daily guidance tailored to your injection cycle")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }

                VStack(alignment: .leading, spacing: 14) {
                    onboardingRow(icon: "chart.line.downtrend.xyaxis", color: .purple,
                                  title: "Weight progress", detail: "Track your weekly average with total loss and rate of change.")
                    onboardingRow(icon: "bolt.fill", color: .orange,
                                  title: "Cycle-aware coaching", detail: "Know when to train hard, when to rest, and when side effects peak.")
                    onboardingRow(icon: "fork.knife", color: .green,
                                  title: "Protein targets", detail: "Preserve muscle mass with personalised daily protein goals.")
                    onboardingRow(icon: "waveform.path.ecg", color: .red,
                                  title: "Glucose trends", detail: "See 7-day average glucose if you use a CGM or log manually.")
                }
                .padding()
                .background(Color(.systemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .padding(.horizontal)

                Button {
                    showingSetup = true
                } label: {
                    Label("Set Up GLP-1 Tracker", systemImage: "syringe")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(.purple.gradient)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                }
                .padding(.horizontal)

                Text("Your data stays on your device and in Apple Health. No account required.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)

                Spacer().frame(height: 20)
            }
        }
        .background(Color(.systemGroupedBackground))
    }

    private func onboardingRow(icon: String, color: Color, title: String, detail: String) -> some View {
        HStack(alignment: .top, spacing: 14) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(color)
                .frame(width: 30)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.subheadline.weight(.semibold))
                Text(detail).font(.caption).foregroundStyle(.secondary)
            }
        }
    }

    // MARK: - Main Dashboard

    private var mainDashboard: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else {
                    injectionCycleCard
                    todayPrioritiesCard
                    weightProgressCard
                    proteinTargetCard
                    if !glucoseReadings.isEmpty { glucoseTrendCard }
                    exerciseCard
                    scienceInsightCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Injection Cycle Card

    private var injectionCycleCard: some View {
        let phase = cyclePhase
        return VStack(spacing: 16) {
            HStack(alignment: .top) {
                cyclePhaseLabel(phase: phase)
                Spacer()
                cycleRing(phase: phase)
            }
            weekdayPillRow(phase: phase)
                .padding(.top, 4)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func cyclePhaseLabel(phase: CyclePhase) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 6) {
                Image(systemName: phase.icon).foregroundStyle(phase.color)
                Text(phase.name)
                    .font(.headline.weight(.semibold))
                    .foregroundStyle(phase.color)
            }
            Text(daysIntoCurrentCycle == 0 ? "Today is injection day" : "Day \(daysIntoCurrentCycle + 1) of 7")
                .font(.subheadline).foregroundStyle(.secondary)
            Text(phase.description)
                .font(.caption).foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 2)
        }
    }

    private func cycleRing(phase: CyclePhase) -> some View {
        VStack(alignment: .trailing, spacing: 4) {
            ZStack {
                Circle().stroke(phase.color.opacity(0.15), lineWidth: 7)
                Circle()
                    .trim(from: 0, to: CGFloat(daysIntoCurrentCycle + 1) / 7.0)
                    .stroke(phase.color.gradient, style: StrokeStyle(lineWidth: 7, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                VStack(spacing: 1) {
                    Text("\(daysIntoCurrentCycle + 1)")
                        .font(.title3.bold().monospacedDigit())
                        .foregroundStyle(phase.color)
                    Text("/ 7").font(.caption2).foregroundStyle(.secondary)
                }
            }
            .frame(width: 64, height: 64)
            Text(daysUntilNextInjection == 0 ? "Today" : "\(daysUntilNextInjection)d to next")
                .font(.caption2).foregroundStyle(.secondary)
        }
    }

    private func weekdayPillRow(phase: CyclePhase) -> some View {
        HStack(spacing: 4) {
            ForEach(0..<7, id: \.self) { offset in
                weekdayPill(offset: offset, phase: phase)
            }
        }
    }

    private func weekdayPill(offset: Int, phase: CyclePhase) -> some View {
        let dayNum = ((injectionWeekday - 1 + offset) % 7) + 1
        let label = Calendar.current.veryShortWeekdaySymbols[dayNum - 1]
        let isInjection = offset == 0
        let isCurrent = offset == daysIntoCurrentCycle
        let isPast = offset < daysIntoCurrentCycle
        let dotColor: Color = isInjection ? phase.color
            : isCurrent ? phase.color.opacity(0.6)
            : isPast ? Color(.tertiaryLabel)
            : Color(.quaternaryLabel)
        return VStack(spacing: 3) {
            Text(label)
                .font(.system(size: 10, weight: .medium))
                .foregroundStyle(isCurrent ? phase.color : .secondary)
            Circle().fill(dotColor).frame(width: 8, height: 8)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Today's Priorities Card

    private var todayPrioritiesCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Today's Priorities", systemImage: "checklist")
                .font(.headline)

            VStack(alignment: .leading, spacing: 10) {
                ForEach(todayPriorities, id: \.text) { item in
                    HStack(alignment: .top, spacing: 10) {
                        Text(item.emoji)
                            .font(.title3)
                            .frame(width: 28)
                        VStack(alignment: .leading, spacing: 1) {
                            Text(item.text)
                                .font(.subheadline)
                                .fixedSize(horizontal: false, vertical: true)
                            if let sub = item.subtext {
                                Text(sub)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var todayPriorities: [PriorityItem] {
        let proteinStr = "\(dailyProteinTargetG)g protein"
        switch daysIntoCurrentCycle {
        case 0:
            return [
                PriorityItem(emoji: "💉", text: "Injection day — take your \(currentDose) dose today."),
                PriorityItem(emoji: "🚶", text: "Light activity only.", subtext: "Avoid high-intensity training for 24 hours post-injection."),
                PriorityItem(emoji: "💧", text: "Hydrate well.", subtext: "Aim for 35 mL per kg body weight. Helps manage nausea."),
                PriorityItem(emoji: "🍗", text: "Hit your protein target: \(proteinStr).", subtext: "Small, frequent meals if appetite is affected."),
            ]
        case 1, 2:
            return [
                PriorityItem(emoji: "⚠️", text: "Peak side effect window (days 1–2 post-dose).", subtext: "Nausea, fatigue, and appetite changes are most common now."),
                PriorityItem(emoji: "💧", text: "Prioritise hydration.", subtext: "Nausea can reduce your thirst drive. Sip water consistently."),
                PriorityItem(emoji: "🍗", text: "Still aim for \(proteinStr) today.", subtext: "Even if appetite is low — protein shakes count."),
                PriorityItem(emoji: "🧘", text: "Gentle movement is fine.", subtext: "Walking and light stretching. Skip hard training until tomorrow."),
            ]
        case 3, 4:
            return [
                PriorityItem(emoji: "🍽️", text: "Appetite will be most suppressed today.", subtext: "GLP-1 is at peak concentration. Don't skip meals."),
                PriorityItem(emoji: "🍗", text: "Prioritise \(proteinStr).", subtext: "Spread across 3–4 meals. Protein first, carbs second."),
                PriorityItem(emoji: "🚶", text: "Aim for 8,000+ steps.", subtext: "Studies show walking accelerates fat loss on GLP-1 therapy."),
                PriorityItem(emoji: "💪", text: "Light to moderate strength work is fine today.", subtext: "Not the day for maximal efforts, but maintenance training is good."),
            ]
        case 5, 6:
            return [
                PriorityItem(emoji: "💪", text: "Best days for hard training.", subtext: "Medication is waning — energy and strength are at weekly peak."),
                PriorityItem(emoji: "🏋️", text: "Prioritise strength or HIIT today.", subtext: "This window is ideal for building/preserving muscle mass."),
                PriorityItem(emoji: "🍗", text: "Target \(proteinStr) + post-workout protein.", subtext: "Add 20–30g protein within 60 min of strength training."),
                PriorityItem(emoji: "📅", text: "Injection day is in \(daysUntilNextInjection) day\(daysUntilNextInjection == 1 ? "" : "s").", subtext: "Ensure you have your medication ready."),
            ]
        default:
            return [
                PriorityItem(emoji: "🍗", text: "Daily protein target: \(proteinStr)."),
                PriorityItem(emoji: "🚶", text: "Aim for 8,000+ steps today."),
            ]
        }
    }

    // MARK: - Weight Progress Card

    private var weightProgressCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Label("Weight Progress", systemImage: "scalemass.fill")
                    .font(.headline)
                Spacer()
                if let current = currentWeightKg {
                    Text(String(format: "%.1f kg", current))
                        .font(.subheadline.bold().monospacedDigit())
                        .foregroundStyle(.primary)
                }
            }

            if weeklyWeightAverages.count >= 2 {
                // Stats row
                HStack(spacing: 0) {
                    if let loss = totalLossKg {
                        weightStat(
                            label: "Total lost",
                            value: String(format: "−%.1f kg", max(0, loss)),
                            color: loss > 0 ? .green : .secondary
                        )
                        Divider().frame(height: 36)
                    }
                    if let rate = weeklyLossRate {
                        weightStat(
                            label: "Per week",
                            value: String(format: "−%.2f kg", max(0, rate)),
                            color: .blue
                        )
                        if startWeightKg > 0, let current = currentWeightKg {
                            let pct = ((startWeightKg - current) / startWeightKg) * 100
                            Divider().frame(height: 36)
                            weightStat(
                                label: "% lost",
                                value: String(format: "%.1f%%", max(0, pct)),
                                color: .purple
                            )
                        }
                    }
                }
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 10))

                // Chart
                let avgs = weeklyWeightAverages
                let yVals = avgs.map(\.kg)
                let yMin = (yVals.min() ?? 60) - 2
                let yMax = (yVals.max() ?? 100) + 2

                Chart {
                    if startWeightKg > 0 {
                        RuleMark(y: .value("Start", startWeightKg))
                            .lineStyle(StrokeStyle(lineWidth: 1, dash: [5]))
                            .foregroundStyle(.orange.opacity(0.6))
                            .annotation(position: .leading) {
                                Text("Start")
                                    .font(.system(size: 9))
                                    .foregroundStyle(.orange.opacity(0.8))
                            }
                    }
                    ForEach(avgs, id: \.date) { point in
                        LineMark(
                            x: .value("Week", point.date),
                            y: .value("kg", point.kg)
                        )
                        .foregroundStyle(.purple.gradient)
                        .lineStyle(StrokeStyle(lineWidth: 2.5))
                        .interpolationMethod(.monotone)

                        AreaMark(
                            x: .value("Week", point.date),
                            y: .value("kg", point.kg)
                        )
                        .foregroundStyle(
                            LinearGradient(
                                colors: [Color.purple.opacity(0.18), Color.purple.opacity(0.0)],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .interpolationMethod(.monotone)

                        PointMark(
                            x: .value("Week", point.date),
                            y: .value("kg", point.kg)
                        )
                        .foregroundStyle(.purple)
                        .symbolSize(28)
                    }
                }
                .chartYScale(domain: yMin...yMax)
                .chartXAxis {
                    AxisMarks(values: .stride(by: .month)) { _ in
                        AxisValueLabel(format: .dateTime.month(.abbreviated))
                        AxisGridLine()
                    }
                }
                .chartYAxisLabel("kg")
                .frame(height: 180)

            } else if !weightReadings.isEmpty {
                Text("Log at least 2 weeks of weight to see your trend chart.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .padding(.vertical, 8)
            } else {
                Label("No weight data found. Log your weight in Apple Health or the Health app.", systemImage: "scalemass")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .padding(.vertical, 8)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func weightStat(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 3) {
            Text(value)
                .font(.subheadline.bold().monospacedDigit())
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
    }

    // MARK: - Protein Target Card

    private var proteinTargetCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Daily Protein Target", systemImage: "fork.knife")
                .font(.headline)

            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text("\(dailyProteinTargetG)g")
                    .font(.system(size: 44, weight: .bold, design: .rounded))
                    .foregroundStyle(.orange.gradient)
                Text("protein today")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .padding(.bottom, 8)
            }

            VStack(alignment: .leading, spacing: 8) {
                proteinDetail(icon: "scalemass.fill", color: .purple,
                              text: "Based on ideal body weight: \(String(format: "%.0f", idealBodyWeightKg)) kg × 1.6 g/kg")
                proteinDetail(icon: "dumbbell.fill", color: .indigo,
                              text: "Higher protein on GLP-1 preserves lean muscle during rapid weight loss")
                proteinDetail(icon: "fork.knife", color: .orange,
                              text: "Spread across 3–4 meals. Aim for 30–40g per meal if possible")
                if !leanMassReadings.isEmpty, let latest = leanMassReadings.last {
                    let leanKg = (currentWeightKg ?? 0) * (1.0 - latest.percent / 100.0)
                    proteinDetail(icon: "figure.strengthtraining.traditional", color: .green,
                                  text: String(format: "Estimated lean mass: %.1f kg (%.0f%% of body weight)", leanKg, 100.0 - latest.percent))
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func proteinDetail(icon: String, color: Color, text: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: icon)
                .foregroundStyle(color)
                .frame(width: 20)
                .font(.subheadline)
            Text(text)
                .font(.caption)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    // MARK: - Glucose Trend Card

    private var glucoseTrendCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Glucose Trend", systemImage: "waveform.path.ecg")
                .font(.headline)

            HStack(spacing: 0) {
                if let avg = avgGlucose7Day {
                    glucoseStat(label: "7-day avg", value: String(format: "%.0f mg/dL", avg),
                                color: avg < 100 ? .green : avg < 140 ? .yellow : .orange)
                }
                let inRange = glucoseReadings.filter { $0.mgdl >= 70 && $0.mgdl <= 140 }.count
                let tirPct = glucoseReadings.isEmpty ? 0.0 : Double(inRange) / Double(glucoseReadings.count) * 100
                Divider().frame(height: 36)
                glucoseStat(label: "In range", value: String(format: "%.0f%%", tirPct),
                            color: tirPct >= 70 ? .green : tirPct >= 50 ? .yellow : .red)
                Divider().frame(height: 36)
                glucoseStat(label: "Readings", value: "\(glucoseReadings.count)", color: .secondary)
            }
            .background(Color(.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 10))

            // Sparkline chart
            let recent = glucoseReadings.suffix(50)
            if recent.count >= 3 {
                Chart {
                    RectangleMark(yStart: .value("Low", 70.0), yEnd: .value("High", 140.0))
                        .foregroundStyle(Color.green.opacity(0.07))
                    RuleMark(y: .value("High", 140.0))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                        .foregroundStyle(.orange.opacity(0.5))
                    ForEach(Array(recent), id: \.date) { r in
                        LineMark(
                            x: .value("Date", r.date),
                            y: .value("mg/dL", r.mgdl)
                        )
                        .foregroundStyle(Color.teal.opacity(0.7))
                        .interpolationMethod(.monotone)
                        PointMark(
                            x: .value("Date", r.date),
                            y: .value("mg/dL", r.mgdl)
                        )
                        .foregroundStyle(glucoseColor(mgdl: r.mgdl).opacity(0.8))
                        .symbolSize(16)
                    }
                }
                .chartYScale(domain: glucoseDomain(recent.map(\.mgdl)))
                .chartXAxis {
                    AxisMarks(values: .stride(by: .day, count: 3)) { _ in
                        AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                        AxisGridLine()
                    }
                }
                .chartYAxisLabel("mg/dL")
                .frame(height: 150)
            }

            Text("Target range: 70–140 mg/dL. GLP-1 medications improve insulin sensitivity and reduce post-meal glucose spikes.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func glucoseDomain(_ values: [Double]) -> ClosedRange<Double> {
        let lo = values.min().map { max(50.0, $0 - 10) } ?? 50.0
        let hi = values.max().map { max(220.0, $0 + 10) } ?? 220.0
        return lo...hi
    }

    private func glucoseColor(mgdl: Double) -> Color {
        switch mgdl {
        case ..<54:   return .red
        case ..<70:   return .orange
        case ...140:  return .green
        case ...180:  return .orange
        default:      return .red
        }
    }

    private func glucoseStat(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 3) {
            Text(value)
                .font(.subheadline.bold().monospacedDigit())
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
    }

    // MARK: - Exercise Card

    private var exerciseCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Exercise This Week", systemImage: "figure.strengthtraining.traditional")
                .font(.headline)

            HStack(spacing: 0) {
                exerciseStat(
                    label: "Strength sessions",
                    value: "\(weeklyStrengthSessions)",
                    target: "target: 3",
                    color: weeklyStrengthSessions >= 3 ? .green : weeklyStrengthSessions >= 2 ? .orange : .red
                )
                Divider().frame(height: 44)
                exerciseStat(
                    label: "Steps today",
                    value: todaySteps.formatted(),
                    target: "target: 8,000",
                    color: todaySteps >= 8000 ? .green : todaySteps >= 5000 ? .orange : .secondary
                )
            }
            .background(Color(.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 10))

            // Strength session dots
            HStack(spacing: 8) {
                ForEach(0..<3, id: \.self) { i in
                    HStack(spacing: 6) {
                        Circle()
                            .fill(i < weeklyStrengthSessions ? Color.green : Color(.quaternaryLabel))
                            .frame(width: 12, height: 12)
                        if i < weeklyStrengthSessions {
                            Text("Done").font(.caption2).foregroundStyle(.green)
                        } else {
                            Text("Session \(i + 1)").font(.caption2).foregroundStyle(.secondary)
                        }
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(Capsule())
                    if i < 2 { Spacer() }
                }
            }

            HStack(alignment: .top, spacing: 8) {
                Image(systemName: "info.circle.fill")
                    .foregroundStyle(.blue.opacity(0.7))
                    .font(.caption)
                    .padding(.top, 1)
                Text("Resistance training 3× per week is strongly recommended on GLP-1 therapy to preserve muscle mass. Muscle is metabolically active tissue — losing it slows your metabolism long-term.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func exerciseStat(label: String, value: String, target: String, color: Color) -> some View {
        VStack(spacing: 3) {
            Text(value)
                .font(.title3.bold().monospacedDigit())
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
            Text(target)
                .font(.system(size: 10))
                .foregroundStyle(color.opacity(0.7))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
    }

    // MARK: - Science Insight Card

    private var scienceInsightCard: some View {
        let tip = scienceTips[activeTipIndex % scienceTips.count]
        return VStack(alignment: .leading, spacing: 12) {
            HStack {
                Label("Science Corner", systemImage: "brain.head.profile")
                    .font(.headline)
                Spacer()
                Button {
                    withAnimation {
                        activeTipIndex = (activeTipIndex + 1) % scienceTips.count
                    }
                } label: {
                    Label("Next tip", systemImage: "arrow.right.circle")
                        .labelStyle(.iconOnly)
                        .font(.title3)
                        .foregroundStyle(.purple)
                }
            }

            HStack(alignment: .top, spacing: 12) {
                Image(systemName: tip.icon)
                    .font(.title2)
                    .foregroundStyle(tip.color)
                    .frame(width: 36)

                VStack(alignment: .leading, spacing: 6) {
                    Text(tip.headline)
                        .font(.subheadline.weight(.semibold))
                    Text(tip.body)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .padding()
            .background(tip.color.opacity(0.06))
            .clipShape(RoundedRectangle(cornerRadius: 12))

            // Dot indicators
            HStack(spacing: 6) {
                ForEach(0..<scienceTips.count, id: \.self) { i in
                    Circle()
                        .fill(i == activeTipIndex % scienceTips.count ? Color.purple : Color(.quaternaryLabel))
                        .frame(width: 6, height: 6)
                }
            }
            .frame(maxWidth: .infinity)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Data Loading

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let cal = Calendar.current
        let now = Date()
        let start90 = cal.date(byAdding: .day, value: -90, to: now) ?? Date()
        let start30 = cal.date(byAdding: .day, value: -30, to: now) ?? Date()
        let todayStart = cal.startOfDay(for: now)
        let weekStart = cal.date(byAdding: .day, value: -7, to: now) ?? Date()

        // Weight — 90 days
        let kgUnit = HKUnit.gramUnit(with: .kilo)
        if let rawWeight = try? await healthKit.fetchSamples(for: .bodyMass, from: start90, to: now) {
            weightReadings = rawWeight
                .map { (date: $0.startDate, kg: $0.quantity.doubleValue(for: kgUnit)) }
                .filter { $0.kg > 20 && $0.kg < 400 }
                .sorted { $0.date < $1.date }
        }

        // Body fat — 30 days
        if let rawFat = try? await healthKit.fetchSamples(for: .bodyFatPercentage, from: start30, to: now) {
            leanMassReadings = rawFat
                .map { (date: $0.startDate, percent: $0.quantity.doubleValue(for: .percent()) * 100) }
                .filter { $0.percent > 2 && $0.percent < 70 }
                .sorted { $0.date < $1.date }
        }

        // Blood glucose — 30 days
        let glucUnit = HKUnit(from: "mg/dL")
        if let rawGluc = try? await healthKit.fetchSamples(for: .bloodGlucose, from: start30, to: now) {
            glucoseReadings = rawGluc
                .map { (date: $0.startDate, mgdl: $0.quantity.doubleValue(for: glucUnit)) }
                .filter { $0.mgdl > 20 && $0.mgdl < 600 }
                .sorted { $0.date < $1.date }
        }

        // Height (for ideal body weight calculation)
        if let rawHeight = try? await healthKit.fetchLatest(for: .height) {
            heightMeters = rawHeight
        }

        // Today's steps
        if let steps = try? await healthKit.fetchSum(for: .stepCount, from: todayStart, to: now) {
            todaySteps = Int(steps)
        }

        // Strength workouts this week
        if let workouts = try? await healthKit.fetchWorkouts(from: weekStart, to: now) {
            weeklyStrengthSessions = workouts.filter {
                $0.workoutActivityType == .traditionalStrengthTraining ||
                $0.workoutActivityType == .functionalStrengthTraining ||
                $0.workoutActivityType == .crossTraining
            }.count
        }

        // Rotate science tip based on day of week
        activeTipIndex = cal.component(.weekday, from: now) % scienceTips.count
    }
}

// MARK: - Supporting Types

struct CyclePhase {
    let name: String
    let color: Color
    let icon: String
    let description: String
}

struct PriorityItem {
    let emoji: String
    let text: String
    var subtext: String? = nil
}

struct ScienceTip {
    let icon: String
    let color: Color
    let headline: String
    let body: String
}

// MARK: - GLP1SetupSheet

struct GLP1SetupSheet: View {
    @Binding var medType: String
    @Binding var injectionWeekday: Int
    @Binding var startDateTimestamp: Double
    @Binding var startWeightKg: Double
    @Binding var currentDose: String
    @Binding var glp1Enabled: Bool

    @Environment(\.dismiss) private var dismiss

    @State private var selectedStartDate = Date()
    @State private var weightText: String = ""

    private let tirzepatideDoses = ["2.5 mg", "5 mg", "7.5 mg", "10 mg", "12.5 mg", "15 mg"]
    private let semaglutideDoses = ["0.25 mg", "0.5 mg", "1 mg", "1.7 mg", "2.4 mg"]
    private let weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    private var availableDoses: [String] {
        switch medType {
        case "tirzepatide": return tirzepatideDoses
        case "semaglutide": return semaglutideDoses
        default: return ["Low", "Medium", "High", "Custom"]
        }
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Medication") {
                    Picker("Type", selection: $medType) {
                        Text("Tirzepatide (Zepbound / Mounjaro)").tag("tirzepatide")
                        Text("Semaglutide (Ozempic / Wegovy)").tag("semaglutide")
                        Text("Other GLP-1").tag("other")
                    }
                    .onChange(of: medType) { _, _ in
                        if !availableDoses.contains(currentDose) {
                            currentDose = availableDoses.first ?? ""
                        }
                    }

                    Picker("Current dose", selection: $currentDose) {
                        ForEach(availableDoses, id: \.self) { dose in
                            Text(dose).tag(dose)
                        }
                    }
                }

                Section("Injection Schedule") {
                    Picker("Injection day", selection: $injectionWeekday) {
                        ForEach(1...7, id: \.self) { day in
                            Text(weekdays[day - 1]).tag(day)
                        }
                    }
                }

                Section("Journey Start") {
                    DatePicker("Start date", selection: $selectedStartDate, in: ...Date(), displayedComponents: .date)
                    HStack {
                        Text("Starting weight")
                        Spacer()
                        TextField("kg", text: $weightText)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 80)
                        Text("kg")
                            .foregroundStyle(.secondary)
                    }
                }

                Section {
                    Button {
                        save()
                    } label: {
                        Label("Save & Start Tracking", systemImage: "checkmark.circle.fill")
                            .frame(maxWidth: .infinity)
                            .font(.headline)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.purple)
                    .listRowBackground(Color.clear)
                }

                if glp1Enabled {
                    Section {
                        Button(role: .destructive) {
                            glp1Enabled = false
                            dismiss()
                        } label: {
                            Text("Disable GLP-1 Tracker")
                                .frame(maxWidth: .infinity)
                        }
                    }
                }
            }
            .navigationTitle("GLP-1 Setup")
            .toolbarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
            .onAppear {
                if startDateTimestamp > 0 {
                    selectedStartDate = Date(timeIntervalSince1970: startDateTimestamp)
                }
                if startWeightKg > 0 {
                    weightText = String(format: "%.1f", startWeightKg)
                }
            }
        }
    }

    private func save() {
        startDateTimestamp = selectedStartDate.timeIntervalSince1970
        if let w = Double(weightText), w > 20, w < 400 {
            startWeightKg = w
        }
        glp1Enabled = true
        dismiss()
    }
}

// MARK: - Preview

#Preview("Enabled") {
    NavigationStack {
        GLP1View()
    }
    .onAppear {
        UserDefaults.standard.set(true, forKey: "glp1Enabled")
        UserDefaults.standard.set("tirzepatide", forKey: "glp1MedType")
        UserDefaults.standard.set(2, forKey: "glp1InjectionWeekday") // Monday
        UserDefaults.standard.set(Date().addingTimeInterval(-60 * 86400).timeIntervalSince1970, forKey: "glp1StartDate")
        UserDefaults.standard.set(103.4, forKey: "glp1StartWeight")
        UserDefaults.standard.set("10 mg", forKey: "glp1Dose")
    }
}

#Preview("Onboarding") {
    NavigationStack {
        GLP1View()
    }
    .onAppear {
        UserDefaults.standard.set(false, forKey: "glp1Enabled")
    }
}
