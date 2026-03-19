import SwiftUI

// MARK: - FastingView

struct FastingView: View {
    @State private var isActive = false
    @State private var elapsedHours: Double = 0
    @State private var targetHours: Int = 16
    @State private var startedAt: Date?
    @State private var isLoading = false
    @State private var isStarting = false
    @State private var isEnding = false
    @State private var showStartSheet = false
    @State private var selectedProtocol: FastProtocol = .sixteen_eight
    @State private var history: [FastSession] = []

    // Live clock
    @State private var now: Date = Date()
    let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var currentElapsed: Double {
        guard let start = startedAt else { return elapsedHours }
        return Date().timeIntervalSince(start) / 3600
    }

    var progress: Double {
        targetHours > 0 ? min(currentElapsed / Double(targetHours), 1.0) : 0
    }

    var remaining: Double { max(Double(targetHours) - currentElapsed, 0) }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    if isLoading {
                        ProgressView().padding(.top, 60)
                    } else {
                        // Main timer ring
                        timerRing

                        // Protocol info / controls
                        controlSection

                        // History
                        if !history.isEmpty {
                            historySection
                        }
                    }
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Fasting")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                NavigationLink(destination: FastingInsightsView()) {
                    Image(systemName: "chart.bar.xaxis")
                }
            }
            .task { await load() }
            .onReceive(timer) { t in now = t }
            .sheet(isPresented: $showStartSheet) {
                startSheet
            }
        }
    }

    // MARK: - Timer ring

    private var timerRing: some View {
        VStack(spacing: 16) {
            ZStack {
                // Background ring
                Circle()
                    .stroke(Color.orange.opacity(0.15), lineWidth: 20)

                // Progress ring
                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(
                        progress >= 1 ? Color.green : Color.orange,
                        style: StrokeStyle(lineWidth: 20, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .animation(.linear(duration: 0.5), value: progress)

                VStack(spacing: 6) {
                    if isActive {
                        Text(formatDuration(currentElapsed * 3600))
                            .font(.system(size: 38, weight: .bold, design: .monospaced))
                            .foregroundStyle(progress >= 1 ? .green : .primary)
                            .contentTransition(.numericText())
                            .id(now) // force refresh every second
                        Text("/ \(targetHours)h")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        if progress >= 1 {
                            Text("Goal reached! 🎉")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(.green)
                        } else {
                            Text("\(formatDuration(remaining * 3600)) remaining")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    } else {
                        Text("Not Fasting")
                            .font(.title2.bold())
                            .foregroundStyle(.secondary)
                        Text("Tap Start to begin")
                            .font(.subheadline)
                            .foregroundStyle(.tertiary)
                    }
                }
            }
            .frame(width: 220, height: 220)
            .padding(.top, 8)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }

    // MARK: - Controls

    private var controlSection: some View {
        VStack(spacing: 12) {
            if isActive {
                // Protocol badge
                HStack {
                    Image(systemName: "timer")
                        .foregroundStyle(.orange)
                    Text("\(targetHours):00 protocol")
                        .font(.subheadline.weight(.medium))
                    Spacer()
                    if let start = startedAt {
                        Text("Started \(start.formatted(.relative(presentation: .named)))")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                .padding()
                .background(Color.orange.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: 12))

                // End button
                Button(role: .destructive) {
                    Task { await endFast() }
                } label: {
                    HStack {
                        if isEnding { ProgressView().tint(.white) }
                        Text(isEnding ? "Ending…" : "End Fast")
                            .font(.body.bold())
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.orange)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                }
                .disabled(isEnding)

            } else {
                // Start button
                Button {
                    showStartSheet = true
                } label: {
                    HStack {
                        if isStarting { ProgressView().tint(.white) }
                        Label(isStarting ? "Starting…" : "Start Fasting", systemImage: "timer")
                            .font(.body.bold())
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.orange)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                }
                .disabled(isStarting)
            }
        }
    }

    // MARK: - Start sheet

    private var startSheet: some View {
        NavigationStack {
            Form {
                Section("Protocol") {
                    ForEach(FastProtocol.allCases, id: \.self) { proto in
                        Button {
                            selectedProtocol = proto
                        } label: {
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(proto.title).font(.body).foregroundStyle(.primary)
                                    Text(proto.description).font(.caption).foregroundStyle(.secondary)
                                }
                                Spacer()
                                if selectedProtocol == proto {
                                    Image(systemName: "checkmark").foregroundStyle(.accentColor)
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Start Fast")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { showStartSheet = false } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Start") {
                        showStartSheet = false
                        Task { await startFast() }
                    }
                }
            }
        }
        .presentationDetents([.medium])
    }

    // MARK: - History

    private var historySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Fasts")
                .font(.headline)
                .padding(.horizontal)

            VStack(spacing: 0) {
                ForEach(Array(history.prefix(10).enumerated()), id: \.offset) { i, session in
                    HStack(spacing: 12) {
                        Image(systemName: session.completed ? "checkmark.circle.fill" : "xmark.circle")
                            .foregroundStyle(session.completed ? .green : .secondary)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(session.protocol)
                                .font(.subheadline.weight(.medium))
                            Text(session.startedAt.formatted(date: .abbreviated, time: .shortened))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        if let hours = session.actualHours {
                            Text(String(format: "%.1fh", hours))
                                .font(.subheadline.bold())
                                .foregroundStyle(session.completed ? .green : .secondary)
                        }
                    }
                    .padding()
                    if i < min(history.count, 10) - 1 {
                        Divider().padding(.leading, 16)
                    }
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .padding(.horizontal)
        }
    }

    // MARK: - Actions

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            let status = try await SupabaseService.shared.getFastingStatus()
            isActive = status.isActive
            elapsedHours = status.elapsedHours
            targetHours = status.targetHours > 0 ? status.targetHours : 16
            if isActive {
                let start = Calendar.current.date(byAdding: .second, value: -Int(elapsedHours * 3600), to: Date())
                startedAt = start
                // Re-schedule milestone notifications in case they were cleared (app restart, etc.)
                if let start {
                    NotificationService.shared.scheduleFastingMilestones(targetHours: targetHours, startedAt: start)
                }
            }
            history = try await SupabaseService.shared.getFastingHistory(limit: 10)
        } catch { }
    }

    private func startFast() async {
        isStarting = true
        defer { isStarting = false }
        do {
            let start = Date()
            try await SupabaseService.shared.startFasting(protocolName: selectedProtocol.protocolName, targetHours: selectedProtocol.hours)
            targetHours = selectedProtocol.hours
            startedAt = start
            isActive = true
            elapsedHours = 0
            NotificationService.shared.scheduleFastingMilestones(targetHours: selectedProtocol.hours, startedAt: start)
        } catch { }
    }

    private func endFast() async {
        isEnding = true
        defer { isEnding = false }
        do {
            _ = try await SupabaseService.shared.endFasting()
            NotificationService.shared.cancelFastingNotifications()
            isActive = false
            elapsedHours = 0
            startedAt = nil
            history = try await SupabaseService.shared.getFastingHistory(limit: 10)
        } catch { }
    }

    private func formatDuration(_ seconds: Double) -> String {
        let total = Int(seconds)
        let h = total / 3600
        let m = (total % 3600) / 60
        let s = total % 60
        if h > 0 { return String(format: "%d:%02d:%02d", h, m, s) }
        return String(format: "%02d:%02d", m, s)
    }
}

// MARK: - Protocol enum

enum FastProtocol: CaseIterable {
    case sixteen_eight, eighteen_six, twenty_four, omad

    var title: String {
        switch self {
        case .sixteen_eight: return "16:8"
        case .eighteen_six: return "18:6"
        case .twenty_four: return "24h"
        case .omad: return "OMAD (23:1)"
        }
    }

    var description: String {
        switch self {
        case .sixteen_eight: return "Fast 16h, eat within 8h window"
        case .eighteen_six: return "Fast 18h, eat within 6h window"
        case .twenty_four: return "24-hour water fast"
        case .omad: return "One meal a day — 23h fast"
        }
    }

    var hours: Int {
        switch self {
        case .sixteen_eight: return 16
        case .eighteen_six: return 18
        case .twenty_four: return 24
        case .omad: return 23
        }
    }

    var protocolName: String {
        switch self {
        case .sixteen_eight: return "16:8"
        case .eighteen_six: return "18:6"
        case .twenty_four: return "24:0"
        case .omad: return "OMAD"
        }
    }
}

// MARK: - FastSession model

struct FastSession: Decodable {
    let id: String
    let `protocol`: String
    let target_hours: Int
    let started_at: String
    let ended_at: String?
    let actual_hours: Double?
    let completed: Bool?

    var startedAt: Date {
        ISO8601DateFormatter().date(from: started_at) ?? Date()
    }

    var actualHours: Double? { actual_hours }
}

#Preview {
    FastingView()
}
