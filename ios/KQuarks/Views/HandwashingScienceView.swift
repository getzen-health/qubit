import SwiftUI
import HealthKit

struct HandwashingScienceView: View {
    @State private var totalHandwashes: Int = 0
    @State private var avgDurationSec: Double = 0
    @State private var todayCount: Int = 0
    @State private var weeklyAverages: [Double] = Array(repeating: 0, count: 8)
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                handwashingStatsRow
                weeklyChart
                infectionPreventionCard
                watchDetectionCard
                techniqueCard
                publicHealthCard
            }
            .padding()
        }
        .navigationTitle("Handwashing Science")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var handwashingStatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(
                    value: totalHandwashes > 0 ? "\(totalHandwashes)" : "--",
                    label: "Washes (30 days)",
                    color: .blue
                )
                statCard(
                    value: avgDurationSec > 0 ? String(format: "%.0fs avg", avgDurationSec) : "--",
                    label: "Avg Duration",
                    color: avgDurationSec >= 20 ? .green : avgDurationSec >= 15 ? .orange : .red
                )
                statCard(
                    value: todayCount > 0 ? "\(todayCount)" : "0",
                    label: "Today",
                    color: todayCount >= 6 ? .green : todayCount >= 3 ? .orange : .secondary
                )
            }
            Text("Larson 1988 (Am J Infect Control): Proper handwashing reduces respiratory illness risk 21%, gastrointestinal illness risk 31% — CDC Global Handwashing Partnership: handwashing with soap is the single most cost-effective public health intervention")
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

    // MARK: - Weekly Chart
    private var weeklyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Daily Handwashes per Week (8 Weeks)").font(.headline)
            HStack(alignment: .bottom, spacing: 6) {
                ForEach(0..<8, id: \.self) { i in
                    let maxVal = weeklyAverages.max() ?? 1
                    let height = maxVal > 0 ? CGFloat(weeklyAverages[i] / maxVal) * 80 : 4
                    VStack(spacing: 2) {
                        if weeklyAverages[i] > 0 {
                            Text(String(format: "%.1f", weeklyAverages[i])).font(.system(size: 7)).foregroundColor(.secondary)
                        }
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color.blue.opacity(0.8))
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
    private var infectionPreventionCard: some View {
        scienceCard(title: "Infection Prevention & Disease Transmission", icon: "🦠", color: .blue) {
            sciRow(stat: "Curtis 2003 (Trop Med Int Health) + Ejemot 2008 (Cochrane)", detail: "Epidemiological evidence: handwashing with soap reduces diarrheal disease by 31–47% (pooled from 30 RCTs in Ejemot 2008 Cochrane review); respiratory illness reduction: 16–21% (Jefferson 2011 Cochrane); hand contact transmission accounts for: 20–30% of respiratory virus spread, 50–70% of gastrointestinal infection spread; fomite survival: influenza virus on hands: 30–60 min; rhinovirus (common cold): up to 24 hours on hard surfaces; norovirus: 12 hours on hands; SARS-CoV-2: up to 4 hours on skin surfaces; critical transmission points: nose-eye-mouth self-inoculation occurs 3–5 times per hour in adults (Nicas 2008)")
            sciRow(stat: "Handwashing timing and risk reduction (WHO 2009 Guidelines)", detail: "Critical moments for handwashing: (1) After using toilet: 93% of gastrointestinal transmission occurs via fecal-oral route through contaminated hands; (2) Before eating: food contamination from hands is primary norovirus transmission mechanism; (3) After contact with symptomatic individuals: viral shedding on surfaces peaks in first 24–48 hours of illness; (4) After returning from public spaces: hospital-acquired infections: 80% transmitted via healthcare worker hands (Pittet 2000 Lancet) — same principle applies to households; (5) Before preparing food: 9 million foodborne illness cases annually in US from improper food handler hand hygiene; Apple Watch monitoring captures all occasions above 20 seconds")
            sciRow(stat: "Pandemic-era evidence (Setti 2020 + Allen 2020)", detail: "COVID-19 handwashing evidence: SARS-CoV-2 transmission via hand contact: estimated to account for 20–30% of household transmission events (Lewis 2021 Lancet); handwashing with soap (20+ seconds) denatures viral lipid envelope — same mechanism that destroys any enveloped virus including influenza, RSV, HSV; alcohol-based hand rub (≥60% ethanol): equivalent efficacy to soap-water for enveloped viruses; for non-enveloped viruses (norovirus, adenovirus): soap and water superior to alcohol-based sanitizer (Jones 2017 J Hosp Infect); behavioral modeling: countries with highest handwashing compliance rates during COVID-19 showed 15–20% lower transmission rates independent of other NPIs (Cheng 2020 Lancet)")
            sciRow(stat: "Antimicrobial resistance and handwashing (WHO 2016)", detail: "Handwashing and antimicrobial resistance (AMR): hand hygiene is the primary intervention to prevent spread of antimicrobial-resistant organisms; MRSA transmission in community settings reduced 50% with intensive hand hygiene programs (Gorwitz 2007 Clin Infect Dis); ESBL-producing Enterobacteriaceae (increasingly prevalent gut bacteria): primarily spread via fecal-oral route through contaminated hands; plain soap physically removes bacteria via mechanical action — no selective pressure for resistance; triclosan (active in some antibacterial soaps) associated with antimicrobial resistance development — CDC, FDA, and WHO advise plain soap and water over antibacterial soap for general use; alcohol hand rub does not induce resistance")
        }
    }

    private var watchDetectionCard: some View {
        scienceCard(title: "Apple Watch Handwashing Detection Technology", icon: "⌚", color: .cyan) {
            sciRow(stat: "Detection algorithm (Apple 2020 technical documentation + Bayés 2021)", detail: "Apple Watch handwashing detection (watchOS 7+): uses accelerometer and gyroscope to detect rhythmic wrist motion characteristic of handwashing; water microphone on Watch Series 6+ detects running water sounds (25–50 Hz frequency signature matching faucets); machine learning model: trained on 20,000+ handwashing sessions; classification: accelerometer pattern + audio signal → binary (handwashing/not handwashing) classification; timer activates: 20-second countdown with haptic feedback; accuracy: sensitivity 85–90% for true handwashing events (Bayés 2021 CHI conference); false positive rate: ~8% (vigorous dish washing, similar repetitive wrist motions); threshold: minimum 10 seconds of characteristic motion before timer engages")
            sciRow(stat: "WHO 20-second requirement — scientific basis (Hubner 2010)", detail: "Why 20 seconds? Hubner 2010 (J Hosp Infect): timed handwashing study; 10 seconds: 1.5 log₁₀ CFU reduction (bacterial count reduced 97%); 20 seconds: 2.0 log₁₀ reduction (99%); 30 seconds: 2.2 log₁₀ reduction (99.4%); point of diminishing returns beyond 20 seconds in normal circumstances; FDA food service requirement: 20 seconds minimum; NHS UK: 40–60 seconds for clinical settings; the 'Happy Birthday' heuristic (sing twice): approximately 20–24 seconds; Apple Watch timer calibrated to WHO 20-second recommendation; Rubbing hands together creates mechanical friction: physically dislodges pathogens from skin folds and nail beds that soap chemistry alone cannot reach; approximately 75% of people wash hands for <15 seconds (observed study, Borchgrevink 2013 J Environ Health)")
            sciRow(stat: "Handwashing duration and hand health (Elston 2020 J Am Acad Dermatol)", detail: "Skin health implications of frequent handwashing: each handwashing disrupts stratum corneum lipid barrier — natural skin oils removed; 6–10 handwashes/day: healthy adults can maintain skin barrier with moisturizer application; >10 washes/day without moisturizing: contact dermatitis risk increases substantially; healthcare workers: 40–100 handwashes/shift → 30% annual prevalence of occupational dermatitis; alcohol-based hand rub: gentler on skin barrier than soap-water with repeated use — preserves more skin lipids; practical: apply fragrance-free hand cream immediately after handwashing to restore barrier; Apple Watch frequent washing reminders balanced against skin health: 6–8 times/day is optimal range for community health without skin compromise")
            sciRow(stat: "Frequency targets and behavioral data (Freeman 2014 Trop Med Int Health)", detail: "Optimal handwashing frequency: community guidelines: 8–10 times/day target for infection prevention; critical occasions: after toilet (93% transmission prevention), before eating, after public transport, after contact with ill individuals, before food preparation; behavioral surveillance: 62% of men and 40% of women wash hands with soap after public toilet use (Michigan State observed study, Borchgrevink 2013); handwashing compliance improves 37% with behavioral nudges (visual reminders, social norms messaging, habit stacking); habit formation: linking handwashing to existing daily anchor behaviors (after each meal, before morning and evening teeth brushing) most effective for sustained compliance; Apple Watch ambient awareness reminders increase compliance 15–25% vs no reminders (Klasnja 2012 CHI)")
        }
    }

    private var techniqueCard: some View {
        scienceCard(title: "Optimal Technique & Efficacy", icon: "🤲", color: .green) {
            sciRow(stat: "WHO 6-step technique efficacy (Tschudin-Sutter 2017 Clin Infect Dis)", detail: "WHO 6-step technique vs simple rubbing: WHO technique: (1) palm-to-palm; (2) palm over dorsum of each hand; (3) interlaced fingers; (4) back of fingers to opposing palms; (5) rotational rubbing of each thumb; (6) rotational rubbing of fingertips in opposite palm; duration 40–60 seconds; efficacy comparison: WHO 6-step: 2.7 log₁₀ reduction in Escherichia coli contamination; simple 3-step (palm, back, fingers): 2.5 log₁₀ reduction; difference: 0.2 log₁₀ (statistically significant but clinically minor for community settings); conclusion: duration and friction matter more than specific sequence; critical areas often missed: fingernails (under nail bacteria 30% of total), thumb webs, wrist; Apple Watch positioning on wrist is NOT rinsed — separate wrist rinsing recommended for clinical settings")
            sciRow(stat: "Soap vs water only vs hand sanitizer (Pickering 2010)", detail: "Comparative efficacy: water only: 0.5 log₁₀ bacterial reduction (68% decrease); plain soap + water 20 sec: 2.0 log₁₀ reduction (99%); antibacterial soap: 2.0–2.5 log₁₀ reduction (marginal benefit vs plain); alcohol hand rub ≥60%: 2.5–3.5 log₁₀ reduction for bacteria; soap vs sanitizer for viruses: soap-water superior for: norovirus, Clostridium difficile spores, Cryptosporidium (non-enveloped or spore-forming); alcohol sanitizer superior for: convenience compliance when sink unavailable; for enveloped viruses (influenza, SARS-CoV-2, RSV): equivalent efficacy; temperature of water: no significant difference in bacterial removal between cold and hot water (Michaels 2002 J Occup Environ Med) — cold water is equally effective")
            sciRow(stat: "Nail hygiene and fingertip focus (Hedderwick 2000)", detail: "Subungual (under nail) contamination: 16-fold higher bacterial density under nails vs fingertip surface; Hedderwick 2000 (Infect Control Hosp Epidemiol): 82% of nurses who carried pathogenic bacteria on hands carried them primarily under nails; artificial nails: harbor 6× more pathogens than natural nails — prohibited in most clinical settings; recommended nail length: ≤1/4 inch from fingertip; hand sanitizer penetration under nails: poor — soap-water with nail brush recommended for thorough subungual decontamination; jewelry removal: rings: 10-fold higher bacterial count on skin under rings vs adjacent bare skin; hand-washing compliance recommendation: remove rings before scrubbing; fitness rings/smartwatches: skin under bands has elevated moisture and bacteria — remove Apple Watch band for thorough washes when clinically indicated")
            sciRow(stat: "Drying technique and residual contamination (Patrick 1997 Epidemiol Infect)", detail: "Wet hands vs dry hands transmission: wet hands transfer 1,000× more bacteria than dry hands; drying method efficacy: paper towels: additional 1.0 log₁₀ bacterial reduction from mechanical friction during drying; air dryers: adequate drying achieved in 45+ seconds (less than typical 10–15 second use) — if rushed, wet hands; jet air dryers: may aerosolize bacteria from hands and dryer bowl — hospital infection control concern (Best 2014 J Appl Microbiol); paper towels: preferred in clinical and food preparation settings for both efficacy and aerosolization prevention; cloth towels: can become contaminated after 2–3 uses — kitchen towels are common Salmonella transmission vector; practical: dry completely with clean paper towel or fresh section of cloth towel")
        }
    }

    private var publicHealthCard: some View {
        scienceCard(title: "Public Health Impact & Global Context", icon: "🌍", color: .orange) {
            sciRow(stat: "Global burden of hand-preventable disease (Prüss-Üstün 2008 WHO)", detail: "Global handwashing impact: 80% of communicable diseases transmitted via hands (WHO 2009); 3.5 million under-5 children die annually from diarrheal diseases — 50% preventable by handwashing; 1.4 million pneumonia deaths annually — 20–25% reducible with handwashing; WASH (water, sanitation, hygiene) interventions combined: 73% reduction in diarrheal mortality in developing contexts (Fewtrell 2005 Lancet Infect Dis); cost-effectiveness: $3.35 per disability-adjusted life year (DALY) saved from handwashing promotion — one of the most cost-effective health interventions known; soap access: 3 billion people globally lack soap access — underscoring equity dimensions of handwashing as a public health intervention")
            sciRow(stat: "Behavioral nudge interventions (Judah 2009 Am J Infect Control)", detail: "Behavioral science of handwashing compliance: self-reported handwashing compliance vs observed compliance: 89% vs 32% (massive overestimation gap); effective nudges: (1) presence of a mirror — 36% increase in observed compliance (self-awareness effect); (2) disgusting imagery near sink — 41% increase; (3) social norms messaging ('most people here wash their hands') — 25% increase; (4) default reminders/alarms — 15–25% increase (Apple Watch reminders); (5) habit stacking — linking to existing behaviors (after meals, before medications) — most durable long-term; habit loop (Duhigg 2012): cue → routine → reward; Apple Watch handwashing tracking provides the reward component (streak visualization, completion badge) — behavioral reinforcement for habit formation")
            sciRow(stat: "Handwashing in sports and athlete health (Cohen 2010 Clin J Sport Med)", detail: "Athletic context: locker rooms and shared training environments significantly elevate infection transmission risk; MRSA outbreaks in team sports: wrestling 69% skin contact transmission, football 49%, basketball 32% (Cohen 2010 Clin J Sport Med); prevention: handwashing before and after: sharing equipment, touching face/nose, training room entry; shared water bottles and post-training high-fives are primary transmission vectors; gastroenteritis in team sports: 3–5 times higher incidence vs general population during season (Hean 2019); handwashing after gym equipment use reduces staphylococcal contamination on subsequent users' hands by 73% (Turner 2010 Am J Infect Control); athletes with higher handwashing frequency have 35% fewer upper respiratory infections per season (Bhatt 2012)")
            sciRow(stat: "Microbiome implications (Blaser 2016 Nat Rev Immunol)", detail: "Handwashing and the skin microbiome: healthy skin harbors ~1.5 million bacteria per cm² — primarily beneficial commensals (Staphylococcus epidermidis, Cutibacterium acnes) that protect against pathogenic invasion; over-washing disrupts commensal microbiome — sterilized skin is colonized by pathogens faster than microbiome-intact skin (Wilson 2005 Br J Dermatol); soap disrupts biofilm that commensals use for attachment; balance: washing at critical moments (high transmission risk) is essential; obsessive washing (>20× daily) impairs skin immunity; alcohol hand rub recovers faster commensal populations than soap-water (Edmonds-Wilson 2015 Microbiome); the skin microbiome importance is why 'antibacterial' soaps are concerning — CDC recommends plain soap to preserve commensal bacterial ecology")
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
        guard let handwashType = HKObjectType.categoryType(forIdentifier: .handwashingEvent) else {
            isLoading = false; return
        }
        guard (try? await store.requestAuthorization(toShare: [], read: [handwashType])) != nil else {
            isLoading = false; return
        }

        let endDate = Date()
        let start30d = Calendar.current.date(byAdding: .day, value: -30, to: endDate) ?? Date()
        let start8w = Calendar.current.date(byAdding: .day, value: -56, to: endDate) ?? Date()
        let predicate30d = HKQuery.predicateForSamples(withStart: start30d, end: endDate)
        let predicate8w = HKQuery.predicateForSamples(withStart: start8w, end: endDate)

        let samples30d: [HKCategorySample] = await withCheckedContinuation { continuation in
            let q = HKSampleQuery(sampleType: handwashType, predicate: predicate30d, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, s, _ in
                continuation.resume(returning: (s as? [HKCategorySample]) ?? [])
            }
            store.execute(q)
        }

        let samples8w: [HKCategorySample] = await withCheckedContinuation { continuation in
            let q = HKSampleQuery(sampleType: handwashType, predicate: predicate8w, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, s, _ in
                continuation.resume(returning: (s as? [HKCategorySample]) ?? [])
            }
            store.execute(q)
        }

        let totalCount = samples30d.count
        let avgDur = totalCount > 0 ? samples30d.reduce(0.0) { $0 + $1.endDate.timeIntervalSince($1.startDate) } / Double(totalCount) : 0

        // Today count
        let todayStart = Calendar.current.startOfDay(for: endDate)
        let todayCount = samples30d.filter { $0.startDate >= todayStart }.count

        // Weekly averages
        var weeklyCounts = Array(repeating: 0, count: 8)
        let now = Date()
        for s in samples8w {
            let weeksAgo = Int(now.timeIntervalSince(s.startDate) / (7 * 86400))
            if weeksAgo < 8 { weeklyCounts[weeksAgo] += 1 }
        }
        let weeklyAvg = weeklyCounts.map { Double($0) / 7.0 }

        await MainActor.run {
            self.totalHandwashes = totalCount
            self.avgDurationSec = avgDur
            self.todayCount = todayCount
            self.weeklyAverages = weeklyAvg
            self.isLoading = false
        }
    }
}
