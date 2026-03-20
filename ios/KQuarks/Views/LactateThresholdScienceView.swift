import SwiftUI
import HealthKit

struct LactateThresholdScienceView: View {
    @State private var estimatedLT2HR: Double = 0  // ~89% HRmax
    @State private var estimatedLT1HR: Double = 0  // ~77% HRmax
    @State private var maxHR: Double = 0
    @State private var recentRunCount: Int = 0
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                lactateStatsRow
                physiologyCard
                measurementCard
                trainingZonesCard
                improvementCard
            }
            .padding()
        }
        .navigationTitle("Lactate Threshold Science")
        .navigationBarTitleDisplayMode(.large)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var lactateStatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(
                    value: estimatedLT2HR > 0 ? "\(Int(estimatedLT2HR)) bpm" : "--",
                    label: "Est. LT2 (anaerobic)",
                    color: .orange
                )
                statCard(
                    value: estimatedLT1HR > 0 ? "\(Int(estimatedLT1HR)) bpm" : "--",
                    label: "Est. LT1 (aerobic)",
                    color: .green
                )
                statCard(
                    value: recentRunCount > 0 ? "\(recentRunCount)" : "--",
                    label: "Runs (8 wk)",
                    color: .blue
                )
            }
            Text("Faude 2009 (Sports Med): LT2 (anaerobic threshold / MLSS) is the single strongest predictor of endurance performance — stronger than VO₂max or running economy in trained athletes")
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
    private var physiologyCard: some View {
        scienceCard(title: "Lactate Physiology & The Two Thresholds", icon: "🔬", color: .orange) {
            sciRow(stat: "Wasserman 1964 (J Appl Physiol) + Beaver 1986 (J Appl Physiol)", detail: "Lactate physiology: lactate is NOT a waste product — it is a primary metabolic fuel; produced continuously even at rest; at low intensities, lactate produced by fast-twitch fibers is immediately cleared by slow-twitch fibers and cardiac muscle via MCT (monocarboxylate transporter) shuttling; LT1 (aerobic threshold / first threshold): intensity at which lactate begins to accumulate above resting levels (~2 mmol/L); corresponds to 'conversational pace'; below LT1: fat oxidation dominant, lactate cleared as fast as produced; LT2 (anaerobic threshold / second threshold): intensity at which lactate clearance cannot match production (~4 mmol/L) — the maximal lactate steady-state (MLSS)")
            sciRow(stat: "Faude 2009 (Sports Med review)", detail: "LT2 as performance predictor: in trained runners, LT2 HR explains 91% of marathon time variance — superior to VO₂max alone (81%) or running economy alone (76%); the pace you can sustain at LT2 (4 mmol/L lactate) is the physiological basis of half-marathon to marathon race pace; LT2 pace estimation: in trained runners, LT2 corresponds to ~88–92% HRmax (Midgley 2006); in recreational runners: 83–87% HRmax; the gap between LT1 and LT2 represents the 'threshold zone' — training in this zone improves both thresholds simultaneously; threshold training pace: 20–60 min at 'comfortably hard' (RPE 15–16 on Borg 6–20 scale)")
            sciRow(stat: "Seiler 2010 (Int J Sports Physiol Perform)", detail: "The three-zone model: elite endurance athletes worldwide use a consistent 3-zone model based on two thresholds; Zone 1: below LT1 (<77% HRmax) — easy, conversational; Zone 2: LT1 to LT2 (77–89% HRmax) — tempo/threshold; Zone 3: above LT2 (>89% HRmax) — VO₂max intervals; 80/20 training distribution: elite runners perform ~80% volume in Zone 1, ~5% in Zone 2, ~15% in Zone 3; most recreational runners train too much in Zone 2 (too hard for easy, too easy for hard) — the 'black hole' of training that stresses the system without providing optimal adaptations; polarized training distributes effort between extremes")
            sciRow(stat: "Jones 2010 (J Physiol — critical power)", detail: "Critical speed and LT2 relationship: Critical Speed (CS) is the highest exercise intensity at which blood lactate can reach a steady state — mathematically equivalent to LT2/MLSS; CS derived from pace-distance relationship without blood sampling; CS estimation from running data: CS = 3,000m pace / 1.05 (within 3–5% of lab-measured LT2 pace); above CS: W' (finite anaerobic work capacity) depletes; W' can be replenished only by dropping below CS; strategic pacing: staying below CS in early race preserves W' for the final sprint; the CS model explains why pacing strategy matters more at shorter race distances (W' becomes limiting) and LT2 matters more at marathon distance")
        }
    }

    private var measurementCard: some View {
        scienceCard(title: "Measuring & Estimating Lactate Threshold", icon: "📊", color: .blue) {
            sciRow(stat: "Gold standard: incremental exercise test with blood lactate (Heck 1985)", detail: "Lab measurement: incremental treadmill test at 1 km/h increments every 3–5 min; fingertip blood draw at each stage (25–50 μL); lactate measured via enzymatic assay (YSI 2300 or similar); LT1 identified as first sustained rise above baseline; LT2/MLSS: separate 30-min constant-intensity validation runs at candidate intensities (MLSS = highest intensity where lactate rises <1 mmol/L across final 20 min); gold standard MLSS testing requires 3–5 separate sessions; estimated cost: $200–500 in sports physiology lab; accuracy: within-session CV 3.5% for MLSS HR; across-session reproducibility excellent (ICC > 0.95)")
            sciRow(stat: "Field estimation methods — Conconi & talk test", detail: "Field alternatives to blood lactate: (1) Conconi 1982 deflection point: HR vs speed normally linear; LT2 = speed at which HR deflection (plateau) appears; sensitivity 60–80% — less reliable than blood; (2) Talk test (Foster 2008): LT1 ≈ pace at which maintaining speech becomes difficult; LT2 ≈ pace at which speech fragments to 1–2 word phrases; sensitivity for LT1 = 92%, LT2 = 87% vs blood lactate; (3) 3,000m time trial estimation: LT2 pace ≈ 3,000m race pace × 1.10 (for trained runners); (4) 30-min time trial HR average: LT2 HR ≈ average HR during 30-min all-out effort (Thomas 2008 — average HR within 3 bpm of MLSS HR)")
            sciRow(stat: "Apple Watch and wearable LT estimation", detail: "Wearable-based estimation: Apple Watch VO₂max and HRmax data enables LT zone estimation; LT2 HR = 0.89 × HRmax ± 5 bpm (Midgley 2006 correlation); LT1 HR = 0.77 × HRmax ± 7 bpm; Stryd (running power meter) estimates CP (critical power) and W' from race performance data — correlates r = 0.93 with lab-measured CS (Jones 2017); Garmin LT detection: accelerometer-based 'threshold pace' feature detects the pace at which running economy changes — validated within 4% of lab LT2 (Snyder 2019 thesis); Apple Health resting HR trend combined with 5K-10K race times provides LT2 pace estimation accurate to ±8–12 s/km")
            sciRow(stat: "HRV and lactate threshold (Buchheit 2007)", detail: "HRV-based threshold detection: Buchheit 2007 (Eur J Appl Physiol): HRV4Training method applies DFA-α1 (detrended fluctuation analysis of RR intervals) to detect thresholds; DFA-α1 > 0.75 = below LT1 (fractal HRV, healthy autonomic complexity); DFA-α1 = 0.5–0.75 = LT1–LT2 range; DFA-α1 < 0.5 = above LT2 (anti-correlated HRV, typical of supramaximal intensity); Polar H10 chest strap records RR intervals enabling DFA-α1 calculation; apps (Fatmaxxer, HRV Logger) perform real-time DFA analysis; accuracy: DFA-α1 threshold corresponds to blood lactate LT within ±4 bpm (Rogers 2021 Sports Med); non-invasive continuous threshold monitoring during training")
        }
    }

    private var trainingZonesCard: some View {
        scienceCard(title: "Training Zones Based on Lactate Thresholds", icon: "🎯", color: .green) {
            sciRow(stat: "Zone 1 — below LT1 (< ~77% HRmax): aerobic base", detail: "Zone 1 characteristics: fat oxidation rate maximized (Achten 2003: fat max = 67% VO₂max ≈ 72% HRmax); lactate: 0.8–2.0 mmol/L; RPE 9–12; 'could sustain for hours'; physiological adaptations: mitochondrial biogenesis, capillary density increase, slow-twitch fiber enzyme upregulation, fat oxidation capacity; this zone should comprise 75–80% of training volume in polarized periodization; failure mode: athletes make Zone 1 too hard (drift into Zone 2) — check: can hold full conversation effortlessly? Apple Watch: Zone 1 = warm green in heart rate zones; for most people Zone 1 upper boundary ≈ 120–130 bpm at rest, 140–145 bpm endurance-trained")
            sciRow(stat: "Zone 2 — LT1 to LT2 (~77–89% HRmax): threshold zone", detail: "Zone 2 characteristics: lactate 2–4 mmol/L; RPE 13–15; 'comfortably hard' — full sentences difficult; traditional 'tempo' training; used strategically in polarized models (only 5–10% of volume) or heavily in pyramidal models (15–20%); adaptations: raises LT1 and LT2 simultaneously; increases LT2 pace in trained athletes most effectively; Billat 2003 (J Sports Sci): 20–40 min threshold runs at LT2 pace are the primary zone for competitive improvement once aerobic base established; commonly called 'cruise intervals' when done in 3×10 min segments; too much Zone 2 = accumulated fatigue without the Zone 3 high-intensity stimulus for VO₂max development (the 'black hole' effect)")
            sciRow(stat: "Zone 3 — above LT2 (>89% HRmax): VO₂max zone", detail: "Zone 3 characteristics: lactate > 4–6 mmol/L; RPE 16–20; only sustainable 15–60 min maximum; adaptations: VO₂max elevation, maximal cardiac output increase, fast-twitch fiber oxidative capacity; key Zone 3 protocols: (1) Helgerud 4×4 (4 min at 90–95% HRmax, 3-min active recovery × 4): +13% VO₂max in 8 weeks (Helgerud 2007 Med Sci Sports Exerc); (2) Billat vVO₂max intervals (1 min at 100% VO₂max pace, 1 min rest × 10–15): maximum VO₂max stimulus; (3) 5×5 min at 95% HRmax with 2.5-min recovery; prescription: 1–2 Zone 3 sessions per week; more causes non-functional overreaching within 3–4 weeks (Seiler 2010 Scandinavian evidence)")
            sciRow(stat: "LT-based race pacing — the performance translation", detail: "Race pace translation from thresholds: 5K: ~95–105% of LT2 pace (above anaerobic threshold — W' depletes during race); 10K: ~98–102% of LT2 pace (just at/above LT2); half-marathon: ~96–99% of LT2 pace; marathon: ~90–95% of LT2 pace (below LT2 — sustainable for 3–4 hours); ultramarathon: LT1 pace (at aerobic threshold — fat oxidation maintained); practical: measure your LT2 HR via 30-min time trial → apply percentages to target HR ranges for races; Apple Watch HR zones display during workouts enables real-time pacing at target threshold zones; Garmin 'threshold pace' displayed in real-time — maintain pacing within ±5 s/km of target threshold pace")
        }
    }

    private var improvementCard: some View {
        scienceCard(title: "Improving Lactate Threshold", icon: "📈", color: .purple) {
            sciRow(stat: "Threshold training efficacy (Laursen 2002 Sports Med review)", detail: "How thresholds improve: LT1 improves with increased mitochondrial enzyme capacity (citrate synthase, β-HAD) — responds best to Zone 1 volume; LT2 improves with specific threshold work — responds best to LT2-pace training (Zone 2); VO₂max improvements raise the ceiling that LT2 can approach (LT2 as % VO₂max is relatively fixed at ~85–90% VO₂max); improvement timeline: LT1 detectable in 3–4 weeks; LT2 HR improvement: 8–12 weeks of consistent threshold training; LT2 as % HRmax rarely changes dramatically — improvements manifest as higher LT2 pace at same HR; typical trained runner improves LT2 pace 3–8% with a focused 12-week training block")
            sciRow(stat: "Specific LT2 training prescriptions (Billat 2003 J Sports Sci)", detail: "Optimal LT2 training volume: minimum effective dose: 20 min at LT2 pace 2×/week; optimal: 40–60 min LT2 pace distributed across 1–2 sessions/week; common formats: (1) Continuous 20–40 min tempo run at LT2 pace; (2) 2×20 min or 3×15 min with 2–3 min recovery (cruise intervals); (3) 4×8 min at LT2+5 s/km with 90 s rest; progression: increase duration before increasing intensity; reduce LT2 training volume 40% in weeks preceding target race (Mujika 2003 'tapering'); LT2-pace training simultaneously improves aerobic enzyme capacity, LT2 HR, and specific neuromuscular economy at race pace")
            sciRow(stat: "Altitude training and LT elevation (Gore 2013 Br J Sports Med)", detail: "Altitude effects on LT: at 2,000–2,500m altitude, blood lactate at given absolute workload decreases (due to reduced O₂ delivery reducing maximal absolute effort); LT as % VO₂max remains constant; after altitude camp (2–3 weeks, 2,400–2,800m) and sea-level return: EPO-mediated hemoglobin mass increase (+4–6%) raises VO₂max → LT2 pace improves 3–5% (Stray-Gundersen 1992); live-high-train-low (LHTI) is most effective: sleep at altitude, train at sea level; available via altitude tents (normobaric hypoxia, 14.5–15.4% O₂) — simulates 2,400–2,800m; evidence for altitude tent efficacy vs natural altitude mixed but significant effects in trained athletes (Chapman 1998 J Appl Physiol)")
            sciRow(stat: "LT in masters athletes and aging (Wilson 2000 Br J Sports Med)", detail: "Aging and lactate threshold: LT2 as % VO₂max is remarkably stable across age — masters runners maintain the same ~85–90% LT2/VO₂max ratio as younger runners; however, absolute LT2 pace declines due to: (1) VO₂max decline 0.7–1% per year after 35 (reduced cardiac output, hemoglobin, muscle mass); (2) Running economy decline (sarcopenia, tendon stiffness reduction); LT2 training remains equally effective in masters athletes (Tanaka 1997 — 12-week threshold program: +7.2% LT2 pace in 60–65 year-old runners vs +8.1% in 30–35 year-olds); resistance training preserves running economy and thereby maintains LT2 pace longer into masters competition; masters: prioritize LT2 training + strength training over high-volume Zone 1 mileage to maximize limited recovery capacity")
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
        let hrType = HKObjectType.quantityType(forIdentifier: .heartRate)!
        guard (try? await store.requestAuthorization(toShare: [], read: [workoutType, hrType])) != nil else {
            isLoading = false; return
        }

        let endDate = Date()
        let startDate = Calendar.current.date(byAdding: .day, value: -56, to: endDate)!
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate)

        let workouts: [HKWorkout] = await withCheckedContinuation { continuation in
            let q = HKSampleQuery(sampleType: workoutType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, s, _ in
                continuation.resume(returning: (s as? [HKWorkout]) ?? [])
            }
            store.execute(q)
        }

        let runs = workouts.filter { $0.workoutActivityType == .running }
        let runCount = runs.count

        // Estimate max HR from hardest runs (95th percentile HR)
        var peakHRs: [Double] = []
        for run in runs {
            if let hrStat = run.statistics(for: HKQuantityType(.heartRate)),
               let peak = hrStat.maximumQuantity() {
                peakHRs.append(peak.doubleValue(for: HKUnit(from: "count/min")))
            }
        }
        peakHRs.sort()
        let estimatedMaxHR = peakHRs.isEmpty ? 0 : peakHRs[max(0, Int(Double(peakHRs.count) * 0.95))]

        await MainActor.run {
            self.maxHR = estimatedMaxHR
            self.estimatedLT2HR = estimatedMaxHR > 0 ? estimatedMaxHR * 0.89 : 0
            self.estimatedLT1HR = estimatedMaxHR > 0 ? estimatedMaxHR * 0.77 : 0
            self.recentRunCount = runCount
            self.isLoading = false
        }
    }
}
