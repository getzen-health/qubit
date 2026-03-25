import SwiftUI
import Charts

// MARK: - Data Models

struct WaterLog: Identifiable, Decodable {
    let id: UUID
    let amount_ml: Int
    let logged_at: Date
}

struct DailyWaterTotal: Identifiable {
    let id: Date   // start-of-day date used as stable identity
    let totalMl: Int
}

// MARK: - ViewModel

@Observable
@MainActor
final class WaterTrackingViewModel {
    static let dailyGoalMl: Int = 2500

    var logs: [WaterLog] = []
    var weeklyTotals: [DailyWaterTotal] = []
    var isLoading = false
    var errorMessage: String?
    var customAmountText = ""

    var todayTotal: Int {
        logs.reduce(0) { $0 + $1.amount_ml }
    }

    var progress: Double {
        min(Double(todayTotal) / Double(Self.dailyGoalMl), 1.0)
    }

    var ringColor: Color {
        if progress < 0.5 { return .blue }
        if progress < 0.8 { return .teal }
        return .green
    }

    // MARK: Load

    func loadData() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        guard let userId = SupabaseService.shared.currentSession?.user.id else {
            errorMessage = "Not signed in"
            return
        }

        do {
            async let todayFetch = fetchTodayLogs(userId: userId)
            async let weeklyFetch = fetchWeeklyTotals(userId: userId)
            let (today, weekly) = try await (todayFetch, weeklyFetch)
            logs = today
            weeklyTotals = weekly
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: Logging

    func logWater(ml: Int) async {
        guard let userId = SupabaseService.shared.currentSession?.user.id else {
            errorMessage = "Not signed in"
            return
        }

        struct Payload: Encodable {
            let user_id: String
            let logged_at: String
            let amount_ml: Int
        }

        do {
            try await SupabaseService.shared.client
                .from("water_logs")
                .upsert(Payload(
                    user_id: userId.uuidString,
                    logged_at: ISO8601DateFormatter().string(from: Date()),
                    amount_ml: ml
                ), onConflict: "user_id,logged_at")
                .execute()
            await loadData()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func logCustomAmount() async {
        guard let ml = Int(customAmountText), (1...5000).contains(ml) else {
            errorMessage = "Please enter a valid amount between 1 and 5000 ml"
            return
        }
        customAmountText = ""
        await logWater(ml: ml)
    }

    // MARK: Deletion

    func deleteLog(id: UUID) async {
        logs.removeAll { $0.id == id }
        do {
            try await SupabaseService.shared.client
                .from("water_logs")
                .delete()
                .eq("id", value: id.uuidString)
                .execute()
            if let userId = SupabaseService.shared.currentSession?.user.id {
                weeklyTotals = (try? await fetchWeeklyTotals(userId: userId)) ?? weeklyTotals
            }
        } catch {
            errorMessage = error.localizedDescription
            await loadData()
        }
    }

    // MARK: - Private Fetch Helpers

    private func fetchTodayLogs(userId: UUID) async throws -> [WaterLog] {
        let startOfDay = Calendar.current.startOfDay(for: Date())
        return try await SupabaseService.shared.client
            .from("water_logs")
            .select("id, amount_ml, logged_at")
            .eq("user_id", value: userId.uuidString)
            .gte("logged_at", value: ISO8601DateFormatter().string(from: startOfDay))
            .order("logged_at", ascending: false)
            .execute()
            .value
    }

    private func fetchWeeklyTotals(userId: UUID) async throws -> [DailyWaterTotal] {
        let calendar = Calendar.current
        guard let weekStart = calendar.date(
            byAdding: .day, value: -6, to: calendar.startOfDay(for: Date())
        ) else { return [] }

        struct RawLog: Decodable {
            let amount_ml: Int
            let logged_at: Date
        }

        let rawLogs: [RawLog] = try await SupabaseService.shared.client
            .from("water_logs")
            .select("amount_ml, logged_at")
            .eq("user_id", value: userId.uuidString)
            .gte("logged_at", value: ISO8601DateFormatter().string(from: weekStart))
            .execute()
            .value

        // Seed all 7 days at zero so missing days still appear in the chart
        var totals: [Date: Int] = [:]
        for offset in 0...6 {
            if let day = calendar.date(byAdding: .day, value: offset, to: weekStart) {
                totals[calendar.startOfDay(for: day)] = 0
            }
        }
        for log in rawLogs {
            let day = calendar.startOfDay(for: log.logged_at)
            totals[day, default: 0] += log.amount_ml
        }

        return totals
            .map { DailyWaterTotal(id: $0.key, totalMl: $0.value) }
            .sorted { $0.id < $1.id }
    }
}

// MARK: - Circular Progress Ring

private struct CircularProgressRing: View {
    let progress: Double
    let color: Color
    var lineWidth: CGFloat = 18

    var body: some View {
        ZStack {
            Circle()
                .stroke(Color(.tertiarySystemFill), lineWidth: lineWidth)
            Circle()
                .trim(from: 0, to: progress)
                .stroke(color, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(.easeInOut(duration: 0.8), value: progress)
        }
    }
}

// MARK: - Quick-Add Button

private struct WaterQuickAddButton: View {
    let emoji: String
    let label: String
    let ml: Int
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 5) {
                Text(emoji)
                    .font(.title2)
                Text(label)
                    .font(.caption2.weight(.medium))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                Text("\(ml) ml")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(.blue)
            }
            .frame(width: 76, height: 84)
            .background(Color(.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(Color(.separator).opacity(0.4), lineWidth: 0.5)
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Main View

struct WaterTrackingView: View {
    @State private var viewModel = WaterTrackingViewModel()
    @FocusState private var isCustomAmountFocused: Bool

    private let quickAddOptions: [(emoji: String, label: String, ml: Int)] = [
        ("🥤", "Cup",       150),
        ("🥛", "Glass",     250),
        ("💧", "S. Bottle", 330),
        ("🍶", "L. Bottle", 500),
        ("🏺", "1 Litre",  1000)
    ]

    var body: some View {
        NavigationStack {
            List {
                summarySection
                quickAddSection
                customAmountSection
                todayLogSection
                weeklyChartSection
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Hydration")
            .toolbarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button("Done") { isCustomAmountFocused = false }
                }
            }
            .task { await viewModel.loadData() }
            .refreshable { await viewModel.loadData() }
            .alert(
                "Error",
                isPresented: .init(
                    get: { viewModel.errorMessage != nil },
                    set: { if !$0 { viewModel.errorMessage = nil } }
                )
            ) {
                Button("OK") { viewModel.errorMessage = nil }
            } message: {
                Text(viewModel.errorMessage ?? "")
            }
        }
    }

    // MARK: - Summary Section

    @ViewBuilder
    private var summarySection: some View {
        Section {
            VStack(spacing: 16) {
                ZStack {
                    CircularProgressRing(progress: viewModel.progress, color: viewModel.ringColor)
                        .frame(width: 170, height: 170)

                    VStack(spacing: 4) {
                        Text("\(Int(viewModel.progress * 100))%")
                            .font(.system(size: 40, weight: .bold, design: .rounded))
                            .foregroundStyle(viewModel.ringColor)
                            .contentTransition(.numericText())
                            .animation(.easeInOut(duration: 0.5), value: viewModel.progress)

                        Text("hydrated")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                Text("\(viewModel.todayTotal) / \(WaterTrackingViewModel.dailyGoalMl) ml")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.secondary)

                if viewModel.isLoading {
                    ProgressView()
                        .scaleEffect(0.75)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 20)
        }
        .listRowBackground(Color.clear)
        .listRowInsets(EdgeInsets())
        .listSectionSeparator(.hidden)
    }

    // MARK: - Quick Add Section

    @ViewBuilder
    private var quickAddSection: some View {
        Section("Quick Add") {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(quickAddOptions, id: \.ml) { option in
                        WaterQuickAddButton(
                            emoji: option.emoji,
                            label: option.label,
                            ml: option.ml
                        ) {
                            Task { await viewModel.logWater(ml: option.ml) }
                        }
                    }
                }
                .padding(.vertical, 8)
            }
            .listRowInsets(EdgeInsets(top: 0, leading: 16, bottom: 0, trailing: 16))
            .listRowBackground(Color.clear)
            .listRowSeparator(.hidden)
        }
    }

    // MARK: - Custom Amount Section

    @ViewBuilder
    private var customAmountSection: some View {
        Section("Custom Amount") {
            HStack(spacing: 12) {
                HStack(spacing: 8) {
                    Image(systemName: "drop.fill")
                        .foregroundStyle(.blue)
                        .font(.subheadline)
                    TextField("Amount (1–5000 ml)", text: $viewModel.customAmountText)
                        .keyboardType(.numberPad)
                        .focused($isCustomAmountFocused)
                }

                Button {
                    isCustomAmountFocused = false
                    Task { await viewModel.logCustomAmount() }
                } label: {
                    Text("Log")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 8)
                        .background(viewModel.customAmountText.isEmpty ? Color.gray : Color.blue)
                        .clipShape(Capsule())
                }
                .disabled(viewModel.customAmountText.isEmpty)
                .animation(.easeInOut(duration: 0.15), value: viewModel.customAmountText.isEmpty)
            }
        }
    }

    // MARK: - Today's Log Section

    @ViewBuilder
    private var todayLogSection: some View {
        Section("Today's Log — \(viewModel.todayTotal) ml") {
            if viewModel.logs.isEmpty && !viewModel.isLoading {
                Text("No entries yet — start hydrating! 💧")
                    .foregroundStyle(.secondary)
                    .font(.subheadline)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.vertical, 8)
            } else {
                ForEach(viewModel.logs) { log in
                    logRow(log)
                        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                            Button(role: .destructive) {
                                Task { await viewModel.deleteLog(id: log.id) }
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                }
            }
        }
    }

    private func logRow(_ log: WaterLog) -> some View {
        HStack(spacing: 12) {
            Text(waterIcon(for: log.amount_ml))
                .font(.title3)
                .frame(width: 32)

            VStack(alignment: .leading, spacing: 2) {
                Text("\(log.amount_ml) ml")
                    .font(.subheadline.weight(.medium))
                Text(log.logged_at.formatted(date: .omitted, time: .shortened))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Text("+\(log.amount_ml)")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.blue.opacity(0.8))
        }
    }

    // MARK: - Weekly Chart Section

    @ViewBuilder
    private var weeklyChartSection: some View {
        Section("7-Day History") {
            Chart {
                ForEach(viewModel.weeklyTotals) { day in
                    BarMark(
                        x: .value("Day", day.id, unit: .day),
                        y: .value("ml", day.totalMl)
                    )
                    .foregroundStyle(
                        day.totalMl >= WaterTrackingViewModel.dailyGoalMl
                            ? Color.green.gradient
                            : Color.blue.gradient
                    )
                    .cornerRadius(6)
                }

                RuleMark(y: .value("Goal", WaterTrackingViewModel.dailyGoalMl))
                    .foregroundStyle(.orange)
                    .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [6, 4]))
                    .annotation(position: .top, alignment: .trailing) {
                        Text("Goal")
                            .font(.caption2)
                            .foregroundStyle(.orange)
                            .padding(.trailing, 4)
                    }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day)) { _ in
                    AxisValueLabel(format: .dateTime.weekday(.abbreviated))
                        .font(.caption2)
                }
            }
            .chartYAxis {
                AxisMarks { value in
                    AxisValueLabel {
                        if let ml = value.as(Int.self) {
                            Text(ml >= 1000 ? "\(ml / 1000)L" : "\(ml)")
                                .font(.caption2)
                        }
                    }
                    AxisGridLine()
                }
            }
            .frame(height: 190)
            .padding(.vertical, 8)
        }
    }

    // MARK: - Helpers

    private func waterIcon(for ml: Int) -> String {
        switch ml {
        case ..<200:       return "🥤"
        case 200..<300:    return "🥛"
        case 300..<400:    return "💧"
        case 400..<750:    return "🍶"
        default:           return "🏺"
        }
    }
}
