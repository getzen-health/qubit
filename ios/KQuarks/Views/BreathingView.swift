import SwiftUI

// MARK: - BreathingView

struct BreathingView: View {
    @State private var selectedTechnique: BreathingTechnique?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    ForEach(BreathingTechnique.allCases) { technique in
                        Button {
                            selectedTechnique = technique
                        } label: {
                            TechniqueCard(technique: technique)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding()
            }
            .background(Color.premiumBackground)
            .navigationTitle("Breathing")
            .toolbarTitleDisplayMode(.inline)
            .sheet(item: $selectedTechnique) { technique in
                BreathingSessionView(technique: technique)
            }
        }
    }
}

// MARK: - Technique Card

private struct TechniqueCard: View {
    let technique: BreathingTechnique

    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(technique.color.opacity(0.15))
                    .frame(width: 56, height: 56)
                Image(systemName: technique.icon)
                    .font(.title2)
                    .foregroundStyle(technique.color)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(technique.name)
                    .font(.headline)
                    .foregroundStyle(.primary)
                Text(technique.tagline)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Text(technique.phaseDescription)
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .padding(16)
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - Breathing Session View

struct BreathingSessionView: View {
    let technique: BreathingTechnique
    @Environment(\.dismiss) private var dismiss

    @State private var phase: BreathingPhase = .ready
    @State private var phaseIndex = 0
    @State private var countdown = 0
    @State private var round = 0
    @State private var isActive = false
    @State private var scale: CGFloat = 0.6
    @State private var totalRounds = 5
    @State private var isComplete = false

    let ticker = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    private var currentPhaseSpec: PhaseSpec {
        technique.phases[phaseIndex % technique.phases.count]
    }

    var body: some View {
        ZStack {
            technique.color.opacity(0.06).ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                HStack {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title2)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    Text(technique.name)
                        .font(.headline)
                    Spacer()
                    // Balance
                    Color.clear.frame(width: 32, height: 32)
                }
                .padding()

                Spacer()

                // Animated ring
                ZStack {
                    // Outer glow
                    Circle()
                        .fill(technique.color.opacity(0.08))
                        .frame(width: 260, height: 260)
                        .scaleEffect(scale + 0.1)

                    // Main circle
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [technique.color.opacity(0.5), technique.color.opacity(0.15)],
                                center: .center,
                                startRadius: 0,
                                endRadius: 130
                            )
                        )
                        .frame(width: 240, height: 240)
                        .scaleEffect(scale)

                    // Center content
                    VStack(spacing: 8) {
                        if isComplete {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 44))
                                .foregroundStyle(.green)
                            Text("Complete!")
                                .font(.title2.bold())
                        } else if phase == .ready {
                            Text("Ready")
                                .font(.title.bold())
                                .foregroundStyle(technique.color)
                        } else {
                            Text(currentPhaseSpec.label)
                                .font(.title2.bold())
                                .foregroundStyle(technique.color)
                            Text("\(countdown)")
                                .font(.system(size: 52, weight: .thin, design: .rounded))
                                .monospacedDigit()
                                .contentTransition(.numericText(countsDown: true))
                        }
                    }
                }

                Spacer()

                // Round counter
                if !isComplete {
                    HStack(spacing: 8) {
                        ForEach(0..<totalRounds, id: \.self) { i in
                            Circle()
                                .fill(i < round ? technique.color : technique.color.opacity(0.2))
                                .frame(width: 10, height: 10)
                        }
                    }
                    .padding(.bottom, 8)
                }

                // Phase instruction strip
                if !isComplete && phase != .ready {
                    Text(currentPhaseSpec.instruction)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .padding(.bottom, 12)
                }

                // Rounds selector (only when ready)
                if phase == .ready {
                    VStack(spacing: 8) {
                        Text("Rounds")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        HStack(spacing: 12) {
                            ForEach([3, 5, 8, 10], id: \.self) { r in
                                Button {
                                    totalRounds = r
                                } label: {
                                    Text("\(r)")
                                        .font(.subheadline.bold())
                                        .frame(width: 44, height: 36)
                                        .background(totalRounds == r ? technique.color : technique.color.opacity(0.1))
                                        .foregroundStyle(totalRounds == r ? .white : technique.color)
                                        .clipShape(RoundedRectangle(cornerRadius: 8))
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                    .padding(.bottom, 8)
                }

                // Main action button
                Button {
                    if isComplete {
                        dismiss()
                    } else if phase == .ready {
                        startSession()
                    } else {
                        stopSession()
                    }
                } label: {
                    Text(isComplete ? "Done" : phase == .ready ? "Begin" : "Stop")
                        .font(.body.bold())
                        .frame(maxWidth: .infinity)
                        .padding(16)
                        .background(isComplete ? Color.green : technique.color)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                }
                .padding(.horizontal)
                .padding(.bottom, 32)
            }
        }
        .onReceive(ticker) { _ in
            guard isActive else { return }
            tick()
        }
    }

    private func startSession() {
        round = 0
        phaseIndex = 0
        phase = .active
        countdown = currentPhaseSpec.duration
        isActive = true
        animateForPhase(currentPhaseSpec)
        #if os(iOS)
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        #endif
    }

    private func stopSession() {
        isActive = false
        phase = .ready
        phaseIndex = 0
        round = 0
        countdown = 0
        withAnimation(.easeInOut(duration: 0.5)) { scale = 0.6 }
    }

    private func tick() {
        countdown -= 1
        if countdown <= 0 {
            advancePhase()
        }
    }

    private func advancePhase() {
        phaseIndex += 1

        // Check if we completed a full round
        if phaseIndex % technique.phases.count == 0 {
            round += 1
            if round >= totalRounds {
                completeSession()
                return
            }
        }

        let next = currentPhaseSpec
        countdown = next.duration
        animateForPhase(next)
        #if os(iOS)
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        #endif
    }

    private func completeSession() {
        isActive = false
        isComplete = true
        withAnimation(.spring(response: 0.6, dampingFraction: 0.7)) { scale = 0.85 }
        #if os(iOS)
        UINotificationFeedbackGenerator().notificationOccurred(.success)
        #endif

        // Save to HealthKit as mindfulness session
        let duration = Double(totalRounds) * technique.roundDuration
        let end = Date()
        let start = end.addingTimeInterval(-duration)
        Task {
            try? await HealthKitService.shared.saveMindfulnessSession(startDate: start, endDate: end)
        }
    }

    private func animateForPhase(_ spec: PhaseSpec) {
        let targetScale: CGFloat = spec.isExpand ? 1.0 : (spec.isHold ? scale : 0.6)
        withAnimation(.easeInOut(duration: Double(spec.duration))) {
            scale = targetScale
        }
    }
}

// MARK: - Data Models

enum BreathingPhase {
    case ready, active
}

struct PhaseSpec {
    let label: String
    let instruction: String
    let duration: Int
    let isExpand: Bool
    let isHold: Bool
}

enum BreathingTechnique: String, CaseIterable, Identifiable {
    case box, fourSevenEight, physiologicalSigh, relaxing

    var id: String { rawValue }

    var name: String {
        switch self {
        case .box: return "Box Breathing"
        case .fourSevenEight: return "4-7-8 Breathing"
        case .physiologicalSigh: return "Physiological Sigh"
        case .relaxing: return "Relaxing Breath"
        }
    }

    var tagline: String {
        switch self {
        case .box: return "Calm and focus your mind"
        case .fourSevenEight: return "Reduce anxiety quickly"
        case .physiologicalSigh: return "Fastest way to reduce stress"
        case .relaxing: return "Slow down and unwind"
        }
    }

    var phaseDescription: String {
        switch self {
        case .box: return "4s inhale · 4s hold · 4s exhale · 4s hold"
        case .fourSevenEight: return "4s inhale · 7s hold · 8s exhale"
        case .physiologicalSigh: return "Double inhale · long exhale"
        case .relaxing: return "5s inhale · 7s exhale"
        }
    }

    var icon: String {
        switch self {
        case .box: return "square"
        case .fourSevenEight: return "4.circle"
        case .physiologicalSigh: return "wind"
        case .relaxing: return "leaf.fill"
        }
    }

    var color: Color {
        switch self {
        case .box: return .teal
        case .fourSevenEight: return .indigo
        case .physiologicalSigh: return .cyan
        case .relaxing: return .mint
        }
    }

    var phases: [PhaseSpec] {
        switch self {
        case .box:
            return [
                PhaseSpec(label: "Inhale", instruction: "Breathe in through your nose", duration: 4, isExpand: true, isHold: false),
                PhaseSpec(label: "Hold", instruction: "Hold your breath", duration: 4, isExpand: false, isHold: true),
                PhaseSpec(label: "Exhale", instruction: "Breathe out through your mouth", duration: 4, isExpand: false, isHold: false),
                PhaseSpec(label: "Hold", instruction: "Hold before inhaling", duration: 4, isExpand: false, isHold: true),
            ]
        case .fourSevenEight:
            return [
                PhaseSpec(label: "Inhale", instruction: "Breathe in through your nose", duration: 4, isExpand: true, isHold: false),
                PhaseSpec(label: "Hold", instruction: "Hold your breath", duration: 7, isExpand: false, isHold: true),
                PhaseSpec(label: "Exhale", instruction: "Exhale through your mouth", duration: 8, isExpand: false, isHold: false),
            ]
        case .physiologicalSigh:
            return [
                PhaseSpec(label: "Inhale", instruction: "Deep inhale through nose", duration: 2, isExpand: true, isHold: false),
                PhaseSpec(label: "Sip", instruction: "Short second inhale", duration: 1, isExpand: true, isHold: false),
                PhaseSpec(label: "Exhale", instruction: "Long slow exhale through mouth", duration: 6, isExpand: false, isHold: false),
                PhaseSpec(label: "Rest", instruction: "Natural pause", duration: 2, isExpand: false, isHold: true),
            ]
        case .relaxing:
            return [
                PhaseSpec(label: "Inhale", instruction: "Slow breath in through nose", duration: 5, isExpand: true, isHold: false),
                PhaseSpec(label: "Exhale", instruction: "Slow breath out through mouth", duration: 7, isExpand: false, isHold: false),
            ]
        }
    }

    var roundDuration: Double {
        Double(phases.reduce(0) { $0 + $1.duration })
    }
}

#Preview {
    BreathingView()
}
