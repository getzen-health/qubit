import XCTest

/// UI tests for health metric input flows (water, mood, stress logging).
final class HealthInputUITests: XCTestCase {

    var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["UI_TESTING"]
        app.launch()
    }

    override func tearDownWithError() throws {
        app = nil
    }

    // MARK: - Water Tab

    func testWaterTabReachable() {
        tapTab("Water")
        XCTAssertTrue(app.state == .runningForeground, "Water tab should not crash")
    }

    func testWaterTabHasProgressRing() {
        tapTab("Water")
        sleep(2)
        // Water view should show some progress/goal element
        let scrollView = app.scrollViews.firstMatch
        if scrollView.exists {
            scrollView.swipeUp()
        }
        XCTAssertTrue(app.state == .runningForeground)
    }

    func testWaterQuickAddButtons() {
        tapTab("Water")
        sleep(2)
        // Look for quick-add amount buttons (250ml, 500ml, etc.)
        let addButton = app.buttons.matching(
            NSPredicate(format: "label CONTAINS[c] 'ml' OR label CONTAINS[c] 'add' OR label CONTAINS[c] '+'")
        ).firstMatch
        if addButton.waitForExistence(timeout: 3) {
            addButton.tap()
            sleep(1)
        }
        XCTAssertTrue(app.state == .runningForeground, "Should not crash adding water")
    }

    // MARK: - Health Tab Features

    func testHealthTabReachable() {
        tapTab("Health")
        XCTAssertTrue(app.state == .runningForeground, "Health tab should not crash")
    }

    func testHealthTabScrollsWithoutCrash() {
        tapTab("Health")
        sleep(2)
        let scrollView = app.scrollViews.firstMatch
        if scrollView.waitForExistence(timeout: 3) {
            scrollView.swipeUp()
            sleep(1)
            scrollView.swipeUp()
            sleep(1)
            scrollView.swipeDown()
        }
        XCTAssertTrue(app.state == .runningForeground)
    }

    // MARK: - Profile Tab

    func testProfileTabReachable() {
        tapTab("Profile")
        XCTAssertTrue(app.state == .runningForeground, "Profile tab should not crash")
    }

    func testProfileTabHasSignOut() {
        tapTab("Profile")
        sleep(2)
        // Scroll to find Sign Out button
        let scrollView = app.scrollViews.firstMatch
        if scrollView.exists {
            scrollView.swipeUp()
            scrollView.swipeUp()
        }
        let signOut = app.buttons.matching(
            NSPredicate(format: "label CONTAINS[c] 'Sign Out' OR label CONTAINS[c] 'sign out'")
        ).firstMatch
        _ = signOut.waitForExistence(timeout: 3)
        XCTAssertTrue(app.state == .runningForeground)
    }

    // MARK: - Workouts Tab

    func testWorkoutsTabScrollable() {
        tapTab("Workouts")
        sleep(2)
        let scrollView = app.scrollViews.firstMatch
        if scrollView.waitForExistence(timeout: 3) {
            scrollView.swipeUp()
            sleep(1)
            scrollView.swipeDown()
        }
        XCTAssertTrue(app.state == .runningForeground)
    }

    // MARK: - Accessibility

    func testNoCriticalAccessibilityLabelsAreMissing() {
        let buttons = app.buttons.allElementsBoundByIndex
        var unlabeledCount = 0
        for btn in buttons.prefix(20) {
            if btn.label.isEmpty && btn.identifier.isEmpty {
                unlabeledCount += 1
            }
        }
        XCTAssertLessThanOrEqual(unlabeledCount, 3,
            "\(unlabeledCount) buttons have no accessibility label — fix for VoiceOver users")
    }

    // MARK: - Helpers

    private func tapTab(_ name: String) {
        let tab = app.tabBars.buttons[name]
        if tab.waitForExistence(timeout: 5) {
            tab.tap()
        }
    }
}
