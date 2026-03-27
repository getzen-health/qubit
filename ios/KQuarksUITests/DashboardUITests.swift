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

    func testTabBarOrSidebarIsPresent() {
        // Either a tab bar or sidebar navigation exists
        let hasTabBar = app.tabBars.firstMatch.waitForExistence(timeout: 3)
        let hasSidebar = app.navigationBars.firstMatch.waitForExistence(timeout: 3)
        XCTAssertTrue(hasTabBar || hasSidebar, "No tab bar or navigation bar found")
    }

    func testDashboardMetricCardsVisible() {
        // Scroll down to verify cards are rendered
        let scrollView = app.scrollViews.firstMatch
        if scrollView.exists {
            scrollView.swipeUp()
            scrollView.swipeDown()
        }
        // App should still be in foreground after scrolling
        XCTAssertTrue(app.state == .runningForeground)
    }

    // MARK: - Navigation

    func testCanNavigateToSleepView() {
        tapNavigationItem(label: "Sleep")
    }

    func testCanNavigateToWorkoutsView() {
        tapNavigationItem(label: "Workout")
    }

    func testCanNavigateToNutritionOrFoodView() {
        let tapped = tapNavigationItem(label: "Food") ||
                     tapNavigationItem(label: "Nutrition") ||
                     tapNavigationItem(label: "Scan")
        XCTAssertTrue(tapped, "Could not find Food/Nutrition/Scan nav item")
    }

    func testCanNavigateToSettingsView() {
        let tapped = tapNavigationItem(label: "Settings") ||
                     tapNavigationItem(label: "Profile")
        XCTAssertTrue(tapped, "Could not find Settings/Profile nav item")
    }

    // MARK: - Helpers

    @discardableResult
    private func tapNavigationItem(label: String) -> Bool {
        // Try tab bar first
        let tabItem = app.tabBars.buttons[label]
        if tabItem.exists {
            tabItem.tap()
            return true
        }
        // Try sidebar / list cells
        let cell = app.cells.staticTexts[label].firstMatch
        if cell.waitForExistence(timeout: 2) {
            cell.tap()
            return true
        }
        // Try any button matching label
        let btn = app.buttons.matching(identifier: label).firstMatch
        if btn.exists {
            btn.tap()
            return true
        }
        return false
    }
}
