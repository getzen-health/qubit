import SwiftUI

// MARK: - PredictionsView

/// Surfaces weekly AI-powered health predictions fetched directly from
/// the Supabase `predictions` table via `SupabaseService.fetchPredictions()`.
/// Tap the refresh button or pull to refresh to invoke the predictions
/// edge function and generate a fresh forecast.
@Observable
private class PredictionsViewModel {
    var predictions: [SupabaseService.PredictionRow] = []
    var isLoading = false
    var error: String?

    func load() async {
        isLoading = true
        error = nil
        do {
            predictions = try await SupabaseService.shared.fetchPredictions(limit: 1)
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    func refresh() async {
        isLoading = true
        error = nil
        // Call the edge function to regenerate, then reload from DB
        await PredictionService.shared.generatePrediction()
        if let svcError = PredictionService.shared.error {
            self.error = svcError
        }
        do {
            predictions = try await SupabaseService.shared.fetchPredictions(limit: 1)
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }
}

struct PredictionsView: View {
    @State private var viewModel = PredictionsViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if viewModel.isLoading {
                    ProgressView()
                        .padding(.top, 80)
                } else if let prediction = viewModel.predictions.first {
                    weekHeaderCard(prediction: prediction)
                    recoveryCard(prediction: prediction)
                    trainingWindowCard(prediction: prediction)
                    cautionCard(prediction: prediction)
                    confidenceBadge
                    refreshFooter(prediction: prediction)
                } else {
                    emptyState
                }

                if let errorMessage = viewModel.error {
                    errorBanner(message: errorMessage)
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Predictions")
        .toolbarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button {
                    Task { await viewModel.refresh() }
                } label: {
                    Label("Refresh", systemImage: "arrow.clockwise")
                }
                .disabled(viewModel.isLoading)
            }
        }
        .task { await viewModel.load() }
        .refreshable { await viewModel.refresh() }
    }

    // MARK: - Week Header Card

    private func weekHeaderCard(prediction: SupabaseService.PredictionRow) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Image(systemName: "sparkles")
                    .foregroundStyle(.purple)
                Text("This Week's Outlook")
                    .font(.headline)
                Spacer()
            }
            Text("Week of \(prediction.weekOf)")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Recovery Card

    private func recoveryCard(prediction: SupabaseService.PredictionRow) -> some View {
        let color = recoveryColor(text: prediction.recoveryForecast)
        return VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Circle()
                    .fill(color)
                    .frame(width: 12, height: 12)
                Text("Recovery Forecast")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.secondary)
            }
            Text(prediction.recoveryForecast)
                .font(.body)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Training Window Card

    private func trainingWindowCard(prediction: SupabaseService.PredictionRow) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "calendar.badge.checkmark")
                    .foregroundStyle(.blue)
                Text("Best Training Window")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.secondary)
            }
            Text(prediction.performanceWindow)
                .font(.body)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Caution Card

    private func cautionCard(prediction: SupabaseService.PredictionRow) -> some View {
        let hasContent = !prediction.cautionFlags.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        return VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: hasContent ? "exclamationmark.triangle.fill" : "checkmark.circle.fill")
                    .foregroundStyle(hasContent ? .orange : .green)
                Text("Watch Out")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.secondary)
            }
            Text(hasContent ? prediction.cautionFlags : "All clear — no risk factors detected this week.")
                .font(.body)
                .foregroundStyle(hasContent ? .primary : .secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Confidence Badge

    private var confidenceBadge: some View {
        HStack(spacing: 6) {
            Image(systemName: "chart.line.uptrend.xyaxis")
                .font(.caption)
                .foregroundStyle(.purple)
            Text("AI-powered · 90-day analysis · Refreshes weekly")
                .font(.caption2)
                .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 6)
        .padding(.horizontal, 12)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(Capsule())
        .frame(maxWidth: .infinity, alignment: .center)
    }

    // MARK: - Refresh Footer

    private func refreshFooter(prediction: SupabaseService.PredictionRow) -> some View {
        VStack(spacing: 6) {
            Text("Updated \(prediction.createdAt.formatted(.relative(presentation: .named)))")
                .font(.caption)
                .foregroundStyle(.tertiary)
            Button {
                Task { await viewModel.refresh() }
            } label: {
                Label("Tap to Refresh", systemImage: "arrow.clockwise")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .center)
        .padding(.top, 4)
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 20) {
            Image(systemName: "chart.line.uptrend.xyaxis.circle")
                .font(.system(size: 56))
                .foregroundStyle(.purple.opacity(0.6))
            Text("No prediction yet")
                .font(.title3.weight(.semibold))
            Text("Tap refresh to generate your first prediction. We'll analyse 90 days of biometric data to forecast your week ahead.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            Button {
                Task { await viewModel.refresh() }
            } label: {
                Label("Generate Prediction", systemImage: "sparkles")
                    .font(.body.weight(.semibold))
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(Color.purple)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
        .padding(.top, 60)
    }

    // MARK: - Error Banner

    private func errorBanner(message: String) -> some View {
        HStack(spacing: 10) {
            Image(systemName: "exclamationmark.circle.fill")
                .foregroundStyle(.red)
            Text(message)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    // MARK: - Helpers

    private func recoveryColor(text: String) -> Color {
        let lower = text.lowercased()
        if lower.contains("excellent") || lower.contains("optimal") || lower.contains("strong") {
            return .green
        }
        if lower.contains("poor") || lower.contains("fatigued") || lower.contains("low recovery") {
            return .red
        }
        return .yellow
    }
}

#Preview {
    NavigationStack {
        PredictionsView()
    }
}
