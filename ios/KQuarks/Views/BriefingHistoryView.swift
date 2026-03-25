import SwiftUI

// MARK: - Data Model

private struct BriefingRecord: Identifiable, Decodable {
    let id: String
    let date: String
    let content: String
    let createdAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case date
        case content
        case createdAt = "created_at"
    }

    var displayDate: Date {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.date(from: date) ?? .distantPast
    }
}

// MARK: - BriefingHistoryView

struct BriefingHistoryView: View {
    @State private var briefings: [BriefingRecord] = []
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if let error = errorMessage {
                    errorStateView(message: error)
                } else if briefings.isEmpty {
                    emptyStateView
                } else {
                    briefingList
                }
            }
            .navigationTitle("Morning Briefings")
            .toolbarTitleDisplayMode(.inline)
            .task {
                await loadBriefings()
            }
            .refreshable {
                await loadBriefings()
            }
        }
    }

    // MARK: - Subviews

    private var briefingList: some View {
        List {
            ForEach(briefings) { record in
                BriefingRow(record: record)
                    .listRowInsets(EdgeInsets(top: 12, leading: 16, bottom: 12, trailing: 16))
                    .listRowSeparator(.hidden)
                    .listRowBackground(Color.clear)
            }
        }
        .listStyle(.plain)
        .background(Color(.systemGroupedBackground))
    }

    private var emptyStateView: some View {
        VStack(spacing: 16) {
            Image(systemName: "sun.horizon")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("Your morning briefings will appear here")
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func errorStateView(message: String) -> some View {
        VStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 40))
                .foregroundStyle(.secondary)
            Text(message)
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
            Button("Try Again") {
                Task { await loadBriefings() }
            }
            .buttonStyle(.bordered)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Data Loading

    private func loadBriefings() async {
        isLoading = true
        errorMessage = nil

        guard let userId = SupabaseService.shared.currentSession?.user.id.uuidString else {
            errorMessage = "Sign in to view your briefings"
            isLoading = false
            return
        }

        do {
            let records: [BriefingRecord] = try await SupabaseService.shared.client
                .from("briefings")
                .select("id,date,content,created_at")
                .eq("user_id", value: userId)
                .order("date", ascending: false)
                .limit(60)
                .execute()
                .value

            briefings = records
        } catch {
            errorMessage = "Failed to load briefings"
            print("[BriefingHistoryView] Error fetching briefings: \(error)")
        }

        isLoading = false
    }
}

// MARK: - BriefingRow

private struct BriefingRow: View {
    let record: BriefingRecord

    private var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .full
        formatter.timeStyle = .none
        return formatter.string(from: record.displayDate)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "sun.horizon.fill")
                    .foregroundStyle(.orange)
                    .font(.subheadline)
                Text(formattedDate)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(.primary)
                Spacer()
            }

            Text(record.content)
                .font(.body)
                .foregroundStyle(.primary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(16)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

#Preview {
    BriefingHistoryView()
}
