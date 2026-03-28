import Foundation

// TODO: Replace stubs with RevenueCat SDK — add pod 'RevenueCat' to Podfile

/// Manages the user's Pro subscription state.
/// Currently uses UserDefaults as a local stub.
/// Replace the body of each method with RevenueCat SDK calls once
/// `REVENUECAT_API_KEY` is available.
@Observable
class SubscriptionService {
    static let shared = SubscriptionService()

    private let userDefaultsKey = "kquarks_is_pro"

    /// `true` when the user has an active Pro entitlement.
    var isPro: Bool = false

    private init() {
        Task { await checkEntitlements() }
    }

    /// Initiates a Pro purchase flow.
    /// Stub: immediately grants Pro and persists to UserDefaults.
    func purchase() async throws {
        // TODO: Replace with RevenueCat Purchases.shared.purchase(package:)
        isPro = true
        UserDefaults.standard.set(true, forKey: userDefaultsKey)
    }

    /// Restores previous purchases.
    /// Stub: re-reads UserDefaults (same as checkEntitlements).
    func restorePurchases() async throws {
        // TODO: Replace with RevenueCat Purchases.shared.restorePurchases()
        await checkEntitlements()
    }

    /// Checks the current entitlement status and updates `isPro`.
    /// Stub: reads from UserDefaults `kquarks_is_pro`.
    func checkEntitlements() async {
        // TODO: Replace with RevenueCat CustomerInfo entitlement lookup:
        //   let info = try? await Purchases.shared.customerInfo()
        //   isPro = info?.entitlements["pro"]?.isActive == true
        isPro = UserDefaults.standard.bool(forKey: userDefaultsKey)
    }
}
