import SwiftUI
import OSLog
#if os(iOS) && !targetEnvironment(macCatalyst)
import VisionKit
#endif
import AVFoundation

// MARK: - BarcodeScannerTab

struct BarcodeScannerTab: View {
    let service: FoodScannerService
    let onProductFound: (FoodProduct) -> Void

    @State private var manualBarcode = ""
    @State private var showManualEntry = false

    var body: some View {
        VStack(spacing: 0) {
#if os(iOS) && !targetEnvironment(macCatalyst)
            if DataScannerViewController.isSupported && DataScannerViewController.isAvailable {
                DataScannerView(onScan: handleBarcode)
                    .ignoresSafeArea(edges: .bottom)
                    .overlay(alignment: .bottom) { scanOverlay }
            } else {
                manualEntryFallback
            }
#else
            manualEntryFallback
#endif
        }
        .overlay {
            if service.isLoading {
                ZStack {
                    Color.black.opacity(0.4).ignoresSafeArea()
                    VStack(spacing: 12) {
                        ProgressView().tint(.white)
                        Text("Looking up product…").foregroundStyle(.white).font(.subheadline)
                    }
                    .padding(24)
                    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
                }
            }
        }
        .alert("Error", isPresented: Binding(
            get: { service.error != nil },
            set: { if !$0 { service.error = nil } }
        )) {
            Button("OK") { service.error = nil }
        } message: {
            Text(service.error ?? "")
        }
    }

    private var scanOverlay: some View {
        VStack(spacing: 16) {
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.white.opacity(0.8), lineWidth: 2)
                .frame(width: 250, height: 100)
                .overlay {
                    Text("Align barcode here")
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.8))
                        .offset(y: 60)
                }
            Button("Enter barcode manually") {
                showManualEntry = true
            }
            .font(.subheadline.weight(.medium))
            .foregroundStyle(.white)
            .padding(.horizontal, 20)
            .padding(.vertical, 10)
            .background(.ultraThinMaterial, in: Capsule())
        }
        .padding(.bottom, 60)
    }

    private var manualEntryFallback: some View {
        VStack(spacing: 28) {
            Spacer()
            Image(systemName: "barcode.viewfinder")
                .font(.system(size: 56, weight: .light))
                .foregroundStyle(.white.opacity(0.15))
            VStack(spacing: 6) {
                Text("Camera not available")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.7))
                Text("Enter a barcode to look up a food product")
                    .font(.system(size: 13))
                    .foregroundStyle(.white.opacity(0.35))
            }
            HStack(spacing: 10) {
                TextField("e.g. 049000006346", text: $manualBarcode)
                    .font(.system(size: 15))
                    .foregroundStyle(.white)
                    .padding(12)
                    .background(Color.cardSurface, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .stroke(Color.white.opacity(0.08), lineWidth: 1)
                    )
                    .keyboardType(.numberPad)
                Button {
                    guard !manualBarcode.trimmingCharacters(in: .whitespaces).isEmpty else { return }
                    handleBarcode(manualBarcode.trimmingCharacters(in: .whitespaces))
                } label: {
                    Text("Search")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 12)
                        .background(
                            LinearGradient(
                                colors: [.purple, .blue],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            in: RoundedRectangle(cornerRadius: 12, style: .continuous)
                        )
                }
            }
            .padding(.horizontal, 24)
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.premiumBackground)
    }

    private func handleBarcode(_ code: String) {
        Task {
            await service.fetchProduct(barcode: code)
            if let product = service.product {
                onProductFound(product)
            }
        }
    }
}

// MARK: - DataScannerView (iOS 16+, not macCatalyst)
#if os(iOS) && !targetEnvironment(macCatalyst)
@available(iOS 16, *)
struct DataScannerView: UIViewControllerRepresentable {
    let onScan: (String) -> Void

    func makeUIViewController(context: Context) -> DataScannerViewController {
        let vc = DataScannerViewController(
            recognizedDataTypes: [
                .barcode(symbologies: [.ean8, .ean13, .upce, .code128, .code39, .qr])
            ],
            qualityLevel: .balanced,
            recognizesMultipleItems: false,
            isHighFrameRateTrackingEnabled: false,
            isPinchToZoomEnabled: true,
            isGuidanceEnabled: true,
            isHighlightingEnabled: true
        )
        vc.delegate = context.coordinator
        return vc
    }

    func updateUIViewController(_ uiViewController: DataScannerViewController, context: Context) {
        do {
            try uiViewController.startScanning()
        } catch {
            Logger.sync.error("Barcode scanner failed to start: \(error.localizedDescription)")
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(onScan: onScan)
    }

    final class Coordinator: NSObject, DataScannerViewControllerDelegate {
        let onScan: (String) -> Void
        private var hasScanned = false

        init(onScan: @escaping (String) -> Void) { self.onScan = onScan }

        func dataScanner(_ dataScanner: DataScannerViewController, didAdd addedItems: [RecognizedItem], allItems: [RecognizedItem]) {
            guard !hasScanned else { return }
            if case let .barcode(barcode) = addedItems.first,
               let value = barcode.payloadStringValue, !value.isEmpty {
                hasScanned = true
                dataScanner.stopScanning()
                onScan(value)
                DispatchQueue.main.asyncAfter(deadline: .now() + 2) { [weak self] in
                    self?.hasScanned = false
                    do {
                        try dataScanner.startScanning()
                    } catch {
                        Logger.sync.error("Barcode scanner failed to restart: \(error.localizedDescription)")
                    }
                }
            }
        }
    }
}
#endif
