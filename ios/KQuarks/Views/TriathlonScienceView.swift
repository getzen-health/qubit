import SwiftUI
import HealthKit

struct TriathlonScienceView: View {
    @State private var totalSwimKm: Double = 0
    @State private var totalBikeKm: Double = 0
    @State private var totalRunKm: Double = 0
    @State private var brickWorkouts: Int = 0
    @State private var isLoading = true
    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Stats Row
                HStack(spacing: 12) {
                    statCard(value: String(format: "%.0f", totalSwimKm), label: "Swim km", color: .cyan)
                    statCard(value: String(format: "%.0f", totalBikeKm), label: "Bike km", color: .blue)
                    statCard(value: String(format: "%.0f", totalRunKm), label: "Run km", color: .orange)
                }
                .padding(.horizontal)

                HStack(spacing: 12) {
                    statCard(value: "\(brickWorkouts)", label: "Bricks", color: .purple)
                    statCard(value: volumeRatio, label: "S:B:R", color: .green)
                    statCard(value: dominantDiscipline, label: "Focus", color: .teal)
                }
                .padding(.horizontal)

                // Science Cards
                scienceCard(
                    title: "Multi-Sport Physiology & Brick Adaptation",
                    icon: "figure.run",
                    color: .blue,
                    rows: [
                        sciRow(stat: "Swim→Bike VO₂ 12% higher",
                               detail: "Buchheit 2010: pool swim elevates cardiac output, increasing early bike VO₂ by ~12% vs. fresh-leg cycling. Horizontal body position shifts venous return."),
                        sciRow(stat: "Bike→Run: 'Dead legs' 90–120s",
                               detail: "Hausswirth 1997: quadricep recruitment drops 8–15% in first 2 km after cycling. Brick training reduces transition dysfunction via motor pattern co-activation (Millet 2000)."),
                        sciRow(stat: "Glycogen depletion cascade",
                               detail: "O'Toole 1989 (Ironman): post-race muscle glycogen near zero; fat oxidation climbs from 40% (swim) to 70%+ (late run). CHO intake 60–90 g/h critical on bike."),
                        sciRow(stat: "VO₂max utilization by discipline",
                               detail: "Etxebarria 2014: elite triathletes swim at 79%, bike at 73%, run at 82% of VO₂max. Run economy worsens 2–3% after cycling; brick training cuts this to <1% (Cala 2009).")
                    ]
                )

                scienceCard(
                    title: "Swim Biomechanics & Open-Water Dynamics",
                    icon: "water.waves",
                    color: .cyan,
                    rows: [
                        sciRow(stat: "Wetsuit buoyancy: +4–8% velocity",
                               detail: "Toussaint 1989: neoprene wetsuits reduce drag 14% via improved body position. FINA/World Triathlon legal in water ≤24.6°C. Hip elevation reduces frontal area 12–18%."),
                        sciRow(stat: "Drafting saves 11–18% energy",
                               detail: "Chatard 1990: swimming 0.5 m behind lead swimmer reduces drag by 11–18%; allows 7% higher sustainable pace. Elite OWS and triathlon drafting legal; pack swimming tactics critical."),
                        sciRow(stat: "Bilateral breathing & asymmetry",
                               detail: "Seifert 2007: breathing pattern shifts under fatigue — elite triathletes maintain stroke length within 3% across 1500 m. Head position for sighting costs 0.03–0.08 s/stroke cadence."),
                        sciRow(stat: "Pacing: negative-split strategy",
                               detail: "Renfree 2013: optimal triathlon swim pacing is even or slightly negative (last 400 m faster). Going 5% too hard in first 400 m elevates blood lactate 1.5 mmol/L extra at T1.")
                    ]
                )

                scienceCard(
                    title: "Cycling Pacing, Power & Aerodynamics",
                    icon: "figure.outdoor.cycle",
                    color: .green,
                    rows: [
                        sciRow(stat: "Optimal bike power: 70–75% FTP",
                               detail: "Laursen 2012: Ironman run performance best predicted by bike power held at 68–72% FTP. Every 5% over target watt: 4–7 min slower Ironman marathon (Hausswirth 2010)."),
                        sciRow(stat: "Aero position saves 60–90 W at 40 km/h",
                               detail: "Martin 1998: aerodynamic drag accounts for 90% of resistance at 40 km/h. TT position vs. road position: 60–90 W difference. Frontal area reduction 10 cm² ≈ 1 min saved per 40 km."),
                        sciRow(stat: "Cadence: 85–95 RPM for run preservation",
                               detail: "Vercruyssen 2005: higher cycling cadence (95 RPM vs. 75 RPM) reduces subsequent 10 km run time by ~45 s via preserved neuromuscular function. High cadence shifts metabolic stress to cardiovascular."),
                        sciRow(stat: "Hydration: 750–1,000 mL/h on bike",
                               detail: "Fudge 2008: 2% body weight dehydration = 3–5% cycling power reduction. Bike provides best hydration window — aero bottles, bento boxes. Running with fluid bottles adds 0.5–0.8% mechanical cost.")
                    ]
                )

                scienceCard(
                    title: "Run Performance & Race Strategy",
                    icon: "figure.run",
                    color: .orange,
                    rows: [
                        sciRow(stat: "T-Run pace 10–15 s/km slower than standalone",
                               detail: "Millet 2011: triathlon run RPE matches standalone run 30 s/km faster — physiological cost identical, perceived effort magnified. Elite Ironman marathon ~2:45–3:00; standalone equivalent >2:30."),
                        sciRow(stat: "Muscle damage: 3× higher vs. fresh run",
                               detail: "Millet 2000: post-triathlon CK levels 3× higher than post-marathon alone. Cycling-induced eccentric damage compromises run biomechanics. Training adaptation: 16-week brick-specific block (Etxebarria 2019)."),
                        sciRow(stat: "Optimal T2 transition: <90 s elite",
                               detail: "Vleck 2008 ITU World Cup: median T2 = 24 s elite, 45 s age-group. Cognitive load of transition planning: pre-race mental rehearsal cuts errors 40% (MacMahon 2007). Rack position knowledge critical."),
                        sciRow(stat: "Gut issues: 30–50% of Ironman athletes",
                               detail: "Pfeiffer 2012: GI distress peaks in Ironman run — 30–50% prevalence. High-fructose gels during bike prime gut for run absorption. Solid food on bike tolerated; gels only on run. Train gut in long bricks.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Triathlon Science")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
    }

    private var volumeRatio: String {
        let total = totalSwimKm + totalBikeKm + totalRunKm
        guard total > 0 else { return "—" }
        let s = Int(totalSwimKm / total * 10)
        let b = Int(totalBikeKm / total * 10)
        let r = Int(totalRunKm / total * 10)
        return "\(s):\(b):\(r)"
    }

    private var dominantDiscipline: String {
        if totalBikeKm > totalRunKm && totalBikeKm > totalSwimKm { return "Bike" }
        if totalRunKm > totalSwimKm { return "Run" }
        return "Swim"
    }

    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let types: Set<HKObjectType> = [HKObjectType.workoutType()]
        guard (try? await store.requestAuthorization(toShare: [], read: types)) != nil else { isLoading = false; return }
        let now = Date()
        let start = Calendar.current.date(byAdding: .weekOfYear, value: -16, to: now)!
        let predicate = HKQuery.predicateForSamples(withStart: start, end: now)
        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: .workoutType(), predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                cont.resume(returning: (samples as? [HKWorkout]) ?? [])
            }
            store.execute(q)
        }
        var swim = 0.0, bike = 0.0, run = 0.0, bricks = 0
        // Find brick pairs: bike followed by run (or run→bike) within 4 hours
        for w in workouts {
            let km = w.totalDistance?.doubleValue(for: .meterUnit(with: .kilo)) ?? 0
            switch w.workoutActivityType {
            case .swimming: swim += km
            case .cycling: bike += km
            case .running: run += km
            case .swimBikeRun: swim += km * 0.06; bike += km * 0.55; run += km * 0.39
            default: break
            }
        }
        // Count brick workouts (bike+run same day within 4h)
        let bikeWorkouts = workouts.filter { $0.workoutActivityType == .cycling }
        let runWorkouts = workouts.filter { $0.workoutActivityType == .running }
        for b in bikeWorkouts {
            for r in runWorkouts {
                let gap = r.startDate.timeIntervalSince(b.endDate)
                if gap > 0 && gap < 4 * 3600 { bricks += 1; break }
            }
        }
        await MainActor.run {
            totalSwimKm = swim; totalBikeKm = bike; totalRunKm = run; brickWorkouts = bricks
            isLoading = false
        }
    }

    private func statCard(value: String, label: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.system(.title2, design: .rounded, weight: .bold))
                .foregroundColor(color)
            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(10)
    }

    private func scienceCard(title: String, icon: String, color: Color, rows: [AnyView]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Label(title, systemImage: icon)
                .font(.headline)
                .foregroundColor(color)
            ForEach(Array(rows.enumerated()), id: \.offset) { _, row in row }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
        .padding(.horizontal)
    }

    private func sciRow(stat: String, detail: String) -> AnyView {
        AnyView(VStack(alignment: .leading, spacing: 3) {
            Text(stat).font(.subheadline).fontWeight(.semibold)
            Text(detail).font(.caption).foregroundColor(.secondary).fixedSize(horizontal: false, vertical: true)
        })
    }
}
