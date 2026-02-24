# Meeting Note Cleaner (MVP)

Meeting Note Cleaner is a Next.js 14 App Router project for transforming raw meeting transcripts into structured notes.

This repository currently includes **Steps 1–8** of the implementation plan.

## Step 1 Scope (Implemented)

- Single-page UI route at `/meeting-note-cleaner`
- Stitch-based UI integrated into reusable components
- 7-state UI state machine:
  - `EMPTY`
  - `TOO_LONG`
  - `MIXED_PICKER`
  - `LOADING`
  - `SUCCESS`
  - `VALIDATION_ERROR`
  - `MODEL_REFUSAL`
- Transcript input panel with:
  - textarea
  - character counter
  - output mode selector (`auto`, `force_en`, `force_fr`)
  - Generate button gating (`< 50` disabled, `> 20,000` disabled)
- Automatic `TOO_LONG` behavior when transcript exceeds 20,000 characters
- DEV state switcher for quickly previewing each UI state

## Step 2 Scope (Implemented)

- Structured TypeScript schema for processed notes output
- Mock meeting-notes dataset for success rendering
- Data-driven `SUCCESS` panel rendering (no hardcoded notes)
- Decision cards with evidence quote support
- Confidence badge + action-item priority badges
- Risks and open-questions sections bound to data

## Step 3 Scope (Implemented)

- `POST /api/detect` stub — frequency-based language heuristic returning `en | fr | mixed`
- `POST /api/generate` stub — returns mock `MeetingNotesResult` JSON (replaces `setTimeout`)
- Typed API request/response contracts in `src/types/api.ts`
- Page wired to real `fetch` calls — LOADING → detect → (MIXED_PICKER or generate) → SUCCESS/error states
- Full error state routing: `refusal` → MODEL_REFUSAL, `validation_error` → VALIDATION_ERROR, network failures → VALIDATION_ERROR

## Step 4 Scope (Implemented)

- **Robust language detection heuristic** — expanded word lists (100+ French, 90+ English), common bigrams, accent-character weighting
- **Confidence scoring** — `/api/detect` now returns `confidence`, `frRatio`, and `enRatio` alongside the detected language
- **Fixed auto→resolved language flow** — when detect returns `en` or `fr`, the resolved language (`force_en`/`force_fr`) is passed to `/api/generate` instead of `"auto"`
- **Generate fallback** — if `"auto"` still reaches `/api/generate`, it defaults to English
- **Edge-case handling** — empty/short transcripts reduce confidence; unknown scripts default to English

## Step 5 Scope (Implemented)

- **Zod schemas** — full Zod schema in `src/schemas/meeting-notes.ts` mirroring the TypeScript types, validating every field of `MeetingNotesResult`
- **Server-side validation** — `/api/generate` runs `safeParse` on the result through `MeetingNotesResultSchema` before responding; returns `validation_error` with `rawOutput` on failure
- **Client-side retry-once** — `callGenerate` on the page automatically retries one more time when the first response is a `validation_error`; only surfaces the error to the user after the second failure
- **Manual retry preserved** — the "Try Again" button in `ValidationErrorState` still works for user-initiated retries after the automatic retry has been exhausted

## Step 6 Scope (Implemented)

- **Claude integration** — `/api/generate` calls Claude (`claude-sonnet-4-20250514`) via the Anthropic SDK when `ANTHROPIC_API_KEY` is set
- **Strict JSON system prompt** — 10-rule prompt that forces Claude to return raw JSON matching the `MeetingNotesResult` schema (no markdown fences, no commentary)
- **Graceful fallback** — when no API key is configured the endpoint still returns mock data, keeping local development zero-config
- **Access-error fallback** — billing/auth/access failures from Anthropic gracefully fall back to mock output instead of breaking the user flow
- **Refusal handling** — if Claude declines to process the transcript, the API returns `reason: "refusal"` with a user-facing message
- **Markdown fence stripping** — if Claude wraps JSON in triple-backtick fences despite instructions, the server strips them before parsing
- **End-to-end validation preserved** — Claude output goes through the same Zod `safeParse` gate and client-side retry-once logic from Step 5
- **Source visibility** — successful responses include `source: "claude" | "mock"`, rendered in the success header badge
- **Auto language preview** — while `Auto` is selected, the UI previews detected language (`English` / `French`) before generation when confidence is clear

## Step 7 Scope (Implemented)

- **French mock data** — full French translation of mock meeting notes (`MOCK_MEETING_NOTES_FR`) so `force_fr` returns French content even without Claude
- **Language-aware mock selection** — `buildValidatedMockResponse` picks `MOCK_MEETING_NOTES` or `MOCK_MEETING_NOTES_FR` based on resolved language
- **Bilingual UI labels** — `src/lib/i18n.ts` provides a complete label map (section headings, status badges, priority tags, confidence, footer text) in English and French
- **SuccessState translation** — all static strings in the success panel are driven by `data.language`, so French output gets French UI chrome
- **Claude prompt unchanged** — the system prompt already instructs Claude to output in the requested language; no prompt changes were needed

## Step 8 Scope (Implemented)

- **Copy as plain text** — converts `MeetingNotesResult` to a human-readable plain-text format and copies to clipboard
- **Copy as Markdown** — converts `MeetingNotesResult` to well-structured Markdown (with task lists, blockquotes, emoji markers) and copies to clipboard
- **"Copied!" toast** — brief animated toast notification after successful copy, bilingual (EN/FR)
- **Feedback thumbs** — thumbs up/down buttons with toggle state and visual highlight; clicking again deselects
- **Instrumentation** — lightweight `trackEvent()` logger that fires on `copy_text`, `copy_markdown`, `feedback_up`, `feedback_down`, `generate_start`, `generate_success`, `generate_error` — currently console-based, ready to swap in a real analytics provider
- **Bilingual formatters** — plain-text and Markdown output uses i18n section headings matching the selected language

## Post-Step 8 Refinements (Implemented)

- **French mockup alignment** — success view now keeps the final section focused on `Risks & Blockers` and `Open Questions` (no separate “Important Dates” split)
- **Detail floor for generated output** — `/api/generate` enforces richer structure for substantive transcripts (summary depth + non-empty decisions/risks/open questions)
- **Deterministic transcript enrichment** — Claude and Ollama outputs are post-processed from transcript cues to reduce sparse or underspecified notes
- **French-aware enrichment text** — fallback labels and inferred section content now respect output language (`en` / `fr`)
- **Dev controls off by default** — header dev state controls are hidden unless `NEXT_PUBLIC_ENABLE_DEV_UI=true`
- **Dark mode toggle + persistence** — class-based theme switching is now implemented in the header, with preference persisted in `localStorage`
- **Dark UI styling refresh** — Stitch components now use the dark design token set (`card-dark`, `border-dark`, zinc-based dark palette)
- **French decision-title hardening** — generic placeholder titles (e.g. `Decision cle`) are replaced with evidence-derived titles where possible
- **French assignee extraction improvements** — action-item assignees now resolve more reliably in French (including speaker-line extraction and `assigneeInitial` fallback inference)

## Implementation Status

| Step   | Description                                                   | Status  |
| ------ | ------------------------------------------------------------- | ------- |
| Step 1 | Import Stitch UI + route + 7-state machine (no backend calls) | ✅ Done |
| Step 2 | Types + success rendering from mock JSON                      | ✅ Done |
| Step 3 | API wiring with stub responses                                | ✅ Done |
| Step 4 | Real language detection behavior                              | ✅ Done |
| Step 5 | Zod validation + retry once plumbing                          | ✅ Done |
| Step 6 | Claude integration + strict JSON prompts                      | ✅ Done |
| Step 7 | Translation rules for `force_en` / `force_fr`                 | ✅ Done |
| Step 8 | P1 features: copy, feedback, instrumentation                  | ✅ Done |

## Not Implemented Yet

All 8 steps are complete. Future enhancements could include:

- Persistent feedback storage (database)
- Real analytics provider integration (Mixpanel, PostHog, etc.)
- Server-side copy fallback for older browsers

## Optional: Local LLM via Ollama

You can run generation against a **local Ollama** instance instead of Claude.
The existing workflow is completely unaffected — Ollama is only used when you
explicitly opt in.

### Setup

```bash
# 1. Start Ollama (pick one)

# Option A — Docker (recommended, no local install)
docker compose -f docker-compose.ollama.yml up -d

# Option B — Native install (macOS)
brew install ollama && ollama serve      # leave running in a separate tab

# 2. Pull a model (once)
ollama pull llama3.2       # ~2 GB — or any model that supports JSON mode

# 3. Enable the provider in .env.local
echo 'LLM_PROVIDER=ollama' >> .env.local
# Optionally override defaults:
# OLLAMA_BASE_URL=http://127.0.0.1:11434
# OLLAMA_MODEL=llama3.2:latest
# OLLAMA_TIMEOUT_MS=240000
# OLLAMA_NUM_CTX=1024
# OLLAMA_SKIP_REPAIR=true
# NEXT_PUBLIC_ENABLE_DEV_UI=true

# 4. Start the app as usual
npm run dev
```

### Smoke Test

```bash
# Verify Ollama is reachable
curl -s http://127.0.0.1:11434/api/tags | head -c 200

# Hit the generate endpoint
curl -s http://localhost:3000/api/generate \
  -H 'Content-Type: application/json' \
  -d '{"transcript":"Alice: Let us ship v2 by Friday. Bob: Agreed, I will update the docs.","outputMode":"force_en"}' \
  | python3 -m json.tool
```

A successful response contains `"source": "ollama"` and structured meeting
notes. If Ollama is unreachable you'll get `"reason": "server_error"` — the
app never silently falls back to mock data when Ollama is selected.

### Performance Notes

- On Intel (`x86_64`) Macs, Ollama runs CPU-only; MLX/GPU warnings are expected.
- If `localhost` reachability is flaky, set `OLLAMA_BASE_URL=http://127.0.0.1:11434`.
- `OLLAMA_SKIP_REPAIR=true` trades some quality for speed by skipping the second repair pass.
- For higher quality, set `OLLAMA_SKIP_REPAIR=false` and allow a longer timeout.

### Switching Back

Remove (or comment out) `LLM_PROVIDER=ollama` from `.env.local` and restart
the dev server. The app reverts to its default behaviour (Claude if
`ANTHROPIC_API_KEY` is set, mock data otherwise).

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Anthropic SDK (`@anthropic-ai/sdk`) — Claude integration
- Ollama (optional) — local LLM provider via REST API
- Zod — runtime schema validation
- Playwright — E2E testing

## Run Locally

```bash
npm install
cp .env.local.example .env.local   # then add your ANTHROPIC_API_KEY
npm run dev
```

> **Without `ANTHROPIC_API_KEY`** the app still works — it returns mock data instead of calling Claude.

Open:

- `http://localhost:3000/meeting-note-cleaner`

Production check:

```bash
npm run build
```

Step 5 E2E checks:

```bash
npm run test:e2e
```

Run only Step 5 retry tests:

```bash
npx playwright test tests/e2e/step5-retry.spec.ts
```

Run only Step 8 action tests:

```bash
npx playwright test tests/e2e/step8-actions.spec.ts
```

## Project Structure (Key Files)

- `src/app/api/detect/route.ts` — Step 3 language-detection stub API
- `src/app/api/generate/route.ts` — note-generation API (Claude/Ollama/mock) with validation, grounding, enrichment, and detail enforcement
- `src/lib/claude.ts` — Step 6 Claude SDK helper, system prompt, and `callClaude()` function
- `src/lib/ollama.ts` — Optional Ollama provider, same interface as `callClaude()`
- `docker-compose.ollama.yml` — Standalone compose file for running Ollama locally
- `src/types/api.ts` — Step 3 typed request/response contracts
- `src/app/meeting-note-cleaner/page.tsx` — main page, UI state machine, and Step 2 mock-data wiring
- `src/components/stitch/` — Stitch-derived UI components and state views
- `src/components/stitch/Header.tsx` — header with optional developer controls gated behind `NEXT_PUBLIC_ENABLE_DEV_UI`
- `src/components/stitch/SuccessState.tsx` — Step 2 data-driven processed-notes renderer
- `src/data/mock-meeting-notes.ts` — Step 2 mock output payload
- `src/types/meeting-notes.ts` — Step 2 processed-notes schema
- `src/lib/i18n.ts` — Step 7 bilingual label map (EN/FR) for SuccessState UI strings
- `src/lib/format.ts` — Step 8 plain-text and Markdown formatters for MeetingNotesResult
- `src/lib/analytics.ts` — Step 8 lightweight event logger (console-based, swappable)
- `src/types/api.ts` — includes `GenerateResponse` source metadata (`claude` / `ollama` / `mock`)
- `src/schemas/meeting-notes.ts` — Step 5 Zod validation schemas for MeetingNotesResult
- `tests/e2e/step5-retry.spec.ts` — Step 5 deterministic E2E coverage for retry-once behavior
- `tests/e2e/step8-actions.spec.ts` — Step 8 E2E coverage for copy actions, feedback toggles, and analytics logs
- `playwright.config.ts` — Playwright runner config for local E2E tests
- `src/types/ui-states.ts` — state enum, output mode type, char limits

## Notes

- No auth and no database persistence are implemented yet.
- Root route (`/`) redirects to `/meeting-note-cleaner`.
- With `ANTHROPIC_API_KEY` set, Claude generates real structured notes. Without it, mock data is returned.
- Success header displays `Source: Claude`, `Source: Ollama`, or `Source: Mock` for each run.
- Success content and UI labels are fully bilingual (English/French) as of Step 7.
- Copy and feedback actions are fully wired as of Step 8; analytics events log to console.
- Theme switching is available from the header icon (`dark_mode` / `light_mode`) and applies to the full `/meeting-note-cleaner` UI.
