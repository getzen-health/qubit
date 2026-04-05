import Foundation
import os

// Sentry iOS integration stub
// TODO: Add https://github.com/getsentry/sentry-cocoa via SPM (version ~> 8.0), then replace stub
enum SentryService {
    static func start(dsn: String) {
        // SentrySDK.start { options in
        //   options.dsn = dsn
        //   options.tracesSampleRate = 0.1
        // }
        Logger.general.debug("[SentryService] stub — add sentry-cocoa SPM package and uncomment")
    }

    static func capture(_ error: Error) {
        // SentrySDK.capture(error: error)
    }
}
