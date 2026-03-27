import SwiftUI
import WatchConnectivity

// MARK: - QuickLogWatchView

struct QuickLogWatchView: View {
    @EnvironmentObject private var session: WatchSessionManager

    @State private var waterGlasses = 0
    @State private var moodRating: Int? = nil
    @State private var didSend = false

    private let moodIcons = ["😞", "😕", "😐", "🙂", "😄"]

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                // ── Water log ──────────────────────────────────────
                VStack(spacing: 6) {
                    Label("Water", systemImage: "drop.fill")
                        .font(.caption2)
                        .foregroundStyle(.blue)

                    Text("\(waterGlasses * 250) ml")
                        .font(.system(.title3, design: .rounded, weight: .bold))
                        .foregroundStyle(waterGlasses > 0 ? .blue : .secondary)

                    HStack(spacing: 8) {
                        Button {
                            if waterGlasses > 0 { waterGlasses -= 1 }
                        } label: {
                            Image(systemName: "minus.circle")
                                .font(.title3)
                                .foregroundStyle(waterGlasses > 0 ? .blue : .secondary)
                        }
                        .buttonStyle(.plain)

                        Button {
                            waterGlasses += 1
                        } label: {
                            Image(systemName: "plus.circle.fill")
                                .font(.title3)
                                .foregroundStyle(.blue)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(10)
                .background(.blue.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 12))

                // ── Mood log ───────────────────────────────────────
                VStack(spacing: 6) {
                    Label("Mood", systemImage: "face.smiling")
                        .font(.caption2)
                        .foregroundStyle(.yellow)

                    HStack(spacing: 6) {
                        ForEach(1...5, id: \.self) { i in
                            Button(moodIcons[i - 1]) {
                                moodRating = moodRating == i ? nil : i
                            }
                            .font(.title3)
                            .opacity(moodRating == nil || moodRating == i ? 1 : 0.4)
                            .scaleEffect(moodRating == i ? 1.25 : 1.0)
                            .animation(.spring(response: 0.2), value: moodRating)
                            .buttonStyle(.plain)
                        }
                    }
                }
                .padding(10)
                .background(.yellow.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 12))

                // ── Send button ────────────────────────────────────
                if waterGlasses > 0 || moodRating != nil {
                    if didSend {
                        Label("Logged!", systemImage: "checkmark.circle.fill")
                            .font(.callout.bold())
                            .foregroundStyle(.green)
                            .transition(.scale.combined(with: .opacity))
                    } else {
                        Button("Log Now") {
                            sendQuickLog()
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.green)
                        .font(.callout.bold())
                    }
                }
            }
            .padding(.vertical, 8)
        }
        .navigationTitle("Quick Log")
    }

    private func sendQuickLog() {
        if waterGlasses > 0 {
            session.sendQuickLog(type: "water_ml", value: Double(waterGlasses * 250))
        }
        if let mood = moodRating {
            session.sendQuickLog(type: "mood", value: Double(mood))
        }

        withAnimation(.spring(response: 0.3)) {
            didSend = true
        }

        // Reset after 2 s
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            withAnimation {
                didSend = false
                waterGlasses = 0
                moodRating = nil
            }
        }
    }
}

#Preview {
    QuickLogWatchView()
        .environmentObject(WatchSessionManager())
}
