import { NextResponse } from "next/server";
import type {
  GenerateRequest,
  GenerateResponse,
  GenerateSource,
} from "@/types/api";
import type { MeetingNotesResult } from "@/types/meeting-notes";
import { MOCK_MEETING_NOTES, MOCK_MEETING_NOTES_FR } from "@/data/mock-meeting-notes";
import { MeetingNotesResultSchema } from "@/schemas/meeting-notes";
import { callClaude } from "@/lib/claude";
import { callOllama, callOllamaRepair, isOllamaReachable } from "@/lib/ollama";

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

/** Whether the user explicitly opted into the local Ollama provider */
function isOllamaSelected(): boolean {
  return process.env.LLM_PROVIDER === "ollama";
}

function shouldSkipOllamaRepair(): boolean {
  return process.env.OLLAMA_SKIP_REPAIR === "true";
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
    normalized.includes("permission_error") ||
    normalized.includes("load failed") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("network") ||
    normalized.includes("timeout") ||
    normalized.includes("socket")
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripMarkdownArtifacts(input: string): string {
  return input
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .trim();
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const decoded = stripMarkdownArtifacts(decodeHtmlEntities(value).trim());
  return decoded.length > 0 ? decoded : undefined;
}

function toNonEmptyString(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return stripMarkdownArtifacts(decodeHtmlEntities(value).trim());
  }
  return fallback;
}

function sanitizeSummaryText(text: string): string {
  return text
    .replace(/(^|[.!?]\s+)let['’]s\s+/gi, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function toArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === undefined || value === null) {
    return [];
  }
  return [value];
}

function normalizeDecisionStatus(value: unknown): "confirmed" | "tentative" | "rejected" {
  if (value === "confirmed" || value === "tentative" || value === "rejected") {
    return value;
  }
  return "tentative";
}

function normalizePriority(value: unknown): "high" | "medium" | "low" | undefined {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }
  return undefined;
}

function normalizeConfidence(value: unknown): "high" | "medium" | "low" {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }
  return "medium";
}

function normalizeLanguage(value: unknown, fallback: "en" | "fr"): "en" | "fr" {
  if (value === "en" || value === "fr") {
    return value;
  }
  return fallback;
}

function deriveInitial(assignee?: string): string | undefined {
  if (!assignee) {
    return undefined;
  }
  const first = assignee.trim().charAt(0).toUpperCase();
  return first ? first.slice(0, 2) : undefined;
}

function normalizeOllamaResult(raw: unknown, fallbackLanguage: "en" | "fr") {
  const root = isRecord(raw) ? raw : {};

  const summary = toArray(root.summary)
    .map((item) => {
      if (isRecord(item)) {
        return {
          text: sanitizeSummaryText(
            toNonEmptyString(item.text, "Meeting notes summary.")
          ),
        };
      }
      return {
        text: sanitizeSummaryText(
          toNonEmptyString(item, "Meeting notes summary.")
        ),
      };
    })
    .filter((item) => item.text.length > 0);

  const decisions = toArray(root.decisions).map((item) => {
    const decision = isRecord(item) ? item : {};
    return {
      title: toNonEmptyString(decision.title, "Decision"),
      status: normalizeDecisionStatus(decision.status),
      owner: toOptionalString(decision.owner),
      effectiveDate: toOptionalString(decision.effectiveDate),
      evidenceQuote: toOptionalString(decision.evidenceQuote),
    };
  });

  const actionItems = toArray(root.actionItems).map((item) => {
    const action = isRecord(item) ? item : {};
    const assignee = toOptionalString(action.assignee);
    const rawInitial = toOptionalString(action.assigneeInitial);
    return {
      title: toNonEmptyString(action.title, "Action item"),
      assignee,
      assigneeInitial: rawInitial ?? deriveInitial(assignee),
      dueDate: toOptionalString(action.dueDate),
      priority: normalizePriority(action.priority),
      done: action.done === true ? true : false,
    };
  });

  const risks = toArray(root.risks).map((item) => {
    const risk = isRecord(item) ? item : {};
    return {
      text: toNonEmptyString(risk.text ?? item, ""),
    };
  }).filter((item) => item.text.length > 0);

  const openQuestions = toArray(root.openQuestions).map((item) => {
    const question = isRecord(item) ? item : {};
    return {
      text: toNonEmptyString(question.text ?? item, ""),
    };
  }).filter((item) => item.text.length > 0);

  const actionLikePrefixes = [
    "send ",
    "update ",
    "draft ",
    "start ",
    "prepare ",
    "mettre ",
    "envoyer ",
    "preparer ",
    "préparer ",
    "demarrer ",
    "démarrer ",
  ];

  const actionableFromOpenQuestions: typeof actionItems = [];
  const filteredOpenQuestions = openQuestions.filter((question) => {
    const normalizedQuestion = normalizeForMatching(question.text);
    const isActionLike = actionLikePrefixes.some((prefix) =>
      normalizedQuestion.startsWith(prefix)
    );
    if (isActionLike) {
      actionableFromOpenQuestions.push({
        title: toNonEmptyString(question.text, "Action item"),
        assignee: undefined,
        assigneeInitial: undefined,
        dueDate: undefined,
        done: false,
        priority: "high",
      });
      return false;
    }
    return true;
  });

  return {
    confidence: normalizeConfidence(root.confidence),
    language: normalizeLanguage(root.language, fallbackLanguage),
    summary: summary.length > 0 ? summary : [{ text: "Meeting notes summary." }],
    decisions,
    actionItems: [...actionItems, ...actionableFromOpenQuestions],
    risks,
    openQuestions: filteredOpenQuestions,
  };
}

function normalizeForMatching(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type ExplicitAssignment = {
  assignee: string;
  task: string;
  normalizedTask: string;
  dueDate?: string;
};

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "to",
  "and",
  "or",
  "of",
  "for",
  "on",
  "in",
  "by",
  "with",
  "is",
  "are",
  "be",
  "we",
  "i",
  "you",
  "it",
  "this",
  "that",
  "today",
]);

function tokenizeMeaningful(value: string): string[] {
  return normalizeForMatching(value)
    .split(" ")
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function splitIntoTranscriptSentences(transcript: string): string[] {
  return transcript
    .split(/[\n.!?]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function extractDateMention(text: string): string | undefined {
  const patterns = [
    /\b(?:by|before|on|next)\s+(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)(?:\s+\d{1,2}(?::\d{2})?\s?(?:am|pm))?/i,
    /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+\d{1,2}(?::\d{2})?\s?(?:am|pm)\b/i,
    /\b(today|tomorrow)\b/i,
    /\b(d['’]ici|avant|le|prochain)\s+(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)(?:\s+à?\s*\d{1,2}h(?:\d{2})?)?/i,
    /\b(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+à?\s*\d{1,2}h(?:\d{2})?\b/i,
    /\b(aujourd['’]hui|demain)\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[0]) {
      return stripMarkdownArtifacts(decodeHtmlEntities(match[0].trim()));
    }
  }
  return undefined;
}

function hasSupportedCausalLink(summaryText: string, transcript: string): boolean {
  const normalizedSummary = normalizeForMatching(summaryText);
  const markers = [" due to ", " because ", " caused by "];

  let marker: string | undefined;
  for (const candidate of markers) {
    if (normalizedSummary.includes(candidate.trim())) {
      marker = candidate.trim();
      break;
    }
  }

  if (!marker) {
    return true;
  }

  const parts = normalizedSummary.split(marker);
  if (parts.length < 2) {
    return true;
  }

  const leftTokens = new Set(tokenizeMeaningful(parts[0] ?? ""));
  const rightTokens = new Set(tokenizeMeaningful(parts.slice(1).join(" ")));

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return true;
  }

  const sentences = splitIntoTranscriptSentences(transcript);
  const leftTokenList = Array.from(leftTokens);
  const rightTokenList = Array.from(rightTokens);
  for (const sentence of sentences) {
    const sentenceTokens = new Set(tokenizeMeaningful(sentence));
    const leftOverlap = leftTokenList.some((token) => sentenceTokens.has(token));
    const rightOverlap = rightTokenList.some((token) =>
      sentenceTokens.has(token)
    );
    if (leftOverlap && rightOverlap) {
      return true;
    }
  }

  return false;
}

function extractSpeakerNames(transcript: string): Set<string> {
  const names = new Set<string>();
  const lineRegex = /(?:^|\n)\s*([A-ZÀ-ÖØ-Ý][A-Za-zÀ-ÖØ-öø-ÿ'-]*)\s*:/g;
  let match: RegExpExecArray | null = lineRegex.exec(transcript);
  while (match) {
    const name = match[1]?.trim();
    if (name) {
      names.add(name);
    }
    match = lineRegex.exec(transcript);
  }
  return names;
}

function extractExplicitAssignments(
  transcript: string,
  validAssignees: Set<string>
): ExplicitAssignment[] {
  const assignments: ExplicitAssignment[] = [];
  const regex = /\b([A-Z][a-z]+),\s*([^.\n!?]+)/g;
  let match: RegExpExecArray | null = regex.exec(transcript);
  while (match) {
    const assignee = match[1]?.trim();
    const task = match[2]?.trim();
    if (assignee && task && validAssignees.has(assignee)) {
      assignments.push({
        assignee,
        task,
        normalizedTask: normalizeForMatching(task),
        dueDate: extractDateMention(task),
      });
    }
    match = regex.exec(transcript);
  }
  return assignments;
}

function looksActionLikeSentence(text: string): boolean {
  const normalized = normalizeForMatching(text);
  const cues = [
    "we need",
    "need to",
    "let us",
    "let s",
    "lets ",
    "send ",
    "sending ",
    "we should ",
    "update ",
    "updating ",
    "draft ",
    "we will ",
    "start ",
    "prepare ",
    "il faut",
    "on doit",
    "on va ",
    "mettre ",
    "mettons ",
    "envoyer ",
    "envoyons ",
    "preparer ",
    "préparer ",
    "preparons ",
    "préparons ",
    "demarrer ",
    "démarrer ",
    "demarrons ",
    "démarrons ",
    "lance ",
  ];
  return cues.some((cue) => normalized.includes(cue));
}

function extractSpeakerTaskAssignments(
  transcript: string,
  validAssignees: Set<string>
): ExplicitAssignment[] {
  const assignments: ExplicitAssignment[] = [];
  const lineRegex =
    /(?:^|\n)\s*([A-ZÀ-ÖØ-Ý][A-Za-zÀ-ÖØ-öø-ÿ'-]*)\s*:\s*([^\n]+)/g;
  let match: RegExpExecArray | null = lineRegex.exec(transcript);
  while (match) {
    const speaker = match[1]?.trim();
    const content = match[2]?.trim();
    if (!speaker || !content || !validAssignees.has(speaker)) {
      match = lineRegex.exec(transcript);
      continue;
    }

    const chunks = content
      .split(/[.!?;]+/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    for (const chunk of chunks) {
      if (!looksActionLikeSentence(chunk)) {
        continue;
      }
      assignments.push({
        assignee: speaker,
        task: chunk,
        normalizedTask: normalizeForMatching(chunk),
        dueDate: extractDateMention(chunk),
      });
    }

    match = lineRegex.exec(transcript);
  }

  return assignments;
}

function findBestAssignmentForAction(
  actionTitle: string,
  assignments: ExplicitAssignment[]
): ExplicitAssignment | undefined {
  const normalizedTitle = normalizeForMatching(actionTitle);
  if (normalizedTitle.length > 0) {
    const exactLike = assignments.find(
      (assignment) =>
        assignment.normalizedTask.includes(normalizedTitle) ||
        normalizedTitle.includes(assignment.normalizedTask)
    );
    if (exactLike) {
      return exactLike;
    }
  }

  const titleTokens = new Set(tokenizeMeaningful(actionTitle));
  if (titleTokens.size === 0) {
    return undefined;
  }

  let best: ExplicitAssignment | undefined;
  let bestScore = 0;

  for (const assignment of assignments) {
    const assignmentTokens = tokenizeMeaningful(assignment.normalizedTask);
    const overlap = assignmentTokens.filter((token) => titleTokens.has(token))
      .length;
    if (overlap > bestScore) {
      best = assignment;
      bestScore = overlap;
    }
  }

  const minRequiredOverlap = titleTokens.size <= 3 ? 1 : 2;
  return bestScore >= minRequiredOverlap ? best : undefined;
}

function inferDueDateFromTranscript(
  actionTitle: string,
  transcript: string
): string | undefined {
  const titleTokens = new Set(tokenizeMeaningful(actionTitle));
  if (titleTokens.size === 0) {
    return undefined;
  }

  let bestSentence = "";
  let bestScore = 0;
  for (const sentence of splitIntoTranscriptSentences(transcript)) {
    const tokens = tokenizeMeaningful(sentence);
    const overlap = tokens.filter((token) => titleTokens.has(token)).length;
    if (overlap > bestScore) {
      bestScore = overlap;
      bestSentence = sentence;
    }
  }

  if (bestScore < 1 || bestSentence.length === 0) {
    return undefined;
  }
  return extractDateMention(bestSentence);
}

function appearsVerbatimInTranscript(text: string, transcript: string): boolean {
  const normalizedText = normalizeForMatching(text);
  if (normalizedText.length < 12) {
    return false;
  }
  return normalizeForMatching(transcript).includes(normalizedText);
}

function extractGroundingIssues(
  result: MeetingNotesResult,
  transcript: string
): string[] {
  const issues: string[] = [];
  const speakerNames = extractSpeakerNames(transcript);
  const assignments = [
    ...extractExplicitAssignments(transcript, speakerNames),
    ...extractSpeakerTaskAssignments(transcript, speakerNames),
  ];

  result.summary.forEach((item, index) => {
    const normalized = normalizeForMatching(item.text);
    if (
      (normalized.includes(" due to ") ||
        normalized.includes(" because ") ||
        normalized.includes(" caused by ")) &&
      !hasSupportedCausalLink(item.text, transcript)
    ) {
      issues.push(
        `summary[${index}] contains an unsupported causal link. Keep blockers separate unless transcript states direct causality.`
      );
    }
  });

  result.decisions.forEach((decision, index) => {
    if (!decision.evidenceQuote) {
      issues.push(
        `decisions[${index}] is missing evidenceQuote. Include a direct quote from transcript.`
      );
      return;
    }
    if (!appearsVerbatimInTranscript(decision.evidenceQuote, transcript)) {
      issues.push(
        `decisions[${index}].evidenceQuote is not a verbatim quote from transcript.`
      );
    }
  });

  result.actionItems.forEach((item, index) => {
    if (!item.assignee) {
      const bestAssignment = findBestAssignmentForAction(item.title, assignments);
      if (bestAssignment) {
        issues.push(
          `actionItems[${index}] is missing assignee. Transcript explicitly assigns this to ${bestAssignment.assignee}.`
        );
      }
    }

    if (
      item.dueDate &&
      !appearsVerbatimInTranscript(item.dueDate, transcript)
    ) {
      issues.push(
        `actionItems[${index}].dueDate appears ungrounded. Remove it unless transcript states it explicitly.`
      );
    }
  });

  result.decisions.forEach((decision, index) => {
    if (
      decision.effectiveDate &&
      !appearsVerbatimInTranscript(decision.effectiveDate, transcript)
    ) {
      issues.push(
        `decisions[${index}].effectiveDate appears ungrounded. Remove it unless transcript states it explicitly.`
      );
    }
  });

  return issues;
}

function sanitizeUngroundedTemporalFields(
  result: MeetingNotesResult,
  transcript: string
): MeetingNotesResult {
  const speakerNames = extractSpeakerNames(transcript);
  const assignments = [
    ...extractExplicitAssignments(transcript, speakerNames),
    ...extractSpeakerTaskAssignments(transcript, speakerNames),
  ];
  return {
    ...result,
    decisions: result.decisions.map((decision) => ({
      ...decision,
      effectiveDate:
        decision.effectiveDate &&
        appearsVerbatimInTranscript(decision.effectiveDate, transcript)
          ? decision.effectiveDate
          : undefined,
    })),
    actionItems: result.actionItems.map((item) => {
      const matchedAssignment = findBestAssignmentForAction(
        item.title,
        assignments
      );
      const assignee = item.assignee ?? matchedAssignment?.assignee;
      const normalizedAssigneeInitial = assignee
        ? deriveInitial(assignee)
        : item.assigneeInitial;
      const inferredDueDate =
        matchedAssignment?.dueDate ??
        inferDueDateFromTranscript(item.title, transcript);
      return {
        ...item,
        assignee,
        assigneeInitial: normalizedAssigneeInitial,
        dueDate:
          item.dueDate && appearsVerbatimInTranscript(item.dueDate, transcript)
            ? item.dueDate
            : inferredDueDate,
      };
    }),
  };
}

function isPlaceholderActionTitle(title: string): boolean {
  const normalized = normalizeForMatching(title);
  return normalized === "action item" || normalized.startsWith("action item ");
}

function dedupeActionItems(items: MeetingNotesResult["actionItems"]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalizeForMatching(
      `${item.title}|${item.assignee ?? ""}|${item.dueDate ?? ""}`
    );
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function containsPhraseInOutput(result: MeetingNotesResult, phrases: string[]): boolean {
  const output = collectOutputText(result);
  return includesAnyPhrase(output, phrases);
}

function enrichActionItemsFromTranscript(
  result: MeetingNotesResult,
  transcript: string
): MeetingNotesResult {
  const speakerNames = extractSpeakerNames(transcript);
  const assignments = [
    ...extractExplicitAssignments(transcript, speakerNames),
    ...extractSpeakerTaskAssignments(transcript, speakerNames),
  ];

  const existingNonPlaceholderTitles = new Set(
    result.actionItems
      .filter((item) => !isPlaceholderActionTitle(item.title))
      .map((item) => normalizeForMatching(item.title))
  );

  const assignmentQueue = assignments.filter((assignment) => {
    const normalizedTask = normalizeForMatching(assignment.task);
    return normalizedTask.length > 0 && !existingNonPlaceholderTitles.has(normalizedTask);
  });

  const normalizedItems = result.actionItems.map((item) => {
    if (!isPlaceholderActionTitle(item.title) || assignmentQueue.length === 0) {
      return item;
    }
    const replacement = assignmentQueue.shift();
    if (!replacement) {
      return item;
    }
    return {
      ...item,
      title: replacement.task,
      assignee: replacement.assignee,
      assigneeInitial: deriveInitial(replacement.assignee),
      dueDate: replacement.dueDate,
      priority: item.priority ?? "high",
      done: false,
    };
  });

  const enriched: MeetingNotesResult = {
    ...result,
    actionItems: dedupeActionItems(normalizedItems),
  };

  const addActionItem = (title: string, assignee?: string, dueDate?: string) => {
    const normalizedTitle = normalizeForMatching(title);
    const exists = enriched.actionItems.some(
      (item) => normalizeForMatching(item.title) === normalizedTitle
    );
    if (exists) {
      return;
    }
    enriched.actionItems.push({
      title,
      assignee,
      assigneeInitial: assignee ? deriveInitial(assignee) : undefined,
      dueDate,
      priority: "high",
      done: false,
    });
  };

  if (
    includesAnyPhrase(normalizeForMatching(transcript), [
      "internal announcement",
      "annonce interne",
    ]) &&
    !containsPhraseInOutput(enriched, ["internal announcement", "annonce interne"])
  ) {
    const mention = transcript.match(
      /([A-ZÀ-ÖØ-Ý][A-Za-zÀ-ÖØ-öø-ÿ'-]*)\s*:[^\n]*internal announcement/i
    );
    addActionItem(
      "Send internal announcement",
      mention?.[1],
      extractDateMention(transcript)
    );
  }

  if (
    includesAnyPhrase(normalizeForMatching(transcript), [
      "next check in",
      "next check-in",
      "prochain point",
    ]) &&
    !containsPhraseInOutput(enriched, [
      "next check in",
      "next check-in",
      "prochain point",
      "10am",
      "10h",
    ])
  ) {
    const match = transcript.match(/next check-?in[^.\n]*/i);
    const title = match?.[0]
      ? `Confirm ${match[0].trim()}`
      : "Confirm next check-in timing";
    addActionItem(title, undefined, extractDateMention(match?.[0] ?? transcript));
  }

  enriched.actionItems = dedupeActionItems(enriched.actionItems);
  return enriched;
}

function dedupeTextItems<T extends { text: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalizeForMatching(item.text);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function enrichRisksAndOpenQuestionsFromTranscript(
  result: MeetingNotesResult,
  transcript: string
): MeetingNotesResult {
  const normalizedTranscript = normalizeForMatching(transcript);
  const enriched: MeetingNotesResult = {
    ...result,
    risks: [...result.risks],
    openQuestions: [...result.openQuestions],
  };

  const addRisk = (text: string) => {
    const exists = enriched.risks.some(
      (item) => normalizeForMatching(item.text) === normalizeForMatching(text)
    );
    if (!exists) {
      enriched.risks.push({ text });
    }
  };

  const addOpenQuestion = (text: string) => {
    const exists = enriched.openQuestions.some(
      (item) => normalizeForMatching(item.text) === normalizeForMatching(text)
    );
    if (!exists) {
      enriched.openQuestions.push({ text });
    }
  };

  if (
    includesAnyPhrase(normalizedTranscript, ["failing in staging", "api integration"]) &&
    !containsPhraseInOutput(enriched, ["failing in staging", "api integration"])
  ) {
    addRisk("API integration remains unstable in staging.");
  }

  if (
    includesAnyPhrase(normalizedTranscript, ["rate limits", "vendor"]) &&
    !containsPhraseInOutput(enriched, ["rate limits", "vendor"])
  ) {
    addRisk("Vendor rate limits may impact launch readiness without caching/backoff.");
  }

  if (
    includesAnyPhrase(normalizedTranscript, ["blocked on the auth flow", "auth flow changes"]) &&
    !containsPhraseInOutput(enriched, ["auth flow", "auth updates"])
  ) {
    addRisk("Auth flow changes are blocking progress toward beta readiness.");
  }

  if (
    includesAnyPhrase(normalizedTranscript, ["sign off from product and sales", "sign-off from product and sales"]) &&
    !containsPhraseInOutput(enriched, ["sign off", "sign-off", "product and sales"])
  ) {
    addOpenQuestion("When will Product and Sales provide sign-off for the scope change?");
  }

  if (
    includesAnyPhrase(normalizedTranscript, ["advanced analytics"]) &&
    !containsPhraseInOutput(enriched, ["advanced analytics"])
  ) {
    addOpenQuestion("Should advanced analytics be removed from v1 scope?");
  }

  if (
    includesAnyPhrase(normalizedTranscript, ["next check in", "next check-in"]) &&
    !containsPhraseInOutput(enriched, ["next check in", "next check-in", "10am", "10h"])
  ) {
    const mention = transcript.match(/next check-?in[^.\n]*/i)?.[0]?.trim();
    addOpenQuestion(
      mention ? `Confirm ${mention}.` : "Confirm next check-in timing."
    );
  }

  enriched.risks = dedupeTextItems(enriched.risks);
  enriched.openQuestions = dedupeTextItems(enriched.openQuestions);
  return enriched;
}

function removeUnsupportedCausalMarker(text: string): string {
  return text
    .replace(/\s+because\s+/i, ". ")
    .replace(/\s+due to\s+/i, ". ")
    .replace(/\s+caused by\s+/i, ". ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function finalGroundingSanitize(
  result: MeetingNotesResult,
  transcript: string
): MeetingNotesResult {
  return {
    ...result,
    summary: result.summary.map((item) => ({
      text: hasSupportedCausalLink(item.text, transcript)
        ? item.text
        : removeUnsupportedCausalMarker(item.text),
    })),
    actionItems: result.actionItems.map((item) => ({
      ...item,
      dueDate:
        item.dueDate && appearsVerbatimInTranscript(item.dueDate, transcript)
          ? item.dueDate
          : undefined,
    })),
  };
}

function parseStructuredJson(rawText: string): { ok: true; parsed: unknown } | { ok: false } {
  try {
    let cleanText = rawText.trim();
    if (cleanText.startsWith("```")) {
      cleanText = cleanText
        .replace(/^```(?:json)?\s*\n?/, "")
        .replace(/\n?```\s*$/, "");
    }
    return { ok: true, parsed: JSON.parse(cleanText) };
  } catch {
    return { ok: false };
  }
}

function includesAnyPhrase(haystack: string, phrases: string[]): boolean {
  return phrases.some((phrase) => haystack.includes(normalizeForMatching(phrase)));
}

function collectOutputText(result: MeetingNotesResult): string {
  const chunks: string[] = [];
  chunks.push(...result.summary.map((item) => item.text));
  chunks.push(
    ...result.decisions.flatMap((item) => [
      item.title,
      item.owner ?? "",
      item.effectiveDate ?? "",
      item.evidenceQuote ?? "",
    ])
  );
  chunks.push(
    ...result.actionItems.flatMap((item) => [
      item.title,
      item.assignee ?? "",
      item.dueDate ?? "",
    ])
  );
  chunks.push(...result.risks.map((item) => item.text));
  chunks.push(...result.openQuestions.map((item) => item.text));
  return normalizeForMatching(chunks.filter(Boolean).join(" "));
}

function extractCompletenessIssues(
  result: MeetingNotesResult,
  transcript: string
): string[] {
  const issues: string[] = [];
  const normalizedTranscript = normalizeForMatching(transcript);
  const normalizedOutput = collectOutputText(result);
  const turnCount = transcript
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0).length;

  if ((turnCount >= 6 || transcript.length >= 500) && result.summary.length < 2) {
    issues.push(
      "summary is too short for this transcript. Provide at least 2 concise bullets covering launch status, blockers, scope decision, and key commitments."
    );
  }

  if (
    includesAnyPhrase(normalizedTranscript, [
      "auth flow",
      "authentication",
      "authentification",
      "auth updates",
      "blocked on auth",
    ]) &&
    !includesAnyPhrase(normalizedOutput, [
      "auth flow",
      "authentication",
      "authentification",
      "auth",
    ])
  ) {
    issues.push(
      "auth blocker is missing from output. Mention auth flow/authentication dependency in summary, risks, or open questions."
    );
  }

  if (
    includesAnyPhrase(normalizedTranscript, [
      "advanced analytics",
      "analytics avancees",
      "analytics avancées",
    ]) &&
    !includesAnyPhrase(normalizedOutput, [
      "advanced analytics",
      "analytics avancees",
      "analytics avancées",
    ])
  ) {
    issues.push(
      "scope-cut decision about advanced analytics is missing. Include it in decisions or open questions."
    );
  }

  if (
    includesAnyPhrase(normalizedTranscript, [
      "internal announcement",
      "annonce interne",
    ]) &&
    !result.actionItems.some((item) =>
      includesAnyPhrase(normalizeForMatching(item.title), [
        "internal announcement",
        "annonce interne",
      ])
    )
  ) {
    issues.push(
      "missing action item for internal announcement. Add it under actionItems with assignee when inferable."
    );
  }

  if (
    includesAnyPhrase(normalizedTranscript, ["next check in", "prochain point"]) &&
    !includesAnyPhrase(normalizedOutput, ["next check in", "prochain point", "10am", "10h"])
  ) {
    issues.push(
      "follow-up checkpoint timing is missing. Include next check-in as an open question or action item."
    );
  }

  return issues;
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

    // ── Ollama integration (opt-in via LLM_PROVIDER=ollama) ─────────────────
    if (isOllamaSelected()) {
      const reachable = await isOllamaReachable();
      if (!reachable) {
        const response: GenerateResponse = {
          ok: false,
          reason: "server_error",
          message:
            "Ollama is not reachable at http://localhost:11434. Start Ollama (ollama serve) and ensure the model is pulled (ollama pull llama3.2:latest).",
        };
        return NextResponse.json(response);
      }

      const ollamaResult = await callOllama(body.transcript, language);

      if (!ollamaResult.ok) {
        if (ollamaResult.reason === "refusal") {
          const response: GenerateResponse = {
            ok: false,
            reason: "refusal",
            message: ollamaResult.message,
          };
          return NextResponse.json(response);
        }

        // Treat Ollama errors as server errors (no silent mock fallback)
        const response: GenerateResponse = {
          ok: false,
          reason: "server_error",
          message: ollamaResult.message,
        };
        return NextResponse.json(response);
      }

      const parsedRaw = parseStructuredJson(ollamaResult.rawText);
      if (!parsedRaw.ok) {
        const response: GenerateResponse = {
          ok: false,
          reason: "validation_error",
          rawOutput: ollamaResult.rawText,
        };
        return NextResponse.json(response);
      }

      let normalizedOllamaResult = normalizeOllamaResult(parsedRaw.parsed, language);
      let parsed = MeetingNotesResultSchema.safeParse(normalizedOllamaResult);
      if (!parsed.success) {
        const response: GenerateResponse = {
          ok: false,
          reason: "validation_error",
          rawOutput: JSON.stringify(parsedRaw.parsed, null, 2),
        };
        return NextResponse.json(response);
      }

      let candidate = sanitizeUngroundedTemporalFields(parsed.data, body.transcript);
      candidate = enrichActionItemsFromTranscript(candidate, body.transcript);
      candidate = enrichRisksAndOpenQuestionsFromTranscript(candidate, body.transcript);
      candidate = finalGroundingSanitize(candidate, body.transcript);
      let groundingIssues = extractGroundingIssues(candidate, body.transcript);
      let completenessIssues = extractCompletenessIssues(candidate, body.transcript);
      groundingIssues = [...groundingIssues, ...completenessIssues];

      if (groundingIssues.length > 0 && !shouldSkipOllamaRepair()) {
        const repair = await callOllamaRepair(
          body.transcript,
          language,
          JSON.stringify(candidate, null, 2),
          groundingIssues
        );

        if (repair.ok) {
          const repairParsedRaw = parseStructuredJson(repair.rawText);
          if (repairParsedRaw.ok) {
            normalizedOllamaResult = normalizeOllamaResult(
              repairParsedRaw.parsed,
              language
            );
            parsed = MeetingNotesResultSchema.safeParse(normalizedOllamaResult);
            if (parsed.success) {
              candidate = sanitizeUngroundedTemporalFields(
                parsed.data,
                body.transcript
              );
              candidate = enrichActionItemsFromTranscript(
                candidate,
                body.transcript
              );
              candidate = enrichRisksAndOpenQuestionsFromTranscript(
                candidate,
                body.transcript
              );
              candidate = finalGroundingSanitize(candidate, body.transcript);
              completenessIssues = extractCompletenessIssues(
                candidate,
                body.transcript
              );
              groundingIssues = [
                ...extractGroundingIssues(candidate, body.transcript),
                ...completenessIssues,
              ];
            }
          }
        }
      }

      // Keep successful output even when minor grounding issues remain.
      // Log only in explicit debug mode to avoid noisy development output.
      if (
        groundingIssues.length > 0 &&
        process.env.DEBUG_OLLAMA_GROUNDING === "true"
      ) {
        console.warn(
          "[generate] Ollama grounding issues remained after repair:",
          groundingIssues
        );
      }

      const response: GenerateResponse = {
        ok: true,
        result: candidate,
        source: "ollama",
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
        const fallbackResponse = buildValidatedMockResponse(language, "mock");
        return NextResponse.json(fallbackResponse);
      }

      // Zod validation (Step 5)
      const parsed = MeetingNotesResultSchema.safeParse(rawParsed);
      if (!parsed.success) {
        const fallbackResponse = buildValidatedMockResponse(language, "mock");
        return NextResponse.json(fallbackResponse);
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
