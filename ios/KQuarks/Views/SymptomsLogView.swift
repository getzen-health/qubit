import SwiftUI
import Charts
import HealthKit

// MARK: - SymptomsLogView

/// Surfaces manually-logged symptom events from HealthKit.
/// iOS 13.6+ allows users to log symptoms directly in the Health app or via
/// third-party apps. Each entry is an HKCategorySample with a
/// HKCategoryValueSeverity value: notPresent / mild / moderate / severe.
///
/// Covering common fitness-relevant symptoms:
/// - fatigue, headache, shortnessOfBreath, generalizedBodyAche
/// - dizziness, chestTightnessOrPain, rapidPoundingOrFlutteringHeartbeat
/// - nausea, coughing, fever
///
/// ⚠️ Medical note: chest pain/tightness + shortness of breath in combination
/// warrant immediate medical evaluation regardless of symptom tracker output.
struct SymptomsLogView: View {

    // MARK: - Data Models

    struct SymptomSpec {
        let type: HKCategoryTypeIdentifier
        let name: String
        let icon: String
        let color: Color
        let urgent: Bool           // flag for concerning symptoms
    }

    struct SymptomEvent: Identifiable {
        let id: UUID
        let date: Date
        let specName: String
        let icon: String
        let color: Color
        let severity: Severity
        let urgent: Bool
    }

    enum Severity: String {
        case mild     = "Mild"
        case moderate = "Moderate"
        case severe   = "Severe"
        case unspecified = "Logged"

        init(rawValue: Int) {
            switch rawValue {
            case 2: self = .mild
            case 3: self = .moderate
            case 4: self = .severe
            default: self = .unspecified
            }
        }

        var color: Color {
            switch self {
            case .mild:        return .yellow
            case .moderate:    return .orange
            case .severe:      return .red
            case .unspecified: return .secondary
            }
        }
    }

    struct FreqEntry: Identifiable {
        let id: String
        let name: String
        let count: Int
        let color: Color
    }

    // MARK: - Symptom Specs

    static let specs: [SymptomSpec] = [
        SymptomSpec(type: .fatigue,                             name: "Fatigue",            icon: "battery.25percent",          color: .orange,  urgent: false),
        SymptomSpec(type: .headache,                            name: "Headache",            icon: "brain.head.profile",         color: .purple,  urgent: false),
        SymptomSpec(type: .generalizedBodyAche,                 name: "Body Ache",           icon: "figure.walk",                color: .teal,    urgent: false),
        SymptomSpec(type: .shortnessOfBreath,                   name: "Shortness of Breath", icon: "wind",                       color: .red,     urgent: true),
        SymptomSpec(type: .dizziness,                           name: "Dizziness",           icon: "figure.fall",                color: .yellow,  urgent: false),
        SymptomSpec(type: .chestTightnessOrPain,                name: "Chest Pain",          icon: "heart.text.clipboard",       color: .red,     urgent: true),
        SymptomSpec(type: .rapidPoundingOrFlutteringHeartbeat,  name: "Rapid Heartbeat",     icon: "waveform.path.ecg",          color: .pink,    urgent: true),
        SymptomSpec(type: .nausea,                              name: "Nausea",              icon: "thermometer.medium",         color: .green,   urgent: false),
        SymptomSpec(type: .coughing,                            name: "Coughing",            icon: "allergens",                  color: .blue,    urgent: false),
        SymptomSpec(type: .vomiting,                            name: "Vomiting",            icon: "exclamationmark.circle",     color: .gray,    urgent: false),
    ]

    // MARK: - State

    @State private var events: [SymptomEvent] = []
    @State private var freqData: [FreqEntry] = []
    @State private var daysWith: Int = 0
    @State private var urgentCount: Int = 0
    @State private var mostCommon: String = "—"
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    // MARK: - Body

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if events.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCard
                    if !freqData.isEmpty { frequencyChart }
                    if urgentCount > 0 { urgentBanner }
                    recentLog
                    scienceCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Symptoms Log")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("30-Day Symptom Log").font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text("\(events.count)")
                            .font(.system(size: 52, weight: .bold, design: .rounded))
                            .foregroundStyle(urgentCount > 0 ? .red : .orange)
                        Text("events")
                            .font(.title2).foregroundStyle(.secondary).padding(.bottom, 8)
                    }
                    Text(mostCommon)
                        .font(.subheadline).foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: "cross.case.fill")
                    .font(.system(size: 44)).foregroundStyle(urgentCount > 0 ? .red : .orange)
            }
            Divider()
            HStack(spacing: 0) {
                statCell(label: "Days With\nSymptoms", value: "\(daysWith)", color: .orange)
                Divider().frame(height: 36)
                statCell(label: "Mild / Moderate", value: "\(events.filter { $0.severity == .mild || $0.severity == .moderate }.count)", color: .yellow)
                Divider().frame(height: 36)
                statCell(label: "Severe", value: "\(events.filter { $0.severity == .severe }.count)",
                         color: events.filter { $0.severity == .severe }.count > 0 ? .red : .secondary)
                Divider().frame(height: 36)
                statCell(label: "Urgent Flags", value: "\(urgentCount)",
                         color: urgentCount > 0 ? .red : .secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func statCell(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.subheadline.bold().monospacedDigit()).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary).multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 8)
    }

    // MARK: - Frequency Chart

    private var frequencyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Symptom Frequency (30d)").font(.headline)
            Text("Number of logged events per symptom type").font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(freqData) { entry in
                    BarMark(x: .value("Count", entry.count),
                            y: .value("Symptom", entry.name))
                    .foregroundStyle(entry.color.opacity(0.8))
                    .cornerRadius(4)
                    .annotation(position: .trailing) {
                        Text("\(entry.count)").font(.caption2).foregroundStyle(.secondary)
                    }
                }
            }
            .chartXAxisLabel("Events")
            .frame(height: CGFloat(freqData.count) * 32 + 20)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Urgent Banner

    private var urgentBanner: some View {
        HStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(.red).font(.title3)
            VStack(alignment: .leading, spacing: 2) {
                Text("Concerning Symptoms Logged").font(.subheadline.bold()).foregroundStyle(.red)
                Text("Chest pain, shortness of breath, or rapid/irregular heartbeat were logged in the past 30 days. If symptoms are ongoing or severe, seek medical evaluation.")
                    .font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color.red.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.red.opacity(0.25), lineWidth: 1))
    }

    // MARK: - Recent Log

    private var recentLog: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recent Entries").font(.headline)
            let df = DateFormatter()
            let _ = { df.dateStyle = .medium; df.timeStyle = .short }()
            VStack(spacing: 0) {
                ForEach(events.prefix(15)) { ev in
                    if ev.id != events.prefix(15).first?.id { Divider() }
                    HStack(spacing: 12) {
                        Image(systemName: ev.icon).foregroundStyle(ev.color).frame(width: 24)
                        VStack(alignment: .leading, spacing: 2) {
                            HStack(spacing: 6) {
                                Text(ev.specName).font(.subheadline.bold())
                                if ev.urgent {
                                    Image(systemName: "exclamationmark.circle.fill")
                                        .font(.caption2).foregroundStyle(.red)
                                }
                            }
                            Text(df.string(from: ev.date)).font(.caption2).foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text(ev.severity.rawValue)
                            .font(.caption.bold())
                            .foregroundStyle(ev.severity.color)
                            .padding(.horizontal, 8).padding(.vertical, 3)
                            .background(ev.severity.color.opacity(0.12))
                            .clipShape(Capsule())
                    }
                    .padding(.vertical, 8)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "stethoscope").foregroundStyle(.teal)
                Text("Symptom Tracking Science").font(.headline)
            }
            VStack(alignment: .leading, spacing: 5) {
                sciRow(title: "Exercise-induced symptoms", body: "Shortness of breath during moderate exercise is normal. At rest or with minimal activity, it warrants evaluation. Chest tightness during exercise should always be taken seriously.")
                sciRow(title: "Fatigue patterns", body: "Persistent fatigue lasting >2 weeks combined with low HRV and elevated RHR may indicate overreaching, illness, or insufficient recovery. Compare with your HRV calendar.")
                sciRow(title: "Headache & dehydration", body: "Exercise headaches affect ~1% of athletes. Ensure 500ml pre-workout + 200ml per 20 min of exercise. Headache post-exertion lasting >24h warrants evaluation.")
                sciRow(title: "Symptom-HRV correlation", body: "HRV drops 10–20% during illness onset, often 24–48h before subjective symptoms appear. Tracking symptoms alongside HRV helps identify patterns for training modification.")
            }
            Divider()
            Text("⚠️ This log is for wellness awareness only. Symptoms of chest pain, shortness of breath, or severe dizziness require prompt medical attention — do not rely on this app for medical decisions.")
                .font(.caption2).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.teal.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.teal.opacity(0.18), lineWidth: 1))
    }

    private func sciRow(title: String, body: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title).font(.caption.bold()).foregroundStyle(.teal)
            Text(body).font(.caption2).foregroundStyle(.secondary)
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "cross.case.fill")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Symptoms Logged").font(.title3.bold())
            Text("Symptoms can be logged in the Apple Health app under Browse → Symptoms. iOS 13.6+ tracks over 30 symptom types including fatigue, headache, shortness of breath, and more.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let types: [HKCategoryType] = Self.specs.map { HKCategoryType($0.type) }
        guard (try? await healthStore.requestAuthorization(toShare: [], read: Set(types))) != nil else { return }

        let cal = Calendar.current
        let thirtyDaysAgo = cal.date(byAdding: .day, value: -30, to: Date())!
        let pred = HKQuery.predicateForSamples(withStart: thirtyDaysAgo, end: Date())

        var allEvents: [SymptomEvent] = []

        await withTaskGroup(of: (SymptomSpec, [HKCategorySample]).self) { group in
            for spec in Self.specs {
                let catType = HKCategoryType(spec.type)
                group.addTask {
                    let samples: [HKCategorySample] = await withCheckedContinuation { cont in
                        let q = HKSampleQuery(sampleType: catType, predicate: pred,
                                              limit: HKObjectQueryNoLimit,
                                              sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]
                        ) { _, s, _ in cont.resume(returning: (s as? [HKCategorySample]) ?? []) }
                        self.healthStore.execute(q)
                    }
                    return (spec, samples)
                }
            }

            for await (spec, samples) in group {
                for s in samples {
                    // Filter out "notPresent" (value == 1)
                    guard s.value != 1 else { continue }
                    let sev = Severity(rawValue: s.value)
                    allEvents.append(SymptomEvent(
                        id: s.uuid,
                        date: s.startDate,
                        specName: spec.name,
                        icon: spec.icon,
                        color: spec.color,
                        severity: sev,
                        urgent: spec.urgent
                    ))
                }
            }
        }

        guard !allEvents.isEmpty else { return }

        events = allEvents.sorted { $0.date > $1.date }

        // Frequency by spec name
        var countMap: [String: (count: Int, color: Color)] = [:]
        for ev in events {
            countMap[ev.specName, default: (0, ev.color)].count += 1
        }
        freqData = countMap.map { FreqEntry(id: $0.key, name: $0.key, count: $0.value.count, color: $0.value.color) }
            .sorted { $0.count > $1.count }

        let uniqueDays = Set(events.map { cal.startOfDay(for: $0.date) })
        daysWith = uniqueDays.count
        urgentCount = events.filter(\.urgent).count
        mostCommon = freqData.first.map { "Most common: \($0.name)" } ?? "—"
    }
}

#Preview { NavigationStack { SymptomsLogView() } }
