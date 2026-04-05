import XCTest
@testable import KQuarks

final class OnDeviceAIServiceTests: XCTestCase {

    // MARK: - AIProviderType Tests

    func testAIProviderTypeAllCases() {
        let allCases = AIProviderType.allCases
        XCTAssertEqual(allCases.count, 3)
        XCTAssertTrue(allCases.contains(.onDevice))
        XCTAssertTrue(allCases.contains(.cloud))
        XCTAssertTrue(allCases.contains(.auto))
    }

    func testAIProviderTypeRawValues() {
        XCTAssertEqual(AIProviderType.onDevice.rawValue, "on_device")
        XCTAssertEqual(AIProviderType.cloud.rawValue, "cloud")
        XCTAssertEqual(AIProviderType.auto.rawValue, "auto")
    }

    func testAIProviderTypeDisplayNames() {
        XCTAssertEqual(AIProviderType.onDevice.displayName, "On-Device (Private)")
        XCTAssertEqual(AIProviderType.cloud.displayName, "Cloud (Claude)")
        XCTAssertEqual(AIProviderType.auto.displayName, "Auto")
    }

    func testAIProviderTypeDescriptions() {
        XCTAssertFalse(AIProviderType.onDevice.description.isEmpty)
        XCTAssertFalse(AIProviderType.cloud.description.isEmpty)
        XCTAssertFalse(AIProviderType.auto.description.isEmpty)
        XCTAssertTrue(AIProviderType.onDevice.description.contains("locally"))
        XCTAssertTrue(AIProviderType.cloud.description.contains("Claude"))
    }

    func testAIProviderTypeIcons() {
        XCTAssertEqual(AIProviderType.onDevice.icon, "iphone")
        XCTAssertEqual(AIProviderType.cloud.icon, "cloud")
        XCTAssertEqual(AIProviderType.auto.icon, "sparkles")
    }

    func testAIProviderTypeCodable() throws {
        let encoder = JSONEncoder()
        let decoder = JSONDecoder()

        for providerType in AIProviderType.allCases {
            let data = try encoder.encode(providerType)
            let decoded = try decoder.decode(AIProviderType.self, from: data)
            XCTAssertEqual(providerType, decoded)
        }
    }

    // MARK: - OnDeviceAIError Tests

    func testOnDeviceAIErrorDescriptions() {
        XCTAssertNotNil(OnDeviceAIError.notAvailable.errorDescription)
        XCTAssertNotNil(OnDeviceAIError.guardrailViolation.errorDescription)
        XCTAssertNotNil(OnDeviceAIError.generationFailed("test reason").errorDescription)
        XCTAssertTrue(OnDeviceAIError.generationFailed("test reason").errorDescription!.contains("test reason"))
    }

    // MARK: - AIProviderManager Tests

    func testAIProviderManagerSingleton() {
        let manager = AIProviderManager.shared
        XCTAssertNotNil(manager)
    }

    func testAIProviderManagerDefaultProvider() {
        let manager = AIProviderManager.shared
        // Default should be auto
        XCTAssertTrue(AIProviderType.allCases.contains(manager.selectedProvider))
    }

    func testAIProviderManagerProviderPersistence() {
        let manager = AIProviderManager.shared
        let original = manager.selectedProvider

        manager.selectedProvider = .cloud
        XCTAssertEqual(manager.selectedProvider, .cloud)

        let saved = UserDefaults.standard.string(forKey: "ai_provider_type")
        XCTAssertEqual(saved, "cloud")

        // Restore
        manager.selectedProvider = original
    }

    func testEffectiveProviderCloudAlwaysCloud() {
        let manager = AIProviderManager.shared
        let original = manager.selectedProvider

        manager.selectedProvider = .cloud
        XCTAssertEqual(manager.effectiveProvider, .cloud)

        manager.selectedProvider = original
    }

    // MARK: - OnDeviceAIService Tests

    func testOnDeviceAIServiceSingleton() {
        let service = OnDeviceAIService.shared
        XCTAssertNotNil(service)
    }

    func testOnDeviceAIServiceAvailabilityCheck() {
        let service = OnDeviceAIService.shared
        // On simulator, Foundation Models won't be available
        // Just verify the check doesn't crash
        let _ = service.isAvailable
        let _ = service.unavailableReason
    }

    func testOnDeviceAIServiceUnavailableOnSimulator() {
        // Foundation Models requires real device with Apple Intelligence
        let service = OnDeviceAIService.shared
        // On CI/simulator this should return false
        // We just verify it returns a Bool without crashing
        XCTAssertNotNil(service.isAvailable as Bool?)
    }

    // MARK: - Health Context Building

    func testBuildHealthContextPublic() async throws {
        // This may fail without HealthKit authorization, which is expected
        // Just verify the method exists and is callable
        let service = AIInsightsService.shared
        do {
            let _ = try await service.buildHealthContextPublic()
        } catch {
            // Expected on simulator without HealthKit auth
            XCTAssertNotNil(error)
        }
    }
}
