#!/bin/bash
# KQuarks — Commit & Push
# Double-click this file in Finder to run it.
# Or right-click → Open With → Terminal

cd /Users/rajashekarreddykommula/Desktop/sunny/kquarks

git config user.name "Rajashekarredde"
git config user.email "rajashekarredde@users.noreply.github.com"

echo "=== Uncommitted files ==="
git status --short

# Group A — Circadian
git add web/lib/circadian.ts web/app/circadian web/app/api/circadian supabase/migrations/*circadian* 2>/dev/null; true
git diff --cached --quiet || git commit -m "feat: circadian rhythm optimizer with light exposure tracker and melatonin model (#575)"

# Group B — TS fixes
git add web/app/api/measurements/trends/route.ts web/lib/micronutrients.ts web/lib/health-goals.ts web/app/micronutrients web/app/cognitive web/app/food-diary 2>/dev/null; true
git diff --cached --quiet || git commit -m "fix: resolve TypeScript errors in measurements route, micronutrients, health-goals"

# Group C — Vitest
git add web/vitest.config.ts web/vitest.setup.ts "web/__tests__" web/package.json 2>/dev/null; true
git diff --cached --quiet || git commit -m "test: add Vitest framework with 12 unit test files for core health algorithms"

# Group D — Wearable parsers
git add web/lib/wearable-parsers.ts 2>/dev/null; true
git diff --cached --quiet || git commit -m "feat: wearable data parsers for Garmin, Fitbit, Whoop, Apple Health (#523)"

# Group E — Body battery + readiness route upgrade
git add web/lib/body-battery.ts supabase/migrations/20260823000001_body_battery.sql web/app/api/readiness/route.ts 2>/dev/null; true
git diff --cached --quiet || git commit -m "feat: body battery readiness score aggregating sleep, HRV, training load, nutrition, mental (#577)"

# Group G — Posture tracker (#580)
git add web/lib/posture-tracker.ts supabase/migrations/20260823000002_posture.sql 2>/dev/null; true
git diff --cached --quiet || git commit -m "feat: posture and ergonomics tracker with sit/stand scoring, OSHA desk checklist, pain map (#580)"

# Group H — Allergy tracker (#576)
git add web/lib/allergy-tracker.ts 2>/dev/null; true
git diff --cached --quiet || git commit -m "feat: allergy and food sensitivity tracker with EU 14 allergens, FODMAP scanner, elimination diet protocol (#576)"

# Group I — Everything else
git add -A
git diff --cached --quiet || git commit -m "chore: remaining feature loop changes"

# Verify no Co-authored-by
echo ""
echo "=== Checking commits are clean ==="
git log --format="%B" -10 | grep -i "co-author" && echo "❌ DIRTY - Co-authored-by found!" || echo "✅ CLEAN - no Co-authored-by"

# Push
echo ""
echo "=== Pushing to remote ==="
git push && echo "✅ Pushed successfully" || echo "❌ Push failed"

# Close GitHub issues
echo ""
echo "=== Closing GitHub issues ==="
gh issue close 575 2>/dev/null && echo "✅ Closed #575" || echo "(#575 already closed or error)"
gh issue close 577 2>/dev/null && echo "✅ Closed #577" || echo "(#577 already closed or error)"

gh issue close 576 2>/dev/null && echo "✅ Closed #576" || echo "(#576 already closed or error)"
gh issue close 580 2>/dev/null && echo "✅ Closed #580" || echo "(#580 already closed or error)"

# Final log
echo ""
echo "=== Recent commits ==="
git log --oneline -8

echo ""
echo "All done! You can close this window."
read -p "Press Enter to close..."
