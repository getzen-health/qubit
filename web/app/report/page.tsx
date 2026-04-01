import type { Metadata } from 'next'
import { ReportClient } from './report-client'

export const metadata: Metadata = {
  title: 'Doctor Report | GetZen',
  description:
    'Generate a PDF health summary to share with your doctor — steps, sleep, HRV, and AI insights.',
}

export default function ReportPage() {
  return <ReportClient />
}
