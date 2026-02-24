/**
 * Ollama provider — opt-in local LLM alternative to Claude.
 *
 * Enabled only when LLM_PROVIDER=ollama is set in the environment.
 * Uses the same system prompt and return types as claude.ts so the
 * generate route can swap providers transparently.
 */

// Re-use the same result types so callers stay unchanged.
import type { ClaudeCallResult } from "./claude";

// ── Config ───────────────────────────────────────────────────────────────────

const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.2";
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS ?? "45000");
const OLLAMA_NUM_CTX = Number(process.env.OLLAMA_NUM_CTX ?? "8192");
const OLLAMA_TEMPERATURE = Number(process.env.OLLAMA_TEMPERATURE ?? "0.1");
const OLLAMA_TOP_P = Number(process.env.OLLAMA_TOP_P ?? "0.9");

// ── System prompt (identical to claude.ts) ───────────────────────────────────

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
4. "summary" must have at least 2 bullets for medium/long transcripts (6+ speaker turns), and at least 1 bullet for short transcripts.
5. "done" for action items is always false.
6. "assigneeInitial" is the first letter of the assignee name (uppercase).
7. Every decision MUST include "evidenceQuote" as a direct verbatim quote from transcript (at least 6 words).
8. If a section has no items, return an empty array [].
9. Keep summaries concise (1-2 sentences each). Use **bold** markdown for key terms in summary text.
10. Do NOT invent information not present in the transcript.
11. Do not invent due dates or effective dates. Include dueDate/effectiveDate only when explicitly present in transcript.
12. Include explicit operational commitments (e.g. announcements, check-ins, status page updates) as action items/open questions when present.
13. If transcript explicitly assigns a task to a named person (e.g. "Priya, draft..."), the matching action item must include that assignee.
14. Do not merge separate blockers into one causal claim. Use "because/due to" only when transcript directly states that exact cause-effect relation.
15. Ensure coverage completeness: include auth blockers, scope-cut decisions, internal announcements, and next check-in timing when explicitly present.`;

// ── Build user message ───────────────────────────────────────────────────────

function buildUserMessage(
  transcript: string,
  outputLanguage: "en" | "fr"
): string {
  const langLabel = outputLanguage === "fr" ? "French" : "English";
  return `Output language: ${langLabel}\n\nTRANSCRIPT:\n${transcript}`;
}

function buildRepairMessage(
  transcript: string,
  outputLanguage: "en" | "fr",
  draftJson: string,
  issues: string[]
): string {
  const langLabel = outputLanguage === "fr" ? "French" : "English";
  return `Output language: ${langLabel}

You previously generated this JSON:
${draftJson}

It has the following issues:
${issues.map((issue, i) => `${i + 1}. ${issue}`).join("\n")}

Regenerate the full JSON object and fix every issue while preserving correct items.

TRANSCRIPT:
${transcript}`;
}

async function runOllamaChat(userMessage: string): Promise<ClaudeCallResult> {
  const url = `${OLLAMA_BASE_URL}/api/chat`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS),
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      format: "json",
      options: {
        temperature: OLLAMA_TEMPERATURE,
        top_p: OLLAMA_TOP_P,
        num_ctx: OLLAMA_NUM_CTX,
      },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return {
      ok: false,
      reason: "error",
      message: `Ollama returned HTTP ${res.status}: ${body}`,
    };
  }

  const data = (await res.json()) as {
    message?: { content?: string };
  };
  const rawText = data?.message?.content;
  if (!rawText) {
    return {
      ok: false,
      reason: "error",
      message: "Ollama returned an empty response.",
    };
  }

  return { ok: true, rawText };
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Call a local Ollama instance to extract structured meeting notes.
 * Returns the same shape as `callClaude` so the generate route can
 * switch providers without changing downstream logic.
 */
export async function callOllama(
  transcript: string,
  outputLanguage: "en" | "fr"
): Promise<ClaudeCallResult> {
  try {
    const userMessage = buildUserMessage(transcript, outputLanguage);
    return await runOllamaChat(userMessage);
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return {
        ok: false,
        reason: "error",
        message:
          `Ollama request timed out after ${OLLAMA_TIMEOUT_MS}ms. ` +
          "Try a shorter transcript, verify the model is loaded, or increase OLLAMA_TIMEOUT_MS.",
      };
    }

    return {
      ok: false,
      reason: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function callOllamaRepair(
  transcript: string,
  outputLanguage: "en" | "fr",
  draftJson: string,
  issues: string[]
): Promise<ClaudeCallResult> {
  try {
    const userMessage = buildRepairMessage(
      transcript,
      outputLanguage,
      draftJson,
      issues
    );
    return await runOllamaChat(userMessage);
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return {
        ok: false,
        reason: "error",
        message:
          `Ollama repair request timed out after ${OLLAMA_TIMEOUT_MS}ms. ` +
          "Try a shorter transcript, verify the model is loaded, or increase OLLAMA_TIMEOUT_MS.",
      };
    }
    return {
      ok: false,
      reason: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Quick connectivity check — calls Ollama's lightweight /api/tags endpoint.
 * Resolves true when the server responds 200.
 */
export async function isOllamaReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
