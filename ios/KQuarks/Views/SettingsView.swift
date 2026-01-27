import SwiftUI

struct SettingsView: View {
    @Environment(AppState.self) private var appState
    @State private var showingSignOutAlert = false
    @State private var showingDeleteDataAlert = false

    private let syncService = SyncService.shared

    var body: some View {
        NavigationStack {
            List {
                // Account section
                Section("Account") {
                    if let user = appState.user {
                        HStack {
                            Image(systemName: "person.circle.fill")
                                .font(.largeTitle)
                                .foregroundColor(.accentColor)

                            VStack(alignment: .leading) {
                                Text(user.displayName ?? "User")
                                    .font(.headline)
                                if let email = user.email {
                                    Text(email)
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                        .padding(.vertical, 4)
                    } else {
                        Button {
                            // Sign in
                        } label: {
                            Label("Sign In", systemImage: "person.badge.plus")
                        }
                    }
                }

                // Sync section
                Section("Data Sync") {
                    HStack {
                        Label("Last Sync", systemImage: "arrow.triangle.2.circlepath")
                        Spacer()
                        if let lastSync = syncService.lastSyncDate {
                            Text(lastSync, style: .relative)
                                .foregroundColor(.secondary)
                        } else {
                            Text("Never")
                                .foregroundColor(.secondary)
                        }
                    }

                    Button {
                        Task {
                            await syncService.performFullSync()
                        }
                    } label: {
                        HStack {
                            Label("Sync Now", systemImage: "arrow.clockwise")
                            Spacer()
                            if syncService.isSyncing {
                                ProgressView()
                            }
                        }
                    }
                    .disabled(syncService.isSyncing)
                }

                // Appearance
                Section("Appearance") {
                    NavigationLink {
                        AppearanceSettingsView()
                    } label: {
                        Label("Theme & Colors", systemImage: "paintpalette")
                    }

                    NavigationLink {
                        DashboardConfigView()
                    } label: {
                        Label("Dashboard Widgets", systemImage: "square.grid.2x2")
                    }
                }

                // AI Settings
                Section("AI Insights") {
                    NavigationLink {
                        AISettingsView()
                    } label: {
                        Label("AI Provider", systemImage: "sparkles")
                    }
                }

                // Health section
                Section("Health Data") {
                    Button {
                        if let url = URL(string: UIApplication.openSettingsURLString) {
                            UIApplication.shared.open(url)
                        }
                    } label: {
                        Label("Health Permissions", systemImage: "heart.text.square")
                    }

                    Button(role: .destructive) {
                        showingDeleteDataAlert = true
                    } label: {
                        Label("Delete Synced Data", systemImage: "trash")
                    }
                }

                // App section
                Section("App") {
                    NavigationLink {
                        AboutView()
                    } label: {
                        Label("About", systemImage: "info.circle")
                    }

                    Link(destination: URL(string: "https://example.com/privacy")!) {
                        Label("Privacy Policy", systemImage: "hand.raised")
                    }

                    Link(destination: URL(string: "https://example.com/terms")!) {
                        Label("Terms of Service", systemImage: "doc.text")
                    }
                }

                // Sign out
                if appState.isAuthenticated {
                    Section {
                        Button(role: .destructive) {
                            showingSignOutAlert = true
                        } label: {
                            Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
                        }
                    }
                }

                // Version
                Section {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Settings")
            .alert("Sign Out", isPresented: $showingSignOutAlert) {
                Button("Cancel", role: .cancel) { }
                Button("Sign Out", role: .destructive) {
                    Task {
                        await appState.signOut()
                    }
                }
            } message: {
                Text("Are you sure you want to sign out?")
            }
            .alert("Delete Data", isPresented: $showingDeleteDataAlert) {
                Button("Cancel", role: .cancel) { }
                Button("Delete", role: .destructive) {
                    // TODO: Delete synced data
                }
            } message: {
                Text("This will delete all your synced health data from the cloud. This action cannot be undone.")
            }
        }
    }
}

// MARK: - AI Settings View

struct AISettingsView: View {
    @State private var selectedProvider: AIProvider = .claude
    @State private var customApiKey = ""

    var body: some View {
        List {
            Section {
                Picker("Provider", selection: $selectedProvider) {
                    ForEach(AIProvider.allCases, id: \.self) { provider in
                        Text(provider.title).tag(provider)
                    }
                }
            } footer: {
                Text("Select which AI provider to use for generating health insights.")
            }

            if selectedProvider == .openai || selectedProvider == .custom {
                Section("API Key") {
                    SecureField("Enter API Key", text: $customApiKey)
                }
            }

            Section {
                Button("Save") {
                    // TODO: Save to Supabase
                }
                .disabled(needsApiKey && customApiKey.isEmpty)
            }
        }
        .navigationTitle("AI Provider")
    }

    private var needsApiKey: Bool {
        selectedProvider == .openai || selectedProvider == .custom
    }
}

enum AIProvider: CaseIterable {
    case claude
    case openai
    case custom

    var title: String {
        switch self {
        case .claude: return "Claude (Default)"
        case .openai: return "OpenAI GPT-4"
        case .custom: return "Custom API"
        }
    }
}

// MARK: - About View

struct AboutView: View {
    var body: some View {
        List {
            Section {
                VStack(spacing: 16) {
                    Image(systemName: "atom")
                        .font(.system(size: 60))
                        .foregroundStyle(.purple, .indigo.opacity(0.3))

                    Text("KQuarks")
                        .font(.title.bold())

                    Text("Your personal health dashboard with AI-powered insights.")
                        .font(.body)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical)
            }

            Section("Features") {
                Label("Apple Health Sync", systemImage: "heart.fill")
                Label("Web Dashboard", systemImage: "globe")
                Label("AI Insights", systemImage: "sparkles")
                Label("Privacy Focused", systemImage: "lock.shield")
            }

            Section {
                Link(destination: URL(string: "https://github.com/qxlsz/kquarks")!) {
                    Label("View on GitHub", systemImage: "link")
                }
            }
        }
        .navigationTitle("About")
    }
}

#Preview {
    SettingsView()
        .environment(AppState())
}
