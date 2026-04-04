import SwiftUI
import ObjectiveC

// MARK: - Bundle Swizzling for In-App Language Switching

private var _languageBundleKey: UInt8 = 0

extension Bundle {
    private static var _swizzled = false

    /// The language-specific bundle to use for lookups
    var _languageOverride: Bundle? {
        get { objc_getAssociatedObject(self, &_languageBundleKey) as? Bundle }
        set { objc_setAssociatedObject(self, &_languageBundleKey, newValue, .OBJC_ASSOCIATION_RETAIN_NONATOMIC) }
    }

    /// Swizzled implementation of localizedString(forKey:value:table:)
    @objc dynamic func _swizzled_localizedString(forKey key: String, value: String?, table tableName: String?) -> String {
        if let override = _languageOverride {
            let result = override.localizedString(forKey: key, value: value, table: tableName)
            // If the override bundle returned the key itself (no translation), return result anyway (English fallback)
            return result
        }
        // Call original (this actually calls the original because methods are swapped)
        return _swizzled_localizedString(forKey: key, value: value, table: tableName)
    }

    static func swapLanguage(_ code: String) {
        // One-time swizzle of Bundle's localizedString method
        if !_swizzled {
            let original = class_getInstanceMethod(Bundle.self, #selector(Bundle.localizedString(forKey:value:table:)))!
            let replacement = class_getInstanceMethod(Bundle.self, #selector(Bundle._swizzled_localizedString(forKey:value:table:)))!
            method_exchangeImplementations(original, replacement)
            _swizzled = true
        }

        let path = Bundle.main.path(forResource: code, ofType: "lproj")
            ?? Bundle.main.path(forResource: "en", ofType: "lproj")
        guard let p = path, let langBundle = Bundle(path: p) else { return }
        Bundle.main._languageOverride = langBundle
    }
}

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
        Bundle.swapLanguage(selectedLanguageCode)
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

    var viewRefreshID = UUID()

    var selectedLanguageCode: String {
        didSet {
            UserDefaults.standard.set(selectedLanguageCode, forKey: "userSelectedLanguage")
            Bundle.swapLanguage(selectedLanguageCode)
            viewRefreshID = UUID()
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
