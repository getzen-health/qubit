import Foundation

private enum KQDateFormatters {
    private static let lock = DispatchQueue(label: "getzen.dateformatter.cache")
    private static var formatCache: [String: DateFormatter] = [:]

    static func formatter(format: String) -> DateFormatter {
        lock.sync {
            if let cached = formatCache[format] { return cached }
            let df = DateFormatter()
            df.dateFormat = format
            formatCache[format] = df
            return df
        }
    }

    static func formatter(dateStyle: DateFormatter.Style, timeStyle: DateFormatter.Style) -> DateFormatter {
        let key = "ds:\(dateStyle.rawValue)|ts:\(timeStyle.rawValue)"
        return lock.sync {
            if let cached = formatCache[key] { return cached }
            let df = DateFormatter()
            df.dateStyle = dateStyle
            df.timeStyle = timeStyle
            formatCache[key] = df
            return df
        }
    }
}

extension Date {
    /// Format date using a custom date format string, using a cached DateFormatter.
    func kqFormat(_ format: String) -> String {
        KQDateFormatters.formatter(format: format).string(from: self)
    }

    /// Format date using a DateFormatter style, using a cached DateFormatter.
    func kqFormatted(dateStyle: DateFormatter.Style, timeStyle: DateFormatter.Style = .none) -> String {
        KQDateFormatters.formatter(dateStyle: dateStyle, timeStyle: timeStyle).string(from: self)
    }
}
