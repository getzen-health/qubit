import SwiftUI

// MARK: - Model

struct AnomalyRecord: Decodable, Identifiable {
    let id: String
    let user_id: String
    let detected_at: String
    let metric: String
    let value: Double
    let avg_value: Double
    let deviation: Double
    let severity: String
    let claude_explanation: String?
    let dismissed_at: String?

    var isDismissed: Bool { dismissed_at != nil }

    var metricDisplayName: String {
        switch metric {
        case "avg_hrv":                 return "HRV"
        case "resting_heart_rate":      return "Resting Heart Rate"
        case "sleep_duration_minutes":  return "Sleep Duration"
        case "steps":                   return "Step Count"
        default:
            return metric
                .replacingOccurrences(of: "_", with: " ")
                .capitalized
        }
    }

    var formattedValue: String {
        switch metric {
        case "avg_hrv":
            return String(format: "%.0f ms", value)
        case "resting_heart_rate":
            return String(format: "%.0f bpm", value)
        case "sleep_duration_minutes":
            return String(format: "%.1f h", value / 60.0)
        case "steps":
            return "\(Int(value).formatted()) steps"
        default:
            return String(format: "%.1f", value)
        }
    }

    var formattedAvg: String {
        switch metric {
        case "avg_hrv":
            return String(format: "%.0f ms avg", avg_value)
        case "resting_heart_rate":
            return String(format: "%.0f bpm avg", avg_value)
        case "sleep_duration_minutes":
            return String(format: "%.1f h avg", avg_value / 60.0)
        case "steps":
            return "\(Int(avg_value).formatted()) steps avg"
        default:
            return String(format: "%.1f avg", avg_value)
        }
    }

    var detectedDate: String {
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let iso2 = ISO8601DateFormatter()
        if let date = iso.date(from: detected_at) ?? iso2.date(from: detected_at) {
            let df = DateFormatter()
            df.dateStyle = .medium
            df.timeStyle = .short
            return df.string(from: date)
        }
        return detected_at
    }

    var severityLevel: SeverityLevel {
        switch severity {
        case "high":   return .high
        case "medium": return .medium
        default:       return .low
        }
    }
}

enum SeverityLevel: Int, Comparable {
    case high = 2, medium = 1, low = 0

    static func < (lhs: SeverityLevel, rhs: SeverityLevel) -> Bool {
        lhs.rawValue < rhs.rawValue
    }

    var label: String {
        switch self {
        case .high:   return "High"
        case .medium: return "Medium"
        case .low:    return "Low"
        }
    }

    var color: Color {
        switch self {
        case .high:   return .red
        case .medium: return .orange
        case .low:    return .yellow
        }
    }

    var systemImage: String {
        switch self {
        case .high:   return "exclamationmark.triangle.fill"
        case .medium: return "exclamationmark.circle.fill"
        case .low:    return "info.circle.fill"
        }
    }
}

// MARK: - AnomalyAlertView

struct AnomalyAlertView: View {
    @State private var anomalies: [AnomalyRecord] = []
    @State private var isLoading = true
    @State private var errorMessage: String?

    private var grouped: [(SeverityLevel, [AnomalyRecord])] {
        let all = anomalies.filter { !$0.isDismissed }
        let sorted = all.sorted { $0.severityLevel > $1.severityLevel }
        var result: [(SeverityLevel, [AnomalyRecord])] = []
        for level in [SeverityLevel.high, .medium, .low] {
            let group = sorted.filter { $0.severityLevel == level }
            if !group.isEmpty {
                result.append((level, group))
            }
        }
        return result
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if isLoading {
                    ProgressView()
                        .padding(.top, 60)
                } else if let error = errorMessage {
                    errorState(message: error)
                } else if grouped.isEmpty {
                    emptyState
                } else {
                    ForEach(grouped, id: \.0) { level, records in
                        sectionHeader(level: level)
                        ForEach(records) { record in
                            AnomalyCard(record: record) {
                                await dismiss(record: record)
                            }
                        }
                    }
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Health Alerts")
        .toolbarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Section Header

    private func sectionHeader(level: SeverityLevel) -> some View {
        HStack(spacing: 6) {
            Image(systemName: level.systemImage)
                .foregroundStyle(level.color)
            Text("\(level.label) Severity")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.secondary)
            Spacer()
        }
        .padding(.horizontal, 4)
        .padding(.top, 4)
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark.shield.fill")
                .font(.system(size: 56))
                .foregroundStyle(.green)
            Text("No anomalies detected — you're on track!")
                .font(.title3.bold())
                .multilineTextAlignment(.center)
            Text("We'll alert you if any of your key health metrics show an unusual pattern.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Error State

    private func errorState(message: String) -> some View {
        VStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 40))
                .foregroundStyle(.orange)
            Text("Could not load alerts")
                .font(.headline)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Data

    private func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        guard SupabaseService.shared.currentSession != nil else {
            errorMessage = "Please sign in to view health alerts."
            return
        }

        let since = Calendar.current.date(byAdding: .day, value: -30, to: Date()) ?? Date()
        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        let sinceStr = df.string(from: since)

        do {
            let fetched: [AnomalyRecord] = try await SupabaseService.shared.client
                .from("anomalies")
                .select()
                .is("dismissed_at", value: nil)
                .gte("detected_at", value: sinceStr)
                .order("detected_at", ascending: false)
                .execute()
                .value

            anomalies = fetched
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func dismiss(record: AnomalyRecord) async {
        let now = ISO8601DateFormatter().string(from: Date())
        do {
            try await SupabaseService.shared.client
                .from("anomalies")
                .update(["dismissed_at": now])
                .eq("id", value: record.id)
                .execute()
            anomalies.removeAll { $0.id == record.id }
        } catch {
            // Dismissal failure is silent — record remains visible
        }
    }
}

// MARK: - AnomalyCard

private struct AnomalyCard: View {
    let record: AnomalyRecord
    let onDismiss: () async -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header row: metric name + severity badge
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(record.metricDisplayName)
                        .font(.headline)
                    Text(record.detectedDate)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                severityBadge
            }

            // Value vs average
            HStack(spacing: 16) {
                valueBlock(label: "Today", value: record.formattedValue)
                Divider().frame(height: 36)
                valueBlock(label: "14-day avg", value: record.formattedAvg)
            }

            // Claude explanation
            if let explanation = record.claude_explanation, !explanation.isEmpty {
                Text(explanation)
                    .font(.subheadline)
                    .foregroundStyle(.primary.opacity(0.85))
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
            Button(role: .destructive) {
                Task { await onDismiss() }
            } label: {
                Label("Dismiss", systemImage: "xmark.circle.fill")
            }
            .tint(.gray)
        }
    }

    private var severityBadge: some View {
        HStack(spacing: 4) {
            Image(systemName: record.severityLevel.systemImage)
                .font(.caption2)
            Text(record.severityLevel.label)
                .font(.caption.weight(.semibold))
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(record.severityLevel.color.opacity(0.15))
        .foregroundStyle(record.severityLevel.color)
        .clipShape(Capsule())
    }

    private func valueBlock(label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(value)
                .font(.subheadline.bold().monospacedDigit())
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }
}

// MARK: - Preview

#Preview {
    NavigationStack {
        AnomalyAlertView()
    }
}
