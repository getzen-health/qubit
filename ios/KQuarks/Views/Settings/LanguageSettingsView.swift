import SwiftUI

// MARK: - AppLanguage Model

struct AppLanguage: Identifiable, Equatable {
    let id: String
    let displayName: String
    let flag: String
}

// MARK: - Language Manager

@Observable
final class LanguageManager {
    static let shared = LanguageManager()
    private init() {
        selectedLanguageCode = UserDefaults.standard.string(forKey: "userSelectedLanguage") ?? "en"
    }

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

    var selectedLanguageCode: String {
        didSet {
            UserDefaults.standard.set(selectedLanguageCode, forKey: "userSelectedLanguage")
        }
    }

    var currentLocale: Locale { Locale(identifier: selectedLanguageCode) }

    var currentLanguageDisplayName: String {
        supported.first { $0.id == selectedLanguageCode }?.displayName ?? "English"
    }
}

// MARK: - Language Settings View

struct LanguageSettingsView: View {
    @State private var langManager = LanguageManager.shared

    var body: some View {
        languageList
            .premiumList()
            .navigationTitle("Language")
            .toolbarTitleDisplayMode(.inline)
    }

    private var languageList: some View {
        List {
            Section {
                languageRows
            } footer: {
                Text("Language changes take effect immediately.")
                    .font(.caption)
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
            langManager.selectedLanguageCode = lang.id
        } label: {
            HStack(spacing: 14) {
                Text(verbatim: lang.flag)
                    .font(.title2)
                Text(verbatim: lang.displayName)
                    .foregroundStyle(.primary)
                Spacer()
                if lang.id == langManager.selectedLanguageCode {
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
