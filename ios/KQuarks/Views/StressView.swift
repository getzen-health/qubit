import SwiftUI
import Charts

// MARK: - Models

struct StressLog: Codable, Identifiable {
    let id: UUID
    let loggedAt: Date
    let stressLevel: Int
    let source: String        // "manual" or "hrv_derived"
    let hrvInput: Double?
    let notes: String?
    let contextTags: [String]
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case loggedAt = "logged_at"
        case stressLevel = "stress_level"
        case source
        case hrvInput = "hrv_input"
        case notes
        case contextTags = "context_tags"
        case createdAt = "created_at"
    }
}

private struct StressLogInsert: Encodable {
    let userId: UUID
    let loggedAt: String
    let stressLevel: Int
    let source: String
    let hrvInput: Double?
    let notes: String?
    let contextTags: [String]

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case loggedAt = "logged_at"
        case stressLevel = "stress_level"
        case source
        case hrvInput = "hrv_input"
        case notes
        case contextTags = "context_tags"
    }
}

// MARK: - ViewModel

@Observable
class StressViewModel {
    var stressLogs: [StressLog] = []
    var dailySummaries: [DailySummary] = []
    var isLoading = true
    var errorMessage: String?

    private let supabase = SupabaseService.shared

    /// HRV → stress level: low HRV = high stress (inverse, range 20–200 ms → 10–1)
    static func hrvToStressLevel(_ hrv: Double) -> Int {
        max(1, min(10, Int(round((200.0 - hrv) / 18.0))))
    }

    var todayManualLog: StressLog? {
        stressLogs.first { Calendar.current.isDateInToday($0.loggedAt) && $0.source == "manual" }
    }

    var todayHRVSummary: DailySummary? {
        dailySummaries.first { Calendar.current.isDateInToday($0.date) }
    }

    var todayHRVDerivedStress: Int? {
        guard let hrv = todayHRVSummary?.avgHrv else { return nil }
        return Self.hrvToStressLevel(hrv)
    }

    var recentLogs: [StressLog] {
        let cutoff = Calendar.current.date(byAdding: .day, value: -14, to: Date()) ?? Date()
        return stressLogs.filter { $0.loggedAt >= cutoff }.sorted { $0.loggedAt > $1.loggedAt }
    }

    var hasAnyData: Bool {
        !stressLogs.isEmpty || dailySummaries.contains { $0.avgHrv != nil }
    }

    func loadData(days: Int = 30) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        guard supabase.currentSession != nil else {
            errorMessage = "Not signed in"
            return
        }

        let since = Calendar.current.date(byAdding: .day, value: -days, to: Date()) ?? Date()
        let sinceStr = since.ISO8601Format()

        do {
            async let logsTask: [StressLog] = supabase.client
                .from("stress_logs")
                .select()
                .gte("logged_at", value: sinceStr)
                .order("logged_at", ascending: false)
                .execute()
                .value

            async let summariesTask: [DailySummary] = supabase.client
                .from("daily_summaries")
                .select()
                .gte("date", value: sinceStr)
                .order("date", ascending: false)
                .execute()
                .value

            let (logs, summaries) = try await (logsTask, summariesTask)
            stressLogs = logs
            dailySummaries = summaries
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func insertLog(stressLevel: Int, notes: String?, contextTags: [String]) async {
        guard let userId = supabase.currentSession?.user.id else { return }

        let insert = StressLogInsert(
            userId: userId,
            loggedAt: ISO8601DateFormatter().string(from: Date()),
            stressLevel: stressLevel,
            source: "manual",
            hrvInput: nil,
            notes: notes?.isEmpty == true ? nil : notes,
            contextTags: contextTags
        )

        do {
            let inserted: [StressLog] = try await supabase.client
                .from("stress_logs")
                .insert(insert)
                .select()
                .execute()
                .value
            if let newLog = inserted.first {
                stressLogs.insert(newLog, at: 0)
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func deleteLog(_ log: StressLog) async {
        do {
            try await supabase.client
                .from("stress_logs")
                .delete()
                .eq("id", value: log.id.uuidString)
                .execute()
            stressLogs.removeAll { $0.id == log.id }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

// MARK: - Stress Color & Label Helpers

extension Int {
    var stressColor: Color {
        switch self {
        case 1...3: return Color(red: 0.063, green: 0.725, blue: 0.506) // #10b981
        case 4...6: return Color(red: 0.961, green: 0.620, blue: 0.043) // #f59e0b
        default:    return Color(red: 0.937, green: 0.267, blue: 0.267) // #ef4444
        }
    }

    var stressLabel: String {
        switch self {
        case 1...3: return "Low"
        case 4...6: return "Moderate"
        default:    return "High"
        }
    }
}

// MARK: - Main View

struct StressView: View {
    @State private var viewModel = StressViewModel()
    @State private var trendDays = 7
    @State private var showLogSheet = false
    @State private var logToDelete: StressLog?
    @State private var showDeleteConfirm = false

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if !viewModel.hasAnyData {
                    ContentUnavailableView(
                        "No Stress Data",
                        systemImage: "brain.head.profile",
                        description: Text("Log your stress levels or sync HRV data to start tracking your patterns.")
                    )
                } else {
                    mainContent
                }
            }
            .navigationTitle("Stress & Cortisol")
            .toolbarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                        showLogSheet = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                    }
                }
            }
            .task { await viewModel.loadData(days: 30) }
            .refreshable { await viewModel.loadData(days: trendDays == 7 ? 30 : 30) }
            .sheet(isPresented: $showLogSheet) {
                QuickLogSheet { level, notes, tags in
                    await viewModel.insertLog(stressLevel: level, notes: notes, contextTags: tags)
                }
            }
            .alert("Error", isPresented: .init(
                get: { viewModel.errorMessage != nil },
                set: { if !$0 { viewModel.errorMessage = nil } }
            )) {
                Button("OK") { viewModel.errorMessage = nil }
            } message: {
                Text(viewModel.errorMessage ?? "")
            }
        }
    }

    @ViewBuilder
    private var mainContent: some View {
        List {
            Section {
                TodayStressCard(
                    manualLog: viewModel.todayManualLog,
                    hrvDerivedStress: viewModel.todayHRVDerivedStress,
                    hrv: viewModel.todayHRVSummary?.avgHrv,
                    onLogTap: { showLogSheet = true }
                )
            }

            Section {
                StressTrendChart(
                    logs: viewModel.stressLogs,
                    summaries: viewModel.dailySummaries,
                    days: trendDays
                )
                Picker("Range", selection: $trendDays) {
                    Text("7 Days").tag(7)
                    Text("30 Days").tag(30)
                }
                .pickerStyle(.segmented)
                .padding(.vertical, 4)
            }

            if !viewModel.recentLogs.isEmpty {
                Section("Recent (14 days)") {
                    ForEach(viewModel.recentLogs) { log in
                        StressLogRow(log: log)
                            .swipeActions(edge: .trailing) {
                                Button(role: .destructive) {
                                    logToDelete = log
                                    showDeleteConfirm = true
                                } label: {
                                    Label("Delete", systemImage: "trash")
                                }
                            }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .confirmationDialog(
            "Delete this stress log?",
            isPresented: $showDeleteConfirm,
            titleVisibility: .visible
        ) {
            Button("Delete", role: .destructive) {
                if let log = logToDelete {
                    Task { await viewModel.deleteLog(log) }
                }
            }
        }
    }
}

// MARK: - Today's Stress Card

struct TodayStressCard: View {
    let manualLog: StressLog?
    let hrvDerivedStress: Int?
    let hrv: Double?
    let onLogTap: () -> Void

    private var displayStress: Int? { manualLog?.stressLevel ?? hrvDerivedStress }

    var body: some View {
        VStack(spacing: 16) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Today")
                        .font(.headline)
                    if let log = manualLog {
                        Text("Updated \(log.loggedAt, style: .relative) ago")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    } else if hrvDerivedStress != nil {
                        Text("From HRV data")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    } else {
                        Text("No data yet")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                Spacer()
                Button {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    onLogTap()
                } label: {
                    Image(systemName: "pencil.circle")
                        .font(.title3)
                        .foregroundStyle(.secondary)
                }
            }

            HStack(spacing: 24) {
                StressGauge(level: displayStress)

                VStack(alignment: .leading, spacing: 10) {
                    if let log = manualLog {
                        StressSourceRow(
                            icon: "hand.tap",
                            label: "Manual",
                            value: "\(log.stressLevel)/10",
                            color: log.stressLevel.stressColor
                        )
                    }
                    if let hrv = hrv, let derived = hrvDerivedStress {
                        StressSourceRow(
                            icon: "waveform.path.ecg",
                            label: "HRV \(Int(hrv)) ms",
                            value: "\(derived)/10",
                            color: derived.stressColor
                        )
                    }
                    if manualLog == nil && hrvDerivedStress == nil {
                        Text("Tap + to log your\nstress level now")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            if let tags = manualLog?.contextTags, !tags.isEmpty {
                StressTagsFlow(tags: tags)
            }
        }
        .padding(.vertical, 8)
    }
}

// MARK: - Circular Gauge

struct StressGauge: View {
    let level: Int?

    private let gradient = AngularGradient(
        colors: [
            Color(red: 0.063, green: 0.725, blue: 0.506),
            Color(red: 0.961, green: 0.620, blue: 0.043),
            Color(red: 0.937, green: 0.267, blue: 0.267)
        ],
        center: .center
    )

    var body: some View {
        ZStack {
            Circle()
                .stroke(Color(.systemGray5), lineWidth: 14)
                .frame(width: 120, height: 120)

            if let level = level {
                Circle()
                    .trim(from: 0, to: CGFloat(level) / 10.0)
                    .stroke(gradient, style: StrokeStyle(lineWidth: 14, lineCap: .round))
                    .frame(width: 120, height: 120)
                    .rotationEffect(.degrees(-90))
                    .animation(.spring(duration: 0.8), value: level)

                VStack(spacing: 1) {
                    Text("\(level)")
                        .font(.system(size: 38, weight: .bold, design: .rounded))
                        .foregroundStyle(level.stressColor)
                    Text(level.stressLabel)
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(level.stressColor)
                }
            } else {
                VStack(spacing: 2) {
                    Text("—")
                        .font(.system(size: 38, weight: .bold, design: .rounded))
                        .foregroundStyle(.secondary)
                    Text("No Data")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }
}

// MARK: - Source Row

struct StressSourceRow: View {
    let icon: String
    let label: String
    let value: String
    let color: Color

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundStyle(color)
                .frame(width: 18)
            VStack(alignment: .leading, spacing: 1) {
                Text(label)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                Text(value)
                    .font(.subheadline.bold().monospacedDigit())
                    .foregroundStyle(color)
            }
        }
    }
}

// MARK: - Tags Flow

struct StressTagsFlow: View {
    let tags: [String]

    var body: some View {
        LazyVGrid(
            columns: [GridItem(.adaptive(minimum: 80))],
            alignment: .leading,
            spacing: 6
        ) {
            ForEach(tags, id: \.self) { tag in
                Text(tag.capitalized)
                    .font(.caption2)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(Capsule())
                    .foregroundStyle(.secondary)
            }
        }
    }
}

// MARK: - Stress Trend Chart

struct StressTrendChart: View {
    let logs: [StressLog]
    let summaries: [DailySummary]
    let days: Int

    private struct ChartPoint: Identifiable {
        let id = UUID()
        let date: Date
        let value: Double
        let isHRV: Bool
    }

    private var since: Date {
        Calendar.current.date(byAdding: .day, value: -days, to: Date()) ?? Date()
    }

    private var manualPoints: [ChartPoint] {
        logs
            .filter { $0.loggedAt >= since && $0.source == "manual" }
            .map { ChartPoint(date: $0.loggedAt, value: Double($0.stressLevel), isHRV: false) }
    }

    private var hrvPoints: [ChartPoint] {
        summaries
            .filter { $0.date >= since }
            .compactMap { summary -> ChartPoint? in
                guard let hrv = summary.avgHrv else { return nil }
                return ChartPoint(
                    date: summary.date,
                    value: Double(StressViewModel.hrvToStressLevel(hrv)),
                    isHRV: true
                )
            }
            .sorted { $0.date < $1.date }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Stress Trend")
                .font(.headline)

            if manualPoints.isEmpty && hrvPoints.isEmpty {
                Text("No data for this period")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .frame(height: 160, alignment: .center)
                    .frame(maxWidth: .infinity)
            } else {
                Chart {
                    // Stress zone bands
                    RectangleMark(
                        xStart: .value("Start", since),
                        xEnd: .value("End", Date()),
                        yStart: .value("Low", 1),
                        yEnd: .value("Low/Med", 3.5)
                    )
                    .foregroundStyle(Color(red: 0.063, green: 0.725, blue: 0.506).opacity(0.06))

                    RectangleMark(
                        xStart: .value("Start", since),
                        xEnd: .value("End", Date()),
                        yStart: .value("Med", 3.5),
                        yEnd: .value("Med/High", 6.5)
                    )
                    .foregroundStyle(Color(red: 0.961, green: 0.620, blue: 0.043).opacity(0.06))

                    RectangleMark(
                        xStart: .value("Start", since),
                        xEnd: .value("End", Date()),
                        yStart: .value("High", 6.5),
                        yEnd: .value("Max", 10)
                    )
                    .foregroundStyle(Color(red: 0.937, green: 0.267, blue: 0.267).opacity(0.06))

                    // HRV-derived line
                    ForEach(hrvPoints) { point in
                        LineMark(
                            x: .value("Date", point.date),
                            y: .value("Stress", point.value)
                        )
                        .foregroundStyle(Color.blue.opacity(0.7))
                        .interpolationMethod(.catmullRom)

                        PointMark(
                            x: .value("Date", point.date),
                            y: .value("Stress", point.value)
                        )
                        .foregroundStyle(Color.blue.opacity(0.85))
                        .symbolSize(36)
                    }

                    // Manual log dots
                    ForEach(manualPoints) { point in
                        PointMark(
                            x: .value("Date", point.date),
                            y: .value("Stress", point.value)
                        )
                        .foregroundStyle(Int(point.value).stressColor)
                        .symbolSize(72)
                        .symbol(.circle)
                    }
                }
                .chartYScale(domain: 1...max(10, Int(manualPoints.map(\.value).max() ?? 10)))
                .chartYAxis {
                    AxisMarks(values: [1, 3, 5, 7, 10]) { value in
                        AxisGridLine()
                        AxisValueLabel {
                            if let v = value.as(Int.self) { Text("\(v)") }
                        }
                    }
                }
                .chartXAxis {
                    AxisMarks(values: .stride(by: .day, count: days <= 7 ? 1 : 7)) {
                        AxisGridLine()
                        AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                    }
                }
                .frame(height: 160)

                HStack(spacing: 16) {
                    HStack(spacing: 4) {
                        Circle().fill(Color.blue.opacity(0.85)).frame(width: 8, height: 8)
                        Text("HRV-derived").font(.caption2).foregroundStyle(.secondary)
                    }
                    HStack(spacing: 4) {
                        Circle()
                            .fill(Color(red: 0.937, green: 0.267, blue: 0.267))
                            .frame(width: 8, height: 8)
                        Text("Manual log").font(.caption2).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Stress Log Row

struct StressLogRow: View {
    let log: StressLog

    private var sourceIcon: String {
        log.source == "hrv_derived" ? "waveform.path.ecg" : "hand.tap"
    }

    private var sourceLabel: String {
        log.source == "hrv_derived" ? "HRV" : "Manual"
    }

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(log.stressLevel.stressColor.opacity(0.12))
                    .frame(width: 44, height: 44)
                Text("\(log.stressLevel)")
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundStyle(log.stressLevel.stressColor)
            }

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(log.loggedAt, style: .date)
                        .font(.subheadline.weight(.semibold))
                    Spacer()
                    HStack(spacing: 3) {
                        Image(systemName: sourceIcon)
                            .font(.caption2)
                        Text(sourceLabel)
                            .font(.caption2)
                    }
                    .foregroundStyle(.secondary)
                }
                Text(log.loggedAt, style: .time)
                    .font(.caption)
                    .foregroundStyle(.secondary)

                if let notes = log.notes, !notes.isEmpty {
                    Text(notes)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }

                if !log.contextTags.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 4) {
                            ForEach(log.contextTags, id: \.self) { tag in
                                Text(tag.capitalized)
                                    .font(.caption2)
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(Color(.secondarySystemBackground))
                                    .clipShape(Capsule())
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }
            }
        }
        .padding(.vertical, 2)
    }
}

// MARK: - Quick Log Sheet

struct QuickLogSheet: View {
    let onSave: (Int, String?, [String]) async -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var stressLevel: Double = 5
    @State private var notes = ""
    @State private var selectedTags: Set<String> = []
    @State private var isSaving = false

    private let allTags = ["work", "exercise", "sleep", "illness", "caffeine"]
    private let tagEmoji: [String: String] = [
        "work": "💼", "exercise": "🏃", "sleep": "😴", "illness": "🤒", "caffeine": "☕️"
    ]

    private var currentLevel: Int { Int(stressLevel) }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    VStack(spacing: 16) {
                        HStack {
                            Spacer()
                            ZStack {
                                Circle()
                                    .fill(currentLevel.stressColor.opacity(0.12))
                                    .frame(width: 96, height: 96)
                                VStack(spacing: 0) {
                                    Text("\(currentLevel)")
                                        .font(.system(size: 46, weight: .bold, design: .rounded))
                                        .foregroundStyle(currentLevel.stressColor)
                                    Text(currentLevel.stressLabel)
                                        .font(.caption.weight(.semibold))
                                        .foregroundStyle(currentLevel.stressColor)
                                }
                            }
                            Spacer()
                        }

                        VStack(spacing: 4) {
                            Slider(value: $stressLevel, in: 1...10, step: 1) { editing in
                                if !editing {
                                    UIImpactFeedbackGenerator(style: .rigid).impactOccurred()
                                }
                            }
                            .tint(currentLevel.stressColor)
                            .onChange(of: stressLevel) { _, _ in
                                UISelectionFeedbackGenerator().selectionChanged()
                            }
                            HStack {
                                Text("Relaxed")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                                Spacer()
                                Text("Very Stressed")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .padding(.vertical, 8)
                } header: {
                    Text("How stressed are you? (1–10)")
                }

                Section("Context") {
                    LazyVGrid(
                        columns: [GridItem(.adaptive(minimum: 100))],
                        spacing: 10
                    ) {
                        ForEach(allTags, id: \.self) { tag in
                            let isSelected = selectedTags.contains(tag)
                            Button {
                                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                if isSelected {
                                    selectedTags.remove(tag)
                                } else {
                                    selectedTags.insert(tag)
                                }
                            } label: {
                                HStack(spacing: 6) {
                                    Text(tagEmoji[tag] ?? "")
                                    Text(tag.capitalized)
                                        .font(.subheadline)
                                }
                                .padding(.vertical, 8)
                                .frame(maxWidth: .infinity)
                                .background(
                                    isSelected
                                        ? currentLevel.stressColor.opacity(0.12)
                                        : Color(.secondarySystemBackground)
                                )
                                .overlay(
                                    RoundedRectangle(cornerRadius: 10)
                                        .stroke(
                                            isSelected ? currentLevel.stressColor : Color.clear,
                                            lineWidth: 2
                                        )
                                )
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                                .foregroundStyle(isSelected ? currentLevel.stressColor : .primary)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.vertical, 4)
                }

                Section("Notes (optional)") {
                    TextField(
                        "What's contributing to your stress?",
                        text: $notes,
                        axis: .vertical
                    )
                    .lineLimit(3...5)
                }
            }
            .navigationTitle("Log Stress")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        isSaving = true
                        UINotificationFeedbackGenerator().notificationOccurred(.success)
                        Task {
                            await onSave(currentLevel, notes.isEmpty ? nil : notes, Array(selectedTags))
                            dismiss()
                        }
                    }
                    .bold()
                    .disabled(isSaving)
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }
}

#Preview {
    StressView()
}
