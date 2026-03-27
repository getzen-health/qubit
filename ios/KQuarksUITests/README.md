# KQuarks iOS UI Tests

XCUITest files for end-to-end UI testing of the KQuarks iOS app.

## Test Files

| File | What it tests |
|------|--------------|
| `DashboardUITests.swift` | App launch, tab bar / sidebar navigation, dashboard cards |
| `FoodScannerUITests.swift` | Scanner navigation, search input, results display |
| `HealthInputUITests.swift` | Water / mood / stress input flows, accessibility labels |

## Adding the UITest Target in Xcode (one-time setup)

The test files are ready, but the Xcode project needs a **UI Testing Bundle** target:

1. Open `ios/KQuarks.xcodeproj` in Xcode
2. **File → New → Target → UI Testing Bundle**
3. Name it exactly: `KQuarksUITests`
4. Set **Target to be Tested** to `KQuarks`
5. Drag the three `.swift` files from this folder into the new target
6. **Product → Test** (⌘U) to verify they compile

Once added, the `ui-tests.yml` GitHub Actions workflow will automatically run them daily.

## Running Locally

```bash
# Run all UI tests on iPhone 16 simulator
xcodebuild test \
  -project ios/KQuarks.xcodeproj \
  -scheme KQuarks \
  -destination 'platform=iOS Simulator,name=iPhone 16,OS=latest' \
  CODE_SIGNING_ALLOWED=NO

# Run a single test class
xcodebuild test \
  -project ios/KQuarks.xcodeproj \
  -scheme KQuarks \
  -only-testing:KQuarksUITests/DashboardUITests \
  -destination 'platform=iOS Simulator,name=iPhone 16,OS=latest' \
  CODE_SIGNING_ALLOWED=NO
```

## Launch Arguments

The app respects `UI_TESTING` launch argument set by the tests.
Add this to your app's entry point to bypass auth or load mock data during UI tests:

```swift
// in App.swift or AppDelegate
if ProcessInfo.processInfo.arguments.contains("UI_TESTING") {
    // Skip onboarding, use test user, disable animations
    UserDefaults.standard.set(true, forKey: "ui_testing_mode")
}
```
