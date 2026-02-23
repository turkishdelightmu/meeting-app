# Meeting Note Cleaner (MVP)

Meeting Note Cleaner is a Next.js 14 App Router project for transforming raw meeting transcripts into structured notes.

This repository currently includes **Steps 1–4** of the implementation plan.

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

## Implementation Status

| Step   | Description                                                   | Status     |
| ------ | ------------------------------------------------------------- | ---------- |
| Step 1 | Import Stitch UI + route + 7-state machine (no backend calls) | ✅ Done    |
| Step 2 | Types + success rendering from mock JSON                      | ✅ Done    |
| Step 3 | API wiring with stub responses                                | ✅ Done    |
| Step 4 | Real language detection behavior                              | ✅ Done    |
| Step 5 | Zod validation + retry once plumbing                          | ⏳ Pending |
| Step 6 | Claude integration + strict JSON prompts                      | ⏳ Pending |
| Step 7 | Translation rules for `force_en` / `force_fr`                 | ⏳ Pending |
| Step 8 | P1 features: copy, feedback, instrumentation                  | ⏳ Pending |

## Not Implemented Yet (Planned in Next Steps)

- Zod schema validation + retry-on-invalid-JSON
- Claude integration
- Translation rules for `force_en` / `force_fr`
- P1 extras (copy actions, feedback events, instrumentation wiring)

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS

## Run Locally

```bash
npm install
npm run dev
```

Open:

- `http://localhost:3000/meeting-note-cleaner`

Production check:

```bash
npm run build
```

## Project Structure (Key Files)

- `src/app/api/detect/route.ts` — Step 3 language-detection stub API
- `src/app/api/generate/route.ts` — Step 3 note-generation stub API
- `src/types/api.ts` — Step 3 typed request/response contracts
- `src/app/meeting-note-cleaner/page.tsx` — main page, UI state machine, and Step 2 mock-data wiring
- `src/components/stitch/` — Stitch-derived UI components and state views
- `src/components/stitch/SuccessState.tsx` — Step 2 data-driven processed-notes renderer
- `src/data/mock-meeting-notes.ts` — Step 2 mock output payload
- `src/types/meeting-notes.ts` — Step 2 processed-notes schema
- `src/types/ui-states.ts` — state enum, output mode type, char limits

## Notes

- No auth and no database persistence are implemented yet.
- Root route (`/`) redirects to `/meeting-note-cleaner`.
- Success content is mock data and remains English-only until translation rules are implemented.
