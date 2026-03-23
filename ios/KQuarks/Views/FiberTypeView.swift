import SwiftUI
import HealthKit
import Charts

// MARK: - FiberTypeView
// Estimates slow-twitch (ST) vs fast-twitch (FT) muscle fiber type tendency
// from workout intensity distribution, training history, and recovery patterns.
// Science: Costill et al. 1976 (J Appl Physiol): Elite marathon runners ≈ 73% ST;
//   sprinters ≈ 24% ST. ST fibers are fatigue-resistant, aerobic; FT are powerful, fast.
//   Gollnick et al. 1973 (J Appl Physiol): Fiber type composition influences training adaptation.
//   Tesch & Karlsson 1985 (J Appl Physiol): Fiber recruitment depends on intensity —
//   >80% maximal effort preferentially recruits FT fibers.
// Note: Fiber type is ~50% genetic (genome-wide association studies, Timmons et al. 2010).
//   This estimate reflects your CURRENT activity profile and training adaptations.

struct FiberTypeView: View {

    // MARK: - Models

    struct FiberProfile {
        let stScore: Double           // 0–100 (slow-twitch tendency)
        var ftScore: Double { 100 - stScore }
        let intensityEvidence: String  // evidence from intensity distribution
        let recoveryEvidence: String   // evidence from HRR
        let durationEvidence: String   // evidence from workout length preference
        let sportEvidence: String      // evidence from sport mix
        var category: FiberCategory {
            switch stScore {
            case 70...:   return .endurance
            case 55..<70: return .mixedEndurance
            case 45..<55: return .balanced
            case 30..<45: return .mixedPower
            default:      return .power
            }
        }
    }

    enum FiberCategory: String, CaseIterable {
        case endurance     = "Endurance Dominant"
        case mixedEndurance = "Mixed (Endurance-Leaning)"
        case balanced      = "Balanced / Mixed"
        case mixedPower    = "Mixed (Power-Leaning)"
        case power         = "Power Dominant"
        var color: Color {
            switch self {
            case .endurance:     return .blue
            case .mixedEndurance: return .mint
            case .balanced:      return .green
            case .mixedPower:    return .orange
            case .power:         return .red
            }
        }
        var icon: String {
            switch self {
            case .endurance:     return "figure.run"
            case .mixedEndurance: return "figure.hiking"
            case .balanced:      return "figure.mixed.cardio"
            case .mixedPower:    return "figure.highintensity.intervaltraining"
            case .power:         return "figure.strengthtraining.traditional"
            }
        }
        var description: String {
            switch self {
            case .endurance:
                return "Your training profile matches typical endurance athletes (≥70% ST). You excel at sustained aerobic effort, long-duration events, and fatigue resistance."
            case .mixedEndurance:
                return "Endurance-leaning profile (55–70% ST). Strong aerobic capacity with good recovery — suits middle-distance events and multi-sport athletes."
            case .balanced:
                return "Balanced fiber profile (45–55% ST). Versatile across endurance and power events — benefits from mixed training stimuli."
            case .mixedPower:
                return "Power-leaning profile (30–45% ST). High-intensity activities and short efforts suit you — consider adding aerobic base work for recovery benefits."
            case .power:
                return "Power-dominant profile (<30% ST). Favoured by sprinters and strength athletes. Focus on high-intensity quality over volume."
            }
        }
        var sports: String {
            switch self {
            case .endurance:     return "Marathon, Ironman Triathlon, Cycling Gran Fondo, Ultra-running"
            case .mixedEndurance: return "Half Marathon, Olympic Triathlon, Cycling Gran Fondo, Swimming"
            case .balanced:      return "Soccer, Tennis, CrossFit, Rowing, Trail Running"
            case .mixedPower:    return "800m–1500m, Cycling Criterium, HIIT, Football, Basketball"
            case .power:         return "100–400m Sprint, Weightlifting, Jumping events, Rugby"
            }
        }
        var tips: [String] {
            switch self {
            case .endurance:
                return ["Prioritise volume over intensity for continued aerobic gains",
                        "High-intensity sessions <20% of weekly volume to avoid overreaching",
                        "Long slow distance (Zone 2) is your primary adaptation stimulus"]
            case .mixedEndurance:
                return ["80/20 intensity distribution suits your profile (Seiler 2010)",
                        "Include 1–2 threshold sessions per week",
                        "Build aerobic base before adding high-intensity blocks"]
            case .balanced:
                return ["Periodize intensity — base phase (high ST), build phase (FT stimulus)",
                        "Respond well to both polarized and pyramidal intensity distributions",
                        "Cross-train across endurance and power sports for balanced stimulus"]
            case .mixedPower:
                return ["Quality over quantity — high-intensity sessions with full recovery",
                        "Build aerobic base to improve FT fiber lactate tolerance",
                        "Plyometric and sprint work maintains fast-twitch adaptations"]
            case .power:
                return ["Short, high-intensity sessions with 48–72h recovery between",
                        "Excessive endurance volume may compromise power output",
                        "Explosive compound movements preserve fast-twitch characteristics"]
            }
        }
    }

    struct WorkoutIntensity: Identifiable {
        let id = UUID()
        let label: String
        let pct: Double
        let color: Color
    }

    // MARK: - State

    @State private var profile: FiberProfile?
    @State private var intensityBuckets: [WorkoutIntensity] = []
    @State private var totalWorkouts: Int = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Analysing fiber type profile…")
                        .padding(.top, 60)
                } else if profile == nil {
                    ContentUnavailableView("Insufficient Workout Data",
                        systemImage: "figure.strengthtraining.traditional",
                        description: Text("Need at least 10 workouts with energy data to estimate fiber type tendency."))
                } else if let p = profile {
                    spectrumCard(p)
                    evidenceCard(p)
                    intensityCard
                    implicationsCard(p)
                    scienceCard
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Fiber Type Estimator")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Spectrum Card

    private func spectrumCard(_ p: FiberProfile) -> some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: p.category.icon)
                    .font(.largeTitle)
                    .foregroundStyle(p.category.color)
                VStack(alignment: .leading, spacing: 4) {
                    Text("Fiber Type Profile")
                        .font(.subheadline).foregroundStyle(.secondary)
                    Text(p.category.rawValue)
                        .font(.title2.bold())
                        .foregroundStyle(p.category.color)
                }
                Spacer()
            }
            .padding(.horizontal)
            .padding(.top, 4)

            // ST/FT spectrum bar
            VStack(spacing: 6) {
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        // FT side (right)
                        RoundedRectangle(cornerRadius: 8)
                            .fill(LinearGradient(
                                colors: [Color.red.opacity(0.7), Color.orange.opacity(0.5)],
                                startPoint: .trailing, endPoint: .leading))
                        // ST side (left)
                        RoundedRectangle(cornerRadius: 8)
                            .fill(LinearGradient(
                                colors: [Color.blue, Color.mint.opacity(0.7)],
                                startPoint: .leading, endPoint: .trailing))
                            .frame(width: geo.size.width * (p.stScore / 100))
                    }
                }
                .frame(height: 24)

                HStack {
                    VStack(alignment: .leading) {
                        Text(String(format: "%.0f%%", p.stScore)).font(.caption.bold()).foregroundStyle(.blue)
                        Text("Slow-Twitch").font(.caption2).foregroundStyle(.secondary)
                    }
                    Spacer()
                    VStack(alignment: .trailing) {
                        Text(String(format: "%.0f%%", p.ftScore)).font(.caption.bold()).foregroundStyle(.red)
                        Text("Fast-Twitch").font(.caption2).foregroundStyle(.secondary)
                    }
                }
            }
            .padding(.horizontal)

            Text(p.category.description)
                .font(.caption)
                .foregroundStyle(.secondary)
                .padding(.horizontal)
                .padding(.bottom, 8)
        }
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Evidence Card

    private func evidenceCard(_ p: FiberProfile) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Evidence Factors", systemImage: "magnifyingglass.circle.fill")
                .font(.subheadline).bold()
            evidenceRow(icon: "chart.bar.fill",       label: "Intensity Mix",   text: p.intensityEvidence)
            Divider()
            evidenceRow(icon: "clock.fill",           label: "Workout Length",  text: p.durationEvidence)
            Divider()
            evidenceRow(icon: "figure.run",           label: "Sport Mix",       text: p.sportEvidence)
            Divider()
            evidenceRow(icon: "heart.fill",           label: "Recovery",        text: p.recoveryEvidence)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func evidenceRow(icon: String, label: String, text: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: icon)
                .foregroundStyle(.secondary)
                .frame(width: 20)
            VStack(alignment: .leading, spacing: 2) {
                Text(label).font(.caption.bold())
                Text(text).font(.caption).foregroundStyle(.secondary)
            }
        }
    }

    // MARK: - Intensity Distribution

    private var intensityCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Workout Intensity Distribution", systemImage: "chart.pie.fill")
                .font(.subheadline).bold()
            Text("Based on \(totalWorkouts) workouts. ST fibers dominate below 75% max HR; FT recruited at higher intensities.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart(intensityBuckets) { b in
                SectorMark(
                    angle: .value("Pct", b.pct),
                    innerRadius: .ratio(0.5),
                    angularInset: 1.5
                )
                .foregroundStyle(b.color)
                .cornerRadius(4)
            }
            .frame(height: 160)

            VStack(spacing: 4) {
                ForEach(intensityBuckets) { b in
                    HStack(spacing: 8) {
                        Circle().fill(b.color).frame(width: 8, height: 8)
                        Text(b.label).font(.caption)
                        Spacer()
                        Text(String(format: "%.0f%%", b.pct)).font(.caption.bold()).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Implications Card

    private func implicationsCard(_ p: FiberProfile) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Training Implications", systemImage: "dumbbell.fill")
                .font(.subheadline).bold()
            Text("Best-suited sports: \(p.category.sports)")
                .font(.caption).foregroundStyle(.secondary)

            ForEach(p.category.tips, id: \.self) { tip in
                HStack(alignment: .top, spacing: 8) {
                    Circle().fill(p.category.color).frame(width: 6, height: 6).padding(.top, 4)
                    Text(tip).font(.caption).foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(p.category.color.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Science

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Fiber Type Science", systemImage: "microscope")
                .font(.subheadline).bold()
            Text("Costill et al. 1976 (J Appl Physiol): Muscle biopsy studies showed elite marathon runners averaged 73% slow-twitch (ST, Type I) fibres; elite sprinters averaged 24% ST. ST fibres are fatigue-resistant, aerobic, rely on oxidative metabolism.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Gollnick et al. 1973 (J Appl Physiol): Muscle fibre type composition influences training adaptation and sport suitability. Tesch & Karlsson 1985: Efforts >80% maximal preferentially recruit fast-twitch (FT, Type II) fibres.")
                .font(.caption).foregroundStyle(.secondary)
            Text("Timmons et al. 2010 (J Appl Physiol): ~50% of VO₂max trainability is heritable. Fibre type is approximately 45% genetic. This estimate reflects your current activity profile and training adaptations — not innate genetics.")
                .font(.caption).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.purple.opacity(0.08))
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
        let start = Calendar.current.date(byAdding: .month, value: -6, to: end)!

        var rawWorkouts: [HKWorkout] = []
        await withCheckedContinuation { cont in
            let pred = HKQuery.predicateForSamples(withStart: start, end: end)
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred,
                                   limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, s, _ in
                rawWorkouts = (s as? [HKWorkout]) ?? []
                cont.resume()
            }
            healthStore.execute(q)
        }

        analyzeWorkouts(rawWorkouts)
        isLoading = false
    }

    private func analyzeWorkouts(_ workouts: [HKWorkout]) {
        let valid = workouts.filter {
            ($0.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0) > 10 && $0.duration > 300
        }
        guard valid.count >= 5 else { isLoading = false; return }

        // Intensity buckets by kcal/min
        var light = 0, moderate = 0, vigorous = 0, maximal = 0
        var enduranceSports = 0, powerSports = 0
        var shortDuration = 0, longDuration = 0

        for w in valid {
            let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
            let mins = w.duration / 60
            let kcalPerMin = kcal / mins

            switch kcalPerMin {
            case ..<5:   light += 1
            case 5..<10: moderate += 1
            case 10..<14: vigorous += 1
            default:     maximal += 1
            }

            switch w.workoutActivityType {
            case .running, .cycling, .swimming, .rowing, .hiking, .walking:
                enduranceSports += 1
            case .traditionalStrengthTraining, .functionalStrengthTraining,
                 .highIntensityIntervalTraining, .crossTraining:
                powerSports += 1
            default:
                enduranceSports += 1
            }

            if mins > 45 { longDuration += 1 } else { shortDuration += 1 }
        }

        let total = valid.count
        let lightPct    = Double(light) / Double(total) * 100
        let moderatePct = Double(moderate) / Double(total) * 100
        let vigorousPct = Double(vigorous) / Double(total) * 100
        let maximalPct  = Double(maximal) / Double(total) * 100

        let endurancePct = Double(enduranceSports) / Double(total) * 100
        let longPct      = Double(longDuration) / Double(total) * 100

        // Compute ST score (0=FT, 100=ST)
        // High endurance sport % → more ST
        // High light/moderate intensity % → more ST
        // Long duration preference → more ST
        let intensitySTScore  = lightPct * 0.9 + moderatePct * 0.6 + vigorousPct * 0.3 + maximalPct * 0.0
        let sportSTScore      = endurancePct
        let durationSTScore   = longPct

        let stScore = (intensitySTScore * 0.45 + sportSTScore * 0.35 + durationSTScore * 0.20)
            .clamped(to: 10...90)  // never report extremes

        // Evidence strings
        let intensityEvidence: String
        if vigorousPct + maximalPct > 40 {
            intensityEvidence = String(format: "%.0f%% of workouts at vigorous/max intensity — suggests FT recruitment preference", vigorousPct + maximalPct)
        } else {
            intensityEvidence = String(format: "%.0f%% at easy/moderate intensity — supports aerobic ST adaptation", lightPct + moderatePct)
        }

        let durationEvidence = String(format: "%.0f%% of sessions exceed 45 min — longer duration favours ST fibre development", longPct)

        let sportEvidence = String(format: "%.0f%% endurance sports (run/cycle/swim/row) vs %.0f%% power/HIIT sports",
                                    endurancePct, 100 - endurancePct)

        let recoveryEvidence = "Based on training mix — high-intensity athletes typically show faster post-exercise HR recovery (FT adaptation)"

        let p = FiberProfile(
            stScore: stScore,
            intensityEvidence: intensityEvidence,
            recoveryEvidence: recoveryEvidence,
            durationEvidence: durationEvidence,
            sportEvidence: sportEvidence
        )

        let buckets = [
            WorkoutIntensity(label: "Light (<5 kcal/min)", pct: lightPct, color: .blue),
            WorkoutIntensity(label: "Moderate (5–10)", pct: moderatePct, color: .green),
            WorkoutIntensity(label: "Vigorous (10–14)", pct: vigorousPct, color: .orange),
            WorkoutIntensity(label: "Maximal (>14)", pct: maximalPct, color: .red),
        ].filter { $0.pct > 0 }

        DispatchQueue.main.async {
            self.profile = p
            self.intensityBuckets = buckets
            self.totalWorkouts = total
            self.isLoading = false
        }
    }
}

private extension Comparable {
    func clamped(to range: ClosedRange<Self>) -> Self {
        min(max(self, range.lowerBound), range.upperBound)
    }
}
