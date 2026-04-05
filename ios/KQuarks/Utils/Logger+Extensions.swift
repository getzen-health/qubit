import OSLog

extension Logger {
    public static let general = Logger(
        subsystem: Bundle.main.bundleIdentifier ?? "getzen",
        category: "general"
    )
    public static let sync = Logger(
        subsystem: Bundle.main.bundleIdentifier ?? "getzen",
        category: "sync"
    )
    public static let healthKit = Logger(
        subsystem: Bundle.main.bundleIdentifier ?? "getzen",
        category: "healthkit"
    )
    public static let notifications = Logger(
        subsystem: Bundle.main.bundleIdentifier ?? "getzen",
        category: "notifications"
    )
    public static let briefing = Logger(
        subsystem: Bundle.main.bundleIdentifier ?? "getzen",
        category: "briefing"
    )
}
