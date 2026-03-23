import SwiftUI
import HealthKit
import Charts

struct SkateboardingView: View {
    @State private var sessions: [HKWorkout] = []
    @State private var weeklyCalories: [WeeklySkateData] = []
    @State private var isLoading = true
    @State private var totalSessions = 0
    @State private var avgDuration: Double = 0
    @State private var avgCalories: Double = 0
    @State private var totalDuration: Double = 0

    struct WeeklySkateData: Identifiable {
        let id = UUID()
        let week: String
        let calories: Double
        let sessions: Int
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Header
                VStack(alignment: .leading, spacing: 6) {
                    Label("Skateboarding", systemImage: "figure.skateboarding")
                        .font(.title2).bold()
                        .foregroundStyle(.primary)
                    Text("Ollie mechanics, balance adaptation & session history")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal)

                if isLoading {
                    ProgressView("Loading sessions...")
                        .frame(maxWidth: .infinity)
                        .padding(.top, 40)
                } else if sessions.isEmpty {
                    ContentUnavailableView(
                        "No Skateboarding Sessions",
                        systemImage: "figure.skateboarding",
                        description: Text("Record skateboarding sessions with Apple Watch or the Health app to see your analysis here.")
                    )
                    .padding(.top, 40)
                } else {
                    statsRow
                    sessionTypeSummary
                    weeklyChart
                    ollieMechanicsCard
                    injuryEpidemiologyCard
                    balanceAdaptationCard
                    scienceCard
                    recentSessions
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Skateboarding")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
    }

    // MARK: - Stats Row

    private var statsRow: some View {
        HStack(spacing: 12) {
            statCard(value: "\(totalSessions)", label: "Sessions", icon: "figure.skateboarding", color: .orange)
            statCard(value: formatDuration(avgDuration), label: "Avg Duration", icon: "clock", color: .blue)
            statCard(value: "\(Int(avgCalories))", label: "Avg kcal", icon: "flame.fill", color: .red)
        }
        .padding(.horizontal)
    }

    private func statCard(value: String, label: String, icon: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(color)
            Text(value)
                .font(.title3).bold()
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(12)
    }

    // MARK: - Session Type Summary

    private var sessionTypeSummary: some View {
        let long = sessions.filter { $0.duration >= 7200 }
        let medium = sessions.filter { $0.duration >= 3600 && $0.duration < 7200 }
        let short = sessions.filter { $0.duration >= 1800 && $0.duration < 3600 }
        let quickSesh = sessions.filter { $0.duration < 1800 }

        return VStack(alignment: .leading, spacing: 12) {
            Text("Session Types")
                .font(.headline)
                .padding(.horizontal)

            VStack(spacing: 8) {
                sessionTypeRow(label: "Full Park Session", count: long.count, color: .orange, desc: "2h+ – flow zones, trick runs, filming")
                sessionTypeRow(label: "Standard Sesh", count: medium.count, color: .yellow, desc: "1–2h – street skating or park laps")
                sessionTypeRow(label: "Short Sesh", count: short.count, color: .green, desc: "30–60 min – street clips, quick spots")
                sessionTypeRow(label: "Quick Warm-Up", count: quickSesh.count, color: .blue, desc: "<30 min – rolling, push practice")
            }
            .padding(.horizontal)
        }
    }

    private func sessionTypeRow(label: String, count: Int, color: Color, desc: String) -> some View {
        HStack {
            Circle()
                .fill(color)
                .frame(width: 10, height: 10)
            VStack(alignment: .leading, spacing: 1) {
                Text(label).font(.subheadline).fontWeight(.medium)
                Text(desc).font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            Text("\(count)")
                .font(.headline)
                .foregroundStyle(color)
        }
        .padding(12)
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(10)
    }

    // MARK: - Weekly Chart

    private var weeklyChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Weekly Calories")
                .font(.headline)
                .padding(.horizontal)

            if weeklyCalories.isEmpty {
                Text("Not enough data for chart")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity)
                    .padding()
            } else {
                Chart(weeklyCalories) { item in
                    BarMark(
                        x: .value("Week", item.week),
                        y: .value("kcal", item.calories)
                    )
                    .foregroundStyle(Color.orange.gradient)
                    .cornerRadius(4)
                }
                .frame(height: 160)
                .padding(.horizontal)
                .chartYAxis {
                    AxisMarks(position: .leading)
                }
                .chartXAxis {
                    AxisMarks { _ in
                        AxisValueLabel()
                            .font(.caption2)
                    }
                }
            }
        }
    }

    // MARK: - Ollie Mechanics Card

    private var ollieMechanicsCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Ollie Biomechanics", systemImage: "arrow.up.right.circle.fill")
                .font(.headline)
                .foregroundStyle(.orange)

            Text("The foundational trick of modern skateboarding generates forces comparable to sport jumping disciplines.")
                .font(.caption)
                .foregroundStyle(.secondary)

            VStack(spacing: 10) {
                scienceRow(
                    icon: "arrow.up.circle",
                    title: "Ground Reaction Force",
                    detail: "Roces 2001: pop generates 3–5× bodyweight GRF at tail contact — comparable to single-leg landing in basketball",
                    color: .orange
                )
                scienceRow(
                    icon: "figure.run",
                    title: "Jump Biomechanics",
                    detail: "Peak vertical ground force ~2,200 N in experienced skaters (75 kg) in under 0.12 seconds — rapid-fire concentric power",
                    color: .yellow
                )
                scienceRow(
                    icon: "rotate.3d",
                    title: "Board Rotation",
                    detail: "Kickflip angular velocity: ~1,500–2,000°/s; heelflip reverses to ~1,600°/s — Nollie reverses stance biomechanics entirely",
                    color: .red
                )
                scienceRow(
                    icon: "hand.point.up.fill",
                    title: "Foot Sliding Mechanics",
                    detail: "Ollie: front foot slides ~15–20 cm along deck, controlling pitch; timing window for catch is ~80 ms — elite skaters auto-calibrate via proprioception",
                    color: .blue
                )
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(14)
        .padding(.horizontal)
    }

    // MARK: - Injury Epidemiology Card

    private var injuryEpidemiologyCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Injury Prevention Science", systemImage: "bandage.fill")
                .font(.headline)
                .foregroundStyle(.red)

            Text("Skateboarding has a lower injury rate per hour than many contact sports, but specific injury patterns are predictable and preventable.")
                .font(.caption)
                .foregroundStyle(.secondary)

            VStack(spacing: 10) {
                scienceRow(
                    icon: "hand.raised.fill",
                    title: "Wrist Fractures (Most Common)",
                    detail: "Shuman 2011: wrist fractures = 22% of all injuries; fall-on-outstretched-hand (FOOSH) mechanism — wrist guards reduce risk by 85% (Schieber 1996)",
                    color: .red
                )
                scienceRow(
                    icon: "figure.stand",
                    title: "Ankle Sprains",
                    detail: "Forsman 2011: lateral ankle sprains = 19% of injuries — high-top shoes with stiff heel counter reduce inversion sprains; toe-side catches preserve ankle alignment",
                    color: .orange
                )
                scienceRow(
                    icon: "brain",
                    title: "Head Injuries & Helmets",
                    detail: "Shuman 2011: head injuries = 15% — helmet use reduces concussion risk by 63% (Thompson 2010); vert skating has 3× head injury rate vs. street skating",
                    color: .purple
                )
                scienceRow(
                    icon: "knee",
                    title: "Knee Overuse",
                    detail: "Patellar tendinopathy develops with high-frequency trick repetition (>200 ollies/session); progressive loading + eccentric decline squats for rehab",
                    color: .yellow
                )
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(14)
        .padding(.horizontal)
    }

    // MARK: - Balance Adaptation Card

    private var balanceAdaptationCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Balance & Neuromuscular Adaptation", systemImage: "figure.stand.line.dotted.figure.stand")
                .font(.headline)
                .foregroundStyle(.green)

            Text("Skateboarding produces measurable improvements in postural control that transfer to other sports and daily life.")
                .font(.caption)
                .foregroundStyle(.secondary)

            VStack(spacing: 10) {
                scienceRow(
                    icon: "gyroscope",
                    title: "Proprioceptive Enhancement",
                    detail: "Rinaldi 2014: experienced skaters show superior single-leg balance (sway area 30% smaller on stabilometry) vs. non-skaters — transferable to all dynamic sports",
                    color: .green
                )
                scienceRow(
                    icon: "brain.head.profile",
                    title: "Neuroplasticity",
                    detail: "Repetitive trick practice (100–500 attempts per session) drives motor cortex reorganization — analogous to musical instrument skill acquisition in neuroscience research",
                    color: .cyan
                )
                scienceRow(
                    icon: "figure.skate",
                    title: "Stance Laterality",
                    detail: "Regular vs. goofy stance correlates with hand dominance in ~85% of skaters (Vencato 2010); switch skating forces bilateral neuromotor adaptation",
                    color: .blue
                )
                scienceRow(
                    icon: "figure.cooldown",
                    title: "Hip Flexor Demands",
                    detail: "Pushing stance creates chronic hip flexor tightness (dominant-side iliopsoas shortening) — targeted hip flexor mobility prevents lumbar compensation patterns",
                    color: .yellow
                )
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(14)
        .padding(.horizontal)
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Training Science", systemImage: "chart.bar.doc.horizontal")
                .font(.headline)
                .foregroundStyle(.blue)

            VStack(spacing: 10) {
                scienceRow(
                    icon: "flame.fill",
                    title: "Caloric Expenditure",
                    detail: "Street skating: 5–8 METs (~300–500 kcal/h); vert/bowl skating: 6–10 METs (~400–650 kcal/h); flatground trick practice: 4–5 METs — intermittent intensity pattern",
                    color: .red
                )
                scienceRow(
                    icon: "heart.fill",
                    title: "Cardiovascular Profile",
                    detail: "Mean HR during a skate session: 130–155 bpm (Doyle 2002); explosive intervals at >85% HRmax during trick attempts with passive recovery between attempts",
                    color: .pink
                )
                scienceRow(
                    icon: "moon.fill",
                    title: "Skate-Specific Recovery",
                    detail: "High-frequency eccentric loading of quads/ankles requires 24–48h recovery; skin abrasion wounds ('road rash') heal faster with moist wound healing vs. air-drying",
                    color: .purple
                )
                scienceRow(
                    icon: "figure.strengthtraining.traditional",
                    title: "Cross-Training Benefit",
                    detail: "Hip mobility + single-leg strength training reduces injury risk; plyometric training improves ollie height 8–12% in 6 weeks (jump squat + depth jumps protocols)",
                    color: .green
                )
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(14)
        .padding(.horizontal)
    }

    // MARK: - Recent Sessions

    private var recentSessions: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Sessions")
                .font(.headline)
                .padding(.horizontal)

            ForEach(Array(sessions.prefix(5)), id: \.uuid) { session in
                HStack {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(session.startDate, style: .date)
                            .font(.subheadline)
                            .fontWeight(.medium)
                        Text(sessionLabel(session))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 3) {
                        Text(formatDuration(session.duration))
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .foregroundStyle(.orange)
                        if let kcal = session.totalEnergyBurned?.doubleValue(for: .kilocalorie()) {
                            Text("\(Int(kcal)) kcal")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                .padding(12)
                .background(Color(uiColor: .secondarySystemBackground))
                .cornerRadius(10)
                .padding(.horizontal)
            }
        }
    }

    // MARK: - Helpers

    private func scienceRow(icon: String, title: String, detail: String, color: Color) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: icon)
                .font(.subheadline)
                .foregroundStyle(color)
                .frame(width: 22)
            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                Text(detail)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    private func sessionLabel(_ session: HKWorkout) -> String {
        switch session.duration {
        case 7200...: return "Full Park Session"
        case 3600..<7200: return "Standard Sesh"
        case 1800..<3600: return "Short Sesh"
        default: return "Quick Warm-Up"
        }
    }

    private func formatDuration(_ seconds: Double) -> String {
        let h = Int(seconds) / 3600
        let m = (Int(seconds) % 3600) / 60
        if h > 0 { return "\(h)h \(m)m" }
        return "\(m)m"
    }

    // MARK: - Data Loading

    @MainActor
    func loadData() async {
        let store = HKHealthStore()
        guard HKHealthStore.isHealthDataAvailable() else {
            isLoading = false
            return
        }

        let workoutType = HKObjectType.workoutType()
        guard (try? await store.requestAuthorization(toShare: [], read: [workoutType])) != nil else {
            isLoading = false
            return
        }

        let predicate = HKQuery.predicateForWorkouts(with: .skatingSports)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

        let fetchedWorkouts: [HKWorkout] = await withCheckedContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: workoutType,
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [sortDescriptor]
            ) { _, samples, _ in
                continuation.resume(returning: (samples as? [HKWorkout]) ?? [])
            }
            store.execute(query)
        }

        let sorted = fetchedWorkouts.sorted { $0.startDate > $1.startDate }
        self.sessions = sorted
        self.totalSessions = sorted.count

        if !sorted.isEmpty {
            self.avgDuration = sorted.map(\.duration).reduce(0, +) / Double(sorted.count)
            self.totalDuration = sorted.map(\.duration).reduce(0, +)
            let cals = sorted.compactMap { $0.totalEnergyBurned?.doubleValue(for: .kilocalorie()) }
            self.avgCalories = cals.isEmpty ? 0 : cals.reduce(0, +) / Double(cals.count)
        }

        // Build weekly data (last 8 weeks)
        var weekData: [WeeklySkateData] = []
        let calendar = Calendar.current
        let now = Date()
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"

        for i in (0..<8).reversed() {
            guard let weekStart = calendar.date(byAdding: .weekOfYear, value: -i, to: now),
                  let weekEnd = calendar.date(byAdding: .day, value: 7, to: weekStart) else { continue }
            let weekSessions = sorted.filter { $0.startDate >= weekStart && $0.startDate < weekEnd }
            let kcal = weekSessions.compactMap { $0.totalEnergyBurned?.doubleValue(for: .kilocalorie()) }.reduce(0, +)
            weekData.append(WeeklySkateData(
                week: formatter.string(from: weekStart),
                calories: kcal,
                sessions: weekSessions.count
            ))
        }
        self.weeklyCalories = weekData

        DispatchQueue.main.async { self.isLoading = false }
    }
}
