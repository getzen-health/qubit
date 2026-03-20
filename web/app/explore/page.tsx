import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Explore' }

interface FeatureCard {
  label: string
  desc: string
  href: string
  emoji: string
}

interface Section {
  title: string
  features: FeatureCard[]
}

const SECTIONS: Section[] = [
  {
    title: 'Heart & Vitals',
    features: [
      { label: 'Heart Rate', desc: 'Resting HR trends and daily averages', href: '/heartrate', emoji: '❤️' },
      { label: 'Daily HR Pattern', desc: '24-hour circadian heart rate rhythm', href: '/heartrate/patterns', emoji: '🕐' },
      { label: 'HRV Analysis', desc: 'Variability trends, baselines, and recovery', href: '/hrv', emoji: '💗' },
      { label: 'HRV Calendar', desc: '365-day recovery heatmap vs baseline', href: '/hrv/calendar', emoji: '📆' },
      { label: 'HRV Patterns', desc: 'DOW trends, sleep correlation, monthly progression & zone distribution', href: '/hrv/patterns', emoji: '📊' },
      { label: 'HRV Recovery Zones', desc: 'Green / yellow / orange zone history based on personal baseline', href: '/hrv/zones', emoji: '🟢' },
      { label: 'Training Zones', desc: 'Time in each HR zone across workouts', href: '/zones', emoji: '🎯' },
      { label: 'Oxygen (SpO2)', desc: 'Blood oxygen saturation day and night', href: '/oxygen', emoji: '🫁' },
      { label: 'SpO₂ Patterns', desc: 'Night vs day, DOW trends, hourly & monthly SpO₂ analysis', href: '/oxygen/patterns', emoji: '📊' },
      { label: 'Respiratory Rate', desc: 'Breathing rate trends and patterns', href: '/respiratory', emoji: '🌬️' },
      { label: 'Respiratory Patterns', desc: 'Night vs day, DOW trends, hourly & monthly breathing rate analysis', href: '/respiratory/patterns', emoji: '📊' },
      { label: 'Blood Pressure', desc: 'Systolic and diastolic readings over time', href: '/bloodpressure', emoji: '🩺' },
      { label: 'BP Patterns', desc: 'DOW trends, time-of-day, monthly progression & hypertension stage breakdown', href: '/bloodpressure/patterns', emoji: '📊' },
      { label: 'Resting HR Analysis', desc: '6-month RHR trend, fitness classification & HRV correlation', href: '/heartrate/resting', emoji: '🫀' },
      { label: 'Resting HR Patterns', desc: 'Fitness class breakdown, DOW trends, distribution & monthly RHR progression', href: '/heartrate/resting/patterns', emoji: '📊' },
      { label: 'Cardio Health', desc: 'HRV + RHR + VO₂ Max + HR Recovery combined overview', href: '/heartrate/cardio', emoji: '🫀' },
      { label: 'HR Recovery', desc: 'Post-workout HR drop rate & fitness classification', href: '/heartrate/recovery', emoji: '📉' },
      { label: 'Cardiac Events', desc: 'AFib, high, and low heart rate alerts', href: '/cardiac', emoji: '⚡' },
      { label: 'AFib Burden', desc: 'Daily AFib burden %, weekly trend & stroke risk context (iOS 16+)', href: '/afib-burden', emoji: '🫀' },
      { label: 'HR Reserve', desc: 'Karvonen zones, 90-day HRR trend & fitness classification', href: '/heartrate/reserve', emoji: '💜' },
    ],
  },
  {
    title: 'Activity',
    features: [
      { label: 'Steps & Activity', desc: 'Daily step counts, distance, and goals', href: '/steps', emoji: '🚶' },
      { label: 'Step Patterns', desc: 'When you walk most: day-of-week, seasonal & distribution', href: '/steps/patterns', emoji: '📊' },
      { label: 'Calories Burned', desc: 'Active calorie history and trends', href: '/calories', emoji: '🔥' },
      { label: 'Calorie Patterns', desc: 'When you burn most: day-of-week, seasonal & distribution', href: '/calories/patterns', emoji: '📊' },
      { label: 'Floors Climbed', desc: 'Elevation and stair-climbing stats', href: '/floors', emoji: '🏗️' },
      { label: 'Floors Patterns', desc: 'DOW trends, goal streaks, distribution & monthly stair-climbing analysis', href: '/floors/patterns', emoji: '📊' },
      { label: 'Activity Calendar', desc: 'GitHub-style workout heatmap grid', href: '/calendar', emoji: '📅' },
      { label: 'Year View', desc: 'Full year of daily step data at a glance', href: '/year', emoji: '📊' },
      { label: 'Activity Rings', desc: 'Apple Watch ring closure history', href: '/rings', emoji: '⭕' },
      { label: 'Training Load', desc: 'ATL, CTL, and TSB form analysis', href: '/training-load', emoji: '📈' },
      { label: 'Training Patterns', desc: 'DOW distribution, time-of-day, weekly volume & workout type breakdown', href: '/training-load/patterns', emoji: '🗓️' },
      { label: 'Streaks', desc: 'Consecutive days of goal completion', href: '/streaks', emoji: '🔥' },
    ],
  },
  {
    title: 'Workouts',
    features: [
      { label: 'All Workouts', desc: 'Complete workout log and stats', href: '/workouts', emoji: '🏋️' },
      { label: 'Running', desc: 'Pace trends, distance, and VDOT', href: '/running', emoji: '🏃' },
      { label: 'Running Patterns', desc: 'DOW distribution, time-of-day, monthly distance & pace trend', href: '/running/patterns', emoji: '📊' },
      { label: 'Running Efficiency', desc: 'Aerobic efficiency index and HR vs pace trends', href: '/running/efficiency', emoji: '⚡' },
      { label: 'Running Form', desc: 'Cadence, stride & biomechanics analysis', href: '/running/form', emoji: '🦶' },
      { label: 'Pace Zones', desc: '80/20 easy vs hard training distribution', href: '/running/zones', emoji: '⏱️' },
      { label: 'Training Calendar', desc: 'Monthly workout calendar with type coloring', href: '/workouts/calendar', emoji: '🗓️' },
      { label: 'Yearly Progress', desc: '12-month training volume & year-over-year comparison', href: '/workouts/yearly', emoji: '📈' },
      { label: 'Workout Impact', desc: 'How training timing affects HRV recovery', href: '/workouts/impact', emoji: '🔋' },
      { label: 'Cycling', desc: 'Speed, distance, and ride history', href: '/cycling', emoji: '🚴' },
      { label: 'Cycling Patterns', desc: 'DOW distribution, time-of-day, monthly distance & speed trend', href: '/cycling/patterns', emoji: '📊' },
      { label: 'Cycling Progression', desc: '12-month distance & speed trend, elevation, and quarterly breakdown', href: '/cycling/progression', emoji: '📈' },
      { label: 'Cycling Cadence', desc: 'RPM trend, zone distribution & Faria 2005 optimal 85–100 RPM science — Apple Watch Ultra', href: '/cycling/cadence', emoji: '⚙️' },
      { label: 'Stroke Efficiency', desc: 'SWOLF score, distance-per-stroke & stroke rate analysis for pool swimmers', href: '/swimming/stroke', emoji: '🏊' },
      { label: 'Rowing Stroke Rate', desc: 'SPM trend, zone distribution (steady-state to sprint) & power science', href: '/rowing/stroke-rate', emoji: '🚣' },
      { label: 'Running Power', desc: 'Critical power, Z1–Z5 zones, normalized power & trend — Apple Watch Ultra / Stryd', href: '/running/power', emoji: '⚡' },
      { label: 'Cycling Power', desc: 'FTP, Z1–Z7 power zones, power curve & TSS — compatible power meters (iOS 17+)', href: '/cycling/power', emoji: '🔋' },
      { label: 'Stair Speed', desc: 'Ascent & descent speed — validated fall risk indicator, passively captured by iPhone 8+', href: '/stair-speed', emoji: '🪜' },
      { label: 'UV Exposure', desc: 'Daily UV radiation (J/m²), WHO risk categories & Vitamin D synthesis science', href: '/uv-exposure', emoji: '☀️' },
      { label: 'Sleep Apnea', desc: 'AHI trend, severity classification (Normal/Mild/Moderate/Severe) & CPAP context — Apple Watch S9+', href: '/sleep/apnea', emoji: '😴' },
      { label: 'Symptoms Log', desc: 'Manually-logged symptom history — fatigue, headache, chest pain, shortness of breath & more', href: '/symptoms', emoji: '🩺' },
      { label: 'Workout Effort Score', desc: 'Apple\'s 1–10 session effort rating, load trends & 80:20 intensity balance (iOS 17+)', href: '/workouts/effort', emoji: '🔥' },
      { label: 'Cycling Speed', desc: 'Session avg & max speed, zone distribution & 90-day trend (iOS 17+)', href: '/cycling/speed', emoji: '🚴' },
      { label: 'Diving Analytics', desc: 'Underwater depth, water temperature, no-deco limits & dive log — Apple Watch Ultra', href: '/diving', emoji: '🤿' },
      { label: 'Max HR Analysis', desc: 'Observed HRmax from workouts vs. Fox/Tanaka/Nes formulas — calibrate your zones precisely', href: '/heartrate/max', emoji: '❤️' },
      { label: 'Strength Training', desc: 'Session frequency and recovery HRV', href: '/strength', emoji: '💪' },
      { label: 'Strength Patterns', desc: 'DOW distribution, time-of-day, weekly volume & session duration trends', href: '/strength/patterns', emoji: '📊' },
      { label: 'Strength Progression', desc: '12-month volume trend, duration progression & quarterly breakdown', href: '/strength/progression', emoji: '📈' },
      { label: 'HIIT', desc: 'Intensity, frequency, and recovery impact', href: '/hiit', emoji: '⚡' },
      { label: 'HIIT Patterns', desc: 'DOW distribution, time-of-day, weekly volume & heart rate trends', href: '/hiit/patterns', emoji: '📊' },
      { label: 'HIIT Progression', desc: '12-month session frequency, duration trend, calorie burn & quarterly breakdown', href: '/hiit/progression', emoji: '📈' },
      { label: 'Rowing', desc: '500m splits, watts, and distance', href: '/rowing', emoji: '🚣' },
      { label: 'Rowing Patterns', desc: 'DOW distribution, time-of-day, monthly distance & 500m split trend', href: '/rowing/patterns', emoji: '📊' },
      { label: 'Rowing Progression', desc: '12-month 500m split trend, distance growth & first vs last 30 days', href: '/rowing/progression', emoji: '📈' },
      { label: 'Swimming', desc: 'Distance, HR, and session trends', href: '/swimming', emoji: '🏊' },
      { label: 'Swimming Patterns', desc: 'DOW distribution, time-of-day, monthly distance & pace per 100m', href: '/swimming/patterns', emoji: '📊' },
      { label: 'Swimming Progression', desc: '12-month pace trend, distance growth & first vs last 30 days', href: '/swimming/progression', emoji: '📈' },
      { label: 'Hiking', desc: 'Distance, elevation, and pace', href: '/hiking', emoji: '🥾' },
      { label: 'Hiking Patterns', desc: 'DOW distribution, time-of-day, monthly distance & elevation gain', href: '/hiking/patterns', emoji: '📊' },
      { label: 'Hiking Progression', desc: '12-month distance & elevation gain trend, first vs last 30 days & quarterly breakdown', href: '/hiking/progression', emoji: '📈' },
      { label: 'Running Progression', desc: '12-month pace trend, monthly volume & quarterly comparison', href: '/running/progression', emoji: '📈' },
      { label: 'Workout Patterns', desc: 'Day-of-week, time-of-day & weekly volume analysis', href: '/workouts/patterns', emoji: '📆' },
      { label: 'Training Volume History', desc: '52-week stacked sport breakdown, rolling average & weekly table', href: '/workouts/volume', emoji: '📊' },
      { label: 'Zone 2 Training', desc: '52-week aerobic base tracker — Zone 2 minutes by sport with 3h/week target', href: '/zone2', emoji: '💚' },
      { label: 'Training Consistency', desc: 'Session frequency, training days per week, streaks & sport breakdown over 52 weeks', href: '/workouts/consistency', emoji: '🗓️' },
      { label: 'Lifetime Stats', desc: 'All-time totals, milestone badges & year-over-year comparison', href: '/workouts/lifetime', emoji: '🏅' },
      { label: 'Injury Risk Score', desc: 'ACWR, consecutive training days, HRV drop & resting HR elevation', href: '/injury-risk', emoji: '⚠️' },
      { label: 'Fitness Age', desc: 'VO₂ max-based biological fitness age vs chronological age', href: '/fitness-age', emoji: '🧬' },
      { label: 'Training Phases', desc: 'Auto-detect base, build, peak & taper from 52-week volume trend', href: '/periodization', emoji: '📆' },
      { label: 'Monotony & Strain', desc: "Coggan's training science — daily load variety & cumulative stress index", href: '/monotony', emoji: '📉' },
      { label: 'Stress vs Recovery', desc: '12-week scatter: training stress vs HRV recovery quality — quadrant analysis', href: '/stress-recovery', emoji: '⚖️' },
      { label: 'ECG History', desc: 'Apple Watch ECG classification history — sinus rhythm %, AFib burden & monthly trend', href: '/ecg', emoji: '🫀' },
      { label: 'Cardiac Drift', desc: 'HR drift in long runs — first vs second half aerobic fitness measure', href: '/cardiac-drift', emoji: '📈' },
      { label: 'Energy Balance', desc: 'Radar: aerobic base, threshold, VO₂ max, strength & recovery balance score', href: '/energy-balance', emoji: '⚡' },
      { label: 'Walking', desc: 'Pace trends, distance & weekly walking volume', href: '/walking', emoji: '🚶' },
      { label: 'Walking Patterns', desc: 'DOW distribution, time-of-day & monthly distance trend', href: '/walking/patterns', emoji: '📊' },
      { label: 'Yoga & Mind-Body', desc: 'Session frequency, duration, type breakdown & parasympathetic benefit', href: '/yoga', emoji: '🧘' },
      { label: 'Race Goal Planner', desc: '16-week countdown & progressive mileage plan to your target race', href: '/race-planner', emoji: '🏁' },
      { label: 'Walking Heart Rate', desc: 'Passive walking HR as a daily fitness indicator — trend & fitness level', href: '/heartrate/walking', emoji: '🚶‍♂️' },
      { label: 'Stair Climbing', desc: 'Session trends, kcal/min intensity & weekly climbing volume', href: '/stair-climbing', emoji: '🪜' },
      { label: 'Outdoor vs Indoor', desc: 'Environment split by sport, monthly trend & outdoor preference', href: '/outdoor-indoor', emoji: '☀️' },
      { label: 'Elliptical', desc: 'Session volume, calorie burn intensity & duration trend', href: '/elliptical', emoji: '🏋️' },
      { label: 'Golf', desc: 'Distance walked, calories & monthly round frequency', href: '/golf', emoji: '⛳' },
      { label: 'Aerobic Decoupling', desc: 'Pace-to-HR efficiency across long runs — MAF training metric', href: '/aerobic-decoupling', emoji: '📉' },
      { label: 'Cross-Training', desc: 'CrossFit & mixed cardio sessions, intensity & weekly volume', href: '/cross-training', emoji: '🏋️' },
      { label: 'Tennis', desc: 'Match history, calories & monthly session frequency', href: '/tennis', emoji: '🎾' },
      { label: 'HRV Session Recommender', desc: "Today's readiness zone & session suggestions based on HRV vs 30-day baseline", href: '/hrv/recommender', emoji: '🧠' },
      { label: 'VO₂ Max Trend', desc: 'Apple Watch VO₂ max estimates, fitness category & 12-month progression', href: '/vo2max', emoji: '🫁' },
      { label: 'Mindful Minutes', desc: 'Meditation streaks, weekly trend & time-of-day practice pattern', href: '/mindful', emoji: '🧘' },
      { label: 'Soccer', desc: 'Match distance, calorie intensity & monthly session frequency', href: '/soccer', emoji: '⚽' },
      { label: 'Lactate Threshold', desc: 'Estimated LT1 & LT2 from run data — training zones & HR-pace scatter', href: '/lactate', emoji: '🔬' },
      { label: 'Basketball', desc: 'Session history, calorie burn & weekly volume', href: '/basketball', emoji: '🏀' },
      { label: 'Dance & Aerobics', desc: 'Dance, social dance & step training sessions — frequency & calorie trends', href: '/dance', emoji: '💃' },
      { label: 'Racquet Sports', desc: 'Pickleball, badminton, racquetball & squash — sport mix & session history', href: '/racquet', emoji: '🏸' },
      { label: 'Martial Arts & Combat', desc: 'Kickboxing, boxing, martial arts & wrestling — intensity & weekly volume', href: '/martial-arts', emoji: '🥊' },
      { label: 'Jump Rope', desc: 'Skipping sessions, kcal/min intensity & weekly volume', href: '/jump-rope', emoji: '🪢' },
      { label: 'Handwashing', desc: 'Daily handwashing events detected by Apple Watch — streaks & time-of-day', href: '/handwashing', emoji: '🧼' },
      { label: 'Winter Sports', desc: 'Skiing, snowboarding, cross-country & ice skating — seasonal sport history', href: '/winter-sports', emoji: '⛷️' },
      { label: 'Water & Paddle Sports', desc: 'Surfing, paddleboarding, kayaking & water fitness — sessions & sport mix', href: '/water-sports', emoji: '🏄' },
      { label: 'Triathlon', desc: 'Swim/bike/run volume split, brick workout detection & race-type distribution target', href: '/triathlon', emoji: '🏊' },
      { label: 'Open Water Swimming', desc: 'OWS pace per 100m, distance trend & monthly volume', href: '/open-water', emoji: '🌊' },
      { label: 'Functional Strength', desc: 'CrossFit, calisthenics & Olympic lifting — intensity & weekly volume', href: '/functional-strength', emoji: '🏋️' },
      { label: 'Training Polarization', desc: "Seiler's 80/20 model — easy vs hard split across all sports with weekly trend", href: '/polarization', emoji: '🎯' },
      { label: 'Rock Climbing', desc: 'Session duration, calorie intensity & weekly climbing volume', href: '/rock-climbing', emoji: '🧗' },
      { label: 'Volleyball', desc: 'Session frequency, calorie burn & heart rate intensity', href: '/volleyball', emoji: '🏐' },
      { label: 'Critical Speed', desc: "Estimated aerobic-anaerobic threshold from run data — CS, D' & training zones", href: '/critical-speed', emoji: '⚡' },
      { label: 'Running Streaks', desc: 'Current & longest streak, 90-day activity heatmap & weekly frequency', href: '/running/streaks', emoji: '🔥' },
      { label: 'Detraining', desc: 'Training break detection, Mujika-Padilla VO₂ loss curve & retraining time estimates', href: '/detraining', emoji: '📉' },
      { label: 'Gait Analysis', desc: 'Walking speed, step length, asymmetry & double support — passively measured fall & longevity risk metric', href: '/gait', emoji: '🚶' },
      { label: 'State of Mind', desc: 'Mood valence trend, emotional label frequency & life-area associations (iOS 18+)', href: '/state-of-mind', emoji: '🧠' },
      { label: 'Zone Progression', desc: 'Monthly Z1–Z5 evolution, Seiler 80/20 polarization index & aerobic base trend', href: '/zones/progression', emoji: '📊' },
      { label: 'Power-to-Weight', desc: 'FTP W/kg ratio, British Cycling tier classification & weight impact simulator (iOS 17+)', href: '/cycling/power-to-weight', emoji: '⚡' },
      { label: 'Overtraining Warning', desc: 'Composite OTS detector: HRV trend + RHR elevation + ACWR + sleep deficit with Meeusen 2013 science', href: '/overtraining', emoji: '⚠️' },
      { label: 'Oral Hygiene', desc: 'Toothbrushing sessions, streaks, duration & time-of-day — Apple Watch autodetection (Series 5+)', href: '/oral-hygiene', emoji: '🦷' },
      { label: 'Caffeine Analytics', desc: 'Daily intake, 5.5h half-life model, active caffeine at bedtime & sleep impact (Drake 2013)', href: '/caffeine', emoji: '☕' },
      { label: 'Alcohol Tracker', desc: 'Drink count vs WHO guidelines, HRV & RHR next-day impact analysis (Colrain 2014)', href: '/alcohol', emoji: '🍷' },
      { label: 'Functional Fitness Battery', desc: 'VO₂ max + 6-min walk + steadiness + gait speed + stair speed — composite functional age', href: '/functional-fitness', emoji: '🏋️' },
      { label: 'Medication Tracking', desc: 'FHIR clinical medication records, dosage history & HRV/RHR biomarker correlations (iOS 12+)', href: '/medications', emoji: '💊' },
      { label: 'Sleep Regularity Index', desc: 'Day-to-day sleep/wake consistency — Phillips 2021 mortality predictor, 60-night SRI trend', href: '/sleep/regularity', emoji: '🌙' },
      { label: 'Fall Risk Assessment', desc: 'STEADI gait score: gait speed + steadiness + double support + asymmetry + stair speed composite', href: '/fall-risk', emoji: '🛡️' },
      { label: 'Biological Age', desc: 'Multi-biomarker age: HRV age + cardiovascular age + aerobic age + gait age — Levine 2018 PhenoAge', href: '/biological-age', emoji: '🧬' },
      { label: 'Immune Stress Index', desc: 'Illness early warning: HRV drop + RHR elevation + wrist temp deviation + step reduction (iOS 16+)', href: '/immune-stress', emoji: '🛡️' },
      { label: 'Life Expectancy Impact', desc: 'Years gained/lost: VO₂ max + steps + RHR + HRV + sleep vs population — Myers 2002, Paluch 2021', href: '/life-expectancy', emoji: '⏳' },
      { label: 'Social Jet Lag', desc: 'Weekday vs weekend sleep timing mismatch (MSFsc) — Roenneberg 2012, 33% obesity risk per hour', href: '/social-jet-lag', emoji: '✈️' },
      { label: 'Recovery Optimizer', desc: 'Per-session next-morning HRV & RHR recovery scoring by workout type — Buchheit 2014, Plews 2013', href: '/workout-recovery', emoji: '💚' },
      { label: 'Activity Fragmentation', desc: 'How broken-up your movement is throughout the day — Diaz 2017 JAMA active/sedentary transition index', href: '/activity-fragmentation', emoji: '🔀' },
      { label: 'Training Age', desc: 'Years of consistent training — Bompa 2015 Novice/Intermediate/Advanced/Elite classification & sport history', href: '/training-age', emoji: '📅' },
      { label: 'VILPA', desc: 'Vigorous Intermittent Lifestyle Activity — Stamatakis 2022 Nature Medicine: ≥3 bouts/day, 38% mortality reduction', href: '/vilpa', emoji: '⚡' },
      { label: 'Sedentary Breaks', desc: 'Longest sitting streak & break frequency — Biswas 2015 Ann Intern Med: >11hrs/day = 40% mortality risk independent of exercise', href: '/sedentary-breaks', emoji: '🪑' },
      { label: 'Circadian Performance', desc: 'Peak training window from HR efficiency by time-of-day — Chtourou 2012, Kolbe 2019 circadian biology', href: '/circadian-performance', emoji: '🌞' },
      { label: 'Interval Detector', desc: 'Auto-detects interval structure from HR spread in HIIT & running — Buchheit & Laursen 2013 HIIT taxonomy', href: '/interval-detector', emoji: '📊' },
      { label: 'Exercise Snacks', desc: 'Short ≤15-min workout sessions — Gillen 2016 MSSE: 3×10 min = same VO₂ benefit as 45 min continuous', href: '/exercise-snacks', emoji: '⚡' },
      { label: 'Running Cadence', desc: 'Steps per minute trend, 165–175 spm optimal zone — Heiderscheit 2011: higher cadence reduces knee loading 20%', href: '/running/cadence', emoji: '🏃' },
      { label: 'Weekly Balance', desc: '4-dimension scorecard: cardio + strength + flexibility + recovery vs WHO 2020 & ACSM 2022 targets', href: '/weekly-balance', emoji: '⚖️' },
      { label: 'Running Biomechanics', desc: 'Ground contact time, vertical oscillation & stride length — Morin 2011, Tartaruga 2012 (iOS 16+, Watch Ultra/S8+)', href: '/running/biomechanics', emoji: '🦾' },
      { label: 'Audio Exposure', desc: 'Environmental noise & headphone levels — WHO guidelines, daily log & trend', href: '/audio-exposure', emoji: '👂' },
      { label: 'Equestrian Sports', desc: 'Horseback riding, dressage & trail sessions — duration & monthly history', href: '/equestrian', emoji: '🐴' },
      { label: 'HRV Deep Dive', desc: '12-month SDNN trend, ANS balance indicators, monthly averages & science', href: '/hrv/deep-dive', emoji: '💚' },
      { label: 'Resting HR Deep Dive', desc: '12-month RHR trend, AHA fitness classification & day-of-week pattern', href: '/heartrate/resting/deep-dive', emoji: '❤️' },
      { label: 'Sleep Architecture', desc: 'REM, Core & Deep stage breakdown, efficiency & 30-night trends', href: '/sleep/architecture', emoji: '🌙' },
      { label: 'Workout Goals', desc: 'Weekly session target, goal streak & sport breakdown over 13 weeks', href: '/workouts/goals', emoji: '🏆' },
      { label: "Athlete's Heart", desc: '12-month composite: RHR + HRV + VO₂ max adaptation progress & physiology timeline', href: '/athletes-heart', emoji: '❤️‍🔥' },
      { label: 'PAI Score', desc: 'NTNU weekly fitness score — time in HR zones vs 100 PAI longevity target', href: '/pai', emoji: '🏃' },
      { label: 'Running Pacing', desc: 'Negative splits, pacing consistency (CV) & within-run speed analysis', href: '/running/pacing', emoji: '⏱️' },
      { label: 'Cardio Fitness Trajectory', desc: 'VO₂ max rate of change, 6-month projection & adaptation science', href: '/vo2max/trajectory', emoji: '📈' },
      { label: 'VO₂ Max vs Age Norms', desc: 'Compare VO₂ max against HUNT study age-group percentiles & fitness age estimate', href: '/vo2max/norms', emoji: '🫁' },
      { label: 'Cycle-Synced Training', desc: 'Current menstrual phase, science-backed training tips & performance by phase', href: '/cycle/training', emoji: '🌸' },
      { label: 'Breathing Rate', desc: '30-day trend, baseline comparison & illness signal detection', href: '/respiratory/deep-dive', emoji: '🌬️' },
      { label: 'Blood Oxygen Deep Dive', desc: '30-day SpO₂ trend, nighttime avg, low alerts & reference ranges', href: '/oxygen/deep-dive', emoji: '🫁' },
      { label: 'Pilates & Barre', desc: 'Pilates, barre, flexibility & core training — type mix, duration & mind-body benefits', href: '/pilates', emoji: '🧘' },
      { label: 'Temperature Insights', desc: 'Illness signal detection, cycle correlation & 30-day wrist temperature deviation trend', href: '/temperature/insights', emoji: '🌡️' },
      { label: 'Daily Readiness', desc: 'Composite 0–100 score from HRV, resting HR & sleep — training recommendations by zone', href: '/ready', emoji: '🎯' },
      { label: 'Exercise Minutes', desc: 'WHO 150 min/week goal tracker — 52-week history, streak & day-of-week pattern', href: '/exercise-minutes', emoji: '🏃' },
      { label: 'Floors Climbed', desc: 'Daily stair climbing trend, 10-floor goal streak & cardiovascular evidence', href: '/floors/deep-dive', emoji: '🏗️' },
      { label: 'Standing Hours', desc: 'Daily stand hours, 12-hour goal streak, hourly pattern & sedentary science', href: '/standing', emoji: '🧍' },
      { label: '6-Min Walk Test', desc: 'Apple\'s estimated functional fitness distance — 90-day trend & age-group norms', href: '/six-minute-walk', emoji: '🚶' },
      { label: 'Active Energy', desc: 'Move ring calories, weekly totals, day-of-week patterns & Harvard Alumni energy science', href: '/active-energy', emoji: '🔥' },
      { label: 'Basal Metabolic Rate', desc: 'Apple Watch BMR trend, Mifflin-St Jeor formula & TDEE estimate by activity level', href: '/metabolic-rate', emoji: '🔥' },
      { label: 'Workout Efficiency', desc: 'kcal/min by type — compare intensity across all sports', href: '/workouts/efficiency', emoji: '⚡' },
      { label: 'Race Predictor', desc: 'Predict race times with Riegel formula', href: '/race-predictor', emoji: '🏁' },
      { label: 'Workout Variety', desc: 'Balance across workout types', href: '/variety', emoji: '🎨' },
      { label: 'Personal Records', desc: 'All-time bests across every metric', href: '/records', emoji: '🏆' },
      { label: 'Achievements', desc: 'Milestones and badges earned', href: '/achievements', emoji: '🎖️' },
    ],
  },
  {
    title: 'Sleep',
    features: [
      { label: 'Sleep Analysis', desc: 'Stages, quality, and 30-night trends', href: '/sleep', emoji: '😴' },
      { label: 'Sleep Patterns', desc: 'When you sleep best: day-of-week, seasonal & duration histogram', href: '/sleep/patterns', emoji: '🌙' },
      { label: 'Sleep Stages', desc: 'Deep, REM, core & awake breakdown', href: '/sleep/stages', emoji: '🌊' },
      { label: 'Sleep Efficiency', desc: 'Time asleep vs time in bed (CBT-I)', href: '/sleep/efficiency', emoji: '💯' },
      { label: 'Sleep Schedule', desc: 'Bedtime consistency and chronotype', href: '/sleep/schedule', emoji: '🕐' },
      { label: 'Sleep Debt', desc: 'Cumulative debt, repayment tracking', href: '/sleep/debt', emoji: '💤' },
      { label: 'Sleep Breathing', desc: 'Overnight respiratory rate & SpO₂ patterns', href: '/sleep/breathing', emoji: '🌬️' },
      { label: 'Chronotype', desc: 'Early bird vs night owl + social jet lag', href: '/sleep/chronotype', emoji: '🦉' },
      { label: 'Sleep Impact', desc: 'How sleep duration shapes next-day HRV & activity', href: '/sleep/impact', emoji: '⚡' },
      { label: 'Sleep Quality Score', desc: 'Nightly 0–100 score: duration + stages + efficiency', href: '/sleep/score', emoji: '⭐' },
      { label: 'Wrist Temperature', desc: 'Nightly skin temperature deviations', href: '/temperature', emoji: '🌡️' },
      { label: 'Temperature Insights', desc: 'HRV correlation & illness signal detection', href: '/temperature/insights', emoji: '🔬' },
    ],
  },
  {
    title: 'Body & Composition',
    features: [
      { label: 'Body Weight', desc: 'Weight trends and body fat percentage', href: '/body', emoji: '⚖️' },
      { label: 'Body Weight Trends', desc: 'Rate of change, DOW patterns, monthly progression & body fat tracking', href: '/body/trends', emoji: '📉' },
      { label: 'Weight Patterns', desc: 'Monthly averages, day-of-week deviations, rate of change & body fat trends', href: '/body/patterns', emoji: '📊' },
      { label: 'VO₂ Max', desc: 'Cardiorespiratory fitness trend', href: '/vo2max', emoji: '🫀' },
      { label: 'VO₂ Max Patterns', desc: 'Monthly progression, fitness level history & 2-year trend', href: '/vo2max/patterns', emoji: '📊' },
      { label: 'Glucose', desc: 'Blood glucose readings over time', href: '/glucose', emoji: '🩸' },
      { label: 'Glucose Patterns', desc: 'Time-in-range, DOW trends, time-of-day & monthly glucose progression', href: '/glucose/patterns', emoji: '📊' },
      { label: 'Walking Steadiness', desc: 'Gait stability score, fall risk & 90-day trend', href: '/walking-steadiness', emoji: '🚶' },
      { label: 'Steadiness Patterns', desc: 'DOW trends, zone history & monthly gait stability progression', href: '/walking-steadiness/patterns', emoji: '📊' },
      { label: 'Mobility', desc: 'Flexibility and mobility tracking', href: '/mobility', emoji: '🤸' },
      { label: 'Cycle Tracking', desc: 'Menstrual phase analysis & cycle-synced training recommendations', href: '/cycle', emoji: '📅' },
    ],
  },
  {
    title: 'Nutrition & Lifestyle',
    features: [
      { label: 'Nutrition', desc: 'Meal logging and daily calorie intake', href: '/nutrition', emoji: '🥗' },
      { label: 'Nutrition Patterns', desc: 'When you eat most: macro split, DOW trends & calorie distribution', href: '/nutrition/patterns', emoji: '📊' },
      { label: 'Macros', desc: 'Protein, carbs, and fat breakdown', href: '/macros', emoji: '📊' },
      { label: 'Hydration', desc: 'Daily water intake and targets', href: '/water', emoji: '💧' },
      { label: 'Hydration Patterns', desc: 'When you drink most: day-of-week, monthly & goal streaks', href: '/water/patterns', emoji: '📊' },
      { label: 'Fasting', desc: 'Intermittent fasting sessions and streaks', href: '/fasting', emoji: '⏳' },
      { label: 'Fasting Insights', desc: 'Protocol breakdown, streaks, duration trends & timing analysis', href: '/fasting/insights', emoji: '📊' },
      { label: 'Mindfulness', desc: 'Meditation and mindfulness minutes', href: '/mindfulness', emoji: '🧘' },
      { label: 'Mindfulness Patterns', desc: 'When you meditate most: DOW trends, session duration & monthly volume', href: '/mindfulness/patterns', emoji: '📊' },
      { label: 'Mindfulness Impact', desc: 'How meditation sessions affect next-day HRV and recovery', href: '/mindfulness/impact', emoji: '✨' },
      { label: 'Daylight', desc: 'Time in natural light per day', href: '/daylight', emoji: '☀️' },
      { label: 'Daylight Patterns', desc: 'When you get most sunlight: DOW trends, seasonal analysis & goal achievement', href: '/daylight/patterns', emoji: '📊' },
      { label: 'Hearing Health', desc: 'Noise exposure and headphone audio', href: '/hearing', emoji: '👂' },
      { label: 'Hearing Patterns', desc: 'DOW noise trends, time-of-day, headphone vs environment & monthly exposure', href: '/hearing/patterns', emoji: '📊' },
    ],
  },
  {
    title: 'Analytics & Insights',
    features: [
      { label: 'Health Timeline', desc: 'Chronological feed of workouts, sleep & key events', href: '/timeline', emoji: '📜' },
      { label: "Today's Readiness", desc: 'HRV + sleep + load → training recommendation', href: '/ready', emoji: '🎯' },
      { label: 'Training Advisor', desc: 'HRV-guided weekly training plan', href: '/training-advisor', emoji: '🧠' },
      { label: 'Vitality Score', desc: 'Multi-metric longevity index', href: '/longevity', emoji: '⭐' },
      { label: 'Weekly Report', desc: 'This week vs last week comparison', href: '/week', emoji: '📅' },
      { label: 'Health Score', desc: 'Composite daily health score', href: '/score', emoji: '🌟' },
      { label: 'Recovery & Strain', desc: 'Training stress and recovery balance', href: '/recovery', emoji: '⚡' },
      { label: 'Trends', desc: 'Long-term patterns across metrics', href: '/trends', emoji: '📉' },
      { label: 'Correlations', desc: 'How your metrics influence each other', href: '/correlations', emoji: '🔗' },
      { label: 'Compare Weeks', desc: 'This week vs last week comparison', href: '/compare', emoji: '↔️' },
      { label: 'Monthly Review', desc: 'Month-by-month summary view', href: '/monthly', emoji: '📆' },
      { label: 'Year in Review', desc: 'Annual health highlights and records', href: '/year', emoji: '🎊' },
      { label: 'Habits', desc: 'Daily habit tracking with streaks', href: '/habits', emoji: '🎯' },
      { label: 'Daily Check-in', desc: 'Log energy, mood, and stress each day', href: '/checkin', emoji: '📋' },
      { label: 'Check-in Patterns', desc: 'When you feel best: DOW mood trends, stress peaks & score distributions', href: '/checkin/patterns', emoji: '📊' },
      { label: 'Fitness Profile', desc: '6-dimension health fingerprint: HRV, sleep, activity, cardiac, recovery & VO₂', href: '/fitness-profile', emoji: '🎯' },
      { label: 'Performance Overview', desc: 'Cross-sport year-over-year comparison: pace, volume, sessions & cardiovascular markers', href: '/performance', emoji: '📊' },
      { label: 'AI Insights', desc: 'Claude-powered health analysis', href: '/insights', emoji: '✨' },
      { label: 'Smart Nudges', desc: 'Algorithmic health recommendations from your data', href: '/nudges', emoji: '🎯' },
      { label: 'Health Heatmap', desc: '90-day multi-metric grid: steps, sleep, HRV, calories & recovery', href: '/heatmap', emoji: '🗓️' },
      { label: 'Sync Status', desc: 'Data coverage and device health', href: '/sync', emoji: '🔄' },
    ],
  },
]

export default async function ExplorePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Explore</h1>
            <p className="text-sm text-text-secondary">All analytics and insights</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">
              {section.title}
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {section.features.map((feature) => (
                <Link
                  key={feature.href}
                  href={feature.href}
                  className="flex items-start gap-3 p-3 bg-surface rounded-xl border border-border hover:bg-surface-secondary transition-colors"
                >
                  <span className="text-xl shrink-0 mt-0.5">{feature.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary leading-tight">
                      {feature.label}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5 leading-tight opacity-70">
                      {feature.desc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}

        <div className="pt-2 pb-4 text-center text-xs text-text-secondary opacity-40">
          {SECTIONS.reduce((n, s) => n + s.features.length, 0)} analytics pages
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
