import SwiftUI
import Charts
import HealthKit

/// Lifetime training totals — all-time cumulative sessions, distance,
/// hours, and calories with milestone achievements.
struct LifetimeStatsView: View {

    // MARK: - Models

    private struct SportTally: Identifiable {
        let id: String
        let name: String
        let color: Color
        var sessions: Int = 0
        var totalMins: Double = 0
        var totalKm: Double = 0
        var hasDistance: Bool = false
        var pct: Double = 0
    }

    private struct YearStat: Identifiable {
        let id: Int        // year
        let year: Int
        let sessions: Int
        let hours: Double
    }

    private struct Milestone: Identifiable {
        let id: String
        let emoji: String
        let title: String
        let color: Color
    }

    // MARK: - State

    @State private var sportTallies: [SportTally] = []
    @State private var yearStats: [YearStat] = []
    @State private var milestones: [Milestone] = []
    @State private var totalSessions: Int = 0
    @State private var totalHours: Double = 0
    @State private var totalKm: Double = 0
    @State private var totalCalories: Double = 0
    @State private var totalUniqueDays: Int = 0
    @State private var firstWorkoutDate: Date? = nil
    @State private var runKm: Double = 0
    @State private var cycleKm: Double = 0
    @State private var swimKm: Double = 0
    @State private var mostActiveSport: String = "—"
    @State private var bestYear: Int? = nil
    @State private var bestYearSessions: Int = 0
    @State private var isLoading = true

    // MARK: - Body

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else {
                VStack(spacing: 16) {
                    heroCards
                    if !milestones.isEmpty { milestonesCard }
                    sportBreakdownCard
                    if yearStats.count > 1 { yearOverYearChart }
                    funFactsCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Lifetime Training")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Hero Cards

    private var heroCards: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            heroCard(emoji: "🏃", value: "\(totalSessions)", label: "Sessions", color: .teal)
            heroCard(emoji: "⏱️", value: String(format: "%.0fh", totalHours), label: "Total Hours", color: .blue)
            heroCard(emoji: "📍", value: String(format: "%.0f km", totalKm), label: "Distance", color: .orange)
            heroCard(emoji: "🔥", value: String(format: "%.0fk kcal", totalCalories / 1000), label: "Calories Burned", color: .red)
        }
    }

    private func heroCard(emoji: String, value: String, label: String, color: Color) -> some View {
        VStack(spacing: 6) {
            Text(emoji).font(.title2)
            Text(value)
                .font(.title2.bold().monospacedDigit())
                .foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(
            LinearGradient(
                colors: [Color(.systemBackground), color.opacity(0.06)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(color.opacity(0.15), lineWidth: 1))
    }

    // MARK: - Milestones

    private var milestonesCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("🏅 Milestones Achieved")
                .font(.headline)

            FlowLayout(spacing: 8) {
                ForEach(milestones) { m in
                    HStack(spacing: 4) {
                        Text(m.emoji)
                        Text(m.title)
                            .font(.caption.bold())
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(m.color.opacity(0.15))
                    .foregroundStyle(m.color)
                    .clipShape(Capsule())
                    .overlay(Capsule().stroke(m.color.opacity(0.3), lineWidth: 1))
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Sport Breakdown

    private var sportBreakdownCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("All-Time by Sport")
                .font(.headline)

            VStack(spacing: 0) {
                HStack {
                    Text("Sport").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(maxWidth: .infinity, alignment: .leading)
                    Text("Sessions").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 60, alignment: .trailing)
                    Text("Hours").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 48, alignment: .trailing)
                    Text("Km").font(.caption.weight(.semibold)).foregroundStyle(.secondary).frame(width: 48, alignment: .trailing)
                }
                .padding(.horizontal, 12).padding(.vertical, 8)

                ForEach(Array(sportTallies.enumerated()), id: \.element.id) { i, s in
                    Divider()
                    HStack {
                        HStack(spacing: 6) {
                            Circle().fill(s.color).frame(width: 8, height: 8)
                            Text(s.name).font(.caption)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        Text("\(s.sessions)")
                            .font(.caption.monospacedDigit())
                            .frame(width: 60, alignment: .trailing)
                        Text(String(format: "%.0f", s.totalMins / 60))
                            .font(.caption.monospacedDigit())
                            .frame(width: 48, alignment: .trailing)
                        Text(s.hasDistance && s.totalKm > 0 ? String(format: "%.0f", s.totalKm) : "—")
                            .font(.caption.monospacedDigit())
                            .frame(width: 48, alignment: .trailing)
                    }
                    .padding(.horizontal, 12).padding(.vertical, 8)
                    .background(i % 2 == 1 ? Color(.systemFill).opacity(0.3) : .clear)
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    // MARK: - Year-Over-Year Chart

    private var yearOverYearChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Sessions Per Year")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart(yearStats) { y in
                BarMark(
                    x: .value("Year", String(y.year)),
                    y: .value("Sessions", y.sessions)
                )
                .foregroundStyle(y.year == bestYear ? Color.teal : Color.teal.opacity(0.5))
                .cornerRadius(4)
                .annotation(position: .top) {
                    if y.year == bestYear {
                        Text("Best")
                            .font(.caption2)
                            .foregroundStyle(.teal)
                    }
                }
            }
            .frame(height: 160)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Fun Facts

    private var funFactsCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Your Training Story", systemImage: "sparkles")
                .font(.headline)
                .foregroundStyle(.teal)

            if let first = firstWorkoutDate {
                factLine("Since \(monthYearString(from: first)) — \(yearsAgo(from: first))")
            }
            factLine("Across \(totalUniqueDays) unique training days")
            factLine("Most active sport: \(mostActiveSport)")
            if runKm > 0 {
                let marathons = runKm / 42.195
                factLine(String(format: "Running: %.0f km (≈ %.1f marathons)", runKm, marathons))
            }
            if cycleKm > 0 {
                factLine(String(format: "Cycling: %.0f km", cycleKm))
            }
            if swimKm > 0 {
                factLine(String(format: "Swimming: %.0f km", swimKm))
            }
            if bestYear != nil {
                factLine("Best year: \(bestYear!) with \(bestYearSessions) sessions")
            }
        }
        .padding()
        .background(Color.teal.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func factLine(_ text: String) -> some View {
        HStack(alignment: .top, spacing: 6) {
            Text("•").font(.caption).foregroundStyle(.teal)
            Text(text).font(.caption).foregroundStyle(.secondary)
        }
    }

    private func monthYearString(from date: Date) -> String {
        let df = DateFormatter()
        df.dateFormat = "MMMM yyyy"
        return df.string(from: date)
    }

    private func yearsAgo(from date: Date) -> String {
        let years = Calendar.current.dateComponents([.year], from: date, to: Date()).year ?? 0
        if years == 0 { return "less than a year ago" }
        return "\(years) year\(years == 1 ? "" : "s") of training"
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let store = HKHealthStore()
        let workoutType = HKObjectType.workoutType()
        guard (try? await store.requestAuthorization(toShare: [], read: [workoutType])) != nil else { return }

        let pred = HKQuery.predicateForSamples(withStart: .distantPast, end: Date())

        let allWorkouts = await withCheckedContinuation { cont in
            let q = HKSampleQuery(
                sampleType: workoutType, predicate: pred, limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in
                cont.resume(returning: (s as? [HKWorkout]) ?? [])
            }
            store.execute(q)
        }

        let validWorkouts = allWorkouts.filter { $0.duration > 180 }
        guard !validWorkouts.isEmpty else { return }

        // First workout date
        firstWorkoutDate = validWorkouts.first?.startDate

        // Accumulators
        var sportMap: [String: SportTally] = [:]
        let sportColors: [String: Color] = [
            "Running": .orange, "Cycling": .blue, "Swimming": .cyan,
            "Strength": .red, "HIIT": .pink, "Hiking": .green,
            "Rowing": .purple, "Walking": .yellow, "Yoga": .indigo, "Other": .gray
        ]
        let sportsWithDist: Set<String> = ["Running", "Cycling", "Swimming", "Hiking", "Rowing", "Walking"]
        var yearBuckets: [Int: (Int, Double)] = [:]  // year → (sessions, hours)
        var uniqueDays = Set<String>()
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
        let cal = Calendar.current

        for w in validWorkouts {
            let sportGroup = classifySport(w.workoutActivityType)
            let mins = w.duration / 60
            let km = (w.totalDistance?.doubleValue(for: .meterUnit(with: .kilo))) ?? 0
            let kcal = (w.totalEnergyBurned?.doubleValue(for: .kilocalorie())) ?? 0

            if sportMap[sportGroup] == nil {
                sportMap[sportGroup] = SportTally(
                    id: sportGroup, name: sportGroup,
                    color: sportColors[sportGroup] ?? .gray,
                    hasDistance: sportsWithDist.contains(sportGroup)
                )
            }
            sportMap[sportGroup]!.sessions += 1
            sportMap[sportGroup]!.totalMins += mins
            sportMap[sportGroup]!.totalKm += km

            totalCalories += kcal
            uniqueDays.insert(df.string(from: w.startDate))

            let year = cal.component(.year, from: w.startDate)
            yearBuckets[year, default: (0, 0)].0 += 1
            yearBuckets[year, default: (0, 0)].1 += mins / 60
        }

        let orderedSports = ["Running", "Cycling", "Swimming", "Strength", "HIIT",
                             "Hiking", "Rowing", "Walking", "Yoga", "Other"]
        sportTallies = orderedSports.compactMap { name in
            guard var t = sportMap[name], t.sessions > 0 else { return nil }
            t.pct = Double(t.sessions) / Double(validWorkouts.count) * 100
            return t
        }

        totalSessions = validWorkouts.count
        totalHours = sportTallies.map(\.totalMins).reduce(0, +) / 60
        totalKm = sportTallies.map(\.totalKm).reduce(0, +)
        totalUniqueDays = uniqueDays.count
        runKm   = sportMap["Running"]?.totalKm  ?? 0
        cycleKm = sportMap["Cycling"]?.totalKm  ?? 0
        swimKm  = sportMap["Swimming"]?.totalKm ?? 0

        if let topSport = sportTallies.max(by: { $0.sessions < $1.sessions }) {
            mostActiveSport = topSport.name
        }

        yearStats = yearBuckets.sorted(by: { $0.key < $1.key })
            .map { YearStat(id: $0.key, year: $0.key, sessions: $0.value.0, hours: $0.value.1) }
        if let best = yearBuckets.max(by: { $0.value.0 < $1.value.0 }) {
            bestYear = best.key
            bestYearSessions = best.value.0
        }

        // Milestones
        var earned: [Milestone] = []
        if runKm >= 1000 { earned.append(Milestone(id: "run1000", emoji: "🏃", title: "1000km Runner", color: .orange)) }
        else if runKm >= 500 { earned.append(Milestone(id: "run500", emoji: "🏃", title: "500km Runner", color: .orange)) }
        else if runKm >= 100 { earned.append(Milestone(id: "run100", emoji: "🏃", title: "100km Runner", color: .orange)) }
        if cycleKm >= 1000 { earned.append(Milestone(id: "cycle1000", emoji: "🚴", title: "1000km Cyclist", color: .blue)) }
        else if cycleKm >= 200 { earned.append(Milestone(id: "cycle200", emoji: "🚴", title: "200km Cyclist", color: .blue)) }
        if swimKm >= 200 { earned.append(Milestone(id: "swim200", emoji: "🏊", title: "200km Swimmer", color: .cyan)) }
        else if swimKm >= 50 { earned.append(Milestone(id: "swim50", emoji: "🏊", title: "50km Swimmer", color: .cyan)) }
        if totalSessions >= 500 { earned.append(Milestone(id: "s500", emoji: "💪", title: "Iron Athlete (500+)", color: .purple)) }
        else if totalSessions >= 100 { earned.append(Milestone(id: "s100", emoji: "💪", title: "Century Athlete", color: .purple)) }
        if totalUniqueDays >= 365 { earned.append(Milestone(id: "d365", emoji: "📅", title: "Year of Training", color: .teal)) }
        if totalHours >= 1000 { earned.append(Milestone(id: "h1000", emoji: "⏱️", title: "1000h Club", color: .green)) }
        else if totalHours >= 100 { earned.append(Milestone(id: "h100", emoji: "⏱️", title: "100h Athlete", color: .green)) }
        milestones = earned
    }

    private func classifySport(_ type: HKWorkoutActivityType) -> String {
        switch type {
        case .running:                           return "Running"
        case .cycling:                           return "Cycling"
        case .swimming:                          return "Swimming"
        case .traditionalStrengthTraining, .functionalStrengthTraining, .coreTraining, .crossTraining:
                                                 return "Strength"
        case .highIntensityIntervalTraining:     return "HIIT"
        case .hiking:                            return "Hiking"
        case .rowing, .paddleSports:             return "Rowing"
        case .walking:                           return "Walking"
        case .yoga, .mindAndBody:                return "Yoga"
        default:                                 return "Other"
        }
    }
}

// MARK: - FlowLayout (simple wrapping HStack)

private struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        var x: CGFloat = 0, y: CGFloat = 0, rowHeight: CGFloat = 0

        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if x + size.width > maxWidth && x > 0 {
                y += rowHeight + spacing
                x = 0; rowHeight = 0
            }
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
        return CGSize(width: maxWidth, height: y + rowHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX, y = bounds.minY, rowHeight: CGFloat = 0

        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX && x > bounds.minX {
                y += rowHeight + spacing
                x = bounds.minX; rowHeight = 0
            }
            view.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}

#Preview {
    NavigationStack { LifetimeStatsView() }
}
