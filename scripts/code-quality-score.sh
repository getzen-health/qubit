#!/bin/bash
# KQuarks Code Quality Score
# Returns a composite score where lower = better, target = 0.
# Inspired by jmilinovich/goal-md fitness function pattern.
#
# Usage: bash scripts/code-quality-score.sh
#        bash scripts/code-quality-score.sh --json
#        bash scripts/code-quality-score.sh --metric score

set -euo pipefail

VIEWS="ios/KQuarks/Views"
SERVICES="ios/KQuarks/Services"
VIEWMODELS="ios/KQuarks/ViewModels"
WEB="web"

cd "$(git rev-parse --show-toplevel)"

# ── Metric 1: Force-unwraps on optional date/collection ops (crash risk) ────────
# Match patterns like calendar.date(...)!, array.first!, dictionary[key]!
force_unwraps=$(grep -rn --include="*.swift" \
  -E 'calendar\.(date|dateComponents)\([^)]+\)!' \
  "$VIEWS" 2>/dev/null | grep -vc '^\s*//' || true)

# ── Metric 2: Hardcoded chart Y-scale domains (not data-driven) ─────────────────
# Match .chartYScale(domain: <number>...<number>) — static literals only
hardcoded_charts=$(grep -rn --include="*.swift" \
  -E '\.chartYScale\(domain:\s*[0-9]' \
  "$VIEWS" 2>/dev/null | grep -vc 'max\|min\|var \|let \|Double\|computed' || true)

# ── Metric 3: isLoading initialized to false (causes empty-content flash) ────────
loading_false=$(grep -rn --include="*.swift" \
  -E 'var isLoading\s*=\s*false' \
  "$VIEWS" "$VIEWMODELS" 2>/dev/null | grep -vc '^\s*//' || true)

# ── Metric 4: Silent try? in service calls (swallows errors from user) ───────────
silent_errors=$(grep -rn --include="*.swift" \
  -E 'try\?' \
  "$SERVICES" 2>/dev/null | grep -vc '^\s*//' || true)

# ── Metric 5: Missing error handling in web API routes ───────────────────────────
web_missing_errors=$(grep -rn --include="*.ts" --exclude-dir=node_modules \
  -E 'await supabase\.(from|rpc)\(' \
  "$WEB" 2>/dev/null | grep -vc 'error\|Error\|catch\|\.error' || true)

# ── Metric 6: ForEach $binding anti-pattern (causes Plottable errors) ────────────
foreach_binding=$(grep -rn --include="*.swift" \
  -E 'ForEach\(\$[a-zA-Z]|\{ \$[a-zA-Z]+[[:space:]]in' \
  "$VIEWS" 2>/dev/null | grep -vc '^\s*//' || true)

# ── Composite score (weights reflect crash/UX severity) ─────────────────────────
score=$(( force_unwraps * 15 + hardcoded_charts * 5 + loading_false * 3 + silent_errors * 8 + web_missing_errors * 6 + foreach_binding * 20 ))

if [[ "${1:-}" == "--json" ]]; then
  echo "{\"force_unwraps\":$force_unwraps,\"hardcoded_charts\":$hardcoded_charts,\"loading_false\":$loading_false,\"silent_errors\":$silent_errors,\"web_missing_errors\":$web_missing_errors,\"foreach_binding\":$foreach_binding,\"score\":$score}"
  exit 0
fi

if [[ "${1:-}" == "--metric" && "${2:-}" == "score" ]]; then
  echo "$score"
  exit 0
fi

echo "╔══════════════════════════════════════════════╗"
echo "║       KQuarks Code Quality Score             ║"
echo "╠══════════════════════════════════════════════╣"
printf "║  Force-unwraps (×15):    %4d  →  %5d pts ║\n" "$force_unwraps" "$((force_unwraps * 15))"
printf "║  Hardcoded charts (×5):  %4d  →  %5d pts ║\n" "$hardcoded_charts" "$((hardcoded_charts * 5))"
printf "║  isLoading=false (×3):   %4d  →  %5d pts ║\n" "$loading_false" "$((loading_false * 3))"
printf "║  Silent try? (×8):       %4d  →  %5d pts ║\n" "$silent_errors" "$((silent_errors * 8))"
printf "║  Web missing errors(×6): %4d  →  %5d pts ║\n" "$web_missing_errors" "$((web_missing_errors * 6))"
printf "║  ForEach \$binding (×20):  %4d  →  %5d pts ║\n" "$foreach_binding" "$((foreach_binding * 20))"
echo "╠══════════════════════════════════════════════╣"
printf "║  TOTAL SCORE: %-6d  (target: 0)          ║\n" "$score"
echo "╚══════════════════════════════════════════════╝"
echo "SCORE:$score"
