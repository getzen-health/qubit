import Foundation
import os

/// AI provider selection — controls whether insights, chat, and briefings
/// use on-device Apple Intelligence or cloud-based Claude API.
enum AIProviderType: String, CaseIterable, Codable {
    case onDevice = "on_device"
    case cloud = "cloud"
    case auto = "auto"

    var displayName: String {
        switch self {
        case .onDevice: return "On-Device (Private)"
        case .cloud: return "Cloud (Claude)"
        case .auto: return "Auto"
        }
    }

    var description: String {
        switch self {
        case .onDevice:
            return "All AI runs locally on your device. Your health data never leaves your phone."
        case .cloud:
            return "Uses Claude AI via secure server. Better for complex analysis."
        case .auto:
            return "Uses on-device AI when available, falls back to cloud."
        }
    }

    var icon: String {
        switch self {
        case .onDevice: return "iphone"
        case .cloud: return "cloud"
        case .auto: return "sparkles"
        }
    }
}

/// Routes AI requests to the appropriate provider (on-device or cloud).
@Observable
class AIProviderManager {
    static let shared = AIProviderManager()

    private let defaults = UserDefaults.standard
    private static let providerKey = "ai_provider_type"

    var selectedProvider: AIProviderType {
        didSet {
            defaults.set(selectedProvider.rawValue, forKey: Self.providerKey)
        }
    }

    var isOnDeviceAvailable: Bool {
        OnDeviceAIService.shared.isAvailable
    }

    var onDeviceUnavailableReason: String? {
        OnDeviceAIService.shared.unavailableReason
    }

    /// The provider that will actually be used for the next request
    var effectiveProvider: AIProviderType {
        switch selectedProvider {
        case .onDevice:
            return isOnDeviceAvailable ? .onDevice : .cloud
        case .cloud:
            return .cloud
        case .auto:
            return isOnDeviceAvailable ? .onDevice : .cloud
        }
    }

    init() {
        if let saved = defaults.string(forKey: Self.providerKey),
           let provider = AIProviderType(rawValue: saved) {
            self.selectedProvider = provider
        } else {
            // Default to auto — prefer on-device when available
            self.selectedProvider = .auto
        }
    }

    // MARK: - Insights

    func generateInsights() async -> AIInsightsService.AIAnalysisResult? {
        let provider = effectiveProvider
        let startTime = CFAbsoluteTimeGetCurrent()

        if provider == .onDevice {
            do {
                let context = try await AIInsightsService.shared.buildHealthContextPublic()
                let result = try await OnDeviceAIService.shared.generateInsights(context: context)
                Logger.general.debug("[AIProvider] On-device insights generated successfully")

                let elapsed = Int((CFAbsoluteTimeGetCurrent() - startTime) * 1000)
                let contextStr = String(describing: context)
                await AIInteractionLogger.shared.log(
                    type: .insight,
                    provider: "on_device",
                    promptSummary: "Health insights generation",
                    responseText: result.insights.map { $0.title + ": " + $0.content }.joined(separator: "\n"),
                    healthContextHash: AIInteractionLogger.hashContext(contextStr),
                    responseTimeMs: elapsed
                )

                return result
            } catch {
                Logger.general.debug("[AIProvider] On-device failed, falling back to cloud: \(error.localizedDescription)")
                if selectedProvider == .auto {
                    let result = await AIInsightsService.shared.generateInsights()
                    if let result {
                        let elapsed = Int((CFAbsoluteTimeGetCurrent() - startTime) * 1000)
                        await AIInteractionLogger.shared.log(
                            type: .insight,
                            provider: "cloud",
                            promptSummary: "Health insights generation (fallback)",
                            responseText: result.insights.map { $0.title + ": " + $0.content }.joined(separator: "\n"),
                            responseTimeMs: elapsed
                        )
                    }
                    return result
                }
                return nil
            }
        }

        let result = await AIInsightsService.shared.generateInsights()
        if let result {
            let elapsed = Int((CFAbsoluteTimeGetCurrent() - startTime) * 1000)
            await AIInteractionLogger.shared.log(
                type: .insight,
                provider: "cloud",
                promptSummary: "Health insights generation",
                responseText: result.insights.map { $0.title + ": " + $0.content }.joined(separator: "\n"),
                responseTimeMs: elapsed
            )
        }
        return result
    }

    // MARK: - Chat

    func chat(message: String, history: [(role: String, content: String)]) async throws -> String {
        let provider = effectiveProvider
        let startTime = CFAbsoluteTimeGetCurrent()

        if provider == .onDevice {
            do {
                let response = try await OnDeviceAIService.shared.chat(message: message, history: history)
                Logger.general.debug("[AIProvider] On-device chat response generated")

                let elapsed = Int((CFAbsoluteTimeGetCurrent() - startTime) * 1000)
                await AIInteractionLogger.shared.log(
                    type: .chat,
                    provider: "on_device",
                    promptSummary: message,
                    responseText: response,
                    responseTimeMs: elapsed
                )

                return response
            } catch {
                Logger.general.debug("[AIProvider] On-device chat failed: \(error.localizedDescription)")
                if selectedProvider == .auto {
                    throw error // Let caller handle cloud fallback
                }
                throw error
            }
        }

        throw OnDeviceAIError.notAvailable // Caller uses existing cloud path
    }

    // MARK: - Briefing

    func generateBriefing() async -> String? {
        let provider = effectiveProvider
        let startTime = CFAbsoluteTimeGetCurrent()

        if provider == .onDevice {
            do {
                let context = try await AIInsightsService.shared.buildHealthContextPublic()
                let briefing = try await OnDeviceAIService.shared.generateBriefing(context: context)
                Logger.general.debug("[AIProvider] On-device briefing generated")

                let elapsed = Int((CFAbsoluteTimeGetCurrent() - startTime) * 1000)
                let contextStr = String(describing: context)
                await AIInteractionLogger.shared.log(
                    type: .briefing,
                    provider: "on_device",
                    promptSummary: "Morning briefing generation",
                    responseText: briefing,
                    healthContextHash: AIInteractionLogger.hashContext(contextStr),
                    responseTimeMs: elapsed
                )

                return briefing
            } catch {
                Logger.general.debug("[AIProvider] On-device briefing failed: \(error.localizedDescription)")
                return nil
            }
        }

        return nil // Caller uses existing cloud path
    }
}
