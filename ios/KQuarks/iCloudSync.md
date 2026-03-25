# iCloud Sync Configuration for KQuarks

This document outlines the iCloud sync setup for SwiftData persistence in KQuarks.

## Overview

KQuarks uses SwiftData with CloudKit integration to sync data across user devices. This allows seamless synchronization of locally stored health data (pending sync items, offline records, etc.) across iPhone, iPad, and Mac (via Catalyst).

## Configuration Steps

### 1. ModelContainer Setup (KQuarksApp.swift)

The app initializes SwiftData with CloudKit support:

```swift
let config = ModelConfiguration(
    schema: Schema([PendingSyncItem.self]),
    isStoredInMemoryOnly: false,
    cloudKitDatabase: .automatic
)

modelContainer = try ModelContainer(
    for: Schema([PendingSyncItem.self]), 
    configurations: [config]
)
```

**Key Points:**
- `cloudKitDatabase: .automatic` enables CloudKit sync
- Uses the same iCloud container identifier across all devices
- Syncs only local SwiftData models (not HealthKit data directly)

### 2. Entitlements (KQuarks.entitlements)

The following entitlements are required:

```xml
<key>com.apple.developer.icloud-container-identifiers</key>
<array>
    <string>iCloud.com.qxlsz.kquarks</string>
</array>
<key>com.apple.developer.icloud-services</key>
<array>
    <string>CloudKit</string>
</array>
```

These entitlements:
- Define the CloudKit container ID (`iCloud.com.qxlsz.kquarks`)
- Enable CloudKit capabilities for the app

### 3. Data Models

Currently synced via CloudKit:
- **PendingSyncItem** - Tracks items awaiting sync to Supabase (HealthKit data waiting to be uploaded)

Future models can be added to the Schema for automatic CloudKit sync.

## Sync Flow

1. **Offline Recording** - When HealthKit data is logged while offline:
   - Data is stored in SwiftData as a PendingSyncItem
   - SwiftData automatically syncs to CloudKit

2. **Cross-Device Sync** - On another device:
   - CloudKit replicates the pending item
   - App fetches it via SwiftData query
   - SyncService uploads to Supabase

3. **Cleanup** - After Supabase upload:
   - PendingSyncItem is deleted from SwiftData
   - CloudKit syncs the deletion

## Testing iCloud Sync

### Local Testing (Simulator)
```bash
# Run with iCloud container enabled
xcode-select --install
cd ios && xcodebuild build \
  -project KQuarks.xcodeproj \
  -scheme KQuarks \
  -destination 'generic/platform=iOS Simulator'
```

### Device Testing
- Ensure user is signed into iCloud on the device
- Enable iCloud in Settings > [Apple ID] > iCloud
- Toggle "KQuarks" in the app's iCloud services list

### Debugging CloudKit
Use Xcode's Debug navigator:
1. Open KQuarks in Xcode
2. Go to Scheme > Edit Scheme > Options
3. Check "CloudKit logging" if available in Console

## Limitations & Notes

- **Public vs. Private Databases** - Currently uses private CloudKit database (user's own container)
- **No Shared Data** - CloudKit sync does not share data with other users
- **Conflict Resolution** - SwiftData handles conflicts automatically with last-write-wins
- **Manual Sync Trigger** - Health data sync to Supabase is still manually triggered or via background tasks

## Future Enhancements

- [ ] Sync additional SwiftData models (user preferences, cache, etc.)
- [ ] Add conflict resolution strategies
- [ ] Implement CloudKit sharing for collaborative health tracking
- [ ] Add sync status UI indicators
