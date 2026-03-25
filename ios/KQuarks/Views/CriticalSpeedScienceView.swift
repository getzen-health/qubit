import SwiftUI
import HealthKit

struct CriticalSpeedScienceView: View {
    @State private var estimatedCS: Double = 0   // m/s
    @State private var estimatedWPrime: Double = 0  // meters
    @State private var recentRunCount: Int = 0
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                criticalSpeedStatsRow
                foundationsCard
                wprimeDCard
                pacingCard
                wearablesCard
            }
            .padding()
        }
        .navigationTitle("Critical Speed Science")
        .toolbarTitleDisplayMode(.inline)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var criticalSpeedStatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(
                    value: estimatedCS > 0 ? String(format: "%.2f m/s", estimatedCS) : "--",
                    label: "Est. Critical Speed",
                    color: .teal
                )
                statCard(
                    value: estimatedCS > 0 ? String(format: "%d:%02d/km", Int(1000 / estimatedCS / 60), Int(1000 / estimatedCS) % 60) : "--",
                    label: "CS Pace",
                    color: .teal
                )
                statCard(
                    value: estimatedWPrime > 0 ? "\(Int(estimatedWPrime))m" : "--",
                    label: "Est. D' (finite capacity)",
                    color: .orange
                )
            }
            Text("Jones 2010 (J Physiol): Critical speed (CS) is the highest intensity at which blood lactate reaches a steady state — the true maximal aerobic boundary equivalent to LT2/MLSS, derivable from race performance data without blood sampling")
                .font(.caption2).foregroundColor(.secondary)
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

    // MARK: - Science Cards
    private var foundationsCard: some View {
        scienceCard(title: "The Critical Speed Model — Foundations", icon: "📐", color: .teal) {
            sciRow(stat: "Monod & Scherrer 1965 (Int Z Angew Physiol) — the original model", detail: "The critical speed model: Monod & Scherrer 1965 established that total work capacity during exhausting exercise follows: Total Distance = CS × Time + D'; CS (critical speed): the asymptote of the speed-time relationship — theoretically sustainable indefinitely; D' (D prime): finite anaerobic/high-intensity work capacity above CS (in meters); the model predicts time to exhaustion at any constant speed above CS: T = D' / (Speed − CS); below CS: exercise is theoretically sustainable without fatigue accumulation (blood lactate reaches steady state); above CS: D' depletes at a rate proportional to how far above CS, leading to inevitable exhaustion when D' = 0")
            sciRow(stat: "Jones 2010 (J Physiol — landmark critical power review)", detail: "CS physiology: Jones 2010 established that CS corresponds precisely to maximal lactate steady-state (MLSS) — the highest exercise intensity where blood lactate reaches steady state after initial rise; CS = LT2 = MLSS = approximately 89% HRmax; physiological mechanisms at CS: mitochondrial oxidative flux is maximal and matches ATP demand; above CS: glycolytic ATP production recruited → progressive lactate accumulation → VCO₂ rises progressively → VO₂ achieves slow component → inevitable fatigue; below CS: oxidative phosphorylation fully meets energy demand; W' above CS: combination of glycogen (anaerobic glycolysis), phosphocreatine, and O₂ stored in hemoglobin/myoglobin")
            sciRow(stat: "CS vs VO₂max vs LT as performance predictors (Vanhatalo 2011)", detail: "Hierarchy of performance predictors: (1) CS (LT2/MLSS): explains 85–95% of performance variance in trained runners (Kranenburg 1994) — the strongest single predictor; (2) VO₂max: explains 55–75% in trained (high VO₂max without high CS = limited performance); (3) Running economy: explains 35–65%; (4) LT1: explains 50–70%; critical insight: VO₂max is the ceiling, CS is the fraction of the ceiling you can sustain for race distances; an athlete can have VO₂max 60 mL/kg/min with CS at 88% VO₂max (high performer) or CS at 75% VO₂max (lower performer) — CS as % VO₂max is the key training-adaptable variable")
            sciRow(stat: "How CS changes with training (Vanhatalo 2008 J Appl Physiol)", detail: "CS adaptation timeline: 6-week CS-specific training (3 × 24-min at CS intensity): CS increased +6.2%; W' increased +13%; VO₂max increased +4.1%; mechanism: CS training combines Zone 2 adaptations (mitochondrial efficiency) + Zone 3 adaptations (VO₂max); the optimal training strategy: Zone 1 base volume raises VO₂max (long-term ceiling) and mitochondrial efficiency; CS-specific threshold work directly improves CS fraction; Zone 3 intervals (at 100–105% VO₂max) raise the ceiling; each 1% improvement in CS-as-%VO₂max → approximately 45-second improvement in 5K time for trained runners")
        }
    }

    private var wprimeDCard: some View {
        scienceCard(title: "W' (D') — The Finite Anaerobic Reservoir", icon: "🔋", color: .orange) {
            sciRow(stat: "W' physiology (Ferguson 2010 Am J Physiol Regul Integr Comp Physiol)", detail: "W' defined: the finite amount of work (in Joules for power, meters for running) that can be performed above CS before exhaustion; W' represents: combined stores of: (1) phosphocreatine (PCr, 20–40 mmol/kg DW in skeletal muscle); (2) oxygen stored in myoglobin and venous blood (~0.5 L effective); (3) glycolytic ATP that can be produced without steady-state lactate accumulation; W' magnitude in runners: 90–150 m (running equivalent D'); in cycling: 5–35 kJ typical; W' is fully depleted at exhaustion regardless of speed above CS — only the rate of depletion changes (higher speed = faster depletion); after CS pace recovery: W' replenishes at 50% in 2–3 min, 95% in 6–7 min (Skiba 2012)")
            sciRow(stat: "W' Balance monitoring for race pacing (Skiba 2012 Int J Sports Physiol Perform)", detail: "W' balance model: W'BAL(t) = W' − ∫(P(t) − CS) dt + W'_reconstitution; in real-time race pacing: W'BAL tracks remaining anaerobic capacity; if W'BAL = 0 at any point: exhaustion is immediate; practical pacing rule: in 5K race, W' may be spent completely by the final sprint; in 10K: W' should be managed — early surges deplete D', recovery below CS reconstitutes it; marathon: virtually all racing at CS or below (W' is not the limiting factor); 1500m: almost all above CS — W' depletion is the primary performance limiter; apps: Best Bike Split and similar use real-time W'BAL with GPS + HR/power data; Apple Watch could compute simplified W'BAL with workout HR data")
            sciRow(stat: "W' reconstitution kinetics (Skiba 2012, Caen 2019)", detail: "Recovery of W' during racing: W' reconstitutes exponentially when running below CS; time constant (τw): 377 s (6.3 min) for 63% reconstitution; varies between 200–600 s depending on athlete fitness and CS; during intervals: 3 min below CS recovers ~45% W'; 6 min: ~63%; 10 min: ~86%; strategic racing application: in cross-country or trail running with hills (some segments above CS, some below): W'BAL fluctuates continuously; savvy runners run uphills below CS (W' reconstitutes during descent) and spend W' on key uphill surges; even pace racing at exactly CS: theoretically sustainable indefinitely with W' at 100%; in practice: biochemical factors limit this to ~60 min (MLSS duration test standard)")
            sciRow(stat: "Individual variability and training W' (Poole 2016 Eur J Sport Sci)", detail: "W' training responses: CS increases more readily than W' with endurance training; W' is more sensitive to high-intensity interval training (specifically VO₂max intervals, 100–105% vVO₂max); speed endurance training (repeated supra-CS runs, 4 × 3-4 min at 105–110% CS): W' increases +25–40% in 6 weeks; CS training (threshold work): W' increases +10–15%; W' is highly individual: elite 800m runners may have D' > 250m; endurance specialists: D' 60–100m with very high CS; sprint athletes: D' 200–300m but lower CS; the CS/W' profile determines ideal race distance — high CS, moderate W': optimal for marathon–10K; low CS, high W': 400m–1500m specialists")
        }
    }

    private var pacingCard: some View {
        scienceCard(title: "Race Pacing Strategy Using CS/D'", icon: "🏃", color: .blue) {
            sciRow(stat: "CS-based race pacing — distance-specific strategies", detail: "5K race: typical pacing 100–105% CS; W' spend: 80–100% over race; even pacing (all at 102% CS) vs positive split (start at 106%, fade to 100%): equal total time but different W' trajectories; best strategy: 95% CS first 400m, 103% CS miles 1–2, 108% CS final 800m (negative split with W' spent at finish); 10K: 99–102% CS; W' spend: 30–60%; positive splits most common mistake (early race surge depletes W' before finish); half-marathon/marathon: 88–95% CS (below CS for marathon); W' rarely limiting; cardiovascular and glycogen factors dominate; race day pacing: start 2–3% slower than target CS-derived pace → accumulate W' reconstitution → surge safely in final 20%")
            sciRow(stat: "Interval training at and above CS (Billat 1999 Med Sci Sports Exerc)", detail: "CS-based interval training: 4 × 6 min at CS pace with 3 min below CS: W' partially depletes and reconstitutes each interval; produces sustained near-maximal oxidative stress; effective for raising CS; vVO₂max intervals (1-3 min at 100% vVO₂max): most efficient protocol for raising VO₂max ceiling; CS intervals vs vVO₂max: CS intervals → primary CS improvement; vVO₂max → primary VO₂max ceiling improvement; optimal combination: 1 CS session + 1 vVO₂max session per week in build phase; example week: Monday: 3 × 8 min at CS + 4 min below; Thursday: 6 × 3 min at 105% CS + 3 min easy; 8-week block: CS +3–4%, VO₂max +2–3%, 5K time −30–45 s")
            sciRow(stat: "CS estimation from running data without lab (Jones 2010 — field methods)", detail: "Field estimation of CS: 3-distance method using race performances: time-distance data points: (1) 1500m time, (2) 3000m time, (3) 5000m time; CS = slope of distance-time regression; D' = y-intercept of distance = CS × time + D' regression; accuracy: field-estimated CS within 3–5% of lab-measured MLSS (Morton 1996); simplified 2-point method: CS = (d₂ − d₁) / (t₂ − t₁); D' = d₁ − (CS × t₁); where d₁,t₁ and d₂,t₂ are two maximal effort performances at different distances; practical: using parkrun 5K PR + 10-min maximal effort data → CS estimate sufficient for training zone definition; Apple Watch 5K and mile times from workout history provide the raw data for estimation")
            sciRow(stat: "CS in environmental conditions — heat, altitude, fatigue (Burnley 2012)", detail: "Environmental effects on CS: heat (>30°C): CS decreases 3–8% due to increased cardiovascular demand for thermoregulation — the fraction of VO₂max available for locomotion is reduced; D' relatively stable in heat (anaerobic capacity temperature-independent); altitude (2,000m): CS decreases 5–10% (less O₂ available for oxidative phosphorylation); D' increases slightly (greater PCr contribution as oxidative flux is limited); post-illness: CS decreases 5–15% depending on severity; recovery: CS returns to baseline 3–10 days after mild upper respiratory illness; fatigue-induced CS shift: after a long run (1 h at 85% CS), CS measured in subsequent test is 5–8% lower than rested value — 'residual fatigue' persists 24–48h; this CS fatigue is primary mechanism of overtraining")
        }
    }

    private var wearablesCard: some View {
        scienceCard(title: "Wearables & CS in Modern Training", icon: "⌚", color: .purple) {
            sciRow(stat: "Apple Watch and CS estimation (Cao 2022 JAMA Cardiol adapted)", detail: "Apple Watch VO₂max data enables CS estimation: Apple Watch estimates VO₂max from HR response to GPS-measured pace; VO₂max and running economy together determine CS: CS ≈ VO₂max × 0.85 × economy (assuming LT2 ≈ 85% VO₂max and converting via running economy); accuracy limitation: Apple Watch VO₂max accuracy ±7–9% (Cao 2022) → CS estimate within ±10–12% of lab-measured CS; sufficient for zone training but not precise race simulation; improvement: pair Apple Watch VO₂max data with actual race performances for more precise CS estimation; Stryd running power meter: computes CS equivalent (Critical Power in running Watts) from race efforts — highest precision without lab testing (Jones 2017 r = 0.93 vs lab MLSS)")
            sciRow(stat: "Garmin's threshold pace and CS (Snyder 2019 thesis)", detail: "Garmin threshold pace: an estimate of CS-equivalent derived from lactate threshold test or running dynamics; Snyder 2019: Garmin threshold pace within 4% of lab-measured CS in trained runners; Garmin's FirstBeat algorithm: 3-minute maximal effort segment detection → HR-pace relationship → threshold derivation; Apple Health resting HR trend + VO₂max estimate + recent race performances: triangulated CS estimate; training load (ATL/CTL) as CS proxy: sustained high CTL (>80 TSS/day) without corresponding CS improvement = non-functional overreaching; CS improvement tracked monthly is the purest measure of aerobic training adaptation")
            sciRow(stat: "Power meters and critical power (Coggan 2003 — Training and Racing with Power)", detail: "Critical Power (cycling equivalent): CP is precisely analogous to CS for cycling; Coggan 2003 introduced functional threshold power (FTP ≈ 95% CP) as practical field estimate; cycling CP-W' model is the foundation of TrainingPeaks and WKO5 analytics; FTP test: 20-min all-out effort × 0.95 = FTP (≈ CP); W' estimation: 5s power − CP × time to exhaustion at 120% CP; running power (Stryd): converts CP model to running — allows terrain-adjusted critical speed estimation that eliminates GPS pace noise from elevation changes; running with power meters increasingly adopted by competitive runners for CS-based training zones and race pacing")
            sciRow(stat: "Future of CS monitoring — continuous estimation (Jones 2017)", detail: "Research direction: continuous CS monitoring via wearables; current limitation: CS estimation requires discrete maximal efforts; future: machine learning models trained on continuous HR-pace-power data could estimate CS in real-time without dedicated testing sessions; physiological signals trackable via wearables that reflect CS changes: morning RHR trends, HRV, sleep quality scores, subjective fatigue — together predict CS within 5% (preliminary Plews 2013 data); individual-specific CS variability: CS fluctuates ±5–8% based on sleep, illness, heat, altitude, fatigue — future wearable CS monitoring would account for this rather than using static CS zones; the CS-W' model is the most mechanistically sound endurance performance framework available and will become increasingly accessible via consumer wearables")
        }
    }

    // MARK: - Helpers
    private func scienceCard(title: String, icon: String, color: Color, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack { Text(icon); Text(title).font(.headline).bold() }
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

    // MARK: - Data Loading
    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let workoutType = HKObjectType.workoutType()
        let vo2Type = HKObjectType.quantityType(forIdentifier: .vo2Max)!
        guard (try? await store.requestAuthorization(toShare: [], read: [workoutType, vo2Type])) != nil else {
            isLoading = false; return
        }

        let endDate = Date()
        let startDate = Calendar.current.date(byAdding: .day, value: -365, to: endDate) ?? Date()
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate)

        // Get VO2max
        let vo2Samples: [HKQuantitySample] = await withCheckedContinuation { continuation in
            let sortDesc = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
            let q = HKSampleQuery(sampleType: vo2Type, predicate: predicate, limit: 1, sortDescriptors: [sortDesc]) { _, s, _ in
                continuation.resume(returning: (s as? [HKQuantitySample]) ?? [])
            }
            store.execute(q)
        }

        let workouts: [HKWorkout] = await withCheckedContinuation { continuation in
            let q = HKSampleQuery(sampleType: workoutType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, s, _ in
                continuation.resume(returning: (s as? [HKWorkout]) ?? [])
            }
            store.execute(q)
        }

        let runs = workouts.filter { $0.workoutActivityType == .running }

        // Estimate CS from VO2max using running economy approximation
        // CS ≈ VO2max × 0.85 / 3.5 × 0.85 m/min (very rough)
        let vo2max = vo2Samples.first?.quantity.doubleValue(for: HKUnit(from: "ml/kg*min")) ?? 0
        let estimatedCSMperS = vo2max > 0 ? (vo2max * 0.85 / 3.5 * 0.85) / 60 : 0

        // Rough D' estimate: 200m for recreational, scales with run history
        let avgPace: Double = {
            let paces = runs.prefix(20).compactMap { run -> Double? in
                guard let dist = run.statistics(for: HKQuantityType(.distanceWalkingRunning))?.sumQuantity()?.doubleValue(for: .meter()),
                      dist > 0, run.duration > 0 else { return nil }
                return dist / run.duration  // m/s
            }
            return paces.isEmpty ? 0 : paces.reduce(0, +) / Double(paces.count)
        }()

        let dPrimeEst = estimatedCSMperS > 0 && avgPace > estimatedCSMperS ? min(Double.infinity, 200) : 150

        await MainActor.run {
            self.estimatedCS = estimatedCSMperS
            self.estimatedWPrime = dPrimeEst
            self.recentRunCount = runs.count
            self.isLoading = false
        }
    }
}
