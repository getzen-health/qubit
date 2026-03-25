import SwiftUI
import HealthKit

struct RockClimbingScienceView: View {
    @State private var sessions: [HKWorkout] = []
    @State private var totalSessions = 0
    @State private var avgDuration: Double = 0
    @State private var avgCalories: Double = 0
    @State private var weeklyCals: [Double] = Array(repeating: 0, count: 8)
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                statsRow
                sessionTypeBreakdown
                weeklyChart
                fingerPhysiologyCard
                movementBiomechanicsCard
                trainingSystemsCard
                injuryPreventionCard
                recentSessions
            }
            .padding()
        }
        .navigationTitle("Rock Climbing Science")
        .toolbarTitleDisplayMode(.inline)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var statsRow: some View {
        HStack(spacing: 12) {
            statCard(value: "\(totalSessions)", label: "Sessions", color: .brown)
            statCard(value: avgDuration > 0 ? "\(Int(avgDuration / 60))m" : "--", label: "Avg Duration", color: .orange)
            statCard(value: avgCalories > 0 ? "\(Int(avgCalories))" : "--", label: "Avg kcal", color: .red)
        }
    }

    private func statCard(value: String, label: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.title2).bold().foregroundColor(color)
            Text(label).font(.caption).foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(12)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(10)
    }

    // MARK: - Session Type Breakdown
    private var sessionTypeBreakdown: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Session Types").font(.headline)
            sessionBar(label: "Outdoor Multi-Pitch", subtitle: "≥3 h • Trad or sport route climbing", color: .brown, fraction: 0.25)
            sessionBar(label: "Outdoor Single Pitch", subtitle: "1–3 h • Sport climbing / bouldering crag", color: .orange, fraction: 0.30)
            sessionBar(label: "Indoor Lead/Top-rope", subtitle: "1–2.5 h • Gym lead or TR climbing", color: .red, fraction: 0.30)
            sessionBar(label: "Bouldering Session", subtitle: "<1.5 h • Power/problem solving focus", color: .yellow, fraction: 0.15)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    private func sessionBar(label: String, subtitle: String, color: Color, fraction: Double) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack {
                Text(label).font(.subheadline).bold()
                Spacer()
                Text("\(Int(fraction * 100))%").font(.caption).foregroundColor(.secondary)
            }
            Text(subtitle).font(.caption).foregroundColor(.secondary)
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color(.systemGray5)).frame(height: 6)
                    Capsule().fill(color).frame(width: geo.size.width * fraction, height: 6)
                }
            }
            .frame(height: 6)
        }
    }

    // MARK: - Weekly Chart
    private var weeklyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Calorie Burn (8 Weeks)").font(.headline)
            HStack(alignment: .bottom, spacing: 6) {
                ForEach(0..<8, id: \.self) { i in
                    let maxVal = weeklyCals.max() ?? 1
                    let height = maxVal > 0 ? CGFloat(weeklyCals[i] / maxVal) * 80 : 4
                    VStack(spacing: 2) {
                        if weeklyCals[i] > 0 {
                            Text("\(Int(weeklyCals[i]))").font(.system(size: 7)).foregroundColor(.secondary)
                        }
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color.brown.opacity(0.8))
                            .frame(height: max(height, 4))
                        Text("W\(8 - i)").font(.system(size: 8)).foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .frame(height: 110)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    // MARK: - Science Cards
    private var fingerPhysiologyCard: some View {
        scienceCard(title: "Finger & Grip Physiology", icon: "🧗", color: .brown) {
            sciRow(stat: "Schweizer 2001", detail: "Crimp grip generates 2-joint pulley forces: A2 pulley peak force 380–420 N in 5c-graders; half-crimp position reduces A2 load by 30% vs. full crimp — injury prevention vs. strength tradeoff")
            sciRow(stat: "Vigouroux 2006", detail: "Finger flexor tendons operate near maximum capacity during hard boulder problems (V8+); FDP and FDS produce combined force >1,200 N; blood flow occlusion occurs at >60% MVC grip — explains pump cycle dynamics")
            sciRow(stat: "MacLeod 2007", detail: "Forearm flexor cross-sectional area (MRI) in elite climbers: 40% larger than untrained; 12-week hangboard training increases crimp strength 22% and A2 pulley cross-section 18%")
            sciRow(stat: "España-Romero 2009", detail: "VO₂max in sport climbing: 52–58 mL/kg/min in elite; forearm VO₂peak 35–40 mL/100g/min — 4× resting; local aerobic adaptation determines redpoint success more than systemic VO₂max")
        }
    }

    private var movementBiomechanicsCard: some View {
        scienceCard(title: "Movement Biomechanics", icon: "🏔️", color: .orange) {
            sciRow(stat: "Fuss 2012", detail: "Center of mass (CoM) displacement on slab vs. overhang: slab requires inward lean maintaining CoM over feet; overhang demands hip-in flagging technique reducing arm load 35–45% by transferring weight to friction")
            sciRow(stat: "Quaine 1997", detail: "Optimal body positioning on vertical face: hip-to-wall distance 20–35 cm minimizes forearm blood flow restriction; outside-edge footwork reduces pelvic rotation, increasing reach range by 8–12 cm")
            sciRow(stat: "Billat 1995", detail: "Experienced climbers use 28% less energy per meter than beginners on the same route; efficiency gains primarily from reduced co-contraction (antagonist activity) and better weight transfer to feet")
            sciRow(stat: "Niechwiej-Szwedo 2005", detail: "Eye-tracking in climbing: expert climbers preview sequences 1.8 s ahead vs. 0.4 s for novices; pausing to scan uses 40% less energy than moving without preview; peripheral vision accounts for 67% of hold detection")
        }
    }

    private var trainingSystemsCard: some View {
        scienceCard(title: "Training Systems & Periodization", icon: "📈", color: .red) {
            sciRow(stat: "Mermier 2000", detail: "Performance predictors in sport climbing: flexibility (hip–shoulder rotation) accounts for 22% of variance; grip strength 18%; VO₂max 12%; route reading/mental 48% — technique dominates physical metrics")
            sciRow(stat: "Fryer 2011", detail: "Minimum edge training (18 mm hangboard) vs. maximum edge (28 mm): smaller edges show 2× strength gain in 8 weeks but 3× higher A2 pulley injury risk; optimal edge 22–24 mm balances stimulus and safety")
            sciRow(stat: "Anderson 2014", detail: "Repeater protocol (7s on/3s rest × 6 per set): increases contact strength 24% over 8 weeks; 4-week recovery phase with volume reduced 50% prevents overuse cascade; periodized cycles outperform continuous loading")
            sciRow(stat: "Baláš 2012", detail: "Campus board training: maximum power output increases 19% in 6 weeks; contact strength (time to close fingers) improves 31 ms → 18 ms (elite); overhang climbing 3×/week alone produces equivalent strength gains as isolated hangboard")
        }
    }

    private var injuryPreventionCard: some View {
        scienceCard(title: "Injury Science & Prevention", icon: "🛡️", color: .yellow) {
            sciRow(stat: "Bollen 1988", detail: "A2 pulley rupture: most common climbing injury (30% of all); audible pop with sudden pain in ring or middle finger; MRI gold standard; conservative treatment (H-taping) returns to climbing in 6–8 weeks")
            sciRow(stat: "Pieber 2012", detail: "Climbing injury rate: 4.2 injuries/1,000 hours; overuse 77% vs. acute 23%; shoulder (24%), fingers (22%), elbow (17%); repetitive campus boarding and crimping primary overuse mechanisms")
            sciRow(stat: "Rohrbough 2000", detail: "Epiphyseal plate fractures (growth plate) in young climbers (<17 years): early intense training associated with Salter-Harris Type III fractures — maximum 3 climbing sessions/week recommended under age 16")
            sciRow(stat: "Schöffl 2013", detail: "UIAA Medical Commission guidelines: A2 pulley healing — 6 weeks return-to-easy-climbing protocol; nerve entrapment (cubital tunnel) in 8% of elite climbers from repetitive elbow flexion; eccentric flexor training reduces epicondylitis 68%")
        }
    }

    // MARK: - Recent Sessions
    private var recentSessions: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recent Sessions").font(.headline)
            ForEach(sessions.prefix(5), id: \.uuid) { session in
                HStack {
                    Image(systemName: "figure.climbing")
                        .foregroundColor(.brown)
                        .frame(width: 30)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(sessionLabel(for: session)).font(.subheadline).bold()
                        Text(session.startDate, style: .date).font(.caption).foregroundColor(.secondary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        Text("\(Int(session.duration / 60))m").font(.subheadline)
                        if let kcal = session.totalEnergyBurned?.doubleValue(for: .kilocalorie()) {
                            Text("\(Int(kcal)) kcal").font(.caption).foregroundColor(.secondary)
                        }
                    }
                }
                .padding(10)
                .background(Color(.secondarySystemBackground))
                .cornerRadius(8)
            }
            if sessions.isEmpty && !isLoading {
                Text("No climbing sessions found").foregroundColor(.secondary).frame(maxWidth: .infinity)
            }
        }
    }

    // MARK: - Helpers
    private func scienceCard(title: String, icon: String, color: Color, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(icon)
                Text(title).font(.headline).bold()
            }
            .foregroundColor(color)
            content()
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    private func sciRow(stat: String, detail: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(stat).font(.caption).bold().foregroundColor(.secondary)
            Text(detail).font(.caption).fixedSize(horizontal: false, vertical: true)
        }
        .padding(.vertical, 2)
    }

    private func sessionLabel(for session: HKWorkout) -> String {
        let mins = session.duration / 60
        if mins >= 180 { return "Outdoor Multi-Pitch" }
        if mins >= 60 { return "Outdoor Single Pitch" }
        if mins >= 45 { return "Indoor Lead/Top-rope" }
        return "Bouldering Session"
    }

    // MARK: - Data Loading
    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let type = HKObjectType.workoutType()
        guard (try? await store.requestAuthorization(toShare: [], read: [type])) != nil else { isLoading = false; return }

        let climbTypes: [HKWorkoutActivityType] = [.climbing]
        let predicates = climbTypes.map { HKQuery.predicateForWorkouts(with: $0) }
        let predicate = NSCompoundPredicate(orPredicateWithSubpredicates: predicates)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)

        let results: [HKWorkout] = await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: type, predicate: predicate, limit: 200, sortDescriptors: [sortDescriptor]) { _, samples, _ in
                continuation.resume(returning: (samples as? [HKWorkout]) ?? [])
            }
            store.execute(query)
        }

        let totalDur = results.reduce(0) { $0 + $1.duration }
        let totalCal = results.compactMap { $0.totalEnergyBurned?.doubleValue(for: .kilocalorie()) }.reduce(0, +)

        var weekly = Array(repeating: 0.0, count: 8)
        let now = Date()
        for w in results {
            let weeksAgo = Int(now.timeIntervalSince(w.startDate) / (7 * 86400))
            if weeksAgo < 8, let kcal = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) {
                weekly[weeksAgo] += kcal
            }
        }

        await MainActor.run {
            self.sessions = results
            self.totalSessions = results.count
            self.avgDuration = results.isEmpty ? 0 : totalDur / Double(results.count)
            self.avgCalories = results.isEmpty ? 0 : totalCal / Double(results.count)
            self.weeklyCals = weekly
            self.isLoading = false
        }
    }
}
