import SwiftUI

// MARK: - AppLanguage Model

struct AppLanguage: Identifiable, Equatable {
    let id: String
    let displayName: String
    let flag: String
}

// MARK: - Language Manager

final class LanguageManager {
    static let shared = LanguageManager()
    private init() {}

    let supported: [AppLanguage] = [
        AppLanguage(id: "en", displayName: "English",    flag: "🇺🇸"),
        AppLanguage(id: "es", displayName: "Español",    flag: "🇪🇸"),
        AppLanguage(id: "fr", displayName: "Français",   flag: "🇫🇷"),
        AppLanguage(id: "pt", displayName: "Português",  flag: "🇧🇷"),
        AppLanguage(id: "de", displayName: "Deutsch",    flag: "🇩🇪"),
        AppLanguage(id: "ja", displayName: "日本語",      flag: "🇯🇵"),
        AppLanguage(id: "zh", displayName: "中文",        flag: "🇨🇳"),
        AppLanguage(id: "ko", displayName: "한국어",      flag: "🇰🇷"),
    ]

    var currentLanguageCode: String {
        (UserDefaults.standard.array(forKey: "AppleLanguages") as? [String])?.first?.components(separatedBy: "-").first
            ?? Locale.current.language.languageCode?.identifier
            ?? "en"
    }

    var currentLanguageDisplayName: String {
        supported.first { $0.id == currentLanguageCode }?.displayName ?? "English"
    }

    func setLanguage(_ code: String) {
        UserDefaults.standard.set([code], forKey: "AppleLanguages")
        UserDefaults.standard.synchronize()
    }
}

// MARK: - Language Settings View

struct LanguageSettingsView: View {
    @State private var selectedCode: String = LanguageManager.shared.currentLanguageCode
    @State private var showRestartAlert = false

    var body: some View {
        languageList
            .premiumList()
            .navigationTitle("Language")
            .toolbarTitleDisplayMode(.inline)
            .alert("Restart Required", isPresented: $showRestartAlert) {
                Button("Later", role: .cancel) { }
                Button("Restart Now", role: .destructive) {
                    exit(0)
                }
            } message: {
                Text("The language change will take effect after restarting the app.")
            }
    }

    private var languageList: some View {
        List {
            Section {
                languageRows
            }
        }
    }

    @ViewBuilder
    private var languageRows: some View {
        languageRow(LanguageManager.shared.supported[0])
        languageRow(LanguageManager.shared.supported[1])
        languageRow(LanguageManager.shared.supported[2])
        languageRow(LanguageManager.shared.supported[3])
        languageRow(LanguageManager.shared.supported[4])
        languageRow(LanguageManager.shared.supported[5])
        languageRow(LanguageManager.shared.supported[6])
        languageRow(LanguageManager.shared.supported[7])
    }

    @ViewBuilder
    private func languageRow(_ lang: AppLanguage) -> some View {
        Button {
            if lang.id != selectedCode {
                selectedCode = lang.id
                LanguageManager.shared.setLanguage(lang.id)
                showRestartAlert = true
            }
        } label: {
            HStack(spacing: 14) {
                Text(verbatim: lang.flag)
                    .font(.title2)
                Text(verbatim: lang.displayName)
                    .foregroundStyle(.primary)
                Spacer()
                if lang.id == selectedCode {
                    Image(systemName: "checkmark")
                        .foregroundStyle(.accent)
                        .fontWeight(.semibold)
                }
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}
