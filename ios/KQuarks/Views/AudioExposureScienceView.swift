import SwiftUI
import HealthKit

struct AudioExposureScienceView: View {
    @State private var exposureSamples: [HKQuantitySample] = []
    @State private var avgExposureDB: Double = 0
    @State private var peakExposureDB: Double = 0
    @State private var highExposureDays: Int = 0
    @State private var weeklyAvgDB: [Double] = Array(repeating: 0, count: 8)
    @State private var isLoading = true

    private let store = HKHealthStore()

    private var exposureRiskColor: Color {
        if avgExposureDB >= 85 { return .red }
        if avgExposureDB >= 75 { return .orange }
        return .green
    }

    private var exposureRiskLabel: String {
        if avgExposureDB >= 85 { return "High Risk" }
        if avgExposureDB >= 75 { return "Moderate" }
        return "Safe"
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                exposureStatsRow
                weeklyExposureChart
                noiseDoseScienceCard
                cochlearDamageCard
                protectionScienceCard
                recoveryAndTherapyCard
            }
            .padding()
        }
        .navigationTitle("Audio Exposure Science")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var exposureStatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(value: avgExposureDB > 0 ? "\(Int(avgExposureDB)) dB" : "--", label: "Avg Exposure", color: exposureRiskColor)
                statCard(value: peakExposureDB > 0 ? "\(Int(peakExposureDB)) dB" : "--", label: "Peak Exposure", color: peakExposureDB >= 100 ? .red : .orange)
                statCard(value: "\(highExposureDays)", label: "High-Risk Days", color: highExposureDays > 0 ? .red : .green)
            }
            HStack {
                Circle().fill(exposureRiskColor).frame(width: 10, height: 10)
                Text("Current 7-day status: \(exposureRiskLabel)")
                    .font(.caption)
                    .foregroundColor(exposureRiskColor)
                Spacer()
                Text("WHO limit: 80 dB avg • OSHA: 85 dB/8h").font(.caption2).foregroundColor(.secondary)
            }
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
    private var weeklyExposureChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Avg Exposure (8 Weeks, dBA)").font(.headline)
            HStack(alignment: .bottom, spacing: 6) {
                ForEach(0..<8, id: \.self) { i in
                    let db = weeklyAvgDB[i]
                    let normalizedHeight = db > 0 ? CGFloat((db - 50) / 50) * 80 : 4
                    VStack(spacing: 2) {
                        if db > 0 {
                            Text("\(Int(db))").font(.system(size: 7)).foregroundColor(.secondary)
                        }
                        RoundedRectangle(cornerRadius: 3)
                            .fill(db >= 85 ? Color.red : db >= 75 ? Color.orange : Color.green)
                            .frame(height: max(normalizedHeight, 4))
                        Text("W\(8 - i)").font(.system(size: 8)).foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .frame(height: 110)
            HStack(spacing: 16) {
                legendItem(color: .green, label: "<75 dB Safe")
                legendItem(color: .orange, label: "75–84 dB Moderate")
                legendItem(color: .red, label: "≥85 dB High Risk")
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    private func legendItem(color: Color, label: String) -> some View {
        HStack(spacing: 4) {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(label).font(.caption2).foregroundColor(.secondary)
        }
    }

    // MARK: - Science Cards
    private var noiseDoseScienceCard: some View {
        scienceCard(title: "Noise Dose & Exposure Limits", icon: "🔊", color: .blue) {
            sciRow(stat: "WHO 2015", detail: "Safe listening limit: 80 dB for up to 40 hours/week; every 3 dB increase halves the safe exposure time — 83 dB = 20h/week, 86 dB = 10h/week, 89 dB = 5h/week (equal energy hypothesis)")
            sciRow(stat: "OSHA 1983", detail: "Permissible Exposure Limit: 90 dB for 8 hours, 95 dB for 4 hours, 100 dB for 2 hours; action level 85 dB triggers mandatory hearing conservation programs in workplaces")
            sciRow(stat: "Noise Level Scale", detail: "Reference: whisper 30 dB, conversation 60 dB, city traffic 85 dB, concert 100–120 dB, jet engine at 30m = 150 dB; each 10 dB increase = 10× sound intensity, perceived as 2× as loud")
            sciRow(stat: "Apple Watch Science", detail: "Headphone Audio Levels use LA,eq (A-weighted equivalent continuous sound level); 7-day rolling average >80 dB triggers warnings; peak measurement captures transient spikes above 100 dB instantly")
        }
    }

    private var cochlearDamageCard: some View {
        scienceCard(title: "Cochlear Damage Mechanisms", icon: "👂", color: .orange) {
            sciRow(stat: "Saunders 1991", detail: "Noise-induced hearing loss (NIHL) mechanism: loud sound causes excessive deflection of cochlear outer hair cells (OHCs); glutamate excitotoxicity at ribbon synapses; OHC loss is permanent — no regeneration in mammals")
            sciRow(stat: "Kujawa 2009", detail: "Cochlear synaptopathy ('hidden hearing loss'): moderate noise destroys auditory nerve synapses before any threshold shift; standard audiogram misses this damage; affects speech-in-noise comprehension first, often decades before audiometric loss")
            sciRow(stat: "Henderson 2006", detail: "Temporary threshold shift (TTS) recovers in 12–16 hours after exposure; permanent threshold shift (PTS) occurs with repeated TTS cycles; 3 dB TTS = marker for approaching the edge of permanent damage zone")
            sciRow(stat: "Liberman 2015", detail: "Noise-induced cochlear synaptopathy may underlie a hidden epidemic: young adults with normal audiograms show 30–50% synapse loss after years of recreational noise; difficulty with cocktail party speech is the earliest symptom")
        }
    }

    private var protectionScienceCard: some View {
        scienceCard(title: "Protection & Safe Listening", icon: "🛡️", color: .green) {
            sciRow(stat: "Berger 2003", detail: "Hearing protection device effectiveness: foam earplugs (NRR 33) reduce exposure ~17 dB in real-world use vs. rated 33 dB (ANSI derating); earmuffs NRR 25 = ~12 dB real-world; combined use adds only 5 dB")
            sciRow(stat: "WHO 2022", detail: "Make Listening Safe initiative: 1.1 billion young people at risk from unsafe headphone use; recommended maximum volume is 60% of max for no more than 60 minutes at a time (60/60 rule); noise-canceling headphones allow lower volume in noisy environments")
            sciRow(stat: "NIH NIDCD 2020", detail: "Custom musician's earplugs (Etymotic ER-15, ER-25) preserve fidelity while reducing all frequencies uniformly by 15 or 25 dB; preferred over foam plugs for musicians as they maintain spectral balance and speech intelligibility")
            sciRow(stat: "Rawool 2012", detail: "Quiet recovery zones: 16–24 hours of quiet after loud exposure (>85 dB) allows metabolic recovery in surviving hair cells; antioxidant supplementation (NAC, Mg) during exposure reduces NIHL in animal models by 40–60% — human trials ongoing")
        }
    }

    private var recoveryAndTherapyCard: some View {
        scienceCard(title: "Tinnitus, Recovery & Future Therapies", icon: "🔬", color: .purple) {
            sciRow(stat: "Bhatt 2016", detail: "Tinnitus prevalence: 15% of adults (50 million in US); noise-induced tinnitus risk 2.4× higher with recreational gun use without protection; risk doubles with each additional decade of occupational noise exposure >85 dB")
            sciRow(stat: "Shore 2016", detail: "Tinnitus mechanism: after NIHL, auditory cortex undergoes maladaptive plasticity — spontaneous firing rates increase, lateral inhibition is lost; bimodal stimulation (sound + electrical) partially reverses cortical changes in animal models")
            sciRow(stat: "Kujawa 2019", detail: "Cochlear hair cell regeneration research: FX-322 (Frequency Therapeutics, Phase 2) targets Wnt/Notch signaling to regenerate supporting cells; LCM-01 gene therapy restores VGLUT3 in inner hair cells — clinical trials ongoing as of 2024")
            sciRow(stat: "CBT for Tinnitus", detail: "Cognitive behavioral therapy (CBT) reduces tinnitus distress by 40–50% in randomized trials (Martinez 2013); sound therapy (masking/habituation) reduces tinnitus perception in 60% of sufferers; hearing aids double as tinnitus maskers when amplification thresholds overlap")
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

    // MARK: - Data Loading
    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        guard let headphoneType = HKObjectType.quantityType(forIdentifier: .headphoneAudioExposure),
              let envType = HKObjectType.quantityType(forIdentifier: .environmentalAudioExposure) else {
            isLoading = false; return
        }

        guard (try? await store.requestAuthorization(toShare: [], read: [headphoneType, envType])) != nil else {
            isLoading = false; return
        }

        let endDate = Date()
        let startDate = Calendar.current.date(byAdding: .day, value: -56, to: endDate) ?? Date()
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)

        let headphoneSamples: [HKQuantitySample] = await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: headphoneType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [sortDescriptor]) { _, samples, _ in
                continuation.resume(returning: (samples as? [HKQuantitySample]) ?? [])
            }
            store.execute(query)
        }

        let dbUnit = HKUnit.decibelAWeightedSoundPressureLevel()
        let dbValues = headphoneSamples.map { $0.quantity.doubleValue(for: dbUnit) }
        let avg = dbValues.isEmpty ? 0 : dbValues.reduce(0, +) / Double(dbValues.count)
        let peak = dbValues.max() ?? 0
        let highRisk = Set(headphoneSamples.filter { $0.quantity.doubleValue(for: dbUnit) >= 80 }.compactMap { Calendar.current.startOfDay(for: $0.startDate) }).count

        var weekly = Array(repeating: 0.0, count: 8)
        var weeklyCounts = Array(repeating: 0, count: 8)
        let now = Date()
        for sample in headphoneSamples {
            let weeksAgo = Int(now.timeIntervalSince(sample.startDate) / (7 * 86400))
            if weeksAgo < 8 {
                weekly[weeksAgo] += sample.quantity.doubleValue(for: dbUnit)
                weeklyCounts[weeksAgo] += 1
            }
        }
        let weeklyAvg = (0..<8).map { i in weeklyCounts[i] > 0 ? weekly[i] / Double(weeklyCounts[i]) : 0 }

        await MainActor.run {
            self.exposureSamples = headphoneSamples
            self.avgExposureDB = avg
            self.peakExposureDB = peak
            self.highExposureDays = highRisk
            self.weeklyAvgDB = weeklyAvg
            self.isLoading = false
        }
    }
}
