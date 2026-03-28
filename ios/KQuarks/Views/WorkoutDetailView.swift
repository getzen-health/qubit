import SwiftUI
import HealthKit
import MapKit
import OSLog

struct WorkoutDetailView: View {
    let workout: HKWorkout

    @State private var avgHeartRate: Double?
    @State private var hrZones: [HRZoneTime] = []
    @State private var splits: [SplitRow] = []
    private let healthKit = HealthKitService.shared

    struct HRZoneTime: Identifiable {
        let id: Int
        let label: String
        let bpmRange: String
        let color: Color
        let seconds: TimeInterval
    }
    
    struct SplitRow: Identifiable {
        let id = UUID()
        let kilometer: Int
        let pace: String
        let heartRate: Int?
        let elevation: Double?
    }

    private static let zones: [(label: String, bpmRange: String, color: Color, max: Double)] = [
        ("Zone 1", "< 115 bpm", .blue,    115),
        ("Zone 2", "115–134",   .green,   135),
        ("Zone 3", "135–154",   .yellow,  155),
        ("Zone 4", "155–174",   .orange,  175),
        ("Zone 5", "≥ 175 bpm", .red,     .infinity),
    ]

    private func computeZones(from samples: [(date: Date, bpm: Double)]) -> [HRZoneTime] {
        var zoneSecs = [Double](repeating: 0, count: 5)
        for i in 0..<samples.count {
            let current = samples[i]
            let nextDate = i + 1 < samples.count ? samples[i + 1].date : workout.endDate
            let duration = nextDate.timeIntervalSince(current.date)
            guard duration > 0 else { continue }
            let zoneIdx: Int
            switch current.bpm {
            case ..<115:   zoneIdx = 0
            case 115..<135: zoneIdx = 1
            case 135..<155: zoneIdx = 2
            case 155..<175: zoneIdx = 3
            default:       zoneIdx = 4
            }
            zoneSecs[zoneIdx] += duration
        }
        return Self.zones.enumerated().compactMap { (idx, z) in
            guard zoneSecs[idx] > 0 else { return nil }
            return HRZoneTime(id: idx, label: z.label, bpmRange: z.bpmRange, color: z.color, seconds: zoneSecs[idx])
        }
    }
    
    private func calculateSplits(from route: [CLLocationCoordinate2D], heartRates: [(date: Date, bpm: Double)]) -> [SplitRow] {
        guard !route.isEmpty, route.count > 1 else { return [] }
        
        var splits: [SplitRow] = []
        var distanceAccum = 0.0
        var kmIndex = 1
        var kmStartIdx = 0
        
        for i in 1..<route.count {
            let from = route[i - 1]
            let to = route[i]
            let segmentDistance = CLLocationCoordinate2D.distance(from: from, to: to)
            distanceAccum += segmentDistance
            
            if distanceAccum >= 1000 {
                let kmStart = route[kmStartIdx]
                let kmEnd = route[i]
                let fraction = (distanceAccum - 1000) / segmentDistance
                
                let timeForKm = Double(kmIndex - 1) * (workout.duration / Double(Int(distanceAccum / 1000)))
                let timePerKm = workout.duration / Double(max(1, Int(distanceAccum / 1000)))
                let paceSeconds = timePerKm
                let paceMin = Int(paceSeconds) / 60
                let paceSec = Int(paceSeconds) % 60
                let paceStr = "\(paceMin):\(String(format: "%02d", paceSec)) /km"
                
                let avgHr = heartRates.isEmpty ? nil : Int(heartRates.reduce(0.0) { $0 + $1.bpm } / Double(heartRates.count))
                
                splits.append(SplitRow(
                    kilometer: kmIndex,
                    pace: paceStr,
                    heartRate: avgHr,
                    elevation: nil
                ))
                
                kmIndex += 1
                distanceAccum = 0
                kmStartIdx = i
            }
        }
        
        return splits
    }

    var body: some View {
        List {
            // Header section
            Section {
                HStack(spacing: 16) {
                    Image(systemName: workout.workoutActivityType.icon)
                        .font(.system(size: 36))
                        .foregroundStyle(workout.workoutActivityType.color)
                        .frame(width: 64, height: 64)
                        .background(workout.workoutActivityType.color.opacity(0.12))
                        .clipShape(RoundedRectangle(cornerRadius: 14))

                    VStack(alignment: .leading, spacing: 4) {
                        Text(workout.workoutActivityType.name)
                            .font(.title2.bold())
                        Text(workout.startDate.formatted(date: .complete, time: .omitted))
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Text("\(workout.startDate.formatted(date: .omitted, time: .shortened)) – \(workout.endDate.formatted(date: .omitted, time: .shortened))")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 4)
            }

            // GPS Route Map for outdoor activities
            let isOutdoor = [HKWorkoutActivityType.running, .walking, .hiking, .cycling].contains(workout.workoutActivityType)
            if isOutdoor {
                Section("Route") {
                    WorkoutRouteMapView(workout: workout)
                        .frame(height: 200)
                }
            }

            // Stats section
            Section("Stats") {
                WorkoutStatRow(
                    icon: "clock",
                    label: "Duration",
                    value: formatDuration(workout.duration),
                    color: .blue
                )

                if let calories = workout.totalEnergyBurned?.doubleValue(for: .kilocalorie()), calories > 0 {
                    WorkoutStatRow(
                        icon: "flame.fill",
                        label: "Active Calories",
                        value: "\(Int(calories)) kcal",
                        color: .orange
                    )
                }

                if let hr = avgHeartRate {
                    WorkoutStatRow(
                        icon: "heart.fill",
                        label: "Avg Heart Rate",
                        value: "\(Int(hr)) bpm",
                        color: .red
                    )
                }

                if let distance = workout.totalDistance?.doubleValue(for: .meter()), distance > 0 {
                    let km = distance / 1000
                    WorkoutStatRow(
                        icon: "map",
                        label: "Distance",
                        value: String(format: "%.2f km", km),
                        color: .green
                    )

                    // Pace (min/km) only for running/walking/hiking/cycling
                    let paceTypes: [HKWorkoutActivityType] = [.running, .walking, .hiking, .cycling]
                    if paceTypes.contains(workout.workoutActivityType) && workout.duration > 0 {
                        let paceSecsPerKm = workout.duration / km
                        let paceMin = Int(paceSecsPerKm) / 60
                        let paceSec = Int(paceSecsPerKm) % 60
                        WorkoutStatRow(
                            icon: "speedometer",
                            label: workout.workoutActivityType == .cycling ? "Speed" : "Pace",
                            value: workout.workoutActivityType == .cycling
                                ? String(format: "%.1f km/h", km / (workout.duration / 3600))
                                : "\(paceMin):\(String(format: "%02d", paceSec)) /km",
                            color: .purple
                        )
                    }
                }
            }

            if !hrZones.isEmpty {
                Section("Heart Rate Zones") {
                    // Convert zones to minutes for donut chart
                    let zonesWithMinutes = hrZones.map { zone in
                        (name: zone.label, minutes: Int(zone.seconds / 60), color: zone.color)
                    }
                    HRZoneDonutChart(zones: zonesWithMinutes)
                }
            }
            
            // Splits section for running/walking/cycling
            let paceTypes: [HKWorkoutActivityType] = [.running, .walking, .hiking, .cycling]
            if paceTypes.contains(workout.workoutActivityType) && !splits.isEmpty {
                Section("Splits") {
                    ForEach(splits) { split in
                        HStack {
                            Text("KM \(split.kilometer)")
                                .font(.caption)
                                .foregroundStyle(.gray)
                                .frame(width: 50, alignment: .leading)
                            Text(split.pace)
                                .font(.subheadline)
                                .bold()
                            Spacer()
                            if let hr = split.heartRate {
                                Label("\(hr)", systemImage: "heart.fill")
                                    .foregroundStyle(.red)
                                    .font(.caption)
                            }
                        }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle(workout.workoutActivityType.name)
        .toolbarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                ShareLink(item: shareText) {
                    Image(systemName: "square.and.arrow.up")
                }
            }
        }
        .task {
            async let hr = healthKit.fetchAverageHeartRate(during: workout)
            async let samples = healthKit.fetchHeartRateSamples(during: workout)
            async let route = healthKit.fetchWorkoutRoute(for: workout)
            
            avgHeartRate = try? await hr
            if let s = try? await samples, !s.isEmpty {
                hrZones = computeZones(from: s)
            }
            
            if let r = try? await route, !r.isEmpty {
                let samples = try? await samples
                splits = calculateSplits(from: r, heartRates: samples ?? [])
            }
        }
    }

    private var shareText: String {
        var lines: [String] = []
        lines.append("\(workout.workoutActivityType.name) · \(workout.startDate.formatted(date: .abbreviated, time: .omitted))")
        lines.append("⏱ \(formatDuration(workout.duration))")
        if let cal = workout.totalEnergyBurned?.doubleValue(for: .kilocalorie()), cal > 0 {
            lines.append("🔥 \(Int(cal)) kcal")
        }
        if let dist = workout.totalDistance?.doubleValue(for: .meter()), dist > 0 {
            lines.append("📍 \(String(format: "%.2f km", dist / 1000))")
        }
        if let hr = avgHeartRate {
            lines.append("❤️ \(Int(hr)) bpm avg")
        }
        lines.append("\nTracked with KQuarks")
        return lines.joined(separator: "\n")
    }

    private func formatDuration(_ seconds: TimeInterval) -> String {
        let h = Int(seconds) / 3600
        let m = (Int(seconds) % 3600) / 60
        let s = Int(seconds) % 60
        if h > 0 {
            return "\(h)h \(m)m"
        }
        return "\(m)m \(s)s"
    }
}

struct WorkoutStatRow: View {
    let icon: String
    let label: String
    let value: String
    let color: Color

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundStyle(color)
                .frame(width: 24)
            Text(label)
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .font(.headline)
        }
    }
}

struct WorkoutRouteMapView: View {
    let workout: HKWorkout
    @State private var route: [CLLocationCoordinate2D] = []
    @State private var region: MKCoordinateRegion = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 37.33, longitude: -122.01),
        span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
    )
    @State private var isLoadingRoute = false

    var body: some View {
        Group {
            if isLoadingRoute {
                HStack {
                    Spacer()
                    VStack(spacing: 8) {
                        ProgressView()
                        Text("Loading route...")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                }
            } else if route.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "location.slash")
                        .font(.headline)
                        .foregroundStyle(.secondary)
                    Text("No GPS route available")
                        .foregroundStyle(.gray)
                        .font(.subheadline)
                }
                .frame(maxWidth: .infinity, alignment: .center)
            } else {
                Map(position: .constant(.region(region))) {
                    MapPolyline(coordinates: route)
                        .stroke(.orange, lineWidth: 3)
                    
                    if let first = route.first {
                        Annotation("Start", coordinate: first) {
                            Image(systemName: "location.fill")
                                .foregroundStyle(.green)
                        }
                    }
                    if let last = route.last {
                        Annotation("Finish", coordinate: last) {
                            Image(systemName: "flag.fill")
                                .foregroundStyle(.red)
                        }
                    }
                }
                .cornerRadius(12)
            }
        }
        .task {
            await loadRoute()
        }
    }

    private func loadRoute() async {
        isLoadingRoute = true
        defer { isLoadingRoute = false }

        do {
            let query = HKQuery.predicateForWorkout(with: workout.workoutActivityType)
            let predicate = HKQuery.predicateForSamples(
                withStart: workout.startDate,
                end: workout.endDate,
                options: .strictStartDate
            )
            let compound = NSCompoundPredicate(andPredicateWithSubpredicates: [query, predicate])

            let store = HKHealthStore()
            let samples = try await store.samples(
                matching: compound,
                with: HKWorkoutRoute.self
            )

            if let workoutRoute = samples.first as? HKWorkoutRoute {
                var coordinates: [CLLocationCoordinate2D] = []
                var minLat = Double.infinity, maxLat = -Double.infinity
                var minLon = Double.infinity, maxLon = -Double.infinity

                try await workoutRoute.locations(between: workout.startDate, and: workout.endDate) { locations in
                    if let locations = locations {
                        for location in locations {
                            let coord = location.coordinate
                            coordinates.append(coord)
                            minLat = min(minLat, coord.latitude)
                            maxLat = max(maxLat, coord.latitude)
                            minLon = min(minLon, coord.longitude)
                            maxLon = max(maxLon, coord.longitude)
                        }
                    }
                }

                if !coordinates.isEmpty {
                    route = coordinates

                    let center = CLLocationCoordinate2D(
                        latitude: (minLat + maxLat) / 2,
                        longitude: (minLon + maxLon) / 2
                    )
                    let latSpan = maxLat - minLat + 0.01
                    let lonSpan = maxLon - minLon + 0.01

                    region = MKCoordinateRegion(
                        center: center,
                        span: MKCoordinateSpan(latitudeDelta: latSpan, longitudeDelta: lonSpan)
                    )
                }
            }
        } catch {
            Logger.sync.error("Failed to load workout route: \(error.localizedDescription)")
        }
    }
}

#Preview {
    NavigationStack {
        Text("WorkoutDetailView preview")
    }
}

extension CLLocationCoordinate2D {
    static func distance(from: CLLocationCoordinate2D, to: CLLocationCoordinate2D) -> Double {
        let location1 = CLLocation(latitude: from.latitude, longitude: from.longitude)
        let location2 = CLLocation(latitude: to.latitude, longitude: to.longitude)
        return location1.distance(from: location2)
    }
}
