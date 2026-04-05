import SwiftUI

struct HealthChatView: View {
    @State private var service = HealthChatService.shared
    @State private var inputText = ""
    @FocusState private var isInputFocused: Bool

    private let suggestedQuestions = [
        "Why is my HRV low this week?",
        "Am I overtraining?",
        "When should I do my next hard workout?",
        "How's my sleep quality?",
    ]

    var body: some View {
        VStack(spacing: 0) {
            if service.messages.isEmpty {
                emptyStateView
            } else {
                messageListView
            }

            Divider()
            inputBar
        }
        .navigationTitle("Health Coach")
        .toolbarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                if AIProviderManager.shared.effectiveProvider == .onDevice {
                    Label("On-Device", systemImage: "lock.shield")
                        .font(.caption2)
                        .foregroundStyle(.green)
                }
            }
            ToolbarItem(placement: .confirmationAction) {
                if !service.messages.isEmpty {
                    Button("Clear") {
                        Task { await service.clearHistory() }
                    }
                    .foregroundStyle(.red)
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
        .task { await service.loadHistory() }
        .refreshable { await service.loadHistory() }
    }

    // MARK: - Empty state with suggested questions

    private var emptyStateView: some View {
        ScrollView {
            VStack(spacing: 24) {
                Spacer(minLength: 40)

                VStack(spacing: 8) {
                    Image(systemName: "heart.text.square.fill")
                        .font(.system(size: 52))
                        .foregroundStyle(.blue)

                    Text("Health Coach")
                        .font(.title2.bold())

                    Text("Ask questions about your health data. I have access to your last 30 days of metrics.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                }

                VStack(alignment: .leading, spacing: 10) {
                    Text("Suggested questions")
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .padding(.horizontal, 20)

                    ForEach(suggestedQuestions, id: \.self) { question in
                        Button {
                            sendMessage(question)
                        } label: {
                            HStack {
                                Text(question)
                                    .font(.subheadline)
                                    .foregroundStyle(.primary)
                                    .multilineTextAlignment(.leading)
                                Spacer()
                                Image(systemName: "arrow.up.circle.fill")
                                    .foregroundStyle(.blue)
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 12)
                            .background(Color.cardSurface)
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                            .padding(.horizontal, 16)
                        }
                    }
                }

                Spacer(minLength: 24)
            }
        }
    }

    // MARK: - Message list

    private var messageListView: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(service.messages) { message in
                        ChatBubbleView(message: message)
                            .padding(.horizontal, 12)
                            .id(message.id)
                    }

                    if service.isStreaming {
                        HStack(alignment: .bottom, spacing: 0) {
                            HStack(spacing: 6) {
                                ProgressView()
                                    .scaleEffect(0.8)
                                Text("Thinking…")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                            .padding(.horizontal, 14)
                            .padding(.vertical, 10)
                            .background(
                                RoundedRectangle(cornerRadius: 18, style: .continuous)
                                    .fill(Color.white.opacity(0.08))
                            )
                            Spacer(minLength: 48)
                        }
                        .padding(.horizontal, 12)
                        .id("typing-indicator")
                    }
                }
                .padding(.top, 12)
                .padding(.bottom, 8)
            }
            .onChange(of: service.messages.count) { _, _ in
                scrollToBottom(proxy: proxy)
            }
            .onChange(of: service.isStreaming) { _, newValue in
                if newValue {
                    withAnimation { proxy.scrollTo("typing-indicator", anchor: .bottom) }
                }
            }
        }
    }

    // MARK: - Input bar

    private var inputBar: some View {
        HStack(alignment: .bottom, spacing: 8) {
            TextField("Message", text: $inputText, axis: .vertical)
                .lineLimit(1...5)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color.cardSurface)
                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                .focused($isInputFocused)
                .disabled(service.isStreaming)
                .onSubmit {
                    if !service.isStreaming { sendCurrentInput() }
                }

            Button {
                sendCurrentInput()
            } label: {
                Image(systemName: "arrow.up.circle.fill")
                    .font(.system(size: 32))
                    .foregroundStyle(canSend ? .blue : .gray)
            }
            .disabled(!canSend)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(Color.premiumBackground)
    }

    // MARK: - Helpers

    private var canSend: Bool {
        !service.isStreaming && !inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private func sendCurrentInput() {
        let text = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        inputText = ""
        sendMessage(text)
    }

    private func sendMessage(_ text: String) {
        Task { await service.sendMessage(text) }
    }

    private func scrollToBottom(proxy: ScrollViewProxy) {
        guard let last = service.messages.last else { return }
        withAnimation { proxy.scrollTo(last.id, anchor: .bottom) }
    }
}

#Preview {
    NavigationStack {
        HealthChatView()
    }
}
