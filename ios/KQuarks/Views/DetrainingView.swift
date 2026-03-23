import SwiftUI
import HealthKit

// MARK: - DetrainingView

/// Detects training breaks and models their fitness impact using published
/// detraining curves (Mujika & Padilla 2000). Shows VO₂ max, RHR, and HRV
/// changes during breaks, plus retraining time estimates.
struct DetrainingView: View {

    // MARK: - Models

    struct TrainingBreak: Identifiable {
        let id = UUID()
        let start: Date
        let end: Date
        let days: Int
        let vo2Before: Double?
        let vo2After: Double?
        let rhrBefore: Double?
        let rhrAfter: Double?

        var vo2Loss: Double? {
            guard let b = vo2Before, let a = vo2After else { return nil }
            return b - a
        }
        var rhrRise: Double? {
            guard let b = rhrBefore, let a = rhrAfter else { return nil }
            return a - b
        }
        var retrainingDaysEstimate: Int {
            // Rule of thumb: retraining takes ~50-100% of break duration for well-trained
            Int(Double(days) * 0.75)
        }
    }

    struct CurrentForm {
        let label: String
        let percentage: Double  // 0–100
        let color: Color
        let context: String
    }

    // MARK: - State

    @State private var breaks: [TrainingBreak] = []
    @State private var daysSinceLastWorkout: Int = 0
    @State private var currentVO2: Double?
    @State private var peakVO2: Double?
    @State private var isLoading = true
    @State private var errorMessage: String?

    private let hkStore = HKHealthStore()

    // MARK: - Computed

    private var currentForm: CurrentForm {
        let projected = projectedVO2Loss(days: daysSinceLastWorkout)
        guard let curr = currentVO2 else {
            return CurrentForm(label: "Unknown", percentage: 0, color: .gray, context: "No VO₂ max data available.")
        }
        let peak = peakVO2 ?? curr
        let formPct = min(curr / peak * 100, 100)

        let (label, color): (String, Color)
        switch formPct {
        case 97...: (label, color) = ("Peak Form", .green)
        case 92..<97: (label, color) = ("Near Peak", .teal)
        case 85..<92: (label, color) = ("Good Form", .blue)
        case 75..<85: (label, color) = ("Moderate Form", .orange)
        default: (label, color) = ("Below Peak", .red)
        }

        let context: String
        if daysSinceLastWorkout == 0 {
            context = "You trained today — you're in peak readiness."
        } else if daysSinceLastWorkout < 7 {
            context = "\(daysSinceLastWorkout) days since last workout. Minimal detraining — normal recovery window."
        } else if projected > 0 {
            context = "Estimated \(String(format: "%.1f", projected))% VO₂ max loss from \(daysSinceLastWorkout)-day break."
        } else {
            context = "Form tracking requires consistent workout records."
        }

        return CurrentForm(label: label, percentage: formPct, color: color, context: context)
    }

    // Mujika & Padilla (2000) detraining model
    // Highly trained: loses ~1.8% VO2/week in first 4 weeks, then 0.5%/week
    private func projectedVO2Loss(days: Int) -> Double {
        let weeks = Double(days) / 7.0
        if weeks <= 4 {
            return min(weeks * 1.8, 7.2)
        } else {
            return 7.2 + (weeks - 4) * 0.5
        }
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if isLoading {
                    ProgressView("Detecting training breaks…")
                        .frame(maxWidth: .infinity)
                        .padding(.top, 60)
                } else if let err = errorMessage {
                    ContentUnavailableView(err, systemImage: "figure.run.circle")
                } else {
                    currentFormCard
                    detrainingCurveCard
                    if !breaks.isEmpty {
                        detectedBreaksCard
                    } else {
                        noBreaksCard
                    }
                    retrainingCard
                    scienceCard
                }
            }
            .padding()
        }
        .navigationTitle("Detraining Model")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Current Form Card

    private var currentFormCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Current Training Form")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(currentForm.label)
                        .font(.title2.bold())
                        .foregroundStyle(currentForm.color)
                    Text(currentForm.context)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                ZStack {
                    Circle()
                        .stroke(Color(.systemFill), lineWidth: 8)
                    Circle()
                        .trim(from: 0, to: CGFloat(currentForm.percentage / 100))
                        .stroke(currentForm.color, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                    VStack(spacing: 0) {
                        Text(String(format: "%.0f%%", currentForm.percentage))
                            .font(.subheadline.bold())
                        Text("form")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
                .frame(width: 72, height: 72)
            }

            if daysSinceLastWorkout > 7 {
                HStack(spacing: 8) {
                    Image(systemName: "exclamationmark.circle.fill")
                        .foregroundStyle(.orange)
                    Text("\(daysSinceLastWorkout) days since last recorded workout. Detraining may be ongoing.")
                        .font(.caption)
                        .foregroundStyle(.orange)
                }
                .padding(8)
                .background(Color.orange.opacity(0.1))
                .cornerRadius(8)
            }
        }
        .padding()
        .background(currentForm.color.opacity(0.08))
        .cornerRadius(16)
    }

    // MARK: - Detraining Curve Card

    private var detrainingCurveCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Detraining Curve (from Mujika & Padilla)")
                .font(.headline)

            Text("Expected VO₂ max loss for trained athletes by break duration:")
                .font(.caption)
                .foregroundStyle(.secondary)

            let points: [(label: String, loss: Double, weeks: Int)] = [
                ("1 week", 1.8, 1), ("2 weeks", 3.6, 2), ("4 weeks", 7.2, 4),
                ("6 weeks", 8.2, 6), ("8 weeks", 9.2, 8), ("12 weeks", 11.2, 12)
            ]

            GeometryReader { geo in
                let maxLoss = 12.0
                ZStack(alignment: .bottomLeading) {
                    ForEach([25, 50, 75, 100], id: \.self) { pct in
                        let y = geo.size.height * (1 - CGFloat(pct) / 100)
                        Path { p in
                            p.move(to: CGPoint(x: 0, y: y))
                            p.addLine(to: CGPoint(x: geo.size.width, y: y))
                        }
                        .stroke(Color.secondary.opacity(0.1), lineWidth: 1)
                    }

                    Path { p in
                        let xStep = geo.size.width / CGFloat(points.count - 1)
                        for (i, pt) in points.enumerated() {
                            let x = CGFloat(i) * xStep
                            let y = geo.size.height * (1 - CGFloat(pt.loss / maxLoss))
                            i == 0 ? p.move(to: CGPoint(x: x, y: y)) : p.addLine(to: CGPoint(x: x, y: y))
                        }
                    }
                    .stroke(Color.red, lineWidth: 2)

                    // Your current break marker
                    if daysSinceLastWorkout > 0 {
                        let daysNorm = min(Double(daysSinceLastWorkout) / 84.0, 1.0) // up to 12 weeks
                        let lossNorm = min(projectedVO2Loss(days: daysSinceLastWorkout) / maxLoss, 1.0)
                        let markerX = CGFloat(daysNorm) * geo.size.width
                        let markerY = geo.size.height * (1 - CGFloat(lossNorm))
                        Circle()
                            .fill(currentForm.color)
                            .frame(width: 14, height: 14)
                            .position(x: markerX, y: markerY)
                    }
                }
            }
            .frame(height: 120)

            HStack {
                Text("1 wk")
                Spacer()
                Text("4 wks")
                Spacer()
                Text("8 wks")
                Spacer()
                Text("12 wks")
            }
            .font(.caption2)
            .foregroundStyle(.secondary)

            if daysSinceLastWorkout > 7 {
                HStack(spacing: 6) {
                    Circle().fill(currentForm.color).frame(width: 10, height: 10)
                    Text("Your estimated position (\(daysSinceLastWorkout) days, -\(String(format: "%.1f", projectedVO2Loss(days: daysSinceLastWorkout)))% VO₂ max)")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
    }

    // MARK: - Detected Breaks Card

    private var detectedBreaksCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Detected Training Breaks (\(breaks.count) in 12 months)")
                .font(.headline)

            ForEach(breaks.prefix(5)) { b in
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("\(b.days)-day break")
                            .font(.subheadline.bold())
                            .foregroundStyle(b.days > 21 ? .red : b.days > 10 ? .orange : .blue)
                        Spacer()
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(b.start, format: .dateTime.month(.abbreviated).day())
                            Text("→")
                            Text(b.end, format: .dateTime.month(.abbreviated).day())
                        }
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    }

                    HStack(spacing: 12) {
                        if let loss = b.vo2Loss, loss > 0 {
                            Label(String(format: "VO₂: −%.1f", loss), systemImage: "lungs.fill")
                                .font(.caption)
                                .foregroundStyle(.red)
                        }
                        if let rise = b.rhrRise, rise > 0 {
                            Label(String(format: "RHR: +%.0f bpm", rise), systemImage: "heart.fill")
                                .font(.caption)
                                .foregroundStyle(.orange)
                        }
                        Label("\(b.retrainingDaysEstimate)d to recover", systemImage: "arrow.counterclockwise")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(10)
                .background(Color(.tertiarySystemBackground))
                .cornerRadius(10)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
    }

    private var noBreaksCard: some View {
        VStack(spacing: 8) {
            Image(systemName: "checkmark.circle.fill")
                .font(.title)
                .foregroundStyle(.green)
            Text("No Significant Training Breaks")
                .font(.headline)
            Text("No gaps >7 days detected in the past 12 months. Excellent training consistency!")
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        .background(Color.green.opacity(0.07))
        .cornerRadius(14)
    }

    // MARK: - Retraining Card

    private var retrainingCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Retraining After a Break")
                .font(.headline)

            let breakScenarios: [(String, String, Color)] = [
                ("1–2 weeks", "Minimal loss. Return to pre-break training within 1 week.", .green),
                ("3–4 weeks", "~5–7% VO₂ loss. Return to full training in 2–3 weeks.", .teal),
                ("4–8 weeks", "~7–9% loss. Needs 4–6 weeks back-to-peak. Muscle memory helps.", .orange),
                ("2–6 months", "Full detraining. Beginners lose gains faster; experienced keep neural adaptations.", .red),
            ]

            ForEach(breakScenarios, id: \.0) { scenario in
                HStack(spacing: 10) {
                    RoundedRectangle(cornerRadius: 3).fill(scenario.2)
                        .frame(width: 4, height: 38)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(scenario.0).font(.caption.weight(.bold)).foregroundStyle(scenario.2)
                        Text(scenario.1).font(.caption).foregroundStyle(.secondary)
                    }
                }
            }

            Text("Key principle: cardiovascular fitness (VO₂ max, RHR) detrained faster than structural/neural adaptations. Muscle memory and motor patterns are retained longer.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .padding(.top, 4)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Detraining Research", systemImage: "info.circle.fill")
                .font(.headline)
                .foregroundStyle(.blue)

            Text("Detraining is the partial or complete loss of training-induced adaptations when training is reduced or stopped. Mujika & Padilla (2000) reviewed detraining responses in elite athletes, finding VO₂ max declines of 4–14% over 4 weeks.")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("Highly trained athletes lose fitness faster initially (steep drop in first 2 weeks) but have a lower floor due to structural cardiac adaptations that persist longer. Sedentary individuals may lose gains faster.")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("The 'muscle memory' phenomenon (epigenetic myonuclear retention, Egner et al. 2013) means previously trained muscle recovers faster — typically 50% less time than initial training required for same adaptations.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.blue.opacity(0.07))
        .cornerRadius(14)
    }

    // MARK: - Data Loading

    @MainActor
    private func load() async {
        guard HKHealthStore.isHealthDataAvailable() else {
            errorMessage = "HealthKit not available"
            isLoading = false
            return
        }

        let workoutType = HKObjectType.workoutType()
        let vo2Type     = HKQuantityType(.vo2Max)
        let rhrType     = HKQuantityType(.restingHeartRate)

        do {
            try await hkStore.requestAuthorization(toShare: [], read: [workoutType, vo2Type, rhrType])
        } catch {
            errorMessage = "Authorization failed"
            isLoading = false
            return
        }

        let end   = Date()
        let start = Calendar.current.date(byAdding: .month, value: -12, to: end) ?? Date()
        let pred  = HKQuery.predicateForSamples(withStart: start, end: end)
        let sort  = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)

        // Fetch workouts sorted by date
        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: workoutType, predicate: pred, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, s, _ in
                cont.resume(returning: (s as? [HKWorkout]) ?? [])
            }
            hkStore.execute(q)
        }

        // Compute days since last workout
        if let lastWorkout = workouts.last {
            daysSinceLastWorkout = max(0, Calendar.current.dateComponents([.day], from: lastWorkout.endDate, to: end).day ?? 0)
        } else {
            daysSinceLastWorkout = 30
        }

        // Detect breaks (gaps > 7 days)
        var detectedBreaks: [TrainingBreak] = []
        for i in 0..<max(workouts.count - 1, 0) {
            let w1 = workouts[i]
            let w2 = workouts[i + 1]
            let gapDays = Calendar.current.dateComponents([.day], from: w1.endDate, to: w2.startDate).day ?? 0
            guard gapDays >= 7 else { continue }
            detectedBreaks.append(TrainingBreak(start: w1.endDate, end: w2.startDate, days: gapDays,
                                                 vo2Before: nil, vo2After: nil, rhrBefore: nil, rhrAfter: nil))
        }

        // Fetch VO2 max for current and peak
        let vo2Samples: [HKQuantitySample] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: vo2Type, predicate: pred, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, s, _ in
                cont.resume(returning: (s as? [HKQuantitySample]) ?? [])
            }
            hkStore.execute(q)
        }
        let vo2Unit = HKUnit(from: "ml/kg*min")
        let vo2Vals = vo2Samples.map { $0.quantity.doubleValue(for: vo2Unit) }
        currentVO2 = vo2Vals.last
        peakVO2    = vo2Vals.max()

        // Enrich breaks with VO2/RHR context (simple: check samples near break boundaries)
        var enrichedBreaks: [TrainingBreak] = []
        let bpmUnit = HKUnit.count().unitDivided(by: .minute())
        let rhrSamples: [HKQuantitySample] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: rhrType, predicate: pred, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, s, _ in
                cont.resume(returning: (s as? [HKQuantitySample]) ?? [])
            }
            hkStore.execute(q)
        }

        for b in detectedBreaks {
            let window = 86400 * 3.0  // 3 days around each boundary
            let vo2Before = vo2Samples
                .filter { abs($0.startDate.timeIntervalSince(b.start)) < window }
                .map { $0.quantity.doubleValue(for: vo2Unit) }.last
            let vo2After  = vo2Samples
                .filter { abs($0.startDate.timeIntervalSince(b.end)) < window }
                .map { $0.quantity.doubleValue(for: vo2Unit) }.first
            let rhrBefore = rhrSamples
                .filter { abs($0.startDate.timeIntervalSince(b.start)) < window }
                .map { $0.quantity.doubleValue(for: bpmUnit) }.last
            let rhrAfter  = rhrSamples
                .filter { abs($0.startDate.timeIntervalSince(b.end)) < window }
                .map { $0.quantity.doubleValue(for: bpmUnit) }.first

            enrichedBreaks.append(TrainingBreak(
                start: b.start, end: b.end, days: b.days,
                vo2Before: vo2Before, vo2After: vo2After,
                rhrBefore: rhrBefore, rhrAfter: rhrAfter
            ))
        }

        self.breaks    = enrichedBreaks.sorted { $0.start > $1.start }
        self.isLoading = false
    }
}

#Preview {
    NavigationStack { DetrainingView() }
}
