'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts'
import {
  Pill,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Heart,
  FlaskConical,
  ShieldCheck,
  BookOpen,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Medication {
  name: string
  dose: string
  status: 'Active' | 'Completed' | 'Stopped'
  since: string
  specialty: string
  prescriber: string
}

interface BiomarkerImpact {
  medication: string
  shortName: string
  hrvBefore: number
  hrvAfter: number
  rhrBefore: number
  rhrAfter: number
}

interface HrvDay {
  day: string
  hrv: number
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MEDICATIONS: Medication[] = [
  {
    name: 'Lisinopril',
    dose: '10mg',
    status: 'Active',
    since: 'Jan 2025',
    specialty: 'Cardiology',
    prescriber: 'Dr. Smith',
  },
  {
    name: 'Metformin',
    dose: '500mg',
    status: 'Active',
    since: 'Mar 2024',
    specialty: 'Endocrinology',
    prescriber: 'Dr. Johnson',
  },
  {
    name: 'Atorvastatin',
    dose: '20mg',
    status: 'Active',
    since: 'Jun 2023',
    specialty: 'General Practice',
    prescriber: 'Dr. Chen',
  },
]

const BIOMARKER_DATA: BiomarkerImpact[] = [
  {
    medication: 'Lisinopril',
    shortName: 'Lisinopril',
    hrvBefore: 38,
    hrvAfter: 42,
    rhrBefore: 72,
    rhrAfter: 68,
  },
  {
    medication: 'Metformin',
    shortName: 'Metformin',
    hrvBefore: 35,
    hrvAfter: 37,
    rhrBefore: 74,
    rhrAfter: 73,
  },
  {
    medication: 'Atorvastatin',
    shortName: 'Atorvastatin',
    hrvBefore: 34,
    hrvAfter: 35,
    rhrBefore: 75,
    rhrAfter: 74,
  },
]

// Generate 30 days of HRV with mild upward trend (30–50ms)
const HRV_TREND: HrvDay[] = Array.from({ length: 30 }, (_, i) => {
  const base = 34 + i * 0.45
  const noise = (Math.sin(i * 1.7) * 4 + Math.cos(i * 2.3) * 3)
  return {
    day: `Day ${i + 1}`,
    hrv: Math.round(Math.min(50, Math.max(30, base + noise)) * 10) / 10,
  }
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tooltipStyle = {
  background: 'var(--color-surface, #1e2130)',
  border: '1px solid var(--color-border, #2d3047)',
  borderRadius: 8,
  fontSize: 12,
}

function statusBadge(status: Medication['status']) {
  const styles: Record<Medication['status'], string> = {
    Active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    Completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Stopped: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  )
}

function DeltaBadge({ before, after, unit }: { before: number; after: number; unit: string }) {
  const delta = after - before
  const positive = delta > 0
  const color = positive
    ? 'text-green-600 dark:text-green-400'
    : 'text-orange-600 dark:text-orange-400'
  const Icon = positive ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${color}`}>
      <Icon className="w-3 h-3" />
      {positive ? '+' : ''}{delta}{unit}
    </span>
  )
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function ConnectionStatusCard() {
  const steps = [
    {
      icon: <Heart className="w-5 h-5 text-red-500" />,
      title: 'Open Health app on iPhone',
      desc: 'Go to the Browse tab and select Health Records',
    },
    {
      icon: <FlaskConical className="w-5 h-5 text-blue-500" />,
      title: 'Connect your healthcare providers',
      desc: 'Search for your hospital or clinic and sign in with your patient portal',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-green-500" />,
      title: 'Authorize FHIR data access',
      desc: 'Apple Health downloads clinical records — medications, lab results, and more',
    },
    {
      icon: <Activity className="w-5 h-5 text-purple-500" />,
      title: 'KQuarks syncs automatically',
      desc: 'Your medication list updates whenever Apple Health receives new FHIR records',
    },
  ]

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Pill className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Connect Health Records
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">FHIR R4 via Apple Health</p>
        </div>
        <div className="ml-auto flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full">
          <AlertTriangle className="w-3 h-3" />
          Not connected
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400">
              {i + 1}
            </div>
            <div className="flex-shrink-0 mt-1.5">{step.icon}</div>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{step.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-1 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
        Records are stored locally on-device and never leave Apple Health unless you authorize sync.
      </div>
    </div>
  )
}

function ActiveMedications() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Active Medications
        </h2>
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 italic">
          Demo data
        </span>
      </div>

      <div className="space-y-3">
        {MEDICATIONS.map((med) => (
          <div
            key={med.name}
            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Pill className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {med.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                  {med.dose}
                </span>
                {statusBadge(med.status)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {med.specialty} · {med.prescriber} · Since {med.since}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BiomarkerImpactChart() {
  const hrvData = BIOMARKER_DATA.map((d) => ({
    name: d.shortName,
    Before: d.hrvBefore,
    After: d.hrvAfter,
  }))

  const rhrData = BIOMARKER_DATA.map((d) => ({
    name: d.shortName,
    Before: d.rhrBefore,
    After: d.rhrAfter,
  }))

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-5">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Biomarker Impact
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            HRV &amp; RHR before vs. after medication start
          </p>
        </div>
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 italic">Demo data</span>
      </div>

      {/* HRV Impact */}
      <div>
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
          HRV (ms)
        </p>
        <div className="flex flex-col gap-3 mb-3">
          {BIOMARKER_DATA.map((d) => (
            <div key={d.medication} className="flex items-center gap-2 text-xs">
              <span className="w-24 text-gray-700 dark:text-gray-300 font-medium">{d.medication}</span>
              <span className="text-gray-500 dark:text-gray-400">{d.hrvBefore}ms → {d.hrvAfter}ms</span>
              <DeltaBadge before={d.hrvBefore} after={d.hrvAfter} unit="ms" />
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={hrvData} barCategoryGap="30%" barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[30, 46]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={32} unit="ms" />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} ms`]} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Before" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="After" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* RHR Impact */}
      <div>
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
          Resting Heart Rate (bpm)
        </p>
        <div className="flex flex-col gap-3 mb-3">
          {BIOMARKER_DATA.map((d) => (
            <div key={d.medication} className="flex items-center gap-2 text-xs">
              <span className="w-24 text-gray-700 dark:text-gray-300 font-medium">{d.medication}</span>
              <span className="text-gray-500 dark:text-gray-400">{d.rhrBefore} → {d.rhrAfter} bpm</span>
              <DeltaBadge before={d.rhrAfter} after={d.rhrBefore} unit=" bpm" />
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={rhrData} barCategoryGap="30%" barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[64, 78]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={36} unit=" bpm" />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} bpm`]} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Before" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="After" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function HrvTrendChart() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
          <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            30-Day HRV Trend
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Heart rate variability · mild upward trend
          </p>
        </div>
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 italic">Demo data</span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={HRV_TREND} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={4}
          />
          <YAxis
            domain={[28, 52]}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
            unit="ms"
          />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} ms`, 'HRV']} />
          <Line
            type="monotone"
            dataKey="hrv"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#6366f1' }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Simple stats row */}
      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
        {[
          { label: 'Start avg', value: `${Math.round((HRV_TREND.slice(0, 5).reduce((s, d) => s + d.hrv, 0) / 5) * 10) / 10} ms` },
          { label: 'End avg', value: `${Math.round((HRV_TREND.slice(-5).reduce((s, d) => s + d.hrv, 0) / 5) * 10) / 10} ms` },
          { label: 'Trend', value: '+13%', positive: true },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
            <p className={`text-sm font-bold ${stat.positive ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ScienceCard() {
  const items = [
    {
      icon: <FlaskConical className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />,
      label: 'FHIR R4 Standard',
      text: 'Clinical records are retrieved using the HL7 FHIR R4 standard via Apple HealthKit ClinicalRecord APIs.',
    },
    {
      icon: <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />,
      label: 'Privacy — local only',
      text: 'Medication data is processed on-device. No clinical records are transmitted without explicit user authorization.',
    },
    {
      icon: <Heart className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />,
      label: 'Cardiovascular drug interactions',
      text: 'Beta-blockers reduce resting heart rate by 5–15 bpm (Bhatt et al., 2020). SSRIs modulate autonomic tone, affecting HRV (Ahmad et al., 2018).',
    },
    {
      icon: <BookOpen className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />,
      label: 'Medical disclaimer',
      text: 'Biomarker correlations shown are observational and for informational purposes only. Do not adjust medications based on this data. Always consult your prescribing physician.',
    },
  ]

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <BookOpen className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Science &amp; Privacy
        </h2>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.label} className="flex gap-3">
            {item.icon}
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{item.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">
                {item.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Client Component ────────────────────────────────────────────────────

export function MedicationsClient() {
  return (
    <div className="space-y-5">
      <ConnectionStatusCard />
      <ActiveMedications />
      <BiomarkerImpactChart />
      <HrvTrendChart />
      <ScienceCard />
    </div>
  )
}
