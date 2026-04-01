import { Metadata } from 'next'
import VO2MaxClient from './vo2max-client'

export const metadata: Metadata = {
  title: 'VO2max Estimator | GetZen',
  description:
    'Estimate your cardiorespiratory fitness with Cooper 12-min run, resting HR, or 1-mile walk. ACSM norms, MET capacity, and 10-year projection.',
}

export default function VO2MaxPage() {
  return <VO2MaxClient />
}
