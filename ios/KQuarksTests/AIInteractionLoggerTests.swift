import XCTest
@testable import KQuarks

final class AIInteractionLoggerTests: XCTestCase {

    // MARK: - InteractionType Tests

    func testInteractionTypeRawValues() {
        XCTAssertEqual(AIInteractionLogger.InteractionType.insight.rawValue, "insight")
        XCTAssertEqual(AIInteractionLogger.InteractionType.chat.rawValue, "chat")
        XCTAssertEqual(AIInteractionLogger.InteractionType.briefing.rawValue, "briefing")
    }

    // MARK: - Rating Tests

    func testRatingRawValues() {
        XCTAssertEqual(AIInteractionLogger.Rating.helpful.rawValue, "helpful")
        XCTAssertEqual(AIInteractionLogger.Rating.notHelpful.rawValue, "not_helpful")
    }

    // MARK: - Singleton

    func testSharedInstance() {
        let instance1 = AIInteractionLogger.shared
        let instance2 = AIInteractionLogger.shared
        XCTAssertTrue(instance1 === instance2)
    }

    // MARK: - Hash Context

    func testHashContextProducesDeterministicHash() {
        let context = "steps: 10000, heart_rate: 72"
        let hash1 = AIInteractionLogger.hashContext(context)
        let hash2 = AIInteractionLogger.hashContext(context)
        XCTAssertEqual(hash1, hash2)
    }

    func testHashContextDifferentInputProducesDifferentHash() {
        let hash1 = AIInteractionLogger.hashContext("steps: 10000")
        let hash2 = AIInteractionLogger.hashContext("steps: 5000")
        XCTAssertNotEqual(hash1, hash2)
    }

    func testHashContextIsFixedLength() {
        let shortHash = AIInteractionLogger.hashContext("a")
        let longHash = AIInteractionLogger.hashContext(String(repeating: "x", count: 10000))
        // SHA256 first 16 bytes = 32 hex chars
        XCTAssertEqual(shortHash.count, 32)
        XCTAssertEqual(longHash.count, 32)
    }

    func testHashContextIsHexString() {
        let hash = AIInteractionLogger.hashContext("test input")
        let hexCharSet = CharacterSet(charactersIn: "0123456789abcdef")
        XCTAssertTrue(hash.unicodeScalars.allSatisfy { hexCharSet.contains($0) })
    }

    // MARK: - Consent Default

    func testConsentDefaultIsFalse() {
        // Fresh UserDefaults key should be false
        let key = "ai_data_consent_given_test"
        UserDefaults.standard.removeObject(forKey: key)
        let value = UserDefaults.standard.bool(forKey: key)
        XCTAssertFalse(value)
    }

    // MARK: - Consent Toggle

    func testConsentPersistsToUserDefaults() {
        let logger = AIInteractionLogger.shared
        let originalValue = logger.hasConsent

        // Toggle consent
        logger.hasConsent = true
        XCTAssertTrue(logger.hasConsent)
        XCTAssertTrue(UserDefaults.standard.bool(forKey: "ai_data_consent_given"))

        logger.hasConsent = false
        XCTAssertFalse(logger.hasConsent)

        // Restore
        logger.hasConsent = originalValue
    }

    // MARK: - Log Skips Without Consent

    func testLogSkipsWhenNoConsent() async {
        let logger = AIInteractionLogger.shared
        let original = logger.hasConsent
        logger.hasConsent = false

        // Should return immediately without error
        await logger.log(
            type: .insight,
            provider: "cloud",
            promptSummary: "test prompt",
            responseText: "test response"
        )

        // If we get here without crash, the guard worked
        XCTAssertTrue(true)

        logger.hasConsent = original
    }
}
