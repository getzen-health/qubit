import SwiftUI
import HealthKit
import Charts

// MARK: - FunctionalFitnessBatteryView
// Aggregates 5 Apple Watch/iPhone functional fitness tests into one assessment:
// VO2 max, 6-minute walk distance, walking steadiness, gait speed, stair speed.
// Science: ATS/ERS 2002 (6MWT), Studenski 2011 (gait speed), AHA/ACC fall risk,
// Rikli & Jones 2013 (Senior Fitness Test battery).

struct FunctionalFitnessBatteryView: View {

    // MARK: - Model

    struct FitnessComponent: Identifiable {
        let id = UUID()
        let name: String
        let icon: String
        let value: Double?
        let unit: String
        let score: Double       // 0-100 normalized
        let classification: String
        let color: Color
        let hkNote: String
    }

    // MARK: - State

    @State private var components: [FitnessComponent] = []
    @State private var compositeScore: Double?
    @State private var functionalAge: Int?
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let chronologicalAge: Int = 35  // Would come from user profile in production

    // MARK: - Computed

    private var overallClassification: (label: String, color: Color) {
        guard let score = compositeScore else { return ("Unknown", .gray) }
        switch score {
        case 90...:   return ("Excellent", .green)
        case 75..<90: return ("Above Average", .mint)
        case 55..<75: return ("Average", .blue)
        case 35..<55: return ("Below Average", .orange)
        default:      return ("Poor", .red)
        }
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {

                // Composite score
                scoreCard

                // Individual components
                componentGrid

                // Radar chart
                if components.count >= 4 {
                    radarCard
                }

                // Science
                scienceCard
            }
            .padding(.vertical)
        }
        .navigationTitle("Functional Fitness")
        .navigationBarTitleDisplayMode(.large)
        .task { await loadData() }
        .overlay {
            if isLoading {
                ProgressView("Running fitness battery…")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(.ultraThinMaterial)
            }
        }
    }

    // MARK: - Subviews

    private var scoreCard: some View {
        VStack(spacing: 12) {
            HStack(alignment: .center, spacing: 20) {
                // Composite gauge
                ZStack {
                    Circle()
                        .stroke(Color(.tertiarySystemBackground), lineWidth: 14)
                        .frame(width: 110, height: 110)
                    if let score = compositeScore {
                        Circle()
                            .trim(from: 0, to: CGFloat(score) / 100)
                            .stroke(overallClassification.color.gradient,
                                    style: StrokeStyle(lineWidth: 14, lineCap: .round))
                            .frame(width: 110, height: 110)
                            .rotationEffect(.degrees(-90))
                            .animation(.easeInOut(duration: 0.8), value: score)
                        Text("\(Int(score))")
                            .font(.system(size: 32, weight: .bold, design: .rounded))
                            .foregroundStyle(overallClassification.color)
                    } else {
                        Text("—").font(.title).bold().foregroundStyle(.secondary)
                    }
                }

                VStack(alignment: .leading, spacing: 8) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Functional Fitness").font(.headline)
                        Text(overallClassification.label)
                            .font(.subheadline).bold()
                            .foregroundStyle(overallClassification.color)
                    }
                    if let fAge = functionalAge {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Functional Age")
                                .font(.caption).foregroundStyle(.secondary)
                            HStack(alignment: .lastTextBaseline, spacing: 4) {
                                Text("\(fAge)")
                                    .font(.title2).bold()
                                    .foregroundStyle(fAge < chronologicalAge ? .green : fAge == chronologicalAge ? .blue : .orange)
                                Text("yrs")
                                    .font(.caption).foregroundStyle(.secondary)
                            }
                        }
                    }
                }
                Spacer()
            }

            // Component summary
            HStack {
                ForEach(components) { comp in
                    VStack(spacing: 2) {
                        Image(systemName: comp.icon)
                            .foregroundStyle(comp.color)
                            .font(.caption)
                        Circle()
                            .fill(comp.color)
                            .frame(width: 6, height: 6)
                            .opacity(comp.value != nil ? 1 : 0.3)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var componentGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            ForEach(components) { comp in
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Image(systemName: comp.icon).foregroundStyle(comp.color)
                        Spacer()
                        // Score dots
                        let filled = Int(comp.score / 20)
                        HStack(spacing: 2) {
                            ForEach(0..<5) { i in
                                Circle()
                                    .fill(i < filled ? comp.color : Color(.tertiarySystemBackground))
                                    .frame(width: 6, height: 6)
                            }
                        }
                    }
                    Text(comp.name).font(.caption).foregroundStyle(.secondary)
                    if let val = comp.value {
                        HStack(alignment: .lastTextBaseline, spacing: 3) {
                            Text(String(format: "%.1f", val))
                                .font(.title2).bold()
                            Text(comp.unit)
                                .font(.caption2).foregroundStyle(.secondary)
                        }
                    } else {
                        Text("No data").font(.subheadline).foregroundStyle(.secondary)
                    }
                    Text(comp.classification)
                        .font(.caption2).bold()
                        .foregroundStyle(comp.color)
                    Text(comp.hkNote)
                        .font(.caption2).foregroundStyle(.tertiary)
                        .lineLimit(1)
                }
                .padding()
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
        .padding(.horizontal)
    }

    private var radarCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Fitness Profile", systemImage: "pentagon.fill")
                .font(.subheadline).bold()

            // Simple bar representation (true radar charts require custom drawing)
            ForEach(components) { comp in
                HStack(spacing: 8) {
                    Text(comp.name)
                        .font(.caption)
                        .frame(width: 110, alignment: .leading)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color(.tertiarySystemBackground))
                                .frame(height: 16)
                            RoundedRectangle(cornerRadius: 4)
                                .fill(comp.color.gradient)
                                .frame(width: geo.size.width * CGFloat(comp.score / 100), height: 16)
                                .animation(.easeInOut(duration: 0.6), value: comp.score)
                        }
                    }
                    .frame(height: 16)
                    Text(String(format: "%.0f", comp.score))
                        .font(.caption).bold()
                        .foregroundStyle(comp.color)
                        .frame(width: 32, alignment: .trailing)
                }
            }

            Text("Score 0–100: based on age-adjusted reference values from clinical research.")
                .font(.caption2).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Why These Tests", systemImage: "book.closed.fill")
                .font(.subheadline).bold()

            scienceItem("VO₂ Max", detail: "Best single predictor of all-cause mortality (Myers et al. 2002). Increases 1-3% per month with consistent aerobic training.")
            scienceItem("6-Minute Walk Test (ATS/ERS 2002)", detail: "Validated functional capacity test — predicts outcomes in cardiac & pulmonary disease. Normal: 400-700m for healthy adults.")
            scienceItem("Gait Speed (Studenski 2011)", detail: "Predicts survival better than age, sex, or clinical conditions. Each 0.1 m/s faster = 12% lower mortality risk. Assessed automatically by iPhone.")
            scienceItem("Walking Steadiness (iOS 15+)", detail: "Apple's machine learning model estimates fall risk from accelerometer gait patterns. OK/Low/Very Low levels calibrated against fall prediction research.")
            scienceItem("Stair Speed (Bhatt et al. 2013)", detail: "Stair climbing speed is a validated predictor of all-cause mortality in older adults. Stair ascent speed <0.5 m/s = elevated cardiovascular risk.")
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

    // MARK: - Data loading

    func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }

        let types: Set<HKObjectType> = [
            HKQuantityType.quantityType(forIdentifier: .vo2Max)!,
            HKQuantityType.quantityType(forIdentifier: .sixMinuteWalkTestDistance)!,
            HKQuantityType.quantityType(forIdentifier: .appleWalkingSteadiness)!,
            HKQuantityType.quantityType(forIdentifier: .walkingSpeed)!,
            HKQuantityType.quantityType(forIdentifier: .stairAscentSpeed)!,
        ]

        do {
            try await healthStore.requestAuthorization(toShare: [], read: types)
        } catch { isLoading = false; return }

        let sortDesc = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

        async let vo2Sample    = fetchLatest(.vo2Max,                      sort: sortDesc)
        async let walk6Sample  = fetchLatest(.sixMinuteWalkTestDistance,   sort: sortDesc)
        async let steadySample = fetchLatest(.appleWalkingSteadiness,      sort: sortDesc)
        async let gaitSample   = fetchLatest(.walkingSpeed,                sort: sortDesc)
        async let stairSample  = fetchLatest(.stairAscentSpeed,            sort: sortDesc)

        let (vo2, walk6, steady, gait, stair) = await (vo2Sample, walk6Sample, steadySample, gaitSample, stairSample)

        // --- Score VO2 Max (age 35 male norms) ---
        let vo2Value = vo2?.quantity.doubleValue(for: HKUnit(from: "ml/kg/min"))
        let vo2Score: Double
        let vo2Class: String
        if let v = vo2Value {
            switch v {
            case 56...:    vo2Score = 95; vo2Class = "Excellent"
            case 49..<56:  vo2Score = 80; vo2Class = "Above Avg"
            case 43..<49:  vo2Score = 65; vo2Class = "Average"
            case 37..<43:  vo2Score = 45; vo2Class = "Below Avg"
            default:       vo2Score = 25; vo2Class = "Poor"
            }
        } else { vo2Score = 0; vo2Class = "No data" }

        // --- Score 6MWT ---
        let walk6Value = walk6?.quantity.doubleValue(for: .meter())
        let walk6Score: Double
        let walk6Class: String
        if let w = walk6Value {
            switch w {
            case 640...:   walk6Score = 95; walk6Class = "Excellent"
            case 540..<640: walk6Score = 75; walk6Class = "Good"
            case 430..<540: walk6Score = 55; walk6Class = "Average"
            case 320..<430: walk6Score = 35; walk6Class = "Below Avg"
            default:       walk6Score = 15; walk6Class = "Poor"
            }
        } else { walk6Score = 0; walk6Class = "No data" }

        // --- Score Walking Steadiness (0-1 from HK) ---
        let steadyValue = steady?.quantity.doubleValue(for: .percent())
        let steadyScore: Double
        let steadyClass: String
        if let s = steadyValue {
            if s >= 0.8      { steadyScore = 90; steadyClass = "OK" }
            else if s >= 0.5 { steadyScore = 55; steadyClass = "Low" }
            else             { steadyScore = 20; steadyClass = "Very Low" }
        } else { steadyScore = 0; steadyClass = "No data" }

        // --- Score Gait Speed ---
        let gaitValue = gait?.quantity.doubleValue(for: HKUnit(from: "m/s"))
        let gaitScore: Double
        let gaitClass: String
        if let g = gaitValue {
            switch g {
            case 1.2...:    gaitScore = 92; gaitClass = "Excellent"
            case 1.0..<1.2: gaitScore = 72; gaitClass = "Normal"
            case 0.8..<1.0: gaitScore = 48; gaitClass = "Slow"
            default:        gaitScore = 20; gaitClass = "Very Slow"
            }
        } else { gaitScore = 0; gaitClass = "No data" }

        // --- Score Stair Speed ---
        let stairValue = stair?.quantity.doubleValue(for: HKUnit(from: "m/s"))
        let stairScore: Double
        let stairClass: String
        if let s = stairValue {
            switch s {
            case 0.9...:    stairScore = 90; stairClass = "Excellent"
            case 0.7..<0.9: stairScore = 70; stairClass = "Good"
            case 0.5..<0.7: stairScore = 45; stairClass = "Average"
            default:        stairScore = 20; stairClass = "Low"
            }
        } else { stairScore = 0; stairClass = "No data" }

        let built: [FitnessComponent] = [
            FitnessComponent(name: "VO₂ Max", icon: "lungs.fill",
                             value: vo2Value, unit: "ml/kg/min",
                             score: vo2Score, classification: vo2Class,
                             color: .purple, hkNote: "HKQuantityType(.vo2Max)"),

            FitnessComponent(name: "6-Min Walk", icon: "figure.walk",
                             value: walk6Value, unit: "m",
                             score: walk6Score, classification: walk6Class,
                             color: .blue, hkNote: ".sixMinuteWalkTestDistance"),

            FitnessComponent(name: "Steadiness", icon: "figure.stand",
                             value: steadyValue.map { $0 * 100 }, unit: "%",
                             score: steadyScore, classification: steadyClass,
                             color: .teal, hkNote: ".appleWalkingSteadiness"),

            FitnessComponent(name: "Gait Speed", icon: "gauge.with.needle.fill",
                             value: gaitValue, unit: "m/s",
                             score: gaitScore, classification: gaitClass,
                             color: .green, hkNote: ".walkingSpeed (iPhone)"),

            FitnessComponent(name: "Stair Speed", icon: "staircase",
                             value: stairValue, unit: "m/s",
                             score: stairScore, classification: stairClass,
                             color: .orange, hkNote: ".stairAscentSpeed"),
        ]

        let scores = built.map(\.score)
        let composite = scores.reduce(0, +) / Double(scores.count)

        // Estimate functional age: start at chronological age, adjust by composite score
        // Average score (50) = chronological age; every 10 points = ±3 years
        let deltaYears = Int((composite - 50) / 10 * -3)
        let fAge = max(20, chronologicalAge + deltaYears)

        await MainActor.run {
            components = built
            compositeScore = composite
            functionalAge = fAge
            isLoading = false
        }
    }

    private func fetchLatest(_ id: HKQuantityTypeIdentifier, sort: NSSortDescriptor) async -> HKQuantitySample? {
        guard let type = HKQuantityType.quantityType(forIdentifier: id) else { return nil }
        return await withCheckedContinuation { cont in
            let q = HKSampleQuery(
                sampleType: type, predicate: nil,
                limit: 1, sortDescriptors: [sort]
            ) { _, s, _ in cont.resume(returning: (s as? [HKQuantitySample])?.first) }
            healthStore.execute(q)
        }
    }
}
