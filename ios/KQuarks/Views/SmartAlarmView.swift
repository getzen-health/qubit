import SwiftUI
import UserNotifications

struct SmartAlarmView: View {
    @State private var targetWakeTime = Calendar.current.date(bySettingHour: 7, minute: 0, second: 0, of: Date()) ?? Date()
    @State private var windowMinutes = 30
    @State private var isEnabled = false
    @AppStorage("smartAlarmEnabled") private var alarmEnabled = false
    @AppStorage("smartAlarmTargetTime") private var alarmTargetTimeInterval: Double = 0
    @AppStorage("smartAlarmWindowMinutes") private var alarmWindowMinutes = 30
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Smart Alarm") {
                    Toggle("Enable Smart Alarm", isOn: $isEnabled)
                        .onChange(of: isEnabled) { _, val in
                            alarmEnabled = val
                            if val { scheduleAlarm() } else { cancelAlarm() }
                        }
                    
                    if isEnabled {
                        DatePicker("Wake by", selection: $targetWakeTime, displayedComponents: .hourAndMinute)
                        
                        Stepper("Window: \(windowMinutes) min", value: $windowMinutes, in: 10...60, step: 10)
                        
                        Text("Will wake you during light sleep within \(windowMinutes) minutes of \(targetWakeTime.formatted(date: .omitted, time: .shortened))")
                            .font(.caption).foregroundColor(.secondary)
                    }
                }
                
                Section("How it works") {
                    Label("Monitors your sleep stage via Apple Health", systemImage: "bed.double.fill")
                    Label("Wakes you during Awake or REM stage", systemImage: "alarm")
                    Label("Never wakes you more than \(windowMinutes)min early", systemImage: "clock.badge.checkmark")
                }
            }
            .navigationTitle("Smart Alarm")
            .onAppear {
                isEnabled = alarmEnabled
                windowMinutes = alarmWindowMinutes
                if alarmTargetTimeInterval > 0 {
                    targetWakeTime = Date(timeIntervalSince1970: alarmTargetTimeInterval)
                }
            }
        }
    }
    
    func scheduleAlarm() {
        alarmTargetTimeInterval = targetWakeTime.timeIntervalSince1970
        alarmWindowMinutes = windowMinutes
        
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { granted, _ in
            guard granted else { return }
            
            let content = UNMutableNotificationContent()
            content.title = "Good Morning! 🌅"
            content.body = "Smart alarm: you're in a light sleep stage — great time to wake up!"
            content.sound = .defaultCritical
            
            // Schedule at the earliest wake time (target - window)
            let earliestWake = targetWakeTime.addingTimeInterval(-Double(windowMinutes) * 60)
            let components = Calendar.current.dateComponents([.hour, .minute], from: earliestWake)
            let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
            
            let request = UNNotificationRequest(identifier: "smart-alarm", content: content, trigger: trigger)
            UNUserNotificationCenter.current().add(request)
        }
    }
    
    func cancelAlarm() {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ["smart-alarm"])
    }
}

#Preview {
    SmartAlarmView()
}
