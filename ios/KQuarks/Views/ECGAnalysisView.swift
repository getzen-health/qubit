import SwiftUI
import Charts
import HealthKit

// MARK: - ECGAnalysisView

/// Displays manual Apple Watch ECG recording history, classification breakdown,
/// and long-term AFib burden tracking. Distinct from CardiacEventsView
/// (automatic alerts); this shows user-initiated ECG measurements.
struct ECGAnalysisView: View {

    // MARK: - Models

    enum ECGClass: String, CaseIterable {
        case sinusRhythm    = "Sinus Rhythm"
        case atrialFib      = "Atrial Fibrillation"
        case highHeartRate  = "Inconclusive – High HR"
        case lowHeartRate   = "Inconclusive – Low HR"
        case inconclusive   = "Inconclusive"
        case notClassified  = "Not Classified"

        var color: Color {
            switch self {
            case .sinusRhythm:   return .green
            case .atrialFib:     return .red
            case .highHeartRate: return .orange
            case .lowHeartRate:  return .blue
            case .inconclusive:  return .gray
            case .notClassified: return .secondary
            }
        }

        var icon: String {
            switch self {
            case .sinusRhythm:   return "waveform.path.ecg"
            case .atrialFib:     return "heart.slash.fill"
            case .highHeartRate: return "arrow.up.heart.fill"
            case .lowHeartRate:  return "arrow.down.heart.fill"
            case .inconclusive:  return "questionmark.circle.fill"
            case .notClassified: return "minus.circle"
            }
        }

        static func from(_ classification: HKElectrocardiogram.Classification) -> ECGClass {
            switch classification {
            case .sinusRhythm:                 return .sinusRhythm
            case .atrialFibrillation:          return .atrialFib
            case .inconclusiveHighHeartRate:   return .highHeartRate
            case .inconclusiveLowHeartRate:    return .lowHeartRate
            case .inconclusiveOther,
                 .inconclusivePoorReading:     return .inconclusive
            default:                           return .notClassified
            }
        }
    }

    struct ECGRecord: Identifiable {
        let id: UUID
        let date: Date
        let classification: ECGClass
        let heartRate: Double?  // bpm at time of recording
    }

    struct MonthBucket: Identifiable {
        let id: String  // "YYYY-MM"
        let monthStart: Date
        let sinusCount: Int
        let afibCount: Int
        let inconclusiveCount: Int
        var totalCount: Int { sinusCount + afibCount + inconclusiveCount }
        var afibBurden: Double { totalCount > 0 ? Double(afibCount) / Double(totalCount) : 0 }
    }

    // MARK: - State

    @State private var records: [ECGRecord] = []
    @State private var monthBuckets: [MonthBucket] = []
    @State private var sinusPct: Double = 0
    @State private var afibPct: Double = 0
    @State private var inconclusivePct: Double = 0
    @State private var latestClassification: ECGClass = .notClassified
    @State private var latestDate: Date? = nil
    @State private var isLoading = true
    @State private var isUnsupported = false

    private let healthStore = HKHealthStore()

    // MARK: - Body

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if isUnsupported {
                unsupportedState
            } else if records.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCard
                    classificationBreakdownCard
                    if monthBuckets.count > 1 { afibBurdenChartCard }
                    recentRecordsCard
                    infoCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("ECG Analysis")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: latestClassification.icon)
                    .font(.largeTitle)
                    .foregroundStyle(latestClassification.color)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Latest ECG")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(latestClassification.rawValue)
                        .font(.title3.bold())
                        .foregroundStyle(latestClassification.color)
                    if let d = latestDate {
                        Text(d, style: .relative) + Text(" ago")
                        Text(" ").font(.caption2).foregroundStyle(.secondary)
                    }
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 4) {
                    Text("\(records.count)")
                        .font(.title2.bold())
                    Text("total ECGs")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }

            Divider()

            HStack(spacing: 0) {
                pctPill(label: "Sinus Rhythm", pct: sinusPct, color: .green)
                Divider().frame(height: 40)
                pctPill(label: "Atrial Fib", pct: afibPct, color: .red)
                Divider().frame(height: 40)
                pctPill(label: "Inconclusive", pct: inconclusivePct, color: .gray)
            }

            if afibPct > 0 {
                Label("AFib detected in \(Int(afibPct))% of recordings — consult your doctor if this is new.", systemImage: "exclamationmark.triangle.fill")
                    .font(.caption)
                    .foregroundStyle(.red)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func pctPill(label: String, pct: Double, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(String(format: "%.0f%%", pct))
                .font(.title3.bold())
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
    }

    // MARK: - Classification Breakdown

    private var classificationBreakdownCard: some View {
        let classCounts = Dictionary(grouping: records, by: \.classification)
            .mapValues(\.count)
            .sorted { $0.value > $1.value }

        return VStack(alignment: .leading, spacing: 8) {
            Text("Classification Breakdown")
                .font(.headline)

            Chart {
                ForEach(classCounts, id: \.key.rawValue) { item in
                    BarMark(
                        x: .value("Count", item.value),
                        y: .value("Classification", item.key.rawValue)
                    )
                    .foregroundStyle(item.key.color.opacity(0.8))
                    .cornerRadius(4)
                    .annotation(position: .trailing) {
                        Text("\(item.value)")
                            .font(.caption.bold())
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .chartXAxis(.hidden)
            .frame(height: max(Double(classCounts.count) * 44, 100))
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - AFib Burden Chart

    private var afibBurdenChartCard: some View {
        let hasAFib = monthBuckets.contains { $0.afibCount > 0 }
        guard hasAFib || monthBuckets.count > 2 else { return AnyView(EmptyView()) }

        return AnyView(VStack(alignment: .leading, spacing: 8) {
            Text("Monthly ECG Summary")
                .font(.headline)

            Chart {
                ForEach(monthBuckets) { b in
                    BarMark(
                        x: .value("Month", b.monthStart, unit: .month),
                        y: .value("Sinus", b.sinusCount)
                    )
                    .foregroundStyle(Color.green.opacity(0.7))

                    BarMark(
                        x: .value("Month", b.monthStart, unit: .month),
                        y: .value("AFib", b.afibCount)
                    )
                    .foregroundStyle(Color.red.opacity(0.7))

                    BarMark(
                        x: .value("Month", b.monthStart, unit: .month),
                        y: .value("Inc.", b.inconclusiveCount)
                    )
                    .foregroundStyle(Color.gray.opacity(0.4))
                }
            }
            .chartForegroundStyleScale([
                "Sinus": Color.green.opacity(0.7),
                "AFib": Color.red.opacity(0.7),
                "Inc.": Color.gray.opacity(0.4)
            ])
            .chartXAxis {
                AxisMarks(values: .stride(by: .month, count: 2)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .frame(height: 160)

            HStack(spacing: 16) {
                legendDot(color: .green, label: "Sinus")
                legendDot(color: .red, label: "AFib")
                legendDot(color: .gray, label: "Inconclusive")
            }
            .font(.caption2)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14)))
    }

    private func legendDot(color: Color, label: String) -> some View {
        HStack(spacing: 4) {
            Circle().fill(color.opacity(0.8)).frame(width: 8, height: 8)
            Text(label).foregroundStyle(.secondary)
        }
    }

    // MARK: - Recent Records

    private var recentRecordsCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recent Recordings")
                .font(.headline)

            let df = DateFormatter()
            let _ = { df.dateStyle = .medium; df.timeStyle = .short }()

            ForEach(records.prefix(10).reversed()) { r in
                HStack(spacing: 12) {
                    Image(systemName: r.classification.icon)
                        .foregroundStyle(r.classification.color)
                        .frame(width: 24)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(r.classification.rawValue)
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(r.classification.color)
                        Text(df.string(from: r.date))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    if let hr = r.heartRate {
                        Text("\(Int(hr)) bpm")
                            .font(.caption.monospacedDigit())
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 4)

                if r.id != records.prefix(10).reversed().last?.id {
                    Divider()
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Info Card

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("About ECG on Apple Watch", systemImage: "waveform.path.ecg.rectangle")
                .font(.headline)
                .foregroundStyle(.indigo)

            Text("Apple Watch Series 4+ can record a single-lead ECG in 30 seconds. The algorithm classifies the heart rhythm into categories.")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("Sinus rhythm (normal): Regular rhythm with heart rate 50–100 bpm.")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("Atrial fibrillation: Irregular rhythm potentially associated with stroke risk. If detected, consult your doctor.")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("Inconclusive: Reading quality or heart rate was too high/low for classification.")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("This view is for informational purposes only and does not constitute medical advice.")
                .font(.caption2)
                .foregroundStyle(.tertiary)
                .italic()
        }
        .padding()
        .background(Color.indigo.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Empty / Unsupported States

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "waveform.path.ecg.rectangle")
                .font(.system(size: 52))
                .foregroundStyle(.secondary)
            Text("No ECG Recordings")
                .font(.title3.bold())
            Text("Open the ECG app on your Apple Watch Series 4 or later to record your heart rhythm.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    private var unsupportedState: some View {
        VStack(spacing: 16) {
            Image(systemName: "applewatch.slash")
                .font(.system(size: 52))
                .foregroundStyle(.secondary)
            Text("ECG Not Available")
                .font(.title3.bold())
            Text("ECG recordings require Apple Watch Series 4 or later. This device or software version does not support ECG access.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let ecgType = HKObjectType.electrocardiogramType()
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [ecgType])) != nil else { return }

        let pred = HKQuery.predicateForSamples(
            withStart: Calendar.current.date(byAdding: .year, value: -2, to: Date()) ?? Date(),
            end: Date()
        )

        let rawECGs: [HKElectrocardiogram] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(
                sampleType: ecgType, predicate: pred, limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in
                cont.resume(returning: (s as? [HKElectrocardiogram]) ?? [])
            }
            healthStore.execute(q)
        }

        guard !rawECGs.isEmpty else { return }

        let hrUnit = HKUnit.count().unitDivided(by: .minute())
        let ecgRecords = rawECGs.map { ecg -> ECGRecord in
            ECGRecord(
                id: ecg.uuid,
                date: ecg.startDate,
                classification: ECGClass.from(ecg.classification),
                heartRate: ecg.averageHeartRate?.doubleValue(for: hrUnit)
            )
        }

        records = ecgRecords

        // Compute overall percentages
        let total = Double(ecgRecords.count)
        let sinusCount = Double(ecgRecords.filter { $0.classification == .sinusRhythm }.count)
        let afibCount = Double(ecgRecords.filter { $0.classification == .atrialFib }.count)
        let incCount = Double(ecgRecords.filter { [.highHeartRate, .lowHeartRate, .inconclusive].contains($0.classification) }.count)

        sinusPct = sinusCount / total * 100
        afibPct = afibCount / total * 100
        inconclusivePct = incCount / total * 100

        latestClassification = ecgRecords.last?.classification ?? .notClassified
        latestDate = ecgRecords.last?.date

        // Build monthly buckets
        var monthMap: [String: (Int, Int, Int)] = [:]  // key: "YYYY-MM" → (sinus, afib, inconclusive)
        let df = DateFormatter(); df.dateFormat = "yyyy-MM"

        for r in ecgRecords {
            let key = df.string(from: r.date)
            var cur = monthMap[key] ?? (0, 0, 0)
            switch r.classification {
            case .sinusRhythm:   cur.0 += 1
            case .atrialFib:     cur.1 += 1
            default:             cur.2 += 1
            }
            monthMap[key] = cur
        }

        let dfFull = DateFormatter(); dfFull.dateFormat = "yyyy-MM"
        monthBuckets = monthMap.compactMap { key, val in
            guard let date = dfFull.date(from: key) else { return nil }
            return MonthBucket(id: key, monthStart: date, sinusCount: val.0, afibCount: val.1, inconclusiveCount: val.2)
        }.sorted { $0.monthStart < $1.monthStart }
    }
}

#Preview {
    NavigationStack {
        ECGAnalysisView()
    }
}
