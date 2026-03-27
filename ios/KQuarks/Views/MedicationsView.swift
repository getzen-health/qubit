import SwiftUI

// MARK: - Models

struct Medication: Identifiable, Codable, Equatable {
    var id: String
    var user_id: String
    var name: String
    var dosage: Double
    var unit: String
    var frequency: String
    var time_of_day: [String]
    var start_date: String
    var end_date: String?
    var notes: String?
    var active: Bool
    var created_at: String?
    var updated_at: String?

    static func == (lhs: Medication, rhs: Medication) -> Bool { lhs.id == rhs.id }
}

struct MedicationLog: Identifiable, Codable, Equatable {
    var id: String
    var user_id: String
    var medication_id: String
    var taken_at: String
    var skipped: Bool
    var notes: String?
    var created_at: String?
    var updated_at: String?
}

// MARK: - Enums

enum TimeOfDay: String, CaseIterable {
    case morning   = "morning"
    case afternoon = "afternoon"
    case evening   = "evening"
    case night     = "night"

    var displayName: String {
        switch self {
        case .morning:   return "Morning"
        case .afternoon: return "Afternoon"
        case .evening:   return "Evening"
        case .night:     return "Night"
        }
    }

    var icon: String {
        switch self {
        case .morning:   return "sun.horizon.fill"
        case .afternoon: return "sun.max.fill"
        case .evening:   return "sunset.fill"
        case .night:     return "moon.stars.fill"
        }
    }

    var color: Color {
        switch self {
        case .morning:   return .orange
        case .afternoon: return .yellow
        case .evening:   return .pink
        case .night:     return .indigo
        }
    }
}

enum MedFrequency: String, CaseIterable {
    case once_daily        = "once_daily"
    case twice_daily       = "twice_daily"
    case three_times_daily = "three_times_daily"
    case as_needed         = "as_needed"
    case weekly            = "weekly"

    var displayName: String {
        switch self {
        case .once_daily:        return "Once daily"
        case .twice_daily:       return "Twice daily"
        case .three_times_daily: return "3× daily"
        case .as_needed:         return "As needed"
        case .weekly:            return "Weekly"
        }
    }
}

// MARK: - ViewModel

@Observable
class MedicationsViewModel {
    var medications: [Medication] = []
    var todayLogs: [MedicationLog] = []
    var isLoading = true
    var errorMessage: String?

    private let supabase = SupabaseService.shared
    private var dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()
    private var isoFormatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    var todayString: String { dateFormatter.string(from: Date()) }

    var activeMedications: [Medication] {
        medications.filter { $0.active }
    }

    var medicationsDueToday: [(medication: Medication, log: MedicationLog?)] {
        activeMedications.compactMap { med in
            guard isScheduledToday(med) else { return nil }
            let log = todayLogs.first { $0.medication_id == med.id }
            return (med, log)
        }
    }

    func medicationsForTimeOfDay(_ time: TimeOfDay) -> [Medication] {
        activeMedications.filter { $0.time_of_day.contains(time.rawValue) }
    }

    // MARK: - Load

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            guard let userId = supabase.currentUser?.id.uuidString else { return }

            struct MedRow: Codable {
                var id: String; var user_id: String; var name: String
                var dosage: Double; var unit: String; var frequency: String
                var time_of_day: [String]; var start_date: String
                var end_date: String?; var notes: String?; var active: Bool
                var created_at: String?; var updated_at: String?
            }
            struct LogRow: Codable {
                var id: String; var user_id: String; var medication_id: String
                var taken_at: String; var skipped: Bool; var notes: String?
                var created_at: String?; var updated_at: String?
            }

            let meds: [MedRow] = try await supabase.client
                .from("medications")
                .select()
                .eq("user_id", value: userId)
                .order("created_at", ascending: true)
                .execute()
                .value

            medications = meds.map {
                Medication(id: $0.id, user_id: $0.user_id, name: $0.name,
                           dosage: $0.dosage, unit: $0.unit, frequency: $0.frequency,
                           time_of_day: $0.time_of_day, start_date: $0.start_date,
                           end_date: $0.end_date, notes: $0.notes, active: $0.active,
                           created_at: $0.created_at, updated_at: $0.updated_at)
            }

            // Fetch today's logs
            let todayStart = todayString + "T00:00:00.000Z"
            let todayEnd   = todayString + "T23:59:59.999Z"
            let logs: [LogRow] = try await supabase.client
                .from("medication_logs")
                .select()
                .eq("user_id", value: userId)
                .gte("taken_at", value: todayStart)
                .lte("taken_at", value: todayEnd)
                .execute()
                .value

            todayLogs = logs.map {
                MedicationLog(id: $0.id, user_id: $0.user_id,
                              medication_id: $0.medication_id, taken_at: $0.taken_at,
                              skipped: $0.skipped, notes: $0.notes,
                              created_at: $0.created_at, updated_at: $0.updated_at)
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - Save / Delete Medication

    func save(medication: MedicationFormData, editing id: String?) async {
        guard let userId = supabase.currentUser?.id.uuidString else { return }
        do {
            struct Payload: Encodable {
                var user_id, name, unit, frequency, start_date: String
                var dosage: Double
                var time_of_day: [String]
                var end_date: String?
                var notes: String?
                var active: Bool
            }
            let payload = Payload(
                user_id: userId,
                name: medication.name,
                unit: medication.unit,
                frequency: medication.frequency,
                start_date: medication.startDate,
                dosage: medication.dosage,
                time_of_day: medication.timesOfDay,
                end_date: medication.endDate.isEmpty ? nil : medication.endDate,
                notes: medication.notes.isEmpty ? nil : medication.notes,
                active: medication.active
            )
            if let id {
                try await supabase.client
                    .from("medications")
                    .update(payload)
                    .eq("id", value: id)
                    .execute()
            } else {
                try await supabase.client
                    .from("medications")
                    .insert(payload)
                    .execute()
            }
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func delete(medication: Medication) async {
        do {
            try await supabase.client
                .from("medications")
                .delete()
                .eq("id", value: medication.id)
                .execute()
            medications.removeAll { $0.id == medication.id }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func toggleActive(medication: Medication) async {
        do {
            struct Patch: Encodable { var active: Bool }
            try await supabase.client
                .from("medications")
                .update(Patch(active: !medication.active))
                .eq("id", value: medication.id)
                .execute()
            if let idx = medications.firstIndex(of: medication) {
                medications[idx].active.toggle()
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - Log Actions

    func markTaken(medication: Medication) async {
        await logDose(medication: medication, skipped: false)
    }

    func markSkipped(medication: Medication) async {
        await logDose(medication: medication, skipped: true)
    }

    func undoLog(medication: Medication) async {
        guard let log = todayLogs.first(where: { $0.medication_id == medication.id }) else { return }
        do {
            try await supabase.client
                .from("medication_logs")
                .delete()
                .eq("id", value: log.id)
                .execute()
            todayLogs.removeAll { $0.id == log.id }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func logDose(medication: Medication, skipped: Bool) async {
        guard let userId = supabase.currentUser?.id.uuidString else { return }
        // Remove any existing log for this medication today first
        if let existing = todayLogs.first(where: { $0.medication_id == medication.id }) {
            try? await supabase.client
                .from("medication_logs")
                .delete()
                .eq("id", value: existing.id)
                .execute()
            todayLogs.removeAll { $0.id == existing.id }
        }
        do {
            struct LogInsert: Encodable {
                var user_id, medication_id, taken_at: String
                var skipped: Bool
            }
            let now = ISO8601DateFormatter().string(from: Date())
            let insert = LogInsert(user_id: userId, medication_id: medication.id,
                                   taken_at: now, skipped: skipped)
            struct LogRow: Decodable {
                var id: String; var user_id: String; var medication_id: String
                var taken_at: String; var skipped: Bool; var notes: String?
                var created_at: String?; var updated_at: String?
            }
            let rows: [LogRow] = try await supabase.client
                .from("medication_logs")
                .insert(insert)
                .select()
                .execute()
                .value
            if let row = rows.first {
                let newLog = MedicationLog(id: row.id, user_id: row.user_id,
                                           medication_id: row.medication_id,
                                           taken_at: row.taken_at, skipped: row.skipped,
                                           notes: row.notes, created_at: row.created_at,
                                           updated_at: row.updated_at)
                todayLogs.append(newLog)
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - Helpers

    private func isScheduledToday(_ med: Medication) -> Bool {
        let today = Date()
        let df = dateFormatter
        guard let start = df.date(from: med.start_date) else { return false }
        if start > today { return false }
        if let endStr = med.end_date, let end = df.date(from: endStr), end < today { return false }
        return true
    }

    func adherenceRate(for med: Medication) -> Double? {
        guard let start = dateFormatter.date(from: med.start_date) else { return nil }
        let days = max(1, Calendar.current.dateComponents([.day], from: start, to: Date()).day ?? 1)
        guard days > 0 else { return nil }
        // Simplified: based on today's logs only (a real impl would query full log history)
        let logged = todayLogs.filter { $0.medication_id == med.id && !$0.skipped }.count
        return Double(logged) / Double(days) * 100
    }
}

// MARK: - Form Data

struct MedicationFormData {
    var name: String = ""
    var dosage: Double = 0
    var unit: String = "mg"
    var frequency: String = MedFrequency.once_daily.rawValue
    var timesOfDay: [String] = ["morning"]
    var startDate: String = DateFormatter().apply { $0.dateFormat = "yyyy-MM-dd" }.string(from: Date())
    var endDate: String = ""
    var notes: String = ""
    var active: Bool = true

    static func from(_ med: Medication) -> MedicationFormData {
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
        return MedicationFormData(
            name: med.name, dosage: med.dosage, unit: med.unit,
            frequency: med.frequency, timesOfDay: med.time_of_day,
            startDate: med.start_date, endDate: med.end_date ?? "",
            notes: med.notes ?? "", active: med.active
        )
    }

    var isValid: Bool { !name.trimmingCharacters(in: .whitespaces).isEmpty && dosage > 0 }
}

private extension DateFormatter {
    func apply(_ configure: (DateFormatter) -> Void) -> DateFormatter {
        configure(self); return self
    }
}

// MARK: - Main View

struct MedicationsView: View {
    @State private var vm = MedicationsViewModel()
    @State private var showAddSheet = false
    @State private var editingMedication: Medication?

    var body: some View {
        NavigationStack {
            Group {
                if vm.isLoading && vm.medications.isEmpty {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if vm.medications.isEmpty {
                    emptyState
                } else {
                    medicationsList
                }
            }
            .navigationTitle("Medications")
            .toolbarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button { showAddSheet = true } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .task { await vm.load() }
            .refreshable { await vm.load() }
            .sheet(isPresented: $showAddSheet) {
                MedicationFormSheet(editing: nil) { data in
                    await vm.save(medication: data, editing: nil)
                }
            }
            .sheet(item: $editingMedication) { med in
                MedicationFormSheet(editing: med) { data in
                    await vm.save(medication: data, editing: med.id)
                }
            }
            .alert("Error", isPresented: .constant(vm.errorMessage != nil)) {
                Button("OK") { vm.errorMessage = nil }
            } message: {
                Text(vm.errorMessage ?? "")
            }
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        ContentUnavailableView {
            Label("No Medications", systemImage: "pills")
        } description: {
            Text("Tap + to add a medication or supplement to track.")
        } actions: {
            Button("Add Medication") { showAddSheet = true }
                .buttonStyle(.borderedProminent)
        }
    }

    // MARK: - List

    private var medicationsList: some View {
        List {
            todaySection
            activeMedicationsSection
            if vm.medications.contains(where: { !$0.active }) {
                pausedSection
            }
        }
        .listStyle(.insetGrouped)
        .animation(.default, value: vm.medications)
        .animation(.default, value: vm.todayLogs)
    }

    // MARK: - Today Section

    @ViewBuilder
    private var todaySection: some View {
        if !vm.medicationsDueToday.isEmpty {
            Section {
                ForEach(vm.medicationsDueToday, id: \.medication.id) { item in
                    TodayMedicationRow(
                        medication: item.medication,
                        log: item.log,
                        onTaken: { await vm.markTaken(medication: item.medication) },
                        onSkipped: { await vm.markSkipped(medication: item.medication) },
                        onUndo: { await vm.undoLog(medication: item.medication) }
                    )
                    .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                        Button(role: .destructive) {
                            Task { await vm.delete(medication: item.medication) }
                        } label: {
                            Label("Delete", systemImage: "trash")
                        }
                        Button {
                            editingMedication = item.medication
                        } label: {
                            Label("Edit", systemImage: "pencil")
                        }
                        .tint(.blue)
                    }
                }
            } header: {
                Label("Today's Schedule", systemImage: "calendar.badge.clock")
                    .foregroundStyle(.primary)
                    .font(.headline)
                    .textCase(nil)
            } footer: {
                let taken = vm.todayLogs.filter { !$0.skipped }.count
                let total = vm.medicationsDueToday.count
                Text("\(taken)/\(total) taken today")
                    .foregroundStyle(.secondary)
            }
        }
    }

    // MARK: - Active Medications By Time Of Day

    @ViewBuilder
    private var activeMedicationsSection: some View {
        ForEach(TimeOfDay.allCases, id: \.rawValue) { time in
            let meds = vm.medicationsForTimeOfDay(time)
            if !meds.isEmpty {
                Section {
                    ForEach(meds) { med in
                        ActiveMedicationRow(medication: med) {
                            editingMedication = med
                        } onToggleActive: {
                            Task { await vm.toggleActive(medication: med) }
                        }
                        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                            Button(role: .destructive) {
                                Task { await vm.delete(medication: med) }
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                            Button {
                                editingMedication = med
                            } label: {
                                Label("Edit", systemImage: "pencil")
                            }
                            .tint(.blue)
                        }
                    }
                } header: {
                    Label(time.displayName, systemImage: time.icon)
                        .foregroundStyle(time.color)
                        .font(.subheadline.weight(.semibold))
                        .textCase(nil)
                }
            }
        }
    }

    // MARK: - Paused Section

    @ViewBuilder
    private var pausedSection: some View {
        Section {
            ForEach(vm.medications.filter { !$0.active }) { med in
                ActiveMedicationRow(medication: med) {
                    editingMedication = med
                } onToggleActive: {
                    Task { await vm.toggleActive(medication: med) }
                }
                .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                    Button(role: .destructive) {
                        Task { await vm.delete(medication: med) }
                    } label: {
                        Label("Delete", systemImage: "trash")
                    }
                }
                .opacity(0.6)
            }
        } header: {
            Label("Paused", systemImage: "pause.circle")
                .foregroundStyle(.secondary)
                .font(.subheadline.weight(.semibold))
                .textCase(nil)
        }
    }
}

// MARK: - Today Row

private struct TodayMedicationRow: View {
    let medication: Medication
    let log: MedicationLog?
    let onTaken: () async -> Void
    let onSkipped: () async -> Void
    let onUndo: () async -> Void

    private var isTaken: Bool  { log != nil && !log!.skipped }
    private var isSkipped: Bool { log != nil && log!.skipped }
    private var isLogged: Bool  { log != nil }

    var body: some View {
        HStack(spacing: 12) {
            // Checkbox
            Button {
                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                Task {
                    if isLogged { await onUndo() }
                    else { await onTaken() }
                }
            } label: {
                Image(systemName: isTaken ? "checkmark.circle.fill" : isSkipped ? "xmark.circle.fill" : "circle")
                    .font(.title2)
                    .foregroundStyle(isTaken ? .green : isSkipped ? .orange : .secondary)
                    .contentTransition(.symbolEffect(.replace))
            }
            .buttonStyle(.plain)

            VStack(alignment: .leading, spacing: 2) {
                Text(medication.name)
                    .font(.body.weight(.medium))
                    .strikethrough(isTaken)
                    .foregroundStyle(isTaken ? .secondary : .primary)
                HStack(spacing: 4) {
                    Text("\(formattedDosage) \(medication.unit)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text("·")
                        .foregroundStyle(.secondary)
                    Text(MedFrequency(rawValue: medication.frequency)?.displayName ?? medication.frequency)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            if !isLogged {
                // Skip button
                Button {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    Task { await onSkipped() }
                } label: {
                    Text("Skip")
                        .font(.caption.weight(.medium))
                        .foregroundStyle(.orange)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(.orange.opacity(0.12), in: Capsule())
                }
                .buttonStyle(.plain)
            } else {
                Text(isSkipped ? "Skipped" : "Taken")
                    .font(.caption.weight(.medium))
                    .foregroundStyle(isSkipped ? .orange : .green)
            }
        }
        .padding(.vertical, 2)
    }

    private var formattedDosage: String {
        medication.dosage.truncatingRemainder(dividingBy: 1) == 0
            ? String(Int(medication.dosage))
            : String(format: "%.1f", medication.dosage)
    }
}

// MARK: - Active Medication Row

private struct ActiveMedicationRow: View {
    let medication: Medication
    let onEdit: () -> Void
    let onToggleActive: () -> Void

    private static let df: DateFormatter = {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; return f
    }()

    var body: some View {
        HStack(spacing: 12) {
            // Time-of-day dots
            HStack(spacing: 3) {
                ForEach(TimeOfDay.allCases, id: \.rawValue) { time in
                    Circle()
                        .fill(medication.time_of_day.contains(time.rawValue) ? time.color : Color(.systemGray5))
                        .frame(width: 7, height: 7)
                }
            }

            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(medication.name)
                        .font(.body.weight(.medium))
                    if !medication.active {
                        Text("Paused")
                            .font(.caption2.weight(.semibold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 5)
                            .padding(.vertical, 2)
                            .background(.orange, in: Capsule())
                    }
                }
                HStack(spacing: 4) {
                    Text("\(formattedDosage) \(medication.unit)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text("·")
                        .foregroundStyle(.secondary)
                    Text(MedFrequency(rawValue: medication.frequency)?.displayName ?? medication.frequency)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    if let startDate = Self.df.date(from: medication.start_date) {
                        Text("· since \(startDate, format: .dateTime.month(.abbreviated).day())")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            Spacer()

            Menu {
                Button { onEdit() } label: {
                    Label("Edit", systemImage: "pencil")
                }
                Button { onToggleActive() } label: {
                    Label(medication.active ? "Pause" : "Resume",
                          systemImage: medication.active ? "pause.circle" : "play.circle")
                }
            } label: {
                Image(systemName: "ellipsis")
                    .font(.callout)
                    .foregroundStyle(.secondary)
                    .padding(6)
                    .contentShape(Circle())
            }
            .buttonStyle(.plain)
        }
        .padding(.vertical, 2)
    }

    private var formattedDosage: String {
        medication.dosage.truncatingRemainder(dividingBy: 1) == 0
            ? String(Int(medication.dosage))
            : String(format: "%.1f", medication.dosage)
    }
}

// MARK: - Add / Edit Sheet

struct MedicationFormSheet: View {
    let editing: Medication?
    let onSave: (MedicationFormData) async -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var form: MedicationFormData = MedicationFormData()
    @State private var isSaving = false
    @State private var dosageText: String = ""

    private let commonUnits = ["mg", "mcg", "g", "ml", "IU", "tablet", "capsule", "drop", "spray", "puff"]

    private static let df: DateFormatter = {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; return f
    }()

    var body: some View {
        NavigationStack {
            Form {
                // Name
                Section("Medication") {
                    TextField("Name (e.g. Metformin)", text: $form.name)
                        .autocorrectionDisabled()
                }

                // Dosage & Unit
                Section("Dosage") {
                    HStack {
                        TextField("Amount", text: $dosageText)
                            .keyboardType(.decimalPad)
                            .onChange(of: dosageText) { _, v in
                                form.dosage = Double(v) ?? 0
                            }
                        Divider()
                        Picker("Unit", selection: $form.unit) {
                            ForEach(commonUnits, id: \.self) { Text($0) }
                        }
                        .pickerStyle(.menu)
                        .labelsHidden()
                    }
                    if form.dosage <= 0 && !dosageText.isEmpty {
                        Text("Dosage must be greater than 0")
                            .font(.caption)
                            .foregroundStyle(.red)
                    }
                }

                // Frequency
                Section("Frequency") {
                    Picker("Frequency", selection: $form.frequency) {
                        ForEach(MedFrequency.allCases, id: \.rawValue) {
                            Text($0.displayName).tag($0.rawValue)
                        }
                    }
                    .pickerStyle(.menu)
                }

                // Time of Day
                Section("Time of Day") {
                    ForEach(TimeOfDay.allCases, id: \.rawValue) { time in
                        Toggle(isOn: Binding(
                            get: { form.timesOfDay.contains(time.rawValue) },
                            set: { on in
                                if on { form.timesOfDay.append(time.rawValue) }
                                else { form.timesOfDay.removeAll { $0 == time.rawValue } }
                            }
                        )) {
                            Label(time.displayName, systemImage: time.icon)
                                .foregroundStyle(time.color)
                        }
                    }
                }

                // Dates
                Section("Schedule") {
                    DatePicker(
                        "Start Date",
                        selection: Binding(
                            get: { Self.df.date(from: form.startDate) ?? Date() },
                            set: { form.startDate = Self.df.string(from: $0) }
                        ),
                        displayedComponents: .date
                    )
                    Toggle("Set End Date", isOn: Binding(
                        get: { !form.endDate.isEmpty },
                        set: { on in form.endDate = on ? Self.df.string(from: Date()) : "" }
                    ))
                    if !form.endDate.isEmpty {
                        DatePicker(
                            "End Date",
                            selection: Binding(
                                get: { Self.df.date(from: form.endDate) ?? Date() },
                                set: { form.endDate = Self.df.string(from: $0) }
                            ),
                            in: (Self.df.date(from: form.startDate) ?? Date())...,
                            displayedComponents: .date
                        )
                    }
                    Toggle("Active", isOn: $form.active)
                }

                // Notes
                Section("Notes") {
                    TextField("Optional notes", text: $form.notes, axis: .vertical)
                        .lineLimit(3...6)
                }
            }
            .navigationTitle(editing == nil ? "Add Medication" : "Edit Medication")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    if isSaving {
                        ProgressView()
                    } else {
                        Button("Save") {
                            guard form.isValid else { return }
                            UINotificationFeedbackGenerator().notificationOccurred(.success)
                            isSaving = true
                            Task {
                                await onSave(form)
                                isSaving = false
                                dismiss()
                            }
                        }
                        .disabled(!form.isValid)
                        .fontWeight(.semibold)
                    }
                }
            }
        }
        .onAppear {
            if let med = editing {
                form = MedicationFormData.from(med)
                dosageText = form.dosage.truncatingRemainder(dividingBy: 1) == 0
                    ? String(Int(form.dosage))
                    : String(format: "%.2f", form.dosage)
            } else {
                let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
                form.startDate = df.string(from: Date())
                dosageText = ""
            }
        }
    }
}
