import Foundation

extension Date {
    /// Format date using a custom date format string.
    /// Used throughout views to avoid inline DateFormatter construction in ViewBuilder closures.
    func kqFormat(_ format: String) -> String {
        let df = DateFormatter()
        df.dateFormat = format
        return df.string(from: self)
    }

    /// Format date using a DateFormatter style (e.g. .medium, .short).
    func kqFormatted(dateStyle: DateFormatter.Style, timeStyle: DateFormatter.Style = .none) -> String {
        let df = DateFormatter()
        df.dateStyle = dateStyle
        df.timeStyle = timeStyle
        return df.string(from: self)
    }
}
