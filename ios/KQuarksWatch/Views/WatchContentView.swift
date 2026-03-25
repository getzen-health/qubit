import SwiftUI

struct WatchContentView: View {
    @EnvironmentObject private var session: WatchSessionManager

    var body: some View {
        if let snapshot = session.snapshot {
            SnapshotView(snapshot: snapshot, lastUpdated: session.lastUpdated)
        } else {
            NoDataView()
        }
    }
}

// MARK: - Snapshot View

private struct SnapshotView: View {
    let snapshot: WatchHealthSnapshot
    let lastUpdated: Date?

    var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                RingsRow(
                    move: snapshot.moveRingPercent ?? 0,
                    exercise: snapshot.exerciseRingPercent ?? 0,
                    stand: snapshot.standRingPercent ?? 0
                )

                HRVRow(hrv: snapshot.hrv)

                Divider()

                HStack(spacing: 0) {
                    MetricTileView(
                        icon: "figure.walk",
                        value: snapshot.steps.formatted(),
                        label: "Steps"
                    )
                    MetricTileView(
                        icon: "bed.double",
                        value: snapshot.sleepHours.map { String(format: "%.1fh", $0) } ?? "--",
                        label: "Sleep"
                    )
                }

                if let updated = lastUpdated {
                    Text("Synced \(minutesAgo(updated)) min ago")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }
            }
            .padding(.vertical, 4)
        }
        .containerBackground(.black.gradient, for: .watch)
    }

    private func minutesAgo(_ date: Date) -> Int {
        max(0, Int(Date().timeIntervalSince(date) / 60))
    }
}

// MARK: - Rings Row

private struct RingsRow: View {
    let move: Double
    let exercise: Double
    let stand: Double

    var body: some View {
        HStack(spacing: 6) {
            RingBar(value: move, color: .red, label: "Move")
            RingBar(value: exercise, color: .green, label: "Ex")
            RingBar(value: stand, color: .cyan, label: "Stand")
        }
    }
}

private struct RingBar: View {
    let value: Double
    let color: Color
    let label: String

    private var clamped: Double { min(max(value, 0), 1) }

    var body: some View {
        VStack(spacing: 2) {
            ZStack(alignment: .bottom) {
                RoundedRectangle(cornerRadius: 3)
                    .fill(color.opacity(0.2))
                    .frame(width: 14, height: 32)
                RoundedRectangle(cornerRadius: 3)
                    .fill(color)
                    .frame(width: 14, height: max(2, 32 * clamped))
            }
            Text(label)
                .font(.system(size: 7))
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - HRV Row

private struct HRVRow: View {
    let hrv: Double?

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "waveform.path.ecg")
                .font(.caption2)
                .foregroundStyle(.pink)
            if let hrv {
                Text(String(format: "%.0f ms", hrv))
                    .font(.title2)
                    .fontWeight(.medium)
            } else {
                Text("-- ms")
                    .font(.title2)
                    .fontWeight(.medium)
                    .foregroundStyle(.secondary)
            }
            Text("HRV")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }
}

// MARK: - No Data View

private struct NoDataView: View {
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: "iphone.slash")
                .font(.title2)
                .foregroundStyle(.secondary)
            Text("Open KQuarks\non iPhone")
                .font(.caption)
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
        }
        .containerBackground(.black.gradient, for: .watch)
    }
}

#Preview {
    WatchContentView()
        .environmentObject(WatchSessionManager())
}
