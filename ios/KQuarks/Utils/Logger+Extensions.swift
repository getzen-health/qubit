import OSLog

extension Logger {
    static let general = Logger(
        subsystem: Bundle.main.bundleIdentifier ?? "getzen",
        category: "general"
    )
    static let sync = Logger(
        subsystem: Bundle.main.bundleIdentifier ?? "getzen",
        category: "sync"
    )
    static let healthKit = Logger(
        subsystem: Bundle.main.bundleIdentifier ?? "getzen",
        category: "healthkit"
    )
    static let notifications = Logger(
        subsystem: Bundle.main.bundleIdentifier ?? "getzen",
        category: "notifications"
    )
    static let briefing = Logger(
        subsystem: Bundle.main.bundleIdentifier ?? "getzen",
        category: "briefing"
    )
}
