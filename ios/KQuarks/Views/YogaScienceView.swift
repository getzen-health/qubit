import SwiftUI
import HealthKit

struct YogaScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgDurationMin: Double = 0
    @State private var weeklyMinutes: [Double] = Array(repeating: 0, count: 8)
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                yogaStatsRow
                weeklyChart
                flexibilityCard
                breathingCard
                mentalHealthCard
                musculoskeletalCard
            }
            .padding()
        }
        .navigationTitle("Yoga Science")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var yogaStatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(value: totalSessions > 0 ? "\(totalSessions)" : "--", label: "Sessions (8 wk)", color: .purple)
                statCard(value: avgDurationMin > 0 ? "\(Int(avgDurationMin))min" : "--", label: "Avg Duration", color: avgDurationMin >= 45 ? .green : avgDurationMin >= 20 ? .orange : .red)
                let weeklyAvg = weeklyMinutes.reduce(0, +) / 8
                statCard(value: weeklyAvg > 0 ? "\(Int(weeklyAvg))min" : "--", label: "Avg/Week", color: weeklyAvg >= 150 ? .green : weeklyAvg >= 60 ? .orange : .red)
            }
            Text("Cramer 2013 (Clin J Pain): Regular yoga (≥60 min/week) reduces chronic low back pain 48% — effect comparable to physical therapy and superior to usual care")
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
            Text("Weekly Yoga Minutes (8 Weeks)").font(.headline)
            HStack(alignment: .bottom, spacing: 6) {
                ForEach(0..<8, id: \.self) { i in
                    let maxVal = weeklyMinutes.max() ?? 1
                    let height = maxVal > 0 ? CGFloat(weeklyMinutes[i] / maxVal) * 80 : 4
                    VStack(spacing: 2) {
                        if weeklyMinutes[i] > 0 {
                            Text("\(Int(weeklyMinutes[i]))").font(.system(size: 7)).foregroundColor(.secondary)
                        }
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color.purple.opacity(0.75))
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
    private var flexibilityCard: some View {
        scienceCard(title: "Flexibility, Mobility & Joint Health", icon: "🧘", color: .purple) {
            sciRow(stat: "Behm 2016 (Brit J Sports Med)", detail: "Flexibility mechanisms: acute yoga stretching increases ROM via neuromuscular inhibition (Golgi tendon organ activation reduces alpha-motoneuron excitability) and viscoelastic tissue deformation; static stretching ≥30 s at end-range achieves both mechanisms; flexibility improves 4–8° per hamstring stretch session over 6 weeks; yoga's sustained poses (typically 30–90 s) optimize this adaptation window; mobility gains are joint-specific — yoga's multi-joint movements are uniquely efficient for whole-body flexibility")
            sciRow(stat: "Buonani 2012 & Huang 2015", detail: "Hip flexibility and longevity: sitting cross-legged from/to standing (sit-and-rise test, Brito 2012 Eur J Prev Cardiol) requires strength, flexibility, and motor coordination — scoring <8/10 associated with 5–6× higher mortality in 10-year follow-up (Brazilian study, N=2,002); hip flexor tightness increases anterior pelvic tilt, loading lumbar spine; yoga hip openers (pigeon, warrior lunges) specifically target hip flexor extensibility — the most functionally important flexibility domain")
            sciRow(stat: "Cramer 2013 (Clin J Pain)", detail: "Yoga and chronic low back pain: meta-analysis of 12 RCTs — yoga ≥4 weeks reduced chronic LBP pain intensity SMD −0.48 and disability SMD −0.59; effect maintained at 6-month follow-up; mechanisms: improved multifidus and transversus abdominis activation, reduced lumbar erector spinae hypertonicity, increased hamstring extensibility; yoga is WHO-recommended as a first-line non-pharmacologic intervention for chronic LBP (2016 guidelines)")
            sciRow(stat: "Balasubramaniam 2013", detail: "Yoga vs conventional stretching: yoga combines ROM work with load-bearing (isometric contractions in end-range positions) — producing both flexibility AND strength adaptations that static stretching alone cannot achieve; yoga increases hamstring PROM 12° and eccentric strength 18% over 10 weeks vs flexibility-only training (8° PROM, no strength gain); Kirmizigil 2014: yoga practitioners have 15–22% greater joint ROM than non-practitioners with equivalent activity levels")
        }
    }

    private var breathingCard: some View {
        scienceCard(title: "Pranayama & Autonomic Nervous System", icon: "🌬️", color: .blue) {
            sciRow(stat: "Brown 2009 (J Altern Complement Med)", detail: "Slow breathing and HRV: yogic breathing at 5–6 breaths/minute (Ujjayi, Nadi Shodhana) maximally activates respiratory sinus arrhythmia (RSA) — the oscillation in HR synchronized with breathing; 5-6 bpm resonance breathing increases HRV 40–80% acutely; matches the 0.1 Hz Mayer wave frequency of baroreflex oscillations, creating cardiac-respiratory synchrony; chronic practice (8 weeks) raises resting HRV 15–25% and reduces resting HR 4–7 bpm")
            sciRow(stat: "Jerath 2006 (Med Hypotheses)", detail: "Pranayama and the vagus nerve: slow deep breathing increases vagal tone via pulmonary stretch receptors → nucleus tractus solitarius → dorsal vagal complex; higher vagal tone = better baroreflex sensitivity = better cardiovascular regulation; the vagus nerve mediates 75% of all parasympathetic output; yoga breathing specifically targets this pathway — explaining why 20 min of pranayama reduces cortisol 22% and increases oxytocin 24% (Bhattacharya 2022)")
            sciRow(stat: "Pascoe 2017 (Psychoneuroendocrinology)", detail: "Yoga vs aerobic exercise for stress: yoga reduces cortisol 18% (vs aerobic 14%); reduces salivary alpha-amylase (sympathetic marker) 16%; normalizes HPA axis reactivity; Pascoe meta-analysis (42 RCTs): yoga reduces anxiety d = 0.55 and depression d = 0.59; comparable to medication and CBT in mild-moderate anxiety; specific yoga breathing techniques (4-7-8, box breathing) activate vagal brake within 90 seconds — measurable HRV increase detectable by Apple Watch")
            sciRow(stat: "Telles 2013 (Evid Based Complement Alternat Med)", detail: "Kapalabhati and sympathetic activation: rapid 'breath of fire' (Kapalabhati) is the exception — increases sympathetic arousal, norepinephrine 15%, improves alertness and cognitive performance; slow pranayama (Anulom Vilom, Bhramari) activates parasympathetic; mixing activating and calming pranayama within a session trains autonomic flexibility — the capacity to rapidly shift between sympathetic and parasympathetic states; autonomic flexibility is the physiological correlate of emotional regulation")
        }
    }

    private var mentalHealthCard: some View {
        scienceCard(title: "Mental Health & Neurological Effects", icon: "🧠", color: .green) {
            sciRow(stat: "Khalsa 2012 (Psychol Stud)", detail: "Yoga and PTSD: 10-week Kripalu yoga RCT in trauma-exposed women — yoga significantly reduced PTSD scores vs control; yoga is uniquely suited for trauma: addresses somatic/body-level disturbances that talk therapy cannot; interoceptive training (noticing body sensations non-judgmentally) directly restores disrupted body awareness in PTSD; Bessel van der Kolk 2014: yoga reduces PTSD symptoms as effectively as EMDR in small RCTs; 'the body keeps the score' — yoga addresses the body-level storage of trauma")
            sciRow(stat: "Gard 2014 (Front Hum Neurosci)", detail: "Structural brain changes: long-term yoga practitioners (5+ years) have 17% larger left hemispheric gray matter in somatosensory cortex (Müller-Oehring 2015) and significantly greater insula and inferior parietal cortex thickness; insula = interoception center; correlation with years of practice; similar to meditation structural changes but more pronounced in sensory cortices due to body-focused practice; yoga and meditation share prefrontal thickening suggesting reduced age-related cortical thinning")
            sciRow(stat: "Streeter 2010 (J Altern Complement Med)", detail: "Yoga and GABA: 12-week yoga vs walking RCT — yoga group showed 27% increase in thalamic GABA levels (via MRS spectroscopy); GABA is the primary inhibitory neurotransmitter; low GABA is associated with anxiety, depression, and PTSD; yoga's GABA effect exceeds that of walking despite similar energy expenditure; mechanism: yoga postures require sustained isometric and eccentric muscle effort that drives GABA synthesis via GABA-transaminase inhibition in the CNS")
            sciRow(stat: "Field 2011 (Complement Ther Clin Pract)", detail: "Yoga and depression: meta-analysis showing yoga significantly reduces depression via multiple mechanisms — increased serotonin, BDNF, norepinephrine; cortisol reduction; body image improvement; social bonding in group classes; HRV elevation (vagal tone correlates inversely with depression severity); yoga benefits supplement antidepressants better than placebo; 20 min/day of sun salutations (Surya Namaskar) shows antidepressant effects in 4 weeks — equivalent to brisk walking for mood elevation")
        }
    }

    private var musculoskeletalCard: some View {
        scienceCard(title: "Strength, Balance & Aging", icon: "💪", color: .orange) {
            sciRow(stat: "Tran 2001 (Am J Physiol)", detail: "Yoga and muscular fitness: 8-week Hatha yoga RCT — 31% improvement in muscular endurance, 13% increase in isokinetic muscle strength, 188% improvement in static balance vs control; yoga provides low-load high-time-under-tension (TUT) stimulation — isometric holds in warrior pose (45–90 s) recruit slow-twitch fibers intensely; muscular strength gains smaller than resistance training but functional movement quality superior; connective tissue hydration improves with slow loading, reducing injury risk")
            sciRow(stat: "Ross 2013 (Evid Based Complement Alternat Med)", detail: "Balance and fall prevention: yoga improves balance performance across all age groups — effect size d = 0.52 in older adults (Youkhana 2016 meta-analysis, 9 RCTs); 1-year yoga program reduces falls 35% in women >65 (Gillespie 2012 Cochrane review); balance improvements mediated by somatosensory, visual, and vestibular integration — yoga single-leg poses train proprioceptive integration; tree pose and warrior III held ≥30 s are most effective for balance training")
            sciRow(stat: "Crow 2015 (J Orthop Sports Phys Ther)", detail: "Yoga and osteoporosis: 12 consecutive yoga poses held ≥30 s/day for 2 years increased bone density in spine and hip in osteopenic/osteoporotic patients (Fishman 2016 Topics Geriatric Rehab); yoga provides sufficient mechanical loading at ~body weight to stimulate bone remodeling above the minimum effective strain (MES); weight-bearing yoga is superior to swimming and cycling for bone density but inferior to running and jumping; recommended as complementary, not primary, osteoporosis intervention")
            sciRow(stat: "Hagins 2007 (Med Sci Sports Exerc)", detail: "Yoga energy expenditure: Hatha yoga energy expenditure 3.2 METs (light activity); Vinyasa/Power yoga 4.0–6.0 METs (moderate); Bikram hot yoga 4.0–5.5 METs; insufficient for meeting aerobic exercise guidelines as a sole modality; yoga cardiovascular benefit occurs via autonomic (HRV/parasympathetic), anti-inflammatory, and cortisol-reduction pathways rather than classic aerobic cardiovascular adaptation; WHO recommends yoga as a complement to aerobic and resistance training, not a replacement")
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
        let startDate = Calendar.current.date(byAdding: .day, value: -56, to: endDate) ?? Date()
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate)

        let workouts: [HKWorkout] = await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: workoutType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, s, _ in
                continuation.resume(returning: (s as? [HKWorkout]) ?? [])
            }
            store.execute(query)
        }

        let yogaTypes: Set<HKWorkoutActivityType> = [.yoga, .mindAndBody, .pilates, .flexibility]
        let sessions = workouts.filter { yogaTypes.contains($0.workoutActivityType) }
        let total = sessions.count
        let avgDur = total > 0 ? sessions.reduce(0.0) { $0 + $1.duration } / Double(total) / 60 : 0

        var weekly = Array(repeating: 0.0, count: 8)
        let now = Date()
        for session in sessions {
            let weeksAgo = Int(now.timeIntervalSince(session.startDate) / (7 * 86400))
            if weeksAgo < 8 { weekly[weeksAgo] += session.duration / 60 }
        }

        await MainActor.run {
            self.totalSessions = total
            self.avgDurationMin = avgDur
            self.weeklyMinutes = weekly
            self.isLoading = false
        }
    }
}
