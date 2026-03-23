import SwiftUI
import HealthKit

struct RecordsView: View {
    @State private var isLoading = true
    @State private var bestSteps: (value: Int, date: Date)?
    @State private var bestHRV: (value: Double, date: Date)?
    @State private var longestWorkout: HKWorkout?
    @State private var mostCaloriesWorkout: HKWorkout?
    @State private var longestDistanceWorkout: HKWorkout?
    @State private var totalSteps: Int = 0
    @State private var totalCalories: Int = 0

    private let healthKit = HealthKitService.shared

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, minHeight: 200)
            } else {
                VStack(spacing: 20) {
                    lifetimeTotalsSection
                    dailyBestsSection
                    workoutBestsSection
                }
                .padding()
            }
        }
        .navigationTitle("Personal Records")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadRecords() }
        .refreshable { await loadRecords() }
    }

    // MARK: - Sections

    private var lifetimeTotalsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            sectionHeader("Lifetime Totals")
            HStack(spacing: 0) {
                TotalBubble(label: "Steps", value: totalSteps > 0 ? totalSteps.formatted() : "—")
                Divider().frame(height: 40)
                TotalBubble(label: "Calories", value: totalCalories > 0 ? "\(totalCalories.formatted()) kcal" : "—")
            }
            .background(Color(.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    private var dailyBestsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            sectionHeader("Daily Bests")
            VStack(spacing: 1) {
                if let best = bestSteps {
                    RecordRowView(
                        icon: "figure.walk",
                        label: "Most Steps",
                        value: best.value.formatted(),
                        date: best.date,
                        color: .green
                    )
                }
                if let best = bestHRV {
                    RecordRowView(
                        icon: "waveform.path.ecg",
                        label: "Best HRV",
                        value: "\(Int(best.value)) ms",
                        date: best.date,
                        color: .purple
                    )
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    private var workoutBestsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            sectionHeader("Workout Bests")
            VStack(spacing: 1) {
                if let w = longestWorkout {
                    RecordRowView(
                        icon: "clock",
                        label: "Longest Workout",
                        value: formatDuration(w.duration),
                        subtitle: w.workoutActivityType.name,
                        date: w.startDate,
                        color: .orange
                    )
                }
                if let w = mostCaloriesWorkout {
                    let cal = Int(w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0)
                    RecordRowView(
                        icon: "flame.fill",
                        label: "Most Calories",
                        value: "\(cal) kcal",
                        subtitle: w.workoutActivityType.name,
                        date: w.startDate,
                        color: .red
                    )
                }
                if let w = longestDistanceWorkout {
                    let km = (w.totalDistance?.doubleValue(for: .meter()) ?? 0) / 1000
                    RecordRowView(
                        icon: "map",
                        label: "Longest Distance",
                        value: String(format: "%.2f km", km),
                        subtitle: w.workoutActivityType.name,
                        date: w.startDate,
                        color: .blue
                    )
                }
                if longestWorkout == nil && mostCaloriesWorkout == nil && longestDistanceWorkout == nil {
                    Text("No workout data yet")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .padding()
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    private func sectionHeader(_ title: String) -> some View {
        Text(title.uppercased())
            .font(.caption)
            .fontWeight(.semibold)
            .foregroundStyle(.secondary)
            .tracking(0.5)
    }

    // MARK: - Data Loading

    private func loadRecords() async {
        isLoading = true
        let calendar = Calendar.current
        let oneYearAgo = calendar.date(byAdding: .year, value: -1, to: Date()) ?? Date()

        // Fetch 365-day summaries for daily bests
        let summaries = (try? await healthKit.fetchWeekSummaries(days: 365)) ?? []
        let maxSteps = summaries.max(by: { $0.steps < $1.steps })
        let maxHRV = summaries.compactMap { s -> (Double, String)? in
            guard let hrv = s.avgHrv, hrv > 0 else { return nil }
            return (hrv, s.date)
        }.max(by: { $0.0 < $1.0 })

        // Parse date string to Date
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withFullDate]

        await MainActor.run {
            if let ms = maxSteps, ms.steps > 0, let d = iso.date(from: ms.date) {
                bestSteps = (ms.steps, d)
            }
            if let (hrv, dateStr) = maxHRV, let d = iso.date(from: dateStr) {
                bestHRV = (hrv, d)
            }
            totalSteps = summaries.reduce(0) { $0 + $1.steps }
            totalCalories = Int(summaries.reduce(0) { $0 + $1.activeCalories })
        }

        // Fetch workouts for the past year
        let workouts = (try? await healthKit.fetchWorkouts(from: oneYearAgo, to: Date())) ?? []

        let longest = workouts.max(by: { $0.duration < $1.duration })
        let mostCal = workouts
            .filter { ($0.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0) > 0 }
            .max(by: { ($0.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0) < ($1.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0) })
        let longestDist = workouts
            .filter { ($0.totalDistance?.doubleValue(for: .meter()) ?? 0) > 0 }
            .max(by: { ($0.totalDistance?.doubleValue(for: .meter()) ?? 0) < ($1.totalDistance?.doubleValue(for: .meter()) ?? 0) })

        await MainActor.run {
            longestWorkout = longest
            mostCaloriesWorkout = mostCal
            longestDistanceWorkout = longestDist
            isLoading = false
        }
    }

    private func formatDuration(_ seconds: TimeInterval) -> String {
        let h = Int(seconds) / 3600
        let m = (Int(seconds) % 3600) / 60
        return h > 0 ? "\(h)h \(m)m" : "\(m)m"
    }
}

// MARK: - Subviews

struct RecordRowView: View {
    let icon: String
    let label: String
    let value: String
    var subtitle: String? = nil
    let date: Date
    let color: Color

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundStyle(color)
                .frame(width: 28, height: 28)

            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.subheadline)
                    .fontWeight(.medium)
                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text(value)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(color)
                Text(date, style: .date)
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }
}

struct TotalBubble: View {
    let label: String
    let value: String

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.headline.monospacedDigit())
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
    }
}

#Preview {
    NavigationStack {
        RecordsView()
    }
}
