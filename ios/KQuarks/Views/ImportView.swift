import SwiftUI

struct ImportView: View {
    var body: some View {
        NavigationStack {
            List {
                Section("Import Sources") {
                    Label("Garmin Connect", systemImage: "figure.run.circle")
                    Label("Oura Ring", systemImage: "moon.circle")
                }
                Section {
                    Text("To import data, visit kquarks.app/import on your computer and upload your export files.")
                        .font(.callout)
                        .foregroundColor(.secondary)
                }
                Section {
                    Link("Open Import Page", destination: URL(string: "https://kquarks.app/import")!)
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Import Data")
        }
    }
}

#Preview {
    ImportView()
}
