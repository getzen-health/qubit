import React from 'react'

async function fetchPrescription() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/prescriptions/daily`, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    return data.prescription
  } catch {
    return null
  }
}

export default async function PrescriptionCard() {
  const prescription = await fetchPrescription()
  if (!prescription) return null
  return (
    <div className="rounded-2xl border-2 p-4 flex items-center gap-4 bg-surface border-border mb-2">
      <span className="text-3xl">{prescription.intensity_emoji}</span>
      <div>
        <div className="font-semibold text-text-primary text-base">{prescription.intensity_label}</div>
        <div className="text-xs text-text-secondary mb-1">{prescription.recommended_workout_type}</div>
        <div className="text-xs text-text-secondary">{prescription.suggested_workouts?.[0]}</div>
      </div>
    </div>
  )
}
