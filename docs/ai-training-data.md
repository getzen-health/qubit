# AI Training Data Collection

> **Goal:** Collect high-quality AI interaction data from opt-in users to train a LoRA adapter for fully on-device, private health AI.

---

## What We Collect

Only logged when the user explicitly opts in via **Settings → AI Provider → "Help Improve AI"**.

### `ai_interactions` Table

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `id` | UUID | Unique interaction ID | `a1b2c3d4-...` |
| `user_id` | UUID | The user who generated it | `f7e8d9c0-...` |
| `interaction_type` | TEXT | What kind of AI request | `insight`, `chat`, `briefing` |
| `provider` | TEXT | Which AI ran it | `on_device`, `cloud` |
| `prompt_summary` | TEXT | What was asked (truncated to 2,000 chars) | `"Health insights generation"` or user's chat message |
| `response_text` | TEXT | What AI responded (truncated to 5,000 chars) | `"Your sleep quality improved 12%..."` |
| `rating` | TEXT | User feedback (nullable) | `helpful`, `not_helpful`, or `NULL` |
| `health_context_hash` | TEXT | SHA256 hash of health context (first 16 bytes) | `a3f8b2c1d4e5f6a7...` |
| `model_version` | TEXT | AI model version (nullable) | `claude-3.5-sonnet` |
| `response_time_ms` | INTEGER | How long the AI took to respond | `1234` |
| `created_at` | TIMESTAMPTZ | When the interaction happened | `2026-04-05T22:00:00Z` |
| `updated_at` | TIMESTAMPTZ | Last update (e.g., when rated) | `2026-04-05T22:01:00Z` |

### `ai_data_consent` Table

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID | Primary key, one row per user |
| `consent_given` | BOOLEAN | Whether user opted in |
| `consent_date` | TIMESTAMPTZ | When they opted in |
| `consent_version` | TEXT | Consent policy version (`1.0`) |

---

## What We Do NOT Collect

- ❌ **Raw health data** — We only store a SHA256 hash of the health context for deduplication. The actual steps/HR/sleep numbers are NOT stored in this table.
- ❌ **Personal identifiers** — No names, emails, or device info beyond user_id.
- ❌ **Anything without consent** — The logger checks `hasConsent` before every write. If the user hasn't toggled "Help Improve AI" → nothing is logged.

---

## Data Flow Diagram

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   User asks  │────▶│  AIProviderManager │────▶│  AI Provider     │
│  for insight │     │  routes request    │     │  (on-device or   │
│  / chat /    │     │                    │     │   cloud Claude)  │
│  briefing    │     └────────┬───────────┘     └────────┬─────────┘
└─────────────┘              │                           │
                              │ prompt + response         │ response
                              ▼                           │
                    ┌──────────────────┐                  │
                    │ AIInteractionLogger│◀────────────────┘
                    │                    │
                    │ if hasConsent:     │
                    │  • truncate text   │
                    │  • hash context    │
                    │  • measure time    │
                    │  • insert row      │
                    └────────┬───────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Supabase       │
                    │ ai_interactions  │
                    │   (RLS: user     │
                    │    owns rows)    │
                    └──────────────────┘
```

---

## When Each Type Is Logged

### Insights (`interaction_type = 'insight'`)
- **Trigger:** User opens Insights tab or pulls to refresh
- **Prompt:** `"Health insights generation"` (static string)
- **Response:** Each insight's title + content joined by newline
- **Context hash:** SHA256 of the full HealthContext struct (steps, HR, sleep, workouts)
- **Logged in:** `AIProviderManager.generateInsights()`

### Chat (`interaction_type = 'chat'`)
- **Trigger:** User sends a message in Health Chat
- **Prompt:** The user's actual message (truncated to 2,000 chars)
- **Response:** The AI's reply (truncated to 5,000 chars)
- **Logged in:** `HealthChatService.sendMessage()` (both on-device and cloud paths)

### Briefing (`interaction_type = 'briefing'`)
- **Trigger:** Morning briefing background task (~7am daily)
- **Prompt:** `"Morning briefing generation"` (static string)
- **Response:** The full briefing text
- **Context hash:** SHA256 of health context
- **Logged in:** `AIProviderManager.generateBriefing()`

---

## Privacy & Security

| Protection | How |
|-----------|-----|
| **Opt-in only** | User must toggle "Help Improve AI" in Settings → AI Provider |
| **RLS enforced** | Users can only read/write their own rows — Supabase Row Level Security |
| **No raw health data** | Health context is SHA256-hashed before storage |
| **Truncation** | Prompts capped at 2,000 chars, responses at 5,000 chars |
| **Revocable** | User can toggle off anytime — new interactions stop being logged |
| **Deletable** | User can delete their account → CASCADE deletes all interaction data |

---

## How This Becomes Training Data

```
Phase 1 (Current)                    Phase 2 (Future)
─────────────────                    ────────────────
Users opt in                         Export from Supabase
     │                                    │
     ▼                                    ▼
ai_interactions table    ──────▶    JSONL file
(prompt_summary,                   {"prompt": "...",
 response_text,                     "completion": "...",
 rating)                            "rating": "helpful"}
                                          │
                                          ▼
                                   Apple Adapter Training
                                   Toolkit (LoRA)
                                          │
                                          ▼
                                   .fmadapter file (~160MB)
                                          │
                                          ▼
                                   Ship with app → Phase 3
                                   (fully private on-device AI)
```

### Export Query (Future)

```sql
-- Export high-quality training pairs
SELECT
    prompt_summary AS prompt,
    response_text AS completion,
    interaction_type,
    provider,
    rating,
    response_time_ms
FROM ai_interactions
WHERE rating = 'helpful'
   OR rating IS NULL  -- unrated but usable
ORDER BY created_at;
```

---

## Sample Data (What a Row Looks Like)

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "user_id": "f7e8d9c0-b1a2-3456-cdef-789012345678",
  "interaction_type": "chat",
  "provider": "cloud",
  "prompt_summary": "Why is my resting heart rate higher this week?",
  "response_text": "Your resting heart rate has increased by 4 bpm this week (68→72). This could be related to: 1) Your sleep duration dropped from 7.5h to 6.2h average, 2) You had 3 fewer workout sessions than last week. Both reduced recovery and increased stress can elevate resting HR. Try prioritizing 7+ hours of sleep tonight.",
  "rating": "helpful",
  "health_context_hash": "a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5",
  "model_version": null,
  "response_time_ms": 2341,
  "created_at": "2026-04-05T22:15:30Z",
  "updated_at": "2026-04-05T22:15:45Z"
}
```

---

## Files

| File | Purpose |
|------|---------|
| `supabase/migrations/20260828000001_ai_interactions.sql` | Database schema + RLS policies |
| `ios/KQuarks/Services/AIInteractionLogger.swift` | Logging service (consent, log, rate, hash) |
| `ios/KQuarks/Services/AIProviderManager.swift` | Calls logger after every AI request |
| `ios/KQuarks/Services/HealthChatService.swift` | Calls logger for chat interactions |
| `ios/KQuarks/Views/Settings/AISettingsView.swift` | Consent toggle UI |
| `ios/KQuarksTests/AIInteractionLoggerTests.swift` | 10 tests |
