import SwiftUI
import Charts

// MARK: - Data Models

struct WaterLog: Identifiable, Decodable {
    let id: UUID
    let amount_ml: Int
    let logged_at: Date

    /// Editable within 15 minutes of logging
    var isEditable: Bool {
        Date().timeIntervalSince(logged_at) < 15 * 60
    }
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
    var isLoading = true
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
            // Not signed in — keep local logs, no error shown
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
        // Local-first: update UI immediately
        let newLog = WaterLog(id: UUID(), amount_ml: ml, logged_at: Date())
        logs.append(newLog)
        HapticService.impact(.light)

        // Persist to Supabase if signed in
        if let userId = SupabaseService.shared.currentSession?.user.id {
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
            } catch {
                print("Warning: Failed to save water to Supabase: \(error)")
            }
        }

        // Write water intake to Apple Health
        do {
            try await HealthKitService.shared.saveWater(milliliters: Double(ml))
        } catch {
            print("Warning: Failed to write water to HealthKit: \(error)")
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

    // MARK: Edit

    func editLog(id: UUID, newMl: Int) async {
        guard (1...5000).contains(newMl) else {
            errorMessage = "Please enter a valid amount between 1 and 5000 ml"
            return
        }
        // Update locally first
        if let idx = logs.firstIndex(where: { $0.id == id }) {
            logs[idx] = WaterLog(id: id, amount_ml: newMl, logged_at: logs[idx].logged_at)
        }
        HapticService.impact(.light)

        // Persist to Supabase
        if SupabaseService.shared.currentSession?.user.id != nil {
            do {
                try await SupabaseService.shared.client
                    .from("water_logs")
                    .update(["amount_ml": newMl])
                    .eq("id", value: id.uuidString)
                    .execute()
            } catch {
                print("Warning: Failed to update water log in Supabase: \(error)")
            }
        }
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

// MARK: - Premium Progress Ring

private struct PremiumProgressRing: View {
    let progress: Double
    let color: Color
    var lineWidth: CGFloat = 16
    var size: CGFloat = 180

    var body: some View {
        ZStack {
            // Background track
            Circle()
                .stroke(Color.white.opacity(0.06), lineWidth: lineWidth)

            // Gradient progress arc
            Circle()
                .trim(from: 0, to: progress)
                .stroke(
                    LinearGradient(
                        colors: [color, color.opacity(0.5)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .animation(.spring(response: 0.8, dampingFraction: 0.7), value: progress)

            // Glow behind ring
            Circle()
                .trim(from: 0, to: progress)
                .stroke(color.opacity(0.4), lineWidth: lineWidth + 8)
                .rotationEffect(.degrees(-90))
                .blur(radius: 12)
                .animation(.spring(response: 0.8, dampingFraction: 0.7), value: progress)
        }
        .frame(width: size, height: size)
    }
}

// MARK: - Premium Quick-Add Button

private struct WaterQuickAddButton: View {
    let emoji: String
    let label: String
    let ml: Int
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 6) {
                Text(emoji)
                    .font(.title2)
                Text(label)
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(.white.opacity(0.5))
                    .lineLimit(1)
                Text("\(ml) ml")
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .foregroundStyle(.cyan)
            }
            .frame(width: 78, height: 88)
            .background(Color.cardSurface)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(
                        LinearGradient(
                            colors: [Color.white.opacity(0.1), Color.white.opacity(0.03)],
                            startPoint: .top,
                            endPoint: .bottom
                        ),
                        lineWidth: 0.5
                    )
            )
            .shadow(color: .black.opacity(0.3), radius: 8, y: 4)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Main View

struct WaterTrackingView: View {
    @State private var viewModel = WaterTrackingViewModel()
    @FocusState private var isCustomAmountFocused: Bool
    @State private var editingLog: WaterLog?
    @State private var editAmountText = ""

    private let quickAddOptions: [(emoji: String, label: String, ml: Int)] = [
        ("🥤", "Cup",       150),
        ("🥛", "Glass",     250),
        ("💧", "S. Bottle", 330),
        ("🍶", "L. Bottle", 500),
        ("🏺", "1 Litre",  1000)
    ]

    var body: some View {
        NavigationStack {
            ZStack {
                PremiumBackgroundView()

                ScrollView(.vertical, showsIndicators: false) {
                    VStack(spacing: 20) {
                        summarySection
                        quickAddSection
                        customAmountSection
                        todayLogSection
                        weeklyChartSection
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 100)
                }
            }
            .navigationTitle("Hydration")
            .toolbarTitleDisplayMode(.inline)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button("Done") { isCustomAmountFocused = false }
                }
            }
            .task { await viewModel.loadData() }
            .alert("Edit Water Entry", isPresented: .init(
                get: { editingLog != nil },
                set: { if !$0 { editingLog = nil } }
            )) {
                TextField("Amount in ml", text: $editAmountText)
                    .keyboardType(.numberPad)
                Button("Save") {
                    if let log = editingLog, let ml = Int(editAmountText) {
                        Task { await viewModel.editLog(id: log.id, newMl: ml) }
                    }
                    editingLog = nil
                }
                Button("Cancel", role: .cancel) { editingLog = nil }
            } message: {
                if let log = editingLog {
                    Text("Current: \(log.amount_ml) ml")
                }
            }
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
        .preferredColorScheme(.dark)
    }

    // MARK: - Summary Section

    @ViewBuilder
    private var summarySection: some View {
        VStack(spacing: 16) {
            ZStack {
                PremiumProgressRing(progress: viewModel.progress, color: viewModel.ringColor)

                VStack(spacing: 4) {
                    Text("\(Int(viewModel.progress * 100))%")
                        .font(.system(size: 44, weight: .bold, design: .rounded))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [viewModel.ringColor, viewModel.ringColor.opacity(0.6)],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .contentTransition(.numericText())
                        .animation(.spring(response: 0.5, dampingFraction: 0.7), value: viewModel.progress)

                    Text("hydrated")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(.white.opacity(0.4))
                        .textCase(.uppercase)
                        .tracking(1.5)
                }
            }

            Text("\(viewModel.todayTotal) / \(WaterTrackingViewModel.dailyGoalMl) ml")
                .font(.system(size: 15, weight: .semibold, design: .rounded))
                .foregroundStyle(.white.opacity(0.5))

            if viewModel.isLoading {
                ProgressView()
                    .tint(.cyan)
                    .scaleEffect(0.75)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 24)
        .padding(.top, 8)
    }

    // MARK: - Quick Add Section

    @ViewBuilder
    private var quickAddSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionHeader("Quick Add", icon: "plus.circle.fill")

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
                .padding(.horizontal, 2)
                .padding(.vertical, 4)
            }
        }
    }

    // MARK: - Custom Amount Section

    @ViewBuilder
    private var customAmountSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionHeader("Custom Amount", icon: "drop.fill")

            HStack(spacing: 12) {
                HStack(spacing: 8) {
                    Image(systemName: "drop.fill")
                        .foregroundStyle(.cyan.opacity(0.6))
                        .font(.subheadline)
                    TextField("Amount (1–5000 ml)", text: $viewModel.customAmountText)
                        .keyboardType(.numberPad)
                        .focused($isCustomAmountFocused)
                        .foregroundStyle(.white)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 12)
                .background(Color.cardSurface)
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(Color.white.opacity(0.06), lineWidth: 0.5)
                )

                Button {
                    isCustomAmountFocused = false
                    Task { await viewModel.logCustomAmount() }
                } label: {
                    Text("Log")
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 22)
                        .padding(.vertical, 12)
                        .background(
                            LinearGradient(
                                colors: viewModel.customAmountText.isEmpty
                                    ? [Color.gray.opacity(0.3), Color.gray.opacity(0.2)]
                                    : [Color.cyan, Color.cyan.opacity(0.7)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .clipShape(Capsule())
                        .shadow(color: viewModel.customAmountText.isEmpty ? .clear : .cyan.opacity(0.3), radius: 8, y: 4)
                }
                .disabled(viewModel.customAmountText.isEmpty)
                .animation(.spring(response: 0.3, dampingFraction: 0.7), value: viewModel.customAmountText.isEmpty)
            }
        }
    }

    // MARK: - Today's Log Section

    @ViewBuilder
    private var todayLogSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionHeader("Today — \(viewModel.todayTotal) ml", icon: "list.bullet")

            VStack(spacing: 0) {
                if viewModel.logs.isEmpty && !viewModel.isLoading {
                    Text("No entries yet — start hydrating! 💧")
                        .foregroundStyle(.white.opacity(0.35))
                        .font(.system(size: 14, weight: .medium))
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding(.vertical, 24)
                } else {
                    ForEach(Array(viewModel.logs.enumerated()), id: \.element.id) { index, log in
                        let editable = log.isEditable
                        logRow(log, editable: editable)
                            .contentShape(Rectangle())
                            .onTapGesture {
                                if editable {
                                    editAmountText = "\(log.amount_ml)"
                                    editingLog = log
                                }
                            }
                            .contextMenu {
                                if editable {
                                    Button {
                                        editAmountText = "\(log.amount_ml)"
                                        editingLog = log
                                    } label: {
                                        Label("Edit", systemImage: "pencil")
                                    }
                                }
                                Button(role: .destructive) {
                                    Task { await viewModel.deleteLog(id: log.id) }
                                } label: {
                                    Label("Delete", systemImage: "trash")
                                }
                            }

                        if index < viewModel.logs.count - 1 {
                            Color.premiumDivider
                                .frame(height: 0.5)
                                .padding(.leading, 48)
                        }
                    }
                }
            }
            .premiumCard(cornerRadius: 18, tint: .cyan, tintOpacity: 0.02)
        }
    }

    private func logRow(_ log: WaterLog, editable: Bool = false) -> some View {
        HStack(spacing: 12) {
            Text(waterIcon(for: log.amount_ml))
                .font(.title3)
                .frame(width: 32)

            VStack(alignment: .leading, spacing: 3) {
                Text("\(log.amount_ml) ml")
                    .font(.system(size: 15, weight: .semibold, design: .rounded))
                    .foregroundStyle(.white.opacity(0.9))
                Text(log.logged_at.formatted(date: .omitted, time: .shortened))
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(.white.opacity(0.3))
            }

            Spacer()

            if editable {
                Text("edit")
                    .font(.system(size: 9, weight: .semibold))
                    .foregroundStyle(.cyan.opacity(0.6))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(.cyan.opacity(0.08), in: Capsule())
            }

            Text("+\(log.amount_ml)")
                .font(.system(size: 13, weight: .bold, design: .rounded))
                .foregroundStyle(.cyan.opacity(0.7))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }

    // MARK: - Weekly Chart Section

    @ViewBuilder
    private var weeklyChartSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionHeader("7-Day History", icon: "chart.bar.fill")

            VStack {
                Chart {
                    ForEach(viewModel.weeklyTotals) { day in
                        BarMark(
                            x: .value("Day", day.id, unit: .day),
                            y: .value("ml", day.totalMl)
                        )
                        .foregroundStyle(
                            day.totalMl >= WaterTrackingViewModel.dailyGoalMl
                                ? LinearGradient(colors: [.green, .green.opacity(0.6)], startPoint: .top, endPoint: .bottom)
                                : LinearGradient(colors: [.cyan, .cyan.opacity(0.4)], startPoint: .top, endPoint: .bottom)
                        )
                        .cornerRadius(6)
                    }

                    RuleMark(y: .value("Goal", WaterTrackingViewModel.dailyGoalMl))
                        .foregroundStyle(.orange.opacity(0.6))
                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [6, 4]))
                        .annotation(position: .top, alignment: .trailing) {
                            Text("Goal")
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundStyle(.orange.opacity(0.6))
                                .padding(.trailing, 4)
                        }
                }
                .chartXAxis {
                    AxisMarks(values: .stride(by: .day)) { _ in
                        AxisValueLabel(format: .dateTime.weekday(.abbreviated))
                            .font(.system(size: 10, weight: .medium))
                            .foregroundStyle(.white.opacity(0.4))
                    }
                }
                .chartYAxis {
                    AxisMarks { value in
                        AxisValueLabel {
                            if let ml = value.as(Int.self) {
                                Text(ml >= 1000 ? "\(ml / 1000)L" : "\(ml)")
                                    .font(.system(size: 10, weight: .medium))
                                    .foregroundStyle(.white.opacity(0.3))
                            }
                        }
                        AxisGridLine(stroke: StrokeStyle(lineWidth: 0.3))
                            .foregroundStyle(.white.opacity(0.06))
                    }
                }
                .chartPlotStyle { plotArea in
                    plotArea
                        .background(Color.clear)
                }
                .frame(height: 190)
                .padding(.vertical, 12)
                .padding(.horizontal, 4)
            }
            .premiumCard(cornerRadius: 18, tint: .cyan, tintOpacity: 0.02)
        }
    }

    // MARK: - Section Header Helper

    private func sectionHeader(_ title: String, icon: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(.cyan.opacity(0.5))
            Text(title)
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(.white.opacity(0.5))
                .textCase(.uppercase)
                .tracking(0.8)
        }
        .padding(.leading, 4)
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
