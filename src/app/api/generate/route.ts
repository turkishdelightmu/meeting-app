import { NextResponse } from "next/server";
import type { GenerateRequest, GenerateResponse } from "@/types/api";
import { MOCK_MEETING_NOTES } from "@/data/mock-meeting-notes";

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

    // Return mock result that matches the MeetingNotesResult schema.
    const result = {
      ...MOCK_MEETING_NOTES,
      language,
    };

    const response: GenerateResponse = { ok: true, result };
    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
