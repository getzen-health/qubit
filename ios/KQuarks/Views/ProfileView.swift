import SwiftUI

struct ProfileView: View {
    @State private var showSignOutAlert = false
    
    var body: some View {
        NavigationStack {
            List {
                Section("Account") {
                    HStack {
                        Image(systemName: "person.circle.fill")
                            .font(.largeTitle)
                            .foregroundStyle(.secondary)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Health Tracker")
                                .font(.headline)
                            Text("Manage your profile")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 4)
                }
                
                Section("Health Settings") {
                    NavigationLink("Units (kg / lbs)") {
                        UnitsSettingsView()
                    }
                    NavigationLink("Notification Preferences") {
                        Text("Notification settings coming soon")
                            .foregroundStyle(.secondary)
                    }
                    NavigationLink("HealthKit Permissions") {
                        Text("Open Settings to manage HealthKit access")
                            .foregroundStyle(.secondary)
                    }
                }
                
                Section("App") {
                    NavigationLink("Privacy Policy") { Text("Privacy policy") }
                    NavigationLink("Terms of Service") { Text("Terms of service") }
                    HStack {
                        Text("Version")
                        Spacer()
                        Text(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0")
                            .foregroundStyle(.secondary)
                    }
                }
                
                Section {
                    Button(role: .destructive) {
                        showSignOutAlert = true
                    } label: {
                        HStack {
                            Spacer()
                            Text("Sign Out")
                            Spacer()
                        }
                    }
                }
            }
            .navigationTitle("Profile")
            .alert("Sign Out", isPresented: $showSignOutAlert) {
                Button("Sign Out", role: .destructive) { /* call auth sign out */ }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("Are you sure you want to sign out?")
            }
        }
    }
}

struct UnitsSettingsView: View {
    @AppStorage("useImperial") private var useImperial = false
    var body: some View {
        Form {
            Picker("Weight Unit", selection: $useImperial) {
                Text("Kilograms (kg)").tag(false)
                Text("Pounds (lbs)").tag(true)
            }
        }
        .navigationTitle("Units")
    }
}

#Preview { ProfileView() }
