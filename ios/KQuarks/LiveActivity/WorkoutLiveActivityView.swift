import SwiftUI
import WidgetKit
import ActivityKit

#if !targetEnvironment(macCatalyst)
struct WorkoutLiveActivityView: View {
    let context: ActivityViewContext<WorkoutActivityAttributes>
    
    private var elapsedTime: String {
        let s = context.state.elapsedSeconds
        let h = s / 3600
        let m = (s % 3600) / 60
        let sec = s % 60
        if h > 0 { return String(format: "%d:%02d:%02d", h, m, sec) }
        return String(format: "%02d:%02d", m, sec)
    }
    
    var body: some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                Text(context.attributes.workoutType)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
                Text(elapsedTime)
                    .font(.title2.monospacedDigit().weight(.bold))
                    .foregroundStyle(.primary)
            }
            
            Spacer()
            
            HStack(spacing: 12) {
                VStack(spacing: 2) {
                    Image(systemName: "heart.fill")
                        .foregroundStyle(.red)
                        .font(.caption)
                    Text("\(Int(context.state.heartRate))")
                        .font(.caption.monospacedDigit().weight(.semibold))
                    Text("BPM")
                        .font(.system(size: 9))
                        .foregroundStyle(.secondary)
                }
                
                VStack(spacing: 2) {
                    Image(systemName: "flame.fill")
                        .foregroundStyle(.orange)
                        .font(.caption)
                    Text("\(Int(context.state.activeCalories))")
                        .font(.caption.monospacedDigit().weight(.semibold))
                    Text("CAL")
                        .font(.system(size: 9))
                        .foregroundStyle(.secondary)
                }
                
                if let pace = context.state.currentPace {
                    VStack(spacing: 2) {
                        Image(systemName: "figure.run")
                            .foregroundStyle(.blue)
                            .font(.caption)
                        Text(pace)
                            .font(.caption.monospacedDigit().weight(.semibold))
                        Text("PACE")
                            .font(.system(size: 9))
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding(.horizontal)
    }
}

// Dynamic Island compact leading
struct WorkoutCompactLeadingView: View {
    let context: ActivityViewContext<WorkoutActivityAttributes>
    var body: some View {
        Image(systemName: workoutIcon(for: context.attributes.workoutType))
            .foregroundStyle(.green)
    }
    
    private func workoutIcon(for type: String) -> String {
        switch type.lowercased() {
        case "running": return "figure.run"
        case "cycling": return "figure.outdoor.cycle"
        case "swimming": return "figure.pool.swim"
        case "walking": return "figure.walk"
        default: return "figure.strengthtraining.traditional"
        }
    }
}

struct WorkoutCompactTrailingView: View {
    let context: ActivityViewContext<WorkoutActivityAttributes>
    private var elapsedTime: String {
        let s = context.state.elapsedSeconds
        let m = (s % 3600) / 60
        let sec = s % 60
        return String(format: "%02d:%02d", m, sec)
    }
    var body: some View {
        Text(elapsedTime)
            .monospacedDigit()
            .font(.caption.weight(.bold))
            .foregroundStyle(.green)
    }
}
#endif
