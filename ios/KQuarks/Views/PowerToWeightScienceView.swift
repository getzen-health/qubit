import SwiftUI
import HealthKit

struct PowerToWeightScienceView: View {
    @State private var estimatedFTP: Double = 0      // watts (from VO2max if available)
    @State private var bodyWeight: Double = 0         // kg
    @State private var pwrRatio: Double = 0           // W/kg
    @State private var category: String = "--"
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                pwrStatsRow
                fundamentalsCard
                racingApplicationCard
                bodyWeightCard
                womenCard
            }
            .padding()
        }
        .navigationTitle("Power-to-Weight Science")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var pwrStatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(
                    value: pwrRatio > 0 ? String(format: "%.2f W/kg", pwrRatio) : "--",
                    label: "Est. FTP/Weight",
                    color: pwrColor
                )
                statCard(
                    value: category,
                    label: "British Cycling Tier",
                    color: pwrColor
                )
                statCard(
                    value: bodyWeight > 0 ? String(format: "%.1f kg", bodyWeight) : "--",
                    label: "Body Weight",
                    color: .secondary
                )
            }
            Text("Coggan 2003 (Training and Racing with Power): W/kg ratio is the single most important predictor of climbing performance — a 70 kg rider at 5.0 W/kg produces identical speed as a 60 kg rider at 5.0 W/kg on any gradient above ~4%")
                .font(.caption2).foregroundColor(.secondary)
        }
    }

    private var pwrColor: Color {
        switch pwrRatio {
        case 5.0...: return .yellow
        case 4.0..<5.0: return .green
        case 3.0..<4.0: return .teal
        case 2.0..<3.0: return .orange
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
    private var fundamentalsCard: some View {
        scienceCard(title: "Power-to-Weight: The Physics of Climbing", icon: "⚡", color: .yellow) {
            sciRow(stat: "Why W/kg matters — physics basis (di Prampero 1979 J Exp Biol)", detail: "Power-to-weight ratio physics: on level ground, cycling speed is limited by aerodynamic drag (proportional to frontal area and velocity²) and rolling resistance; on climbs: gravity becomes the dominant force; at 8% gradient, gravity = 99% of total resistance; power required to climb = mass × g × gradient × velocity = mg × slope × v; rearranging: v = Power / (mass × g × slope); therefore climbing speed ∝ Power/mass (W/kg); at 6% gradient, each 0.1 W/kg increase → approximately 0.5 km/h faster; practical: a 70 kg rider at 4.0 W/kg (280 W) and a 60 kg rider at 4.0 W/kg (240 W) climb at IDENTICAL speed — only W/kg matters on climbs, not absolute watts; on flat: absolute watts + aero position determine speed, not W/kg")
            sciRow(stat: "British Cycling W/kg classification tiers (Coggan 2003)", detail: "W/kg classification (FTP watts / body weight kg): Untrained: <2.0 W/kg; Fair: 2.0–2.5 W/kg; Moderate: 2.5–3.0 W/kg; Good: 3.0–3.5 W/kg; Very Good: 3.5–4.0 W/kg; Excellent: 4.0–4.5 W/kg; Exceptional: 4.5–5.0 W/kg; World Class: 5.0–5.5 W/kg; Pro Tour: 5.5–6.0 W/kg; Grand Tour contenders: 6.0–6.5 W/kg (sustained on cols); benchmark context: average recreational male: 2.5–3.0 W/kg; enthusiast amateur: 3.0–3.5 W/kg; category 1 racer: 4.5–5.0 W/kg; WorldTour professional: 5.5–6.0 W/kg; women's classifications approximately 10–15% lower at same categorical level")
            sciRow(stat: "VO₂max and W/kg relationship (Coyle 1991 J Appl Physiol)", detail: "VO₂max to W/kg conversion: FTP (functional threshold power) corresponds to ~85–90% of peak aerobic power; peak aerobic power (Wmax) ≈ VO₂max (mL/kg/min) × 10.8 / efficiency factor; cycling mechanical efficiency: ~22–24% (23% typical); FTP ≈ VO₂max × 0.85 × 3.5 (converting mL/kg/min to W/kg approximation); example: VO₂max = 60 mL/kg/min → FTP ≈ 60 × 0.85 × 3.5 / 14.3 ≈ 4.2 W/kg (very rough approximation); direct relationship: elite cyclists show FTP/W ≈ VO₂max (mL/kg/min) × 0.07 ± 0.5 (Coyle 1991); more precise conversion requires laboratory metabolic cart; Apple Watch VO₂max estimate enables rough FTP/W/kg ballpark")
            sciRow(stat: "Measuring FTP — protocols and accuracy (Borszcz 2018 IJSPP)", detail: "FTP measurement methods: (1) Coggan 20-min test: 20-min all-out time trial, then × 0.95 = FTP; most common field test; overestimates FTP by 5–8% in non-paced riders; (2) Ramp test: 1-min incremental ramp to exhaustion; MAP (maximal aerobic power) × 0.75 = FTP; easier to pace; underestimates FTP in well-trained; accuracy vs lab MLSS: ±5–10%; (3) 60-min TT: most accurate (FTP ≈ average power of 60-min maximal effort) but practically limited; (4) Critical Power (CP): 3-effort model (3-min, 8-min, 20-min TT) → hyperbolic regression → CP = FTP equivalent; accuracy within 3–5% (Jones 2010); Apple Watch with a power meter (Stages, 4iiii, Quarq): can record FTP directly")
        }
    }

    private var racingApplicationCard: some View {
        scienceCard(title: "Racing Applications & Performance Benchmarks", icon: "🏔️", color: .orange) {
            sciRow(stat: "Grand Tour climbing benchmarks (Lucia 2001 J Appl Physiol)", detail: "Elite cycling climbing performance: Lucia 2001 — Tour de France climbers sustained 5.7–6.4 W/kg for 20+ minute climbs; L'Alpe d'Huez (13.2 km, 7.9% avg): world record pace requires ~6.4 W/kg sustained; VAM (velocità ascensionale media = vertical ascent meters per hour): useful cycling metric — VAM ÷ (200 + [gradient % × 3]) ≈ W/kg; example: 1400 m/h VAM on 7% gradient ÷ 221 = 6.3 W/kg; amateur cyclist on L'Alpe d'Huez: 3.5 W/kg → ~50 min; 4.0 W/kg → ~44 min; 4.5 W/kg → ~39 min; 5.0 W/kg → ~35 min; 5.5 W/kg → ~32 min; VAM declines with gradient — steeper gradients theoretically favor higher W/kg riders as aero drag eliminated")
            sciRow(stat: "Breakaway economics and time-trialing (Broker 2003 Cycling Science)", detail: "Flat course performance — absolute watts matter: on flat terrain at race speed (35–50 km/h), aerodynamic drag = 85–90% of total resistance; power required: P = F_aero × v = CdA × 0.5ρv³; lighter riders sacrifice aerodynamics (smaller body = less frontal area but less absolute power); optimal body composition for flat racing: maximal absolute power (watts) prioritized; time trial specialist profile: higher absolute FTP, more aero position; climber profile: high W/kg, lighter body; 'puncheur' profile: high sprint power (W/kg of sprint) + good climbing W/kg — Amstel Gold, Flèche; practical: at any gradient > 3.5%, W/kg determines final speed; below 3.5%, absolute power + aerodynamics interact")
            sciRow(stat: "Running power-to-weight (Jones 2017 Int J Sports Physiol Perform)", detail: "Running equivalent: for running, W/kg is calculated as running power (from Stryd pod) / body mass; unlike cycling, running W/kg is less clearly performance-predictive because: (1) running economy (mL/kg/km) varies 20–30% between runners of same VO₂max; (2) gravitational cost differs — heavier runners expend more energy per step but aren't always slower if power is proportionally higher; running W/kg norms (Stryd): elite runners: 4.5–6.0 W/kg at race pace; amateur competitive: 3.0–4.5 W/kg; recreational: 2.5–3.5 W/kg; vertical power (gravity component): every kg of body mass adds 1 W of gravitational power demand per meter of altitude gain per second; uphill running W/kg is the strongest predictor of trail race performance (Giandolini 2016)")
            sciRow(stat: "Weight loss vs power development — trade-offs (Slater 2011 Int J Sport Nutr)", detail: "Improving W/kg: two levers — increase power (numerator) or decrease weight (denominator); most effective for trained athletes: improving power via training while maintaining weight; extreme weight reduction risks: losing 1 kg via dehydration: W/kg improves but aerobic power falls proportionally (plasma volume reduction impairs cardiac output); losing 1 kg of fat (energy restriction): W/kg improves IF no muscle is lost; muscle loss risk: >0.5% bodyweight per week or very low protein intake (<1.6 g/kg/day) → loss of muscle mass → reduced FTP → W/kg net unchanged or worsened; optimal weight management for cyclists: 0.3–0.5% BW per week during off-season, >1.6 g/kg/day protein, no energy restriction during heavy training blocks")
        }
    }

    private var bodyWeightCard: some View {
        scienceCard(title: "Body Composition & Weight Optimization", icon: "⚖️", color: .blue) {
            sciRow(stat: "Optimal body composition for cycling performance (Lucia 2000)", detail: "Body fat % in elite cyclists: Tour de France GC contenders: 4–7% body fat; sprinters and classics specialists: 8–12%; female professional cyclists: 12–18%; optimal body fat for performance: below ~5% in males / ~15% in females begins to impair hormone function, immune system, and bone health; RED-S (relative energy deficiency in sport): chronic under-fueling to reach low body weight → reduced testosterone, cortisol dysregulation, bone stress fracture risk, immune suppression; for every 1% below optimal body fat: marginal W/kg gains (<0.1 W/kg) at disproportionate health risk; realistic targets for amateur cyclists: men 10–15%, women 18–23% — sustainable with good performance")
            sciRow(stat: "Weight simulation and W/kg impact (Coggan climbing simulator)", detail: "W/kg sensitivity analysis: on 7% gradient at constant effort: 1 kg lighter at same power → +0.25 km/h on L'Alpe d'Huez (→ ~45 s saved per 14 km climb); 1 W/kg improvement at same weight (e.g., FTP 3.5 → 4.5 W/kg): +3.0 km/h → ~5 min saved per climb; practical: training to increase FTP by 0.5 W/kg has 6× greater performance impact than losing 3 kg; combine approaches: train hard to build FTP AND use competition period body composition management for best results; bike weight: 1 kg lighter bike ≈ same effect as 0.8 kg lighter rider on climbs (power demands identical); aero advantage on flat negates bike weight savings — only relevant in climbing contexts")
            sciRow(stat: "Altitude and W/kg — the mountain paradox (Levine 1997)", detail: "Altitude effects on W/kg: at 2,000m altitude, VO₂max decreases ~10% → FTP decreases ~8–10% → W/kg decreases at same absolute weight; however: descent increases W/kg equivalently; altitude training purpose: EPO-mediated red blood cell mass increase (+4–6%) → VO₂max increases after returning to sea level → FTP and W/kg improve 3–5%; altitude camps: typically 3–4 weeks at 2,400–2,800m; sea-level racing benefit peaks 2–3 weeks after descent; for Grand Tour climbing (Alps, Pyrenees at 1,500–2,800m): riders adapted to altitude maintain W/kg better than non-adapted; marginal altitude advantage for pre-adapted riders: 0.2–0.4 W/kg at race altitude (2,000–2,500m) — significant advantage in late race mountain stages")
            sciRow(stat: "Heat acclimatization and W/kg (Rønnestad 2019 Scand J Med Sci Sports)", detail: "Heat training as W/kg strategy: Rønnestad 2019 — 10 days of heat training (exercise in 37°C ambient) increased plasma volume +6%, VO₂max +4.5%, time trial performance +5.2% in well-trained cyclists — equivalent W/kg improvement without weight change; mechanism: plasma volume expansion improves stroke volume → cardiac output at same HR → more power per kg at same perceived effort; heat training particularly useful for: cyclists who cannot do altitude camps, hot-weather stage races, pre-Tour preparation; practical 10-day heat protocol: 60-90 min moderate intensity in 37–40°C environment (no cooling); passive heat exposure (sauna): 30 min post-training sauna produces similar plasma volume expansion (Kirby 2021 Eur J Appl Physiol)")
        }
    }

    private var womenCard: some View {
        scienceCard(title: "Sex Differences & Female Athletes", icon: "♀️", color: .pink) {
            sciRow(stat: "Female cycling W/kg benchmarks and physiology (Howley 2000)", detail: "Female W/kg classifications (approximately 10–15% lower than male equivalents at same tier): Untrained: <1.6 W/kg; Fair: 1.6–2.1 W/kg; Moderate: 2.1–2.7 W/kg; Good: 2.7–3.2 W/kg; Very Good: 3.2–3.7 W/kg; Excellent: 3.7–4.2 W/kg; Elite National: 4.2–4.7 W/kg; Professional: 4.7–5.2 W/kg; mechanisms of sex difference in W/kg: females: lower absolute muscle mass, lower hemoglobin concentration (−10–15%), smaller cardiac dimensions → lower absolute VO₂max and FTP; when normalized to lean muscle mass: sex differences in W/kg largely disappear (Holloszy 1994) — female muscle produces identical power per gram; the gap is body composition and cardiovascular capacity, not muscle quality")
            sciRow(stat: "Menstrual cycle effects on power output (Wouters-Adriaens 2013)", detail: "Cycling performance across menstrual cycle: anaerobic power (sprint W/kg) varies 3–5% across cycle — highest in follicular phase (post-menstruation); FTP (threshold power) relatively stable across cycle compared to sprint power; estrogen effects: Phase 1 (follicular, low estrogen): neuromuscular power higher; Phase 2 (luteal, high progesterone): increased fat oxidation, slightly reduced glycolytic capacity; thermoregulatory challenge in luteal phase — core temp 0.3–0.5°C higher at rest → heat stress begins earlier in warm conditions; practical: schedule maximal FTP tests in follicular phase (days 3–14); accommodate 2–5% lower perceived power in luteal phase without adjusting training zones downward")
            sciRow(stat: "RED-S and performance in female cyclists (Mountjoy 2018 Br J Sports Med)", detail: "Relative energy deficiency in sport (RED-S): prevalent in female cyclists pursuing low W/kg via extreme restriction; RED-S consequences: hormone suppression (amenorrhea, low estrogen) → bone mineral density loss (+7% fracture risk per year of amenorrhea); reduced FTP (muscle protein catabolism); immune suppression; psychological impact; IOC consensus statement 2018 (Mountjoy): RED-S may reduce performance by 10–15% despite lower body weight → net W/kg worsening; minimum energy availability for female athletes: 45 kcal/kg lean body mass/day; below this threshold: metabolic rate suppression, FTP reduction, hormonal disruption; sustainable W/kg improvement requires energy-sufficient environment with adequate protein (1.8–2.0 g/kg/day)")
            sciRow(stat: "Ultra-endurance and female physiology advantages (Speechly 1996)", detail: "Ultra-endurance W/kg sex differences narrow: in events >6 hours, female performance relative to male improves substantially; proposed mechanisms: (1) superior fat oxidation at matched % VO₂max → glycogen sparing advantage; (2) lower muscle fiber recruitment needed at lower body mass → reduced fatigue rate; (3) better heat dissipation per unit mass (higher body surface area:volume ratio in smaller females); (4) lower absolute fluid loss rate → reduced plasma volume impact; Speechly 1996: females maintain pace better in second half of ultra-endurance events; in 100+ mile races: female:male performance ratio approaches 1:1 (vs typical 0.88:1 at marathon); for W/kg in ultra-climbing races (UTMB, mountain stages): female advantage in fat oxidation partially compensates for lower absolute W/kg")
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
        let bodyMassType = HKObjectType.quantityType(forIdentifier: .bodyMass)!
        let vo2Type = HKObjectType.quantityType(forIdentifier: .vo2Max)!
        guard (try? await store.requestAuthorization(toShare: [], read: [bodyMassType, vo2Type])) != nil else {
            isLoading = false; return
        }

        let endDate = Date()
        let startDate = Calendar.current.date(byAdding: .day, value: -90, to: endDate) ?? Date()
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate)
        let descDate = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

        let bodyMassSamples: [HKQuantitySample] = await withCheckedContinuation { continuation in
            let q = HKSampleQuery(sampleType: bodyMassType, predicate: predicate, limit: 1, sortDescriptors: [descDate]) { _, s, _ in
                continuation.resume(returning: (s as? [HKQuantitySample]) ?? [])
            }
            store.execute(q)
        }

        let vo2Samples: [HKQuantitySample] = await withCheckedContinuation { continuation in
            let q = HKSampleQuery(sampleType: vo2Type, predicate: predicate, limit: 1, sortDescriptors: [descDate]) { _, s, _ in
                continuation.resume(returning: (s as? [HKQuantitySample]) ?? [])
            }
            store.execute(q)
        }

        let kg = bodyMassSamples.first?.quantity.doubleValue(for: .gramUnit(with: .kilo)) ?? 0
        let vo2max = vo2Samples.first?.quantity.doubleValue(for: HKUnit(from: "ml/kg*min")) ?? 0
        // FTP (watts) ≈ body_mass_kg × vo2max_mL/kg/min × 0.85 × 0.01 (rough conversion)
        let ftpEstimate = kg > 0 && vo2max > 0 ? kg * vo2max * 0.85 * 0.01 : 0
        let ratio = kg > 0 ? ftpEstimate / kg : 0

        let cat: String = {
            if ratio == 0 { return "--" }
            if ratio >= 5.0 { return "World Class" }
            if ratio >= 4.5 { return "Exceptional" }
            if ratio >= 4.0 { return "Excellent" }
            if ratio >= 3.5 { return "Very Good" }
            if ratio >= 3.0 { return "Good" }
            if ratio >= 2.5 { return "Moderate" }
            return "Fair" }()

        await MainActor.run {
            self.bodyWeight = kg
            self.estimatedFTP = ftpEstimate
            self.pwrRatio = ratio
            self.category = cat
            self.isLoading = false
        }
    }
}
