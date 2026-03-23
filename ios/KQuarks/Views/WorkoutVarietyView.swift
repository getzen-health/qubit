import SwiftUI
import Charts

// MARK: - WorkoutVarietyView
// Analyzes balance and diversity across workout types over the last 90 days.

struct WorkoutVarietyView: View {
    @State private var isLoading = false
    @State private var typeBuckets: [TypeBucket] = []
    @State private var weeklyVariety: [WeekBucket] = []
    @State private var totalSessions = 0
    @State private var totalDurationMins = 0
    @State private var varietyScore = 0
    @State private var selectedType: String?

    struct TypeBucket: Identifiable {
        let id: String  // workoutType
        let label: String
        let sessions: Int
        let totalMins: Int
        let totalCals: Double
        let color: Color
        var pct: Double = 0
    }

    struct WeekBucket: Identifiable {
        let id: String
        let weekLabel: String
        let uniqueTypes: Int
        let sessions: Int
    }

    // Palette — assigned by index mod len
    private static let palette: [Color] = [
        .orange, .blue, .green, .red, .purple, .teal, .pink, .yellow, .cyan, .indigo, .mint, .brown,
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

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if totalSessions == 0 {
                    emptyState
                } else {
                    summaryCards
                    if typeBuckets.count >= 2 { donutSection }
                    typeBreakdownCard
                    if weeklyVariety.count >= 2 { weeklyVarietyChart }
                    varietyScoreCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Workout Variety")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Summary Cards

    private var summaryCards: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            statCard(title: "Workouts", value: "\(totalSessions)", sub: "last 90 days", color: .blue)
            statCard(title: "Sport Types", value: "\(typeBuckets.count)", sub: "unique disciplines", color: .purple)
            statCard(title: "Total Time", value: formatMins(totalDurationMins), sub: "active minutes", color: .green)
            statCard(title: "Variety Score", value: "\(varietyScore)", sub: "out of 100", color: scoreColor(varietyScore))
        }
    }

    private func statCard(title: String, value: String, sub: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title).font(.caption).foregroundStyle(.secondary)
            Text(value).font(.title2.bold()).foregroundStyle(color)
            Text(sub).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Donut Chart

    private var donutSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Training Mix").font(.headline).padding(.horizontal, 4)
            Text("Sessions by sport type").font(.caption).foregroundStyle(.secondary).padding(.horizontal, 4)

            HStack(alignment: .center, spacing: 16) {
                // Donut
                Chart(typeBuckets) { b in
                    SectorMark(
                        angle: .value("Sessions", b.sessions),
                        innerRadius: .ratio(0.55),
                        angularInset: 1.5
                    )
                    .foregroundStyle(b.color)
                    .opacity(selectedType == nil || selectedType == b.id ? 1.0 : 0.3)
                    .cornerRadius(4)
                }
                .frame(width: 160, height: 160)
                .onTapGesture { selectedType = nil }  // tap center to deselect

                // Legend
                VStack(alignment: .leading, spacing: 6) {
                    ForEach(typeBuckets.prefix(6)) { b in
                        Button {
                            selectedType = selectedType == b.id ? nil : b.id
                        } label: {
                            HStack(spacing: 8) {
                                Circle().fill(b.color).frame(width: 10, height: 10)
                                Text(b.label).font(.caption.weight(.medium))
                                Spacer()
                                Text(String(format: "%.0f%%", b.pct * 100))
                                    .font(.caption2.monospacedDigit())
                                    .foregroundStyle(.secondary)
                            }
                            .opacity(selectedType == nil || selectedType == b.id ? 1.0 : 0.4)
                        }
                        .buttonStyle(.plain)
                    }
                    if typeBuckets.count > 6 {
                        Text("+ \(typeBuckets.count - 6) more").font(.caption2).foregroundStyle(.secondary)
                    }
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
    }

    // MARK: - Type Breakdown Card

    private var typeBreakdownCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("By Sport Type").font(.headline).padding(.horizontal, 4)

            VStack(spacing: 0) {
                ForEach(Array(typeBuckets.enumerated()), id: \.element.id) { i, b in
                    VStack(spacing: 0) {
                        HStack(spacing: 10) {
                            Circle().fill(b.color).frame(width: 10, height: 10)
                            Text(b.label).font(.subheadline.weight(.medium))
                            Spacer()
                            VStack(alignment: .trailing, spacing: 2) {
                                Text("\(b.sessions) sessions").font(.caption.monospacedDigit()).foregroundStyle(.primary)
                                Text(formatMins(b.totalMins)).font(.caption2).foregroundStyle(.secondary)
                            }
                        }
                        .padding(.horizontal, 14)
                        .padding(.vertical, 10)

                        // Progress bar
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                Rectangle().fill(b.color.opacity(0.08)).frame(height: 3)
                                Rectangle().fill(b.color.opacity(0.6)).frame(width: geo.size.width * CGFloat(b.pct), height: 3)
                            }
                        }
                        .frame(height: 3)
                        .padding(.horizontal, 14)

                        if i < typeBuckets.count - 1 {
                            Divider().padding(.leading, 14)
                        }
                    }
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Weekly Variety Chart

    private var weeklyVarietyChart: some View {
        let maxTypes = weeklyVariety.map(\.uniqueTypes).max().map { Double($0) } ?? 1

        return VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Sport Variety").font(.headline).padding(.horizontal, 4)
            Text("Number of different sports each week").font(.caption).foregroundStyle(.secondary).padding(.horizontal, 4)

            Chart {
                RuleMark(y: .value("Good Variety", 2))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    .foregroundStyle(Color.green.opacity(0.4))
                    .annotation(position: .topLeading) {
                        Text("variety").font(.caption2).foregroundStyle(.secondary.opacity(0.6))
                    }

                ForEach(weeklyVariety) { w in
                    BarMark(
                        x: .value("Week", w.weekLabel),
                        y: .value("Types", w.uniqueTypes)
                    )
                    .foregroundStyle(w.uniqueTypes >= 2 ? Color.purple.opacity(0.75) : Color.secondary.opacity(0.4))
                    .cornerRadius(4)
                }
            }
            .chartYScale(domain: 0...(maxTypes + 1))
            .chartYAxis {
                AxisMarks(values: .stride(by: 1)) { val in
                    AxisValueLabel {
                        if let v = val.as(Int.self) { Text("\(v)").font(.caption2) }
                    }
                }
            }
            .frame(height: 140)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Variety Score Card

    private var varietyScoreCard: some View {
        let color = scoreColor(varietyScore)
        let label = varietyScore >= 70 ? "Well-rounded athlete" :
                    varietyScore >= 40 ? "Building variety" : "Try adding new sports"
        let tip = buildTip()

        return VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Variety Score").font(.headline)
                    Text(label).font(.subheadline).foregroundStyle(color)
                }
                Spacer()
                Text("\(varietyScore)").font(.system(size: 44, weight: .bold, design: .rounded)).foregroundStyle(color)
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(color.opacity(0.12)).frame(height: 10)
                    Capsule().fill(color).frame(width: geo.size.width * CGFloat(varietyScore) / 100, height: 10)
                }
            }.frame(height: 10)

            if let tip = tip {
                Label(tip, systemImage: "lightbulb.fill")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(10)
                    .background(Color(.systemFill))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            }

            Text("Score factors: unique sport types, weekly variety, and training balance across cardio, strength, and flexibility.")
                .font(.caption2)
                .foregroundStyle(.secondary.opacity(0.7))
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "figure.mixed.cardio")
                .font(.system(size: 48))
                .foregroundStyle(.purple.opacity(0.7))
            Text("No Workout Data")
                .font(.title3.bold())
            Text("Log at least 5 workouts to see your training variety and sport distribution analysis.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let recs = (try? await SupabaseService.shared.fetchWorkoutRecords(days: 90)) ?? []
        guard !recs.isEmpty else { return }

        totalSessions = recs.count

        // Group by type
        var typeGroups: [String: (sessions: Int, totalMins: Int, totalCals: Double)] = [:]
        for r in recs {
            let key = r.workoutType.lowercased()
            var g = typeGroups[key] ?? (sessions: 0, totalMins: 0, totalCals: 0)
            g.sessions += 1
            g.totalMins += r.durationMinutes
            g.totalCals += r.activeCalories ?? 0
            typeGroups[key] = g
        }

        totalDurationMins = typeGroups.values.reduce(0) { $0 + $1.totalMins }
        let totalD = Double(totalSessions)

        // Sort by sessions descending
        let sorted = typeGroups.sorted { $0.value.sessions > $1.value.sessions }
        typeBuckets = sorted.enumerated().map { i, pair in
            TypeBucket(
                id: pair.key,
                label: Self.prettyLabel(pair.key),
                sessions: pair.value.sessions,
                totalMins: pair.value.totalMins,
                totalCals: pair.value.totalCals,
                color: Self.palette[i % Self.palette.count],
                pct: totalD > 0 ? Double(pair.value.sessions) / totalD : 0
            )
        }

        // Weekly variety
        let cal = Calendar.current
        let df = DateFormatter()
        var weekGroups: [Date: Set<String>] = [:]
        var weekSessions: [Date: Int] = [:]

        for r in recs {
            var comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: r.startTime)
            comps.weekday = 2  // Monday
            let weekStart = cal.date(from: comps) ?? r.startTime
            weekGroups[weekStart, default: []].insert(r.workoutType.lowercased())
            weekSessions[weekStart, default: 0] += 1
        }

        df.dateFormat = "MMM d"
        weeklyVariety = weekGroups.sorted { $0.key < $1.key }.map { week, types in
            WeekBucket(
                id: df.string(from: week) + week.description,
                weekLabel: df.string(from: week),
                uniqueTypes: types.count,
                sessions: weekSessions[week] ?? 0
            )
        }

        // Variety score
        let uniqueTypes = typeBuckets.count
        let avgWeeklyVariety = weeklyVariety.isEmpty ? 0 : weeklyVariety.map(\.uniqueTypes).reduce(0, +) / weeklyVariety.count

        // Categories: cardio, strength, flexibility/mind
        let cardio: Set<String>    = ["running","cycling","swimming","walking","hiking","rowing","elliptical","stair_climbing","mixed_cardio","cross_training"]
        let strength: Set<String>  = ["strength_training","functional_strength_training","traditional_strength_training","core_training","hiit","kickboxing"]
        let mindBody: Set<String>  = ["yoga","pilates","dance","flexibility"]

        let hasCardio   = typeBuckets.contains { cardio.contains($0.id) }
        let hasStrength = typeBuckets.contains { strength.contains($0.id) }
        let hasMindBody = typeBuckets.contains { mindBody.contains($0.id) }

        let typeScore    = min(40, uniqueTypes * 8)                        // up to 40 pts
        let weeklyScore  = min(30, avgWeeklyVariety * 12)                  // up to 30 pts
        let categoryScore = (hasCardio ? 10 : 0) + (hasStrength ? 10 : 0) + (hasMindBody ? 10 : 0) // up to 30 pts
        varietyScore = min(100, typeScore + weeklyScore + categoryScore)
    }

    // MARK: - Helpers

    private func buildTip() -> String? {
        let types = Set(typeBuckets.map(\.id))
        let cardio: Set<String>   = ["running","cycling","swimming","walking","hiking","rowing","elliptical"]
        let strength: Set<String> = ["strength_training","functional_strength_training","traditional_strength_training","hiit"]
        let mindBody: Set<String> = ["yoga","pilates","flexibility"]

        if types.isDisjoint(with: strength) { return "Add strength training to build muscle and protect joints." }
        if types.isDisjoint(with: cardio)   { return "Add cardio (running, cycling) for heart health and endurance." }
        if types.isDisjoint(with: mindBody) { return "Try yoga or flexibility work to improve mobility and reduce injury risk." }
        if typeBuckets.count == 1           { return "Mixing in a second sport reduces injury risk and plateaus." }
        return nil
    }

    private func scoreColor(_ score: Int) -> Color {
        score >= 70 ? .green : score >= 40 ? .yellow : .orange
    }

    private func formatMins(_ mins: Int) -> String {
        guard mins > 0 else { return "—" }
        let h = mins / 60
        let m = mins % 60
        if h == 0 { return "\(m)m" }
        return m == 0 ? "\(h)h" : "\(h)h \(m)m"
    }
}

#Preview {
    NavigationStack { WorkoutVarietyView() }
}
