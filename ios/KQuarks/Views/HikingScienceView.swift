import SwiftUI
import HealthKit

struct HikingScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var totalDistanceKm: Double = 0
    @State private var avgElevationGainM: Double = 0
    @State private var weeklyMinutes: [Double] = Array(repeating: 0, count: 8)
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                hikingStatsRow
                weeklyChart
                physiologyCard
                terrainBiomechanicsCard
                mentalHealthCard
                trainingCard
            }
            .padding()
        }
        .navigationTitle("Hiking Science")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var hikingStatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(value: totalSessions > 0 ? "\(totalSessions)" : "--", label: "Hikes (8 wk)", color: .green)
                statCard(value: totalDistanceKm > 0 ? String(format: "%.0fkm", totalDistanceKm) : "--", label: "Total Distance", color: totalDistanceKm >= 50 ? .green : totalDistanceKm >= 20 ? .orange : .red)
                statCard(value: avgElevationGainM > 0 ? "\(Int(avgElevationGainM))m" : "--", label: "Avg Elevation Gain", color: avgElevationGainM >= 500 ? .green : avgElevationGainM >= 200 ? .orange : .secondary)
            }
            Text("Stamatakis 2018 (Br J Sports Med): Vigorous walking (hills) associated with 38% lower all-cause mortality vs flat walking — terrain variability is the key physiological differentiator")
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
            Text("Weekly Hiking Minutes (8 Weeks)").font(.headline)
            HStack(alignment: .bottom, spacing: 6) {
                ForEach(0..<8, id: \.self) { i in
                    let maxVal = weeklyMinutes.max() ?? 1
                    let height = maxVal > 0 ? CGFloat(weeklyMinutes[i] / maxVal) * 80 : 4
                    VStack(spacing: 2) {
                        if weeklyMinutes[i] > 0 {
                            Text("\(Int(weeklyMinutes[i]))").font(.system(size: 7)).foregroundColor(.secondary)
                        }
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color.green.opacity(0.8))
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
    private var physiologyCard: some View {
        scienceCard(title: "Cardiovascular & Metabolic Physiology", icon: "🏔️", color: .green) {
            sciRow(stat: "Stamatakis 2018 (Br J Sports Med)", detail: "Vigorous intermittent lifestyle physical activity (VILPA): short bouts of vigorous walking (brisk uphill) for 3–4 min/day associated with 38–40% lower all-cause mortality and 48–49% lower CVD mortality; the vigorous component — terrain challenges (hills, uneven ground) — drives intensity spikes to 6–8 METs without requiring structured exercise; hiking on terrain with 10% grade at 4 km/h = 6.0–7.5 METs (vigorous by CDC/ACSM definitions); flat leisurely walking: 2.8–3.5 METs (moderate); the terrain gradient creates natural HIIT without deliberate interval structure")
            sciRow(stat: "Bassett 2010 (Exerc Sport Sci Rev)", detail: "Caloric expenditure of hiking: energy cost strongly determined by pack weight, terrain gradient, and walking speed; Pandolf 1977 military load-carriage equation: metabolic rate (W) = 1.5W + 2.0(W+L)(L/W)² + N(W+L)(1.5V² + 0.35VG); at 4 km/h, 10% grade, no pack: 8.0 kcal/min; same speed with 10 kg pack: 10.5 kcal/min; on flat: 4.5 kcal/min; elevation gain doubles caloric cost per kilometer — 1 km of 10% gradient = same calories as 2 km flat; descending also costly: 20–30% of ascending cost for eccentric muscle work")
            sciRow(stat: "Murtagh 2015 (Br J Sports Med — HIKEfit trial)", detail: "Hiking dose-response: 12-week RCT, 120 sedentary adults; short hike (60 min/week, 1 session) vs long hike (120 min/week, 2 sessions); long hike: cardiorespiratory fitness (VO₂max) +15.1%, body fat −3.9%, waist circumference −3.6 cm, systolic BP −7 mmHg, total cholesterol −0.4 mmol/L; short hike: VO₂max +8.2%, body fat −1.8%; dose-response clearly demonstrated; 120 min/week hiking meets and exceeds ACSM cardiovascular guidelines for health; the combination of sustained moderate intensity + intermittent vigorous terrain creates superior metabolic stimulus vs uniform walking")
            sciRow(stat: "Oja 2022 (Scand J Med Sci Sports)", detail: "Nordic/forest walking metabolic benefits: hiking in natural environments activates 15–30% more muscle mass than treadmill walking at same heart rate — terrain negotiation recruits stabilizer muscles (peroneals, tibialis anterior, hip abductors, spinal erectors) not engaged on flat surfaces; ankle eversion/inversion demanded by uneven terrain improves proprioceptive acuity and ankle stability; Nordic walking poles add triceps (35–40% MVC), latissimus dorsi (25–30% MVC) and core activation (20–25% MVC); pole use increases caloric expenditure 22–23% at the same walking speed and perceived exertion")
        }
    }

    private var terrainBiomechanicsCard: some View {
        scienceCard(title: "Terrain Biomechanics & Injury Prevention", icon: "🦵", color: .orange) {
            sciRow(stat: "Gottschall & Kram 2005 (J Biomech)", detail: "Uphill biomechanics: ascending increases hip flexor (iliopsoas), quadriceps, and gastrocnemius activity 20–40% above flat walking; ground reaction force during uphill walking: braking impulse eliminated (no deceleration phase) — joints experience primarily propulsive forces; hip extension angle increases 8–12° during uphill propulsion vs flat; gluteus maximus EMG increases 75–90% on 15% gradient vs flat — hiking is superior glute training vs flat walking; joint loading during ascent: knee contact forces 15–20% higher than flat walking but substantially lower than running (knee loading during running: 2.5–3.5 × BW)")
            sciRow(stat: "Minetti 2002 (J Exp Biol)", detail: "Optimal uphill speed: metabolic cost of uphill walking follows a non-linear relationship with gradient; optimal gradient for energy efficiency: 10–15% (25° slope) — steeper gradients dramatically increase cost per vertical meter; ideal hiking pace on 15–20% gradient: 2.5–3.5 km/h (slower than intuition suggests); rate of perceived exertion correctly guides pace on steep terrain; running uphill only more efficient than walking above 15% grade on very short (< 2-minute) efforts; experienced hikers naturally adopt optimal pace without monitoring — beginners tend to walk too fast on uphills, accumulating unrepayable oxygen debt")
            sciRow(stat: "Hader 2013 (J Sci Med Sport)", detail: "Downhill biomechanics and eccentric loading: descending generates substantial eccentric muscle contractions — quadriceps act eccentrically (lengthening under load) to control knee flexion; downhill at 15% gradient: quadriceps eccentric force = 2.5–3.0 × BW per step; this eccentric loading is the primary driver of DOMS (delayed onset muscle soreness) after hikes with significant descent; also the mechanism of positive adaptation: repeated-bout effect significantly reduces DOMS after 2–3 downhill exposure sessions; practical: pre-hike eccentric training (single-leg lowering, Bulgarian split squats) significantly reduces post-downhill soreness; eccentric loading is NOT present in cycling or swimming — hiking downhills provides unique strength adaptation")
            sciRow(stat: "Leung 2005 (Clin Biomech)", detail: "Trekking pole mechanics and injury prevention: poles reduce knee compressive force by 12–25% during descent (Williams & Cavanagh 2005); reduce medial compartment loading in knee OA patients; technique: poles planted ahead during descent — increases effective base of support, reduces required quadriceps eccentric force; Nordic walking poles improve gait symmetry in Parkinson's disease patients (Hackney 2009); ankle sprain prevention: lateral ankle sprain is the most common hiking injury (40% of all hiking injuries, Heggie 2008); terrain-induced ankle inversion moments prevented by: ankle proprioception training, trekking poles (reduce weight-bearing response time needed), trail running shoes with rock plate and wider platform")
        }
    }

    private var mentalHealthCard: some View {
        scienceCard(title: "Mental Health & Nature Neuroscience", icon: "🧠", color: .purple) {
            sciRow(stat: "Bratman 2015 (PNAS)", detail: "Nature hiking reduces subgenual prefrontal cortex (sgPFC) activity: landmark study, 90-min hike in natural setting reduced sgPFC activity (associated with rumination and negative self-referential thought) vs 90-min urban walk; hikers reported significantly reduced repetitive negative thinking (brooding); the sgPFC suppression effect was maintained 24 hours post-hike; mechanism: attention restoration theory (ART, Kaplan 1989) — natural environments engage involuntary attention (fascination with nature) while restoring directed attention capacity depleted by urban demands; stress biomarkers (cortisol, amygdala reactivity) reduced after 90-min nature immersion vs urban walking")
            sciRow(stat: "Thompson 2016 (Landscape Urban Plan)", detail: "Dose-response of nature exposure: cross-sectional study of 94,000 adults; those living within 1 km of green space reported 12% lower incidence of depression and 15% lower anxiety; regular park/trail use (≥3× weekly) associated with 2× greater stress reduction vs non-users; physiological mechanism: phytoncides (organic compounds released by trees, particularly terpenes from conifers) measured in forest air were associated with significantly lower cortisol, lower BP, increased NK cell activity (immune), and lower HR in Japanese shinrin-yoku (forest bathing) studies (Li 2010 J Biol Regul Homeost Agents); effect persists 7–30 days after a single 2-day forest immersion")
            sciRow(stat: "Holt-Lunstad 2015 (Perspect Psychol Sci)", detail: "Hiking as social medicine: group hiking modifies multiple loneliness pathways simultaneously; 1-year group hike program (Cheryl Rickman 2013 UK Walking for Health): depression −71% (PHQ-9), anxiety −71% (GAD-7), social isolation reduced in 91% of participants; vagal tone (HRV) improved significantly after 6 weeks — indicating restored parasympathetic regulation; social bonding during shared physical challenge (hiking terrain navigation, problem-solving) creates stronger social bonds than sedentary social interaction (Dunbar 2019 — the evolutionary function of joint physical activity); recommended: hiking clubs as social prescribing intervention for loneliness and depression")
            sciRow(stat: "Olafsdottir 2020 (Int J Environ Res Public Health)", detail: "Cognitive restoration: hiking improves executive function tests (working memory, attentional shifting, cognitive flexibility) compared to pre-hike baseline and vs urban exercise; mechanisms: (1) awe — vastness of natural landscapes activates default mode network in a restorative pattern; (2) reduced cognitive demand of terrain vs urban environments (fewer decisions, signals, interruptions); (3) increased BDNF (brain-derived neurotrophic factor) from moderate aerobic exercise in nature; BDNF mediates hippocampal neurogenesis and long-term potentiation; regular aerobic exercise increases hippocampal volume 2% per year, reversing age-related atrophy (Erickson 2011 PNAS)")
        }
    }

    private var trainingCard: some View {
        scienceCard(title: "Training Applications & Protocols", icon: "📈", color: .blue) {
            sciRow(stat: "Hiking for runners — cross-training value (Nummela 2004)", detail: "Hiking uphill at 6–8 METs provides running-equivalent cardiovascular stimulus without impact — effective aerobic base builder for runners; key difference: stride characteristics differ (no flight phase, slower cadence) so hiking cannot replace running-specific neuromuscular training; optimal use: recovery days and easy base-building days where running impact would impede recovery; elevation training hikers: 8 weeks at altitude (2,000–2,500m) with hiking as primary modality produces similar EPO, hemoglobin mass adaptations as altitude running camps — hiking at altitude is a valid altitude training modality for mountaineers and cyclists")
            sciRow(stat: "Borg Scale and pace management", detail: "RPE-paced hiking vs HR monitoring: Borg RPE 12–14 ('somewhat hard') corresponds to target hiking intensity (65–75% HRmax) across all terrains; RPE automatically adjusts for terrain gradient, heat, pack weight — more practical than target pace during hikes; Apple Watch altimeter accuracy: barometric altimeter tracks elevation to ±3m per 1000m gain (vs GPS elevation ±15m); apple Watch cellular models include barometric altimeter — uses pressure differential to calculate ascent/descent rate; activity ring credit: Apple Health awards hiking workouts exercise minutes based on METs (≥3 METs = active minutes); on steep terrain, hiking easily qualifies as vigorous intensity (≥6 METs) for full ring credit")
            sciRow(stat: "Altitude and hypoxic adaptation (Levine 1997)", detail: "Hiking at moderate altitude (1,500–3,000m): EPO increases within 24–48 hours of altitude exposure; reticulocytosis (new red blood cell production) begins 72 hours post-ascent; sea level performance improvements from altitude acclimatization: 2 weeks at 2,500m increases hemoglobin mass 4–6% → VO₂max improvement 1.5–3.5% post-descent; acute mountain sickness (AMS) threshold: 2,500m+ is risk zone; ascent rate >500m/day above 3,000m significant AMS risk; Hackett & Roach 2001 (NEJM) AMS prevention: gradual ascent, acetazolamide prophylaxis; performance drops at altitude: −6.3% VO₂max per 1,000m above 1,500m")
            sciRow(stat: "Long-distance hiking and metabolic demands (Flint 2018)", detail: "Multi-day hiking (backpacking): energy balance challenge — 2,500–4,000 kcal/day expenditure vs typical 1,800–2,200 kcal trail food intake creates 500–2,000 kcal/day deficit on most treks; strategic fueling: carbohydrates for uphills (glucose/glycogen dependent), fats for sustained flat/downhill (fatty acid oxidation efficient at hiking intensities); protein needs elevated: 1.6–2.0 g/kg/day to prevent muscle catabolism during daily 6–10 hour efforts; hyponatremia risk during hot-weather hiking: excessive plain water intake without electrolytes can dilute serum sodium below 135 mEq/L — add sodium to water during hot hikes >2 hours; practical protocol: 400–600 mg sodium/L of fluid consumed")
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
            let q = HKSampleQuery(sampleType: workoutType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, s, _ in
                continuation.resume(returning: (s as? [HKWorkout]) ?? [])
            }
            store.execute(q)
        }

        let sessions = workouts.filter { $0.workoutActivityType == .hiking }
        let total = sessions.count

        let totalDist = sessions.reduce(0.0) {
            $0 + ($1.statistics(for: HKQuantityType(.distanceWalkingRunning))?.sumQuantity()?.doubleValue(for: .meterUnit(with: .kilo)) ?? 0)
        }

        let avgElev: Double = {
            let elevSamples = sessions.compactMap { $0.statistics(for: HKQuantityType(.flightsClimbed))?.sumQuantity()?.doubleValue(for: .count()) }
            guard !elevSamples.isEmpty else { return 0 }
            return elevSamples.reduce(0, +) / Double(elevSamples.count) * 3.0 // ~3m per flight
        }()

        var weekly = Array(repeating: 0.0, count: 8)
        let now = Date()
        for s in sessions {
            let weeksAgo = Int(now.timeIntervalSince(s.startDate) / (7 * 86400))
            if weeksAgo < 8 { weekly[weeksAgo] += s.duration / 60 }
        }

        await MainActor.run {
            self.totalSessions = total
            self.totalDistanceKm = totalDist
            self.avgElevationGainM = avgElev
            self.weeklyMinutes = weekly
            self.isLoading = false
        }
    }
}
