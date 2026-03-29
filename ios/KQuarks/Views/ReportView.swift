import SwiftUI

struct ReportView: View {
    @State private var isGenerating = false
    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Image(systemName: "doc.text.magnifyingglass")
                    .font(.system(size: 64))
                    .foregroundColor(.blue)
                Text("Health Report").font(.title2.bold())
                Text("Generate a PDF summary of your health trends to share with your doctor.")
                    .multilineTextAlignment(.center)
                    .foregroundColor(.secondary)
                    .padding(.horizontal)
                Button(action: { isGenerating = true }) {
                    Label(isGenerating ? "Generating..." : "Generate PDF Report", systemImage: "arrow.down.doc")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .padding(.horizontal)
                .disabled(isGenerating)
                if isGenerating {
                    Text("Open kquarks.app/report in Safari to download your PDF")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .onAppear { DispatchQueue.main.asyncAfter(deadline: .now() + 2) { isGenerating = false } }
                }
            }
            .padding()
            .navigationTitle("Doctor Report")
        }
    }
}

#Preview {
    ReportView()
}
