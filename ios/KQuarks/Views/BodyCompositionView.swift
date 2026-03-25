import SwiftUI
import HealthKit
import Charts

// MARK: - Weight sample point

struct WeightSample: Identifiable {
    let id = UUID()
    let date: Date
    let kg: Double
}

// MARK: - BodyCompositionView

struct BodyCompositionView: View {
    @State private var samples: [WeightSample] = []
    @State private var isLoading = true
    @State private var showLogWeight = false
    @State private var logWeightText = ""
    @State private var selectedRange: Int = 90 // days

    private var rangeOptions: [Int] = [30, 90, 180, 365]

    var body: some View {
        NavigationStack {
            Group {
                if isLoading && samples.isEmpty {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if samples.isEmpty {
                    emptyState
                } else {
                    scrollContent
                }
            }
            .navigationTitle("Body Weight")
            .toolbarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    HStack {
                        NavigationLink(destination: BodyTrendsView()) {
                            Image(systemName: "chart.bar.xaxis")
                        }
                        Button {
                            logWeightText = samples.last.map { String(format: "%.1f", $0.kg) } ?? ""
                            showLogWeight = true
                        } label: {
                            Image(systemName: "plus")
                        }
                    }
                }
            }
            .alert("Log Weight", isPresented: $showLogWeight) {
                TextField("Weight in kg", text: $logWeightText)
                    .keyboardType(.decimalPad)
                Button("Save") {
                    guard let kg = Double(logWeightText), kg > 10, kg < 500 else { return }
                    Task {
                        try? await HealthKitService.shared.saveBodyWeight(kg)
                        await loadData()
                    }
                    logWeightText = ""
                }
                Button("Cancel", role: .cancel) { logWeightText = "" }
            } message: {
                Text("Enter your current body weight in kilograms.")
            }
            .task { await loadData() }
            .refreshable { await loadData() }
        }
    }

    // MARK: - Scroll content

    @ViewBuilder
    private var scrollContent: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Range picker
                Picker("Range", selection: $selectedRange) {
                    ForEach(rangeOptions, id: \.self) { days in
                        Text(rangeLabel(days)).tag(days)
                    }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)
                .onChange(of: selectedRange) { _, _ in Task { await loadData() } }

                // Stats cards
                statsCards

                // Weight chart
                weightChart

                // Recent list
                recentList
            }
            .padding(.vertical)
        }
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Stats

    @ViewBuilder
    private var statsCards: some View {
        let filtered = filteredSamples
        if !filtered.isEmpty {
            let current = filtered.last!.kg
            let min = filtered.map(\.kg).min()!
            let max = filtered.map(\.kg).max()!
            let change: Double? = filtered.count > 1 ? current - filtered.first!.kg : nil

            HStack(spacing: 12) {
                BodyStatCard(title: "Current", value: String(format: "%.1f kg", current), color: .primary)
                BodyStatCard(title: "Change",
                             value: change.map { String(format: "%+.1f kg", $0) } ?? "—",
                             color: (change ?? 0) < 0 ? .green : (change ?? 0) > 0 ? .orange : .secondary)
                BodyStatCard(title: "Range", value: String(format: "%.1f–%.1f", min, max), color: .secondary)
            }
            .padding(.horizontal)
        }
    }

    // MARK: - Chart

    @ViewBuilder
    private var weightChart: some View {
        let filtered = filteredSamples
        if !filtered.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                Text("Weight Trend")
                    .font(.headline)
                    .padding(.horizontal)

                Chart(filtered) { sample in
                    LineMark(
                        x: .value("Date", sample.date),
                        y: .value("kg", sample.kg)
                    )
                    .foregroundStyle(Color.accentColor)
                    .lineStyle(StrokeStyle(lineWidth: 2))

                    AreaMark(
                        x: .value("Date", sample.date),
                        y: .value("kg", sample.kg)
                    )
                    .foregroundStyle(
                        LinearGradient(
                            colors: [Color.accentColor.opacity(0.2), Color.accentColor.opacity(0.0)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )

                    PointMark(
                        x: .value("Date", sample.date),
                        y: .value("kg", sample.kg)
                    )
                    .foregroundStyle(Color.accentColor)
                    .symbolSize(20)
                }
                .frame(height: 200)
                .chartXAxis {
                    AxisMarks(values: .stride(by: .month)) { _ in
                        AxisGridLine()
                        AxisTick()
                        AxisValueLabel(format: .dateTime.month(.abbreviated))
                    }
                }
                .chartYAxis {
                    AxisMarks { _ in
                        AxisGridLine()
                        AxisTick()
                        AxisValueLabel()
                    }
                }
                .padding(.horizontal)
            }
            .padding(.vertical, 12)
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .padding(.horizontal)
        }
    }

    // MARK: - Recent list

    @ViewBuilder
    private var recentList: some View {
        let filtered = filteredSamples.reversed().prefix(20)
        if !filtered.isEmpty {
            VStack(alignment: .leading, spacing: 0) {
                Text("Recent Readings")
                    .font(.headline)
                    .padding(.horizontal)
                    .padding(.bottom, 8)

                ForEach(Array(filtered)) { sample in
                    HStack {
                        Text(sample.date.formatted(date: .abbreviated, time: .omitted))
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Spacer()
                        Text(String(format: "%.1f kg", sample.kg))
                            .font(.subheadline.bold())
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 10)
                    .background(Color(.systemBackground))
                    if filtered.last?.id != sample.id {
                        Divider().padding(.leading)
                    }
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .padding(.horizontal)
        }
    }

    // MARK: - Empty state

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "scalemass")
                .font(.system(size: 60))
                .foregroundStyle(.secondary)
            Text("No Weight Data")
                .font(.title3.bold())
            Text("Log your weight to see trends over time. You can also log via Apple Health.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
            Button {
                logWeightText = ""
                showLogWeight = true
            } label: {
                Label("Log Weight", systemImage: "plus")
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
            }
            .buttonStyle(.borderedProminent)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Helpers

    private var filteredSamples: [WeightSample] {
        let cutoff = Calendar.current.date(byAdding: .day, value: -selectedRange, to: Date()) ?? Date()
        return samples.filter { $0.date >= cutoff }
    }

    private func rangeLabel(_ days: Int) -> String {
        switch days {
        case 30: return "1M"
        case 90: return "3M"
        case 180: return "6M"
        case 365: return "1Y"
        default: return "\(days)d"
        }
    }

    private func loadData() async {
        isLoading = true
        defer { isLoading = false }
        let start = Calendar.current.date(byAdding: .day, value: -365, to: Date()) ?? Date()
        let raw = (try? await HealthKitService.shared.fetchSamples(
            for: .bodyMass, from: start, to: Date()
        )) ?? []
        samples = raw.map { s in
            WeightSample(date: s.startDate, kg: s.quantity.doubleValue(for: HKUnit.gramUnit(with: .kilo)))
        }.sorted { $0.date < $1.date }
    }
}

// MARK: - StatCard

private struct BodyStatCard: View {
    let title: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.subheadline.bold())
                .foregroundStyle(color)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }
}

#Preview {
    BodyCompositionView()
}
