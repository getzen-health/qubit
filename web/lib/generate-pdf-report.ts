import jsPDF from 'jspdf'

export interface HealthReportData {
  period: { start: string; end: string }
  stats: {
    steps: { avg: number | null; total: number; days: number }
    sleep: { avg_hours: number | null; days: number }
    resting_hr: { avg: number | null }
    weight: { start: number | null; end: number | null; change: number | null }
    mood: { avg: number | null; logs: number }
    workouts: { count: number; total_minutes: number }
  }
  labs: Array<{ biomarker_name: string; value: number; unit: string; status: string; tested_at: string }>
  recent_workouts: Array<{ name: string; duration_minutes: number; calories: number; started_at: string }>
  generated_at: string
}

export function generateHealthReportPDF(data: HealthReportData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const margin = 16
  let y = 20

  const line = (yPos: number) => {
    doc.setDrawColor(220, 220, 220)
    doc.line(margin, yPos, W - margin, yPos)
  }

  const section = (title: string) => {
    y += 6
    doc.setFillColor(245, 245, 250)
    doc.rect(margin, y - 4, W - margin * 2, 9, 'F')
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(60, 60, 60)
    doc.text(title, margin + 3, y + 2)
    y += 10
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
  }

  const statRow = (label: string, value: string, unit?: string) => {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(label, margin + 3, y)
    doc.setFont('helvetica', 'bold')
    doc.text(value + (unit ? ' ' + unit : ''), 120, y)
    y += 7
  }

  // Header
  doc.setFillColor(99, 102, 241) // indigo / primary
  doc.rect(0, 0, W, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('⚡ KQuarks Health Report', margin, 16)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const startDate = new Date(data.period.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const endDate = new Date(data.period.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  doc.text(`${startDate} – ${endDate}  ·  Generated ${new Date(data.generated_at).toLocaleDateString()}`, margin, 24)
  y = 38

  // Activity Summary
  section('📊 Activity Summary (Last 30 Days)')
  statRow('Average Daily Steps', data.stats.steps.avg?.toLocaleString() ?? '—', 'steps/day')
  statRow('Total Steps', data.stats.steps.total?.toLocaleString() ?? '—', 'steps')
  statRow('Active Days', data.stats.steps.days.toString(), `of 30 days`)
  statRow('Workouts Completed', data.stats.workouts.count.toString(), 'sessions')
  statRow('Total Workout Time', Math.round(data.stats.workouts.total_minutes / 60 * 10) / 10 + ' hrs', '')

  // Sleep
  section('😴 Sleep')
  statRow('Average Sleep Duration', data.stats.sleep.avg_hours?.toString() ?? '—', 'hours/night')
  statRow('Sleep Logs', data.stats.sleep.days.toString(), 'nights tracked')

  // Vitals
  section('❤️ Vitals')
  statRow('Avg Resting Heart Rate', data.stats.resting_hr.avg?.toString() ?? '—', 'bpm')
  if (data.stats.weight.start) statRow('Weight (start)', data.stats.weight.start.toString(), 'kg')
  if (data.stats.weight.end) statRow('Weight (current)', data.stats.weight.end.toString(), 'kg')
  if (data.stats.weight.change !== null) {
    const sign = data.stats.weight.change > 0 ? '+' : ''
    statRow('Weight Change', sign + data.stats.weight.change, 'kg')
  }

  // Mood
  section('😊 Mood & Wellbeing')
  statRow('Average Mood Score', data.stats.mood.avg?.toString() ?? '—', '/ 10')
  statRow('Mood Check-ins', data.stats.mood.logs.toString(), 'entries')

  // Lab results
  if (data.labs.length > 0) {
    // Check if we need a new page
    if (y > 200) { doc.addPage(); y = 20 }
    section('🧪 Recent Lab Results')
    doc.setFontSize(9)
    data.labs.slice(0, 12).forEach(lab => {
      const statusColor: Record<string, [number, number, number]> = {
        optimal: [34, 197, 94],
        normal: [59, 130, 246],
        suboptimal: [234, 179, 8],
        critical: [239, 68, 68],
      }
      const [r, g, b] = statusColor[lab.status] ?? [100, 100, 100]
      doc.setTextColor(r, g, b)
      doc.setFont('helvetica', 'bold')
      doc.text('●', margin + 3, y)
      doc.setTextColor(60, 60, 60)
      doc.setFont('helvetica', 'normal')
      doc.text(`${lab.biomarker_name}: ${lab.value} ${lab.unit}`, margin + 8, y)
      doc.setTextColor(150, 150, 150)
      doc.text(new Date(lab.tested_at).toLocaleDateString(), 165, y)
      y += 6
    })
  }

  // Recent workouts
  if (data.recent_workouts.length > 0) {
    if (y > 230) { doc.addPage(); y = 20 }
    section('🏋️ Recent Workouts')
    doc.setFontSize(9)
    data.recent_workouts.forEach(w => {
      doc.setTextColor(60, 60, 60)
      const date = new Date(w.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      doc.text(`${date} — ${w.name ?? 'Workout'}`, margin + 3, y)
      doc.setTextColor(120, 120, 120)
      doc.text(`${w.duration_minutes ?? 0} min · ${w.calories ?? 0} cal`, 145, y)
      y += 6
    })
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(180, 180, 180)
    doc.text('Generated by KQuarks Health Tracker · kquarks.app', margin, 290)
    doc.text(`Page ${i} of ${pageCount}`, W - margin - 20, 290)
  }

  doc.save(`kquarks-health-report-${new Date().toISOString().split('T')[0]}.pdf`)
}
