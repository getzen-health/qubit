# Apple Watch Complications Setup Guide

GetZen provides Apple Watch complications through WidgetKit, which are automatically available on watchOS 10+ via iPhone mirroring.

## Supported Complications

### Corner Complications (Gauges)
- **Readiness Score Ring**: Shows your daily readiness percentage (0-100%)
- **Calorie Progress Ring**: Displays active calories burned vs. your daily goal

### Inline Complications (Text Display)
- **Steps**: Shows today's step count with a walking figure icon
- **Heart Rate**: Displays resting heart rate with a heart icon
- **Sleep Duration**: Shows last night's sleep hours and minutes

## How to Add Complications to Apple Watch

### watchOS 10+

1. **On iPhone:**
   - Open the Health app or GetZen app
   - Ensure widgets are enabled (Settings > Widgets > Allow Widgets)

2. **On Apple Watch:**
   - Long press the watch face to enter editing mode
   - Tap "Add Complication" (if available on your watch face)
   - Select one of the GetZen complications from the list
   - Tap a location to place it on your watch face

3. **Alternative Method (Modular Compact Watch Face):**
   - Press and hold the watch face
   - Tap "Edit"
   - Scroll to find and select a GetZen complication
   - Tap to add it to the selected area

### What Shows on Each Face

Different Apple Watch faces support different complication styles:

- **Modular, Infograph, Infograph Pro**: Support corner gauges (Readiness, Calorie Progress)
- **Any face with inline support**: Display text complications (Steps, HR, Sleep)
- **Circular faces**: Support both corner and circular gauges

## Data Updates

- **Refresh Rate**: Updates every 15 minutes (configured in the widget provider)
- **Data Source**: All data comes from the Health app on your iPhone
- **Sync**: Requires iPhone to have active widget provider access to HealthKit

## Limitations

- Watch faces must support complications via WidgetKit
- Very old watchOS versions may not support all complication types
- Data is pulled from HealthKit, so make sure the GetZen app has HealthKit permissions
- Complications require the iPhone's widget extension to be enabled

## Troubleshooting

**Complications not appearing?**
1. Ensure GetZen widgets are enabled on iPhone
2. Restart the watch
3. Restart the iPhone
4. Re-enable widgets in Settings

**Data not updating?**
1. Check that the GetZen app has HealthKit permissions
2. Manually refresh widgets on iPhone
3. Ensure Bluetooth connection between watch and iPhone

**Watch face doesn't support complications?**
- Not all watch faces support all complication types. Try a different face like "Modular" or "Infograph"

## Technical Details

- **Framework**: WidgetKit with ActivityKit support
- **Supported Families**: accessoryCircular, accessoryInline, accessoryRectangular
- **Platform**: watchOS 10+ (via iPhone mirroring)
- **iOS Requirement**: iOS 16.2+

## Future Enhancements

TODO: Future complications planned
- Workout progress during active sessions
- Blood glucose trends (for users tracking)
- Medication reminders
- Custom complication grouping
