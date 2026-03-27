import MetricKit
import OSLog

final class CrashReportingService: NSObject, MXMetricManagerSubscriber {
    static let shared = CrashReportingService()
    private let logger = Logger(subsystem: "com.qxlsz.kquarks", category: "CrashReporting")
    
    func start() {
        MXMetricManager.shared.add(self)
        logger.info("MetricKit crash reporting started")
    }
    
    func stop() {
        MXMetricManager.shared.remove(self)
    }
    
    // Called once per day with previous day's metrics
    func didReceive(_ payloads: [MXMetricPayload]) {
        for payload in payloads {
            logger.info("MetricKit metrics received: \(payload.dictionaryRepresentation())")
        }
    }
    
    // Called immediately when crash log is available
    func didReceive(_ payloads: [MXDiagnosticPayload]) {
        for payload in payloads {
            // Log crash details
            if let crashes = payload.crashDiagnostics {
                for crash in crashes {
                    logger.error("Crash detected: \(crash.callStackTree.jsonRepresentation())")
                    // Upload to Supabase for remote logging
                    Task { await uploadCrashReport(crash, timestamp: payload.timeStampEnd) }
                }
            }
            if let hangs = payload.hangDiagnostics {
                for hang in hangs {
                    logger.warning("Hang detected: duration=\(hang.hangDuration)")
                }
            }
        }
    }
    
    private func uploadCrashReport(_ crash: MXCrashDiagnostic, timestamp: Date) async {
        // Best-effort upload — don't crash the crash reporter
        guard let url = URL(string: ProcessInfo.processInfo.environment["SUPABASE_URL"] ?? "") else { return }
        var request = URLRequest(url: url.appendingPathComponent("/rest/v1/crash_reports"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body: [String: Any] = [
            "signal": crash.signal?.intValue ?? 0,
            "exception_type": crash.exceptionType?.intValue ?? 0,
            "termination_reason": crash.terminationReason ?? "",
            "os_version": crash.metaData.osVersion,
            "app_version": crash.metaData.applicationVersion,
            "timestamp": ISO8601DateFormatter().string(from: timestamp),
            "call_stack": crash.callStackTree.jsonRepresentation().prefix(10000)
        ]
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
            _ = try await URLSession.shared.data(for: request)
        } catch {
            NSLog("[KQuarks] Crash report send failed: %@", error.localizedDescription)
        }
    }
}
