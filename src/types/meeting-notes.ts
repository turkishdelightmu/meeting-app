// ── Schema types for structured meeting-note output ──────────────────────────

/** Confidence level the model assigns to its own output */
export type ConfidenceLevel = "high" | "medium" | "low";

/** Priority for an action item */
export type Priority = "high" | "medium" | "low";

/** Status badge for a decision */
export type DecisionStatus = "confirmed" | "tentative" | "rejected";

// ── Section types ────────────────────────────────────────────────────────────

export interface SummaryBullet {
  /** Plain-text summary sentence */
  text: string;
}

export interface Decision {
  /** Short title, e.g. "Delay launch to November 15th" */
  title: string;
  status: DecisionStatus;
  /** Person responsible for executing the decision */
  owner?: string;
  /** When the decision takes effect, e.g. "Immediate" */
  effectiveDate?: string;
  /** Direct quote from transcript that supports the decision */
  evidenceQuote?: string;
}

export interface ActionItem {
  /** Concise action description */
  title: string;
  /** Assigned person */
  assignee?: string;
  /** First letter used for avatar circle */
  assigneeInitial?: string;
  /** Due-date string, e.g. "ASAP", "Oct 20" */
  dueDate?: string;
  priority?: Priority;
  /** Whether the item has been checked off (always false from AI) */
  done: boolean;
}

export interface RiskItem {
  text: string;
}

export interface OpenQuestion {
  text: string;
}

// ── Top-level response ───────────────────────────────────────────────────────

export interface MeetingNotesResult {
  /** Overall AI confidence in its extraction */
  confidence: ConfidenceLevel;
  /** Detected / forced output language */
  language: "en" | "fr";
  summary: SummaryBullet[];
  decisions: Decision[];
  actionItems: ActionItem[];
  risks: RiskItem[];
  openQuestions: OpenQuestion[];
}
