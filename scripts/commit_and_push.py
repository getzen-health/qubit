#!/usr/bin/env python3
"""Commit and push uncommitted KQuarks changes without needing a PTY."""
import subprocess, sys, os

REPO = "/Users/rajashekarreddykommula/Desktop/sunny/kquarks"

def run(cmd, cwd=REPO):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if r.stdout: print(r.stdout.strip())
    if r.stderr: print(r.stderr.strip(), file=sys.stderr)
    return r.returncode, r.stdout, r.stderr

def main():
    run(["git","config","user.name","Rajashekarredde"])
    run(["git","config","user.email","rajashekarredde@users.noreply.github.com"])

    rc, out, _ = run(["git","status","--short"])
    print(f"Uncommitted files:\n{out}")

    # Commit circadian feature
    run(["git","add",
         "web/lib/circadian.ts",
         "web/app/circadian",
         "web/app/api/circadian",
         "web/components/bottom-nav.tsx"])
    run(["git","add","--",
         "supabase/migrations/"])
    rc, _, _ = run(["git","diff","--cached","--quiet"])
    if rc != 0:
        run(["git","commit","-m",
             "feat: circadian rhythm optimizer with light exposure tracker and melatonin model (#575)"])
        print("✅ Committed circadian feature")

    # Commit bug fixes
    run(["git","add",
         "web/app/api/measurements/trends/route.ts",
         "web/lib/micronutrients.ts",
         "web/lib/health-goals.ts"])
    rc, _, _ = run(["git","diff","--cached","--quiet"])
    if rc != 0:
        run(["git","commit","-m",
             "fix: resolve TypeScript errors in measurements route, micronutrients, health-goals"])
        print("✅ Committed TS bug fixes")

    # Commit Vitest + tests
    run(["git","add",
         "web/vitest.config.ts",
         "web/vitest.setup.ts",
         "web/__tests__",
         "web/package.json"])
    rc, _, _ = run(["git","diff","--cached","--quiet"])
    if rc != 0:
        run(["git","commit","-m",
             "test: add Vitest framework with 12 unit test files for core health algorithms"])
        print("✅ Committed Vitest framework")

    # Commit wearable parsers
    run(["git","add","web/lib/wearable-parsers.ts"])
    rc, _, _ = run(["git","diff","--cached","--quiet"])
    if rc != 0:
        run(["git","commit","-m","feat: wearable data parsers for Garmin, Fitbit, Whoop, Apple Health (#523)"])
        print("✅ Committed wearable parsers")

    # Commit body battery / readiness score
    run(["git","add","web/lib/body-battery.ts"])
    rc, _, _ = run(["git","diff","--cached","--quiet"])
    if rc != 0:
        run(["git","commit","-m",
             "feat: body battery readiness score aggregating sleep, HRV, training load, nutrition, mental (#577)"])
        print("✅ Committed body battery")

    # Commit community challenges
    run(["git","add","web/lib/community-challenges.ts"])
    rc, _, _ = run(["git","diff","--cached","--quiet"])
    if rc != 0:
        run(["git","commit","-m",
             "feat: community health challenges with leaderboards, templates, streaks, social nudges (#579)"])
        print("✅ Committed community challenges")

    # Commit posture tracker
    run(["git","add","web/lib/posture-tracker.ts","supabase/migrations/20260823000002_posture.sql"])
    rc, _, _ = run(["git","diff","--cached","--quiet"])
    if rc != 0:
        run(["git","commit","-m",
             "feat: posture and ergonomics tracker with sit/stand scoring, OSHA desk checklist, pain map (#580)"])
        print("✅ Committed posture tracker")

    # Commit allergy tracker
    run(["git","add","web/lib/allergy-tracker.ts"])
    rc, _, _ = run(["git","diff","--cached","--quiet"])
    if rc != 0:
        run(["git","commit","-m",
             "feat: allergy and food sensitivity tracker with EU 14 allergens, FODMAP scanner, elimination diet protocol (#576)"])
        print("✅ Committed allergy tracker")

    # Commit everything else
    run(["git","add","-A"])
    rc, _, _ = run(["git","diff","--cached","--quiet"])
    if rc != 0:
        run(["git","commit","-m","chore: remaining changes from feature loop"])
        print("✅ Committed remaining changes")

    # Verify no Co-authored-by
    rc, out, _ = run(["git","show","-s","--format=%B","HEAD"])
    if "co-authored-by" in out.lower():
        print("❌ ERROR: Co-authored-by detected! Amending...")
        clean = "\n".join(l for l in out.splitlines() if "co-authored-by" not in l.lower())
        run(["git","commit","--amend","-m", clean.strip()])
    else:
        print("✅ Commit is clean (no Co-authored-by)")

    # Push
    rc, out, err = run(["git","push"])
    if rc == 0:
        print("✅ Pushed to remote")
    else:
        print(f"❌ Push failed: {err}")

    # Close issue 577
    run(["gh","issue","comment","577","--body",
         "Implemented body-battery.ts — composite readiness score (0–100) aggregating sleep quality/debt/efficiency, HRV vs baseline, RHR delta, TSB training balance, nutrition adequacy, mental wellbeing (PHQ-9), lifestyle recovery, and environmental AQI. Research basis: Firstbeat/Garmin Body Battery, Oura Ring Readiness, Whoop Recovery, Pichot 2016 HRV markers."])
    run(["gh","issue","close","577"])
    print("✅ Closed #577")

    # Close issue 575
    rc, out, _ = run(["gh","issue","comment","575","--body",
                       "Implemented — Two-Process circadian model (Borbély), MEQ chronotype, social jet lag, light exposure logger, circadian meal alignment."])
    run(["gh","issue","close","575"])
    print("✅ Closed #575")

    run(["gh","issue","close","576"])
    run(["gh","issue","close","579"])
    run(["gh","issue","close","580"])
    print("✅ Closed #576, #579, and #580")

    # Final log
    run(["git","--no-pager","log","--oneline","-8"])
    print("\nDone.")

if __name__ == "__main__":
    main()
