import SwiftUI

// MARK: - Models

private struct DaySummary: Identifiable {
    let id: String         // date string "yyyy-MM-dd"
    let date: Date
    let steps: Int
    let sleepMins: Int?
    let hrv: Double?
    let calories: Double?
    let recovery: Int?
    let distance: Double?  // meters
}

private struct HeatmapRow {
    let label: String
    let icon: String
    let color: Color
    let values: [Double?]   // one per day, nil = no data; 0.0-1.0 = intensity
    let tooltips: [String]  // formatted value per day
}

// MARK: - HealthHeatmapView

/// A multi-metric calendar grid showing 30 days × 6 health metrics as a heatmap.
/// Each metric is a row; each day is a column; colour intensity = relative performance.
struct HealthHeatmapView: View {
    @State private var summaries: [DaySummary] = []
    @State private var isLoading = true
    @State private var selectedCell: (rowIdx: Int, dayIdx: Int)? = nil

    private let columns = 30

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if isLoading && summaries.isEmpty {
                    ProgressView().frame(maxWidth: .infinity).padding(.top, 80)
                } else if summaries.isEmpty {
                    emptyState
                } else {
                    headerCard
                    heatmapGrid
                    if let selected = selectedCell {
                        selectedDetailCard(rowIdx: selected.rowIdx, dayIdx: selected.dayIdx)
                    }
                    legendCard
                }
            }
            .padding()
        }
        .background(Color.premiumBackground)
        .navigationTitle("Health Heatmap")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Header

    private var headerCard: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Last 30 Days at a Glance")
                .font(.headline)
            Text("Tap any cell to see the exact value for that day and metric.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Heatmap

    private var rows: [HeatmapRow] { buildRows() }

    private var heatmapGrid: some View {
        VStack(spacing: 0) {
            // Day header row
            HStack(spacing: 0) {
                Text("")
                    .frame(width: 44)
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 2) {
                        ForEach(summaries, id: \.id) { day in
                            Text(shortDay(day.date))
                                .font(.system(size: 8, weight: .medium))
                                .foregroundStyle(.secondary)
                                .frame(width: 18)
                        }
                    }
                    .padding(.horizontal, 4)
                }
            }
            .padding(.bottom, 4)

            // Metric rows
            ForEach(Array(rows.enumerated()), id: \.offset) { (rowIdx, row) in
                heatmapRow(row: row, rowIdx: rowIdx)
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func heatmapRow(row: HeatmapRow, rowIdx: Int) -> some View {
        HStack(spacing: 0) {
            // Label
            HStack(spacing: 4) {
                Image(systemName: row.icon)
                    .font(.system(size: 11))
                    .foregroundStyle(row.color)
                    .frame(width: 14)
                Text(row.label)
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            .frame(width: 44, alignment: .leading)

            // Cells
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 2) {
                    ForEach(Array(row.values.enumerated()), id: \.offset) { (dayIdx, value) in
                        cellView(color: row.color, intensity: value, rowIdx: rowIdx, dayIdx: dayIdx)
                    }
                }
                .padding(.horizontal, 4)
            }
        }
        .padding(.vertical, 2)
    }

    private func cellView(color: Color, intensity: Double?, rowIdx: Int, dayIdx: Int) -> some View {
        let isSelected = selectedCell?.rowIdx == rowIdx && selectedCell?.dayIdx == dayIdx
        return RoundedRectangle(cornerRadius: 3)
            .fill(cellColor(color: color, intensity: intensity))
            .frame(width: 18, height: 18)
            .overlay(
                RoundedRectangle(cornerRadius: 3)
                    .stroke(isSelected ? color : .clear, lineWidth: 1.5)
            )
            .onTapGesture {
                withAnimation(.easeInOut(duration: 0.15)) {
                    if selectedCell?.rowIdx == rowIdx && selectedCell?.dayIdx == dayIdx {
                        selectedCell = nil
                    } else {
                        selectedCell = (rowIdx, dayIdx)
                    }
                }
            }
    }

    private func cellColor(color: Color, intensity: Double?) -> Color {
        guard let i = intensity else { return Color(.systemFill).opacity(0.3) }
        return color.opacity(0.15 + i * 0.75)
    }

    // MARK: - Selected cell detail

    private func selectedDetailCard(rowIdx: Int, dayIdx: Int) -> some View {
        let r = rows[rowIdx]
        let tooltip = r.tooltips.indices.contains(dayIdx) ? r.tooltips[dayIdx] : "—"
        let day = summaries.indices.contains(dayIdx) ? summaries[dayIdx] : nil

        return HStack(spacing: 12) {
            Image(systemName: r.icon)
                .font(.title3)
                .foregroundStyle(r.color)
                .frame(width: 36, height: 36)
                .background(r.color.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 8))

            VStack(alignment: .leading, spacing: 2) {
                Text(r.label)
                    .font(.subheadline.weight(.semibold))
                Text(tooltip)
                    .font(.title3.bold().monospacedDigit())
                    .foregroundStyle(r.color)
                if let d = day {
                    Text(d.date, style: .date)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            Spacer()
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .transition(.asymmetric(
            insertion: .move(edge: .top).combined(with: .opacity),
            removal: .opacity
        ))
    }

    // MARK: - Legend

    private var legendCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Colour Intensity")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
            HStack(spacing: 6) {
                ForEach(["No data", "Low", "Medium", "High"], id: \.self) { label in
                    HStack(spacing: 4) {
                        RoundedRectangle(cornerRadius: 3)
                            .fill(label == "No data" ? Color(.systemFill).opacity(0.3)
                                : label == "Low"     ? Color.green.opacity(0.25)
                                : label == "Medium"  ? Color.green.opacity(0.55)
                                :                      Color.green.opacity(0.90))
                            .frame(width: 14, height: 14)
                        Text(label)
                            .font(.system(size: 9))
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "tablecells.fill")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No Data Yet")
                .font(.title3.bold())
            Text("Sync at least a week of health data to see your health heatmap.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Build Rows

    private func buildRows() -> [HeatmapRow] {
        guard !summaries.isEmpty else { return [] }

        func normalise(_ vals: [Double?], lowerIsBetter: Bool = false) -> [Double?] {
            let raw = vals.compactMap { $0 }
            guard let minV = raw.min(), let maxV = raw.max(), maxV > minV else {
                return vals.map { $0 != nil ? 0.5 : nil }
            }
            return vals.map { v -> Double? in
                guard let v else { return nil }
                let norm = (v - minV) / (maxV - minV)
                return lowerIsBetter ? (1 - norm) : norm
            }
        }

        // Raw values
        let stepsRaw    = summaries.map { s -> Double? in s.steps > 0 ? Double(s.steps) : nil }
        let sleepRaw    = summaries.map { s -> Double? in s.sleepMins.map(Double.init) }
        let hrvRaw      = summaries.map { s -> Double? in s.hrv.map { $0 > 0 ? $0 : nil } ?? nil }
        let calRaw      = summaries.map { s -> Double? in s.calories.map { $0 > 0 ? $0 : nil } ?? nil }
        let recoveryRaw = summaries.map { s -> Double? in s.recovery.map(Double.init) }
        let distRaw     = summaries.map { s -> Double? in s.distance.map { $0 > 10 ? $0 / 1000 : nil } ?? nil }

        // Formatted tooltips
        let stepsT    = summaries.map { s -> String in s.steps > 0 ? "\(Int(s.steps).formatted()) steps" : "—" }
        let sleepT    = summaries.map { s -> String in
            guard let m = s.sleepMins, m > 0 else { return "—" }
            return "\(m/60)h \(m%60)m"
        }
        let hrvT      = summaries.map { s -> String in
            guard let h = s.hrv, h > 0 else { return "—" }
            return String(format: "%.0f ms", h)
        }
        let calT      = summaries.map { s -> String in
            guard let c = s.calories, c > 0 else { return "—" }
            return "\(Int(c)) kcal"
        }
        let recoveryT = summaries.map { s -> String in s.recovery.map { "\($0)%" } ?? "—" }
        let distT     = summaries.map { s -> String in
            guard let d = s.distance, d > 10 else { return "—" }
            return String(format: "%.1f km", d / 1000)
        }

        return [
            HeatmapRow(label: "Steps",    icon: "figure.walk",          color: .green,  values: normalise(stepsRaw),    tooltips: stepsT),
            HeatmapRow(label: "Sleep",    icon: "moon.fill",             color: .indigo, values: normalise(sleepRaw),    tooltips: sleepT),
            HeatmapRow(label: "HRV",      icon: "waveform.path.ecg",     color: .purple, values: normalise(hrvRaw),      tooltips: hrvT),
            HeatmapRow(label: "Calories", icon: "flame.fill",            color: .orange, values: normalise(calRaw),      tooltips: calT),
            HeatmapRow(label: "Recovery", icon: "arrow.counterclockwise",color: .teal,   values: normalise(recoveryRaw), tooltips: recoveryT),
            HeatmapRow(label: "Distance", icon: "map.fill",              color: .blue,   values: normalise(distRaw),     tooltips: distT),
        ]
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        guard let rows = try? await SupabaseService.shared.fetchDailySummariesForCorrelation(days: 30) else { return }
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
        summaries = rows
            .compactMap { r -> DaySummary? in
                guard let date = df.date(from: r.date) else { return nil }
                return DaySummary(
                    id: r.date,
                    date: date,
                    steps: r.steps,
                    sleepMins: r.sleep_duration_minutes,
                    hrv: r.avg_hrv,
                    calories: r.active_calories,
                    recovery: r.recovery_score,
                    distance: r.distance_meters
                )
            }
            .sorted { $0.date < $1.date }
    }

    // MARK: - Helpers

    private func shortDay(_ date: Date) -> String {
        let day = Calendar.current.component(.day, from: date)
        return day == 1 || day == 15 ? "\(day)" : ""
    }
}

#Preview {
    NavigationStack {
        HealthHeatmapView()
    }
}
