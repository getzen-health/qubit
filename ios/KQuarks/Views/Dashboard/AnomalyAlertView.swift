import SwiftUI

struct AnomalyAlertView: View {
    var body: some View {
        List {
            ContentUnavailableView("No Anomalies", systemImage: "checkmark.shield", description: Text("Health anomaly detection will appear here."))
        }
        .navigationTitle("Health Alerts")
        .navigationBarTitleDisplayMode(.inline)
    }
}
