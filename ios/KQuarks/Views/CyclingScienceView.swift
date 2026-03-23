import SwiftUI
import HealthKit

struct CyclingScienceView: View {
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
                powerScienceCard
                pedalingBiomechanicsCard
                physiologyCard
                injuryPreventionCard
                recentSessions
            }
            .padding()
        }
        .navigationTitle("Cycling Science")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var statsRow: some View {
        HStack(spacing: 12) {
            statCard(value: "\(totalSessions)", label: "Sessions", color: .yellow)
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
            sessionBar(label: "Long Endurance Ride", subtitle: "≥2 h • Zone 2 aerobic base", color: .yellow, fraction: 0.35)
            sessionBar(label: "Group Ride / Race", subtitle: "1–3 h • Intermittent high intensity", color: .orange, fraction: 0.25)
            sessionBar(label: "Interval / Threshold", subtitle: "45–90 min • FTP & VO₂max work", color: .red, fraction: 0.25)
            sessionBar(label: "Indoor / Trainer", subtitle: "<90 min • Structured Zwift/ERG", color: .purple, fraction: 0.15)
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
                            .fill(Color.yellow.opacity(0.8))
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
    private var powerScienceCard: some View {
        scienceCard(title: "Power & FTP Science", icon: "⚡", color: .yellow) {
            sciRow(stat: "Allen 2010", detail: "Functional Threshold Power (FTP): maximum average power sustainable for ~60 min; approximated by 95% of 20-min max power; professional men: 5.5–6.5 W/kg; amateur Cat 3: 3.5–4.2 W/kg; women professionals: 4.5–5.5 W/kg")
            sciRow(stat: "Coggan 2003", detail: "Training Stress Score (TSS) = (seconds × NP × IF)² / (FTP × 3600) × 100; acute load (ATL) 7-day decay, chronic load (CTL) 42-day decay; form (TSB) = CTL − ATL; optimal race TSB: +10 to +25 (positive freshness)")
            sciRow(stat: "Pinot 2014", detail: "Power duration curve: CP (critical power) models sustainable power at any duration; W' (anaerobic work capacity) depletes above CP and recovers below; optimal training targets W' depletion for VO₂max stimulus")
            sciRow(stat: "Wattage zones", detail: "Coggan zones: Z1 <55% FTP recovery, Z2 56–75% aerobic, Z3 76–90% tempo, Z4 91–105% threshold (FTP), Z5 106–120% VO₂max, Z6 121–150% anaerobic, Z7 >150% neuromuscular — each targets distinct physiological adaptations")
        }
    }

    private var pedalingBiomechanicsCard: some View {
        scienceCard(title: "Pedaling Biomechanics", icon: "🚴", color: .orange) {
            sciRow(stat: "Dorel 2010", detail: "Elite cyclists generate peak force 500–900 N at ~90–100° crank angle (3 o'clock position); dead spot at top (0°) and bottom (180°) contributes negative work; oval chainrings reduce dead spot by 20% in some riders")
            sciRow(stat: "Leirdal 2011", detail: "Optimal cadence for endurance: 80–100 RPM reduces muscle fiber recruitment per contraction vs. low cadence; 90 RPM at same power → 18% lower type II fiber activation vs. 60 RPM — reduced neuromuscular fatigue over long rides")
            sciRow(stat: "McDaniel 2002", detail: "Pedaling effectiveness (PE) = effective force / total force; elite cyclists achieve PE 20–22%, amateur 14–17%; pulling on the upstroke contributes <5% of total power in most cyclists — cue is to 'unweight' rather than actively pull")
            sciRow(stat: "Divert 2005", detail: "Saddle height optimization: optimal knee angle at BDC (bottom dead center) is 25–35° of flexion; 1cm too low → 4% increased quadriceps activation; 1cm too high → 10% increase in hamstring injury risk and pelvic rocking at top of stroke")
        }
    }

    private var physiologyCard: some View {
        scienceCard(title: "Physiology & Adaptation", icon: "🫁", color: .red) {
            sciRow(stat: "Bassett 2000", detail: "Elite cyclist VO₂max: 75–90 mL/kg/min (men), 65–75 (women); Indurain reportedly 88 mL/kg/min; VO₂max alone explains only 70% of performance variance — economy and FTP/VO₂max ratio complete the picture")
            sciRow(stat: "Coyle 1991", detail: "Cycling economy (CE): oxygen cost per watt; improves 5–10% with years of training via preferential type I muscle fiber recruitment; CE is the key differentiator between cyclists with similar VO₂max")
            sciRow(stat: "Iaia 2009", detail: "Speed endurance training (SET) vs. volume training: 4 weeks of 6–10 × 30 s max sprints (3×/week) increases mitochondrial density 30%, Na+-K+-ATPase 68%, and 40km TT performance 4% — time-efficient alternative to volume")
            sciRow(stat: "Mujika 2000", detail: "Altitude training (live high, train low): 3–4 weeks at 2,000–2,500 m increases EPO, hemoglobin mass +3–6%, and 40km TT +3.5%; 'natural EPO' effect peaks 2–4 weeks post-return to sea level")
        }
    }

    private var injuryPreventionCard: some View {
        scienceCard(title: "Injury Science & Prevention", icon: "🛡️", color: .purple) {
            sciRow(stat: "Bini 2014", detail: "Cycling overuse injury rate: 85% of cyclists sustain injury in a season; anterior knee pain (28%) from saddle-too-low or cleat misalignment; lateral knee (ITB, 24%) from saddle-too-high; lower back (23%) from handlebar-too-low")
            sciRow(stat: "Dettori 2006", detail: "KOPS (knee over pedal spindle) bike fitting: cleat fore-aft alignment affects patellar tendon strain 30%; Q-angle management via float cleat selection reduces lateral patellar tracking syndrome incidence by 45%")
            sciRow(stat: "Wilber 1995", detail: "Ulnar nerve neuropathy (cyclist's palsy): affects 30% of long-distance cyclists; handlebar pressure >20% BW for >1 hour causes parasthesia; padded gloves reduce peak pressure 35%, bar-end or aero position reduces 60%")
            sciRow(stat: "Priego Quesada 2014", detail: "Saddle pressure distribution: saddle tilt >5° anterior increases perineal soft-tissue pressure 3×; ISM Adamo-style cutout saddles reduce perineal pressure 90%; genital numbness affects 20% of male cyclists after 3+ hours")
        }
    }

    // MARK: - Recent Sessions
    private var recentSessions: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recent Sessions").font(.headline)
            ForEach(sessions.prefix(5), id: \.uuid) { session in
                HStack {
                    Image(systemName: "figure.outdoor.cycle")
                        .foregroundColor(.yellow)
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
                Text("No cycling sessions found").foregroundColor(.secondary).frame(maxWidth: .infinity)
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
        if mins >= 120 { return "Long Endurance Ride" }
        if mins >= 60 { return "Group Ride / Race" }
        if mins >= 45 { return "Interval / Threshold" }
        return "Indoor / Trainer"
    }

    // MARK: - Data Loading
    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let type = HKObjectType.workoutType()
        guard (try? await store.requestAuthorization(toShare: [], read: [type])) != nil else { isLoading = false; return }

        let predicate = HKQuery.predicateForWorkouts(with: .cycling)
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
