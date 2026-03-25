import SwiftUI

struct AchievementsView: View {
    @State private var achievements: [SupabaseService.Achievement] = []
    @State private var isLoading = true

    var body: some View {
        NavigationStack {
            Group {
                if isLoading && achievements.isEmpty {
                    ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if achievements.isEmpty {
                    emptyState
                } else {
                    achievementsList
                }
            }
            .navigationTitle("Achievements")
            .toolbarTitleDisplayMode(.inline)
            .task { await load() }
            .refreshable { await load() }
        }
    }

    // MARK: - List

    private var achievementsList: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Count badge
                HStack {
                    Label("\(achievements.count) earned", systemImage: "trophy.fill")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(.orange)
                    Spacer()
                }
                .padding(.horizontal)
                .padding(.vertical, 12)

                // Cards
                VStack(spacing: 1) {
                    ForEach(achievements) { achievement in
                        AchievementRow(achievement: achievement)
                        if achievement.id != achievements.last?.id {
                            Divider().padding(.leading, 68)
                        }
                    }
                }
                .background(Color(.systemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .padding(.horizontal)
                .padding(.bottom, 24)
            }
        }
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Empty state

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "trophy")
                .font(.system(size: 60))
                .foregroundStyle(.orange.opacity(0.5))
            Text("No Achievements Yet")
                .font(.title3.bold())
            Text("Sync your health data and hit milestones to earn your first badge.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        achievements = (try? await SupabaseService.shared.fetchAchievements()) ?? []
    }
}

// MARK: - Row

private struct AchievementRow: View {
    let achievement: SupabaseService.Achievement

    var grantedDate: String {
        let df = ISO8601DateFormatter()
        guard let date = df.date(from: achievement.granted_at) else { return "" }
        return date.formatted(date: .abbreviated, time: .omitted)
    }

    var body: some View {
        HStack(spacing: 14) {
            Text(achievement.icon)
                .font(.system(size: 32))
                .frame(width: 48, height: 48)
                .background(Color.orange.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 12))

            VStack(alignment: .leading, spacing: 3) {
                Text(achievement.title)
                    .font(.subheadline.weight(.semibold))
                Text(achievement.description)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
                Text(grantedDate)
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }

            Spacer()
        }
        .padding(.horizontal)
        .padding(.vertical, 12)
    }
}

#Preview {
    AchievementsView()
}
