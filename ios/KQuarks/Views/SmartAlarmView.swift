import SwiftUI

struct SmartAlarmView: View {
    @State private var bedtime = Calendar.current.date(bySettingHour: 23, minute: 0, second: 0, of: Date()) ?? Date()
    @State private var wakeTarget = Calendar.current.date(bySettingHour: 7, minute: 0, second: 0, of: Date()) ?? Date()
    private let cycleDuration: TimeInterval = 90 * 60 // 90-minute sleep cycle

    var optimalWakeTimes: [Date] {
        // Calculate optimal wake times based on 90-min sleep cycles (4, 5, or 6 cycles)
        let fallAsleepOffset: TimeInterval = 15 * 60 // average 15 min to fall asleep
        let asleepTime = bedtime.addingTimeInterval(fallAsleepOffset)
        return [4, 5, 6].map { cycles in
            asleepTime.addingTimeInterval(TimeInterval(cycles) * cycleDuration)
        }
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    DatePicker("Bedtime", selection: $bedtime, displayedComponents: .hourAndMinute)
                } header: {
                    Text("Set Your Bedtime")
                } footer: {
                    Text("Wake times are calculated based on 90-minute sleep cycles.")
                }

                Section("Optimal Wake Times") {
                    ForEach(Array(zip(optimalWakeTimes.indices, optimalWakeTimes)), id: \.0) { index, time in
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(timeString(time))
                                    .font(.headline)
                                Text("\(index + 4) cycles · \((index + 4) * 90 / 60)h \((index + 4) * 90 % 60)m of sleep")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            if index == 1 {
                                Text("Recommended")
                                    .font(.caption2)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 3)
                                    .background(Color.green.opacity(0.2))
                                    .foregroundStyle(.green)
                                    .clipShape(Capsule())
                            }
                        }
                        .padding(.vertical, 2)
                    }
                }

                Section("Sleep Tips") {
                    Label("Aim for 5–6 complete cycles (7.5–9 hours)", systemImage: "moon.stars")
                    Label("Avoid screens 30 mins before bed", systemImage: "iphone.slash")
                    Label("Keep your room cool (65–68°F / 18–20°C)", systemImage: "thermometer.medium")
                }
                .font(.subheadline)
                .foregroundStyle(.secondary)
            }
            .navigationTitle("Smart Alarm")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private func timeString(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "h:mm a"
        return f.string(from: date)
    }
}

#Preview { SmartAlarmView() }
