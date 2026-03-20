import { ElevationAnalysisClient } from './elevation-analysis-client'

export const metadata = {
  title: 'Elevation Analysis — KQuarks',
  description:
    'Analyze GPS elevation gain from outdoor runs and hikes tracked by Apple Watch and iPhone. ' +
    'Understand terrain classification, altitude-adjusted training load, and muscle damage risk.',
}

export default function ElevationAnalysisPage() {
  return <ElevationAnalysisClient />
}
