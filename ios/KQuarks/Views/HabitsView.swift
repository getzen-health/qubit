import SwiftUI

// MARK: - Models

struct Habit: Decodable, Identifiable {
    let id: String
    let name: String
    let emoji: String
    let target_days: [String]
    let sort_order: Int
    let created_at: String
}

struct HabitCompletion: Decodable {
    let habit_id: String
    let date: String
}

// MARK: - ViewModel

@Observable
final class HabitsViewModel {
    var habits: [Habit] = []
    var completions: [HabitCompletion] = []
    var isLoading = false
    var isAdding = false

    private let dowLabels = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
    private static let dateFmt: DateFormatter = {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; return f
    }()

    var todayDow: String {
        let idx = Calendar.current.component(.weekday, from: Date()) - 1
        return dowLabels[idx]
    }

    var todayStr: String { Self.dateFmt.string(from: Date()) }

    var todayHabits: [Habit] {
        habits.filter { $0.target_days.contains(todayDow) }
    }

    var todayDoneCount: Int {
        todayHabits.filter { h in completions.contains { $0.habit_id == h.id && $0.date == todayStr } }.count
    }

    func isCompleted(_ habit: Habit, on date: String) -> Bool {
        completions.contains { $0.habit_id == habit.id && $0.date == date }
    }

    func streak(for habitId: String) -> Int {
        let dates = Set(completions.filter { $0.habit_id == habitId }.map { $0.date })
        let df = Self.dateFmt
        let cal = Calendar.current
        var streak = 0
        for i in 0..<90 {
            let d = cal.date(byAdding: .day, value: -i, to: Date()) ?? Date()
            let ds = df.string(from: d)
            if dates.contains(ds) {
                streak += 1
            } else if i > 0 {
                break
            }
        }
        return streak
    }

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            guard let session = SupabaseService.shared.currentSession else { return }
            let (h, c) = try await SupabaseService.shared.fetchHabits(userId: session.user.id.uuidString)
            habits = h
            completions = c
        } catch {
            print("[HabitsView] load failed: \(error)")
        }
    }

    func toggle(_ habit: Habit) async {
        let today = todayStr
        let alreadyDone = isCompleted(habit, on: today)
        // Optimistic update
        if alreadyDone {
            completions.removeAll { $0.habit_id == habit.id && $0.date == today }
        } else {
            completions.append(HabitCompletion(habit_id: habit.id, date: today))
        }
        do {
            try await SupabaseService.shared.toggleHabit(habitId: habit.id, date: today, completed: !alreadyDone)
        } catch {
            // Revert on failure
            if alreadyDone {
                completions.append(HabitCompletion(habit_id: habit.id, date: today))
            } else {
                completions.removeAll { $0.habit_id == habit.id && $0.date == today }
            }
        }
    }

    func addHabit(name: String, emoji: String) async {
        isAdding = true
        defer { isAdding = false }
        do {
            try await SupabaseService.shared.createHabit(name: name, emoji: emoji)
            await load()
        } catch {
            print("[HabitsView] addHabit failed: \(error)")
        }
    }

    func archiveHabit(_ habit: Habit) async {
        habits.removeAll { $0.id == habit.id }
        try? await SupabaseService.shared.archiveHabit(habitId: habit.id)
    }

    func moveHabits(from source: IndexSet, to destination: Int) {
        habits.move(fromOffsets: source, toOffset: destination)
        let ids = habits.map(\.id)
        Task { try? await SupabaseService.shared.reorderHabits(ids) }
    }
}

// MARK: - HabitsView

struct HabitsView: View {
    @State private var vm = HabitsViewModel()
    @State private var showAdd = false
    @State private var newName = ""
    @State private var newEmoji = "✅"
    @State private var editMode: EditMode = .inactive

    private let emojiPresets = ["✅", "💧", "🏃", "📚", "🧘", "🥗", "😴", "💊", "🚶", "✍️", "💪", "☀️", "🍎", "🎯", "🌿"]

    var body: some View {
        NavigationStack {
            Group {
                if vm.isLoading && vm.habits.isEmpty {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if vm.habits.isEmpty {
                    emptyState
                } else {
                    habitsList
                }
            }
            .navigationTitle("Habits")
            .environment(\.editMode, $editMode)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    if !vm.habits.isEmpty {
                        Button(editMode == .active ? "Done" : "Edit") {
                            editMode = editMode == .active ? .inactive : .active
                        }
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showAdd = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showAdd) {
                addHabitSheet
            }
            .task { await vm.load() }
            .refreshable { await vm.load() }
        }
    }

    // MARK: Habits List

    private var habitsList: some View {
        List {
            // Progress header
            Section {
                VStack(spacing: 10) {
                    HStack {
                        Text("Today's Progress")
                            .font(.subheadline.weight(.medium))
                        Spacer()
                        Text("\(vm.todayDoneCount) / \(vm.todayHabits.count)")
                            .font(.subheadline.bold())
                            .foregroundStyle(.secondary)
                    }
                    ProgressView(value: vm.todayHabits.isEmpty ? 0 : Double(vm.todayDoneCount) / Double(vm.todayHabits.count))
                        .tint(vm.todayDoneCount == vm.todayHabits.count && !vm.todayHabits.isEmpty ? .green : .accentColor)

                    if vm.todayDoneCount == vm.todayHabits.count && !vm.todayHabits.isEmpty {
                        Label("All habits done! Great work 🎉", systemImage: "checkmark.circle.fill")
                            .font(.caption.weight(.medium))
                            .foregroundStyle(.green)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
            }

            // Today's habits
            if !vm.todayHabits.isEmpty {
                Section("Today") {
                    ForEach(vm.habits.filter { $0.target_days.contains(vm.todayDow) }) { habit in
                        HabitRow(
                            habit: habit,
                            done: vm.isCompleted(habit, on: vm.todayStr),
                            streak: vm.streak(for: habit.id),
                            onTap: { Task { await vm.toggle(habit) } }
                        )
                        .swipeActions(edge: .trailing) {
                            Button(role: .destructive) {
                                Task { await vm.archiveHabit(habit) }
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                    }
                    .onMove { vm.moveHabits(from: $0, to: $1) }
                }
            }

            // All habits (if some aren't today's)
            let otherHabits = vm.habits.filter { !vm.todayHabits.map(\.id).contains($0.id) }
            if !otherHabits.isEmpty {
                Section("Not scheduled today") {
                    ForEach(otherHabits) { habit in
                        HStack(spacing: 12) {
                            Text(habit.emoji).font(.title3)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(habit.name)
                                    .font(.body)
                                    .foregroundStyle(.secondary)
                                Text(habit.target_days.joined(separator: ", "))
                                    .font(.caption)
                                    .foregroundStyle(.tertiary)
                            }
                        }
                        .swipeActions(edge: .trailing) {
                            Button(role: .destructive) {
                                Task { await vm.archiveHabit(habit) }
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
    }

    // MARK: Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "checklist")
                .font(.system(size: 60))
                .foregroundStyle(.secondary)
            Text("No Habits Yet")
                .font(.title3.bold())
            Text("Build daily routines that stick. Tap + to create your first habit.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
            Button {
                showAdd = true
            } label: {
                Label("Add Habit", systemImage: "plus")
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
            }
            .buttonStyle(.borderedProminent)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemGroupedBackground))
    }

    // MARK: Add Habit Sheet

    private var addHabitSheet: some View {
        NavigationStack {
            Form {
                Section("Icon") {
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 5), spacing: 12) {
                        ForEach(emojiPresets, id: \.self) { e in
                            Button {
                                newEmoji = e
                            } label: {
                                Text(e)
                                    .font(.title2)
                                    .frame(maxWidth: .infinity)
                                    .padding(8)
                                    .background(newEmoji == e ? Color.accentColor.opacity(0.15) : Color.clear)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 8)
                                            .stroke(newEmoji == e ? Color.accentColor : Color.clear, lineWidth: 2)
                                    )
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.vertical, 4)
                }

                Section("Name") {
                    TextField("e.g. Drink 8 glasses of water", text: $newName)
                }
            }
            .navigationTitle("New Habit")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        showAdd = false
                        newName = ""
                        newEmoji = "✅"
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        let name = newName
                        let emoji = newEmoji
                        showAdd = false
                        newName = ""
                        newEmoji = "✅"
                        Task { await vm.addHabit(name: name, emoji: emoji) }
                    }
                    .disabled(newName.trimmingCharacters(in: .whitespaces).isEmpty || vm.isAdding)
                }
            }
        }
        .presentationDetents([.medium])
    }
}

// MARK: - HabitRow

struct HabitRow: View {
    let habit: Habit
    let done: Bool
    let streak: Int
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                Image(systemName: done ? "checkmark.circle.fill" : "circle")
                    .font(.title3)
                    .foregroundStyle(done ? .green : .secondary)
                    .contentTransition(.symbolEffect(.replace))

                Text(habit.emoji).font(.title3)

                VStack(alignment: .leading, spacing: 2) {
                    Text(habit.name)
                        .font(.body)
                        .foregroundStyle(done ? .secondary : .primary)
                        .strikethrough(done)

                    if streak > 1 {
                        Label("\(streak)-day streak", systemImage: "flame.fill")
                            .font(.caption)
                            .foregroundStyle(.orange)
                    }
                }
                Spacer()
            }
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    HabitsView()
}
