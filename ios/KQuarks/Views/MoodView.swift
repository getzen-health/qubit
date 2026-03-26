import SwiftUI

struct MoodView: View {
    @State private var selectedScore: Int = 5
    @State private var notes: String = ""
    @State private var isLoading: Bool = false
    @State private var message: String = ""
    @State private var recentLogs: [(score: Int, notes: String?, date: Date)] = []
    
    let moodEmojis = ["😔","😞","😕","😐","🙂","😊","😄","😁","🤩","🥳"]
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Mood selector
                    VStack(alignment: .leading, spacing: 12) {
                        Text("How are you feeling?")
                            .font(.headline)
                        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 5), spacing: 12) {
                            ForEach(1...10, id: \.self) { i in
                                Button {
                                    selectedScore = i
                                } label: {
                                    Text(moodEmojis[i - 1])
                                        .font(.title)
                                        .frame(width: 52, height: 52)
                                        .background(selectedScore == i ? Color.accentColor.opacity(0.2) : Color(.systemGray6))
                                        .cornerRadius(12)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 12)
                                                .stroke(selectedScore == i ? Color.accentColor : Color.clear, lineWidth: 2)
                                        )
                                }
                            }
                        }
                        Text("Score: \(moodEmojis[selectedScore - 1]) \(selectedScore)/10")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(16)
                    .shadow(color: .black.opacity(0.05), radius: 8)
                    
                    // Notes
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Notes (optional)")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        TextEditor(text: $notes)
                            .frame(height: 80)
                            .padding(8)
                            .background(Color(.systemGray6))
                            .cornerRadius(10)
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(16)
                    .shadow(color: .black.opacity(0.05), radius: 8)
                    
                    // Log button
                    Button {
                        Task { await logMood() }
                    } label: {
                        HStack {
                            if isLoading { ProgressView().tint(.white) }
                            Text(isLoading ? "Logging..." : "Log Mood")
                                .fontWeight(.semibold)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.accentColor)
                        .foregroundColor(.white)
                        .cornerRadius(14)
                    }
                    .disabled(isLoading)
                    
                    if !message.isEmpty {
                        Text(message)
                            .foregroundStyle(.green)
                            .font(.subheadline)
                    }
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Mood")
            .navigationBarTitleDisplayMode(.large)
        }
    }
    
    func logMood() async {
        isLoading = true
        defer { isLoading = false }
        
        let urlString = (Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String ?? "")
        guard !urlString.isEmpty, let url = URL(string: "\(urlString)/api/mood") else {
            message = "Configuration error"
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "score": selectedScore,
            "notes": notes.isEmpty ? NSNull() : notes as Any
        ]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        do {
            let (_, response) = try await URLSession.shared.data(for: request)
            if (response as? HTTPURLResponse)?.statusCode == 201 {
                message = "Mood logged! \(moodEmojis[selectedScore - 1])"
                notes = ""
                DispatchQueue.main.asyncAfter(deadline: .now() + 2) { self.message = "" }
            } else {
                message = "Failed to save mood"
            }
        } catch {
            message = "Network error"
        }
    }
    
    func loadRecentLogs() async {
        // TODO: Implement API call to fetch recent mood logs
    }
}

#Preview {
    MoodView()
}
