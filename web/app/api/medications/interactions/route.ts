// OpenFDA drug interaction checker for medications
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit, createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

const interactionSchema = z.object({
  medications: z.array(z.string().min(1)).min(2)
})

// POST /api/medications/interactions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { medications } = interactionSchema.parse(body)
    // For each pair, check OpenFDA
    const results: Array<{ pair: [string, string], interaction: string | null, severity: string | null }> = []
    for (let i = 0; i < medications.length; ++i) {
      for (let j = i + 1; j < medications.length; ++j) {
        const drugA = medications[i]
        const drugB = medications[j]
        // Query OpenFDA for both drugs
        const [labelA, labelB] = await Promise.all([
          fetch(`https://api.fda.gov/drug/label.json?search=openfda.brand_name:${encodeURIComponent(drugA)}&limit=1`).then(r => r.ok ? r.json() : null),
          fetch(`https://api.fda.gov/drug/label.json?search=openfda.brand_name:${encodeURIComponent(drugB)}&limit=1`).then(r => r.ok ? r.json() : null)
        ])
        let found = null
        let severity = null
        // Check if drugB is mentioned in drugA's warnings
        if (labelA && labelA.results && labelA.results[0]?.warnings) {
          const warnings = labelA.results[0].warnings.join(' ').toLowerCase()
          if (warnings.includes(drugB.toLowerCase())) {
            found = `Potential interaction: ${drugA} and ${drugB} (see warnings for ${drugA})`
            severity = 'warning'
          }
        }
        // Check if drugA is mentioned in drugB's warnings
        if (!found && labelB && labelB.results && labelB.results[0]?.warnings) {
          const warnings = labelB.results[0].warnings.join(' ').toLowerCase()
          if (warnings.includes(drugA.toLowerCase())) {
            found = `Potential interaction: ${drugA} and ${drugB} (see warnings for ${drugB})`
            severity = 'warning'
          }
        }
        results.push({ pair: [drugA, drugB], interaction: found, severity })
      }
    }
    return NextResponse.json({ interactions: results.filter(r => r.interaction) })
  } catch (e) {
    return secureErrorResponse('Failed to check interactions', 400)
  }
}
