import Foundation
import CryptoKit
import os

/// Logs AI interactions to Supabase for future model training.
/// Only active when the user has opted in to data sharing.
@Observable
class AIInteractionLogger {
    static let shared = AIInteractionLogger()

    private let supabase = SupabaseService.shared
    private let defaults = UserDefaults.standard

    private static let consentKey = "ai_data_consent_given"

    var hasConsent: Bool {
        get { defaults.bool(forKey: Self.consentKey) }
        set { defaults.set(newValue, forKey: Self.consentKey) }
    }

    // MARK: - Consent Management

    func updateConsent(granted: Bool) async {
        hasConsent = granted

        guard let userId = supabase.currentSession?.user.id.uuidString else { return }

        let row = ConsentRow(
            userId: userId,
            consentGiven: granted,
            consentDate: granted ? ISO8601DateFormatter().string(from: Date()) : nil,
            consentVersion: "1.0"
        )

        do {
            try await supabase.client
                .from("ai_data_consent")
                .upsert(row)
                .execute()
            Logger.general.debug("[AILogger] Consent updated: \(granted)")
        } catch {
            Logger.general.debug("[AILogger] Failed to sync consent: \(error.localizedDescription)")
        }
    }

    // MARK: - Interaction Logging

    func log(
        type: InteractionType,
        provider: String,
        promptSummary: String,
        responseText: String,
        healthContextHash: String? = nil,
        responseTimeMs: Int? = nil
    ) async {
        guard hasConsent else { return }
        guard let userId = supabase.currentSession?.user.id.uuidString else { return }

        let row = InteractionRow(
            userId: userId,
            interactionType: type.rawValue,
            provider: provider,
            promptSummary: truncate(promptSummary, maxLength: 2000),
            responseText: truncate(responseText, maxLength: 5000),
            healthContextHash: healthContextHash,
            responseTimeMs: responseTimeMs
        )

        do {
            try await supabase.client
                .from("ai_interactions")
                .insert(row)
                .execute()
            Logger.general.debug("[AILogger] Logged \(type.rawValue) interaction")
        } catch {
            Logger.general.debug("[AILogger] Failed to log: \(error.localizedDescription)")
        }
    }

    /// Rate a previous interaction as helpful or not
    func rate(interactionId: String, rating: Rating) async {
        guard hasConsent else { return }

        do {
            try await supabase.client
                .from("ai_interactions")
                .update(["rating": rating.rawValue, "updated_at": ISO8601DateFormatter().string(from: Date())])
                .eq("id", value: interactionId)
                .execute()
            Logger.general.debug("[AILogger] Rated interaction: \(rating.rawValue)")
        } catch {
            Logger.general.debug("[AILogger] Failed to rate: \(error.localizedDescription)")
        }
    }

    // MARK: - Helpers

    /// Hash health context for deduplication without storing raw data
    static func hashContext(_ context: String) -> String {
        let data = Data(context.utf8)
        let digest = SHA256.hash(data: data)
        return digest.prefix(16).map { String(format: "%02x", $0) }.joined()
    }

    private func truncate(_ text: String, maxLength: Int) -> String {
        if text.count <= maxLength { return text }
        return String(text.prefix(maxLength))
    }

    // MARK: - Types

    enum InteractionType: String {
        case insight = "insight"
        case chat = "chat"
        case briefing = "briefing"
    }

    enum Rating: String {
        case helpful = "helpful"
        case notHelpful = "not_helpful"
    }

    private struct InteractionRow: Encodable {
        let userId: String
        let interactionType: String
        let provider: String
        let promptSummary: String
        let responseText: String
        let healthContextHash: String?
        let responseTimeMs: Int?

        enum CodingKeys: String, CodingKey {
            case userId = "user_id"
            case interactionType = "interaction_type"
            case provider
            case promptSummary = "prompt_summary"
            case responseText = "response_text"
            case healthContextHash = "health_context_hash"
            case responseTimeMs = "response_time_ms"
        }
    }

    private struct ConsentRow: Encodable {
        let userId: String
        let consentGiven: Bool
        let consentDate: String?
        let consentVersion: String

        enum CodingKeys: String, CodingKey {
            case userId = "user_id"
            case consentGiven = "consent_given"
            case consentDate = "consent_date"
            case consentVersion = "consent_version"
        }
    }
}
