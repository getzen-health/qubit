import SwiftUI
import HealthKit
import Charts

// MARK: - BiologicalAgeView
// Multi-biomarker biological age computation — distinct from FitnessAgeView (VO2 only).
// Four independent "organ age" estimates combined into composite biological age.
// Science: Levine et al. 2018 (PhenoAge, Cell Metabolism), Klemera-Doubal 2006,
// Shaffer & Ginsberg 2017 (HRV norms), Studenski 2011 (gait speed norms),
// ACSM Guidelines 11th ed. (VO2 norms).

struct BiologicalAgeView: View {

    // MARK: - Model

    struct OrganAge: Identifiable {
        let id = UUID()
        let name: String        // e.g. "Cardiovascular"
        let icon: String
        let color: Color
        let estimatedAge: Int?
        let metric: String      // e.g. "HRV: 48 ms"
        let interpretation: String
        let note: String        // biomarker + reference
    }

    struct AgePoint: Identifiable {
        let id = UUID()
        let label: String
        let age: Int?
        let color: Color
    }

    // MARK: - State

    @State private var organAges: [OrganAge] = []
    @State private var compositeAge: Double?
    @State private var chronologicalAge: Int = 35
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    // MARK: - Computed

    private var ageDelta: Int? {
        guard let ca = compositeAge else { return nil }
        return Int(round(ca)) - chronologicalAge
    }

    private var deltaColor: Color {
        guard let d = ageDelta else { return .gray }
        return d < -3 ? .green : d <= 3 ? .blue : d <= 7 ? .orange : .red
    }

    private var deltaLabel: String {
        guard let d = ageDelta else { return "Unknown" }
        if d < -3 { return "Younger than your age" }
        if d <= 3 { return "On par with your age" }
        if d <= 7 { return "Somewhat older than age" }
        return "Significantly older than age"
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                compositeCard
                organAgeBar
                organGrid
                interventionCard
                scienceCard
            }
            .padding(.vertical)
        }
        .navigationTitle("Biological Age")
        .navigationBarTitleDisplayMode(.large)
        .task { await loadData() }
        .refreshable { await loadData() }
        .overlay {
            if isLoading {
                ProgressView("Computing biological age…")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(.ultraThinMaterial)
            }
        }
    }

    // MARK: - Subviews

    private var compositeCard: some View {
        VStack(spacing: 16) {
            HStack(alignment: .center, spacing: 20) {
                ZStack {
                    Circle()
                        .stroke(Color(.tertiarySystemBackground), lineWidth: 14)
                        .frame(width: 110, height: 110)
                    if let ca = compositeAge {
                        let pct = min(1.0, max(0.0, (ca - 18) / 62))   // 18–80 range
                        Circle()
                            .trim(from: 0, to: CGFloat(pct))
                            .stroke(deltaColor.gradient,
                                    style: StrokeStyle(lineWidth: 14, lineCap: .round))
                            .frame(width: 110, height: 110)
                            .rotationEffect(.degrees(-90))
                            .animation(.easeInOut(duration: 0.8), value: ca)
                    }
                    VStack(spacing: 2) {
                        if let ca = compositeAge {
                            Text("\(Int(round(ca)))")
                                .font(.system(size: 32, weight: .bold, design: .rounded))
                                .foregroundStyle(deltaColor)
                            Text("bio age").font(.caption2).foregroundStyle(.secondary)
                        } else {
                            Text("—").font(.title).bold().foregroundStyle(.secondary)
                        }
                    }
                }

                VStack(alignment: .leading, spacing: 8) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Biological Age").font(.headline)
                        if let d = ageDelta {
                            let sign = d < 0 ? "" : "+"
                            Text("\(sign)\(d) yrs vs chronological")
                                .font(.subheadline).bold()
                                .foregroundStyle(deltaColor)
                        }
                        Text(deltaLabel)
                            .font(.caption).foregroundStyle(.secondary)
                    }
                    Text("Chronological: \(chronologicalAge) yrs")
                        .font(.caption2).foregroundStyle(.tertiary)
                }
                Spacer()
            }

            // Organ count summary
            HStack {
                let youngerCount = organAges.filter { ($0.estimatedAge ?? chronologicalAge) < chronologicalAge - 2 }.count
                let olderCount   = organAges.filter { ($0.estimatedAge ?? chronologicalAge) > chronologicalAge + 2 }.count
                let onParCount   = organAges.count - youngerCount - olderCount
                summaryPill("Younger", count: youngerCount, color: .green)
                summaryPill("On Par", count: onParCount, color: .blue)
                summaryPill("Older", count: olderCount, color: .orange)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func summaryPill(_ label: String, count: Int, color: Color) -> some View {
        HStack(spacing: 4) {
            Text("\(count)").font(.headline.weight(.bold)).foregroundStyle(color)
            Text(label).font(.caption).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 6)
        .background(color.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }

    private var organAgeBar: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Organ Age vs Chronological", systemImage: "chart.bar.xaxis")
                .font(.subheadline).bold()

            ForEach(organAges) { organ in
                HStack(spacing: 8) {
                    Image(systemName: organ.icon)
                        .foregroundStyle(organ.color)
                        .frame(width: 22)
                    Text(organ.name)
                        .font(.caption)
                        .frame(width: 100, alignment: .leading)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            // Background bar up to chronological
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color(.tertiarySystemBackground))
                                .frame(height: 14)

                            // Colored bar for estimated age
                            if let ea = organ.estimatedAge {
                                let maxAge = 80.0
                                let frac = CGFloat(min(ea, Int(maxAge))) / CGFloat(maxAge)
                                RoundedRectangle(cornerRadius: 4)
                                    .fill(organ.color.gradient)
                                    .frame(width: geo.size.width * frac, height: 14)
                                    .animation(.easeInOut(duration: 0.6), value: frac)
                            }

                            // Chronological age marker
                            let chronoFrac = CGFloat(chronologicalAge) / 80.0
                            Rectangle()
                                .fill(Color.primary)
                                .frame(width: 2, height: 20)
                                .offset(x: geo.size.width * chronoFrac - 1)
                        }
                    }
                    .frame(height: 14)

                    if let ea = organ.estimatedAge {
                        Text("\(ea)")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(organ.color)
                            .frame(width: 28, alignment: .trailing)
                    } else {
                        Text("—")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .frame(width: 28, alignment: .trailing)
                    }
                }
            }

            HStack {
                Spacer()
                HStack(spacing: 4) {
                    Rectangle().fill(Color.primary).frame(width: 2, height: 12)
                    Text("Age \(chronologicalAge)").font(.caption2).foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var organGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            ForEach(organAges) { organ in
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Image(systemName: organ.icon).foregroundStyle(organ.color)
                        Spacer()
                        if let ea = organ.estimatedAge {
                            let delta = ea - chronologicalAge
                            let sign = delta < 0 ? "" : "+"
                            Text("\(sign)\(delta) yrs")
                                .font(.caption2).bold()
                                .foregroundStyle(delta < -2 ? .green : delta <= 2 ? .blue : .orange)
                        }
                    }
                    Text(organ.name).font(.caption).foregroundStyle(.secondary)
                    Text(organ.estimatedAge.map { "\($0) yrs" } ?? "No data")
                        .font(.title2).bold()
                        .foregroundStyle(organ.color)
                    Text(organ.metric).font(.caption2).foregroundStyle(.secondary)
                    Text(organ.interpretation).font(.caption2).bold().foregroundStyle(organ.color)
                    Text(organ.note).font(.caption2).foregroundStyle(.tertiary).lineLimit(1)
                }
                .padding()
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
        .padding(.horizontal)
    }

    private var interventionCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Highest Impact Actions", systemImage: "arrow.up.heart.fill")
                .font(.subheadline).bold()

            let olderOrgans = organAges.filter { ($0.estimatedAge ?? chronologicalAge) > chronologicalAge + 2 }

            if olderOrgans.isEmpty {
                Text("All biomarkers are on par or younger than your chronological age. Keep up the great work!")
                    .font(.subheadline).foregroundStyle(.secondary)
            } else {
                ForEach(olderOrgans) { organ in
                    HStack(alignment: .top, spacing: 10) {
                        Image(systemName: organ.icon)
                            .foregroundStyle(organ.color)
                            .frame(width: 20)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(organ.name + " — age \(organ.estimatedAge ?? 0)")
                                .font(.caption).bold()
                            Text(interventionText(for: organ.name))
                                .font(.caption2).foregroundStyle(.secondary)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func interventionText(for organ: String) -> String {
        switch organ {
        case "Aerobic Fitness":  return "Consistent Zone 2 training 3h/week increases VO₂ max 1-3%/month. High impact — aerobic fitness is #1 mortality predictor."
        case "Autonomic Health": return "HRV improves with reduced training load, better sleep, less alcohol, and consistent sleep timing. RMSSD responds within days."
        case "Cardiovascular":   return "RHR lowers 1 bpm per additional 1,000 steps/day long-term. Aerobic training most impactful. Avoid caffeine before resting measurements."
        case "Musculoskeletal":  return "Gait speed improves with calf strengthening, balance training (tai chi), and regular walking. Each 0.1 m/s gain = 12% lower mortality."
        default:                 return "Focus on consistent aerobic training, sleep quality, and daily steps."
        }
    }

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Science", systemImage: "book.closed.fill")
                .font(.subheadline).bold()
            scienceItem("PhenoAge (Levine 2018, Cell Metabolism)", detail: "Multi-biomarker biological age outperforms chronological age for predicting mortality, disease onset, and accelerated aging. Uses 9 clinical biomarkers — this view uses 4 passively-measured HealthKit proxies.")
            scienceItem("HRV Age Norms (Shaffer & Ginsberg 2017)", detail: "Vagally-mediated RMSSD decreases ~1 ms per year of aging. Age 20: ~65 ms, Age 30: ~55 ms, Age 40: ~45 ms, Age 50: ~35 ms, Age 60: ~25 ms (median).")
            scienceItem("Gait Age (Studenski 2011, JAMA)", detail: "Walking speed is a 'vital sign' that predicts survival better than age or clinical conditions. Derived age norms allow direct age equivalent estimation.")
            scienceItem("Aerobic Age (ACSM Guidelines, 11th Ed.)", detail: "VO₂ max age norms by decade allow fitness age computation. Aerobic fitness is the single strongest predictor of all-cause mortality (Myers 2002).")
        }
        .padding()
        .background(Color(.tertiarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func scienceItem(_ title: String, detail: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title).font(.caption).bold()
            Text(detail).font(.caption2).foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    // MARK: - Data Loading

    func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else {
            await MainActor.run { isLoading = false }
            return
        }

        let types: Set<HKObjectType> = [
            HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN)!,
            HKQuantityType.quantityType(forIdentifier: .restingHeartRate)!,
            HKQuantityType.quantityType(forIdentifier: .vo2Max)!,
            HKQuantityType.quantityType(forIdentifier: .walkingSpeed)!,
        ]
        do { try await healthStore.requestAuthorization(toShare: [], read: types) }
        catch { await MainActor.run { isLoading = false }; return }

        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        async let hrvS   = fetchLatest(.heartRateVariabilitySDNN, sort: sort)
        async let rhrS   = fetchLatest(.restingHeartRate,         sort: sort)
        async let vo2S   = fetchLatest(.vo2Max,                   sort: sort)
        async let gaitS  = fetchLatest(.walkingSpeed,             sort: sort)
        let (hrv, rhr, vo2, gait) = await (hrvS, rhrS, vo2S, gaitS)

        // --- HRV → Autonomic Age ---
        let hrvVal = hrv?.quantity.doubleValue(for: HKUnit(from: "ms"))
        let (autoAge, autoInterp): (Int?, String)
        if let h = hrvVal {
            // Shaffer & Ginsberg 2017 approximate RMSSD medians
            switch h {
            case 60...:   autoAge = 22; autoInterp = "Excellent — like early 20s"
            case 50..<60: autoAge = 28; autoInterp = "Very Good — like late 20s"
            case 40..<50: autoAge = 36; autoInterp = "Good — like mid 30s"
            case 30..<40: autoAge = 46; autoInterp = "Average — like mid 40s"
            case 20..<30: autoAge = 56; autoInterp = "Below Average — like mid 50s"
            default:      autoAge = 68; autoInterp = "Low — like late 60s"
            }
        } else { autoAge = nil; autoInterp = "No data" }

        // --- RHR → Cardiovascular Age ---
        let rhrVal = rhr?.quantity.doubleValue(for: .count().unitDivided(by: .minute()))
        let (cardioAge, cardioInterp): (Int?, String)
        if let r = rhrVal {
            switch r {
            case ..<50:   cardioAge = 22; cardioInterp = "Elite — like early 20s athlete"
            case 50..<55: cardioAge = 27; cardioInterp = "Excellent — well-trained"
            case 55..<60: cardioAge = 33; cardioInterp = "Good — above average fitness"
            case 60..<65: cardioAge = 38; cardioInterp = "Average — normal healthy adult"
            case 65..<70: cardioAge = 47; cardioInterp = "Below Average"
            case 70..<75: cardioAge = 56; cardioInterp = "Low fitness — elevated risk"
            default:      cardioAge = 65; cardioInterp = "Poor — consider assessment"
            }
        } else { cardioAge = nil; cardioInterp = "No data" }

        // --- VO2 Max → Aerobic Age ---
        let vo2Val = vo2?.quantity.doubleValue(for: HKUnit(from: "ml/kg/min"))
        let (aerobicAge, aerobicInterp): (Int?, String)
        if let v = vo2Val {
            // ACSM male 50th percentile reference: 20s=44.2, 30s=42.5, 40s=39.9, 50s=36.4
            switch v {
            case 50...:    aerobicAge = 22; aerobicInterp = "Elite — like early 20s"
            case 44..<50:  aerobicAge = 27; aerobicInterp = "Above Average — like late 20s"
            case 42..<44:  aerobicAge = 33; aerobicInterp = "Good — like early 30s"
            case 39..<42:  aerobicAge = 38; aerobicInterp = "Average — like late 30s"
            case 36..<39:  aerobicAge = 45; aerobicInterp = "Below Average — like mid 40s"
            case 32..<36:  aerobicAge = 53; aerobicInterp = "Low — like early 50s"
            default:       aerobicAge = 62; aerobicInterp = "Poor — like early 60s"
            }
        } else { aerobicAge = nil; aerobicInterp = "No data" }

        // --- Gait Speed → Musculoskeletal Age ---
        let gaitVal = gait?.quantity.doubleValue(for: HKUnit(from: "m/s"))
        let (muscAge, muscInterp): (Int?, String)
        if let g = gaitVal {
            // Studenski 2011 walking speed norms (approximate age equivalents)
            switch g {
            case 1.3...:    muscAge = 22; muscInterp = "Fast — like early 20s"
            case 1.2..<1.3: muscAge = 28; muscInterp = "Above Average — like late 20s"
            case 1.1..<1.2: muscAge = 35; muscInterp = "Good — like mid 30s"
            case 1.0..<1.1: muscAge = 43; muscInterp = "Normal — like early 40s"
            case 0.9..<1.0: muscAge = 52; muscInterp = "Borderline — like early 50s"
            case 0.8..<0.9: muscAge = 60; muscInterp = "Slow — like early 60s"
            default:        muscAge = 70; muscInterp = "Very Slow — clinical threshold"
            }
        } else { muscAge = nil; muscInterp = "No data" }

        // Composite biological age (average of available estimates)
        let ages: [Int] = [autoAge, cardioAge, aerobicAge, muscAge].compactMap { $0 }
        let composite = ages.isEmpty ? nil : Double(ages.reduce(0, +)) / Double(ages.count)

        let organList: [OrganAge] = [
            OrganAge(name: "Aerobic Fitness", icon: "lungs.fill", color: .purple,
                     estimatedAge: aerobicAge,
                     metric: vo2Val.map { String(format: "VO₂: %.1f ml/kg/min", $0) } ?? "No VO₂ data",
                     interpretation: aerobicInterp, note: "ACSM 11th Ed. norms (Myers 2002)"),
            OrganAge(name: "Autonomic Health", icon: "waveform.path.ecg", color: .green,
                     estimatedAge: autoAge,
                     metric: hrvVal.map { String(format: "HRV: %.0f ms", $0) } ?? "No HRV data",
                     interpretation: autoInterp, note: "Shaffer & Ginsberg 2017"),
            OrganAge(name: "Cardiovascular", icon: "heart.fill", color: .red,
                     estimatedAge: cardioAge,
                     metric: rhrVal.map { String(format: "RHR: %.0f bpm", $0) } ?? "No RHR data",
                     interpretation: cardioInterp, note: "Population RHR norms (WHO)"),
            OrganAge(name: "Musculoskeletal", icon: "figure.walk", color: .orange,
                     estimatedAge: muscAge,
                     metric: gaitVal.map { String(format: "Speed: %.2f m/s", $0) } ?? "No gait data",
                     interpretation: muscInterp, note: "Studenski 2011 (JAMA)"),
        ]

        await MainActor.run {
            organAges = organList
            compositeAge = composite
            isLoading = false
        }
    }

    private func fetchLatest(_ id: HKQuantityTypeIdentifier, sort: NSSortDescriptor) async -> HKQuantitySample? {
        guard let type = HKQuantityType.quantityType(forIdentifier: id) else { return nil }
        return await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: type, predicate: nil, limit: 1, sortDescriptors: [sort]) { _, s, _ in
                cont.resume(returning: (s as? [HKQuantitySample])?.first)
            }
            healthStore.execute(q)
        }
    }
}
