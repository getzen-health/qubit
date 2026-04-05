import Foundation
import os

#if canImport(FoundationModels)
import FoundationModels
#endif

/// On-device AI service using Apple Foundation Models (iOS 26+).
/// All inference runs locally — health data never leaves the device.
@Observable
class OnDeviceAIService {
    static let shared = OnDeviceAIService()

    var isAvailable: Bool {
        #if canImport(FoundationModels)
        if #available(iOS 26, *) {
            return SystemLanguageModel.default.isAvailable
        }
        #endif
        return false
    }

    var unavailableReason: String? {
        #if canImport(FoundationModels)
        if #available(iOS 26, *) {
            switch SystemLanguageModel.default.availability {
            case .available:
                return nil
            case .unavailable(let reason):
                switch reason {
                case .deviceNotEligible:
                    return "Device not supported (requires iPhone 15 Pro or later)"
                case .appleIntelligenceNotEnabled:
                    return "Enable Apple Intelligence in Settings → Apple Intelligence & Siri"
                case .modelNotReady:
                    return "Model is downloading… check back soon"
                @unknown default:
                    return "Model unavailable"
                }
            @unknown default:
                return "Unknown status"
            }
        }
        #endif
        return "Requires iOS 26 or later"
    }

    // MARK: - Generate Insights

    func generateInsights(context: AIInsightsService.HealthContext) async throws -> AIInsightsService.AIAnalysisResult {
        #if canImport(FoundationModels)
        if #available(iOS 26, *) {
            return try await generateInsightsOnDevice(context: context)
        }
        #endif
        throw OnDeviceAIError.notAvailable
    }

    // MARK: - Health Chat

    func chat(message: String, history: [(role: String, content: String)]) async throws -> String {
        #if canImport(FoundationModels)
        if #available(iOS 26, *) {
            return try await chatOnDevice(message: message, history: history)
        }
        #endif
        throw OnDeviceAIError.notAvailable
    }

    // MARK: - Morning Briefing

    func generateBriefing(context: AIInsightsService.HealthContext) async throws -> String {
        #if canImport(FoundationModels)
        if #available(iOS 26, *) {
            return try await generateBriefingOnDevice(context: context)
        }
        #endif
        throw OnDeviceAIError.notAvailable
    }
}

// MARK: - Error

enum OnDeviceAIError: LocalizedError {
    case notAvailable
    case generationFailed(String)
    case guardrailViolation

    var errorDescription: String? {
        switch self {
        case .notAvailable:
            return "On-device AI is not available on this device"
        case .generationFailed(let reason):
            return "AI generation failed: \(reason)"
        case .guardrailViolation:
            return "The request was blocked by content safety filters"
        }
    }
}

// MARK: - Foundation Models Implementation (iOS 26+)

#if canImport(FoundationModels)
@available(iOS 26, *)
extension OnDeviceAIService {

    // MARK: - Generable Types

    @Generable
    struct OnDeviceInsightResult {
        @Guide(description: "Recovery score from 0-100 based on sleep, HRV, and resting heart rate")
        let recoveryScore: Int

        @Guide(description: "Strain score from 0-21 based on activity intensity and duration")
        let strainScore: Double

        @Guide(description: "4-6 personalized health insights")
        let insights: [OnDeviceInsight]
    }

    @Generable
    struct OnDeviceInsight {
        @Guide(description: "Category: sleep, activity, heart, recovery, nutrition, or wellbeing")
        let category: String

        @Guide(description: "Short insight title, max 8 words")
        let title: String

        @Guide(description: "Actionable insight text, 1-2 sentences")
        let content: String

        @Guide(description: "Priority: high, normal, or low")
        let priority: String
    }

    @Generable
    struct OnDeviceChatResponse {
        @Guide(description: "Helpful health response under 150 words")
        let response: String
    }

    @Generable
    struct OnDeviceBriefing {
        @Guide(description: "2-3 sentence personalized morning briefing about yesterday's health data")
        let briefing: String
    }

    // MARK: - Insights Generation

    private func generateInsightsOnDevice(context: AIInsightsService.HealthContext) async throws -> AIInsightsService.AIAnalysisResult {
        let model = SystemLanguageModel.default

        guard model.isAvailable else {
            throw OnDeviceAIError.notAvailable
        }

        let session = LanguageModelSession(model: model) {
            "You are a health analytics AI running privately on the user's device."
            "Analyze health data and provide actionable insights."
            "Focus on recovery, activity balance, sleep quality, and heart health."
            "Be encouraging but honest. Flag concerning trends."
        }

        let contextSummary = buildContextString(from: context)

        let prompt = Prompt {
            "Analyze this health data and generate insights:"
            contextSummary
        }

        do {
            let response = try await session.respond(to: prompt, generating: OnDeviceInsightResult.self)
            let result = response.content

            return AIInsightsService.AIAnalysisResult(
                recoveryScore: min(max(result.recoveryScore, 0), 100),
                strainScore: min(max(result.strainScore, 0), 21),
                insights: result.insights.map { insight in
                    AIInsightsService.AIInsight(
                        category: insight.category,
                        title: insight.title,
                        content: insight.content,
                        priority: insight.priority
                    )
                }
            )
        } catch let error as LanguageModelSession.GenerationError {
            switch error {
            case .guardrailViolation:
                throw OnDeviceAIError.guardrailViolation
            default:
                throw OnDeviceAIError.generationFailed(error.localizedDescription)
            }
        }
    }

    // MARK: - Chat

    private func chatOnDevice(message: String, history: [(role: String, content: String)]) async throws -> String {
        let model = SystemLanguageModel.default

        guard model.isAvailable else {
            throw OnDeviceAIError.notAvailable
        }

        let session = LanguageModelSession(model: model) {
            "You are a private health assistant running on the user's device."
            "Answer health questions based on the user's data."
            "Be concise (under 150 words), supportive, and evidence-based."
            "You are not a doctor. Recommend professional consultation for medical concerns."
        }

        // Feed conversation history into the session for context
        for entry in history.suffix(10) {
            if entry.role == "user" {
                let _ = try? await session.respond(to: entry.content)
            }
        }

        let response = try await session.respond(to: message)
        return response.content
    }

    // MARK: - Briefing

    private func generateBriefingOnDevice(context: AIInsightsService.HealthContext) async throws -> String {
        let model = SystemLanguageModel.default

        guard model.isAvailable else {
            throw OnDeviceAIError.notAvailable
        }

        let session = LanguageModelSession(model: model) {
            "Generate a short, friendly morning health briefing."
            "Summarize yesterday's key metrics and give one actionable tip."
            "Keep it to 2-3 sentences. Be encouraging."
        }

        let contextSummary = buildContextString(from: context)

        let response = try await session.respond(
            to: Prompt { "Generate morning briefing from this data: \(contextSummary)" },
            generating: OnDeviceBriefing.self
        )
        return response.content.briefing
    }

    // MARK: - Helpers

    private func buildContextString(from context: AIInsightsService.HealthContext) -> String {
        let d = context.dailySummary
        var parts: [String] = []

        parts.append("Today: \(d.steps) steps, \(Int(d.activeCalories)) active cal")

        if let rhr = d.restingHeartRate {
            parts.append("Resting HR: \(rhr) bpm")
        }
        if let hrv = d.avgHrv {
            parts.append("HRV: \(Int(hrv)) ms")
        }
        if let sleep = d.sleepDurationMinutes {
            let hours = Double(sleep) / 60.0
            parts.append("Sleep: \(String(format: "%.1f", hours))h")
        }

        if !context.recentWorkouts.isEmpty {
            let workoutSummary = context.recentWorkouts.map { w in
                "\(w.workoutType) \(w.durationMinutes)min"
            }.joined(separator: ", ")
            parts.append("Workouts: \(workoutSummary)")
        }

        if let sleep = context.recentSleep.first {
            parts.append("Sleep stages: deep \(sleep.deepMinutes)min, REM \(sleep.remMinutes)min, core \(sleep.coreMinutes)min")
        }

        if !context.weekHistory.isEmpty {
            let avgSteps = context.weekHistory.map(\.steps).reduce(0, +) / max(context.weekHistory.count, 1)
            parts.append("7-day avg steps: \(avgSteps)")
        }

        return parts.joined(separator: ". ")
    }
}
#endif
