import SwiftUI
import HealthKit

// MARK: - MindfulnessView

struct MindfulnessView: View {
    // Timer state
    @State private var isActive = false
    @State private var isPaused = false
    @State private var elapsed: TimeInterval = 0
    @State private var selectedMinutes: Int = 10
    @State private var sessionStart: Date?

    // History
    @State private var sessions: [HKCategorySample] = []
    @State private var isLoading = true
    @State private var isSaving = false
    @State private var saveSuccess = false

    // Live clock
    @State private var now = Date()
    let ticker = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    private let durations = [5, 10, 15, 20, 30, 45, 60]

    var target: TimeInterval { Double(selectedMinutes) * 60 }
    var currentElapsed: TimeInterval {
        guard isActive, !isPaused, let start = sessionStart else { return elapsed }
        return elapsed + Date().timeIntervalSince(start)
    }
    var progress: Double { min(currentElapsed / target, 1.0) }
    var remaining: TimeInterval { max(target - currentElapsed, 0) }
    var isComplete: Bool { currentElapsed >= target }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    timerRing
                    if !isActive { durationPicker }
                    controlSection
                    if !sessions.isEmpty { historySection }
                }
                .padding()
            }
            .background(Color.premiumBackground)
            .navigationTitle("Mindfulness")
            .toolbarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    NavigationLink(destination: MindfulnessPatternView()) {
                        Image(systemName: "chart.bar.xaxis")
                    }
                }
            }
            .task { await loadHistory() }
            .refreshable { await loadHistory() }
            .onReceive(ticker) { t in now = t }
        }
    }

    // MARK: - Timer Ring

    private var timerRing: some View {
        VStack(spacing: 16) {
            ZStack {
                // Background
                Circle()
                    .stroke(Color.teal.opacity(0.15), lineWidth: 20)

                // Progress
                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(
                        isComplete ? Color.green : Color.teal,
                        style: StrokeStyle(lineWidth: 20, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .animation(.linear(duration: 0.5), value: progress)

                // Center content
                VStack(spacing: 6) {
                    if isActive || isPaused {
                        Text(formatTime(currentElapsed))
                            .font(.system(size: 38, weight: .bold, design: .monospaced))
                            .foregroundStyle(isComplete ? .green : .primary)
                            .contentTransition(.numericText())
                            .id(now)

                        if isComplete {
                            Text("Complete! 🧘")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(.green)
                        } else {
                            Text(formatTime(remaining) + " remaining")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    } else {
                        Image(systemName: "brain.head.profile")
                            .font(.system(size: 40))
                            .foregroundStyle(.teal)
                        Text("Mindfulness")
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .frame(width: 220, height: 220)
            .padding(.top, 8)

            if saveSuccess {
                Label("Session saved to Health!", systemImage: "checkmark.circle.fill")
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(.green)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }

    // MARK: - Duration Picker

    private var durationPicker: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Duration")
                .font(.headline)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(durations, id: \.self) { min in
                        Button {
                            selectedMinutes = min
                        } label: {
                            Text("\(min)m")
                                .font(.subheadline.bold())
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(selectedMinutes == min ? Color.teal : Color.teal.opacity(0.1))
                                .foregroundStyle(selectedMinutes == min ? .white : .teal)
                                .clipShape(Capsule())
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 2)
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Controls

    private var controlSection: some View {
        VStack(spacing: 12) {
            if !isActive && !isPaused {
                Button {
                    startSession()
                } label: {
                    Label("Begin Session", systemImage: "play.fill")
                        .font(.body.bold())
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.teal)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                }
            } else {
                HStack(spacing: 12) {
                    Button {
                        togglePause()
                    } label: {
                        Label(isPaused ? "Resume" : "Pause", systemImage: isPaused ? "play.fill" : "pause.fill")
                            .font(.body.bold())
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.teal.opacity(0.1))
                            .foregroundStyle(.teal)
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                    }

                    Button(role: .destructive) {
                        Task { await endSession() }
                    } label: {
                        Label(isSaving ? "Saving…" : "Finish", systemImage: "stop.fill")
                            .font(.body.bold())
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.teal)
                            .foregroundStyle(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                    }
                    .disabled(isSaving || currentElapsed < 60)
                }
            }

            if isActive && currentElapsed < 60 {
                Text("Minimum 1 minute to save")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }

    // MARK: - History

    private var historySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Sessions")
                .font(.headline)
                .padding(.horizontal)

            VStack(spacing: 0) {
                ForEach(Array(sessions.prefix(10).enumerated()), id: \.offset) { (idx, session) in
                    let duration = session.endDate.timeIntervalSince(session.startDate)
                    HStack(spacing: 12) {
                        Image(systemName: "brain.head.profile")
                            .foregroundStyle(.teal)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(formatTime(duration))
                                .font(.subheadline.weight(.medium))
                            Text(session.startDate.formatted(date: .abbreviated, time: .shortened))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text(session.sourceRevision.source.name)
                            .font(.caption2)
                            .foregroundStyle(.tertiary)
                    }
                    .padding()
                    if idx < min(sessions.count, 10) - 1 {
                        Divider().padding(.leading, 16)
                    }
                }
            }
            .background(Color.premiumBackground)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .padding(.horizontal)
        }
    }

    // MARK: - Actions

    private func startSession() {
        sessionStart = Date()
        elapsed = 0
        isActive = true
        isPaused = false
        saveSuccess = false
        #if os(iOS)
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        #endif
    }

    private func togglePause() {
        if isPaused {
            // Resume
            sessionStart = Date()
            isPaused = false
        } else {
            // Pause — accumulate elapsed time
            if let start = sessionStart {
                elapsed += Date().timeIntervalSince(start)
            }
            sessionStart = nil
            isPaused = true
        }
        #if os(iOS)
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        #endif
    }

    private func endSession() async {
        guard currentElapsed >= 60 else { return }
        isSaving = true
        defer { isSaving = false }

        let end = Date()
        let start = end.addingTimeInterval(-currentElapsed)

        // Stop timer
        if !isPaused, let s = sessionStart {
            elapsed += Date().timeIntervalSince(s)
        }
        sessionStart = nil
        isActive = false
        isPaused = false

        // Save to HealthKit
        try? await HealthKitService.shared.saveMindfulnessSession(startDate: start, endDate: end)

        // Refresh history
        sessions = (try? await HealthKitService.shared.fetchMindfulnessSessions(days: 30)) ?? []

        withAnimation { saveSuccess = true }
        #if os(iOS)
        UINotificationFeedbackGenerator().notificationOccurred(.success)
        #endif

        // Hide success banner after 3s
        try? await Task.sleep(nanoseconds: 3_000_000_000)
        withAnimation { saveSuccess = false }
        elapsed = 0
    }

    private func loadHistory() async {
        isLoading = true
        defer { isLoading = false }
        sessions = (try? await HealthKitService.shared.fetchMindfulnessSessions(days: 30)) ?? []
    }

    private func formatTime(_ seconds: TimeInterval) -> String {
        let s = Int(seconds)
        let m = s / 60
        let sec = s % 60
        if m >= 60 {
            return String(format: "%dh %02dm", m / 60, m % 60)
        }
        return String(format: "%d:%02d", m, sec)
    }
}

#Preview {
    MindfulnessView()
}
