# /autoresearch — GetZen Autonomous Code Quality Loop

Runs the 8-phase autoresearch loop against `scripts/code-quality-score.sh`.
Each iteration: identify → change → commit → verify → keep or revert → log → repeat.

Inspired by uditgoenka/autoresearch + jmilinovich/goal-md patterns.

---

## Setup (run once at start)

1. Read `GOAL.md` to understand the fitness function, metrics, and action catalog.
2. Run `bash scripts/code-quality-score.sh` to establish baseline score.
3. Read `scripts/autoresearch-results.tsv` if it exists (learn from prior iterations).
4. Read `git log --oneline -20` to see recent changes and avoid re-doing fixed work.
5. Confirm scope: Swift files in `ios/GetZen/`, TypeScript in `web/`.
6. Print: "Baseline: {score}. Starting loop. Target: 0."

## The 8-Phase Loop

Repeat until score = 0 OR 10 consecutive iterations with no improvement:

### Phase 1 — Review state
- Re-read `scripts/autoresearch-results.tsv` for prior iteration results
- Re-read `git log --oneline -5` for recent commits
- Note what worked (score went down), what failed (reverted), what was untried

### Phase 2 — Pick next change
- Choose ONE issue from the Action Catalog in `GOAL.md` (highest impact first)
- Prefer issues not yet attempted, or variations of near-misses
- Think: which single atomic change will reduce the score the most?

### Phase 3 — Make ONE focused change
- Read the target file(s) fully before editing
- Make exactly ONE type of fix (e.g., only fix `try?` in one service file)
- Never fix multiple unrelated issues in the same iteration
- Keep the change minimal — do not refactor surrounding code

### Phase 4 — Commit before verification
- Stage only the changed files (never `git add -A`)
- Commit with prefix `experiment: <description>`
- CLAUDE.md rule: NO "Co-Authored-By" lines

### Phase 5 — Run mechanical verification
```bash
bash scripts/code-quality-score.sh
```
- Extract the SCORE: line
- Compare to previous iteration score

### Phase 6 — Keep or revert
- **If score decreased (improved):** keep the commit, log `keep`
- **If score unchanged:** keep if the change removed a genuine issue (metric may not have captured it), log `neutral`
- **If score increased (regression):** `git revert HEAD --no-edit`, log `revert`
- **If error/crash:** `git revert HEAD --no-edit`, log `error: <reason>`

### Phase 7 — Log result
Append one row to `scripts/autoresearch-results.tsv`:
```
{N}\t{commit_hash}\t{score}\t{delta}\t{status}\t{one-line description}
```
If the file doesn't exist yet, create it with a header row first:
```
iteration	commit	score	delta	status	description
```
Then commit the TSV update: `git add scripts/autoresearch-results.tsv && git commit -m "log: iteration {N} score={score} ({status})"`

### Phase 8 — Repeat
- Print progress: `[Iteration {N}] Score: {score} (Δ{delta}) — {status}`
- Every 5 iterations, print a summary of score trend
- If stuck (3+ reverts in a row), try a completely different metric category
- If score = 0, print "🎯 Target reached!" and stop
- If 10 consecutive no-improvement iterations, print current score and surface to human

## Push After Each Batch

After every 5 kept commits (not reverts), push to remote:
```bash
git push origin main
```
If push fails (upstream diverged), run `git pull --rebase origin main` then push.

## Rules (never break these)

1. **One change per iteration** — atomic and debuggable
2. **Read before write** — always read the full file before editing
3. **Git is memory** — read log before each iteration
4. **Mechanical verification only** — the script's number is truth
5. **Auto-revert on regression** — never keep a change that raised the score
6. **No Co-Authored-By** — per CLAUDE.md
7. **No unrelated cleanup** — fix only what reduces the score metric
8. **Guard: never delete views** — view count in `ios/GetZen/Views/` must not decrease

## When Stuck

- Re-read `GOAL.md` action catalog
- Try a different metric category (switch from charts to services or vice versa)
- Look at the `scripts/autoresearch-results.tsv` for patterns in what failed
- Consider a smaller, more targeted change within the same category
- If genuinely stuck after 3 attempts at a category, skip it and try another
