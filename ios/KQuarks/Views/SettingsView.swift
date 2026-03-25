import SwiftUI

struct SettingsView: View {
    @Environment(AppState.self) private var appState
    @State private var showingSignOutAlert = false
    @State private var showingDeleteDataAlert = false
    @State private var showingHistoricalSyncConfirm = false
    @State private var isDeletingData = false
    @State private var deleteError: String?
    @State private var biometricEnabled = false

    private let syncService = SyncService.shared
    private let supabaseService = SupabaseService.shared
    private let notificationService = NotificationService.shared
    private let biometric = BiometricService.shared

    @ViewBuilder
    private var privacySection: some View {
        if biometric.isAvailable {
            Section {
                Toggle(isOn: $biometricEnabled) {
                    Label("Require \(biometric.biometryName)", systemImage: biometric.biometryIcon)
                }
                .onChange(of: biometricEnabled) {
                    biometric.isEnabled = biometricEnabled
                }
            } header: {
                Text("Privacy")
            } footer: {
                Text("Lock the app when it goes to the background. \(biometric.biometryName) will be required to reopen.")
            }
        }
    }

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
                    .disabled(syncService.isSyncing || syncService.isHistoricalSyncing)

                    Button {
                        showingHistoricalSyncConfirm = true
                    } label: {
                        HStack {
                            Label("Sync Health History", systemImage: "clock.arrow.trianglehead.counterclockwise.rotate.90")
                            Spacer()
                            if syncService.isHistoricalSyncing {
                                ProgressView()
                            }
                        }
                    }
                    .disabled(syncService.isSyncing || syncService.isHistoricalSyncing)

                    if syncService.isHistoricalSyncing {
                        VStack(alignment: .leading, spacing: 4) {
                            ProgressView(value: syncService.historicalSyncProgress)
                                .tint(.accentColor)
                            Text("\(Int(syncService.historicalSyncProgress * 100))% — syncing up to 1 year of history…")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 2)
                    }
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

                // Achievements
                Section("Progress") {
                    NavigationLink {
                        AchievementsView()
                    } label: {
                        Label("Achievements", systemImage: "trophy")
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

                    NavigationLink {
                        ProfileSettingsView()
                    } label: {
                        Label("Physical Profile", systemImage: "person.text.rectangle")
                    }

                    NavigationLink {
                        GoalsSettingsView()
                    } label: {
                        Label("Health Goals", systemImage: "target")
                    }

                    NavigationLink {
                        NutritionGoalsView()
                    } label: {
                        Label("Nutrition Goals", systemImage: "fork.knife")
                    }

                    NavigationLink {
                        ExportDataView()
                    } label: {
                        Label("Export Data", systemImage: "square.and.arrow.up")
                    }

                    Button(role: .destructive) {
                        showingDeleteDataAlert = true
                    } label: {
                        HStack {
                            Label("Delete Synced Data", systemImage: "trash")
                            Spacer()
                            if isDeletingData {
                                ProgressView()
                            }
                        }
                    }
                    .disabled(isDeletingData)
                }

                privacySection

                // Notifications
                Section("Notifications") {
                    NavigationLink {
                        NotificationSettingsView()
                    } label: {
                        HStack {
                            Label("Notifications", systemImage: "bell")
                            Spacer()
                            if notificationService.isAuthorized {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundStyle(.green)
                            } else {
                                Text("Off")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }

                // App section
                Section("App") {
                    NavigationLink {
                        AboutView()
                    } label: {
                        Label("About", systemImage: "info.circle")
                    }

                    Link(destination: URL(string: "https://kquarks.app/privacy")!) {
                        Label("Privacy Policy", systemImage: "hand.raised")
                    }

                    Link(destination: URL(string: "https://kquarks.app/terms")!) {
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
                        Text(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Settings")
            .toolbarTitleDisplayMode(.inline)
            .onAppear { biometricEnabled = biometric.isEnabled }
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
                    Task {
                        isDeletingData = true
                        do {
                            try await supabaseService.deleteAllUserData()
                        } catch {
                            deleteError = error.localizedDescription
                        }
                        isDeletingData = false
                    }
                }
            } message: {
                Text("This will delete all your synced health data from the cloud. This action cannot be undone.")
            }
            .alert("Delete Failed", isPresented: Binding(
                get: { deleteError != nil },
                set: { if !$0 { deleteError = nil } }
            )) {
                Button("OK", role: .cancel) { deleteError = nil }
            } message: {
                Text(deleteError ?? "")
            }
            .alert("Sync Health History", isPresented: $showingHistoricalSyncConfirm) {
                Button("Cancel", role: .cancel) { }
                Button("Sync") {
                    Task {
                        await syncService.performHistoricalSync(daysBack: 365)
                    }
                }
            } message: {
                Text("This will sync up to 1 year of your Apple Health data (steps, sleep, workouts, heart rate). This may take a few minutes.")
            }
        }
    }
}

// MARK: - AI Settings View

struct AISettingsView: View {
    @State private var selectedProvider: AIProvider = {
        let saved = UserDefaults.standard.string(forKey: "ai_provider") ?? "claude"
        return AIProvider(rawValue: saved) ?? .claude
    }()
    @State private var apiKey: String = ""
    @State private var showSavedAlert = false
    @State private var hasExistingKey = false

    var body: some View {
        List {
            Section {
                Picker("Provider", selection: $selectedProvider) {
                    ForEach(AIProvider.allCases, id: \.self) { provider in
                        Text(provider.title).tag(provider)
                    }
                }
            } footer: {
                Text("Claude is the default AI provider. Your health data is sent securely to generate personalized insights.")
            }

            Section {
                if selectedProvider == .claude {
                    SecureField(hasExistingKey ? "••••••••••••••••" : "Enter Claude API Key (optional)", text: $apiKey)
                        .textContentType(.password)
                        .autocorrectionDisabled()

                    if hasExistingKey {
                        Button("Remove Saved Key", role: .destructive) {
                            KeychainHelper.delete(key: "claude_api_key")
                            apiKey = ""
                            hasExistingKey = false
                        }
                    }
                } else {
                    SecureField("Enter API Key", text: $apiKey)
                        .textContentType(.password)
                        .autocorrectionDisabled()
                }
            } header: {
                Text("API Key")
            } footer: {
                if selectedProvider == .claude {
                    Text("Optional. If not provided, the app's built-in key will be used. Your key is stored securely in the iOS Keychain and never leaves your device except to authenticate API calls.")
                } else {
                    Text("Required for this provider. Your key is stored securely in the iOS Keychain.")
                }
            }

            Section {
                Button("Save") {
                    saveSettings()
                }
                .disabled(needsApiKey && apiKey.isEmpty && !hasExistingKey)
            }

            Section {
                Button("Generate Insights Now") {
                    Task {
                        _ = await AIInsightsService.shared.generateInsights()
                    }
                }
                .disabled(AIInsightsService.shared.isGenerating)

                if AIInsightsService.shared.isGenerating {
                    HStack {
                        ProgressView()
                        Text("Analyzing your health data...")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                if let error = AIInsightsService.shared.lastError {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.red)
                }
            }
        }
        .navigationTitle("AI Provider")
        .toolbarTitleDisplayMode(.inline)
        .alert("Settings Saved", isPresented: $showSavedAlert) {
            Button("OK") { }
        }
        .onAppear {
            hasExistingKey = KeychainHelper.load(key: "claude_api_key") != nil
        }
    }

    private var needsApiKey: Bool {
        selectedProvider != .claude
    }

    private func saveSettings() {
        UserDefaults.standard.set(selectedProvider.rawValue, forKey: "ai_provider")

        if !apiKey.isEmpty {
            let keyName: String
            switch selectedProvider {
            case .claude: keyName = "claude_api_key"
            case .openai: keyName = "openai_api_key"
            case .custom: keyName = "custom_api_key"
            }
            try? KeychainHelper.save(key: keyName, value: apiKey)
            hasExistingKey = true
            apiKey = ""
        }

        showSavedAlert = true
    }
}

enum AIProvider: String, CaseIterable {
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
        .toolbarTitleDisplayMode(.inline)
    }
}

#Preview {
    SettingsView()
        .environment(AppState())
}
