# GetZen App Store Screenshots Specification

Required sizes: 6.9" (iPhone 16 Pro Max, 1320×2868 px) and 13" (iPad Pro M4, 2064×2752 px).
All screenshots use dark mode. Status bar shows 9:41 AM, full signal, full battery.

---

## Screenshot 1 — Dashboard / Morning Briefing

**File name:** `01-morning-briefing`

**Headline overlay (top):** "Your morning health briefing, ready before you are."

**Content to show:**
- The AI morning briefing card at the top of the dashboard, displaying two to three sentences of a sample briefing such as: "Your HRV is 12% above your 30-day baseline and you completed 8h 20m of sleep with 22% deep sleep. Today looks like a good day for a hard session."
- Below it, a row of four ring/stat tiles: Sleep Score 87, HRV 68 ms, Resting HR 48 bpm, Readiness 91.
- A subtle gradient background in deep navy.

---

## Screenshot 2 — Analytics Depth (HRV Detail)

**File name:** `02-hrv-deep-dive`

**Headline overlay (top):** "200+ metrics. Every one explained."

**Content to show:**
- The HRV Detail view with a 90-day line chart showing an upward trend line.
- Three stat cards beneath the chart: 7-day avg, 30-day avg, personal best.
- A "What this means" expandable section partially visible at the bottom, showing one sentence of plain-English context.
- Chart rendered in teal/green on dark background.

---

## Screenshot 3 — Workout & Sport Analytics

**File name:** `03-running-analysis`

**Headline overlay (top):** "Sport-specific science for every workout."

**Content to show:**
- The Running Analysis view showing a recent run summary: distance, pace, cadence, ground contact time, vertical oscillation.
- A pace-zone bar chart with five coloured zones (grey through red).
- A small map thumbnail of the run route in the top-right corner.
- Coaching callout card: "Your cadence increased 4 spm vs last week — keep it up."

---

## Screenshot 4 — Anomaly Detection / Smart Nudges

**File name:** `04-anomaly-alerts`

**Headline overlay (top):** "Know something's off before you feel it."

**Content to show:**
- The Smart Nudges / Anomaly feed showing three alert cards:
  1. Yellow card — "Resting HR elevated 9 bpm above your baseline for 3 days."
  2. Blue card — "Sleep efficiency dropped below 80% — consider an earlier wind-down."
  3. Green card — "VO2 Max improved 0.8 ml/kg/min over the past 30 days."
- Each card has a small icon (heart, moon, trophy), a one-line explanation, and a "Learn more" chevron.

---

## Screenshot 5 — Privacy & Data Ownership

**File name:** `05-privacy`

**Headline overlay (top):** "Your health data. Your rules."

**Content to show:**
- A clean settings/privacy screen with three sections:
  1. "Data Storage" — shows user's private Supabase database URL with a green "Encrypted" badge.
  2. "AI Processing" — toggle showing "Use Claude AI for briefings" enabled, with a note "Your data is never used to train AI models."
  3. "Delete My Data" — a clearly visible red destructive button at the bottom.
- Minimalist layout, generous whitespace, SF Symbols icons for each row.
