import SwiftUI
import HealthKit

// MARK: - WorkoutCalendarView
/// Monthly calendar showing workout types per day, with navigation and summary stats.
struct WorkoutCalendarView: View {

    @State private var workoutsByDate: [String: [CalWorkout]] = [:]
    @State private var displayDate: Date = Date()
    @State private var selectedDate: String? = nil
    @State private var isLoading = true

    private let healthStore = HKHealthStore()
    private let cal = Calendar.current

    // MARK: - Model

    struct CalWorkout: Identifiable {
        let id: UUID
        let type: HKWorkoutActivityType
        let typeName: String
        let durationMins: Double
        let distanceKm: Double?
        let calories: Double?
        let startDate: Date
    }

    // MARK: - Computed

    private var displayYear: Int { cal.component(.year, from: displayDate) }
    private var displayMonth: Int { cal.component(.month, from: displayDate) }

    private var monthPrefix: String {
        "\(displayYear)-\(String(format: "%02d", displayMonth))"
    }

    private var monthWorkouts: [CalWorkout] {
        workoutsByDate.filter { $0.key.hasPrefix(monthPrefix) }
            .values.flatMap { $0 }
    }

    private var monthStats: (count: Int, mins: Double, km: Double, cal: Double) {
        let ws = monthWorkouts
        return (
            count: ws.count,
            mins: ws.reduce(0) { $0 + $1.durationMins },
            km: ws.compactMap(\.distanceKm).reduce(0, +),
            cal: ws.compactMap(\.calories).reduce(0, +)
        )
    }

    private var streak: Int {
        var s = 0
        var d = Date()
        while true {
            let key = dateKey(d)
            if let w = workoutsByDate[key], !w.isEmpty { s += 1 }
            else { break }
            guard let prev = cal.date(byAdding: .day, value: -1, to: d) else { break }
            d = prev
        }
        return s
    }

    // Calendar grid
    private var gridDays: [(date: String?, day: Int?)] {
        var firstComponents = DateComponents()
        firstComponents.year = displayYear
        firstComponents.month = displayMonth
        firstComponents.day = 1
        guard let firstDay = cal.date(from: firstComponents) else { return [] }
        let weekday = cal.component(.weekday, from: firstDay) - 1  // 0=Sun
        let daysInMonth = cal.range(of: .day, in: .month, for: firstDay)!.count

        var cells: [(date: String?, day: Int?)] = Array(repeating: (nil, nil), count: weekday)
        for d in 1...daysInMonth {
            let key = "\(displayYear)-\(String(format: "%02d", displayMonth))-\(String(format: "%02d", d))"
            cells.append((date: key, day: d))
        }
        return cells
    }

    // MARK: - Zone colors per activity type

    static func color(for typeName: String) -> Color {
        switch typeName {
        case "Running":           return .orange
        case "Cycling":          return .blue
        case "Swimming":         return .cyan
        case "Strength Training": return .red
        case "HIIT":             return .pink
        case "Hiking":           return .green
        case "Walking":          return Color(red: 0.6, green: 0.8, blue: 0.2)
        case "Yoga":             return .purple
        case "Rowing":           return Color(red: 0.1, green: 0.6, blue: 0.9)
        default:                 return .indigo
        }
    }

    private func dateKey(_ date: Date) -> String {
        let c = cal.dateComponents([.year, .month, .day], from: date)
        return "\(c.year ?? 0)-\(String(format: "%02d", c.month ?? 0))-\(String(format: "%02d", c.day ?? 0))"
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if workoutsByDate.isEmpty {
                    emptyState
                } else {
                    statsCards
                    if streak >= 2 { streakBanner }
                    calendarCard
                    if let sel = selectedDate { dayDetailCard(date: sel) }
                    legendCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Training Calendar")
        .toolbarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Stats Cards

    private var statsCards: some View {
        let s = monthStats
        let monthName = DateFormatter().monthSymbols[displayMonth - 1]
        return VStack(alignment: .leading, spacing: 8) {
            Text("\(monthName) \(displayYear)")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.secondary)
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 2), spacing: 10) {
                CalStatCard(value: "\(s.count)", label: "Workouts", color: .purple)
                CalStatCard(value: fmtDuration(s.mins), label: "Total Time", color: .blue)
                CalStatCard(value: s.km > 0 ? String(format: "%.1f km", s.km) : "—", label: "Distance", color: .green)
                CalStatCard(value: s.cal > 0 ? "\(Int(s.cal))" : "—", label: "Calories", color: .orange)
            }
        }
    }

    private var streakBanner: some View {
        HStack(spacing: 12) {
            Text("🔥")
                .font(.title2)
            VStack(alignment: .leading, spacing: 2) {
                Text("\(streak)-day training streak")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.orange)
                Text("Keep it going!")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color.orange.opacity(0.08))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.orange.opacity(0.2)))
        .cornerRadius(14)
    }

    // MARK: - Calendar Card

    private var calendarCard: some View {
        VStack(spacing: 12) {
            // Month nav
            HStack {
                Button { shiftMonth(-1) } label: {
                    Image(systemName: "chevron.left")
                        .font(.subheadline.weight(.semibold))
                        .padding(8)
                }
                Spacer()
                Text(monthLabel)
                    .font(.subheadline.weight(.semibold))
                Spacer()
                Button { shiftMonth(1) } label: {
                    Image(systemName: "chevron.right")
                        .font(.subheadline.weight(.semibold))
                        .padding(8)
                }
                .disabled(displayMonth == cal.component(.month, from: Date()) && displayYear == cal.component(.year, from: Date()))
            }
            .foregroundStyle(.primary)

            // Day headers
            HStack {
                ForEach(["S","M","T","W","T","F","S"], id: \.self) { d in
                    Text(d)
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity)
                }
            }

            // Grid
            let cols = Array(repeating: GridItem(.flexible(), spacing: 4), count: 7)
            LazyVGrid(columns: cols, spacing: 4) {
                ForEach(Array(gridDays.enumerated()), id: \.offset) { _, cell in
                    if let dateStr = cell.date, let day = cell.day {
                        calCell(dateStr: dateStr, day: day)
                    } else {
                        Color.clear.frame(height: 52)
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(16)
    }

    private var monthLabel: String {
        let df = DateFormatter()
        df.dateFormat = "MMMM yyyy"
        return df.string(from: displayDate)
    }

    @ViewBuilder
    private func calCell(dateStr: String, day: Int) -> some View {
        let ws = workoutsByDate[dateStr] ?? []
        let isToday = dateStr == dateKey(Date())
        let isSelected = selectedDate == dateStr

        Button {
            withAnimation(.easeInOut(duration: 0.15)) {
                selectedDate = isSelected ? nil : dateStr
            }
        } label: {
            VStack(spacing: 2) {
                Text("\(day)")
                    .font(.caption.weight(isToday ? .bold : .regular))
                    .foregroundStyle(isToday ? Color.purple : (ws.isEmpty ? Color.secondary : Color.primary))

                // Dots (max 3)
                HStack(spacing: 2) {
                    ForEach(ws.prefix(3), id: \.id) { w in
                        Circle()
                            .fill(Self.color(for: w.typeName))
                            .frame(width: 6, height: 6)
                    }
                }
                .frame(height: 8)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 52)
            .background(
                isSelected ? Color.purple.opacity(0.15) :
                (isToday ? Color.purple.opacity(0.06) : Color.clear)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(isSelected ? Color.purple.opacity(0.5) : (isToday ? Color.purple.opacity(0.3) : Color.clear))
            )
            .cornerRadius(8)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Day Detail

    @ViewBuilder
    private func dayDetailCard(date: String) -> some View {
        let ws = workoutsByDate[date] ?? []
        let df: DateFormatter = { let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; return f }()
        let label = df.date(from: date).map {
            $0.formatted(.dateTime.weekday(.wide).month(.wide).day())
        } ?? date

        VStack(alignment: .leading, spacing: 12) {
            Text(label)
                .font(.subheadline.weight(.semibold))

            if ws.isEmpty {
                HStack(spacing: 8) {
                    Image(systemName: "bed.double.fill")
                        .foregroundStyle(.secondary)
                    Text("Rest day")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            } else {
                ForEach(ws) { w in
                    HStack(spacing: 12) {
                        Circle()
                            .fill(Self.color(for: w.typeName))
                            .frame(width: 10, height: 10)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(w.typeName)
                                .font(.caption.weight(.medium))
                            HStack(spacing: 8) {
                                if w.durationMins > 0 {
                                    Text(fmtDuration(w.durationMins))
                                }
                                if let km = w.distanceKm {
                                    Text(String(format: "%.1f km", km))
                                }
                                if let cal = w.calories {
                                    Text("\(Int(cal)) kcal")
                                }
                            }
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                        }
                    }
                    if w.id != ws.last?.id { Divider() }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(16)
    }

    // MARK: - Legend

    private var legendCard: some View {
        let types = ["Running", "Cycling", "Swimming", "Strength Training", "HIIT", "Hiking", "Walking", "Yoga"]
        return VStack(alignment: .leading, spacing: 8) {
            Text("Workout Types")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 6) {
                ForEach(types, id: \.self) { t in
                    HStack(spacing: 6) {
                        Circle().fill(Self.color(for: t)).frame(width: 8, height: 8)
                        Text(t).font(.caption2).foregroundStyle(.secondary)
                        Spacer()
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(16)
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "calendar.badge.clock")
                .font(.system(size: 44))
                .foregroundStyle(.secondary)
            Text("No workouts found")
                .font(.headline)
            Text("Log workouts in the Health app to see your training calendar.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(40)
    }

    // MARK: - Helpers

    private func shiftMonth(_ delta: Int) {
        withAnimation {
            if let newDate = cal.date(byAdding: .month, value: delta, to: displayDate) {
                displayDate = newDate
                selectedDate = nil
            }
        }
    }

    private func fmtDuration(_ mins: Double) -> String {
        let m = Int(mins)
        return m >= 60 ? "\(m / 60)h \(m % 60)m" : "\(m)m"
    }

    // MARK: - Data Loading

    private func loadData() async {
        guard !isLoading else { return }
        isLoading = true
        defer { isLoading = false }

        let sixMonthsAgo = cal.date(byAdding: .month, value: -6, to: Date()) ?? Date()
        let predicate = HKQuery.predicateForSamples(withStart: sixMonthsAgo, end: Date(), options: .strictStartDate)
        let descriptor = HKSampleQueryDescriptor(
            predicates: [.workout(predicate)],
            sortDescriptors: [SortDescriptor(\HKWorkout.startDate)]
        )

        do {
            let workouts = try await descriptor.result(for: HKHealthStore())
            var byDate: [String: [CalWorkout]] = [:]
            for w in workouts {
                let key = dateKey(w.startDate)
                let typeName = w.workoutActivityType.displayName
                let distanceKm = (w.totalDistance?.doubleValue(for: .meter()) ?? 0) / 1000
                let entry = CalWorkout(
                    id: w.uuid,
                    type: w.workoutActivityType,
                    typeName: typeName,
                    durationMins: w.duration / 60,
                    distanceKm: distanceKm > 0 ? distanceKm : nil,
                    calories: w.totalEnergyBurned?.doubleValue(for: .kilocalorie()),
                    startDate: w.startDate
                )
                byDate[key, default: []].append(entry)
            }
            await MainActor.run { workoutsByDate = byDate }
        } catch {
            // HealthKit not available
        }
    }
}

// MARK: - Supporting view

struct CalStatCard: View {
    let value: String
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title3.bold())
                .foregroundStyle(color)
                .lineLimit(1).minimumScaleFactor(0.7)
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

// MARK: - HKWorkoutActivityType display name

extension HKWorkoutActivityType {
    var displayName: String {
        switch self {
        case .running:           return "Running"
        case .cycling:           return "Cycling"
        case .swimming:          return "Swimming"
        case .traditionalStrengthTraining, .functionalStrengthTraining: return "Strength Training"
        case .highIntensityIntervalTraining: return "HIIT"
        case .hiking:            return "Hiking"
        case .walking:           return "Walking"
        case .yoga:              return "Yoga"
        case .pilates:           return "Pilates"
        case .rowing:            return "Rowing"
        case .dance:             return "Dance"
        case .mindAndBody:       return "Mindfulness"
        case .crossTraining:     return "Cross Training"
        case .elliptical:        return "Elliptical"
        default:                 return "Workout"
        }
    }
}

#Preview {
    NavigationStack {
        WorkoutCalendarView()
    }
}
