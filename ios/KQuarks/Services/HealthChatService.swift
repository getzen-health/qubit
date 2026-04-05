import Foundation
import os

@Observable
class HealthChatService {
    static let shared = HealthChatService()

    var messages: [ChatMessage] = []
    var isStreaming = false
    var error: String?

    private let supabase = SupabaseService.shared

    // MARK: - Supabase row type for persistence

    private struct ChatMessageRow: Encodable {
        let userId: String
        let role: String
        let content: String
        enum CodingKeys: String, CodingKey {
            case userId = "user_id"
            case role
            case content
        }
    }

    private struct ChatMessageFetchRow: Decodable {
        let id: String
        let role: String
        let content: String
        let createdAt: String
        enum CodingKeys: String, CodingKey {
            case id
            case role
            case content
            case createdAt = "created_at"
        }
    }

    // MARK: - Edge Function request/response types

    private struct ChatRequest: Encodable {
        let message: String
        let history: [HistoryMessage]
        let userId: String
        enum CodingKeys: String, CodingKey {
            case message
            case history
            case userId = "user_id"
        }
    }

    private struct HistoryMessage: Encodable {
        let role: String
        let content: String
    }

    private struct ChatResponse: Decodable {
        let response: String
    }

    // MARK: - Send message

    func sendMessage(_ text: String) async {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        error = nil
        isStreaming = true

        let userMessage = ChatMessage(role: .user, content: trimmed)
        messages.append(userMessage)

        // Build history excluding the message we just appended (last element)
        let historyForRequest = messages.dropLast().map {
            HistoryMessage(role: $0.role.rawValue, content: $0.content)
        }

        do {
            // Resolve Supabase base URL from the client
            let supabaseURLString = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String ?? ""
            guard !supabaseURLString.isEmpty else {
                throw URLError(.badURL)
            }
            let userId = supabase.currentSession?.user.id.uuidString ?? ""

            guard let functionURL = URL(string: "\(supabaseURLString)/functions/v1/health-chat") else {
                throw URLError(.badURL)
            }

            // Build auth header using the current session token
            let accessToken = supabase.currentSession?.accessToken ?? ""
            let anonKey = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String ?? ""
            guard !anonKey.isEmpty else {
                throw URLError(.userAuthenticationRequired)
            }

            let requestBody = ChatRequest(
                message: trimmed,
                history: historyForRequest,
                userId: userId
            )

            let encoder = JSONEncoder()
            let bodyData = try encoder.encode(requestBody)

            var request = URLRequest(url: functionURL)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.setValue("Bearer \(accessToken.isEmpty ? anonKey : accessToken)", forHTTPHeaderField: "Authorization")
            request.setValue(anonKey, forHTTPHeaderField: "apikey")
            request.httpBody = bodyData

            let (data, response) = try await URLSession.shared.data(for: request)

            if let httpResponse = response as? HTTPURLResponse, !(200...299).contains(httpResponse.statusCode) {
                let body = String(data: data, encoding: .utf8) ?? "unknown error"
                throw NSError(
                    domain: "HealthChatService",
                    code: httpResponse.statusCode,
                    userInfo: [NSLocalizedDescriptionKey: body]
                )
            }

            let decoder = JSONDecoder()
            let chatResponse = try decoder.decode(ChatResponse.self, from: data)

            let assistantMessage = ChatMessage(role: .assistant, content: chatResponse.response)
            messages.append(assistantMessage)

            // Persist both messages to Supabase
            await savePair(userMessage: userMessage, assistantMessage: assistantMessage, userId: userId)

        } catch {
            self.error = error.localizedDescription
            // Remove the user message on failure so the user can retry
            messages.removeLast()
        }

        isStreaming = false
    }

    // MARK: - Load history

    func loadHistory() async {
        guard let userId = supabase.currentSession?.user.id else { return }

        do {
            let rows: [ChatMessageFetchRow] = try await supabase.client
                .from("chat_messages")
                .select("id,role,content,created_at")
                .eq("user_id", value: userId.uuidString)
                .order("created_at", ascending: true)
                .limit(100)
                .execute()
                .value

            let dateFormatter = ISO8601DateFormatter()
            dateFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

            let fallbackFormatter = ISO8601DateFormatter()

            messages = rows.compactMap { row in
                guard let role = ChatMessage.ChatRole(rawValue: row.role) else { return nil }
                let timestamp = dateFormatter.date(from: row.createdAt)
                    ?? fallbackFormatter.date(from: row.createdAt)
                    ?? Date()
                return ChatMessage(
                    id: UUID(uuidString: row.id) ?? UUID(),
                    role: role,
                    content: row.content,
                    timestamp: timestamp
                )
            }
        } catch {
            self.error = error.localizedDescription
        }
    }

    // MARK: - Clear history

    func clearHistory() async {
        guard let userId = supabase.currentSession?.user.id else { return }

        do {
            try await supabase.client
                .from("chat_messages")
                .delete()
                .eq("user_id", value: userId.uuidString)
                .execute()

            messages = []
            error = nil
        } catch {
            self.error = error.localizedDescription
        }
    }

    // MARK: - Private helpers

    private func savePair(userMessage: ChatMessage, assistantMessage: ChatMessage, userId: String) async {
        guard !userId.isEmpty else { return }

        let rows = [
            ChatMessageRow(userId: userId, role: userMessage.role.rawValue, content: userMessage.content),
            ChatMessageRow(userId: userId, role: assistantMessage.role.rawValue, content: assistantMessage.content),
        ]

        do {
            try await supabase.client
                .from("chat_messages")
                .insert(rows)
                .execute()
        } catch {
            Logger.general.debug("[HealthChatService] Failed to persist messages: \(error)")
        }
    }
}

// MARK: - Memberwise init extension for history loading

extension ChatMessage {
    init(id: UUID, role: ChatRole, content: String, timestamp: Date) {
        self.id = id
        self.role = role
        self.content = content
        self.timestamp = timestamp
    }
}
