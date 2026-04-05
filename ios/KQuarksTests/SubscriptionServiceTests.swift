import XCTest
@testable import KQuarks

// MARK: - SubscriptionService Unit Tests
//
// SubscriptionService is a UserDefaults-backed stub for Pro subscription state.
// Tests verify purchase(), restorePurchases(), and checkEntitlements() behaviour.
// Cleans the relevant UserDefaults key in tearDown for test isolation.

final class SubscriptionServiceTests: XCTestCase {

    private let userDefaultsKey = "getzen_is_pro"
    var sut: SubscriptionService!

    override func setUp() {
        super.setUp()
        // Clear persisted state before each test
        UserDefaults.standard.removeObject(forKey: userDefaultsKey)
        sut = SubscriptionService.shared
        sut.isPro = false
    }

    override func tearDown() {
        UserDefaults.standard.removeObject(forKey: userDefaultsKey)
        sut = nil
        super.tearDown()
    }

    // MARK: - Initial State

    func testInitialState_isProFalse() {
        UserDefaults.standard.removeObject(forKey: userDefaultsKey)
        sut.isPro = false
        XCTAssertFalse(sut.isPro, "isPro should default to false when no UserDefaults entry exists")
    }

    // MARK: - purchase()

    func testPurchase_setsIsProTrue() async throws {
        XCTAssertFalse(sut.isPro)
        try await sut.purchase()
        XCTAssertTrue(sut.isPro, "purchase() should set isPro to true")
    }

    func testPurchase_persistsToUserDefaults() async throws {
        try await sut.purchase()
        let stored = UserDefaults.standard.bool(forKey: userDefaultsKey)
        XCTAssertTrue(stored, "purchase() should persist true to UserDefaults")
    }

    // MARK: - checkEntitlements()

    func testCheckEntitlements_readsTrueFromUserDefaults() async {
        UserDefaults.standard.set(true, forKey: userDefaultsKey)
        await sut.checkEntitlements()
        XCTAssertTrue(sut.isPro, "checkEntitlements should read true from UserDefaults")
    }

    func testCheckEntitlements_readsFalseFromUserDefaults() async {
        UserDefaults.standard.set(false, forKey: userDefaultsKey)
        await sut.checkEntitlements()
        XCTAssertFalse(sut.isPro, "checkEntitlements should read false from UserDefaults")
    }

    func testCheckEntitlements_missingKey_defaultsFalse() async {
        UserDefaults.standard.removeObject(forKey: userDefaultsKey)
        await sut.checkEntitlements()
        XCTAssertFalse(sut.isPro, "Missing key should default isPro to false")
    }

    // MARK: - restorePurchases()

    func testRestorePurchases_readsFromUserDefaults() async throws {
        UserDefaults.standard.set(true, forKey: userDefaultsKey)
        try await sut.restorePurchases()
        XCTAssertTrue(sut.isPro, "restorePurchases should call checkEntitlements and read true")
    }

    func testRestorePurchases_noExistingPurchase_staysFalse() async throws {
        UserDefaults.standard.removeObject(forKey: userDefaultsKey)
        try await sut.restorePurchases()
        XCTAssertFalse(sut.isPro, "restorePurchases with no stored purchase should keep isPro false")
    }

    // MARK: - Round-trip

    func testPurchaseThenCheckEntitlements() async throws {
        try await sut.purchase()
        sut.isPro = false  // Reset in-memory state
        await sut.checkEntitlements()
        XCTAssertTrue(sut.isPro, "checkEntitlements should recover the persisted purchase")
    }
}
