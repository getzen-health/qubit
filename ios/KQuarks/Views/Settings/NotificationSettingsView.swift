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
                Toggle(isOn: $notificationService.morningReadinessEnabled) {
                    Label("Morning Readiness Alerts", systemImage: "heart.circle")
                }
            } header: {
                Text("Notification Types")
            } footer: {
                Text("Enable individual notification types you'd like to receive.")
            }

            Section {
                Toggle(isOn: $notificationService.hrvAlertEnabled) {
                    Label("HRV Alerts", systemImage: "waveform.circle")
                }

                Toggle(isOn: $notificationService.achievementEnabled) {
                    Label("Achievement Unlocked", systemImage: "star.circle")
                }

                Toggle(isOn: $notificationService.recoveryDipEnabled) {
                    Label("Low Recovery Alerts", systemImage: "exclamationmark.circle")
                }

                Toggle(isOn: $notificationService.weeklyDigestEnabled) {
                    Label("Weekly Digest", systemImage: "calendar.circle")
                }
            }

            Section {
                Toggle(isOn: $notificationService.stepReminderEnabled) {
                    Label("Afternoon Step Reminder", systemImage: "figure.walk")
                }
            } header: {
                Text("Activity")
            } footer: {
                Text("Reminds you between 4–8pm if you're below 50% of your step goal for the day.")
            }

            Section {
                Toggle(isOn: $notificationService.fastingMilestonesEnabled) {
                    Label("Fasting Milestones", systemImage: "timer")
                }
            } header: {
                Text("Fasting")
            } footer: {
                Text("Notifies you at 25%, 50%, 75%, and when you reach your fasting goal.")
            }

            Section {
                Toggle(isOn: Binding(
                    get: { notificationService.waterReminderEnabled },
                    set: { notificationService.waterReminderEnabled = $0; notificationService.scheduleWaterReminder() }
                )) {
                    Label("Daily Hydration Reminder", systemImage: "drop.fill")
                }
                if notificationService.waterReminderEnabled {
                    Stepper(
                        value: Binding(
                            get: { notificationService.waterReminderHour },
                            set: { notificationService.waterReminderHour = $0; notificationService.scheduleWaterReminder() }
                        ),
                        in: 8...20,
                        label: {
                            HStack {
                                Text("Time")
                                Spacer()
                                Text(hourLabel(notificationService.waterReminderHour))
                                    .foregroundStyle(.secondary)
                            }
                        }
                    )
                }
            } header: {
                Text("Hydration")
            } footer: {
                Text("A daily reminder to log your water and hit your hydration goal.")
            }

            Section {
                Toggle(isOn: Binding(
                    get: { notificationService.sleepReminderEnabled },
                    set: { notificationService.sleepReminderEnabled = $0; notificationService.scheduleSleepReminder() }
                )) {
                    Label("Wind-Down Reminder", systemImage: "moon.fill")
                }
                if notificationService.sleepReminderEnabled {
                    Stepper(
                        value: Binding(
                            get: { notificationService.sleepReminderHour },
                            set: { notificationService.sleepReminderHour = $0; notificationService.scheduleSleepReminder() }
                        ),
                        in: 18...23,
                        label: {
                            HStack {
                                Text("Time")
                                Spacer()
                                Text(hourLabel(notificationService.sleepReminderHour))
                                    .foregroundStyle(.secondary)
                            }
                        }
                    )
                }
            } header: {
                Text("Sleep")
            } footer: {
                Text("A nightly reminder to start winding down before bed.")
            }
        }
        .navigationTitle("Notifications")
        .toolbarTitleDisplayMode(.inline)
        .task { await notificationService.refreshAuthorizationStatus() }
    }
}

#Preview {
    NavigationStack {
        NotificationSettingsView()
    }
}

