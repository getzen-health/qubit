import UIKit
import SwiftUI

struct ShareHelper {
    static func share(items: [Any], from viewController: UIViewController? = nil) {
        let activityVC = UIActivityViewController(activityItems: items, applicationActivities: nil)
        
        if let vc = viewController ?? UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .first?.windows.first?.rootViewController {
            vc.present(activityVC, animated: true)
        }
    }
}

// SwiftUI view modifier
struct ShareModifier: ViewModifier {
    let items: [Any]
    @State private var showShare = false
    
    func body(content: Content) -> some View {
        content
            .sheet(isPresented: $showShare) {
                ActivityView(activityItems: items)
            }
            .contextMenu {
                Button(action: { showShare = true }) {
                    Label("Share", systemImage: "square.and.arrow.up")
                }
            }
    }
}

struct ActivityView: UIViewControllerRepresentable {
    let activityItems: [Any]
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
    }
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
