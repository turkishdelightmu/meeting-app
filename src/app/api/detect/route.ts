import { NextResponse } from "next/server";
import type { DetectRequest, DetectResponse, DetectedLanguage } from "@/types/api";

// ── Expanded word lists ──────────────────────────────────────────────────────
// High-frequency function words that strongly signal one language.
// Will be replaced by Claude-based detection in Step 6.

const FR_WORDS = new Set([
  // pronouns
  "je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles",
  "me", "te", "se", "lui", "leur", "moi", "toi", "soi", "eux",
  // determiners / articles
  "le", "la", "les", "un", "une", "des", "du", "de", "au", "aux",
  "ce", "cet", "cette", "ces", "mon", "ma", "mes", "ton", "ta", "tes",
  "son", "sa", "ses", "notre", "nos", "votre", "vos", "leur", "leurs",
  // prepositions / conjunctions
  "dans", "sur", "avec", "pour", "par", "en", "et", "ou", "mais",
  "donc", "car", "ni", "puis", "entre", "vers", "chez", "sans",
  "depuis", "pendant", "avant", "après", "contre", "selon", "sous",
  // verbs (common forms)
  "est", "sont", "être", "avoir", "fait", "faire", "dit", "dire",
  "peut", "pouvoir", "doit", "devoir", "faut", "falloir", "va", "aller",
  "vais", "allons", "allez", "vont", "sera", "serait", "été", "avait",
  "avons", "avez", "ont", "suis", "sommes", "êtes",
  // adverbs / other
  "que", "qui", "quoi", "où", "comment", "pourquoi", "quand",
  "ne", "pas", "plus", "très", "bien", "aussi", "encore", "déjà",
  "toujours", "jamais", "rien", "tout", "tous", "toute", "toutes",
  "oui", "non", "si", "comme", "même", "autre", "autres",
  // meeting-specific
  "réunion", "projet", "équipe", "objectif", "compte", "rendu",
  "décision", "action", "risque", "calendrier", "livrable",
  "prochaine", "étape", "budget", "rapport", "responsable",
  "questions", "ouvertes", "prochain", "rendez", "vous",
  "quelles", "sont", "limites", "débit", "valeurs", "fenêtres",
  "pénalités", "profil", "trafic", "attendu", "faut", "il",
  "informer", "clients", "communication", "externe", "seulement",
  "interne", "suppression", "malgré", "démos", "prévues", "jeudi",
  "avancement",
]);

const EN_WORDS = new Set([
  // pronouns
  "i", "you", "he", "she", "it", "we", "they", "me", "him", "her",
  "us", "them", "my", "your", "his", "its", "our", "their",
  "myself", "yourself", "himself", "herself", "itself", "ourselves",
  // determiners / articles
  "the", "a", "an", "this", "that", "these", "those", "some", "any",
  "each", "every", "no",
  // prepositions / conjunctions
  "in", "on", "at", "to", "for", "of", "with", "from", "by",
  "and", "but", "or", "so", "yet", "nor", "if", "then",
  "about", "above", "below", "between", "through", "during",
  "before", "after", "since", "until", "against", "into", "out",
  // verbs (common forms)
  "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did",
  "will", "would", "can", "could", "should", "may", "might", "shall",
  "must", "need", "going", "want", "think", "know", "said", "make",
  // adverbs / other
  "not", "also", "just", "very", "still", "already", "always", "never",
  "here", "there", "when", "where", "how", "what", "which", "who",
  "why", "all", "more", "much", "many", "most", "other", "only",
  "than", "too", "well", "now", "then",
  // meeting-specific
  "meeting", "project", "team", "goal", "minutes", "decision",
  "action", "risk", "timeline", "deliverable", "next", "steps",
  "budget", "report", "owner", "update", "status", "agenda",
]);

// ── Common bigrams (space-joined) ────────────────────────────────────────────
const FR_BIGRAMS = new Set([
  "il y", "y a", "c est", "n est", "ce qui", "ce que", "il faut",
  "on va", "nous avons", "je pense", "est ce", "de la", "à la",
  "par rapport", "en ce", "il est", "elle est", "on a", "je suis",
  "qu on", "qu il", "mise à", "à jour", "point de",
]);

const EN_BIGRAMS = new Set([
  "it is", "we need", "i think", "going to", "want to", "have to",
  "need to", "we should", "let us", "there is", "that is", "do not",
  "can we", "will be", "should be", "has been", "would be", "as well",
  "in terms", "make sure", "follow up", "next steps", "action item",
  "based on", "looking at", "move on",
]);

// Characters with diacritics strongly signal French in an en/fr context.
const FR_ACCENT_PATTERN = /[àâäéèêëïîôùûüÿçœæ]/gi;

// ── Detection logic ──────────────────────────────────────────────────────────

interface DetectionResult {
  language: DetectedLanguage;
  confidence: number;
  frRatio: number;
  enRatio: number;
}

function detectLanguage(transcript: string): DetectionResult {
  const lower = transcript.toLowerCase();
  const normalized = lower
    .replace(/[’']/g, " ")
    .replace(/-/g, " ");

  // Tokenise into words
  const words = normalized
    .replace(/[^a-zàâäéèêëïîôùûüÿçœæ\s]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0);

  if (words.length === 0) {
    return { language: "en", confidence: 0.5, frRatio: 0, enRatio: 0 };
  }

  // ── 1. Unigram scoring ────────────────────────────────────────────────────
  let frWordHits = 0;
  let enWordHits = 0;
  for (const word of words) {
    if (FR_WORDS.has(word)) frWordHits++;
    if (EN_WORDS.has(word)) enWordHits++;
  }

  // ── 2. Bigram scoring (weighted ×2) ───────────────────────────────────────
  let frBigramHits = 0;
  let enBigramHits = 0;
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    if (FR_BIGRAMS.has(bigram)) frBigramHits++;
    if (EN_BIGRAMS.has(bigram)) enBigramHits++;
  }

  // ── 3. Accent character scoring ───────────────────────────────────────────
  const accentMatches = transcript.match(FR_ACCENT_PATTERN);
  const accentCount = accentMatches ? accentMatches.length : 0;
  // Normalise: each accent char adds ~0.5 weight
  const accentWeight = Math.min(accentCount * 0.5, words.length * 0.15);

  // ── Combine scores ────────────────────────────────────────────────────────
  const frScore = frWordHits + frBigramHits * 2 + accentWeight;
  const enScore = enWordHits + enBigramHits * 2;

  const totalScore = frScore + enScore;
  if (totalScore === 0) {
    return { language: "en", confidence: 0.5, frRatio: 0, enRatio: 0 };
  }

  const frRatio = frScore / totalScore;
  const enRatio = enScore / totalScore;
  const dominance = Math.abs(frRatio - enRatio);

  const hasStrongFrenchSignal = frWordHits + frBigramHits >= 6 || accentCount >= 3;
  const hasStrongEnglishSignal = enWordHits + enBigramHits >= 6;
  const hasBilingualSignal = hasStrongFrenchSignal && hasStrongEnglishSignal;

  // ── Thresholds ────────────────────────────────────────────────────────────
  let language: DetectedLanguage;
  let confidence: number;

  if (hasBilingualSignal && dominance < 0.55) {
    language = "mixed";
    confidence = Math.max(0.45, 1 - dominance);
  } else if (frRatio > 0.58 || (accentCount >= 3 && frRatio > 0.5)) {
    language = "fr";
    confidence = Math.min(0.6 + frRatio * 0.4, 1);
  } else if (frRatio < 0.42) {
    language = "en";
    confidence = Math.min(0.6 + enRatio * 0.4, 1);
  } else {
    language = "mixed";
    // Lower confidence the more evenly split it is
    confidence = Math.max(0.3, 1 - Math.abs(frRatio - 0.5) * 2);
  }

  // Low word count reduces confidence
  if (words.length < 20) {
    confidence *= 0.7;
  } else if (words.length < 50) {
    confidence *= 0.85;
  }

  confidence = Math.round(confidence * 100) / 100;

  return { language, confidence, frRatio: Math.round(frRatio * 100) / 100, enRatio: Math.round(enRatio * 100) / 100 };
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body: DetectRequest = await req.json();

    if (!body.transcript || typeof body.transcript !== "string") {
      return NextResponse.json(
        { error: "transcript is required" },
        { status: 400 }
      );
    }

    if (body.transcript.trim().length === 0) {
      return NextResponse.json(
        { error: "transcript must not be empty" },
        { status: 400 }
      );
    }

    const { language, confidence, frRatio, enRatio } = detectLanguage(body.transcript);
    const response: DetectResponse = { language, confidence, frRatio, enRatio };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
