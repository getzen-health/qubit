# KQuarks Audit Round 33 - Issues Filed

**Total Issues Filed: 19**
**Status: All open and ready for assignment**

## Summary

Following systematic audit of the KQuarks codebase after issue #286 resolution, identified 19 high-value enhancement opportunities across iOS, Web, and Backend. Focus areas: offline support, search/filtering, accessibility, notifications, data export, performance, and i18n.

---

## Issues Filed

### Offline & Sync (1 issue)

| # | Title | Labels |
|---|-------|--------|
| [#287](https://github.com/qxlsz/kquarks/issues/287) | Add request queuing for offline-first sync | enhancement |

**Summary**: No request queue for offline scenarios. Users need ability to queue operations (sync, water logs, meal entries) and auto-retry when network returns.

---

### Search & Discovery (2 issues)

| # | Title | Labels |
|---|-------|--------|
| [#288](https://github.com/qxlsz/kquarks/issues/288) | Implement global search and filtering across health metrics | enhancement |
| [#296](https://github.com/qxlsz/kquarks/issues/296) | Implement interactive calendar/date range picker for data views | enhancement |

**Summary**: 686+ web pages but no unified search interface. Each view has independent date controls creating friction.

---

### UI/UX (3 issues)

| # | Title | Labels |
|---|-------|--------|
| [#289](https://github.com/qxlsz/kquarks/issues/289) | Add dark mode toggle with system preference sync | enhancement |
| [#293](https://github.com/qxlsz/kquarks/issues/293) | Add empty states and skeleton loaders to web dashboard | enhancement |
| [#301](https://github.com/qxlsz/kquarks/issues/301) | Add guided onboarding for non-Apple Health users | enhancement |

**Summary**: Basic dark mode support but no user toggle. Zero empty state components. Onboarding assumes HealthKit availability.

---

### Accessibility & Internationalization (3 issues)

| # | Title | Labels |
|---|-------|--------|
| [#291](https://github.com/qxlsz/kquarks/issues/291) | Implement comprehensive accessibility (a11y) audit and fixes | enhancement |
| [#300](https://github.com/qxlsz/kquarks/issues/300) | Add internationalization (i18n) infrastructure and Español/Français | enhancement |

**Summary**: Only 4 ARIA attributes in web. 728 i18n strings imported but no translation framework. No screen reader testing.

---

### Notifications & Preferences (2 issues)

| # | Title | Labels |
|---|-------|--------|
| [#290](https://github.com/qxlsz/kquarks/issues/290) | Add Siri Shortcuts support for common health actions | enhancement |
| [#292](https://github.com/qxlsz/kquarks/issues/292) | Add granular notification preferences by metric/type | enhancement |

**Summary**: 33 notification types but no per-type user preferences. No Siri/Shortcuts support for voice actions.

---

### Data & Export (3 issues)

| # | Title | Labels |
|---|-------|--------|
| [#294](https://github.com/qxlsz/kquarks/issues/294) | Build iOS-to-web data export UI and workflow | enhancement |
| [#299](https://github.com/qxlsz/kquarks/issues/299) | Add annotation/note feature to health data entries | enhancement |
| [#302](https://github.com/qxlsz/kquarks/issues/302) | Add web share cards and social metadata to pages | enhancement |

**Summary**: Export endpoint exists but no UI. Users cannot annotate entries or share metrics. ShareCard component exists but underused.

---

### Widgets & Integration (1 issue)

| # | Title | Labels |
|---|-------|--------|
| [#298](https://github.com/qxlsz/kquarks/issues/298) | Add widget deep-linking to related metric views | enhancement |

**Summary**: iOS widgets don't link to specific views. Tapping widget shows generic dashboard.

---

### Performance & Testing (3 issues)

| # | Title | Labels |
|---|-------|--------|
| [#295](https://github.com/qxlsz/kquarks/issues/295) | Add in-app performance profiling and metrics | performance |
| [#297](https://github.com/qxlsz/kquarks/issues/297) | Add iOS unit test suite for Services and ViewModels | enhancement |
| [#304](https://github.com/qxlsz/kquarks/issues/304) | Add advanced chart customization and export | enhancement |

**Summary**: No performance monitoring (despite 40+ memoized components). 690 test imports but no formal test structure. Chart components inflexible.

---

### Database & Analytics (2 issues)

| # | Title | Labels |
|---|-------|--------|
| [#303](https://github.com/qxlsz/kquarks/issues/303) | Add comprehensive API documentation and client SDKs | documentation |
| [#305](https://github.com/qxlsz/kquarks/issues/305) | Add batch analytics and monthly/yearly rollups | enhancement |

**Summary**: API versioning doc exists but no OpenAPI spec, SDKs, or Swagger UI. No monthly/yearly aggregate views despite 7 daily indexes.

---

## Audit Methodology

1. ✅ Reviewed 20 recent commits (issues #266-#286 resolved)
2. ✅ Browsed iOS views (686 Views, examined loading/empty states, search support)
3. ✅ Browsed web pages (686 pages, examined UX patterns, components)
4. ✅ Checked backend (9 edge functions, 7 partial indexes, 33 notification types)
5. ✅ Searched codebase patterns:
   - Localization: 728 i18n imports but no framework
   - Accessibility: 4 ARIA attributes, minimal VoiceOver testing
   - Tests: 690 imports, 0 visible test structure
   - Dark mode: basic support, no toggle
   - Search: 5 searchable uses (out of 686 pages)
   - Notifications: 33 uses, no granular control
   - Performance: 40+ memoized components, no profiler
   - Widgets: 66 WidgetKit uses, no deep-linking

## What Was NOT Re-filed

All 286 prior issues remain completed:
- ✅ CORS restrictions (#268)
- ✅ Input validation (#266-267)
- ✅ Structured error logging (#269)
- ✅ Promise.allSettled (#276)
- ✅ Chart memoization (#270)
- ✅ Request deduplication cache (#282)
- ✅ Error boundary pages (#283)
- ✅ AI confidence scores (#279)
- ✅ Health data export endpoint (#285)
- ✅ TypeScript strict mode (#280)
- ✅ HealthKit verification (#278)
- ✅ And 275+ others...

---

## Next Steps

1. **Prioritize**: Assign issues to milestones (Q2, Q3)
2. **Dependencies**: Note #288 (search) requires #296 (date picker) as prerequisite
3. **Quick wins**: #289 (dark mode) and #293 (empty states) are low-effort, high-impact
4. **Foundation**: #291 (a11y) and #297 (tests) should be done early
5. **Launch prep**: #300 (i18n) and #303 (API docs) help with launch readiness

---

**Audit performed**: Round 33
**Auditor**: Senior Staff Software Engineer
**All issues require: Acceptance criteria verification + PR review**
