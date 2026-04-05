import SwiftUI

struct AISettingsView: View {
    @State private var providerManager = AIProviderManager.shared
    @State private var claudeApiKey: String = ""
    @State private var showingSaveConfirmation = false

    var body: some View {
        List {
            // Provider Selection
            Section {
                ForEach(AIProviderType.allCases, id: \.self) { provider in
                    Button {
                        withAnimation {
                            providerManager.selectedProvider = provider
                        }
                    } label: {
                        HStack {
                            Image(systemName: provider.icon)
                                .foregroundStyle(providerColor(provider))
                                .frame(width: 28)

                            VStack(alignment: .leading, spacing: 2) {
                                Text(provider.displayName)
                                    .font(.body)
                                    .foregroundStyle(.primary)
                                Text(provider.description)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }

                            Spacer()

                            if providerManager.selectedProvider == provider {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundStyle(.accent)
                            }
                        }
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                }
            } header: {
                Text("AI Provider")
            } footer: {
                currentStatusFooter
            }

            // On-Device Status
            Section {
                HStack {
                    Label("Apple Intelligence", systemImage: "apple.intelligence")
                    Spacer()
                    if providerManager.isOnDeviceAvailable {
                        Text("Ready")
                            .foregroundStyle(.green)
                    } else {
                        Text("Unavailable")
                            .foregroundStyle(.secondary)
                    }
                }

                if let reason = providerManager.onDeviceUnavailableReason {
                    HStack(alignment: .top) {
                        Image(systemName: "info.circle")
                            .foregroundStyle(.secondary)
                        Text(reason)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            } header: {
                Text("On-Device AI")
            } footer: {
                Text("On-device AI uses Apple's Foundation Models. All processing happens locally — your health data never leaves your device.")
            }

            // Cloud API Key (only show when cloud is selected or auto)
            if providerManager.selectedProvider != .onDevice {
                Section {
                    HStack {
                        Label("Claude API Key", systemImage: "key")
                        Spacer()
                        if KeychainHelper.load(key: "claude_api_key") != nil {
                            Text("Configured")
                                .foregroundStyle(.green)
                        } else {
                            Text("Using shared key")
                                .foregroundStyle(.secondary)
                        }
                    }

                    SecureField("sk-ant-...", text: $claudeApiKey)
                        .textContentType(.password)
                        .autocorrectionDisabled()

                    if !claudeApiKey.isEmpty {
                        Button("Save API Key") {
                            try? KeychainHelper.save(key: "claude_api_key", value: claudeApiKey)
                            claudeApiKey = ""
                            showingSaveConfirmation = true
                        }
                    }

                    if KeychainHelper.load(key: "claude_api_key") != nil {
                        Button("Remove API Key", role: .destructive) {
                            KeychainHelper.delete(key: "claude_api_key")
                        }
                    }
                } header: {
                    Text("Cloud AI (Claude)")
                } footer: {
                    Text("Optional. Provide your own Claude API key for higher rate limits. Without one, the shared server key is used.")
                }
            }

            // Privacy Info
            Section {
                VStack(alignment: .leading, spacing: 12) {
                    privacyRow(
                        icon: "lock.shield",
                        title: "On-Device Processing",
                        detail: "When using on-device AI, your health data is analyzed entirely on your iPhone. Nothing is sent to any server."
                    )

                    Divider()

                    privacyRow(
                        icon: "server.rack",
                        title: "Cloud Processing",
                        detail: "When using cloud AI, health data is sent to a secure server for analysis by Claude. Data is not stored after processing."
                    )

                    Divider()

                    privacyRow(
                        icon: "hand.raised",
                        title: "Your Choice",
                        detail: "You control which AI provider to use. Switch anytime in these settings."
                    )
                }
                .padding(.vertical, 4)
            } header: {
                Text("Privacy")
            }
        }
        .navigationTitle("AI Provider")
        .alert("API Key Saved", isPresented: $showingSaveConfirmation) {
            Button("OK") {}
        } message: {
            Text("Your Claude API key has been securely stored in the Keychain.")
        }
    }

    @ViewBuilder
    private var currentStatusFooter: some View {
        let effective = providerManager.effectiveProvider
        if effective != providerManager.selectedProvider {
            HStack(spacing: 4) {
                Image(systemName: "info.circle")
                Text("Currently using \(effective.displayName) because on-device AI is not available.")
            }
            .font(.caption)
            .foregroundStyle(.orange)
        }
    }

    private func providerColor(_ provider: AIProviderType) -> Color {
        switch provider {
        case .onDevice: return .green
        case .cloud: return .blue
        case .auto: return .purple
        }
    }

    private func privacyRow(icon: String, title: String, detail: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(.accent)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline.weight(.semibold))
                Text(detail)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

#Preview {
    NavigationStack {
        AISettingsView()
    }
}
