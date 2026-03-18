import SwiftUI

// MARK: - Model

struct DailyCheckin: Decodable, Equatable {
    let id: String
    let date: String
    let energy: Int?
    let mood: Int?
    let stress: Int?
    let notes: String?
}

// MARK: - ViewModel

@Observable
final class CheckinViewModel {
    var checkin: DailyCheckin?
    var isLoading = false
    var isSaving = false
    var savedAt: Date?

    var energy: Int? = nil
    var mood: Int?   = nil
    var stress: Int? = nil
    var notes        = ""

    var isEditing = false

    var hasFilledAny: Bool { energy != nil || mood != nil || stress != nil }

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            let result = try await SupabaseService.shared.fetchTodayCheckin()
            checkin = result
            if let c = result {
                energy = c.energy
                mood   = c.mood
                stress = c.stress
                notes  = c.notes ?? ""
            }
        } catch { }
    }

    func save() async {
        guard hasFilledAny else { return }
        isSaving = true
        defer { isSaving = false }
        do {
            try await SupabaseService.shared.logCheckin(
                energy: energy, mood: mood, stress: stress,
                notes: notes.isEmpty ? nil : notes
            )
            savedAt = Date()
            await load()
            isEditing = false
        } catch { }
    }

    func startEdit() {
        isEditing = true
    }

    func cancelEdit() {
        if let c = checkin {
            energy = c.energy
            mood   = c.mood
            stress = c.stress
            notes  = c.notes ?? ""
        }
        isEditing = false
    }
}

// MARK: - Emoji data

private let energyEmojis  = ["", "😴", "😑", "😐", "🙂", "😄"]
private let moodEmojis    = ["", "😞", "😕", "😐", "🙂", "😁"]
private let stressEmojis  = ["", "😌", "🙂", "😐", "😟", "😰"]
private let energyLabels  = ["", "Very Low", "Low", "Moderate", "Good", "Great"]
private let moodLabels    = ["", "Very Low", "Low", "Neutral", "Good", "Excellent"]
private let stressLabels  = ["", "None", "Mild", "Moderate", "High", "Very High"]

// MARK: - CheckinView

struct CheckinView: View {
    @State private var vm = CheckinViewModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    if vm.isLoading {
                        ProgressView()
                            .padding(.top, 60)
                    } else if let c = vm.checkin, !vm.isEditing {
                        completedCard(c)
                    } else {
                        formCard
                    }
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Daily Check-in")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    NavigationLink(destination: MoodHistoryView()) {
                        Image(systemName: "chart.line.uptrend.xyaxis")
                    }
                }
                if let c = vm.checkin, !vm.isEditing {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button {
                            vm.startEdit()
                        } label: {
                            Label("Edit", systemImage: "pencil")
                        }
                    }
                    let _ = c // suppress unused warning
                }
            }
            .task {
                await vm.load()
            }
        }
    }

    // MARK: Completed view

    @ViewBuilder
    private func completedCard(_ c: DailyCheckin) -> some View {
        VStack(spacing: 20) {
            // Header
            VStack(spacing: 4) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 48))
                    .foregroundStyle(.green)
                Text("Today's Check-in")
                    .font(.headline)
                    .foregroundStyle(.primary)
                Text(Date().formatted(date: .long, time: .omitted))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding(.top, 8)

            // Emoji summary
            HStack(spacing: 0) {
                ForEach([
                    ("Energy", c.energy, energyEmojis, Color.yellow),
                    ("Mood",   c.mood,   moodEmojis,   Color.blue),
                    ("Stress", c.stress, stressEmojis, Color.orange),
                ], id: \.0) { label, value, emojis, color in
                    VStack(spacing: 6) {
                        Text(emojis[value ?? 0].isEmpty ? "—" : emojis[value ?? 0])
                            .font(.system(size: 44))
                        Text(label)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                        if let v = value {
                            Text("\(v)/5")
                                .font(.caption.bold())
                                .foregroundStyle(color)
                        } else {
                            Text("—")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 16))

            if let notes = c.notes, !notes.isEmpty {
                HStack {
                    Image(systemName: "quote.bubble")
                        .foregroundStyle(.secondary)
                    Text(notes)
                        .font(.callout)
                        .foregroundStyle(.secondary)
                        .italic()
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
                .background(Color(.systemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
    }

    // MARK: Form

    private var formCard: some View {
        VStack(spacing: 24) {
            // Title
            VStack(spacing: 4) {
                Text(vm.isEditing ? "Update Today's Check-in" : "How are you feeling?")
                    .font(.headline)
                    .foregroundStyle(.primary)
                Text(Date().formatted(date: .long, time: .omitted))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding(.top, 4)
            .frame(maxWidth: .infinity, alignment: .center)

            VStack(spacing: 20) {
                EmojiSelectorView(
                    label: "Energy Level",
                    emojis: energyEmojis,
                    labelNames: energyLabels,
                    value: $vm.energy,
                    accent: .yellow
                )

                EmojiSelectorView(
                    label: "Mood",
                    emojis: moodEmojis,
                    labelNames: moodLabels,
                    value: $vm.mood,
                    accent: .blue
                )

                EmojiSelectorView(
                    label: "Stress Level",
                    emojis: stressEmojis,
                    labelNames: stressLabels,
                    value: $vm.stress,
                    accent: .orange
                )

                // Notes
                VStack(alignment: .leading, spacing: 8) {
                    Text("Notes (optional)")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(.primary)
                    TextField("How's your body feeling?", text: $vm.notes, axis: .vertical)
                        .lineLimit(3, reservesSpace: true)
                        .textFieldStyle(.roundedBorder)
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 16))

            // Save / Cancel
            VStack(spacing: 10) {
                Button {
                    Task { await vm.save() }
                } label: {
                    HStack {
                        if vm.isSaving {
                            ProgressView()
                                .tint(.white)
                        }
                        Text(vm.isSaving ? "Saving…" : vm.isEditing ? "Update Check-in" : "Save Check-in")
                            .font(.body.bold())
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(vm.hasFilledAny ? Color.accentColor : Color.secondary.opacity(0.3))
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                }
                .disabled(vm.isSaving || !vm.hasFilledAny)

                if vm.isEditing {
                    Button("Cancel") {
                        vm.cancelEdit()
                    }
                    .foregroundStyle(.secondary)
                }
            }
        }
    }
}

// MARK: - EmojiSelectorView

struct EmojiSelectorView: View {
    let label: String
    let emojis: [String]
    let labelNames: [String]
    @Binding var value: Int?
    let accent: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(label)
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(.primary)
                Spacer()
                if let v = value {
                    Text(labelNames[v])
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            HStack(spacing: 6) {
                ForEach(1...5, id: \.self) { v in
                    Button {
                        value = (value == v) ? nil : v
                    } label: {
                        Text(emojis[v])
                            .font(.system(size: 28))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(
                                value == v
                                    ? accent.opacity(0.2)
                                    : Color(.systemGroupedBackground)
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(value == v ? accent : Color.clear, lineWidth: 2)
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                            .scaleEffect(value == v ? 1.08 : 1.0)
                            .animation(.spring(duration: 0.2), value: value)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

// MARK: - Dashboard card

/// Compact check-in card for embedding in the dashboard.
struct CheckinDashboardCard: View {
    let checkin: DailyCheckin?
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                Image(systemName: checkin != nil ? "checkmark.circle.fill" : "checklist")
                    .font(.title3)
                    .foregroundStyle(checkin != nil ? .green : .accentColor)

                VStack(alignment: .leading, spacing: 2) {
                    Text("Daily Check-in")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(.primary)
                    if let c = checkin {
                        HStack(spacing: 4) {
                            if let e = c.energy  { Text(energyEmojis[e]) }
                            if let m = c.mood    { Text(moodEmojis[m]) }
                            if let s = c.stress  { Text(stressEmojis[s]) }
                        }
                        .font(.callout)
                    } else {
                        Text("Tap to log your mood & energy")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                Spacer()
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }
            .padding()
            .background(Color(.systemBackground))
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    CheckinView()
}
