import SwiftUI

struct LeaderboardView: View {
    var body: some View {
        NavigationStack {
            List {
                Section("Your Streak") {
                    HStack {
                        Text("🔥").font(.largeTitle)
                        VStack(alignment: .leading) {
                            Text("0 days").font(.title2.bold())
                            Text("Start today to begin your streak").font(.caption).foregroundColor(.secondary)
                        }
                    }
                }
                Section("Top Streaks") {
                    ForEach(1...5, id: \.self) { rank in
                        HStack {
                            Text(rank == 1 ? "🥇" : rank == 2 ? "🥈" : rank == 3 ? "🥉" : "\(rank)")
                                .frame(width: 30)
                            Text("Anonymous Quarker")
                            Spacer()
                            Text("-- days").foregroundColor(.secondary)
                        }
                    }
                }
            }
            .premiumList()
            .navigationTitle("Streak Leaderboard")
        }
    }
}

#Preview {
    LeaderboardView()
}
