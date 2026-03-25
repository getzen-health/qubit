import SwiftUI

struct DeepLink {
    let action: DeepLinkAction
    let tab: TabSelection?

    enum DeepLinkAction {
        case dashboard
        case foodScan
        case readiness
        case social
    }
}

enum TabSelection: Hashable {
    case dashboard
    case foodScan
    case readiness
    case social
}

final class DeepLinkHandler {
    static func handleDeepLink(_ url: URL) -> DeepLink? {
        guard url.scheme == "kquarks" else { return nil }

        switch url.host {
        case "dashboard":
            return DeepLink(action: .dashboard, tab: .dashboard)
        case "food":
            if url.path == "/scan" {
                return DeepLink(action: .foodScan, tab: .foodScan)
            }
        case "ready":
            return DeepLink(action: .readiness, tab: .readiness)
        case "social":
            return DeepLink(action: .social, tab: .social)
        default:
            return nil
        }

        return nil
    }
}
