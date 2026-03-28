import SwiftUI

struct PaywallView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var subscriptionService = SubscriptionService.shared
    @State private var isPurchasing = false
    @State private var isRestoring = false
    @State private var errorMessage: String?

    private let proFeatures: [(icon: String, text: String)] = [
        ("sparkles",              "AI Health Insights (weekly narrative + daily)"),
        ("square.and.arrow.up",  "Health Data Export (JSON/CSV)"),
        ("chart.line.uptrend.xyaxis", "14-day trend analysis"),
        ("camera.viewfinder",    "Food scan history (unlimited)"),
        ("star.fill",            "Priority support"),
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: 28) {
                // Crown icon
                Image(systemName: "crown.fill")
                    .font(.system(size: 56))
                    .foregroundStyle(.yellow)
                    .padding(.top, 40)

                VStack(spacing: 8) {
                    Text("Unlock KQuarks Pro")
                        .font(.title.bold())
                        .multilineTextAlignment(.center)

                    Text("$4.99 / month")
                        .font(.title2)
                        .foregroundStyle(.secondary)
                }

                // Feature list
                VStack(alignment: .leading, spacing: 14) {
                    ForEach(proFeatures, id: \.text) { feature in
                        HStack(spacing: 14) {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(.green)
                                .font(.title3)
                            Image(systemName: feature.icon)
                                .foregroundStyle(.accent)
                                .frame(width: 20)
                            Text(feature.text)
                                .font(.body)
                        }
                    }
                }
                .padding(.horizontal)

                if let error = errorMessage {
                    Text(error)
                        .font(.footnote)
                        .foregroundStyle(.red)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }

                // Start Free Trial button
                Button {
                    Task { await startTrial() }
                } label: {
                    if isPurchasing {
                        ProgressView()
                            .progressViewStyle(.circular)
                            .frame(maxWidth: .infinity)
                    } else {
                        Text("Start Free Trial — 1 week")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .padding(.horizontal)
                .disabled(isPurchasing || isRestoring)

                // Restore Purchases
                Button {
                    Task { await restore() }
                } label: {
                    if isRestoring {
                        ProgressView()
                            .progressViewStyle(.circular)
                    } else {
                        Text("Restore Purchases")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }
                .disabled(isPurchasing || isRestoring)

                // Maybe Later
                Button("Maybe Later") {
                    dismiss()
                }
                .font(.subheadline)
                .foregroundStyle(.tertiary)
                .padding(.bottom, 32)
            }
            .frame(maxWidth: .infinity)
        }
    }

    private func startTrial() async {
        isPurchasing = true
        errorMessage = nil
        do {
            try await subscriptionService.purchase()
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
        isPurchasing = false
    }

    private func restore() async {
        isRestoring = true
        errorMessage = nil
        do {
            try await subscriptionService.restorePurchases()
            if subscriptionService.isPro { dismiss() }
        } catch {
            errorMessage = error.localizedDescription
        }
        isRestoring = false
    }
}

#Preview {
    PaywallView()
}
