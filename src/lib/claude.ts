import Anthropic from "@anthropic-ai/sdk";

// ── Singleton client ─────────────────────────────────────────────────────────

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Add it to .env.local to enable Claude."
      );
    }
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

// ── Model config ─────────────────────────────────────────────────────────────

const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 4096;

// ── System prompt ────────────────────────────────────────────────────────────
// Strict JSON-only prompt that matches MeetingNotesResultSchema exactly.

const SYSTEM_PROMPT = `You are a meeting-note extraction assistant.

TASK
Given a raw meeting transcript, extract structured notes and return **only** a single JSON object — no markdown fences, no commentary, no explanation.

OUTPUT SCHEMA (you must follow this exactly):
{
  "confidence": "high" | "medium" | "low",
  "language": "en" | "fr",
  "summary": [{ "text": "..." }, ...],
  "decisions": [
    {
      "title": "...",
      "status": "confirmed" | "tentative" | "rejected",
      "owner": "..." (optional),
      "effectiveDate": "..." (optional),
      "evidenceQuote": "..." (optional, verbatim quote from transcript)
    }
  ],
  "actionItems": [
    {
      "title": "...",
      "assignee": "..." (optional),
      "assigneeInitial": "X" (optional, 1-2 chars),
      "dueDate": "..." (optional),
      "priority": "high" | "medium" | "low" (optional),
      "done": false
    }
  ],
  "risks": [{ "text": "..." }],
  "openQuestions": [{ "text": "..." }]
}

RULES
1. Output ONLY the JSON object. No wrapping, fences, or extra text.
2. "confidence" reflects how confident you are in the extraction (high if transcript is clear, low if ambiguous).
3. "language" must match the requested output language provided in the user message.
4. "summary" must have at least 1 bullet.
5. "done" for action items is always false.
6. "assigneeInitial" is the first letter of the assignee name (uppercase).
7. "evidenceQuote" should be a direct quote from the transcript that supports the decision.
8. If a section has no items, return an empty array [].
9. Keep summaries concise (1-2 sentences each). Use **bold** markdown for key terms in summary text.
10. Do NOT invent information not present in the transcript.`;

// ── Build user message ───────────────────────────────────────────────────────

function buildUserMessage(
  transcript: string,
  outputLanguage: "en" | "fr"
): string {
  const langLabel = outputLanguage === "fr" ? "French" : "English";
  return `Output language: ${langLabel}

TRANSCRIPT:
${transcript}`;
}

// ── Public API ───────────────────────────────────────────────────────────────

export interface ClaudeResult {
  /** Whether Claude returned content successfully */
  ok: true;
  /** Raw text from Claude (should be JSON) */
  rawText: string;
}

export interface ClaudeRefusal {
  ok: false;
  reason: "refusal";
  message: string;
}

export interface ClaudeError {
  ok: false;
  reason: "error";
  message: string;
}

export type ClaudeCallResult = ClaudeResult | ClaudeRefusal | ClaudeError;

/**
 * Call Claude to extract structured meeting notes from a transcript.
 * Returns raw text — caller is responsible for JSON parsing + Zod validation.
 */
export async function callClaude(
  transcript: string,
  outputLanguage: "en" | "fr"
): Promise<ClaudeCallResult> {
  try {
    const client = getClient();
    const userMessage = buildUserMessage(transcript, outputLanguage);

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    // Check for stop reason
    if (response.stop_reason === "end_turn" || response.stop_reason === "stop_sequence") {
      const textBlock = response.content.find((b) => b.type === "text");
      if (textBlock && textBlock.type === "text") {
        return { ok: true, rawText: textBlock.text };
      }
      return {
        ok: false,
        reason: "error",
        message: "Claude returned no text content.",
      };
    }

    // Content filter / refusal
    if (response.stop_reason === "max_tokens") {
      return {
        ok: false,
        reason: "error",
        message: "Claude response was truncated (max_tokens reached).",
      };
    }

    return {
      ok: false,
      reason: "refusal",
      message: "Claude declined to process this transcript.",
    };
  } catch (err) {
    return {
      ok: false,
      reason: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }
}
