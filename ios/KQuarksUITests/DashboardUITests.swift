import XCTest

/// UI tests for the main dashboard and navigation flows.
/// These run on a real simulator and test the app end-to-end.
final class DashboardUITests: XCTestCase {

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

    // MARK: - Launch & Tab Bar

    func testAppLaunchesWithoutCrash() {
        XCTAssertTrue(app.state == .runningForeground)
    }

    func testTabBarIsPresent() {
        let hasTabBar = app.tabBars.firstMatch.waitForExistence(timeout: 5)
        XCTAssertTrue(hasTabBar, "Tab bar should be visible on launch")
    }

    func testAllFiveTabsExist() {
        let tabBar = app.tabBars.firstMatch
        guard tabBar.waitForExistence(timeout: 5) else {
            XCTFail("Tab bar not found")
            return
        }
        let expectedTabs = ["Dashboard", "Health", "Workouts", "Water", "Profile"]
        for tab in expectedTabs {
            XCTAssertTrue(tabBar.buttons[tab].exists, "Tab '\(tab)' should exist in tab bar")
        }
    }

    func testDashboardScrollsWithoutCrash() {
        let scrollView = app.scrollViews.firstMatch
        if scrollView.waitForExistence(timeout: 3) {
            scrollView.swipeUp()
            sleep(1)
            scrollView.swipeUp()
            sleep(1)
            scrollView.swipeDown()
        }
        XCTAssertTrue(app.state == .runningForeground, "App should not crash after scrolling")
    }

    // MARK: - Tab Navigation

    func testNavigateToHealthTab() {
        tapTab("Health")
        XCTAssertTrue(app.state == .runningForeground, "Health tab should not crash")
    }

    func testNavigateToWorkoutsTab() {
        tapTab("Workouts")
        XCTAssertTrue(app.state == .runningForeground, "Workouts tab should not crash")
    }

    func testNavigateToWaterTab() {
        tapTab("Water")
        XCTAssertTrue(app.state == .runningForeground, "Water tab should not crash")
    }

    func testNavigateToProfileTab() {
        tapTab("Profile")
        XCTAssertTrue(app.state == .runningForeground, "Profile tab should not crash")
    }

    func testNavigateAllTabsRoundTrip() {
        for tab in ["Health", "Workouts", "Water", "Profile", "Dashboard"] {
            tapTab(tab)
            sleep(1)
            XCTAssertTrue(app.state == .runningForeground, "Crash navigating to \(tab)")
        }
    }

    // MARK: - Dashboard Content

    func testDashboardShowsGreeting() {
        let greeting = app.staticTexts.matching(
            NSPredicate(format: "label CONTAINS[c] 'morning' OR label CONTAINS[c] 'afternoon' OR label CONTAINS[c] 'evening' OR label CONTAINS[c] 'night'")
        ).firstMatch
        XCTAssertTrue(greeting.waitForExistence(timeout: 5), "Dashboard should show time-based greeting")
    }

    // MARK: - Helpers

    private func tapTab(_ name: String) {
        let tab = app.tabBars.buttons[name]
        if tab.waitForExistence(timeout: 3) {
            tab.tap()
        }
    }
}
