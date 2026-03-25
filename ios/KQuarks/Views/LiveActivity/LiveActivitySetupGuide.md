# Setting Up Live Activities in KQuarks

## Steps to enable Live Activities:

1. In Xcode, add a new target: File → New Target → Widget Extension
2. Name it "KQuarksLiveActivity"
3. Ensure "Include Live Activity" is checked
4. In the widget extension, import the attributes:
   - `FastingLiveActivityAttributes`
   - `WorkoutLiveActivityAttributes`
5. Use `FastingLiveActivityLockScreenView` and `WorkoutLiveActivityLockScreenView` 
   from the `FastingLiveActivityWidget.swift` file for the lock screen UI
6. Add the widget extension to the App Group: `group.com.qxlsz.kquarks`

## Info.plist
`NSSupportsLiveActivities` = YES (already added)

## References
- [ActivityKit Documentation](https://developer.apple.com/documentation/activitykit)
- [Live Activities Overview](https://developer.apple.com/widgets/live-activities/)
