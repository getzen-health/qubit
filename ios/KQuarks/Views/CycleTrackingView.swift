import SwiftUI
import Charts
import HealthKit

// MARK: - Models

struct CycleEntry: Identifiable, Codable {
    let id: String
    var startDate: Date
    var endDate: Date?
    var cycleLength: Int?
    var flowIntensity: FlowIntensity?
    var symptoms: [String]
    var notes: String

    enum CodingKeys: String, CodingKey {
        case id, symptoms, notes
        case startDate     = "start_date"
        case endDate       = "end_date"
        case cycleLength   = "cycle_length"
        case flowIntensity = "flow_intensity"
    }

    var duration: Int? {
        guard let end = endDate else { return nil }
        return (Calendar.current.dateComponents([.day], from: startDate, to: end).day ?? 0) + 1
    }

    var isOngoing: Bool { endDate == nil }
}

enum FlowIntensity: String, Codable, CaseIterable {
    case light    = "light"
    case moderate = "moderate"
    case heavy    = "heavy"

    var label: String {
        switch self {
        case .light:    return "Light"
        case .moderate: return "Moderate"
        case .heavy:    return "Heavy"
        }
    }

    var color: Color {
        switch self {
        case .light:    return .pink.opacity(0.7)
        case .moderate: return Color(red: 0.85, green: 0.2, blue: 0.3)
        case .heavy:    return .red
        }
    }

    var icon: String {
        switch self {
        case .light:    return "drop"
        case .moderate: return "drop.fill"
        case .heavy:    return "drop.fill"
        }
    }

    static func from(hkValue: Int) -> FlowIntensity? {
        // HKCategoryValueMenstrualFlow: unspecified=1, light=2, medium=3, heavy=4, none=5
        switch hkValue {
        case 2: return .light
        case 3: return .moderate
        case 4: return .heavy
        default: return nil
        }
    }
}

enum MenstrualPhase: String {
    case menstrual  = "Menstrual"
    case follicular = "Follicular"
    case ovulation  = "Ovulation"
    case luteal     = "Luteal"

    var color: Color {
        switch self {
        case .menstrual:  return .red
        case .follicular: return .orange
        case .ovulation:  return .pink
        case .luteal:     return Color(red: 0.6, green: 0.5, blue: 0.85)
        }
    }

    var icon: String {
        switch self {
        case .menstrual:  return "drop.fill"
        case .follicular: return "leaf.fill"
        case .ovulation:  return "sparkles"
        case .luteal:     return "moon.stars.fill"
        }
    }

    var description: String {
        switch self {
        case .menstrual:  return "Period in progress"
        case .follicular: return "Building up to ovulation"
        case .ovulation:  return "Peak fertility window"
        case .luteal:     return "Post-ovulation phase"
        }
    }
}

private let allCycleSymptoms: [String] = [
    "cramps", "mood_changes", "energy_low", "bloating",
    "headache", "breast_tenderness", "acne", "fatigue",
    "spotting", "back_pain"
]

private func cycleSymptomLabel(_ key: String) -> String {
    switch key {
    case "cramps":            return "Cramps"
    case "mood_changes":      return "Mood Changes"
    case "energy_low":        return "Low Energy"
    case "bloating":          return "Bloating"
    case "headache":          return "Headache"
    case "breast_tenderness": return "Breast Tenderness"
    case "acne":              return "Acne"
    case "fatigue":           return "Fatigue"
    case "spotting":          return "Spotting"
    case "back_pain":         return "Back Pain"
    default:                  return key.replacingOccurrences(of: "_", with: " ").capitalized
    }
}

// MARK: - ViewModel

@Observable
class CycleTrackingViewModel {
    var cycles: [CycleEntry] = []
    var isLoading = true
    var errorMessage: String?

    private let healthStore = HKHealthStore()
    private let supabase = SupabaseService.shared

    // MARK: Computed properties

    var currentPhase: MenstrualPhase? {
        guard let latest = cycles.first else { return nil }
        let today = Calendar.current.startOfDay(for: Date())
        let start = Calendar.current.startOfDay(for: latest.startDate)
        let dayInCycle = (Calendar.current.dateComponents([.day], from: start, to: today).day ?? 0)
        let periodDur = latest.duration ?? 5
        let avgLen = averageCycleLength
        if dayInCycle < periodDur          { return .menstrual }
        let ovDay = avgLen - 14
        if dayInCycle < ovDay - 1          { return .follicular }
        if dayInCycle <= ovDay + 1         { return .ovulation }
        return .luteal
    }

    var averageCycleLength: Int {
        let lengths = cycles.compactMap(\.cycleLength)
        guard !lengths.isEmpty else { return 28 }
        return lengths.reduce(0, +) / lengths.count
    }

    var daysUntilNextPeriod: Int? {
        guard let latest = cycles.first else { return nil }
        let today = Calendar.current.startOfDay(for: Date())
        let start = Calendar.current.startOfDay(for: latest.startDate)
        let dayInCycle = Calendar.current.dateComponents([.day], from: start, to: today).day ?? 0
        return max(0, averageCycleLength - dayInCycle)
    }

    var nextPeriodDate: Date? {
        guard let days = daysUntilNextPeriod else { return nil }
        return Calendar.current.date(byAdding: .day, value: days, to: Date())
    }

    var currentPeriodDays: Int? {
        guard let latest = cycles.first, latest.isOngoing else { return nil }
        let today = Calendar.current.startOfDay(for: Date())
        let start = Calendar.current.startOfDay(for: latest.startDate)
        return (Calendar.current.dateComponents([.day], from: start, to: today).day ?? 0) + 1
    }

    // MARK: - Load

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        await requestHealthKitPermission()

        struct Row: Decodable {
            let id: String
            let start_date: String
            let end_date: String?
            let cycle_length: Int?
            let flow_intensity: String?
            let symptoms: [String]?
            let notes: String?
        }

        do {
            guard let userId = try? await supabase.client.auth.session.user.id else { return }
            let rows: [Row] = try await supabase.client
                .from("menstrual_cycles")
                .select()
                .eq("user_id", value: userId.uuidString)
                .order("start_date", ascending: false)
                .limit(12)
                .execute()
                .value

            let df = ISO8601DateFormatter()
            df.formatOptions = [.withFullDate]

            var loaded: [CycleEntry] = rows.compactMap { row in
                guard let start = df.date(from: row.start_date) else { return nil }
                return CycleEntry(
                    id: row.id,
                    startDate: start,
                    endDate: row.end_date.flatMap { df.date(from: $0) },
                    cycleLength: row.cycle_length,
                    flowIntensity: row.flow_intensity.flatMap { FlowIntensity(rawValue: $0) },
                    symptoms: row.symptoms ?? [],
                    notes: row.notes ?? ""
                )
            }

            let hkEntries = await fetchFromHealthKit()
            mergeHealthKitEntries(hkEntries, into: &loaded)
            cycles = loaded
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - Log Period Start

    func logPeriodStart() async {
        let today = Calendar.current.startOfDay(for: Date())
        struct Insert: Encodable {
            let user_id: String
            let start_date: String
            let flow_intensity: String
            let symptoms: [String]
            let notes: String
        }
        do {
            guard let userId = try? await supabase.client.auth.session.user.id else { return }
            let df = ISO8601DateFormatter()
            df.formatOptions = [.withFullDate]
            try await supabase.client
                .from("menstrual_cycles")
                .upsert(Insert(
                    user_id: userId.uuidString,
                    start_date: df.string(from: today),
                    flow_intensity: FlowIntensity.moderate.rawValue,
                    symptoms: [],
                    notes: ""
                ), onConflict: "user_id,start_date")
                .execute()
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - Log Period End

    func logPeriodEnd() async {
        guard let latest = cycles.first, latest.isOngoing else { return }
        let today = Calendar.current.startOfDay(for: Date())
        let prevLength = cycles.count > 1
            ? Calendar.current.dateComponents([.day], from: cycles[1].startDate, to: latest.startDate).day
            : nil
        struct Update: Encodable {
            let end_date: String
            let cycle_length: Int
        }
        do {
            let df = ISO8601DateFormatter()
            df.formatOptions = [.withFullDate]
            let days = (Calendar.current.dateComponents([.day], from: latest.startDate, to: today).day ?? 4) + 1
            try await supabase.client
                .from("menstrual_cycles")
                .update(Update(end_date: df.string(from: today), cycle_length: prevLength ?? days))
                .eq("id", value: latest.id)
                .execute()
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - Save cycle edits

    func saveCycle(_ cycle: CycleEntry) async {
        struct Payload: Encodable {
            let start_date: String
            let end_date: String?
            let cycle_length: Int?
            let flow_intensity: String?
            let symptoms: [String]
            let notes: String
        }
        do {
            let df = ISO8601DateFormatter()
            df.formatOptions = [.withFullDate]
            try await supabase.client
                .from("menstrual_cycles")
                .update(Payload(
                    start_date: df.string(from: cycle.startDate),
                    end_date: cycle.endDate.map { df.string(from: $0) },
                    cycle_length: cycle.cycleLength,
                    flow_intensity: cycle.flowIntensity?.rawValue,
                    symptoms: cycle.symptoms,
                    notes: cycle.notes
                ))
                .eq("id", value: cycle.id)
                .execute()
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - HealthKit

    func requestHealthKitPermission() async {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        let t = HKCategoryType(.menstrualFlow)
        _ = try? await healthStore.requestAuthorization(toShare: [t], read: [t])
    }

    func fetchFromHealthKit() async -> [(start: Date, end: Date?, flow: FlowIntensity?)] {
        guard HKHealthStore.isHealthDataAvailable() else { return [] }
        let catType = HKCategoryType(.menstrualFlow)
        let sixMonthsAgo = Calendar.current.date(byAdding: .month, value: -6, to: Date()) ?? Date()
        let pred = HKQuery.predicateForSamples(withStart: sixMonthsAgo, end: Date())
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

        let samples: [HKCategorySample] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: catType, predicate: pred,
                                  limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, s, _ in
                cont.resume(returning: (s as? [HKCategorySample]) ?? [])
            }
            healthStore.execute(q)
        }

        // Group by calendar day to deduplicate multiple samples per day
        var dayMap: [Date: (end: Date, flow: Int?)] = [:]
        for s in samples {
            let day = Calendar.current.startOfDay(for: s.startDate)
            let existing = dayMap[day]
            let latestEnd = existing.map { max($0.end, s.endDate) } ?? s.endDate
            let flow = s.value != 5 ? s.value : nil
            dayMap[day] = (end: latestEnd, flow: flow ?? existing?.flow)
        }

        return dayMap.map { (day, val) in
            (start: day, end: val.end, flow: val.flow.flatMap { FlowIntensity.from(hkValue: $0) })
        }.sorted { $0.start > $1.start }
    }

    private func mergeHealthKitEntries(
        _ hkEntries: [(start: Date, end: Date?, flow: FlowIntensity?)],
        into cycles: inout [CycleEntry]
    ) {
        let existingStarts = Set(cycles.map { Calendar.current.startOfDay(for: $0.startDate) })
        for entry in hkEntries {
            let day = Calendar.current.startOfDay(for: entry.start)
            guard !existingStarts.contains(day) else { continue }
            cycles.append(CycleEntry(
                id: "hk-\(Int(day.timeIntervalSince1970))",
                startDate: entry.start,
                endDate: entry.end,
                cycleLength: nil,
                flowIntensity: entry.flow,
                symptoms: [],
                notes: ""
            ))
        }
        cycles.sort { $0.startDate > $1.startDate }
    }
}

// MARK: - Main View

struct CycleTrackingView: View {
    @State private var vm = CycleTrackingViewModel()
    @State private var editingCycle: CycleEntry?
    @State private var showingEdit = false

    var body: some View {
        NavigationStack {
            Group {
                if vm.isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if vm.cycles.isEmpty {
                    ContentUnavailableView(
                        "No Cycle Data",
                        systemImage: "calendar.badge.clock",
                        description: Text("Log your first period or sync with Apple Health to get started.")
                    )
                } else {
                    cycleList
                }
            }
            .navigationTitle("Menstrual Cycle")
            .toolbarTitleDisplayMode(.inline)
            .task { await vm.load() }
            .refreshable { await vm.load() }
            .sheet(isPresented: $showingEdit) {
                if let cycle = editingCycle {
                    CycleEditSheet(cycle: cycle) { updated in
                        Task { await vm.saveCycle(updated) }
                    }
                }
            }
            .preferredColorScheme(.dark)
            .toolbarColorScheme(.dark, for: .navigationBar)
        }
    }

    private var cycleList: some View {
        ZStack {
            PremiumBackgroundView()
            ScrollView(.vertical, showsIndicators: false) {
                VStack(spacing: 20) {
                    if let phase = vm.currentPhase {
                        CyclePredictionCard(
                            phase: phase,
                            daysUntilNext: vm.daysUntilNextPeriod ?? 0,
                            nextDate: vm.nextPeriodDate,
                            avgLength: vm.averageCycleLength
                        )
                    }

                    VStack(alignment: .leading, spacing: 10) {
                        PremiumSectionHeader(title: "QUICK LOG", icon: "plus.circle.fill", tint: .pink)
                        CycleQuickLogSection(
                            currentPeriodDays: vm.currentPeriodDays,
                            hasOngoing: vm.cycles.first?.isOngoing == true,
                            onLogStart: {
                                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                                Task { await vm.logPeriodStart() }
                            },
                            onLogEnd: {
                                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                                Task { await vm.logPeriodEnd() }
                            }
                        )
                        .padding(16)
                        .premiumCard(cornerRadius: 18, tint: .pink, tintOpacity: 0.02)
                    }

                    VStack(alignment: .leading, spacing: 10) {
                        PremiumSectionHeader(title: "RECENT CYCLES", icon: "calendar", tint: .purple)
                        VStack(spacing: 0) {
                            ForEach(Array(vm.cycles.prefix(6).enumerated()), id: \.element.id) { index, cycle in
                                CycleRowView(cycle: cycle)
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 4)
                                    .contentShape(Rectangle())
                                    .onTapGesture {
                                        guard !cycle.id.hasPrefix("hk-") else { return }
                                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                        editingCycle = cycle
                                        showingEdit = true
                                    }
                                if index < vm.cycles.prefix(6).count - 1 {
                                    Color.premiumDivider.frame(height: 0.5).padding(.horizontal, 16)
                                }
                            }
                        }
                        .premiumCard(cornerRadius: 18, tint: .purple, tintOpacity: 0.02)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 100)
            }
        }
        .animation(.easeInOut(duration: 0.25), value: vm.cycles.map(\.id))
    }
}

// MARK: - Prediction Card

struct CyclePredictionCard: View {
    let phase: MenstrualPhase
    let daysUntilNext: Int
    let nextDate: Date?
    let avgLength: Int

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(phase.color.opacity(0.15))
                        .frame(width: 52, height: 52)
                    Image(systemName: phase.icon)
                        .font(.title2)
                        .foregroundStyle(phase.color)
                }
                VStack(alignment: .leading, spacing: 3) {
                    Text(phase.rawValue + " Phase")
                        .font(.headline)
                    Text(phase.description)
                        .font(.subheadline)
                        .foregroundStyle(.white.opacity(0.4))
                }
                Spacer()
            }
            .padding()
            .background(phase.color.opacity(0.05))

            Color.premiumDivider.frame(height: 0.5)

            HStack(spacing: 0) {
                CyclePhaseStat(
                    label: "Next Period",
                    value: daysUntilNext == 0 ? "Today" : "in \(daysUntilNext)d",
                    color: phase.color
                )
                Color.premiumDivider.frame(width: 0.5, height: 44)
                CyclePhaseStat(
                    label: "Expected",
                    value: nextDate.map { $0.formatted(.dateTime.month(.abbreviated).day()) } ?? "—",
                    color: .secondary
                )
                Color.premiumDivider.frame(width: 0.5, height: 44)
                CyclePhaseStat(
                    label: "Avg Cycle",
                    value: "\(avgLength) days",
                    color: .secondary
                )
            }
            .padding(.vertical, 4)
        }
        .premiumCard(cornerRadius: 14, tint: phase.color, tintOpacity: 0.03)
    }
}

struct CyclePhaseStat: View {
    let label: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: 3) {
            Text(value)
                .font(.subheadline.bold().monospacedDigit())
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.white.opacity(0.4))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
    }
}

// MARK: - Quick Log Section

struct CycleQuickLogSection: View {
    let currentPeriodDays: Int?
    let hasOngoing: Bool
    let onLogStart: () -> Void
    let onLogEnd: () -> Void

    var body: some View {
        VStack(spacing: 12) {
            if let days = currentPeriodDays {
                HStack(spacing: 8) {
                    Image(systemName: "drop.fill")
                        .foregroundStyle(.red)
                    Text("Current Period: Day \(days)")
                        .font(.subheadline.bold())
                        .foregroundStyle(.red)
                    Spacer()
                }
                .padding(.horizontal, 4)
            }

            HStack(spacing: 12) {
                Button(action: onLogStart) {
                    Label("Log Period Start", systemImage: "plus.circle.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(.red)
                .disabled(hasOngoing)

                if hasOngoing {
                    Button(action: onLogEnd) {
                        Label("Log Period End", systemImage: "checkmark.circle.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.pink)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Cycle Row

struct CycleRowView: View {
    let cycle: CycleEntry

    var body: some View {
        HStack(spacing: 14) {
            VStack(spacing: 2) {
                Text(cycle.startDate.formatted(.dateTime.month(.abbreviated).day()))
                    .font(.caption2.bold())
                    .foregroundStyle(.white.opacity(0.4))
                Text(cycle.startDate.formatted(.dateTime.year()))
                    .font(.caption2)
                    .foregroundStyle(.white.opacity(0.4))
            }
            .frame(width: 44)

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    if cycle.isOngoing {
                        Text("Ongoing")
                            .font(.subheadline.bold())
                            .foregroundStyle(.red)
                        Text("· Day \((Calendar.current.dateComponents([.day], from: cycle.startDate, to: Date()).day ?? 0) + 1)")
                            .font(.caption)
                            .foregroundStyle(.white.opacity(0.4))
                    } else if let dur = cycle.duration {
                        Text("\(dur) day period")
                            .font(.subheadline.bold())
                    }
                    Spacer()
                    if let flow = cycle.flowIntensity {
                        cycleFlowBadge(flow)
                    }
                    if cycle.id.hasPrefix("hk-") {
                        Image(systemName: "heart.fill")
                            .font(.caption2)
                            .foregroundStyle(.pink.opacity(0.6))
                    }
                }

                if !cycle.symptoms.isEmpty {
                    Text(cycle.symptoms.prefix(3).map { cycleSymptomLabel($0) }.joined(separator: " · "))
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.4))
                        .lineLimit(1)
                }
            }

            if !cycle.id.hasPrefix("hk-") {
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.3))
            }
        }
        .padding(.vertical, 4)
    }

    private func cycleFlowBadge(_ flow: FlowIntensity) -> some View {
        HStack(spacing: 3) {
            Image(systemName: flow.icon)
                .font(.caption2)
            Text(flow.label)
                .font(.caption2.bold())
        }
        .foregroundStyle(flow.color)
        .padding(.horizontal, 7)
        .padding(.vertical, 3)
        .background(flow.color.opacity(0.12))
        .clipShape(Capsule())
    }
}

// MARK: - Edit Sheet

struct CycleEditSheet: View {
    @Environment(\.dismiss) private var dismiss

    @State private var cycle: CycleEntry
    @State private var hasEndDate: Bool
    private let onSave: (CycleEntry) -> Void

    init(cycle: CycleEntry, onSave: @escaping (CycleEntry) -> Void) {
        _cycle = State(initialValue: cycle)
        _hasEndDate = State(initialValue: cycle.endDate != nil)
        self.onSave = onSave
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Dates") {
                    DatePicker("Period Start", selection: $cycle.startDate, displayedComponents: .date)
                    Toggle("Period Ended", isOn: $hasEndDate)
                    if hasEndDate {
                        DatePicker(
                            "Period End",
                            selection: Binding(
                                get: { cycle.endDate ?? cycle.startDate },
                                set: { cycle.endDate = $0 }
                            ),
                            in: cycle.startDate...,
                            displayedComponents: .date
                        )
                    }
                }

                Section("Flow Intensity") {
                    Picker("Intensity", selection: $cycle.flowIntensity) {
                        Text("Not set").tag(FlowIntensity?.none)
                        ForEach(FlowIntensity.allCases, id: \.self) { intensity in
                            HStack {
                                Image(systemName: intensity.icon).foregroundStyle(intensity.color)
                                Text(intensity.label)
                            }
                            .tag(FlowIntensity?.some(intensity))
                        }
                    }
                    .pickerStyle(.inline)
                    .labelsHidden()
                }

                Section("Symptoms") {
                    ForEach(allCycleSymptoms, id: \.self) { sym in
                        Toggle(cycleSymptomLabel(sym), isOn: Binding(
                            get: { cycle.symptoms.contains(sym) },
                            set: { on in
                                if on { if !cycle.symptoms.contains(sym) { cycle.symptoms.append(sym) } }
                                else  { cycle.symptoms.removeAll { $0 == sym } }
                            }
                        ))
                    }
                }

                Section("Notes") {
                    TextField("Add notes…", text: $cycle.notes, axis: .vertical)
                        .lineLimit(3...6)
                }
            }
            .navigationTitle("Edit Cycle")
            .toolbarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        if !hasEndDate { cycle.endDate = nil }
                        UINotificationFeedbackGenerator().notificationOccurred(.success)
                        onSave(cycle)
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
        }
    }
}

#Preview {
    CycleTrackingView()
}
