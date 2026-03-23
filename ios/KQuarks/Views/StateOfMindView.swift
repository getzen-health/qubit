import SwiftUI
import HealthKit
import Charts

// MARK: - StateOfMindView
// Surfaces HKStateOfMind (iOS 18+) — Apple Watch / Health app mental state logs.
// Shows 30-day valence trend, emotional label frequency, association contexts,
// and daily vs momentary kind breakdown.

@available(iOS 18.0, *)
private struct StateOfMindContent: View {

    // MARK: - Model

    struct MoodEntry: Identifiable {
        let id = UUID()
        let date: Date
        let valence: Double           // -1.0 (very negative) → +1.0 (very positive)
        let labels: [String]
        let associations: [String]
        let kind: String              // "daily" or "momentary"
    }

    // MARK: - State

    @State private var entries: [MoodEntry] = []
    @State private var isLoading = true
    @State private var selectedKind: KindFilter = .all

    private let healthStore = HKHealthStore()

    enum KindFilter: String, CaseIterable {
        case all = "All"
        case daily = "Daily"
        case momentary = "Momentary"
    }

    // MARK: - Computed

    private var filteredEntries: [MoodEntry] {
        switch selectedKind {
        case .all:       return entries
        case .daily:     return entries.filter { $0.kind == "daily" }
        case .momentary: return entries.filter { $0.kind == "momentary" }
        }
    }

    private var avgValence: Double? {
        let vals = filteredEntries.map(\.valence)
        guard !vals.isEmpty else { return nil }
        return vals.reduce(0, +) / Double(vals.count)
    }

    private var valenceLabel: (text: String, color: Color) {
        guard let avg = avgValence else { return ("No data", .gray) }
        switch avg {
        case 0.5...:    return ("Positive", .green)
        case 0.1..<0.5: return ("Slightly positive", .mint)
        case -0.1..<0.1: return ("Neutral", .yellow)
        case -0.5 ..< -0.1: return ("Slightly negative", .orange)
        default:        return ("Negative", .red)
        }
    }

    private var labelFrequency: [(label: String, count: Int, color: Color)] {
        var freq: [String: Int] = [:]
        for entry in filteredEntries {
            for label in entry.labels { freq[label, default: 0] += 1 }
        }
        return freq.sorted { $0.value > $1.value }
            .prefix(10)
            .map { (label: $0.key, count: $0.value, color: colorForLabel($0.key)) }
    }

    private var associationFrequency: [(assoc: String, count: Int)] {
        var freq: [String: Int] = [:]
        for entry in filteredEntries {
            for a in entry.associations { freq[a, default: 0] += 1 }
        }
        return freq.sorted { $0.value > $1.value }.prefix(8).map { (assoc: $0.key, count: $0.value) }
    }

    private func colorForLabel(_ label: String) -> Color {
        let positiveLabels = ["joyful", "excited", "grateful", "calm", "hopeful",
                              "peaceful", "content", "satisfied", "relieved", "proud",
                              "amazed", "amused", "passionate"]
        let negativeLabels = ["stressed", "anxious", "sad", "overwhelmed", "frustrated",
                              "worried", "discouraged", "hopeless", "angry", "guilty",
                              "lonely", "upset", "drained", "disgusted"]
        if positiveLabels.contains(label.lowercased()) { return .green }
        if negativeLabels.contains(label.lowercased()) { return .red }
        return .blue
    }

    // 7-day rolling average valence
    private var rollingValence: [(date: Date, avg: Double)] {
        let sorted = filteredEntries.sorted { $0.date < $1.date }
        var result: [(date: Date, avg: Double)] = []
        for i in 0..<sorted.count {
            let window = stride(from: max(0, i - 6), through: i, by: 1).map { sorted[$0].valence }
            result.append((date: sorted[i].date, avg: window.reduce(0, +) / Double(window.count)))
        }
        return result
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {

                // Intro banner
                introBanner

                // Kind filter
                Picker("Kind", selection: $selectedKind) {
                    ForEach(KindFilter.allCases, id: \.self) { Text($0.rawValue).tag($0) }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)

                // Summary card
                summaryCard

                // Valence trend
                if !filteredEntries.isEmpty {
                    valenceTrendChart
                }

                // Label frequency
                if !labelFrequency.isEmpty {
                    labelFrequencyChart
                }

                // Association breakdown
                if !associationFrequency.isEmpty {
                    associationCard
                }

                // Science
                scienceCard
            }
            .padding(.vertical)
        }
        .navigationTitle("State of Mind")
        .navigationBarTitleDisplayMode(.large)
        .task { await loadData() }
        .refreshable { await loadData() }
        .overlay {
            if isLoading {
                ProgressView("Loading mood data…")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(.ultraThinMaterial)
            }
        }
    }

    // MARK: - Subviews

    private var introBanner: some View {
        VStack(spacing: 6) {
            HStack {
                Image(systemName: "heart.text.square.fill")
                    .foregroundStyle(.pink)
                Text("Mental State Log (iOS 18)")
                    .font(.headline)
                Spacer()
                Text("Requires iOS 18+")
                    .font(.caption2)
                    .padding(.horizontal, 6).padding(.vertical, 2)
                    .background(.pink.opacity(0.1))
                    .foregroundStyle(.pink)
                    .clipShape(Capsule())
            }
            Text("Log your emotional state in the Health app or directly from Apple Watch. iPhone analyzes mood valence, emotional labels, and context associations.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var summaryCard: some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 6) {
                Text("30-Day Mood")
                    .font(.caption).foregroundStyle(.secondary)
                HStack(alignment: .lastTextBaseline, spacing: 4) {
                    Text(avgValence.map { String(format: "%+.2f", $0) } ?? "—")
                        .font(.largeTitle).bold()
                    Text("valence")
                        .font(.caption).foregroundStyle(.secondary)
                }
                Text(valenceLabel.text)
                    .font(.caption).bold()
                    .padding(.horizontal, 8).padding(.vertical, 3)
                    .background(valenceLabel.color.opacity(0.15))
                    .foregroundStyle(valenceLabel.color)
                    .clipShape(Capsule())
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 8) {
                VStack(alignment: .trailing, spacing: 2) {
                    Text("\(filteredEntries.count)").font(.title2).bold()
                    Text("mood logs").font(.caption).foregroundStyle(.secondary)
                }
                VStack(alignment: .trailing, spacing: 2) {
                    Text("\(filteredEntries.filter { $0.kind == "daily" }.count)").font(.title2).bold()
                    Text("daily check-ins").font(.caption).foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var valenceTrendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Valence Trend — 30 Days", systemImage: "waveform.path.ecg")
                .font(.subheadline).bold()

            Text("Valence: −1.0 (very negative) → +1.0 (very positive). Purple line = 7-day rolling average.")
                .font(.caption2).foregroundStyle(.secondary)

            Chart {
                // Positive zone
                RectangleMark(
                    xStart: .value("", filteredEntries.first?.date ?? Date()),
                    xEnd:   .value("", filteredEntries.last?.date  ?? Date()),
                    yStart: .value("", 0.0),
                    yEnd:   .value("", 1.0)
                )
                .foregroundStyle(.green.opacity(0.05))

                // Zero line
                RuleMark(y: .value("Neutral", 0))
                    .lineStyle(StrokeStyle(dash: [4]))
                    .foregroundStyle(.secondary.opacity(0.5))
                    .annotation(position: .trailing) {
                        Text("0").font(.caption2).foregroundStyle(.secondary)
                    }

                // Individual entries
                ForEach(filteredEntries.sorted { $0.date < $1.date }) { e in
                    PointMark(x: .value("Date", e.date),
                              y: .value("Valence", e.valence))
                        .foregroundStyle(e.valence >= 0 ? Color.green.opacity(0.5) : Color.red.opacity(0.5))
                        .symbolSize(30)
                }

                // Rolling average line
                ForEach(rollingValence, id: \.date) { pt in
                    LineMark(x: .value("Date", pt.date),
                             y: .value("7d avg", pt.avg))
                        .foregroundStyle(.purple)
                        .interpolationMethod(.catmullRom)
                        .lineStyle(StrokeStyle(lineWidth: 2))
                }
            }
            .frame(height: 200)
            .chartYScale(domain: -1.0...1.0)
            .chartXAxis { AxisMarks(values: .stride(by: .weekOfYear)) { _ in
                AxisValueLabel(format: .dateTime.month(.abbreviated).day())
            }}
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var labelFrequencyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Emotional Labels", systemImage: "tag.fill")
                .font(.subheadline).bold()

            Chart(labelFrequency, id: \.label) { item in
                BarMark(x: .value("Count", item.count),
                        y: .value("Label", item.label))
                    .foregroundStyle(item.color.gradient)
                    .cornerRadius(4)
                    .annotation(position: .trailing) {
                        Text("\(item.count)")
                            .font(.caption2).foregroundStyle(.secondary)
                    }
            }
            .frame(height: CGFloat(labelFrequency.count) * 28 + 16)
            .chartXAxis(.hidden)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private var associationCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Context Associations", systemImage: "square.grid.2x2.fill")
                .font(.subheadline).bold()

            Text("What life areas are linked to your mood logs?")
                .font(.caption).foregroundStyle(.secondary)

            let total = Double(associationFrequency.reduce(0) { $0 + $1.count })

            ForEach(associationFrequency, id: \.assoc) { item in
                HStack(spacing: 8) {
                    Text(associationIcon(item.assoc))
                    Text(item.assoc.capitalized)
                        .font(.caption)
                        .frame(width: 100, alignment: .leading)
                    GeometryReader { geo in
                        let pct = total > 0 ? Double(item.count) / total : 0
                        RoundedRectangle(cornerRadius: 4)
                            .fill(associationColor(item.assoc).opacity(0.7))
                            .frame(width: geo.size.width * pct, height: 16)
                    }
                    .frame(height: 16)
                    Text("\(Int((Double(item.count) / total) * 100))%")
                        .font(.caption).foregroundStyle(.secondary)
                        .frame(width: 36, alignment: .trailing)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func associationIcon(_ assoc: String) -> String {
        switch assoc.lowercased() {
        case "work":          return "💼"
        case "family":        return "👨‍👩‍👧"
        case "relationships":  return "❤️"
        case "hobbies":       return "🎨"
        case "currentevents": return "📰"
        case "health":        return "🏥"
        case "fitness":       return "🏃"
        case "education":     return "📚"
        case "identity":      return "🪞"
        case "money":         return "💰"
        case "weather":       return "🌤️"
        default:              return "●"
        }
    }

    private func associationColor(_ assoc: String) -> Color {
        switch assoc.lowercased() {
        case "work":          return .blue
        case "family":        return .orange
        case "relationships": return .pink
        case "hobbies":       return .purple
        case "health":        return .red
        case "fitness":       return .green
        default:              return .teal
        }
    }

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Research & Background", systemImage: "book.closed.fill")
                .font(.subheadline).bold()

            scienceItem("HKStateOfMind (iOS 18 / watchOS 11)", detail: "Apple's newest HealthKit type. Captures valence (hedonic tone), emotional labels, and life-area associations. Logs via Health app or Apple Watch prompts.")
            scienceItem("Valence", detail: "Hedonic valence (-1.0 to +1.0) reflects the subjective pleasantness of an experience. Core dimension in dimensional emotion theory (Russell 1980).")
            scienceItem("Why track emotional state?", detail: "Chronic negative valence is associated with elevated cortisol, suppressed HRV, sleep disruption, and increased inflammation. (Cohen et al. 2016)")
            scienceItem("Daily vs Momentary", detail: "Daily check-ins reflect reflective mood. Momentary logs capture in-the-moment feelings. Research shows both matter — daily mood shapes health behaviors; momentary affect predicts cortisol spikes.")
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

        let stateType = HKObjectType.stateOfMindType()
        do {
            try await healthStore.requestAuthorization(toShare: [], read: [stateType])
        } catch {
            isLoading = false
            return
        }

        let end = Date()
        let start = Calendar.current.date(byAdding: .day, value: -30, to: end) ?? Date(timeIntervalSinceNow: -30 * 86400)
        let pred = HKQuery.predicateForSamples(withStart: start, end: end)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)

        await withCheckedContinuation { (cont: CheckedContinuation<Void, Never>) in
            let query = HKSampleQuery(
                sampleType: HKSampleType.stateOfMindType(),
                predicate: pred,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [sort]
            ) { _, samples, _ in
                let moodEntries: [MoodEntry] = (samples as? [HKStateOfMind] ?? []).map { sample in
                    MoodEntry(
                        date:         sample.startDate,
                        valence:      sample.valence,
                        labels:       sample.labels.map { Self.labelName($0) },
                        associations: sample.associations.map { Self.associationName($0) },
                        kind:         sample.kind == .dailyMood ? "daily" : "momentary"
                    )
                }
                Task { @MainActor in
                    self.entries = moodEntries
                    self.isLoading = false
                    cont.resume()
                }
            }
            healthStore.execute(query)
        }
    }

    // Convert HKStateOfMind.Label enum to display string
    static func labelName(_ label: HKStateOfMind.Label) -> String {
        switch label {
        case .amazed:       return "amazed"
        case .amused:       return "amused"
        case .angry:        return "angry"
        case .anxious:      return "anxious"
        case .calm:         return "calm"
        case .content:      return "content"
        case .discouraged:  return "discouraged"
        case .disgusted:    return "disgusted"
        case .drained:      return "drained"
        case .embarrassed:  return "embarrassed"
        case .excited:      return "excited"
        case .frustrated:   return "frustrated"
        case .grateful:     return "grateful"
        case .guilty:       return "guilty"
        case .hopeful:      return "hopeful"
        case .hopeless:     return "hopeless"
        case .jealous:      return "jealous"
        case .joyful:       return "joyful"
        case .lonely:       return "lonely"
        case .overwhelmed:  return "overwhelmed"
        case .passionate:   return "passionate"
        case .peaceful:     return "peaceful"
        case .proud:        return "proud"
        case .relieved:     return "relieved"
        case .sad:          return "sad"
        case .satisfied:    return "satisfied"
        case .stressed:     return "stressed"
        case .surprised:    return "surprised"
        case .worried:      return "worried"
        default:            return "other"
        }
    }

    static func associationName(_ assoc: HKStateOfMind.Association) -> String {
        switch assoc {
        case .community:      return "community"
        case .currentEvents:  return "currentEvents"
        case .dating:         return "dating"
        case .education:      return "education"
        case .family:         return "family"
        case .fitness:        return "fitness"
        case .friends:        return "friends"
        case .health:         return "health"
        case .hobbies:        return "hobbies"
        case .identity:       return "identity"
        case .money:          return "money"
        case .partner:        return "relationships"
        case .selfCare:       return "selfCare"
        case .spirituality:   return "spirituality"
        case .tasks:          return "tasks"
        case .travel:         return "travel"
        case .work:           return "work"
        case .weather:        return "weather"
        @unknown default:     return "other"
        }
    }
}

// MARK: - Public wrapper

struct StateOfMindView: View {
    var body: some View {
        if #available(iOS 18.0, *) {
            StateOfMindContent()
        } else {
            ContentUnavailableView {
                Label("iOS 18 Required", systemImage: "heart.text.square.fill")
            } description: {
                Text("State of Mind tracking requires iOS 18 or later and is logged via the Health app or Apple Watch.")
            }
        }
    }
}
