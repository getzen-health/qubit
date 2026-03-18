import SwiftUI

struct NotificationSettingsView: View {
    @Bindable var notificationService = NotificationService.shared

    private func hourLabel(_ hour: Int) -> String {
        let components = DateComponents(hour: hour, minute: 0)
        let date = Calendar.current.date(from: components) ?? Date()
        return date.formatted(date: .omitted, time: .shortened)
    }

    var body: some View {
        Form {
            Section {
                HStack {
                    Label("Notifications", systemImage: "bell")
                    Spacer()
                    if notificationService.isAuthorized {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                    } else {
                        Button("Enable") {
                            Task { await notificationService.requestPermission() }
                        }
                        .buttonStyle(.borderless)
                    }
                }
            } footer: {
                if !notificationService.isAuthorized {
                    Text("Grant notification permission to receive morning briefs and activity reminders.")
                }
            }

            Section {
                Stepper(
                    value: $notificationService.morningBriefHour,
                    in: 4...11,
                    label: {
                        HStack {
                            Label("Time", systemImage: "sun.horizon")
                            Spacer()
                            Text(hourLabel(notificationService.morningBriefHour))
                                .foregroundStyle(.secondary)
                        }
                    }
                )
            } header: {
                Text("Morning Brief")
            } footer: {
                Text("A daily summary of yesterday's activity and today's step goal, delivered each morning.")
            }

            Section {
                Toggle(isOn: $notificationService.stepReminderEnabled) {
                    Label("Afternoon Step Reminder", systemImage: "figure.walk")
                }
            } header: {
                Text("Activity Reminder")
            } footer: {
                Text("Reminds you between 4–8pm if you're below 50% of your step goal for the day.")
            }
        }
        .navigationTitle("Notifications")
        .navigationBarTitleDisplayMode(.inline)
        .task { await notificationService.refreshAuthorizationStatus() }
    }
}

#Preview {
    NavigationStack {
        NotificationSettingsView()
    }
}
