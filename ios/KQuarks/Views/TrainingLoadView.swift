import SwiftUI
import Charts
import HealthKit

// MARK: - TrainingLoadView

/// Shows weekly training load, acute:chronic ratio, and recovery zone guidance.
struct TrainingLoadView: View {
    @State private var weeks: [WeekLoad] = []
    @State private var acwr: Double = 1.0
    @State private var isLoading = false

    private let healthKit = HealthKitService.shared

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if weeks.isEmpty {
                    emptyState
                } else {
                    acwrCard
                    weeklyChart
                    weekBreakdownList
                    infoCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Training Load")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - ACWR Card

    private var acwrCard: some View {
        let zone = ACWRZone.from(acwr)
        return VStack(spacing: 12) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Acute:Chronic Ratio")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.2f", acwr))
                            .font(.system(size: 44, weight: .bold, design: .rounded))
                            .foregroundStyle(zone.color)
                        Text("ACWR")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .padding(.bottom, 6)
                    }
                    Text(zone.label)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(zone.color)
                }
                Spacer()
                Image(systemName: zone.icon)
                    .font(.system(size: 40))
                    .foregroundStyle(zone.color)
            }

            Text(zone.advice)
                .font(.caption)
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)

            // ACWR gauge bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    LinearGradient(
                        colors: [.green, .green, .yellow, .orange, .red],
                        startPoint: .leading, endPoint: .trailing
                    )
                    .frame(height: 8)
                    .clipShape(RoundedRectangle(cornerRadius: 4))

                    let pos = min(max(acwr / 2.0, 0), 1.0)
                    Circle()
                        .fill(.white)
                        .frame(width: 14, height: 14)
                        .shadow(radius: 2)
                        .offset(x: geo.size.width * pos - 7)
                }
            }
            .frame(height: 14)

            HStack {
                Text("0.0")
                Spacer()
                Text("0.8")
                Spacer()
                Text("1.3")
                Spacer()
                Text("2.0")
            }
            .font(.caption2)
            .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Weekly Chart

    private var weeklyChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weekly Training Volume")
                .font(.headline)
                .padding(.horizontal, 4)

            Chart {
                ForEach(weeks) { week in
                    BarMark(
                        x: .value("Week", week.weekLabel),
                        y: .value("Load", week.totalLoad)
                    )
                    .foregroundStyle(ACWRZone.from(acwr).color.opacity(0.7))
                    .cornerRadius(4)
                }
            }
            .chartYAxisLabel("Arbitrary Load Units")
            .frame(height: 180)
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Week Breakdown List

    private var weekBreakdownList: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("By Week")
                .font(.headline)
                .padding(.horizontal, 4)

            VStack(spacing: 0) {
                ForEach(Array(weeks.reversed().enumerated()), id: \.offset) { idx, week in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(week.weekLabel)
                                .font(.subheadline.weight(.medium))
                            Text("\(week.workoutCount) workout\(week.workoutCount == 1 ? "" : "s") · \(fmtMinutes(week.totalMinutes))")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 2) {
                            Text("Load \(Int(week.totalLoad))")
                                .font(.caption.bold())
                                .foregroundStyle(.primary)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    if idx < weeks.count - 1 {
                        Divider().padding(.leading, 16)
                    }
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Info Card

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "info.circle.fill")
                    .foregroundStyle(.blue)
                Text("About ACWR")
                    .font(.subheadline.weight(.semibold))
            }
            Text("The Acute:Chronic Workload Ratio compares your recent training (last 7 days) to your long-term average (last 28 days). Staying between 0.8 and 1.3 minimises injury risk while allowing fitness adaptation.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "figure.mixed.cardio")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No Workout Data")
                .font(.title3.bold())
            Text("Log at least a few workouts to see your training load analysis.")
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

        let ninety = Calendar.current.date(byAdding: .day, value: -90, to: Date()) ?? Date()
        let workouts = (try? await healthKit.fetchWorkouts(from: ninety, to: Date())) ?? []
        guard !workouts.isEmpty else { return }

        // Build weekly buckets
        let cal = Calendar.current
        var weekMap: [Date: [HKWorkout]] = [:]
        for w in workouts {
            let weekStart = cal.dateInterval(of: .weekOfYear, for: w.startDate)?.start ?? w.startDate
            weekMap[weekStart, default: []].append(w)
        }

        weeks = weekMap.sorted { $0.key < $1.key }.map { (weekStart, wos) in
            let totalMins = wos.reduce(0.0) { $0 + $1.duration / 60 }
            let load = wos.reduce(0.0) { $0 + loadUnit(for: $1) }
            let label = weekStart.formatted(.dateTime.month(.abbreviated).day())
            return WeekLoad(
                id: weekStart,
                weekLabel: label,
                workoutCount: wos.count,
                totalMinutes: Int(totalMins),
                totalLoad: load
            )
        }

        // ACWR: acute = last 7 days load / 7, chronic = last 28 days load / 28
        let now = Date()
        let sevenDaysAgo = cal.date(byAdding: .day, value: -7, to: now) ?? Date()
        let twentyEightDaysAgo = cal.date(byAdding: .day, value: -28, to: now) ?? Date()

        let acuteWorkouts = workouts.filter { $0.startDate >= sevenDaysAgo }
        let chronicWorkouts = workouts.filter { $0.startDate >= twentyEightDaysAgo }

        let acuteLoad = acuteWorkouts.reduce(0.0) { $0 + loadUnit(for: $1) } / 7.0
        let chronicLoad = chronicWorkouts.reduce(0.0) { $0 + loadUnit(for: $1) } / 28.0

        acwr = chronicLoad > 0 ? acuteLoad / chronicLoad : (acuteLoad > 0 ? 1.5 : 1.0)
    }

    private func loadUnit(for workout: HKWorkout) -> Double {
        let minutes = workout.duration / 60
        let intensity = intensityFactor(for: workout.workoutActivityType)
        return minutes * intensity
    }

    private func intensityFactor(for type: HKWorkoutActivityType) -> Double {
        switch type {
        case .walking: return 1.0
        case .yoga, .pilates, .mindAndBody: return 0.8
        case .swimming, .cycling, .elliptical, .rowing: return 1.5
        case .running, .hiking: return 1.7
        case .highIntensityIntervalTraining, .crossTraining: return 2.0
        case .functionalStrengthTraining, .traditionalStrengthTraining: return 1.3
        default: return 1.2
        }
    }

    private func fmtMinutes(_ m: Int) -> String {
        let h = m / 60
        let min = m % 60
        return h > 0 ? "\(h)h \(min)m" : "\(min)m"
    }
}

// MARK: - Models

struct WeekLoad: Identifiable {
    let id: Date
    let weekLabel: String
    let workoutCount: Int
    let totalMinutes: Int
    let totalLoad: Double
}

enum ACWRZone {
    case undertrained, optimal, overreach, danger

    var label: String {
        switch self {
        case .undertrained: return "Undertrained"
        case .optimal: return "Optimal Zone"
        case .overreach: return "Overreach Risk"
        case .danger: return "High Injury Risk"
        }
    }

    var icon: String {
        switch self {
        case .undertrained: return "figure.stand"
        case .optimal: return "checkmark.seal.fill"
        case .overreach: return "exclamationmark.triangle.fill"
        case .danger: return "xmark.octagon.fill"
        }
    }

    var color: Color {
        switch self {
        case .undertrained: return .blue
        case .optimal: return .green
        case .overreach: return .orange
        case .danger: return .red
        }
    }

    var advice: String {
        switch self {
        case .undertrained:
            return "Your training load is low relative to your baseline. You can safely increase intensity or volume this week."
        case .optimal:
            return "You're in the sweet spot. Your training load supports adaptation without excessive injury risk."
        case .overreach:
            return "Your recent load is high compared to your baseline. Consider reducing intensity or adding a recovery day."
        case .danger:
            return "Your training load is very high relative to your chronic load. Prioritise recovery to avoid injury."
        }
    }

    static func from(_ acwr: Double) -> ACWRZone {
        if acwr < 0.8 { return .undertrained }
        if acwr <= 1.3 { return .optimal }
        if acwr <= 1.5 { return .overreach }
        return .danger
    }
}

#Preview {
    NavigationStack {
        TrainingLoadView()
    }
}
