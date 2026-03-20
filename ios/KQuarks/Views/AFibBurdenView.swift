import SwiftUI
import HealthKit

// MARK: - AFibBurdenView

struct AFibBurdenView: View {
    var body: some View {
        if #available(iOS 16.0, *) {
            AFibBurdenContent()
        } else {
            ContentUnavailableView(
                "iOS 16 Required",
                systemImage: "waveform.path.ecg.rectangle.fill",
                description: Text("AFib burden tracking requires iOS 16 and Apple Watch with ECG support.")
            )
        }
    }
}

@available(iOS 16.0, *)
private struct AFibBurdenContent: View {

    // MARK: - Models

    struct DailyBurden: Identifiable {
        let id = UUID()
        let date: Date
        let burdenPct: Double  // 0.0–1.0 (0% to 100%)
    }

    enum BurdenCategory {
        case minimal         // <0.5%
        case low             // 0.5–5%
        case moderate        // 5–20%
        case high            // 20–50%
        case veryHigh        // >50%
        case noData

        init(pct: Double) {
            switch pct {
            case ..<0.005: self = .minimal
            case 0.005..<0.05: self = .low
            case 0.05..<0.20: self = .moderate
            case 0.20..<0.50: self = .high
            default: self = .veryHigh
            }
        }

        var label: String {
            switch self {
            case .minimal:  return "Minimal (<0.5%)"
            case .low:      return "Low (0.5–5%)"
            case .moderate: return "Moderate (5–20%)"
            case .high:     return "High (20–50%)"
            case .veryHigh: return "Very High (>50%)"
            case .noData:   return "No Data"
            }
        }

        var color: Color {
            switch self {
            case .minimal:  return .green
            case .low:      return .teal
            case .moderate: return .orange
            case .high:     return .red
            case .veryHigh: return .purple
            case .noData:   return .gray
            }
        }

        var strokeRiskNote: String {
            switch self {
            case .minimal:  return "Minimal burden — consistent with paroxysmal AFib. Maintain monitoring."
            case .low:      return "Low burden. Discuss with cardiologist whether anticoagulation is indicated."
            case .moderate: return "Moderate burden. Warrants rhythm control discussion with your physician."
            case .high:     return "High burden. Significantly elevated stroke risk. Medical review recommended."
            case .veryHigh: return "Very high burden — near-persistent AFib. Urgent cardiologist review."
            case .noData:   return "No AFib burden data. This metric requires ECG-capable Apple Watch."
            }
        }
    }

    // MARK: - State

    @State private var daily: [DailyBurden] = []
    @State private var isLoading = true
    @State private var noAFib    = false

    private let hkStore = HKHealthStore()
    private let burdenType = HKQuantityType(.atrialFibrillationBurden)

    // MARK: - Computed

    private var latestBurden: Double?  { daily.last?.burdenPct }
    private var avgBurden:    Double?  { daily.isEmpty ? nil : daily.map(\.burdenPct).reduce(0, +) / Double(daily.count) }
    private var maxBurden:    Double?  { daily.map(\.burdenPct).max() }
    private var latestCategory: BurdenCategory {
        latestBurden.map { BurdenCategory(pct: $0) } ?? .noData
    }

    private var weeklyAvgs: [(weekStart: Date, avgPct: Double)] {
        let cal = Calendar.current
        var buckets: [Date: [Double]] = [:]
        for d in daily {
            let wc = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: d.date)
            guard let ws = cal.date(from: wc) else { continue }
            buckets[ws, default: []].append(d.burdenPct)
        }
        return buckets.map { (ws, vals) in (ws, vals.reduce(0, +) / Double(vals.count)) }
            .sorted { $0.weekStart < $1.weekStart }
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if isLoading {
                    ProgressView("Loading AFib burden data…")
                        .frame(maxWidth: .infinity)
                        .padding(.top, 60)
                } else if noAFib {
                    noAFibState
                } else if daily.isEmpty {
                    ContentUnavailableView(
                        "No AFib Burden Data",
                        systemImage: "waveform.path.ecg.rectangle.fill",
                        description: Text("AFib burden is only collected by Apple Watch when ECG measurements detect atrial fibrillation. Your watch may not support ECG or no AFib has been detected.")
                    )
                } else {
                    disclaimerBanner
                    currentBurdenCard
                    dailyChart
                    weeklyTrendCard
                    strokeRiskCard
                    scienceCard
                }
            }
            .padding()
        }
        .navigationTitle("AFib Burden")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - No AFib State

    private var noAFibState: some View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 60))
                .foregroundStyle(.green)

            Text("No AFib Detected")
                .font(.title2.bold())

            Text("Your Apple Watch has not detected any atrial fibrillation episodes in the past 90 days. This is reassuring, but Apple Watch cannot definitively rule out AFib.")
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            Text("AFib burden data is only recorded when an ECG measurement or background rhythm check detects AFib. Continue wearing your watch daily for ongoing monitoring.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(24)
        .background(Color.green.opacity(0.07))
        .cornerRadius(16)
    }

    // MARK: - Disclaimer Banner

    private var disclaimerBanner: some View {
        HStack(spacing: 10) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(.red)
            Text("Medical information only. AFib requires physician management. This is not medical advice.")
                .font(.caption)
                .foregroundStyle(.red)
        }
        .padding(10)
        .background(Color.red.opacity(0.08))
        .cornerRadius(10)
    }

    // MARK: - Current Burden Card

    private var currentBurdenCard: some View {
        HStack(spacing: 16) {
            Image(systemName: latestCategory.color == .green ? "heart.fill" : "waveform.path.ecg.rectangle.fill")
                .font(.system(size: 40))
                .foregroundStyle(latestCategory.color)

            VStack(alignment: .leading, spacing: 6) {
                Text("Latest AFib Burden")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                if let pct = latestBurden {
                    HStack(alignment: .lastTextBaseline, spacing: 4) {
                        Text(String(format: "%.1f", pct * 100))
                            .font(.system(size: 44, weight: .bold, design: .rounded))
                            .foregroundStyle(latestCategory.color)
                        Text("%")
                            .font(.title2)
                            .foregroundStyle(.secondary)
                    }
                }
                Text(latestCategory.label)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(latestCategory.color)
            }
            Spacer()
        }
        .padding()
        .background(latestCategory.color.opacity(0.1))
        .cornerRadius(16)
    }

    // MARK: - Daily Chart

    private var dailyChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("90-Day Daily Burden")
                .font(.headline)

            let maxPct = (daily.map(\.burdenPct).max() ?? 0.01) * 100 + 2

            GeometryReader { geo in
                let xStep = geo.size.width / CGFloat(max(daily.count - 1, 1))

                ZStack(alignment: .bottomLeading) {
                    // Grid
                    ForEach([25, 50, 75, 100], id: \.self) { pct in
                        if Double(pct) <= maxPct {
                            let y = geo.size.height * (1 - CGFloat(Double(pct) / maxPct))
                            Path { p in
                                p.move(to: CGPoint(x: 0, y: y))
                                p.addLine(to: CGPoint(x: geo.size.width, y: y))
                            }
                            .stroke(Color.secondary.opacity(0.12), lineWidth: 1)
                        }
                    }

                    // Area fill
                    Path { p in
                        guard let first = daily.first else { return }
                        let yFor: (Double) -> CGFloat = { pct in geo.size.height * (1 - CGFloat(pct * 100 / maxPct)) }
                        p.move(to: CGPoint(x: 0, y: geo.size.height))
                        p.addLine(to: CGPoint(x: 0, y: yFor(first.burdenPct)))
                        for (i, d) in daily.enumerated().dropFirst() {
                            p.addLine(to: CGPoint(x: CGFloat(i) * xStep, y: yFor(d.burdenPct)))
                        }
                        p.addLine(to: CGPoint(x: CGFloat(daily.count - 1) * xStep, y: geo.size.height))
                        p.closeSubpath()
                    }
                    .fill(Color.red.opacity(0.15))

                    // Burden line colored by category
                    ForEach(Array(daily.enumerated().dropLast()), id: \.0) { i, d in
                        let yFor: (Double) -> CGFloat = { pct in geo.size.height * (1 - CGFloat(pct * 100 / maxPct)) }
                        let x1 = CGFloat(i) * xStep
                        let x2 = CGFloat(i + 1) * xStep
                        let y1 = yFor(d.burdenPct)
                        let y2 = yFor(daily[i + 1].burdenPct)
                        Path { p in
                            p.move(to: CGPoint(x: x1, y: y1))
                            p.addLine(to: CGPoint(x: x2, y: y2))
                        }
                        .stroke(BurdenCategory(pct: d.burdenPct).color, lineWidth: 2)
                    }
                }
            }
            .frame(height: 140)

            Text("Color indicates burden category: green (minimal), orange (moderate), red (high)")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
    }

    // MARK: - Weekly Trend Card

    private var weeklyTrendCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Weekly Average Burden")
                .font(.headline)

            if let avg = avgBurden {
                HStack(spacing: 20) {
                    statTile("Avg", String(format: "%.1f%%", avg * 100))
                    statTile("Peak", maxBurden.map { String(format: "%.1f%%", $0 * 100) } ?? "--")
                    statTile("Days w/ AFib", "\(daily.filter { $0.burdenPct > 0 }.count)")
                }
            }

            ForEach(weeklyAvgs.suffix(8), id: \.weekStart) { wk in
                HStack {
                    Text(wk.weekStart, format: .dateTime.month(.abbreviated).day())
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .frame(width: 55, alignment: .leading)

                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 3)
                                .fill(Color(.systemFill))
                            let w = geo.size.width * CGFloat(min(wk.avgPct * 100 / 30.0, 1.0))
                            RoundedRectangle(cornerRadius: 3)
                                .fill(BurdenCategory(pct: wk.avgPct).color)
                                .frame(width: max(w, 4))
                        }
                    }
                    .frame(height: 10)

                    Text(String(format: "%.1f%%", wk.avgPct * 100))
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .frame(width: 40, alignment: .trailing)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
    }

    private func statTile(_ label: String, _ value: String) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.subheadline.bold())
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(8)
        .background(Color(.tertiarySystemBackground))
        .cornerRadius(10)
    }

    // MARK: - Stroke Risk Card

    private var strokeRiskCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Clinical Context", systemImage: "stethoscope")
                .font(.headline)
                .foregroundStyle(.red)

            Text(latestCategory.strokeRiskNote)
                .font(.subheadline)
                .foregroundStyle(.secondary)

            let categories: [(String, Color)] = [
                ("< 0.5% — Minimal", .green),
                ("0.5–5% — Low", .teal),
                ("5–20% — Moderate", .orange),
                ("20–50% — High", .red),
                ("> 50% — Very High", .purple),
            ]

            ForEach(categories, id: \.0) { cat in
                HStack(spacing: 8) {
                    Circle().fill(cat.1).frame(width: 10, height: 10)
                    Text(cat.0).font(.caption)
                    if cat.0.hasPrefix(latestCategory.label.prefix(3)) {
                        Image(systemName: "arrowshape.left.fill").font(.caption2).foregroundStyle(cat.1)
                        Text("You are here").font(.caption2).foregroundStyle(cat.1)
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("About AFib Burden", systemImage: "info.circle.fill")
                .font(.headline)
                .foregroundStyle(.purple)

            Text("AFib burden is the percentage of time spent in atrial fibrillation over a monitoring period. Apple Watch measures this using photoplethysmography (PPG) background rhythm checks and ECG data from the ECG app.")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("Higher AFib burden is associated with increased stroke risk. Research from the Apple Heart Study (Perez et al. 2019, 419,000 participants) validated Apple Watch's AFib detection, with positive predictive value of 84% when combined with ECG patch confirmation.")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("Burden classification guides treatment: minimal (<1%) may be managed conservatively; higher burden often warrants rhythm control therapy and anticoagulation discussion with a cardiologist.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.purple.opacity(0.07))
        .cornerRadius(14)
    }

    // MARK: - Data Loading

    private func load() async {
        guard HKHealthStore.isHealthDataAvailable() else {
            isLoading = false
            return
        }

        // Check authorization
        let authStatus = hkStore.authorizationStatus(for: burdenType)
        if authStatus == .notDetermined {
            do {
                try await hkStore.requestAuthorization(toShare: [], read: [burdenType])
            } catch {
                noAFib = true
                isLoading = false
                return
            }
        }

        let end   = Date()
        let start = Calendar.current.date(byAdding: .day, value: -90, to: end)!
        let pred  = HKQuery.predicateForSamples(withStart: start, end: end)
        let sort  = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)
        let pctUnit = HKUnit.percent()

        let samples: [HKQuantitySample] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: burdenType, predicate: pred, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, s, _ in
                cont.resume(returning: (s as? [HKQuantitySample]) ?? [])
            }
            hkStore.execute(q)
        }

        if samples.isEmpty {
            noAFib = true
            isLoading = false
            return
        }

        // Group by day, take mean
        let fmt = DateFormatter(); fmt.dateFormat = "yyyy-MM-dd"
        var dayBuckets: [String: [Double]] = [:]
        var dayDates:   [String: Date]     = [:]

        for s in samples {
            let key = fmt.string(from: s.startDate)
            let val = s.quantity.doubleValue(for: pctUnit)
            dayBuckets[key, default: []].append(val)
            if dayDates[key] == nil { dayDates[key] = s.startDate }
        }

        var points: [DailyBurden] = []
        for key in dayBuckets.keys.sorted() {
            guard let vals = dayBuckets[key], let date = dayDates[key] else { continue }
            let avg = vals.reduce(0, +) / Double(vals.count)
            points.append(DailyBurden(date: date, burdenPct: avg))
        }

        await MainActor.run {
            self.daily     = points
            self.isLoading = false
        }
    }
}

#Preview {
    NavigationStack { AFibBurdenView() }
}
