import SwiftUI

struct MoodView: View {
    @State private var selectedScore: Int = 5
    @State private var notes: String = ""
    @State private var isLoading: Bool = false
    @State private var message: String = ""
    @State private var recentLogs: [(score: Int, notes: String?, date: Date)] = []
    @State private var isLoadingLogs: Bool = false
    
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
                    
                    // Recent mood history
                    if !recentLogs.isEmpty {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Recent Moods")
                                .font(.headline)
                                .padding(.bottom, 2)
                            ForEach(Array(recentLogs.prefix(7).enumerated()), id: \.offset) { _, entry in
                                HStack {
                                    Text(moodEmojis[max(0, min(9, entry.score - 1))])
                                        .font(.title3)
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text("\(entry.score)/10")
                                            .font(.subheadline)
                                            .fontWeight(.medium)
                                        if let notes = entry.notes, !notes.isEmpty {
                                            Text(notes)
                                                .font(.caption)
                                                .foregroundStyle(.secondary)
                                                .lineLimit(1)
                                        }
                                    }
                                    Spacer()
                                    Text(entry.date.formatted(.relative(presentation: .named)))
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                .padding(.vertical, 4)
                                if entry.score != recentLogs.prefix(7).last?.score {
                                    Divider()
                                }
                            }
                        }
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(16)
                        .shadow(color: .black.opacity(0.05), radius: 8)
                    }
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Mood")
            .navigationBarTitleDisplayMode(.large)
            .task { await loadRecentLogs() }
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
                await loadRecentLogs()
            } else {
                message = "Failed to save mood"
            }
        } catch {
            message = "Network error"
        }
    }
    
    func loadRecentLogs() async {
        let urlString = (Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String ?? "")
        guard !urlString.isEmpty, let url = URL(string: "\(urlString)/api/mood") else { return }
        
        isLoadingLogs = true
        defer { isLoadingLogs = false }
        
        do {
            let (data, response) = try await URLSession.shared.data(from: url)
            guard (response as? HTTPURLResponse)?.statusCode == 200 else { return }
            
            if let json = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] {
                let formatter = ISO8601DateFormatter()
                formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
                let logs: [(score: Int, notes: String?, date: Date)] = json.compactMap { entry in
                    guard let loggedAt = entry["logged_at"] as? String,
                          let date = formatter.date(from: loggedAt) else { return nil }
                    // Map valence (-5..5) back to score (1-10)
                    let valence = entry["valence"] as? Int ?? 0
                    let score = Int(((Double(valence) + 5.0) * 9.0 / 10.0).rounded()) + 1
                    let notes = entry["notes"] as? String
                    return (score: max(1, min(10, score)), notes: notes, date: date)
                }
                recentLogs = logs
            }
        } catch { }
    }
}

#Preview {
    MoodView()
}
