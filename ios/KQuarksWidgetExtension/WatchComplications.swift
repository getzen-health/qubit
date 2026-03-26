import WidgetKit
import SwiftUI

// MARK: - Readiness Score Widget for Apple Watch Corner

struct ReadinessScoreWidget: Widget {
    let kind: String = "ReadinessScoreWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: KQuarksProvider()) { entry in
            ZStack {
                AccessoryWidgetBackground()
                Gauge(value: Double(entry.recoveryScore) / 100.0) {
                    Image(systemName: "battery.100")
                        .font(.caption)
                } currentValueLabel: {
                    Text("\(entry.recoveryScore)%")
                        .font(.system(size: 9, weight: .bold, design: .rounded))
                }
                .gaugeStyle(.accessoryCircularCapacity)
                .tint(entry.recoveryScore >= 70 ? .green : entry.recoveryScore >= 50 ? .yellow : .red)
            }
        }
        .configurationDisplayName("Readiness Score")
        .description("Your daily readiness percentage as a corner ring.")
        .supportedFamilies([.accessoryCircular])
    }
}

// MARK: - Calorie Progress Widget for Apple Watch Corner

struct CalorieProgressWidget: Widget {
    let kind: String = "CalorieProgressWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: KQuarksProvider()) { entry in
            let progress = Double(entry.activeCalories) / Double(max(entry.calorieGoal, 1))
            ZStack {
                AccessoryWidgetBackground()
                Gauge(value: min(progress, 1.0)) {
                    Image(systemName: "flame.fill")
                        .font(.caption)
                } currentValueLabel: {
                    Text("\(Int(min(progress, 1.0) * 100))%")
                        .font(.system(size: 9, weight: .bold, design: .rounded))
                }
                .gaugeStyle(.accessoryCircularCapacity)
                .tint(.orange)
            }
        }
        .configurationDisplayName("Calorie Progress")
        .description("Active calories burned today as a corner ring.")
        .supportedFamilies([.accessoryCircular])
    }
}

// MARK: - Heart Rate Inline Widget for Apple Watch

struct HeartRateInlineWidget: Widget {
    let kind: String = "HeartRateInlineWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: KQuarksProvider()) { entry in
            Label {
                HStack(spacing: 2) {
                    if entry.restingHR > 0 {
                        Text("\(entry.restingHR)")
                            .font(.system(size: 11, weight: .semibold, design: .rounded))
                    } else {
                        Text("--")
                            .font(.system(size: 11, weight: .semibold, design: .rounded))
                    }
                    Text("bpm")
                        .font(.system(size: 9, design: .rounded))
                        .foregroundStyle(.secondary)
                }
            } icon: {
                Image(systemName: "heart.fill")
                    .foregroundStyle(.red)
            }
        }
        .configurationDisplayName("Resting Heart Rate")
        .description("Today's resting heart rate inline display.")
        .supportedFamilies([.accessoryInline])
    }
}

// MARK: - Steps Inline Widget for Apple Watch

struct StepsInlineWidget: Widget {
    let kind: String = "StepsInlineWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: KQuarksProvider()) { entry in
            let stepsText = entry.steps.formatted()
            Label(stepsText, systemImage: "figure.walk")
                .font(.system(size: 11, design: .rounded))
        }
        .configurationDisplayName("Steps Today")
        .description("Today's step count inline display.")
        .supportedFamilies([.accessoryInline])
    }
}

// MARK: - Sleep Duration Inline Widget for Apple Watch

struct SleepInlineWidget: Widget {
    let kind: String = "SleepInlineWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: KQuarksProvider()) { entry in
            let h = Int(entry.sleepHours)
            let m = Int((entry.sleepHours - Double(h)) * 60)
            let sleepText = m > 0 ? "\(h)h \(m)m" : "\(h)h"

            return Label(sleepText, systemImage: "moon.fill")
                .font(.system(size: 11, design: .rounded))
        }
        .configurationDisplayName("Sleep Duration")
        .description("Last night's sleep duration inline display.")
        .supportedFamilies([.accessoryInline])
    }
}
