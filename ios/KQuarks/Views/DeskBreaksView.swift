import SwiftUI

// MARK: - Models

enum BreakType: String, CaseIterable, Identifiable {
    case twoTwentyTwenty = "20-20-20"
    case standUp = "Stand Up"
    case stretch = "Stretch"
    case walk = "Short Walk"
    case water = "Hydrate"

    var id: String { rawValue }
    var icon: String {
        switch self {
        case .twoTwentyTwenty: return "eye.fill"
        case .standUp:         return "figure.stand"
        case .stretch:         return "figure.flexibility"
        case .walk:            return "figure.walk"
        case .water:           return "drop.fill"
        }
    }
    var color: Color {
        switch self {
        case .twoTwentyTwenty: return .teal
        case .standUp:         return .blue
        case .stretch:         return .purple
        case .walk:            return .green
        case .water:           return Color(red: 0.2, green: 0.6, blue: 1.0)
        }
    }
    var durationMinutes: Int {
        switch self {
        case .twoTwentyTwenty: return 0  // 20 seconds, but reminder interval
        case .standUp:         return 1
        case .stretch:         return 2
        case .walk:            return 5
        case .water:           return 1
        }
    }
    var description: String {
        switch self {
        case .twoTwentyTwenty: return "Every 20 min: look 20 ft away for 20 sec"
        case .standUp:         return "Stand and shift your weight"
        case .stretch:         return "Neck, shoulder & back stretch"
        case .walk:            return "Walk around the office or outside"
        case .water:           return "Drink a glass of water"
        }
    }
    var intervalMinutes: Int {
        switch self {
        case .twoTwentyTwenty: return 20
        case .standUp:         return 45
        case .stretch:         return 60
        case .walk:            return 90
        case .water:           return 60
        }
    }
}

struct BreakLog: Identifiable {
    var id: UUID = UUID()
    var breakType: BreakType
    var timestamp: Date
}

// MARK: - ViewModel

@Observable
class DeskBreaksViewModel {
    var breakLogs: [BreakLog] = []
    var sittingStartTime: Date? = nil
    var isTracking = false
    var activeBreak: BreakType? = nil
    var countdownSeconds: Int = 0
    var timerTask: Task<Void, Never>? = nil
    var currentSittingMinutes: Int = 0

    var todayBreaks: [BreakLog] {
        breakLogs.filter { Calendar.current.isDateInToday($0.timestamp) }
    }

    var todayBreakCount: Int { todayBreaks.count }

    var streak: Int {
        let calendar = Calendar.current
        var streakCount = 0
        var currentDay = Date()
        while true {
            let dayBreaks = breakLogs.filter { calendar.isDate($0.timestamp, inSameDayAs: currentDay) }
            if dayBreaks.count >= 6 {
                streakCount += 1
                guard let prevDay = calendar.date(byAdding: .day, value: -1, to: currentDay) else { break }
                currentDay = prevDay
            } else {
                break
            }
        }
        return streakCount
    }

    func startSittingTimer() {
        sittingStartTime = Date()
        isTracking = true
        currentSittingMinutes = 0
        timerTask = Task {
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 60_000_000_000)
                await MainActor.run {
                    if let start = sittingStartTime {
                        currentSittingMinutes = Int(Date().timeIntervalSince(start) / 60)
                    }
                }
            }
        }
    }

    func stopSittingTimer() {
        timerTask?.cancel()
        timerTask = nil
        isTracking = false
        sittingStartTime = nil
        currentSittingMinutes = 0
    }

    func logBreak(_ type: BreakType) {
        breakLogs.insert(BreakLog(breakType: type, timestamp: Date()), at: 0)
        if isTracking {
            sittingStartTime = Date()
            currentSittingMinutes = 0
        }
    }

    func startCountdown(for type: BreakType) {
        activeBreak = type
        countdownSeconds = max(type.durationMinutes * 60, 20)
        timerTask?.cancel()
        timerTask = Task {
            while countdownSeconds > 0 && !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                await MainActor.run { countdownSeconds -= 1 }
            }
            await MainActor.run {
                if countdownSeconds == 0 {
                    logBreak(activeBreak ?? .standUp)
                    activeBreak = nil
                }
            }
        }
    }

    func cancelCountdown() {
        timerTask?.cancel()
        timerTask = nil
        activeBreak = nil
        countdownSeconds = 0
    }

    var sittingRisk: SittingRisk {
        if currentSittingMinutes < 30 { return .low }
        if currentSittingMinutes < 60 { return .moderate }
        if currentSittingMinutes < 90 { return .high }
        return .critical
    }

    enum SittingRisk {
        case low, moderate, high, critical
        var color: Color {
            switch self {
            case .low: return .green
            case .moderate: return .yellow
            case .high: return .orange
            case .critical: return .red
            }
        }
        var label: String {
            switch self {
            case .low: return "Active"
            case .moderate: return "Take a break soon"
            case .high: return "Break overdue"
            case .critical: return "Move now!"
            }
        }
    }
}

// MARK: - Main View

struct DeskBreaksView: View {
    @State private var vm = DeskBreaksViewModel()

    var body: some View {
        List {
            trackerSection
            breakTypesSection
            activeCountdownSection
            todaySection
        }
        .premiumList()
        .navigationTitle("Desk Breaks")
        .navigationBarTitleDisplayMode(.large)
    }

    // MARK: - Sections

    private var trackerSection: some View {
        Section {
            VStack(spacing: 16) {
                // Sitting time ring
                HStack(spacing: 24) {
                    ZStack {
                        Circle()
                            .stroke(Color.secondary.opacity(0.15), lineWidth: 10)
                            .frame(width: 90, height: 90)
                        Circle()
                            .trim(from: 0, to: min(CGFloat(vm.currentSittingMinutes) / 60.0, 1.0))
                            .stroke(vm.sittingRisk.color, style: StrokeStyle(lineWidth: 10, lineCap: .round))
                            .frame(width: 90, height: 90)
                            .rotationEffect(.degrees(-90))
                            .animation(.easeInOut, value: vm.currentSittingMinutes)
                        VStack(spacing: 1) {
                            Text("\(vm.currentSittingMinutes)")
                                .font(.system(size: 22, weight: .bold, design: .rounded))
                            Text("min")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Label(vm.sittingRisk.label, systemImage: vm.isTracking ? "figure.seated.seatbelt" : "pause.circle")
                            .font(.subheadline.bold())
                            .foregroundStyle(vm.sittingRisk.color)
                        HStack {
                            Image(systemName: "checkmark.seal.fill")
                                .foregroundStyle(.green)
                            Text("\(vm.todayBreakCount) breaks today")
                                .font(.subheadline)
                        }
                        if vm.streak > 0 {
                            HStack {
                                Image(systemName: "flame.fill")
                                    .foregroundStyle(.orange)
                                Text("\(vm.streak)-day streak")
                                    .font(.subheadline)
                            }
                        }
                    }
                    Spacer()
                }

                Button {
                    if vm.isTracking {
                        vm.stopSittingTimer()
                    } else {
                        vm.startSittingTimer()
                    }
                    let impact = UIImpactFeedbackGenerator(style: .medium)
                    impact.impactOccurred()
                } label: {
                    Label(
                        vm.isTracking ? "Stop Tracking" : "Start Sitting Timer",
                        systemImage: vm.isTracking ? "stop.circle.fill" : "play.circle.fill"
                    )
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(vm.isTracking ? Color.red.opacity(0.15) : Color.blue.opacity(0.15))
                    .cornerRadius(12)
                    .foregroundStyle(vm.isTracking ? .red : .blue)
                }
                .buttonStyle(.plain)
            }
            .padding(.vertical, 8)
        } header: {
            Text("Sitting Tracker")
        }
    }

    private var breakTypesSection: some View {
        Section("Take a Break") {
            ForEach(BreakType.allCases) { breakType in
                Button {
                    vm.startCountdown(for: breakType)
                    let impact = UIImpactFeedbackGenerator(style: .light)
                    impact.impactOccurred()
                } label: {
                    HStack(spacing: 14) {
                        Image(systemName: breakType.icon)
                            .font(.title3)
                            .foregroundStyle(breakType.color)
                            .frame(width: 32)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(breakType.rawValue).font(.subheadline).bold()
                            Text(breakType.description).font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text("Every \(breakType.intervalMinutes)m")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Image(systemName: "chevron.right")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
                .buttonStyle(.plain)
            }
        }
    }

    @ViewBuilder
    private var activeCountdownSection: some View {
        if let breakType = vm.activeBreak {
            Section {
                VStack(spacing: 16) {
                    Text(breakType.icon)
                    Image(systemName: breakType.icon)
                        .font(.system(size: 48))
                        .foregroundStyle(breakType.color)
                    Text(breakType.rawValue)
                        .font(.title2.bold())
                    Text(breakType.description)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)

                    Text(timeString(vm.countdownSeconds))
                        .font(.system(size: 48, weight: .bold, design: .monospaced))
                        .foregroundStyle(breakType.color)
                        .contentTransition(.numericText())
                        .animation(.default, value: vm.countdownSeconds)

                    HStack(spacing: 16) {
                        Button("Done Early") {
                            vm.logBreak(breakType)
                            vm.cancelCountdown()
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(breakType.color)

                        Button("Cancel") {
                            vm.cancelCountdown()
                        }
                        .buttonStyle(.bordered)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
            } header: {
                Text("Active Break")
            }
        }
    }

    private var todaySection: some View {
        Section("Today's Breaks") {
            if vm.todayBreaks.isEmpty {
                Text("No breaks logged today. Take your first break!")
                    .foregroundStyle(.secondary)
                    .font(.subheadline)
            } else {
                ForEach(vm.todayBreaks.prefix(10)) { log in
                    HStack(spacing: 12) {
                        Image(systemName: log.breakType.icon)
                            .foregroundStyle(log.breakType.color)
                        Text(log.breakType.rawValue)
                            .font(.subheadline)
                        Spacer()
                        Text(log.timestamp.kqFormatted(dateStyle: .none, timeStyle: .short))
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
    }

    private func timeString(_ seconds: Int) -> String {
        if seconds < 60 { return "0:\(String(format: "%02d", seconds))" }
        let m = seconds / 60
        let s = seconds % 60
        return "\(m):\(String(format: "%02d", s))"
    }
}

#Preview {
    NavigationStack { DeskBreaksView() }
}
