import SwiftUI
import Charts

// MARK: - WaterView

struct WaterView: View {
    @State private var todayTotal: Int = 0
    @State private var weekHistory: [(date: String, ml: Int)] = []
    @State private var isLoading = false
    @State private var isLogging = false
    @State private var target: Int = 2500

    private let quickAmounts = [150, 250, 350, 500, 750, 1000]

    var progress: Double {
        target > 0 ? min(Double(todayTotal) / Double(target), 1.0) : 0
    }

    var remaining: Int { max(target - todayTotal, 0) }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Ring progress
                    ringSection

                    // Quick log buttons
                    quickLogSection

                    // Weekly chart
                    if weekHistory.count >= 2 {
                        weeklyChart
                    }
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Hydration")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                NavigationLink(destination: HydrationPatternView()) {
                    Image(systemName: "chart.bar.xaxis")
                }
            }
            .task { await loadData() }
            .refreshable { await loadData() }
        }
    }

    // MARK: Ring section

    private var ringSection: some View {
        VStack(spacing: 16) {
            ZStack {
                Circle()
                    .stroke(Color.blue.opacity(0.15), lineWidth: 16)

                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(
                        progress >= 1 ? Color.green : Color.blue,
                        style: StrokeStyle(lineWidth: 16, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .animation(.spring(duration: 0.5), value: progress)

                VStack(spacing: 4) {
                    Text(todayTotal >= 1000 ? String(format: "%.1fL", Double(todayTotal) / 1000) : "\(todayTotal)ml")
                        .font(.system(size: 34, weight: .bold, design: .rounded))
                        .foregroundStyle(progress >= 1 ? .green : .primary)
                    Text("of \(target >= 1000 ? String(format: "%.1fL", Double(target) / 1000) : "\(target)ml")")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(width: 180, height: 180)
            .padding(.top, 8)

            if progress >= 1 {
                Label("Daily goal reached! 🎉", systemImage: "checkmark.circle.fill")
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(.green)
            } else {
                Text("\(remaining >= 1000 ? String(format: "%.1fL", Double(remaining) / 1000) : "\(remaining)ml") to go")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: Quick log

    private var quickLogSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Log")
                .font(.headline)

            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible()),
                GridItem(.flexible()),
            ], spacing: 10) {
                ForEach(quickAmounts, id: \.self) { ml in
                    Button {
                        Task { await addWater(ml) }
                    } label: {
                        VStack(spacing: 4) {
                            Text("💧")
                                .font(.title3)
                            Text(ml >= 1000 ? "\(ml / 1000)L" : "\(ml)ml")
                                .font(.subheadline.bold())
                                .foregroundStyle(.blue)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.blue.opacity(0.08))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.blue.opacity(0.2), lineWidth: 1)
                        )
                    }
                    .buttonStyle(.plain)
                    .disabled(isLogging)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: Weekly chart

    private var weeklyChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("This Week")
                .font(.headline)

            Chart(weekHistory, id: \.date) { entry in
                BarMark(
                    x: .value("Day", shortDate(entry.date)),
                    y: .value("ml", entry.ml)
                )
                .foregroundStyle(entry.ml >= target ? Color.green : Color.blue)
                .cornerRadius(6)

                RuleMark(y: .value("Target", target))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(Color.secondary.opacity(0.4))
            }
            .frame(height: 160)
            .chartYAxis {
                AxisMarks(values: .automatic(desiredCount: 4)) { val in
                    AxisGridLine()
                    AxisValueLabel {
                        if let ml = val.as(Int.self) {
                            Text(ml >= 1000 ? "\(ml / 1000)L" : "\(ml)ml")
                                .font(.caption2)
                        }
                    }
                }
            }

            // Legend
            HStack(spacing: 12) {
                HStack(spacing: 4) {
                    RoundedRectangle(cornerRadius: 2).fill(Color.blue).frame(width: 12, height: 12)
                    Text("Below target").font(.caption).foregroundStyle(.secondary)
                }
                HStack(spacing: 4) {
                    RoundedRectangle(cornerRadius: 2).fill(Color.green).frame(width: 12, height: 12)
                    Text("Goal met").font(.caption).foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: Actions

    private func addWater(_ ml: Int) async {
        isLogging = true
        defer { isLogging = false }
        do {
            try await SupabaseService.shared.logWater(amountMl: ml)
            todayTotal = (try? await SupabaseService.shared.getTodayWaterTotal()) ?? (todayTotal + ml)
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
        } catch { }
    }

    private func loadData() async {
        isLoading = true
        defer { isLoading = false }
        async let total = SupabaseService.shared.getTodayWaterTotal()
        async let history = SupabaseService.shared.getWeekWaterHistory()
        async let targetLoad = SupabaseService.shared.getWaterTarget()

        todayTotal = (try? await total) ?? 0
        weekHistory = (try? await history) ?? []
        target = (try? await targetLoad) ?? 2500
    }

    private func shortDate(_ dateStr: String) -> String {
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
        guard let d = df.date(from: dateStr) else { return dateStr }
        return d.formatted(.dateTime.weekday(.abbreviated))
    }
}

#Preview {
    WaterView()
}
