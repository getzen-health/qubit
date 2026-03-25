import SwiftUI
import HealthKit

struct FiberTypeScienceView: View {
    @State private var estimatedFiberProfile: String = "--"
    @State private var highIntensityPercent: Double = 0
    @State private var totalWorkoutsAnalyzed: Int = 0
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                fiberTypeStatsRow
                physiologyCard
                geneticsCard
                trainingCard
                sportSpecificCard
            }
            .padding()
        }
        .navigationTitle("Fiber Type Science")
        .toolbarTitleDisplayMode(.inline)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var fiberTypeStatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(value: estimatedFiberProfile, label: "Estimated Profile", color: profileColor)
                statCard(
                    value: highIntensityPercent > 0 ? String(format: "%.0f%%", highIntensityPercent) : "--",
                    label: "High-Intensity Sessions",
                    color: highIntensityPercent >= 30 ? .red : highIntensityPercent >= 15 ? .orange : .green
                )
                statCard(
                    value: totalWorkoutsAnalyzed > 0 ? "\(totalWorkoutsAnalyzed)" : "--",
                    label: "Sessions Analyzed",
                    color: .blue
                )
            }
            Text("Costill 1976 (J Appl Physiol): biopsy analysis of elite marathoners averaged 73% slow-twitch fibers vs 24% in elite sprinters — fiber type composition is the most heritable athletic trait (~70% genetic, Simoneau 1995)")
                .font(.caption2).foregroundColor(.secondary)
        }
    }

    private var profileColor: Color {
        switch estimatedFiberProfile {
        case "Endurance": return .green
        case "Mixed": return .orange
        case "Power": return .red
        default: return .secondary
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
        scienceCard(title: "Muscle Fiber Type Physiology", icon: "💪", color: .purple) {
            sciRow(stat: "Fiber type classification (Brooke & Kaiser 1970, Staron 1994)", detail: "Human skeletal muscle fiber classification: Type I (slow-twitch, ST): primary fuel = fat oxidation; high mitochondrial density; small diameter; highly fatigue-resistant; myosin heavy chain isoform: MHC-I; contraction speed: slow; peak power: low; Type IIa (fast oxidative glycolytic, FOG): intermediate — some oxidative capacity; Type IIb/IIx (fast-twitch, FT): primary fuel = glycolysis (anaerobic); low mitochondrial density; large diameter; fatigues rapidly; peak power: very high; human skeletal muscle is ~50% ST and ~50% FT on average (Houtman 2003); significant individual variation: 20–80% ST in vastus lateralis across population; pure IIb fibers rare in humans — mostly IIa with some IIx characteristics after training")
            sciRow(stat: "Costill 1976 (J Appl Physiol) — the definitive fiber type study", detail: "Elite athlete fiber composition: Costill 1976 biopsy analysis of elite runners: distance runners: 73% slow-twitch (ST); middle-distance: 62% ST; sprinters: 24% ST; international cyclists: 57% ST; cross-country skiers: 72% ST; elite marathon runners (sub-2:15): often 80–90% ST; physiological basis: high ST% = greater mitochondrial density = superior fat oxidation = superior lactate clearance = higher LT as % VO₂max = better marathon performance; sprint performance correlation: 20-m sprint time correlated r = −0.82 with %FT fibers (Mero 1983); broad conclusion: for events > 3000m, ST dominance is the most predictive biological trait; for events < 800m, FT dominance is most predictive")
            sciRow(stat: "Fiber type and force-velocity relationship (Edman 1979 J Physiol)", detail: "Contractile properties: ST fibers: maximal shortening velocity (Vmax) 1–3 muscle lengths/second; FT fibers: Vmax 3–7 lengths/second; peak force (tetanic tension): FT > ST per cross-sectional area; power output: FT produces 4–5× power per gram of muscle; fatigue resistance: ST sustains repeated contractions indefinitely (aerobic ATP regeneration); FT fatigues rapidly (PCr depletes in 5–10 s, anaerobic glycolysis limited); size principle (Henneman 1957): motor units recruited in order of increasing size — ST recruited first at low forces, FT progressively recruited as force demands increase; implications for training: Zone 1–2 training primarily recruits and adapts ST fibers; HIIT/sprinting recruits FT fibers")
            sciRow(stat: "Fiber type transitions — what can change (Andersen 2000 Acta Physiol Scand)", detail: "Fiber type plasticity: the proportion of IIa vs IIb/IIx can change significantly with training; IIb → IIa transition occurs with endurance or resistance training (IIa is more oxidative than IIb); the ST ↔ FT transition is extremely limited in humans — a IIa fiber cannot become a Type I (Trappe 2004); animal studies (electrical stimulation, cross-innervation): complete fiber type conversion possible in rodents; human studies: 5+ years of elite endurance training: IIb → IIa conversion (more aerobic), but ST% increases only 3–5% above genetic baseline (Schantz 1983); resistance training: some IIb → IIa conversion, but ST% unchanged; practical: training doesn't dramatically change your genetic fiber type ratio — it optimizes what you have")
        }
    }

    private var geneticsCard: some View {
        scienceCard(title: "Genetics & ACTN3 — The Speed Gene", icon: "🧬", color: .blue) {
            sciRow(stat: "Simoneau 1995 (Am J Physiol) — heritability of fiber type", detail: "Genetic determination of fiber type: Simoneau 1995 (Quebec Family Study): heritability of fiber type composition = 0.45–0.70 (45–70% genetic); muscle oxidative capacity heritability: 0.47–0.73; aerobic trainability heritability: 0.30–0.60; critical insight: you can select your parents for athletic performance — but training environment determines 30–55% of variance; identical twins: similar response to training but significantly different optimal training volume/intensity; practical: fiber type composition is your athletic hardware; training is the software optimization; even with 'wrong' fiber type for a sport, training can close 30–40% of the performance gap vs a genetically optimal athlete")
            sciRow(stat: "ACTN3 R577X polymorphism (Yang 2003 Am J Hum Genet)", detail: "The ACTN3 gene — 'speed gene': ACTN3 encodes alpha-actinin-3, expressed exclusively in fast-twitch (Type II) muscle fibers; R577X variant: R allele = functional alpha-actinin-3 (normal); XX genotype = complete absence of alpha-actinin-3 in fast-twitch fibers; population frequencies: R/R: 30%; R/X: 50%; X/X: 20%; elite sprint athletes: R/R 35–50%, X/X 6% (vs 20% in general population); elite endurance athletes: R/R 27%, X/X 25% (slight enrichment of XX) — alpha-actinin-3 absence may be beneficial for slow fiber function; ACTN3 is the most-studied athletic performance gene but explains only 1–3% of variance — thousands of genes influence athletic performance; direct-to-consumer genetic tests (23andMe) report ACTN3 status")
            sciRow(stat: "Polygenic nature of athletic genetics (Bouchard 2015 Exerc Sport Sci Rev)", detail: "Beyond single genes: ACTN3, PPARGC1A, EPOR, ACE, HIF1A, AMPD1 have all been associated with athletic performance; each individual gene explains <2% of performance variance; polygenic score (sum of all performance-associated SNPs): explains 8–12% of VO₂max variance; genome-wide association studies (GWAS) of VO₂max identify 25+ significant loci, each small effect; conclusion: 'athletic genes' are real but no single gene determines athletic destiny; Bouchard 2015: the heritability of VO₂max trainability is significant — some people respond 4× more to endurance training than others (HERITAGE Family Study: 5–20% VO₂max gain in non-responders vs 40–60% in high-responders to identical training protocol)")
            sciRow(stat: "Testosterone, muscle mass, and fiber type expression (Bhasin 2001 J Clin Endocrinol)", detail: "Sex differences in fiber type: males and females have similar fiber type % composition on average; males: larger muscle cross-sectional area (larger individual fibers, especially IIa/IIx); testosterone: stimulates hypertrophy of all fiber types but FT fibers proportionally more (higher androgen receptor density); testosterone administration in males: Type II fiber CSA increased 27% (Bhasin 2001); females: larger relative surface area-to-volume ratio of muscle fibers → better O₂ diffusion per unit of power → potentially better fatigue resistance per fiber; female elite distance runners: similar or higher ST% than male counterparts; the sex performance gap is primarily explained by cardiac output, hemoglobin mass, and muscle mass — not fiber type composition")
        }
    }

    private var trainingCard: some View {
        scienceCard(title: "Training for Your Fiber Type", icon: "🏋️", color: .orange) {
            sciRow(stat: "ST-dominant (endurance profile) training optimization", detail: "If predominantly slow-twitch (endurance profile): strengths: superior aerobic capacity, fatigue resistance, fat oxidation, lactate clearance; weaknesses: limited peak power, slower sprint, weaker neural drive; optimal sports: marathon, ultra-distance, triathlon, cycling, cross-country skiing; training priorities: (1) Zone 1–2 volume maximizes mitochondrial density in ST fibers; (2) Threshold work raises LT2; (3) HIIT improves VO₂max ceiling; resistance training for ST athletes: low-load, high-rep (15–25 reps) to maintain fiber size without hypertrophy that adds non-functional mass; avoid excessive heavy lifting — adds Type II mass without performance benefit for endurance sports; weekly structure: 75–80% Zone 1–2, 5% threshold, 15–20% Zone 3")
            sciRow(stat: "FT-dominant (power profile) training optimization", detail: "If predominantly fast-twitch (power profile): strengths: high peak power, explosive acceleration, rapid force development; weaknesses: lower aerobic capacity, faster fatigue at moderate intensity, higher carbohydrate reliance; optimal sports: 100–400m sprinting, weightlifting, gymnastics, team sport power positions; training priorities: (1) Heavy resistance training (1–5 RM) maximizes FT fiber hypertrophy; (2) Sprint intervals (10–30 s max effort) optimize PCr and anaerobic glycolytic capacity; (3) Plyometrics develop neuromuscular rate of force development; for FT athletes building aerobic base: Zone 1–2 still essential but adaptation slower and less dramatic than for ST athletes; resistance training: 3–6 RM, 4–6 sets, explosive concentric phase to maximize Type II neural adaptations")
            sciRow(stat: "Mixed profile — optimizing both systems (Hawley 2002 Exerc Sport Sci Rev)", detail: "Mixed fiber type (balanced profile): most athletes fall here — 45–55% ST; optimal sports: middle distance (800m–3000m), team sports (soccer, basketball, rugby), swimming, combat sports; training challenge: concurrently developing aerobic and anaerobic systems; Hawley 2002 interference effect: simultaneous endurance + strength training may reduce maximal strength gains by 20–30% vs strength training alone; but interference is manageable with sequencing: strength then endurance within same session minimizes interference (Cadore 2012); or: separate days for primary modality; mixed athletes: periodize — base phase emphasizes aerobic base → race phase shifts toward sport-specific speed and power; fiber type informs periodization starting point but does not constrain it")
            sciRow(stat: "EPOC and fiber type-specific fatigue (Viitasalo 1982)", detail: "Recovery differences by fiber type: FT fibers fatigue faster (PCr depletes in 5–10 s of maximal effort) but also recover faster than ST fibers at rest; ST fibers accumulate fatigue differently — progressive glycogen depletion, oxidative enzyme substrate depletion — requires 24–72 hours for full glycogen restoration; FT-dominant athletes: can repeat high-intensity efforts with shorter recovery intervals (45–90 s between sprints); ST-dominant athletes: need longer low-intensity recovery between hard intervals but recover from easy sessions overnight; DOMS (delayed onset muscle soreness): primarily in FT fibers after unaccustomed eccentric exercise; ST fibers: lower DOMS susceptibility but higher steady-state lactate during novel exercise from lower oxidative adaptation baseline; matching training recovery to fiber type physiology optimizes adaptation rate")
        }
    }

    private var sportSpecificCard: some View {
        scienceCard(title: "Sport-Specific Fiber Type Profiles", icon: "🏅", color: .green) {
            sciRow(stat: "Sprint and power sport profiles (Costill 1976, Mero 1983)", detail: "World-class sprinter fiber composition: 100m: 24% ST (76% FT) — requires maximal PCr and anaerobic glycolytic power; 400m: 35–45% ST; 800m: 45–55% ST (transition zone — either profile can succeed); implications: 100m gold medalists require predominantly FT genetics — training alone cannot compensate for <50% FT; explosive team sport positions (wide receiver, point guard, striker): 40–50% ST; linemen, tight ends: 45–55% ST; weightlifting world champions: 40–50% ST; Olympic shot put/discus: 35–45% ST; the fiber type requirement is less stringent above 400m — which is why middle-distance has greater diversity of body types and fiber profiles among world champions")
            sciRow(stat: "Endurance sport profiles (Howald 1985, Costill 1976)", detail: "Elite endurance athlete profiles: marathon world record holders: 85–95% ST estimated from performance characteristics (biopsy studies in elite distance runners average 73–83%); Tour de France cyclists: 64–78% ST (variability by climbing specialist vs sprinter); cross-country skiers: 72–82% ST; rowing: 65–75% ST (upper body has naturally lower ST%); triathlon (Ironman): 68–78% ST; swim sprint specialists: 45–55% ST (unique — water reduces gravity so FT power less disadvantageous); the minimum ST% to sustain competitive marathon performance appears to be ~60% based on mathematical modeling of fuel system limitations; below 60% ST: glycogen depletion inevitably occurs at marathon pace before 20 miles")
            sciRow(stat: "Team sport athlete profiles and positional requirements", detail: "Team sport fiber composition: soccer (association football): midfielders: 57–63% ST (highest endurance demand); forwards: 52–58% ST; defenders: 53–62% ST; goalkeeper: 45–52% ST (highest FT requirement); basketball point guards: 55–60% ST; centers: 48–55% ST; rugby backs: 50–58% ST; forwards: 45–55% ST; American football: defensive back (CB/S): 52–62% ST; wide receiver: 40–50% ST; offensive lineman: 40–48% ST; team sport training implication: positional demands should guide training emphasis — midfielders need Zone 2 aerobic base; strikers need speed endurance (FT fiber stimulus); fiber type analysis via performance testing informs position-specific training programming")
            sciRow(stat: "Estimating fiber type from Apple Watch data", detail: "Indirect fiber type estimation from workout data: FT-dominant indicator: higher proportion of high-intensity workouts (>80% HRmax), explosive sport participation, superior short-sprint performance, rapid HR recovery after intervals (FT athletes clear lactate well with trained ST fibers); ST-dominant indicator: consistent long-duration low-intensity workouts, superior performance at low intensities, gradual HR rise during aerobic work (high parasympathetic tone); Apple Watch cannot directly measure fiber type (requires muscle biopsy); HR zone distribution across workout history provides indirect proxy: if 70–80%+ of aerobic workouts are in Zones 1–2 with high volume → likely ST-dominant training response; if frequent max-intensity sessions with high kcal/min bursts → FT adaptation pattern; genetic testing (23andMe, Athletigen) provides ACTN3 status as complementary data point")
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
        guard (try? await store.requestAuthorization(toShare: [], read: [workoutType])) != nil else {
            isLoading = false; return
        }

        let endDate = Date()
        let startDate = Calendar.current.date(byAdding: .day, value: -90, to: endDate) ?? Date()
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate)

        let workouts: [HKWorkout] = await withCheckedContinuation { continuation in
            let q = HKSampleQuery(sampleType: workoutType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, s, _ in
                continuation.resume(returning: (s as? [HKWorkout]) ?? [])
            }
            store.execute(q)
        }

        let total = workouts.count

        // Estimate high-intensity based on kcal/min > ~10
        let highIntensity = workouts.filter { w in
            guard w.duration > 0,
                  let kcal = w.statistics(for: HKQuantityType(.activeEnergyBurned))?.sumQuantity()?.doubleValue(for: .kilocalorie()) else { return false }
            return (kcal / (w.duration / 60)) > 10
        }

        let hiPercent = total > 0 ? Double(highIntensity.count) / Double(total) * 100 : 0

        let profile: String = {
            if hiPercent >= 30 { return "Power" }
            if hiPercent >= 15 { return "Mixed" }
            return "Endurance"
        }()

        await MainActor.run {
            self.totalWorkoutsAnalyzed = total
            self.highIntensityPercent = hiPercent
            self.estimatedFiberProfile = profile
            self.isLoading = false
        }
    }
}
