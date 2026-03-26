import SwiftUI
import UIKit

extension View {
    func shareHealthSummary(steps: Int, calories: Double, date: Date = Date()) -> some View {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        let text = "My health stats for \(formatter.string(from: date)) via KQuarks:\n🚶 \(steps) steps\n🔥 \(Int(calories)) calories burned\n\nTrack yours at kquarks.app"
        return self.onTapGesture {
            let activityVC = UIActivityViewController(activityItems: [text], applicationActivities: nil)
            if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
               let window = windowScene.windows.first,
               let rootVC = window.rootViewController {
                rootVC.present(activityVC, animated: true)
            }
        }
    }
}

// Share button component
struct ShareHealthButton: View {
    let steps: Int
    let calories: Double

    @State private var showShareSheet = false
    private var shareText: String {
        "My health stats via KQuarks:\n🚶 \(steps) steps\n🔥 \(Int(calories)) calories\n\nTrack yours at kquarks.app"
    }

    var body: some View {
        Button(action: { showShareSheet = true }) {
            Label("Share", systemImage: "square.and.arrow.up")
        }
        .sheet(isPresented: $showShareSheet) {
            ShareSheet(items: [shareText])
        }
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
