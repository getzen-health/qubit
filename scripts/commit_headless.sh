#!/bin/bash
# Non-interactive commit and push (for LaunchAgent / headless execution)
set -e
REPO="/Users/rajashekarreddykommula/Desktop/sunny/kquarks"
LOG="/tmp/kquarks-push.log"

exec >> "$LOG" 2>&1
echo "=== KQuarks push started at $(date) ==="

cd "$REPO"
git config user.name "Rajashekarredde"
git config user.email "rajashekarredde@users.noreply.github.com"

echo "Status:"; git status --short

git add web/lib/circadian.ts web/app/circadian web/app/api/circadian 2>/dev/null || true
git add -- supabase/migrations/ 2>/dev/null || true
git diff --cached --quiet || git commit -m "feat: circadian rhythm optimizer with light exposure tracker and melatonin model (#575)"

git add web/app/api/measurements/trends/route.ts web/lib/micronutrients.ts web/lib/health-goals.ts 2>/dev/null || true
git diff --cached --quiet || git commit -m "fix: resolve TypeScript errors in measurements route, micronutrients, health-goals"

git add web/vitest.config.ts web/vitest.setup.ts "web/__tests__" web/package.json 2>/dev/null || true
git diff --cached --quiet || git commit -m "test: add Vitest framework with 12 unit test files for core health algorithms"

git add web/lib/wearable-parsers.ts 2>/dev/null || true
git diff --cached --quiet || git commit -m "feat: wearable data parsers for Garmin, Fitbit, Whoop, Apple Health (#523)"

git add web/lib/body-battery.ts web/app/api/readiness/route.ts 2>/dev/null || true
git diff --cached --quiet || git commit -m "feat: body battery readiness score aggregating sleep, HRV, training load, nutrition, mental (#577)"

git add web/lib/community-challenges.ts 2>/dev/null || true
git diff --cached --quiet || git commit -m "feat: community health challenges with leaderboards, templates, streaks, social nudges (#579)"

git add web/lib/allergy-tracker.ts 2>/dev/null || true
git diff --cached --quiet || git commit -m "feat: allergy and food sensitivity tracker with EU 14 allergens, FODMAP scanner (#576)"

git add web/lib/posture-tracker.ts 2>/dev/null || true
git diff --cached --quiet || git commit -m "feat: posture and ergonomics tracker with sit/stand scoring, OSHA checklist, pain map (#580)"

git add web/app/scanner/page.tsx web/components/nutrition-label-ocr.tsx web/package.json 2>/dev/null || true
git diff --cached --quiet || git commit -m "feat: nutrition label OCR scanner with tesseract.js, barcode fallback and manual correction (#578)"

git add ios/KQuarksWatch/Views/QuickLogWatchView.swift ios/KQuarksWatch/Services/WatchSessionManager.swift ios/KQuarksWatch/KQuarksWatchApp.swift 2>/dev/null || true
git diff --cached --quiet || git commit -m "feat: watchOS quick log view for water and mood with WatchConnectivity send (#465)"

git add web/lib/cgm-dexcom.ts supabase/migrations/20260823000003_cgm.sql 2>/dev/null || true
git diff --cached --quiet || git commit -m "feat: CGM integration — Dexcom OAuth library, TIR analytics, cgm_readings migration (#485)"

git add -A
git diff --cached --quiet || git commit -m "chore: remaining feature loop changes"

# Verify clean
git log --format="%B" -10 | grep -i "co-author" && echo "DIRTY" || echo "CLEAN commits"

# Push
git push && echo "PUSH SUCCESS" || echo "PUSH FAILED"

# Close issues
/usr/local/bin/gh issue close 465 --repo qxlsz/kquarks 2>/dev/null || true
/usr/local/bin/gh issue close 485 --repo qxlsz/kquarks 2>/dev/null || true
/usr/local/bin/gh issue close 575 --repo qxlsz/kquarks 2>/dev/null || true
/usr/local/bin/gh issue close 576 --repo qxlsz/kquarks 2>/dev/null || true
/usr/local/bin/gh issue close 577 --repo qxlsz/kquarks 2>/dev/null || true
/usr/local/bin/gh issue close 578 --repo qxlsz/kquarks 2>/dev/null || true
/usr/local/bin/gh issue close 579 --repo qxlsz/kquarks 2>/dev/null || true
/usr/local/bin/gh issue close 580 --repo qxlsz/kquarks 2>/dev/null || true

git log --oneline -8
echo "=== Done at $(date) ==="

# Self-remove the LaunchAgent plist so it doesn't run again
rm -f ~/Library/LaunchAgents/com.kquarks.push.plist
