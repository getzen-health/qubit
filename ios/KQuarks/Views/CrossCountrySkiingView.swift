import SwiftUI
import HealthKit
import Charts

struct CrossCountrySkiingView: View {
    @State private var sessions: [HKWorkout] = []
    @State private var weeklyData: [WeeklyXCData] = []
    @State private var isLoading = true
    @State private var totalSessions = 0
    @State private var avgDuration: Double = 0
    @State private var avgCalories: Double = 0
    @State private var totalDistance: Double = 0

    struct WeeklyXCData: Identifiable {
        let id = UUID()
        let week: String
        let calories: Double
        let sessions: Int
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 6) {
                    Label("Cross-Country Skiing", systemImage: "figure.skiing.crosscountry")
                        .font(.title2).bold()
                    Text("Diagonal stride vs. skate mechanics, VO₂max records & elite endurance science")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal)

                if isLoading {
                    ProgressView("Loading sessions...")
                        .frame(maxWidth: .infinity).padding(.top, 40)
                } else if sessions.isEmpty {
                    ContentUnavailableView(
                        "No Cross-Country Skiing Sessions",
                        systemImage: "figure.skiing.crosscountry",
                        description: Text("Record cross-country skiing sessions with Apple Watch or the Health app to see your analysis here.")
                    )
                    .padding(.top, 40)
                } else {
                    statsRow
                    sessionTypeBreakdown
                    weeklyChart
                    vo2maxScienceCard
                    techniqueCard
                    energyDemandsCard
                    trainingPeriodizationCard
                    recentSessions
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Cross-Country Skiing")
        .toolbarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Stats Row

    private var statsRow: some View {
        HStack(spacing: 12) {
            statCard(value: "\(totalSessions)", label: "Sessions", icon: "figure.skiing.crosscountry", color: .blue)
            statCard(value: formatDuration(avgDuration), label: "Avg Duration", icon: "clock", color: .cyan)
            statCard(value: "\(Int(avgCalories))", label: "Avg kcal", icon: "flame.fill", color: .orange)
        }
        .padding(.horizontal)
    }

    private func statCard(value: String, label: String, icon: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon).font(.title3).foregroundStyle(color)
            Text(value).font(.title3).bold()
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(12)
    }

    // MARK: - Session Type Breakdown

    private var sessionTypeBreakdown: some View {
        let long = sessions.filter { $0.duration >= 7200 }
        let medium = sessions.filter { $0.duration >= 3600 && $0.duration < 7200 }
        let short = sessions.filter { $0.duration >= 1800 && $0.duration < 3600 }
        let quick = sessions.filter { $0.duration < 1800 }

        return VStack(alignment: .leading, spacing: 12) {
            Text("Session Types").font(.headline).padding(.horizontal)
            VStack(spacing: 8) {
                sessionRow(label: "Long Distance Ski", count: long.count, color: .blue,
                    desc: "2h+ – endurance base, classical or skate")
                sessionRow(label: "Medium Distance", count: medium.count, color: .cyan,
                    desc: "60–120 min – aerobic development")
                sessionRow(label: "Interval Session", count: short.count, color: .teal,
                    desc: "30–60 min – high-intensity intervals on snow")
                sessionRow(label: "Speed / Technique", count: quick.count, color: .green,
                    desc: "<30 min – technique drills, sprint work")
            }
            .padding(.horizontal)
        }
    }

    private func sessionRow(label: String, count: Int, color: Color, desc: String) -> some View {
        HStack {
            Circle().fill(color).frame(width: 10, height: 10)
            VStack(alignment: .leading, spacing: 1) {
                Text(label).font(.subheadline).fontWeight(.medium)
                Text(desc).font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            Text("\(count)").font(.headline).foregroundStyle(color)
        }
        .padding(12)
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(10)
    }

    // MARK: - Weekly Chart

    private var weeklyChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Weekly Calories").font(.headline).padding(.horizontal)
            if weeklyData.isEmpty {
                Text("Not enough data").font(.caption).foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity).padding()
            } else {
                Chart(weeklyData) { item in
                    BarMark(x: .value("Week", item.week), y: .value("kcal", item.calories))
                        .foregroundStyle(Color.blue.gradient).cornerRadius(4)
                }
                .frame(height: 160).padding(.horizontal)
                .chartYAxis { AxisMarks(position: .leading) }
                .chartXAxis { AxisMarks { _ in AxisValueLabel().font(.caption2) } }
            }
        }
    }

    // MARK: - VO₂max Science Card

    private var vo2maxScienceCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("World's Highest VO₂max Sport", systemImage: "heart.fill")
                .font(.headline).foregroundStyle(.blue)

            Text("Cross-country skiing holds every VO₂max record in sports science — no other discipline develops aerobic capacity as completely.")
                .font(.caption).foregroundStyle(.secondary)

            VStack(spacing: 10) {
                sciRow(icon: "trophy.fill", title: "Record VO₂max Values",
                    detail: "Bjørn Dæhlie (NOR): 96 mL/kg/min — highest ever measured (Ingjer 1991); Oskar Svendsen (NOR): 97.5 mL/kg/min at age 18 (2012); female record: Ingrid Kristiansen: 71 mL/kg/min — elite female XC skiers average 65–73 mL/kg/min",
                    color: .yellow)
                sciRow(icon: "heart.fill", title: "Why XC Skiing Maximizes VO₂max",
                    detail: "Total-body muscular engagement (arms + legs simultaneously) activates largest possible muscle mass → greatest cardiac output demand; Stromme 1977: double-poling engages 70–80% of total muscle mass vs. running's 40–50%; larger muscle mass = higher O₂ extraction ceiling",
                    color: .red)
                sciRow(icon: "chart.line.uptrend.xyaxis", title: "VO₂max Development Rate",
                    detail: "XC skiing produces fastest VO₂max gains in untrained individuals: 15–25% increase in 12 weeks (Jansson 1990); elite XC skiers see 3–5% improvement annually during peak development years (16–24 years old); maximum values typically plateau at 25–28 years",
                    color: .blue)
                sciRow(icon: "lungs.fill", title: "Lactate Threshold",
                    detail: "Elite XC skiers operate at LT2 (maximal lactate steady state) at 85–92% VO₂max (higher than any other endurance sport); Holmberg 2007: elite skiers maintain 4 mmol/L blood lactate at 90% of VO₂max — testament to exceptional aerobic enzyme adaptation",
                    color: .cyan)
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(14)
        .padding(.horizontal)
    }

    // MARK: - Technique Card

    private var techniqueCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Technique Science", systemImage: "figure.skiing.crosscountry")
                .font(.headline).foregroundStyle(.teal)

            Text("The two primary styles — classical and skate — use fundamentally different biomechanics and train different aspects of fitness.")
                .font(.caption).foregroundStyle(.secondary)

            VStack(spacing: 10) {
                sciRow(icon: "arrow.forward.circle", title: "Diagonal Stride (Classical)",
                    detail: "Bilodeau 1996: diagonal stride generates propulsive force via grip-kick phase (0.08–0.15 s contact); poling phase: 25–35 Nm force per pole; kick-to-glide timing is critical — kick at full hip extension maximizes grip wax contact; 60–70 stride cycles/min at race pace",
                    color: .blue)
                sciRow(icon: "figure.skating", title: "Skate Skiing (Free Style)",
                    detail: "Smith 1992: V2 skate (double-pole with every skate push) most efficient for flat/uphill terrain; V1 preferred on steeper grades; lateral push angle 15–25° optimizes propulsive force component; skate skiing increases HR 8–12 bpm vs. diagonal at same speed",
                    color: .teal)
                sciRow(icon: "hand.raised.fill", title: "Double-Poling Power",
                    detail: "Holmberg 2005: competitive double-poling generates 500–700 W peak power; 80% of peak force applied within 0.15 s; triceps + core + lat + abdominal chain; double-poling VO₂ = 85–90% of maximum vs. running at same intensity — arms as second engine",
                    color: .cyan)
                sciRow(icon: "arrow.up.right.circle", title: "Uphill Efficiency",
                    detail: "Åkermark 1993: V2A (offset skate) preferred for steep grades; energy cost at 10% grade = 1.8× flat; alternating push duration allows ATP-PCr recovery between strides; uphills represent 40–45% of race energy expenditure despite being 25% of course distance",
                    color: .green)
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(14)
        .padding(.horizontal)
    }

    // MARK: - Energy Demands Card

    private var energyDemandsCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Energy Demands & Metabolism", systemImage: "flame.fill")
                .font(.headline).foregroundStyle(.orange)

            VStack(spacing: 10) {
                sciRow(icon: "flame.fill", title: "Caloric Expenditure",
                    detail: "Elite XC skier: 14–18 METs at race pace; recreational XC skiing: 8–10 METs; 90-min race: 1,400–1,800 kcal; 50 km race (elite): 3,000–4,000 kcal — comparable to a marathon but with greater upper-body contribution; fueling at 60–90 g carbohydrate/h required",
                    color: .orange)
                sciRow(icon: "drop.fill", title: "Fat Oxidation at Altitude",
                    detail: "Friedmann-Bette 2009: altitude training (2,500m) increases fat oxidation capacity 12–15% at submaximal intensities; XC skiers train at altitude 3–4 months/year; fat contributes 30–40% of energy at 75% VO₂max; elite athletes achieve peak fat oxidation at 60–65% VO₂max",
                    color: .red)
                sciRow(icon: "snowflake", title: "Cold-Weather Energy",
                    detail: "Cold exposure increases basal metabolic rate 10–20% (Doubt 1991); glycogen depletion occurs faster in cold due to shivering thermogenesis competing with exercise; additional 200–400 kcal/day required for cold-weather training; carbohydrate quality more important in cold",
                    color: .blue)
                sciRow(icon: "heart.fill", title: "Heart Rate Profile",
                    detail: "Elite XC ski race: average HR 178–185 bpm (90–95% HRmax); sprint skiing: peak HR 198–205 bpm; 50-km race average: 172–178 bpm; cardiac output 25–35 L/min in elite athletes — world's highest sustained cardiac output among endurance sports",
                    color: .pink)
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(14)
        .padding(.horizontal)
    }

    // MARK: - Training Periodization Card

    private var trainingPeriodizationCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Norwegian Training Model", systemImage: "chart.bar.doc.horizontal")
                .font(.headline).foregroundStyle(.purple)

            Text("Norway's domination of XC skiing is built on a specific periodization philosophy backed by decades of sports science research.")
                .font(.caption).foregroundStyle(.secondary)

            VStack(spacing: 10) {
                sciRow(icon: "chart.bar.fill", title: "80/20 Intensity Distribution",
                    detail: "Seiler & Tønnessen 2009 (Int J Sports Physiol Perf): Norwegian elite XC skiers perform 78–82% of training at Zone 1 (below LT1); 17–21% above LT2; almost zero time at 'moderate' Zone 2 — polarization is deliberate, not accidental",
                    color: .purple)
                sciRow(icon: "calendar", title: "Annual Training Volume",
                    detail: "Elite XC skiers: 800–1,200 hours/year; Norwegian national team averages 1,100 h; 20–25% rollerskiing (summer), 30% skiing (winter), 25% running, 20% cycling + strength; 600–900 km of skiing September–March",
                    color: .blue)
                sciRow(icon: "figure.strengthtraining.traditional", title: "Nordic Combined Strength",
                    detail: "Hoff 1999: maximum strength training (4RM leg press) improves XC ski economy 5.1% and time-to-exhaustion 21.8%; concurrent strength + endurance doesn't interfere when XC skiers do strength 2× per week; single-leg squats, pull-ups, explosive sled work",
                    color: .green)
                sciRow(icon: "mountain.2.fill", title: "Altitude Preparation",
                    detail: "Stray-Gundersen 1992 (JAMA): 'live high, train low' (altitude sleeping + sea-level training) increases erythropoietin 30%, hemoglobin mass 5% in 4 weeks; optimal altitude: 2,000–2,500m sleep; Norwegian athletes use 4–6 altitude camps/year averaging 3 weeks",
                    color: .orange)
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
            Text("Recent Sessions").font(.headline).padding(.horizontal)
            ForEach(Array(sessions.prefix(5)), id: \.uuid) { session in
                HStack {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(session.startDate, style: .date).font(.subheadline).fontWeight(.medium)
                        Text(sessionType(session)).font(.caption).foregroundStyle(.secondary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 3) {
                        Text(formatDuration(session.duration)).font(.subheadline)
                            .fontWeight(.medium).foregroundStyle(.blue)
                        if let kcal = session.totalEnergyBurned?.doubleValue(for: .kilocalorie()) {
                            Text("\(Int(kcal)) kcal").font(.caption).foregroundStyle(.secondary)
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

    private func sciRow(icon: String, title: String, detail: String, color: Color) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: icon).font(.subheadline).foregroundStyle(color).frame(width: 22)
            VStack(alignment: .leading, spacing: 3) {
                Text(title).font(.subheadline).fontWeight(.semibold)
                Text(detail).font(.caption).foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    private func sessionType(_ session: HKWorkout) -> String {
        switch session.duration {
        case 7200...: return "Long Distance Ski"
        case 3600..<7200: return "Medium Distance"
        case 1800..<3600: return "Interval Session"
        default: return "Speed / Technique"
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
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let workoutType = HKObjectType.workoutType()
        guard (try? await store.requestAuthorization(toShare: [], read: [workoutType])) != nil else {
            isLoading = false; return
        }
        let predicate = HKQuery.predicateForWorkouts(with: .crossCountrySkiing)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        let fetched: [HKWorkout] = await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: workoutType, predicate: predicate,
                limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, samples, _ in
                continuation.resume(returning: (samples as? [HKWorkout]) ?? [])
            }
            store.execute(query)
        }
        let sorted = fetched.sorted { $0.startDate > $1.startDate }
        self.sessions = sorted
        self.totalSessions = sorted.count
        if !sorted.isEmpty {
            self.avgDuration = sorted.map(\.duration).reduce(0, +) / Double(sorted.count)
            let cals = sorted.compactMap { $0.totalEnergyBurned?.doubleValue(for: .kilocalorie()) }
            self.avgCalories = cals.isEmpty ? 0 : cals.reduce(0, +) / Double(cals.count)
            let distances = sorted.compactMap { $0.totalDistance?.doubleValue(for: .meter()) }
            self.totalDistance = distances.reduce(0, +) / 1000.0 // km
        }
        var weekData: [WeeklyXCData] = []
        let calendar = Calendar.current
        let now = Date()
        let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
        for i in (0..<8).reversed() {
            guard let ws = calendar.date(byAdding: .weekOfYear, value: -i, to: now),
                  let we = calendar.date(byAdding: .day, value: 7, to: ws) else { continue }
            let wk = sorted.filter { $0.startDate >= ws && $0.startDate < we }
            let kcal = wk.compactMap { $0.totalEnergyBurned?.doubleValue(for: .kilocalorie()) }.reduce(0, +)
            weekData.append(WeeklyXCData(week: fmt.string(from: ws), calories: kcal, sessions: wk.count))
        }
        self.weeklyData = weekData
        isLoading = false
    }
}
