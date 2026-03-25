import SwiftUI

// MARK: - HistoryView

struct HistoryView: View {
    @State private var selectedDate = Calendar.current.date(byAdding: .day, value: -1, to: Date()) ?? Date()
    @State private var summary: DailySummary?
    @State private var workouts: [WorkoutRecord] = []
    @State private var sleepRecords: [SleepRecord] = []
    @State private var isLoading = true

    private var maxDate: Date { Calendar.current.date(byAdding: .day, value: -1, to: Date()) ?? Date() }
    private var minDate: Date { Calendar.current.date(byAdding: .day, value: -365, to: Date()) ?? Date() }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Date picker
                    DatePicker(
                        "Select date",
                        selection: $selectedDate,
                        in: minDate...maxDate,
                        displayedComponents: .date
                    )
                    .datePickerStyle(.graphical)
                    .padding(.horizontal)
                    .background(Color(.systemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .padding(.horizontal)

                    if isLoading {
                        ProgressView().padding(.top, 20)
                    } else if summary == nil && workouts.isEmpty && sleepRecords.isEmpty {
                        noDataView
                    } else {
                        dayContent
                    }
                }
                .padding(.top, 8)
                .padding(.bottom, 40)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Day History")
            .toolbarTitleDisplayMode(.inline)
            .onChange(of: selectedDate) { _, _ in Task { await load() } }
            .task { await load() }
            .refreshable { await load() }
        }
    }

    // MARK: - Content

    @ViewBuilder
    private var dayContent: some View {
        VStack(spacing: 16) {
            if let s = summary {
                statsCard(s)
            }
            if !sleepRecords.isEmpty {
                sleepCard
            }
            if !workouts.isEmpty {
                workoutsCard
            }
        }
    }

    private func statsCard(_ s: DailySummary) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Activity")
                .font(.headline)
                .padding(.horizontal)
                .padding(.bottom, 8)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                if s.steps > 0 {
                    StatTile(label: "Steps", value: s.steps.formatted(), icon: "figure.walk", color: .green)
                }
                if s.activeCalories > 0 {
                    StatTile(label: "Calories", value: "\(Int(s.activeCalories)) kcal", icon: "flame.fill", color: .orange)
                }
                if s.distanceMeters > 0 {
                    StatTile(label: "Distance",
                             value: String(format: "%.1f km", s.distanceMeters / 1000),
                             icon: "map", color: .blue)
                }
                if let hrv = s.avgHrv, hrv > 0 {
                    StatTile(label: "HRV", value: "\(Int(hrv)) ms", icon: "waveform.path.ecg", color: .purple)
                }
                if let hr = s.restingHeartRate, hr > 0 {
                    StatTile(label: "Resting HR", value: "\(hr) bpm", icon: "heart.fill", color: .red)
                }
                if let rec = s.recoveryScore, rec > 0 {
                    StatTile(label: "Recovery", value: "\(rec)%", icon: "arrow.counterclockwise", color: .teal)
                }
            }
            .padding(.horizontal)
        }
        .padding(.vertical, 16)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .padding(.horizontal)
    }

    private var sleepCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Sleep")
                .font(.headline)
                .padding(.horizontal)

            ForEach(sleepRecords) { record in
                let totalMin = record.durationMinutes
                let h = totalMin / 60
                let m = totalMin % 60
                VStack(spacing: 8) {
                    HStack {
                        Label(String(format: "%dh %dm", h, m), systemImage: "moon.fill")
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(.indigo)
                        Spacer()
                        Text("\(record.startTime.formatted(date: .omitted, time: .shortened)) – \(record.endTime.formatted(date: .omitted, time: .shortened))")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    if let deep = record.deepMinutes, let rem = record.remMinutes {
                        HStack(spacing: 16) {
                            HistorySleepStagePill(label: "Deep", minutes: deep, color: .indigo)
                            HistorySleepStagePill(label: "REM", minutes: rem, color: .blue)
                            if let core = record.coreMinutes {
                                HistorySleepStagePill(label: "Core", minutes: core, color: .cyan)
                            }
                        }
                    }
                }
                .padding(.horizontal)
            }
        }
        .padding(.vertical, 16)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .padding(.horizontal)
    }

    private var workoutsCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Workouts")
                .font(.headline)
                .padding(.horizontal)
                .padding(.bottom, 8)

            VStack(spacing: 0) {
                ForEach(Array(workouts.enumerated()), id: \.offset) { idx, workout in
                    HStack(spacing: 12) {
                        Image(systemName: workoutIcon(workout.workoutType))
                            .font(.title3)
                            .foregroundStyle(.orange)
                            .frame(width: 32)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(workout.workoutType)
                                .font(.subheadline.weight(.medium))
                            Text("\(workout.durationMinutes)min" +
                                (workout.activeCalories.map { " · \(Int($0)) kcal" } ?? "") +
                                (workout.distanceMeters.flatMap { $0 > 0 ? String(format: " · %.1f km", $0 / 1000) : nil } ?? ""))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        if let hr = workout.avgHeartRate {
                            Label("\(hr)", systemImage: "heart.fill")
                                .font(.caption)
                                .foregroundStyle(.red)
                        }
                    }
                    .padding()
                    if idx < workouts.count - 1 {
                        Divider().padding(.leading, 56)
                    }
                }
            }
        }
        .padding(.vertical, 16)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .padding(.horizontal)
    }

    private var noDataView: some View {
        VStack(spacing: 12) {
            Image(systemName: "calendar.badge.exclamationmark")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No data for this day")
                .font(.title3.bold())
            Text("Sync your health data to see historical records.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
        .padding(.top, 40)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        async let s = SupabaseService.shared.fetchDailySummary(for: selectedDate)
        async let w = SupabaseService.shared.fetchWorkoutRecords(for: selectedDate)
        async let sl = SupabaseService.shared.fetchSleepRecords(for: selectedDate)
        summary = try? await s
        workouts = (try? await w) ?? []
        sleepRecords = (try? await sl) ?? []
    }

    private func workoutIcon(_ type: String) -> String {
        let t = type.lowercased()
        if t.contains("run") { return "figure.run" }
        if t.contains("walk") { return "figure.walk" }
        if t.contains("cycl") || t.contains("bike") { return "bicycle" }
        if t.contains("swim") { return "figure.pool.swim" }
        if t.contains("yoga") { return "figure.yoga" }
        if t.contains("hiit") { return "bolt.fill" }
        return "figure.strengthtraining.traditional"
    }
}

// MARK: - Sub-components

private struct StatTile: View {
    let label: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.caption)
                    .foregroundStyle(color)
                Text(label)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Text(value)
                .font(.title3.bold())
                .foregroundStyle(.primary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(color.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

private struct HistorySleepStagePill: View {
    let label: String
    let minutes: Int
    let color: Color

    var body: some View {
        VStack(spacing: 2) {
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
            Text(minutes >= 60
                 ? String(format: "%dh%dm", minutes / 60, minutes % 60)
                 : "\(minutes)m")
                .font(.caption.bold())
                .foregroundStyle(color)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(color.opacity(0.1))
        .clipShape(Capsule())
    }
}

#Preview {
    HistoryView()
}
