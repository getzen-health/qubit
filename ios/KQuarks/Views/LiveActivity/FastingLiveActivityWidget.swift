import ActivityKit
import WidgetKit
import SwiftUI

// Lock Screen / Dynamic Island views for Fasting Live Activity
// To enable: add a Widget Extension target in Xcode and reference these views

struct FastingLiveActivityLockScreenView: View {
    let context: ActivityViewContext<FastingLiveActivityAttributes>
    
    var progress: Double {
        guard context.state.targetSeconds > 0 else { return 0 }
        return Double(context.state.elapsedSeconds) / Double(context.state.targetSeconds)
    }
    
    var body: some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Fasting").font(.caption).foregroundStyle(.secondary)
                Text(context.state.phase)
                    .font(.headline).bold()
                    .foregroundStyle(.orange)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 4) {
                Text(formatDuration(context.state.elapsedSeconds))
                    .font(.system(.title3, design: .monospaced)).bold()
                Text("/ \(context.attributes.goal)")
                    .font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding(.horizontal)
        .overlay(alignment: .bottom) {
            ProgressView(value: progress)
                .tint(.orange)
                .frame(height: 3)
        }
    }
    
    func formatDuration(_ s: Int) -> String {
        String(format: "%02d:%02d", s / 3600, (s % 3600) / 60)
    }
}

struct WorkoutLiveActivityLockScreenView: View {
    let context: ActivityViewContext<WorkoutLiveActivityAttributes>
    
    var body: some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                Text(context.attributes.workoutType).font(.caption).foregroundStyle(.secondary)
                Text(context.state.zone)
                    .font(.headline).bold()
                    .foregroundStyle(.red)
            }
            Spacer()
            HStack(spacing: 12) {
                Label("\(context.state.heartRate)", systemImage: "heart.fill")
                    .font(.subheadline).foregroundStyle(.red)
                Label("\(context.state.calories)", systemImage: "flame.fill")
                    .font(.subheadline).foregroundStyle(.orange)
            }
        }
        .padding(.horizontal)
    }
}
