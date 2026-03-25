import SwiftUI
import HealthKit

struct CrossCountrySkiingScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var totalDistanceKm: Double = 0
    @State private var avgKcalPerMin: Double = 0
    @State private var avgDurationMin: Double = 0
    @State private var isLoading = true
    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Stats Row
                HStack(spacing: 12) {
                    statCard(value: "\(totalSessions)", label: "Sessions", color: .cyan)
                    statCard(value: String(format: "%.0f km", totalDistanceKm), label: "Total Distance", color: .blue)
                    statCard(value: String(format: "%.1f", avgKcalPerMin), label: "kcal/min", color: .teal)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "World's Highest VO₂max Sport",
                    icon: "figure.skiing.crosscountry",
                    color: .cyan,
                    rows: [
                        sciRow(stat: "Dæhlie: 96 mL/kg/min — highest recorded",
                               detail: "Ingjer 1991: Bjørn Dæhlie's VO₂max of 96 mL/kg/min (8-time Olympic gold) remains the highest reliably measured. Elite female XC skiers: 70–78 mL/kg/min. XC skiing demands whole-body aerobic capacity — arms + legs simultaneously at maximal effort."),
                        sciRow(stat: "Whole-body oxygen demand",
                               detail: "Holmberg 2005: upper body contributes 25–30% of VO₂ in skating technique and up to 40% in double-poling. Elite double-pole VO₂ = 93% of treadmill VO₂max — nearly identical whole-body demand. Arm VO₂max can be trained to 85–90% of leg VO₂max."),
                        sciRow(stat: "Cardiac dimensions of elite XC skiers",
                               detail: "Scharhag 2002: XC skiers show largest cardiac volumes of any sport — LV volume 175–220 mL (vs. 120 mL sedentary). Stroke volume 160–200 mL at maximal effort. Cardiac output peaks 40–45 L/min in elite. 'Athlete's heart' is adaptive, not pathological."),
                        sciRow(stat: "Lactate threshold: 92% of VO₂max",
                               detail: "Rusko 2003: elite XC skiers sustain race pace at 88–92% of VO₂max for 50–60 min races. LT2 at 85–90% HRmax. This near-VO₂max LT2 is the key physiological distinction — most athletes hit LT2 at 75–85% VO₂max.")
                    ]
                )

                scienceCard(
                    title: "Polarized Training & 80/20 Method",
                    icon: "chart.bar.fill",
                    color: .blue,
                    rows: [
                        sciRow(stat: "80% low intensity / 20% high intensity",
                               detail: "Seiler 2009: Norwegian XC skiing national team distributes 80% of training in Zone 1 (<72% HRmax), ~5% Zone 2, ~15% Zone 3 (>87% HRmax). This polarized distribution maximizes both mitochondrial density (Zone 1) and VO₂max ceiling (Zone 3). Threshold zone minimized."),
                        sciRow(stat: "Volume: 600–900 hours/year elite",
                               detail: "Rusko 2003: elite Norwegian national team trains 600–900 hours/year (avg ~750h). Weekly volume: 12–20 hours. Summer training: roller skiing, running, cycling, strength. Snow hours: ~300/year. Volume must be built over 8–12 years — no shortcut to elite XC fitness."),
                        sciRow(stat: "Interval quality: 4×8 min at VO₂max",
                               detail: "Helgerud 2007: 4×4 min intervals at 90–95% HRmax showed superior VO₂max gains vs. continuous moderate training. Norwegian method refines to 4–6×8 min at 85–90% HRmax (sustainable quality) rather than maximal sprints. Weekly high-intensity: 2 sessions max."),
                        sciRow(stat: "Double periodization: roller → snow season",
                               detail: "Tonnessen 2014: Norwegian Olympic XC training follows double periodization — summer preparation (aerobic base, strength) + winter competition season. Key: quality of transition bouts in September–October determines race form. Strength focus shifts from hypertrophy → power → maintenance.")
                    ]
                )

                scienceCard(
                    title: "Technique: Classical vs. Skating",
                    icon: "waveform.path",
                    color: .teal,
                    rows: [
                        sciRow(stat: "Skating 15–20% faster than classical",
                               detail: "Hoffman 1994: skating technique is 15–20% faster at equivalent metabolic cost. Introduced competitively in 1982 — Siitonen step, then V1/V2 skate. Classical technique remains in separate-format races and terrain-specific sections. Different muscle recruitment patterns require technique-specific training."),
                        sciRow(stat: "Double-poling: 500–700 W elite",
                               detail: "Holmberg 2005: elite double-pole power output 500–700 W (comparable to road cycling sprint). Poling frequency 50–80 cycles/min. Abdominal contribution: trunk flexion generates 35–45% of poling force. Core power is the limiting factor for double-poling speed, not just arm strength."),
                        sciRow(stat: "V2 skating: highest speed technique",
                               detail: "Smith 2003: V2 (simultaneous poling with every leg push) achieves highest ski speed on moderate terrain. Used by elites on flats and gentle uphills. V1 (offset poling) for steeper terrain. Technique efficiency increases VO₂ economy 5–12% vs. novice technique at same speed."),
                        sciRow(stat: "Kick wax and glide optimization",
                               detail: "Breitschädel 2010: ski-snow friction varies 3–8× with temperature (-15°C vs. 0°C). Fluorocarbon glide waxes (now banned in World Cup) reduced kinetic friction 40–60%. Modern glide waxes: 5–15% speed difference between optimal and poor waxing. Classical kick wax: tolerance window often only 2–3°C temperature range.")
                    ]
                )

                scienceCard(
                    title: "Altitude, Hematology & Recovery",
                    icon: "mountain.2.fill",
                    color: .purple,
                    rows: [
                        sciRow(stat: "Live-high-train-low: +5% hemoglobin mass",
                               detail: "Stray-Gundersen 1992, Levine 1997: living at 2,000–2,500 m altitude + training at 1,200–1,500 m increases hemoglobin mass 5–8% over 3–4 weeks. Norwegian skiers use altitude camps in Sierra Nevada (Spain) and Font Romeu (France). EPO response begins within 24–48h of altitude exposure."),
                        sciRow(stat: "Blood doping history & modern testing",
                               detail: "Mørkeberg 2014: XC skiing's worst doping scandal (Salt Lake 2002) involved autologous blood transfusion. Athlete Biological Passport (ABP) since 2008 detects hematological manipulation. Normal hemoglobin: men 140–175 g/L; women 120–155 g/L. ABP flags longitudinal fluctuations >5–7 g/L."),
                        sciRow(stat: "Cold environment physiology",
                               detail: "McArdle 2000: exercising in -10°C to -20°C increases VO₂ at same pace by 5–10% due to increased muscle viscosity and protective muscle contraction to maintain core temperature. Frostbite risk to fingers/toes below -15°C with wind. Respiratory heat exchanger masks reduce cold-air bronchospasm."),
                        sciRow(stat: "Recovery: 24–48h after maximal bouts",
                               detail: "Kenttä 1996 (recovery needs in elite XC skiing): 90-min maximal effort races require 48–72h full recovery. Blood lactate clears within 1–2h; muscle glycogen: 24h partial (50%) + 48h full restoration. Norwegian tradition: 'easy day' after every hard day — not a cultural choice, but physiological necessity.")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("XC Skiing Science")
        .toolbarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let types: Set<HKObjectType> = [HKObjectType.workoutType()]
        guard (try? await store.requestAuthorization(toShare: [], read: types)) != nil else { isLoading = false; return }
        let now = Date()
        let start = Calendar.current.date(byAdding: .weekOfYear, value: -52, to: now) ?? Date()
        let predicate = HKQuery.predicateForSamples(withStart: start, end: now)
        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: .workoutType(), predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                cont.resume(returning: (samples as? [HKWorkout]) ?? [])
            }
            store.execute(q)
        }
        let skiing = workouts.filter { $0.workoutActivityType == .crossCountrySkiing }
        let sessions = skiing.count
        let dist = skiing.compactMap { $0.totalDistance?.doubleValue(for: .meterUnit(with: .kilo)) }.reduce(0, +)
        let totalKcal = skiing.compactMap { $0.totalEnergyBurned?.doubleValue(for: .kilocalorie()) }.reduce(0, +)
        let totalDur = skiing.map { $0.duration / 60 }.reduce(0, +)
        await MainActor.run {
            totalSessions = sessions
            totalDistanceKm = dist
            avgKcalPerMin = totalDur > 0 ? totalKcal / totalDur : 0
            avgDurationMin = sessions > 0 ? totalDur / Double(sessions) : 0
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
