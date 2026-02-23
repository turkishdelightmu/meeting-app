import { NextResponse } from "next/server";
import type { DetectRequest, DetectResponse, DetectedLanguage } from "@/types/api";

// Simple frequency-based heuristic — will be replaced by Claude in Step 6.
const FR_WORDS = new Set([
  "je", "tu", "il", "elle", "nous", "vous", "ils", "elles",
  "est", "sont", "être", "avoir", "que", "qui", "une", "les",
  "des", "dans", "sur", "avec", "pour", "par", "mais", "donc",
  "de", "du", "le", "la", "et", "en", "un", "au", "aux",
  "très", "bien", "non", "oui", "aussi", "pas",
]);

const EN_WORDS = new Set([
  "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would",
  "can", "could", "should", "may", "might", "shall",
  "and", "but", "or", "in", "on", "at", "to", "for",
  "this", "that", "with", "from", "not", "we", "i", "you",
  "they", "it", "an", "a",
]);

function detectLanguage(transcript: string): DetectedLanguage {
  const words = transcript
    .toLowerCase()
    .replace(/[^a-zàâçéèêëîïôûùüÿæœ\s'-]/gi, " ")
    .split(/\s+/)
    .filter(Boolean);

  let frCount = 0;
  let enCount = 0;
  for (const word of words) {
    if (FR_WORDS.has(word)) frCount++;
    if (EN_WORDS.has(word)) enCount++;
  }

  const total = frCount + enCount;
  if (total === 0) return "en"; // default: English

  const frRatio = frCount / total;

  if (frRatio > 0.65) return "fr";
  if (frRatio < 0.35) return "en";
  return "mixed";
}

export async function POST(req: Request) {
  try {
    const body: DetectRequest = await req.json();

    if (!body.transcript || typeof body.transcript !== "string") {
      return NextResponse.json(
        { error: "transcript is required" },
        { status: 400 }
      );
    }

    const language = detectLanguage(body.transcript);
    const response: DetectResponse = { language };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
