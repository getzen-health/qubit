import ActivityKit
import WidgetKit
import SwiftUI

// Lock Screen / Dynamic Island views for Workout Live Activity

struct WorkoutLiveActivityDynamicIslandView: View {
    let context: ActivityViewContext<WorkoutLiveActivityAttributes>
    
    var durationString: String {
        let seconds = context.state.durationSeconds
        let minutes = seconds / 60
        let secs = seconds % 60
        return String(format: "%02d:%02d", minutes, secs)
    }
    
    var body: some View {
        HStack(spacing: 8) {
            Text(durationString)
                .font(.system(.callout, design: .monospaced))
                .bold()
            
            Label("\(context.state.heartRate)", systemImage: "heart.fill")
                .font(.caption)
                .foregroundColor(.red)
        }
    }
}

struct WorkoutLiveActivityCompactView: View {
    let context: ActivityViewContext<WorkoutLiveActivityAttributes>
    
    var durationString: String {
        let seconds = context.state.durationSeconds
        let minutes = seconds / 60
        let secs = seconds % 60
        return String(format: "%02d:%02d", minutes, secs)
    }
    
    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(context.attributes.workoutType)
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text(durationString)
                    .font(.system(.headline, design: .monospaced))
                    .bold()
            }
            Spacer()
            Label("\(context.state.heartRate)", systemImage: "heart.fill")
                .font(.subheadline)
                .foregroundColor(.red)
        }
        .padding(.horizontal)
    }
}

struct WorkoutLiveActivityMinimalView: View {
    let context: ActivityViewContext<WorkoutLiveActivityAttributes>
    
    var durationString: String {
        let seconds = context.state.durationSeconds
        let minutes = seconds / 60
        let secs = seconds % 60
        return String(format: "%02d:%02d", minutes, secs)
    }
    
    var body: some View {
        HStack(spacing: 12) {
            Text(durationString)
                .font(.system(.caption, design: .monospaced))
                .bold()
            
            Label("\(context.state.heartRate)", systemImage: "heart.fill")
                .font(.caption2)
                .foregroundColor(.red)
        }
    }
}

struct WorkoutLiveActivityExpandedView: View {
    let context: ActivityViewContext<WorkoutLiveActivityAttributes>
    
    var durationString: String {
        let seconds = context.state.durationSeconds
        let minutes = seconds / 60
        let secs = seconds % 60
        return String(format: "%02d:%02d", minutes, secs)
    }
    
    var workoutIcon: String {
        switch context.attributes.workoutType.lowercased() {
        case "running": return "figure.run"
        case "cycling": return "figure.outdoor.cycle"
        case "swimming": return "figure.pool.swim"
        case "walking": return "figure.walk"
        case "elliptical": return "ellipsis"
        case "rowing": return "figure.rower"
        case "hiking": return "figure.hiking"
        case "tennis": return "figure.tennis"
        case "basketball": return "figure.basketball"
        case "soccer": return "figure.soccer"
        case "yoga": return "figure.yoga"
        case "pilates": return "figure.pilates"
        case "weightlifting": return "dumbbell.fill"
        case "hiit": return "bolt.fill"
        case "functional": return "figure.stairs"
        default: return "figure.run"
        }
    }
    
    var body: some View {
        VStack(spacing: 12) {
            // Header with type and duration
            HStack(spacing: 12) {
                Image(systemName: workoutIcon)
                    .font(.system(size: 24, weight: .semibold))
                    .foregroundColor(.blue)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(context.attributes.workoutType)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Text(durationString)
                        .font(.system(.title2, design: .monospaced))
                        .bold()
                }
                
                Spacer()
            }
            
            // Metrics grid
            HStack(spacing: 12) {
                // Heart Rate
                VStack(spacing: 4) {
                    Label("\(context.state.heartRate)", systemImage: "heart.fill")
                        .font(.headline)
                        .foregroundColor(.red)
                    Text("bpm")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(8)
                .background(Color(.systemGray6))
                .cornerRadius(8)
                
                // Calories
                VStack(spacing: 4) {
                    Label("\(context.state.calories)", systemImage: "flame.fill")
                        .font(.headline)
                        .foregroundColor(.orange)
                    Text("kcal")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(8)
                .background(Color(.systemGray6))
                .cornerRadius(8)
                
                // Distance (if available)
                if context.state.distanceMeters > 0 {
                    VStack(spacing: 4) {
                        Label(String(format: "%.1f", Double(context.state.distanceMeters) / 1000.0), systemImage: "location.fill")
                            .font(.headline)
                            .foregroundColor(.green)
                        Text("km")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(8)
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
                }
            }
            
            // Zone indicator
            HStack(spacing: 8) {
                Text("Zone:")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text(context.state.zone)
                    .font(.caption)
                    .bold()
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color(hex: context.state.zoneColor).opacity(0.2))
                    .foregroundColor(Color(hex: context.state.zoneColor))
                    .cornerRadius(4)
                Spacer()
            }
        }
        .padding()
    }
}

// MARK: - Color Helper Extension
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        let scanner = Scanner(string: hex)
        var rgb: UInt64 = 0
        scanner.scanHexInt64(&rgb)
        
        let red = Double((rgb >> 16) & 0xFF) / 255.0
        let green = Double((rgb >> 8) & 0xFF) / 255.0
        let blue = Double((rgb & 0xFF)) / 255.0
        
        self.init(red: red, green: green, blue: blue)
    }
}
