import SwiftUI

enum DeepLinkDestination: Hashable {
    case foodScanner
    case foodDiary
    case foodHistory
    case readiness
    case sleep
    case workouts
    case water
    case habits
    case hrv
    case body
    case glucose
    case vitals
    case social
    case achievements
    case settings
    case profile
}

@Observable
final class DeepLinkHandler {
    static let shared = DeepLinkHandler()
    var pendingDestination: DeepLinkDestination?
    
    func handleDeepLink(_ url: URL) {
        guard url.scheme == "kquarks" else { return }
        let host = url.host ?? ""
        let path = url.pathComponents.dropFirst().first ?? ""
        
        switch host {
        case "food", "nutrition":
            switch path {
            case "scan":    pendingDestination = .foodScanner
            case "diary":   pendingDestination = .foodDiary
            case "history": pendingDestination = .foodHistory
            default:        pendingDestination = .foodScanner
            }
        case "ready", "readiness":
            pendingDestination = .readiness
        case "sleep":
            pendingDestination = .sleep
        case "workouts", "workout":
            pendingDestination = .workouts
        case "water":
            pendingDestination = .water
        case "habits", "habit":
            pendingDestination = .habits
        case "hrv":
            pendingDestination = .hrv
        case "body":
            pendingDestination = .body
        case "glucose":
            pendingDestination = .glucose
        case "vitals":
            pendingDestination = .vitals
        case "social":
            pendingDestination = .social
        case "achievements":
            pendingDestination = .achievements
        case "settings":
            pendingDestination = .settings
        case "profile":
            pendingDestination = .profile
        default:
            break
        }
    }
}
