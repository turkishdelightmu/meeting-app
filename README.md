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

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Anthropic SDK (`@anthropic-ai/sdk`) — Claude integration
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

## Project Structure (Key Files)

- `src/app/api/detect/route.ts` — Step 3 language-detection stub API
- `src/app/api/generate/route.ts` — Step 6 note-generation API (Claude or mock fallback)
- `src/lib/claude.ts` — Step 6 Claude SDK helper, system prompt, and `callClaude()` function
- `src/types/api.ts` — Step 3 typed request/response contracts
- `src/app/meeting-note-cleaner/page.tsx` — main page, UI state machine, and Step 2 mock-data wiring
- `src/components/stitch/` — Stitch-derived UI components and state views
- `src/components/stitch/SuccessState.tsx` — Step 2 data-driven processed-notes renderer
- `src/data/mock-meeting-notes.ts` — Step 2 mock output payload
- `src/types/meeting-notes.ts` — Step 2 processed-notes schema
- `src/lib/i18n.ts` — Step 7 bilingual label map (EN/FR) for SuccessState UI strings
- `src/lib/format.ts` — Step 8 plain-text and Markdown formatters for MeetingNotesResult
- `src/lib/analytics.ts` — Step 8 lightweight event logger (console-based, swappable)
- `src/types/api.ts` — includes `GenerateResponse` source metadata (`claude` / `mock`)
- `src/schemas/meeting-notes.ts` — Step 5 Zod validation schemas for MeetingNotesResult
- `tests/e2e/step5-retry.spec.ts` — Step 5 deterministic E2E coverage for retry-once behavior
- `playwright.config.ts` — Playwright runner config for local E2E tests
- `src/types/ui-states.ts` — state enum, output mode type, char limits

## Notes

- No auth and no database persistence are implemented yet.
- Root route (`/`) redirects to `/meeting-note-cleaner`.
- With `ANTHROPIC_API_KEY` set, Claude generates real structured notes. Without it, mock data is returned.
- Success header displays `Source: Claude` or `Source: Mock` for each run.
- Success content and UI labels are fully bilingual (English/French) as of Step 7.
- Copy and feedback actions are fully wired as of Step 8; analytics events log to console.
