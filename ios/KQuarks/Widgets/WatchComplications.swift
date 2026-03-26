import WidgetKit
import SwiftUI

// MARK: - Apple Watch Complications via WidgetKit
//
// These views provide watch complication support through WidgetKit's accessory families.
// They automatically appear as complications on Apple Watch when the iPhone has widgets enabled.
// Supported on watchOS 10+ via iPhone mirroring.
//
// Two primary complication styles:
// 1. AccessoryCorner: Small gauge for corner of watch face (readiness score ring)
// 2. AccessoryInline: Text and icon for linear displays (e.g. top of watch face)

// MARK: - Readiness Score Ring Complication (Corner)

struct ReadinessScoreComplication: View {
    let readinessScore: Int // 0-100
    let restingHR: Int

    private var readinessColor: Color {
        switch readinessScore {
        case 80...100: return .green
        case 60..<80: return .yellow
        case 40..<60: return .orange
        default: return .red
        }
    }

    var body: some View {
        Gauge(value: Double(readinessScore) / 100.0) {
            Image(systemName: "battery.100")
                .font(.caption)
        } currentValueLabel: {
            Text("\(readinessScore)%")
                .font(.system(size: 9, weight: .bold, design: .rounded))
        }
        .gaugeStyle(.accessoryCircularCapacity)
        .tint(readinessColor)
    }
}

// MARK: - Steps + HR Inline Complication

struct StepsHeartRateInline: View {
    let steps: Int
    let heartRate: Int

    var body: some View {
        Label {
            if heartRate > 0 {
                HStack(spacing: 2) {
                    Text(steps.formatted())
                    Text("·")
                        .foregroundStyle(.secondary)
                    Image(systemName: "heart.fill")
                        .foregroundStyle(.red)
                    Text(heartRate.formatted())
                }
                .font(.system(size: 11, design: .rounded))
            } else {
                Text(steps.formatted())
                    .font(.system(size: 11, design: .rounded))
            }
        } icon: {
            Image(systemName: "figure.walk")
        }
    }
}

// MARK: - Sleep Duration Inline

struct SleepDurationInline: View {
    let sleepHours: Double

    var body: some View {
        let h = Int(sleepHours)
        let m = Int((sleepHours - Double(h)) * 60)
        let sleepText = m > 0 ? "\(h)h \(m)m" : "\(h)h"

        return Label(sleepText, systemImage: "moon.fill")
            .font(.system(size: 11, design: .rounded))
    }
}

// MARK: - Recovery Score Inline

struct RecoveryScoreInline: View {
    let recoveryScore: Int

    var recoveryStatus: String {
        switch recoveryScore {
        case 80...100: return "Excellent"
        case 60..<80: return "Good"
        case 40..<60: return "Fair"
        default: return "Low"
        }
    }

    var body: some View {
        Label("\(recoveryScore)% · \(recoveryStatus)", systemImage: "bolt.fill")
            .font(.system(size: 10, design: .rounded))
    }
}

// MARK: - Calorie Progress Gauge (Corner)

struct CalorieProgressComplication: View {
    let activeCalories: Int
    let calorieGoal: Int

    private var progress: Double {
        min(Double(activeCalories) / Double(max(calorieGoal, 1)), 1.0)
    }

    var body: some View {
        Gauge(value: progress) {
            Image(systemName: "flame.fill")
                .font(.caption)
        } currentValueLabel: {
            Text("\(Int(progress * 100))%")
                .font(.system(size: 9, weight: .bold, design: .rounded))
        }
        .gaugeStyle(.accessoryCircularCapacity)
        .tint(.orange)
    }
}

// MARK: - Multi-Metric Inline (Compact)

struct MultiMetricInline: View {
    let steps: Int
    let stepGoal: Int
    let heartRate: Int
    let sleepHours: Double

    private var stepPercentage: Int {
        min((steps * 100) / max(stepGoal, 1), 100)
    }

    var body: some View {
        HStack(spacing: 3) {
            Image(systemName: "figure.walk")
                .font(.system(size: 10))
            Text("\(stepPercentage)%")
                .font(.system(size: 9, weight: .semibold, design: .rounded))

            Divider()
                .frame(height: 8)

            if heartRate > 0 {
                Image(systemName: "heart.fill")
                    .font(.system(size: 8))
                    .foregroundStyle(.red)
                Text("\(heartRate)")
                    .font(.system(size: 9, weight: .semibold, design: .rounded))
            }
        }
        .font(.caption2)
    }
}

// MARK: - Preview (for development)

#if DEBUG
struct WatchComplicationsPreview: PreviewProvider {
    static var previews: some View {
        Group {
            // Corner complication: Readiness score
            ReadinessScoreComplication(readinessScore: 75, restingHR: 58)
                .previewContext(WidgetPreviewContext(family: .accessoryCircular))

            // Corner complication: Calorie progress
            CalorieProgressComplication(activeCalories: 340, calorieGoal: 500)
                .previewContext(WidgetPreviewContext(family: .accessoryCircular))

            // Inline complications
            StepsHeartRateInline(steps: 8432, heartRate: 72)
                .previewContext(WidgetPreviewContext(family: .accessoryInline))

            SleepDurationInline(sleepHours: 7.5)
                .previewContext(WidgetPreviewContext(family: .accessoryInline))

            RecoveryScoreInline(recoveryScore: 68)
                .previewContext(WidgetPreviewContext(family: .accessoryInline))

            MultiMetricInline(steps: 8432, stepGoal: 10000, heartRate: 72, sleepHours: 7.5)
                .previewContext(WidgetPreviewContext(family: .accessoryInline))
        }
    }
}
#endif
