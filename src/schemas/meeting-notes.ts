import { z } from "zod";

// ── Enums / Literals ─────────────────────────────────────────────────────────

export const ConfidenceLevelSchema = z.enum(["high", "medium", "low"]);
export const PrioritySchema = z.enum(["high", "medium", "low"]);
export const DecisionStatusSchema = z.enum(["confirmed", "tentative", "rejected"]);
export const LanguageSchema = z.enum(["en", "fr"]);

// ── Section schemas ──────────────────────────────────────────────────────────

export const SummaryBulletSchema = z.object({
  text: z.string().min(1, "Summary bullet text must not be empty"),
});

export const DecisionSchema = z.object({
  title: z.string().min(1, "Decision title must not be empty"),
  status: DecisionStatusSchema,
  owner: z.string().optional(),
  effectiveDate: z.string().optional(),
  evidenceQuote: z.string().optional(),
});

export const ActionItemSchema = z.object({
  title: z.string().min(1, "Action item title must not be empty"),
  assignee: z.string().optional(),
  assigneeInitial: z.string().max(2).optional(),
  dueDate: z.string().optional(),
  priority: PrioritySchema.optional(),
  done: z.boolean(),
});

export const RiskItemSchema = z.object({
  text: z.string().min(1, "Risk text must not be empty"),
});

export const OpenQuestionSchema = z.object({
  text: z.string().min(1, "Open question text must not be empty"),
});

// ── Top-level result schema ──────────────────────────────────────────────────

export const MeetingNotesResultSchema = z.object({
  confidence: ConfidenceLevelSchema,
  language: LanguageSchema,
  summary: z.array(SummaryBulletSchema).min(1, "At least one summary bullet is required"),
  decisions: z.array(DecisionSchema),
  actionItems: z.array(ActionItemSchema),
  risks: z.array(RiskItemSchema),
  openQuestions: z.array(OpenQuestionSchema),
});

// ── Inferred type (should match MeetingNotesResult in types/meeting-notes.ts)
export type MeetingNotesResultParsed = z.infer<typeof MeetingNotesResultSchema>;
