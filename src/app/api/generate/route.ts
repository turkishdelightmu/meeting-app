import { NextResponse } from "next/server";
import type { GenerateRequest, GenerateResponse } from "@/types/api";
import { MOCK_MEETING_NOTES } from "@/data/mock-meeting-notes";
import { MeetingNotesResultSchema } from "@/schemas/meeting-notes";

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

// Stub implementation — returns mock data.
// Will be replaced with real Claude call in Step 6.
export async function POST(req: Request) {
  try {
    const body: GenerateRequest = await req.json();

    if (!body.transcript || typeof body.transcript !== "string") {
      return NextResponse.json(
        { error: "transcript is required" },
        { status: 400 }
      );
    }

    // Simulate a short processing delay (removed in production)
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Resolve the output language.
    // "auto" should be resolved upstream by detect, but default to English as fallback.
    const language: "en" | "fr" =
      body.outputMode === "force_fr" ? "fr" : "en";

    // Build raw result (in Step 6 this will be Claude's JSON output).
    const rawResult = {
      ...MOCK_MEETING_NOTES,
      language,
    };

    if (shouldForceInvalidResponse(req, body.transcript, body.outputMode)) {
      const response: GenerateResponse = {
        ok: false,
        reason: "validation_error",
        rawOutput: "{\"summary\":[]}",
      };
      return NextResponse.json(response);
    }

    // ── Zod validation (Step 5) ───────────────────────────────────────────
    const parsed = MeetingNotesResultSchema.safeParse(rawResult);

    if (!parsed.success) {
      const response: GenerateResponse = {
        ok: false,
        reason: "validation_error",
        rawOutput: JSON.stringify(rawResult, null, 2),
      };
      return NextResponse.json(response);
    }

    const response: GenerateResponse = { ok: true, result: parsed.data };
    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
