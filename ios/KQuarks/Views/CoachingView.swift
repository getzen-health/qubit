import SwiftUI

struct CoachingView: View {
    @State private var messages: [(role: String, text: String)] = []
    @State private var input = ""

    var body: some View {
        NavigationStack {
            VStack {
                ScrollView {
                    ForEach(Array(messages.enumerated()), id: \.offset) { _, msg in
                        HStack {
                            if msg.role == "user" { Spacer() }
                            Text(msg.text)
                                .padding(10)
                                .background(msg.role == "user" ? Color.blue : Color.white.opacity(0.08))
                                .foregroundColor(msg.role == "user" ? .white : .primary)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                            if msg.role == "assistant" { Spacer() }
                        }
                        .padding(.horizontal)
                    }
                }
                HStack {
                    TextField("Ask your health coach...", text: $input)
                        .textFieldStyle(.roundedBorder)
                    Button("Send") {
                        messages.append((role: "user", text: input))
                        messages.append((role: "assistant", text: "Coming soon — AI coaching via Supabase edge function."))
                        input = ""
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding()
            }
            .navigationTitle("AI Coach")
        }
    }
}
