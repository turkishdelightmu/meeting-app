// ── Step 7: Bilingual UI label map ───────────────────────────────────────────
// Provides English/French translations for all static strings in SuccessState.

import type { ConfidenceLevel, DecisionStatus, Priority } from "@/types/meeting-notes";

export type UILanguage = "en" | "fr";

export interface UILabels {
  /** Header */
  processedNotes: string;
  sourceLabel: string;
  sourceClaude: string;
  sourceOllama: string;
  sourceMock: string;
  aiConfidence: string;

  /** Confidence values */
  confidence: Record<ConfidenceLevel, string>;

  /** Section headings */
  executiveSummary: string;
  keyDecisions: string;
  nextSteps: string;
  importantDates: string;
  risksAndBlockers: string;
  openQuestions: string;

  /** Decision detail labels */
  owner: string;
  effective: string;

  /** Decision status badges */
  decisionStatus: Record<DecisionStatus, string>;

  /** Priority badges */
  priority: Record<Priority, string>;

  /** Footer */
  wasThisUseful: string;
  copyAsText: string;
  copyAsMarkdown: string;
  copied: string;
}

const en: UILabels = {
  processedNotes: "Processed Notes",
  sourceLabel: "Source",
  sourceClaude: "Claude",
  sourceOllama: "Ollama",
  sourceMock: "Mock",
  aiConfidence: "AI Confidence",

  confidence: { high: "High", medium: "Medium", low: "Low" },

  executiveSummary: "Executive Summary",
  keyDecisions: "Key Decisions",
  nextSteps: "Next Steps",
  importantDates: "Important Dates",
  risksAndBlockers: "Risks & Blockers",
  openQuestions: "Open Questions",

  owner: "Owner",
  effective: "Effective",

  decisionStatus: { confirmed: "Confirmed", tentative: "Tentative", rejected: "Rejected" },

  priority: { high: "HIGH", medium: "MED", low: "LOW" },

  wasThisUseful: "Was this useful?",
  copyAsText: "Copy as text",
  copyAsMarkdown: "Copy as markdown",
  copied: "Copied!",
};

const fr: UILabels = {
  processedNotes: "Notes traitées",
  sourceLabel: "Source",
  sourceClaude: "Claude",
  sourceOllama: "Ollama",
  sourceMock: "Simulé",
  aiConfidence: "Confiance IA",

  confidence: { high: "Élevée", medium: "Moyenne", low: "Faible" },

  executiveSummary: "Résumé exécutif",
  keyDecisions: "Décisions clés",
  nextSteps: "Prochaines étapes",
  importantDates: "Dates importantes",
  risksAndBlockers: "Risques et blocages",
  openQuestions: "Questions ouvertes",

  owner: "Responsable",
  effective: "Date d'effet",

  decisionStatus: { confirmed: "Confirmée", tentative: "Provisoire", rejected: "Rejetée" },

  priority: { high: "HAUTE", medium: "MOY", low: "FAIBLE" },

  wasThisUseful: "Était-ce utile ?",
  copyAsText: "Copier en texte",
  copyAsMarkdown: "Copier en markdown",
  copied: "Copié !",
};

const labelsByLanguage: Record<UILanguage, UILabels> = { en, fr };

/** Retrieve the full label set for a given language. */
export function getLabels(lang: UILanguage): UILabels {
  return labelsByLanguage[lang] ?? labelsByLanguage.en;
}
