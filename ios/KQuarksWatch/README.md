# GetZen Watch App

Source files are ready. To add to Xcode:

1. Open `ios/KQuarks.xcodeproj` in Xcode
2. File > New > Target > watchOS > App
3. Product Name: `KQuarksWatch`, Bundle ID: `app.getzen.watch`
4. Add files from this directory to the new target
5. Add App Group capability: `group.app.getzen` (on both iOS and watchOS targets)
6. The complication uses WidgetKit — add the `GetZenComplication` widget extension target separately

## Data Flow
- iOS app writes `todaySteps` and `healthScore` to `UserDefaults(suiteName: "group.app.getzen")`
- Watch reads from the same App Group shared container
- HealthKit reads happen directly on-watch for low-latency heart rate + steps
