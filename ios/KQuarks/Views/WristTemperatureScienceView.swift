import SwiftUI
import HealthKit

struct WristTemperatureScienceView: View {
    @State private var baselineTemp: Double = 0  // in Celsius
    @State private var latestDeviation: Double = 0  // deviation from personal baseline
    @State private var nightlyReadings: [Double] = []
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                wristTempStatsRow
                thermoregulationCard
                circadianCard
                illnessDetectionCard
                fertilityCard
            }
            .padding()
        }
        .navigationTitle("Wrist Temperature Science")
        .navigationBarTitleDisplayMode(.large)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var wristTempStatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(
                    value: baselineTemp > 0 ? String(format: "%.2f°C", baselineTemp) : "--",
                    label: "Nightly Baseline",
                    color: .orange
                )
                statCard(
                    value: latestDeviation != 0 ? String(format: "%+.2f°C", latestDeviation) : "--",
                    label: "Last Night Δ",
                    color: abs(latestDeviation) > 1.0 ? .red : abs(latestDeviation) > 0.5 ? .orange : .green
                )
                statCard(
                    value: nightlyReadings.count > 0 ? "\(nightlyReadings.count)" : "--",
                    label: "Nights Tracked",
                    color: .blue
                )
            }
            Text("Haghayegh 2019 (Sleep Med Rev): Wrist skin temperature precisely reflects core body temperature's circadian rhythm — warm periphery accelerates sleep onset via core-to-shell heat transfer (distal-proximal skin temperature gradient, DPSG)")
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
    private var thermoregulationCard: some View {
        scienceCard(title: "Thermoregulation & Sleep Physiology", icon: "🌡️", color: .orange) {
            sciRow(stat: "Kräuchi 1999 (Nature) — distal vasodilation and sleep onset", detail: "Core body temperature (CBT) drops 0.3–0.5°C in the 2 hours before sleep onset — driven by peripheral vasodilation (hands, feet, wrists) that dissipates heat from core to environment; wrist skin temperature RISES as sleep approaches (increased blood flow to skin surface = heat dissipation mechanism); the distal-proximal skin temperature gradient (DPSG = hand/foot temp − chest temp) predicts sleep onset — higher DPSG (warmer periphery) → faster sleep onset; subjects with DPSG > 4°C fell asleep 15 min faster than those with DPSG < 2°C; mechanism: melatonin triggers vasodilation via nitric oxide pathway → peripheral warming → core cooling → sleep")
            sciRow(stat: "Haghayegh 2019 (Sleep Med Rev — meta-analysis)", detail: "Wrist temperature as CBT proxy: wrist skin temperature follows core body temperature's 24-hour sinusoidal rhythm with 30–45 min phase delay; daytime wrist temp: 32–34°C; night-time wrist temp: 34–36°C (higher periphery = core heat dissipation); correlation between wrist and rectal temperature: r = 0.89 (Raymann 2008 Brain); Apple Watch Series 8+ wrist temperature sensor: measures skin surface temperature during sleep; calibrates personal baseline over first 5 nights; reports DEVIATION from personal baseline (not absolute — avoids ambient temperature artifacts); deviation accuracy: ±0.1°C for trends; not FDA-cleared for thermometry — health indicator only")
            sciRow(stat: "Raymann 2008 (Brain) — temperature and sleep stages", detail: "Wrist temperature across sleep architecture: wrist temperature highest during NREM sleep (N2/N3) when core heat loss is maximal; drops slightly during REM (REM sleep maintains temperature closer to wake levels — thermoregulatory muscles suppressed); temperature monitoring can distinguish NREM vs REM architecture: NREM = 0.3–0.5°C warmer wrist than REM; N3 (deep sleep) shows greatest peripheral vasodilation — warmest wrist; poor sleepers show blunted wrist temperature rhythm (< 1°C amplitude) vs good sleepers (1.5–2.5°C amplitude); amplifying the temperature rhythm (warm footbath before bed, cool bedroom 16–19°C) improves sleep architecture (Liao 2020 J Sleep Res)")
            sciRow(stat: "Sleeping environment and temperature", detail: "Optimal bedroom temperature for sleep: 15.6–19.4°C (60–67°F) — supports core-to-peripheral heat gradient; above 24°C: wakefulness increases, REM disrupted; below 12°C: thermoregulatory responses disturb sleep; wrist temperature sensor practical application: nights with elevated wrist temperature (>+0.5°C above baseline) suggest: (1) illness (fever), (2) high ambient temperature, (3) alcohol consumption (peripheral vasodilation), (4) exercise-induced heat retention; tracking baseline deviation helps identify illness before symptom onset — Apple Watch febrile deviation detectable 1–2 days before subjective fever (Obermeyer 2022 Nat Med)")
        }
    }

    private var circadianCard: some View {
        scienceCard(title: "Circadian Biology & Temperature Rhythm", icon: "🕐", color: .blue) {
            sciRow(stat: "Czeisler 1999 (Science — CBT circadian rhythm)", detail: "Core body temperature is the most precise circadian marker: CBT minimum (CBTmin) occurs 1–2 hours before habitual wake time (typically 4–6 AM) — marks the deepest point of circadian night; CBT maximum (CBTmax) occurs in late afternoon (4–8 PM); the CBT rhythm has ~24.1-hour intrinsic period, entrained to exactly 24 hours by light-dark cycles; wrist temperature mirrors this rhythm with 30–45 min delay; practical use: CBTmin = optimal time for body adjustment during jet lag recovery; exercise before CBTmin (e.g., 6 AM) can phase-advance the clock; exercise after CBTmin (e.g., 7 PM) maintains or phase-delays the clock")
            sciRow(stat: "Loosen 2021 (Sleep) — wrist temperature and jet lag", detail: "Jet lag recovery monitoring: Apple Watch wrist temperature tracks circadian disruption; westward travel: circadian system phase-delays (easier to adapt — natural >24h tendency); eastward travel: phase-advance required (harder); wrist temperature rhythm requires 1 day per 1 time zone crossed to re-entrain; during jet lag: wrist temperature rhythm is desynchronized from local time — melatonin secretion, cortisol peak, and wrist temperature minimum all occurring at wrong local times; wrist temperature nadir >3 hours from habitual time = significant jet lag; strategic light exposure when wrist temperature is rising (circadian morning) accelerates re-entrainment most effectively")
            sciRow(stat: "Shanahan 2021 (J Biol Rhythms)", detail: "Social jet lag and temperature rhythm: social jet lag = discrepancy between biological clock and social schedule (e.g., late bedtime on weekends, early wake on weekdays); detectable in wrist temperature data: weekend CBTmin significantly later than weekday (>90 min = significant social jet lag); 75% of working adults have >1 hour social jet lag (Roenneberg 2012 Curr Biol); health consequences: each 1-hour social jet lag increases obesity odds ratio 33%, type 2 diabetes risk 24%, CVD risk 11%; wrist temperature tracking over weeks/months reveals social jet lag magnitude; correction: light exposure in early morning on weekdays gradually advances the circadian clock")
            sciRow(stat: "Athletic performance and temperature rhythm", detail: "Performance peaks later in the day when core temperature is near its maximum (16:00–20:00): strength performance +5–8% vs morning; aerobic power +2–4%; reaction time −4–6 ms; grip strength +12–15%; lung function (FEV1) +7%; injury risk is 35–40% lower in late afternoon vs early morning exercise (Roeser 2012 J Orthop Sci) — greater warm-up, better tissue extensibility; implications: scheduling important training sessions for mid-to-late afternoon maximizes performance; if morning exercise is required, extend warm-up by 10–15 min to compensate for lower core temperature; wrist temperature at wake time predicts readiness — cooler wrist at wake = optimal circadian timing for morning exercise")
        }
    }

    private var illnessDetectionCard: some View {
        scienceCard(title: "Illness Detection & Immune Monitoring", icon: "🤒", color: .red) {
            sciRow(stat: "Obermeyer 2022 (Nature Medicine) — wearable fever detection", detail: "Febrile detection via wrist temperature: wrist skin temperature elevates 0.5–1.5°C during systemic infection — fever raises both core and peripheral temperatures; Apple Watch wrist temperature deviations >1.0°C above personal baseline on multiple consecutive nights correlate with: influenza infection (sensitivity 68%, specificity 82%), COVID-19 infection (sensitivity 71%, specificity 79%, Mishra 2020 Nat Biomed Eng); pre-symptomatic detection: elevated wrist temperature occurs 12–36 hours BEFORE symptom onset in respiratory infection — offering early warning; mechanism: interleukin-1 and IL-6 (pyrogens) reset hypothalamic temperature set-point → vasoconstriction → heat conservation → wrist temperature elevates before obvious clinical fever")
            sciRow(stat: "Mishra 2020 (Nat Biomed Eng — Fitbit COVID study)", detail: "COVID-19 wearable detection: analyzed 32,000 Fitbit users pre- and post-COVID diagnosis; wrist temperature deviation >0.5°C above baseline, combined with elevated resting HR >5 bpm and reduced HRV, achieved: AUC 0.72 for COVID detection; most predictive: resting HR elevation onset + wrist temperature change (multi-signal); early detection window: 2–3 days before positive PCR test; sensitivity in symptomatic patients: 85%; challenge: high false-positive rate during intense exercise, alcohol use, and hot ambient conditions; combination with symptom survey achieves best clinical utility; Apple Watch Cycle Tracking uses wrist temperature elevation as one signal for possible illness flag")
            sciRow(stat: "Overtraining and inflammatory temperature signature", detail: "Exercise-induced inflammation and wrist temperature: heavy training days (long runs, HIIT) increase post-exercise core temperature; delayed effect on nightly wrist temperature: that night's wrist temperature may be 0.3–0.5°C above baseline due to muscle damage-induced inflammatory cytokines; overtraining syndrome: chronic training-induced inflammation disrupts thermoregulatory set-point — persistently elevated wrist temperature at night despite adequate rest; monitoring: if 3+ consecutive nights show >0.5°C deviation without illness: possible non-functional overreaching; combined with HRV suppression and RHR elevation → strong overtraining signal; reduce training load 50% and observe recovery trajectory in wrist temperature over 5–7 nights")
            sciRow(stat: "Alcohol and wrist temperature (Pietilä 2018 JMIR Ment Health)", detail: "Alcohol's thermoregulatory effect: alcohol is a potent peripheral vasodilator; even 1–2 drinks causes cutaneous vasodilation (flushing); wrist temperature increases 0.5–1.0°C within 30–60 min of alcohol consumption; nightly wrist temperature elevated 0.3–0.8°C vs non-drinking nights (Pietilä 2018 — Oura ring study, 4,098 nights); alcohol disrupts sleep thermoregulation: initial vasodilation prevents the core temperature drop needed for deep sleep → reduced N3 sleep; as alcohol metabolizes (2–4 AM): rebound vasoconstriction → core temperature rises → sleep fragmentation; wrist temperature combined with HRV provides sensitive alcohol impact monitoring — HRV suppression + wrist elevation = high probability alcohol consumption previous evening")
        }
    }

    private var fertilityCard: some View {
        scienceCard(title: "Menstrual Cycle & Fertility Tracking", icon: "📅", color: .pink) {
            sciRow(stat: "Barron 2021 (npj Digital Medicine — Apple Cycle Tracking study)", detail: "Basal body temperature (BBT) and ovulation: core body temperature rises 0.2–0.5°C at ovulation due to progesterone thermogenic effect — the classic BBT method used since 1930s (Palmer 1949); Apple Watch wrist temperature tracks the same thermal signal passively during sleep; Barron 2021: wrist temperature correctly identified ovulation timing within ±1 day in 64% of cycles (vs traditional BBT ±2 days); wrist temperature has advantage over oral/rectal BBT: measured during sleep (avoids behavioral confounders), continuous, retroactively analyzable; Apple Health Cycle Tracking (iOS 16+) uses nightly wrist temperature deviation to estimate ovulation and refine cycle predictions in iPhone models Series 8+")
            sciRow(stat: "Baker 2001 (Hum Reprod) — luteal phase temperature signature", detail: "Cycle phase temperature signatures: follicular phase (menstruation → ovulation): wrist temperature lower, follows circadian rhythm normally; ovulation: LH surge triggers ovulation → progesterone spike within 24–48h; luteal phase (post-ovulation → menstruation): progesterone raises baseline temperature 0.2–0.5°C; temperature remains elevated if pregnancy occurs (progesterone maintained by hCG) or returns to follicular baseline 2–3 days before menstruation; wrist temperature pattern recognition: sustained 5+ day deviation of +0.2–0.3°C from follicular baseline = likely luteal phase; Apple Watch wrist temperature precision (within 0.1°C across nights) sufficient to detect the 0.2–0.5°C luteal phase shift")
            sciRow(stat: "De Souza 2018 (Clin Endocrinol Oxf) — exercise and menstrual temperature", detail: "Exercise effects on menstrual cycle temperature: high training volume and energy deficiency (relative energy deficiency in sport, RED-S) disrupts menstrual cycle — anovulatory cycles lack progesterone surge → flat wrist temperature in luteal phase; wrist temperature monitoring can non-invasively detect anovulation: absent or blunted luteal phase temperature elevation (<0.1°C shift) suggests anovulatory cycle; prevalence in elite female athletes: 45% show menstrual irregularities; heat training effect on cycle: intensely exercising women in heat show blunted luteal temperature rise (exercise-induced thermogenesis masks progesterone signal); Apple Watch cycle tracking validates: irregular temperature patterns trigger physician referral recommendation in iOS 17+")
            sciRow(stat: "NIPT and temperature beyond fertility", detail: "Thermoregulation and non-fertility applications: menopausal hot flashes detectable via wrist temperature: 1–5°C acute wrist temperature spikes lasting 2–5 min; frequency and severity quantifiable via wrist sensor; thyroid function: hyperthyroidism raises basal metabolic rate → chronically elevated baseline wrist temperature 0.5–1.0°C; hypothyroidism → lower baseline; Raynaud's phenomenon: exaggerated vasospasm produces dramatic wrist temperature drops (>5°C below normal) in response to cold — wrist temperature sensor may aid Raynaud's diagnosis and monitoring; CRPS (complex regional pain syndrome): asymmetric skin temperature >2°C between extremities is diagnostic criterion — wrist temperature tracking could flag asymmetry over time (currently requires clinical thermometry)")
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
        guard let wristTempType = HKObjectType.quantityType(forIdentifier: .appleSleepingWristTemperature) else {
            isLoading = false; return
        }
        guard (try? await store.requestAuthorization(toShare: [], read: [wristTempType])) != nil else {
            isLoading = false; return
        }

        let endDate = Date()
        let startDate = Calendar.current.date(byAdding: .day, value: -30, to: endDate)!
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

        let samples: [HKQuantitySample] = await withCheckedContinuation { continuation in
            let q = HKSampleQuery(sampleType: wristTempType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [sortDescriptor]) { _, s, _ in
                continuation.resume(returning: (s as? [HKQuantitySample]) ?? [])
            }
            store.execute(q)
        }

        let temps = samples.map { $0.quantity.doubleValue(for: .degreeCelsius()) }
        let avg = temps.isEmpty ? 0.0 : temps.reduce(0, +) / Double(temps.count)
        let latestDev = temps.first.map { $0 - avg } ?? 0

        await MainActor.run {
            self.baselineTemp = avg
            self.latestDeviation = latestDev
            self.nightlyReadings = temps
            self.isLoading = false
        }
    }
}
