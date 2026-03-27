import { createSecureApiHandler, secureJsonResponse } from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Try multiple table names the scanner might use
    let scans: any[] = []
    for (const table of ['food_scans', 'scan_history', 'food_scan_history', 'product_scans']) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', user!.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(200)
      if (!error && data) { scans = data; break }
    }
    // Fallback for scan_history with scanned_at
    if (scans.length === 0) {
      const { data, error } = await supabase
        .from('scan_history')
        .select('*')
        .eq('user_id', user!.id)
        .gte('scanned_at', thirtyDaysAgo.toISOString())
        .order('scanned_at', { ascending: false })
        .limit(200)
      if (!error && data) { scans = data }
    }

    if (scans.length === 0) {
      return secureJsonResponse({ hasData: false, message: 'No food scans in the last 30 days' })
    }

    // Compute diet pattern score
    const grades = scans.map((s: any) => s.grade ?? s.quarkscore_grade ?? s.score_grade ?? 'C')
    const gradeToNum: Record<string, number> = { 'A+': 95, 'A': 80, 'B': 62, 'C': 45, 'D': 25, 'F': 8 }
    const numericGrades = grades.map((g: string) => gradeToNum[g] ?? 45)
    const avgScore = Math.round(numericGrades.reduce((a: number, b: number) => a + b, 0) / numericGrades.length)

    const gradeDistribution: Record<string, number> = {}
    grades.forEach((g: string) => { gradeDistribution[g] = (gradeDistribution[g] ?? 0) + 1 })

    // NOVA distribution
    const novaGroups = scans.map((s: any) => s.nova_group ?? s.processing_level ?? 3)
    const ultraProcessedCount = novaGroups.filter((n: number) => n >= 4).length
    const ultraProcessedPct = Math.round(ultraProcessedCount / scans.length * 100)

    // Top scanned products (by frequency)
    const productCounts: Record<string, { count: number; name: string; grade: string; score: number }> = {}
    scans.forEach((s: any) => {
      const key = s.product_name ?? s.name ?? 'Unknown'
      if (!productCounts[key]) productCounts[key] = { count: 0, name: key, grade: s.grade ?? 'C', score: s.quarkscore ?? s.total_score ?? 50 }
      productCounts[key].count++
    })
    const topProducts = Object.values(productCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    // Diet pattern label
    let dietPattern = 'Mixed'
    if (avgScore >= 75 && ultraProcessedPct < 20) dietPattern = 'Whole Food'
    else if (avgScore >= 65) dietPattern = 'Mostly Healthy'
    else if (ultraProcessedPct > 50) dietPattern = 'Ultra-Processed Heavy'
    else if (avgScore < 40) dietPattern = 'Needs Improvement'

    // Best and worst products for swaps
    const bestProducts = Object.values(productCounts).filter(p => (p.score ?? 50) >= 70).slice(0, 3)
    const worstProducts = Object.values(productCounts).filter(p => (p.score ?? 50) < 40).slice(0, 3)

    // Trend: compare first 15 days vs last 15 days
    const midPoint = new Date(); midPoint.setDate(midPoint.getDate() - 15)
    const recentScans = scans.filter((s: any) => new Date(s.created_at ?? s.scanned_at) >= midPoint)
    const olderScans = scans.filter((s: any) => new Date(s.created_at ?? s.scanned_at) < midPoint)
    const recentAvg = recentScans.length > 0
      ? Math.round(recentScans.map((s: any) => gradeToNum[s.grade ?? 'C'] ?? 45).reduce((a: number, b: number) => a + b, 0) / recentScans.length)
      : avgScore
    const olderAvg = olderScans.length > 0
      ? Math.round(olderScans.map((s: any) => gradeToNum[s.grade ?? 'C'] ?? 45).reduce((a: number, b: number) => a + b, 0) / olderScans.length)
      : avgScore
    const trend = recentAvg - olderAvg // positive = improving

    return secureJsonResponse({
      hasData: true,
      totalScans: scans.length,
      avgScore,
      gradeDistribution,
      ultraProcessedPct,
      topProducts,
      dietPattern,
      bestProducts,
      worstProducts,
      trend,
      recentAvg,
      olderAvg,
    })
  }
)
