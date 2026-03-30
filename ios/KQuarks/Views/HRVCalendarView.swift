import SwiftUI

// MARK: - Models

private struct HRVDay: Identifiable {
    let id: String  // "yyyy-MM-dd"
    let date: Date
    let hrv: Double
    let baseline: Double
    let level: Int   // -2 to +2
    let deviationPct: Double
}

// MARK: - HRVCalendarView

struct HRVCalendarView: View {
    @State private var days: [HRVDay] = []
    @State private var isLoading = true
    @State private var selected: HRVDay?

    private let cellSize: CGFloat = 12
    private let cellSpacing: CGFloat = 2

    // Build 52 full weeks ending today
    private var calGrid: [[HRVDay?]] {
        guard !days.isEmpty else { return [] }
        let dayMap = Dictionary(days.map { ($0.id, $0) }, uniquingKeysWith: { f, _ in f })
        let cal = Calendar.current

        let today = cal.startOfDay(for: Date())
        // End on the Saturday of this week
        let todayWeekday = cal.component(.weekday, from: today) - 1  // 0=Sun
        let daysToSat = (6 - todayWeekday + 7) % 7
        let endDate = cal.date(byAdding: .day, value: daysToSat, to: today) ?? Date()
        let startDate = cal.date(byAdding: .day, value: -363, to: endDate) ?? Date()  // 52 weeks - 1 day

        // Build array of 364 days, grouped into 52 weeks of 7
        var weeks: [[HRVDay?]] = []
        var weekDays: [HRVDay?] = []
        var current = startDate
        while current <= endDate {
            let df = DateFormatter()
            df.dateFormat = "yyyy-MM-dd"
            let key = df.string(from: current)
            weekDays.append(dayMap[key])
            if weekDays.count == 7 {
                weeks.append(weekDays)
                weekDays = []
            }
            current = cal.date(byAdding: .day, value: 1, to: current) ?? Date()
        }
        if !weekDays.isEmpty { weeks.append(weekDays) }
        return weeks
    }

    private var monthLabels: [(col: Int, name: String)] {
        guard !calGrid.isEmpty else { return [] }
        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        var labels: [(col: Int, name: String)] = []
        var lastMonth = -1
        for (colIdx, week) in calGrid.enumerated() {
            if let day = week.compactMap({ $0 }).first {
                let month = Calendar.current.component(.month, from: day.date)
                if month != lastMonth {
                    let name = DateFormatter().monthSymbols[month - 1].prefix(3).description
                    labels.append((col: colIdx, name: name))
                    lastMonth = month
                }
            }
        }
        return labels
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                if isLoading {
                    ProgressView().frame(maxWidth: .infinity).padding(.top, 60)
                } else if days.isEmpty {
                    emptyState
                } else {
                    summaryCards
                    heatmapSection
                    if let sel = selected { selectedDayCard(sel) }
                    monthlyBreakdown
                    legendCard
                }
            }
            .padding()
        }
        .background(Color.premiumBackground)
        .navigationTitle("HRV Calendar")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Cards

    private var summaryCards: some View {
        let allHrv = days.map(\.hrv)
        let avg = allHrv.isEmpty ? 0 : allHrv.reduce(0, +) / Double(allHrv.count)
        let goodDays = days.filter { $0.level >= 1 }.count
        let poorDays = days.filter { $0.level <= -1 }.count
        let latestBaseline = days.last?.baseline ?? 0

        return HStack(spacing: 12) {
            calStat(label: "Avg HRV", value: String(format: "%.0f ms", avg), color: .purple)
            calStat(label: "Above Baseline", value: "\(goodDays)d", color: .green)
            calStat(label: "Below Baseline", value: "\(poorDays)d", color: .red)
            calStat(label: "Baseline", value: String(format: "%.0f ms", latestBaseline), color: .secondary)
        }
    }

    private func calStat(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.subheadline.bold().monospacedDigit())
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    // MARK: - Heatmap

    private var heatmapSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("365-Day HRV Heatmap")
                .font(.headline)

            ScrollView(.horizontal, showsIndicators: false) {
                VStack(alignment: .leading, spacing: 4) {
                    // Month labels
                    monthLabelRow

                    // Grid: 7 rows (Sun-Sat), 52 cols (weeks)
                    HStack(alignment: .top, spacing: cellSpacing) {
                        // Day-of-week labels
                        VStack(spacing: cellSpacing) {
                            ForEach(["S","M","T","W","T","F","S"], id: \.self) { label in
                                Text(label)
                                    .font(.system(size: 8))
                                    .foregroundStyle(.secondary)
                                    .frame(width: 10, height: cellSize)
                            }
                        }

                        // Week columns
                        HStack(alignment: .top, spacing: cellSpacing) {
                            ForEach(Array(calGrid.enumerated()), id: \.offset) { _, week in
                                VStack(spacing: cellSpacing) {
                                    ForEach(0..<7, id: \.self) { dayIdx in
                                        if let day = week[safe: dayIdx] ?? nil {
                                            cellView(day)
                                        } else {
                                            RoundedRectangle(cornerRadius: 2)
                                                .fill(Color(.systemFill).opacity(0.3))
                                                .frame(width: cellSize, height: cellSize)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var monthLabelRow: some View {
        HStack(alignment: .top, spacing: cellSpacing) {
            // spacer for day labels
            Spacer().frame(width: 10 + cellSpacing)
            ZStack(alignment: .topLeading) {
                Color.clear.frame(width: CGFloat(calGrid.count) * (cellSize + cellSpacing), height: 14)
                ForEach(monthLabels, id: \.col) { label in
                    Text(label.name)
                        .font(.system(size: 9))
                        .foregroundStyle(.secondary)
                        .offset(x: CGFloat(label.col) * (cellSize + cellSpacing))
                }
            }
        }
    }

    private func cellView(_ day: HRVDay) -> some View {
        RoundedRectangle(cornerRadius: 2)
            .fill(levelColor(day.level))
            .frame(width: cellSize, height: cellSize)
            .overlay(
                RoundedRectangle(cornerRadius: 2)
                    .strokeBorder(selected?.id == day.id ? Color.white : Color.clear, lineWidth: 1)
            )
            .onTapGesture { selected = (selected?.id == day.id) ? nil : day }
    }

    // MARK: - Selected Day

    private func selectedDayCard(_ day: HRVDay) -> some View {
        let df = DateFormatter()
        df.dateStyle = .long
        return VStack(alignment: .leading, spacing: 8) {
            Text(df.string(from: day.date))
                .font(.subheadline.bold())
            HStack(spacing: 20) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(String(format: "%.0f ms", day.hrv))
                        .font(.title2.bold())
                        .foregroundStyle(levelColor(day.level))
                    Text("HRV")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(String(format: "%.0f ms", day.baseline))
                        .font(.title2.bold())
                    Text("28-day baseline")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                VStack(alignment: .leading, spacing: 2) {
                    let sign = day.deviationPct >= 0 ? "+" : ""
                    Text("\(sign)\(String(format: "%.1f", day.deviationPct))%")
                        .font(.title2.bold())
                        .foregroundStyle(levelColor(day.level))
                    Text("vs baseline")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Monthly Breakdown

    private var monthlyBreakdown: some View {
        let byMonth = groupByMonth()
        guard !byMonth.isEmpty else { return AnyView(EmptyView()) }

        return AnyView(VStack(alignment: .leading, spacing: 8) {
            Text("Monthly Average")
                .font(.headline)

            VStack(spacing: 0) {
                ForEach(byMonth, id: \.label) { row in
                    HStack {
                        Text(row.label)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .frame(width: 44, alignment: .leading)
                        GeometryReader { geo in
                            let fraction = row.avg / (byMonth.map(\.avg).max() ?? 1)
                            RoundedRectangle(cornerRadius: 3)
                                .fill(Color.purple.opacity(0.6))
                                .frame(width: geo.size.width * fraction, height: 16)
                        }
                        .frame(height: 16)
                        Text(String(format: "%.0f ms", row.avg))
                            .font(.caption.monospacedDigit())
                            .foregroundStyle(.secondary)
                            .frame(width: 50, alignment: .trailing)
                    }
                    .padding(.vertical, 4)
                    if row.label != byMonth.last?.label {
                        Divider().opacity(0.3)
                    }
                }
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16)))
    }

    // MARK: - Legend

    private var legendCard: some View {
        HStack(spacing: 12) {
            Text("HRV vs baseline:")
                .font(.caption2)
                .foregroundStyle(.secondary)
            Spacer()
            ForEach([
                (-2, "≤-15%"),
                (-1, "-5 to -15%"),
                (0, "±5%"),
                (1, "+5 to +15%"),
                (2, "≥+15%"),
            ], id: \.0) { level, label in
                HStack(spacing: 3) {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(levelColor(level))
                        .frame(width: 10, height: 10)
                    Text(label)
                        .font(.system(size: 8))
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "waveform.path.ecg")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No HRV Data")
                .font(.title3.bold())
            Text("Sync your health data to see your 365-day HRV recovery calendar.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Helpers

    private func levelColor(_ level: Int) -> Color {
        switch level {
        case 2:  return Color(red: 0.13, green: 0.77, blue: 0.37)  // dark green
        case 1:  return Color(red: 0.53, green: 0.94, blue: 0.67)  // light green
        case -1: return Color(red: 0.98, green: 0.57, blue: 0.14)  // orange
        case -2: return Color(red: 0.94, green: 0.27, blue: 0.27)  // red
        default: return Color(.systemFill)                           // gray
        }
    }

    private func groupByMonth() -> [(label: String, avg: Double)] {
        let mf = DateFormatter()
        mf.dateFormat = "MMM yy"
        var buckets: [String: [Double]] = [:]
        var order: [String] = []
        for day in days {
            let key = mf.string(from: day.date)
            if buckets[key] == nil { order.append(key) }
            buckets[key, default: []].append(day.hrv)
        }
        return order.suffix(12).compactMap { key in
            guard let vals = buckets[key] else { return nil }
            return (label: key, avg: vals.reduce(0, +) / Double(vals.count))
        }
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        guard let rows = try? await SupabaseService.shared.fetchAllDailySummaries(days: 365) else { return }

        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"

        // Sort ascending (fetchAllDailySummaries returns descending)
        let sorted = rows
            .filter { ($0.avg_hrv ?? 0) > 0 }
            .sorted { $0.date < $1.date }

        var result: [HRVDay] = []
        for (i, row) in sorted.enumerated() {
            guard let hrv = row.avg_hrv, let date = df.date(from: row.date) else { continue }

            // 28-day rolling baseline (trailing, excludes current day)
            let slice = sorted[max(0, i - 28)..<i]
            let baseline: Double
            if slice.isEmpty {
                baseline = hrv
            } else {
                let vals = slice.compactMap(\.avg_hrv)
                baseline = vals.isEmpty ? hrv : vals.reduce(0, +) / Double(vals.count)
            }

            let deviation = baseline > 0 ? ((hrv - baseline) / baseline) * 100 : 0
            let level: Int
            if deviation > 15 { level = 2 }
            else if deviation > 5 { level = 1 }
            else if deviation < -15 { level = -2 }
            else if deviation < -5 { level = -1 }
            else { level = 0 }

            result.append(HRVDay(
                id: row.date,
                date: date,
                hrv: hrv,
                baseline: baseline,
                level: level,
                deviationPct: deviation
            ))
        }
        days = result
    }
}

// MARK: - Safe subscript

private extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}

#Preview {
    NavigationStack {
        HRVCalendarView()
    }
}
