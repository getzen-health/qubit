# iCloud Sync Setup

SwiftData is configured to use CloudKit for syncing.

## Required Xcode Steps

To enable iCloud sync for GetZen on your development machine:

1. **Open Xcode**
   - Open `ios/KQuarks.xcodeproj` in Xcode

2. **Add iCloud Capability**
   - Select the GetZen target
   - Go to Signing & Capabilities
   - Click "+ Capability" and add "iCloud"
   - Check "CloudKit"
   - Create or select container: `iCloud.com.qxlsz.getzen`

3. **Add Background Modes**
   - In Signing & Capabilities, click "+ Capability" and add "Background Modes"
   - Check "Remote notifications"

4. **Add CloudKit Container Entitlements**
   - Ensure `ios/KQuarks/GetZen.entitlements` contains:
     ```xml
     <key>com.apple.developer.icloud-container-identifiers</key>
     <array>
         <string>iCloud.com.qxlsz.getzen</string>
     </array>
     <key>com.apple.developer.icloud-services</key>
     <array>
         <string>CloudKit</string>
     </array>
     ```

## What Syncs via iCloud

- **PendingSyncItem**: Offline sync queue for manual logs and workouts

## What Does NOT Sync (Supabase is Source of Truth)

- Health records (HealthKit data)
- Food logs
- Workouts from connected devices
- User preferences
- AI insights and briefings

These are managed entirely by Supabase for consistency across devices.

## Testing iCloud Sync Locally

1. Enable iCloud on a test Apple ID in System Preferences → iCloud
2. Build and run the app on a simulator or device signed in with that Apple ID
3. Make offline changes (log food, add workout)
4. Go offline (Airplane Mode)
5. When back online, PendingSyncItem records sync automatically

## CloudKit Dashboard

Monitor your CloudKit container at:
https://icloud.developer.apple.com/cloudkit/

Select the `iCloud.com.qxlsz.getzen` container to view production and development data.
