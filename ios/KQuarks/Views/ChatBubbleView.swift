import SwiftUI

struct ChatBubbleView: View {
    let message: ChatMessage

    private var isUser: Bool { message.role == .user }

    private static let timeFormatter: DateFormatter = {
        let f = DateFormatter()
        f.timeStyle = .short
        return f
    }()

    var body: some View {
        HStack(alignment: .bottom, spacing: 0) {
            if isUser { Spacer(minLength: 48) }

            VStack(alignment: isUser ? .trailing : .leading, spacing: 4) {
                Text(message.content)
                    .font(.body)
                    .foregroundStyle(isUser ? .white : .primary)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(
                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                            .fill(isUser ? Color.blue : Color.white.opacity(0.08))
                    )

                Text(Self.timeFormatter.string(from: message.timestamp))
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 4)
            }

            if !isUser { Spacer(minLength: 48) }
        }
    }
}

#Preview {
    VStack(spacing: 12) {
        ChatBubbleView(message: ChatMessage(role: .user, content: "Why is my HRV low this week?"))
        ChatBubbleView(message: ChatMessage(role: .assistant, content: "Your average HRV this week was 42 ms, down from 58 ms last week. This 28% drop likely reflects accumulated training stress — you logged 4 workouts in the last 5 days totaling 3.5 hours. I'd recommend an easy day today and prioritize 8+ hours of sleep tonight."))
    }
    .padding()
}
