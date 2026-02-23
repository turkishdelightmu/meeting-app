import { NextResponse } from "next/server";
import type {
  GenerateRequest,
  GenerateResponse,
  GenerateSource,
} from "@/types/api";
import { MOCK_MEETING_NOTES, MOCK_MEETING_NOTES_FR } from "@/data/mock-meeting-notes";
import { MeetingNotesResultSchema } from "@/schemas/meeting-notes";
import { callClaude } from "@/lib/claude";

type Step5TestMode = "fail_once_then_pass" | "fail_twice";

const requestAttemptCounter = new Map<string, number>();

function getTestMode(req: Request): Step5TestMode | null {
  const mode = req.headers.get("x-step5-test-mode");
  if (mode === "fail_once_then_pass" || mode === "fail_twice") {
    return mode;
  }
  return null;
}

function shouldForceInvalidResponse(
  req: Request,
  transcript: string,
  outputMode: string
): boolean {
  if (process.env.ENABLE_STEP5_TEST_MODE !== "true") {
    return false;
  }

  const mode = getTestMode(req);
  if (!mode) {
    return false;
  }

  const testId = req.headers.get("x-step5-test-id") ?? "default";
  const key = `${testId}::${mode}::${outputMode}::${transcript}`;
  const previousCount = requestAttemptCounter.get(key) ?? 0;
  const nextCount = previousCount + 1;
  requestAttemptCounter.set(key, nextCount);

  if (mode === "fail_once_then_pass") {
    return nextCount === 1;
  }

  return nextCount <= 2;
}

/** Whether Claude integration is available */
function isClaudeEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

function buildValidatedMockResponse(
  language: "en" | "fr",
  source: GenerateSource = "mock"
): GenerateResponse {
  const baseMock = language === "fr" ? MOCK_MEETING_NOTES_FR : MOCK_MEETING_NOTES;
  const rawResult = {
    ...baseMock,
    language,
  };

  const parsed = MeetingNotesResultSchema.safeParse(rawResult);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "validation_error",
      rawOutput: JSON.stringify(rawResult, null, 2),
    };
  }

  return { ok: true, result: parsed.data, source };
}

function shouldFallbackToMockForClaudeError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("credit balance is too low") ||
    normalized.includes("plans & billing") ||
    normalized.includes("invalid x-api-key") ||
    normalized.includes("authentication_error") ||
    normalized.includes("permission_error")
  );
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body: GenerateRequest = await req.json();

    if (!body.transcript || typeof body.transcript !== "string") {
      return NextResponse.json(
        { error: "transcript is required" },
        { status: 400 }
      );
    }

    // Resolve the output language.
    // "auto" should be resolved upstream by detect, but default to English as fallback.
    const language: "en" | "fr" =
      body.outputMode === "force_fr" ? "fr" : "en";

    // ── Step 5 test hook ────────────────────────────────────────────────────
    if (shouldForceInvalidResponse(req, body.transcript, body.outputMode)) {
      const response: GenerateResponse = {
        ok: false,
        reason: "validation_error",
        rawOutput: '{"summary":[]}',
      };
      return NextResponse.json(response);
    }

    // ── Step 6: Claude integration ──────────────────────────────────────────
    if (isClaudeEnabled()) {
      const claudeResult = await callClaude(body.transcript, language);

      if (!claudeResult.ok) {
        if (claudeResult.reason === "refusal") {
          const response: GenerateResponse = {
            ok: false,
            reason: "refusal",
            message: claudeResult.message,
          };
          return NextResponse.json(response);
        }

        if (shouldFallbackToMockForClaudeError(claudeResult.message)) {
          const fallbackResponse = buildValidatedMockResponse(language, "mock");
          return NextResponse.json(fallbackResponse);
        }

        // Treat Claude errors as server errors
        const response: GenerateResponse = {
          ok: false,
          reason: "server_error",
          message: claudeResult.message,
        };
        return NextResponse.json(response);
      }

      // Parse raw text as JSON
      let rawParsed: unknown;
      try {
        // Strip markdown code fences if Claude wrapped the JSON despite instructions
        let cleanText = claudeResult.rawText.trim();
        if (cleanText.startsWith("```")) {
          cleanText = cleanText
            .replace(/^```(?:json)?\s*\n?/, "")
            .replace(/\n?```\s*$/, "");
        }
        rawParsed = JSON.parse(cleanText);
      } catch {
        const response: GenerateResponse = {
          ok: false,
          reason: "validation_error",
          rawOutput: claudeResult.rawText,
        };
        return NextResponse.json(response);
      }

      // Zod validation (Step 5)
      const parsed = MeetingNotesResultSchema.safeParse(rawParsed);
      if (!parsed.success) {
        const response: GenerateResponse = {
          ok: false,
          reason: "validation_error",
          rawOutput: claudeResult.rawText,
        };
        return NextResponse.json(response);
      }

      const response: GenerateResponse = {
        ok: true,
        result: parsed.data,
        source: "claude",
      };
      return NextResponse.json(response);
    }

    // ── Fallback: mock data (no API key set) ────────────────────────────────
    // Simulate a short processing delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    const fallbackResponse = buildValidatedMockResponse(language, "mock");
    return NextResponse.json(fallbackResponse);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
