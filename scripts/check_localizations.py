#!/usr/bin/env python3
"""
Localization CI checker for GetZen iOS app.

Validates that all translation .strings files are complete and properly translated.
Exits with code 1 if any blocking issues are found.

Checks:
  1. Missing keys: keys in en.lproj not present in other languages (BLOCKING)
  2. Untranslated strings: values identical to English, excluding exemptions (BLOCKING if above threshold)
  3. Orphan keys: keys in other languages not in en.lproj (WARNING)
"""

import os
import re
import sys
from pathlib import Path

LPROJ_DIR = Path(__file__).resolve().parent.parent / "ios" / "KQuarks"
LANGUAGES = ["es", "fr", "pt", "de", "ja", "zh", "ko"]
REFERENCE_LANG = "en"

# Keys where value is expected to be the same across languages
EXEMPT_EXACT = {
    "GetZen", "QuarkScore™", "QuarkScore", "HealthKit", "Apple Watch",
    "Garmin", "Oura", "Fitbit", "Whoop", "Suunto", "Peloton",
    "Apple Health", "Google Fit", "Strava", "Nike Run Club",
    "TestFlight", "App Store", "iCloud", "RevenueCat",
    "Wi-Fi", "Bluetooth", "GPS", "UV", "SPF", "pH", "DNA", "RNA",
    "BMI", "BMR", "TDEE", "RMR", "HRV", "VO2", "VO2 Max",
    "ECG", "EKG", "AHI", "SpO2", "ACWR", "RPE", "1RM",
    "bpm", "mmHg", "mg/dL", "mmol/L", "kcal", "kJ", "kg", "lbs", "oz",
    "cm", "mm", "ft", "in", "mi", "km", "°F", "°C",
    "dB", "dBA", "Hz", "ms", "min", "sec", "hr", "hrs",
    "OK", "Pro", "AI", "ML", "API", "URL", "ID",
    "%@", "%d", "%lld", "%f", "%.0f", "%.1f", "%.2f",
    "—", "–", "•", "/", ":", ",", ".", "…",
}

# Patterns for keys that are expected to remain untranslated
EXEMPT_PATTERNS = [
    re.compile(r"^[A-Z][a-zA-Z]+View$"),          # View class names (e.g., AFibBurdenView)
    re.compile(r"^[A-Z][a-zA-Z]+Screen$"),         # Screen class names
    re.compile(r"^[A-Z][a-zA-Z]+Chart$"),          # Chart class names
    re.compile(r"^[A-Z]{2,}$"),                    # All-caps abbreviations (HR, HRV)
    re.compile(r"^\d"),                            # Starts with digit
    re.compile(r"^https?://"),                     # URLs
    re.compile(r"^[^a-zA-Z]*$"),                   # No letters (pure symbols/numbers)
    re.compile(r"^%[@dflls]+$"),                   # Pure format strings
]

# Swift interpolation marker — keys containing \( are runtime strings, not localizable
_SWIFT_INTERPOLATION = re.compile(r"\\\\[(]")

# Threshold: max allowed untranslated strings per language before CI fails.
# These thresholds should decrease over time as translations improve.
UNTRANSLATED_THRESHOLDS = {
    "es": 800,
    "fr": 1200,
    "pt": 1250,
    "de": 1350,
    "ja": 2000,
    "zh": 2000,
    "ko": 2000,
}


def parse_strings_file(path: Path) -> dict[str, str]:
    """Parse an iOS .strings file into a dict of key→value."""
    entries = {}
    if not path.exists():
        return entries

    content = path.read_text(encoding="utf-8")
    # Match "key" = "value"; with possible escaped quotes inside
    pattern = re.compile(r'"((?:[^"\\]|\\.)*)"\s*=\s*"((?:[^"\\]|\\.)*)"\s*;')
    for match in pattern.finditer(content):
        key = match.group(1)
        value = match.group(2)
        entries[key] = value
    return entries


def is_exempt(key: str, value: str) -> bool:
    """Check if a key/value pair is exempt from translation checks."""
    # Exact match exemptions (check both key and value)
    if key in EXEMPT_EXACT or value in EXEMPT_EXACT:
        return True

    # Very short strings (≤2 chars) are likely symbols/units
    if len(value.strip()) <= 2:
        return True

    # Pattern-based exemptions
    for pattern in EXEMPT_PATTERNS:
        if pattern.match(key) or pattern.match(value):
            return True

    # Swift string interpolation — runtime strings, not localizable
    if _SWIFT_INTERPOLATION.search(key):
        return True

    return False


def main():
    # Parse reference (English) strings
    en_path = LPROJ_DIR / f"{REFERENCE_LANG}.lproj" / "Localizable.strings"
    if not en_path.exists():
        print(f"❌ English .strings file not found: {en_path}")
        sys.exit(1)

    en_strings = parse_strings_file(en_path)
    en_keys = set(en_strings.keys())
    print(f"📊 English reference: {len(en_keys)} keys")
    print()

    has_blocking_issues = False
    total_missing = 0
    total_untranslated = 0

    for lang in LANGUAGES:
        lang_path = LPROJ_DIR / f"{lang}.lproj" / "Localizable.strings"
        if not lang_path.exists():
            print(f"❌ [{lang}] .strings file MISSING: {lang_path}")
            has_blocking_issues = True
            continue

        lang_strings = parse_strings_file(lang_path)
        lang_keys = set(lang_strings.keys())

        # Check 1: Missing keys (in en but not in this language)
        missing_raw = en_keys - lang_keys
        # Filter out exempt keys (e.g., interpolated strings that aren't localizable)
        missing = {k for k in missing_raw if not is_exempt(k, en_strings.get(k, ""))}
        if missing:
            total_missing += len(missing)
            print(f"❌ [{lang}] {len(missing)} missing keys:")
            for key in sorted(missing)[:10]:
                print(f"   - \"{key}\"")
            if len(missing) > 10:
                print(f"   ... and {len(missing) - 10} more")
            has_blocking_issues = True
        else:
            print(f"✅ [{lang}] All localizable keys present ({len(missing_raw)} exempt skipped)")

        # Check 2: Untranslated strings (value == English value, excluding exemptions)
        untranslated = []
        for key in en_keys & lang_keys:
            en_val = en_strings[key]
            lang_val = lang_strings[key]
            if lang_val == en_val and not is_exempt(key, en_val):
                untranslated.append(key)

        threshold = UNTRANSLATED_THRESHOLDS.get(lang, 1000)
        status = "⚠️" if untranslated else "✅"
        if len(untranslated) > threshold:
            status = "❌"
            has_blocking_issues = True

        total_untranslated += len(untranslated)
        print(f"{status} [{lang}] {len(untranslated)} untranslated (threshold: {threshold})")

        # Check 3: Orphan keys (in this language but not in en)
        orphans = lang_keys - en_keys
        if orphans:
            print(f"⚠️  [{lang}] {len(orphans)} orphan keys (not in English)")

        print()

    # Summary
    print("=" * 60)
    print(f"📊 Summary: {total_missing} missing keys, {total_untranslated} untranslated strings")

    if has_blocking_issues:
        print("❌ FAILED — localization check found blocking issues")
        sys.exit(1)
    else:
        print("✅ PASSED — all localization checks passed")
        sys.exit(0)


if __name__ == "__main__":
    main()
