# KQuarks Autoresearch Goal

> "Set the GOAL → Claude runs the LOOP → Results appear."
> Inspired by jmilinovich/goal-md + uditgoenka/autoresearch

## Fitness Function

```bash
bash scripts/code-quality-score.sh --metric score
```

Lower is better. Target: **0**.

Current baseline: **334** (as of 2026-03-24)

## Metrics & Weights

| Metric | Weight | What it measures |
|--------|--------|-----------------|
| Force-unwraps on optionals | ×15 | `calendar.date(from:)!` etc — crash risk |
| Hardcoded chart Y-scale domains | ×5 | `.chartYScale(domain: 0...100)` static |
| `isLoading = false` init | ×3 | Views that flash empty before loading |
| Silent `try?` in services | ×8 | Errors swallowed, user gets no feedback |
| Web API missing error handling | ×6 | Supabase calls ignoring errors |
| ForEach `$binding` anti-pattern | ×20 | `ForEach($items)` causes Plottable/binding errors |

## Action Catalog (ranked by impact)

### High Impact
- **Fix silent try? in HealthKitService** — ~40 pts (5 occurrences × 8)
- **Fix silent try? in SyncService** — ~56 pts (7 occurrences × 8)
- **Fix silent try? in SupabaseService** — ~88 pts (11 occurrences × 8)
- **Make 5 chart domains dynamic** — ~25 pts per batch

### Medium Impact
- **Fix isLoading=false in remaining ViewModels** — 12 pts total
- **Add error handling to web API routes** — 18 pts total

### Low Impact (cleanup)
- **Remaining hardcoded chart domains** — 5 pts each

## Loop Operating Mode

**Default: Continuous** — runs until score reaches 0 or 10 consecutive iterations without improvement.

**Guard (must always pass):**
```bash
# Build must not introduce new Swift syntax errors
grep -rn --include="*.swift" "var body" ios/KQuarks/Views/ | wc -l
# (count must remain stable — views must not be deleted)
```

Guard: ForEach must never use $binding syntax on non-ObservableObject arrays
Guard: .enumerated() ForEach closures must use explicit tuple parens (offset, item)

## Convergence Criteria

- Score reaches 0 → complete
- 10 consecutive iterations without improvement → surface to human
- Score increases (regression) → auto-revert and try different approach

## Results Log

`scripts/autoresearch-results.tsv` — one row per iteration:
```
iteration	commit	score	delta	status	description
```
