import SwiftUI
import Charts

// MARK: - WorkoutEfficiencyView
// Compares calorie burn efficiency (kcal/min) across all workout types
// to reveal which sports are most intense and how efficiency changes over time.

struct WorkoutEfficiencyView: View {
    @State private var isLoading = false
    @State private var typeStats: [TypeEfficiency] = []
    @State private var topSessions: [SessionStat] = []
    @State private var weeklyTrend: [WeekPoint] = []
    @State private var totalSessions = 0
    @State private var totalMins: Double = 0
    @State private var totalCals: Double = 0

    // MARK: - Models

    struct TypeEfficiency: Identifiable {
        let id: String          // raw workout type key
        let label: String
        let sessions: Int
        let calPerMin: Double
        let avgDuration: Double // minutes
        let avgCals: Double
        let avgHr: Double?
        let color: Color
    }

    struct SessionStat: Identifiable {
        let id = UUID()
        let date: Date
        let typeLabel: String
        let duration: Int        // minutes
        let calories: Double
        let calPerMin: Double
        let avgHr: Int?
        let color: Color
    }

    struct WeekPoint: Identifiable {
        let id: String
        let weekLabel: String
        // per-type cal/min — up to 3 top types
        let values: [(type: String, calPerMin: Double, color: Color)]
    }

    // MARK: - Palette

    private static let palette: [Color] = [
        .orange, .blue, .green, .red, .purple, .cyan, .pink, .yellow, .teal, .indigo, .mint, .brown,
    ]

    private static func prettyLabel(_ type: String) -> String {
        let map: [String: String] = [
            "running": "Running", "cycling": "Cycling", "swimming": "Swimming",
            "walking": "Walking", "hiking": "Hiking", "yoga": "Yoga",
            "strength_training": "Strength", "hiit": "HIIT",
            "rowing": "Rowing", "elliptical": "Elliptical",
            "pilates": "Pilates", "dance": "Dance",
            "functional_strength_training": "Strength",
            "traditional_strength_training": "Strength",
            "core_training": "Core", "flexibility": "Flexibility",
            "cross_training": "Cross Training", "stair_climbing": "Stair Climb",
            "kickboxing": "Kickboxing", "mixed_cardio": "Mixed Cardio",
        ]
        if let pretty = map[type.lowercased()] { return pretty }
        return type.split(separator: "_").map { $0.capitalized }.joined(separator: " ")
    }

    private var overallEfficiency: Double {
        totalMins > 0 ? totalCals / totalMins : 0
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if typeStats.isEmpty {
                    emptyState
                } else {
                    summaryRow
                    efficiencyChart
                    typeCards
                    if weeklyTrend.count >= 4 { trendChart }
                    topSessionsList
                    infoCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Workout Efficiency")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Summary Row

    private var summaryRow: some View {
        HStack(spacing: 0) {
            statBubble(value: "\(totalSessions)", label: "Sessions", color: .orange)
            Divider().frame(height: 44)
            statBubble(value: formatDuration(totalMins), label: "Total Time", color: .blue)
            Divider().frame(height: 44)
            statBubble(value: String(format: "%.1f", overallEfficiency), label: "Avg kcal/min", color: overallEfficiency >= 8 ? .green : overallEfficiency >= 5 ? .yellow : .orange)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func statBubble(value: String, label: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title2.bold())
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Efficiency Bar Chart

    private var efficiencyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Efficiency by Type")
                .font(.headline)
            Text("Average kcal burned per minute")
                .font(.caption)
                .foregroundStyle(.secondary)

            Chart(typeStats) { stat in
                BarMark(
                    x: .value("kcal/min", stat.calPerMin),
                    y: .value("Type", stat.label)
                )
                .foregroundStyle(stat.color)
                .annotation(position: .trailing) {
                    Text(String(format: "%.1f", stat.calPerMin))
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
            .chartXAxis {
                AxisMarks(values: .automatic(desiredCount: 4)) {
                    AxisGridLine()
                    AxisValueLabel(format: FloatingPointFormatStyle<Double>.number.precision(.fractionLength(0)))
                }
            }
            .chartYAxis {
                AxisMarks { _ in
                    AxisValueLabel()
                }
            }
            .frame(height: CGFloat(typeStats.count) * 38 + 20)
            .padding(.top, 4)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Type Cards

    private var typeCards: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            ForEach(typeStats) { stat in
                typeCard(stat)
            }
        }
    }

    private func typeCard(_ stat: TypeEfficiency) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(stat.label)
                    .font(.subheadline.weight(.semibold))
                Spacer()
                if stat.id == typeStats.first?.id {
                    Image(systemName: "bolt.fill")
                        .font(.caption)
                        .foregroundStyle(.yellow)
                }
            }
            Text(String(format: "%.1f kcal/min", stat.calPerMin))
                .font(.title3.bold())
                .foregroundStyle(stat.color)

            // Progress bar (relative to max)
            let maxEff = typeStats.first?.calPerMin ?? 1
            GeometryReader { geo in
                RoundedRectangle(cornerRadius: 3)
                    .fill(Color(.systemFill))
                    .frame(width: geo.size.width, height: 6)
                    .overlay(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 3)
                            .fill(stat.color)
                            .frame(width: geo.size.width * (stat.calPerMin / maxEff), height: 6)
                    }
            }
            .frame(height: 6)

            VStack(alignment: .leading, spacing: 2) {
                Text("\(stat.sessions) sessions · avg \(formatDuration(stat.avgDuration))")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                if let hr = stat.avgHr {
                    Text("avg \(Int(hr)) bpm · \(Int(stat.avgCals)) kcal")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                } else {
                    Text("avg \(Int(stat.avgCals)) kcal per session")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Weekly Trend Chart

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Efficiency Trend")
                .font(.headline)
            Text("kcal/min per week for top workout types")
                .font(.caption)
                .foregroundStyle(.secondary)

            Chart {
                ForEach(weeklyTrend) { week in
                    ForEach(week.values, id: \.type) { point in
                        if point.calPerMin > 0 {
                            LineMark(
                                x: .value("Week", week.weekLabel),
                                y: .value("kcal/min", point.calPerMin)
                            )
                            .foregroundStyle(point.color)
                            .interpolationMethod(.catmullRom)
                            .symbol(by: .value("Type", point.type))
                        }
                    }
                }
            }
            .chartXAxis {
                AxisMarks(values: .automatic(desiredCount: 6)) {
                    AxisValueLabel()
                }
            }
            .chartYAxis {
                AxisMarks(values: .automatic(desiredCount: 4)) {
                    AxisGridLine()
                    AxisValueLabel(format: FloatingPointFormatStyle<Double>.number.precision(.fractionLength(0)))
                }
            }
            .frame(height: 160)
            .padding(.top, 4)

            // Legend
            HStack(spacing: 12) {
                ForEach(weeklyTrend.first?.values ?? [], id: \.type) { point in
                    HStack(spacing: 4) {
                        Circle()
                            .fill(point.color)
                            .frame(width: 8, height: 8)
                        Text(WorkoutEfficiencyView.prettyLabel(point.type))
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Top Sessions

    private var topSessionsList: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Most Efficient Sessions")
                .font(.headline)
            Text("Your highest-intensity workouts by kcal/min")
                .font(.caption)
                .foregroundStyle(.secondary)

            ForEach(Array(topSessions.prefix(10).enumerated()), id: \.element.id) { idx, session in
                HStack(spacing: 12) {
                    Text("\(idx + 1)")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .frame(width: 18, alignment: .trailing)

                    VStack(alignment: .leading, spacing: 2) {
                        HStack {
                            Text(session.typeLabel)
                                .font(.subheadline.weight(.medium))
                            Spacer()
                            Text(String(format: "%.1f kcal/m", session.calPerMin))
                                .font(.subheadline.bold())
                                .foregroundStyle(session.color)
                        }
                        HStack(spacing: 6) {
                            Text(session.date.formatted(date: .abbreviated, time: .omitted))
                            Text("·")
                            Text("\(session.duration) min")
                            Text("·")
                            Text("\(Int(session.calories)) kcal")
                            if let hr = session.avgHr {
                                Text("·")
                                Text("\(hr) bpm")
                            }
                        }
                        .font(.caption)
                        .foregroundStyle(.secondary)

                        // Efficiency bar
                        let maxEff = topSessions.first?.calPerMin ?? 1
                        GeometryReader { geo in
                            RoundedRectangle(cornerRadius: 2)
                                .fill(Color(.systemFill))
                                .frame(width: geo.size.width, height: 4)
                                .overlay(alignment: .leading) {
                                    RoundedRectangle(cornerRadius: 2)
                                        .fill(session.color.opacity(0.6))
                                        .frame(width: geo.size.width * (session.calPerMin / maxEff), height: 4)
                                }
                        }
                        .frame(height: 4)
                    }
                }
                .padding(.vertical, 4)
                if idx < min(9, topSessions.count - 1) {
                    Divider().padding(.leading, 30)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Info Card

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Understanding Efficiency", systemImage: "info.circle")
                .font(.subheadline.weight(.semibold))
            Text("kcal/min measures how many active calories you burn each minute — a proxy for exercise intensity. HIIT and running typically reach 10–15 kcal/min; strength training scores lower (4–7) but provides different benefits not captured by calories alone.")
                .font(.caption)
                .foregroundStyle(.secondary)
            Text("Rising efficiency in a sport over time suggests improved fitness — you're sustaining higher intensities.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "bolt.heart.fill")
                .font(.system(size: 60))
                .foregroundStyle(.orange.opacity(0.5))
            Text("No Efficiency Data")
                .font(.title3.bold())
            Text("Log at least 2 workouts with calorie tracking to see efficiency analysis.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let recs = (try? await SupabaseService.shared.fetchWorkoutRecords(days: 180)) ?? []
        let validRecs = recs.filter { $0.durationMinutes > 5 && ($0.activeCalories ?? 0) > 5 }

        // ── Type aggregation ─────────────────────────────────────────────
        struct TypeAgg {
            var sessions = 0
            var totalMins: Double = 0
            var totalCals: Double = 0
            var hrSum: Double = 0
            var hrSessions = 0
        }

        var typeMap: [String: TypeAgg] = [:]
        for w in validRecs {
            let key = w.workoutType.lowercased()
            var agg = typeMap[key] ?? TypeAgg()
            agg.sessions += 1
            agg.totalMins += Double(w.durationMinutes)
            agg.totalCals += w.activeCalories ?? 0
            if let hr = w.avgHeartRate, hr > 40 {
                agg.hrSum += Double(hr) * Double(w.durationMinutes)
                agg.hrSessions += 1
            }
            typeMap[key] = agg
        }

        let sortedTypes = typeMap
            .filter { $0.value.sessions >= 2 }
            .map { (key, agg) in (key, agg) }
            .sorted { $0.1.totalCals / $0.1.totalMins > $1.1.totalCals / $1.1.totalMins }

        let colors = Self.palette
        typeStats = sortedTypes.enumerated().map { (i, pair) in
            let (key, agg) = pair
            return TypeEfficiency(
                id: key,
                label: Self.prettyLabel(key),
                sessions: agg.sessions,
                calPerMin: agg.totalCals / agg.totalMins,
                avgDuration: agg.totalMins / Double(agg.sessions),
                avgCals: agg.totalCals / Double(agg.sessions),
                avgHr: agg.hrSessions > 0 ? agg.hrSum / agg.totalMins : nil,
                color: colors[i % colors.count]
            )
        }

        totalSessions = validRecs.count
        totalMins = validRecs.reduce(0.0) { $0 + Double($1.durationMinutes) }
        totalCals = validRecs.reduce(0.0) { $0 + ($1.activeCalories ?? 0) }

        // ── Top sessions ─────────────────────────────────────────────────
        let typeColorMap: [String: Color] = Dictionary(
            uniqueKeysWithValues: typeStats.map { ($0.id, $0.color) }
        )
        let filteredRecs = validRecs.filter { $0.durationMinutes >= 10 }
        var sessionList: [SessionStat] = []
        for w in filteredRecs {
            let key = w.workoutType.lowercased()
            let cpm = (w.activeCalories ?? 0) / Double(w.durationMinutes)
            let stat = SessionStat(
                date: w.startTime,
                typeLabel: Self.prettyLabel(key),
                duration: w.durationMinutes,
                calories: w.activeCalories ?? 0,
                calPerMin: cpm,
                avgHr: w.avgHeartRate,
                color: typeColorMap[key] ?? .gray
            )
            sessionList.append(stat)
        }
        sessionList.sort { $0.calPerMin > $1.calPerMin }
        topSessions = Array(sessionList.prefix(15))

        // ── Weekly trend for top 3 types by session count ─────────────────
        let topTypeKeys = typeMap
            .sorted { $0.value.sessions > $1.value.sessions }
            .prefix(3)
            .map { $0.key }

        var weekMap: [String: [String: (cals: Double, mins: Double)]] = [:]
        let cal = Calendar.current
        for w in validRecs {
            let key = w.workoutType.lowercased()
            guard topTypeKeys.contains(key) else { continue }
            let comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: w.startTime)
            let wkKey = "\(comps.yearForWeekOfYear ?? 0)-W\(String(format: "%02d", comps.weekOfYear ?? 0))"
            var existing = weekMap[wkKey] ?? [:]
            var td = existing[key] ?? (cals: 0, mins: 0)
            td = (cals: td.cals + (w.activeCalories ?? 0), mins: td.mins + Double(w.durationMinutes))
            existing[key] = td
            weekMap[wkKey] = existing
        }

        weeklyTrend = weekMap
            .sorted { $0.key < $1.key }
            .suffix(12)
            .enumerated()
            .map { (i, pair) in
                let values = topTypeKeys.compactMap { tk -> (type: String, calPerMin: Double, color: Color)? in
                    guard let d = pair.value[tk], d.mins > 0 else { return nil }
                    let color = typeColorMap[tk] ?? .gray
                    return (type: tk, calPerMin: d.cals / d.mins, color: color)
                }
                return WeekPoint(id: pair.key, weekLabel: "W\(i + 1)", values: values)
            }
    }

    // MARK: - Helpers

    private func formatDuration(_ mins: Double) -> String {
        let h = Int(mins) / 60
        let m = Int(mins) % 60
        return h > 0 ? "\(h)h \(m)m" : "\(m)m"
    }
}

#Preview {
    NavigationStack {
        WorkoutEfficiencyView()
    }
}
