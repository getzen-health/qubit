import Foundation
import SwiftData

@Model
class PendingSyncItem {
    var id: UUID
    var type: String
    var payload: Data
    var createdAt: Date
    var retryCount: Int

    init(type: String, payload: Data) {
        self.id = UUID()
        self.type = type
        self.payload = payload
        self.createdAt = Date()
        self.retryCount = 0
    }
}

@MainActor
class OfflineSyncQueue: ObservableObject {
    static let shared = OfflineSyncQueue()
    
    @Published var pendingCount = 0
    private var modelContext: ModelContext?

    private init() {
        updatePendingCount()
    }

    func setModelContext(_ context: ModelContext) {
        self.modelContext = context
        updatePendingCount()
    }

    func enqueue(type: String, payload: Encodable) throws {
        guard let data = try? JSONEncoder().encode(AnyEncodable(payload)) else {
            throw NSError(domain: "OfflineSyncQueue", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to encode payload"])
        }

        let item = PendingSyncItem(type: type, payload: data)
        modelContext?.insert(item)
        try? modelContext?.save()
        updatePendingCount()
    }

    func getAllPending() -> [PendingSyncItem] {
        guard let context = modelContext else { return [] }
        let descriptor = FetchDescriptor<PendingSyncItem>()
        return (try? context.fetch(descriptor)) ?? []
    }

    func removePending(_ item: PendingSyncItem) throws {
        modelContext?.delete(item)
        try? modelContext?.save()
        updatePendingCount()
    }

    func incrementRetryCount(_ item: PendingSyncItem) throws {
        item.retryCount += 1
        if item.retryCount >= 3 {
            try removePending(item)
        } else {
            try? modelContext?.save()
        }
    }

    func flushIfOnline(supabase: SupabaseService) async {
        guard supabase.isAuthenticated else { return }

        let pending = getAllPending()
        for item in pending {
            do {
                try await processSyncItem(item, supabase: supabase)
                try removePending(item)
            } catch {
                try? incrementRetryCount(item)
            }
        }

        updatePendingCount()
    }

    private func processSyncItem(_ item: PendingSyncItem, supabase: SupabaseService) async throws {
        let decoder = JSONDecoder()
        switch item.type {
        case "healthRecord":
            let records = try decoder.decode([HealthRecordUpload].self, from: item.payload)
            try await supabase.uploadHealthRecords(records)
        case "dailySummary":
            let summary = try decoder.decode(DailySummaryUpload.self, from: item.payload)
            try await supabase.uploadDailySummary(summary)
        case "sleepRecord":
            let record = try decoder.decode(SleepRecordUpload.self, from: item.payload)
            try await supabase.uploadSleepRecord(record)
        case "workoutRecord":
            let record = try decoder.decode(WorkoutRecordUpload.self, from: item.payload)
            try await supabase.uploadWorkoutRecord(record)
        default:
            // Unknown type: discard without retrying so it doesn't block the queue
            break
        }
    }

    private func updatePendingCount() {
        let allPending = getAllPending()
        pendingCount = allPending.count
        UserDefaults.standard.set(pendingCount, forKey: "pendingSyncCount")
    }
}

struct AnyEncodable: Encodable {
    private let _encode: (Encoder) throws -> Void

    init<T: Encodable>(_ value: T) {
        _encode = value.encode
    }

    func encode(to encoder: Encoder) throws {
        try _encode(encoder)
    }
}

struct AnyCodable: Codable {
    let value: Any

    init(_ value: Any) {
        self.value = value
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let intVal = try? container.decode(Int.self) {
            value = intVal
        } else if let doubleVal = try? container.decode(Double.self) {
            value = doubleVal
        } else if let boolVal = try? container.decode(Bool.self) {
            value = boolVal
        } else if let stringVal = try? container.decode(String.self) {
            value = stringVal
        } else if let arrayVal = try? container.decode([AnyCodable].self) {
            value = arrayVal.map { $0.value }
        } else if let dictVal = try? container.decode([String: AnyCodable].self) {
            value = dictVal.mapValues { $0.value }
        } else {
            value = NSNull()
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        if let intVal = value as? Int {
            try container.encode(intVal)
        } else if let doubleVal = value as? Double {
            try container.encode(doubleVal)
        } else if let boolVal = value as? Bool {
            try container.encode(boolVal)
        } else if let stringVal = value as? String {
            try container.encode(stringVal)
        } else if let arrayVal = value as? [Any] {
            try container.encode(arrayVal.map { AnyCodable($0) })
        } else if let dictVal = value as? [String: Any] {
            try container.encode(dictVal.mapValues { AnyCodable($0) })
        } else {
            try container.encodeNil()
        }
    }
}
