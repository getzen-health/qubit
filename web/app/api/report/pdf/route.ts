import { z } from 'zod'
import React from 'react'
import { createSecureApiHandler } from '@/lib/security'

const querySchema = z.object({
  days: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 30))
    .pipe(z.number().int().min(1).max(365)),
})

export const GET = createSecureApiHandler(
  { rateLimit: 'report', requireAuth: true, querySchema },
  async (_req, { user, query, supabase }) => {
    const { days } = query as z.infer<typeof querySchema>
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    const [summariesRes, insightsRes, profileRes] = await Promise.all([
      supabase
        .from('daily_summaries')
        .select(
          'date,steps,active_calories,exercise_minutes,sleep_hours,resting_heart_rate,hrv'
        )
        .eq('user_id', user!.id)
        .gte('date', fromDate)
        .order('date', { ascending: true }),
      supabase
        .from('health_insights')
        .select('content,created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('profiles')
        .select('full_name,display_name')
        .eq('id', user!.id)
        .single(),
    ])

    const data = summariesRes.data ?? []
    const insights = insightsRes.data ?? []
    const profile = profileRes.data
    const userName =
      profile?.display_name ?? profile?.full_name ?? user!.email ?? 'Patient'

    const startLabel = fromDate
    const endLabel = new Date().toISOString().split('T')[0]
    const dateRange = `${startLabel} → ${endLabel}`

    const { renderToBuffer, Document, Page, Text, View, StyleSheet } =
      await import('@react-pdf/renderer')

    const styles = StyleSheet.create({
      page: { padding: 40, fontFamily: 'Helvetica' },
      title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
      subtitle: { fontSize: 12, color: '#666', marginBottom: 24 },
      sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 4,
      },
      row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
      },
      label: { fontSize: 10, color: '#555' },
      value: { fontSize: 10, fontWeight: 'bold' },
      insight: { fontSize: 9, color: '#444', marginBottom: 6, lineHeight: 1.4 },
      footer: {
        position: 'absolute',
        bottom: 20,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 8,
        color: '#aaa',
      },
    })

    const avg = (key: string) => {
      const vals = data.map((d) => (d as Record<string, unknown>)[key])
      const nums = vals.filter((v) => v != null && v !== 0) as number[]
      if (nums.length === 0) return '0'
      return (nums.reduce((s, n) => s + n, 0) / nums.length).toFixed(0)
    }

    const doc = React.createElement(
      Document,
      null,
      React.createElement(
        Page,
        { size: 'A4', style: styles.page },
        React.createElement(Text, { style: styles.title }, `Health Report — ${userName}`),
        React.createElement(
          Text,
          { style: styles.subtitle },
          `Generated ${new Date().toLocaleDateString()} · ${dateRange}`
        ),

        React.createElement(
          Text,
          { style: styles.sectionTitle },
          `Activity Summary (${data.length} days)`
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Average Daily Steps'),
          React.createElement(Text, { style: styles.value }, avg('steps'))
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Average Active Calories'),
          React.createElement(Text, { style: styles.value }, `${avg('active_calories')} kcal`)
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Average Exercise Minutes'),
          React.createElement(Text, { style: styles.value }, `${avg('exercise_minutes')} min`)
        ),

        React.createElement(Text, { style: styles.sectionTitle }, 'Sleep'),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Average Sleep Duration'),
          React.createElement(
            Text,
            { style: styles.value },
            `${(parseFloat(avg('sleep_hours')) || 0).toFixed(1)}h`
          )
        ),

        React.createElement(Text, { style: styles.sectionTitle }, 'Heart'),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Average Resting Heart Rate'),
          React.createElement(Text, { style: styles.value }, `${avg('resting_heart_rate')} bpm`)
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Average HRV'),
          React.createElement(Text, { style: styles.value }, `${avg('hrv')} ms`)
        ),

        ...(insights.length > 0
          ? [
              React.createElement(
                Text,
                { style: styles.sectionTitle },
                'AI Health Insights'
              ),
              ...insights.map((ins, i) =>
                React.createElement(
                  Text,
                  { key: String(i), style: styles.insight },
                  `• ${ins.content}`
                )
              ),
            ]
          : []),

        React.createElement(
          Text,
          { style: styles.footer },
          'Generated by GetZen · kquarks.app · This report is for informational purposes only and does not constitute medical advice.'
        )
      )
    )

    const buffer = await renderToBuffer(doc)

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="getzen-health-report.pdf"',
      },
    }) as unknown as import('next/server').NextResponse
  }
)
