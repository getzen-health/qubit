import { z } from 'zod'
import { NextResponse } from 'next/server'
import { createSecureApiHandler, secureErrorResponse } from '@/lib/security'
import jsPDF from 'jspdf'

export const dynamic = 'force-dynamic'

const pdfBodySchema = z.object({
  year: z.number().optional(),
})

export const POST = createSecureApiHandler(
  { rateLimit: 'export', requireAuth: true, bodySchema: pdfBodySchema },
  async (request, { body }) => {
    const { year = new Date().getFullYear() } = body as z.infer<typeof pdfBodySchema>

    const monthlyRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/health/monthly?year=${year}`,
      {
        headers: {
          Cookie: request.headers.get('cookie') || '',
        },
      }
    )

    if (!monthlyRes.ok) {
      return secureErrorResponse('Failed to fetch monthly data', 500)
    }

    const { monthly_data, yearly_summary } = await monthlyRes.json()

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    let yPosition = 15

    pdf.setFontSize(24)
    pdf.setTextColor(51, 51, 51)
    pdf.text(`Health Report ${year}`, pageWidth / 2, yPosition, { align: 'center' })

    yPosition += 15

    pdf.setFontSize(14)
    pdf.setTextColor(80, 80, 80)
    pdf.text('Yearly Summary', 15, yPosition)

    yPosition += 10
    pdf.setFontSize(10)
    pdf.setTextColor(100, 100, 100)

    const summaryItems = [
      `Average Daily Steps: ${yearly_summary.avg_daily_steps.toLocaleString()}`,
      `Total Steps: ${yearly_summary.total_steps.toLocaleString()}`,
      `Average Sleep: ${yearly_summary.avg_sleep_hours} hours`,
      `Recovery Score: ${(yearly_summary.avg_recovery_score * 100).toFixed(1)}%`,
      `Days Recorded: ${yearly_summary.total_days_recorded}`,
    ]

    for (const item of summaryItems) {
      pdf.text(item, 20, yPosition)
      yPosition += 7
    }

    yPosition += 5

    pdf.setFontSize(14)
    pdf.setTextColor(80, 80, 80)
    pdf.text('Monthly Breakdown', 15, yPosition)

    yPosition += 10

    pdf.setFontSize(9)
    pdf.setTextColor(0, 0, 0)

    const colWidths = [30, 30, 30, 40, 30]
    const headers = ['Month', 'Avg Steps', 'Total Steps', 'Sleep (hrs)', 'Days']
    let xPos = 15

    pdf.setFillColor(220, 220, 220)
    for (let i = 0; i < headers.length; i++) {
      pdf.rect(xPos, yPosition - 5, colWidths[i], 7, 'F')
      pdf.text(headers[i], xPos + colWidths[i] / 2, yPosition, { align: 'center' })
      xPos += colWidths[i]
    }

    yPosition += 8

    pdf.setTextColor(0, 0, 0)
    for (const month of monthly_data) {
      if (yPosition > pageHeight - 20) {
        pdf.addPage()
        yPosition = 15
      }

      xPos = 15
      const row = [
        month.month,
        month.avg_steps.toLocaleString(),
        month.total_steps.toLocaleString(),
        (month.avg_sleep_minutes / 60).toFixed(1),
        month.days_recorded.toString(),
      ]

      for (let i = 0; i < row.length; i++) {
        pdf.text(row[i], xPos + colWidths[i] / 2, yPosition, { align: 'center' })
        xPos += colWidths[i]
      }

      yPosition += 7
    }

    yPosition = pageHeight - 10
    pdf.setFontSize(8)
    pdf.setTextColor(150, 150, 150)
    pdf.text(
      `Generated on ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      yPosition,
      { align: 'center' }
    )

    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="health-report-${year}.pdf"`,
      },
    })
  }
)
