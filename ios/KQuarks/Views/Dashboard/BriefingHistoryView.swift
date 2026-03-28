import SwiftUI

struct BriefingHistoryView: View {
    var body: some View {
        List {
            ContentUnavailableView("No Briefings Yet", systemImage: "sparkles", description: Text("Your AI health briefings will appear here."))
        }
        .navigationTitle("Briefing History")
        .navigationBarTitleDisplayMode(.inline)
    }
}
