// ── Step 8: Plain-text and Markdown formatters for MeetingNotesResult ────────

import type { MeetingNotesResult } from "@/types/meeting-notes";
import { getLabels, type UILanguage } from "./i18n";

// ── helpers ──────────────────────────────────────────────────────────────────

/** Strip **bold** markers for plain text */
function stripBold(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, "$1");
}

// ── Plain text ───────────────────────────────────────────────────────────────

export function toPlainText(data: MeetingNotesResult): string {
  const t = getLabels(data.language as UILanguage);
  const lines: string[] = [];

  // Summary
  if (data.summary.length > 0) {
    lines.push(t.executiveSummary.toUpperCase());
    data.summary.forEach((b) => lines.push(`• ${stripBold(b.text)}`));
    lines.push("");
  }

  // Decisions
  if (data.decisions.length > 0) {
    lines.push(t.keyDecisions.toUpperCase());
    data.decisions.forEach((d) => {
      lines.push(`  ${d.title} [${t.decisionStatus[d.status]}]`);
      if (d.owner) lines.push(`    ${t.owner}: ${d.owner}`);
      if (d.effectiveDate) lines.push(`    ${t.effective}: ${d.effectiveDate}`);
      if (d.evidenceQuote) lines.push(`    "${d.evidenceQuote}"`);
    });
    lines.push("");
  }

  // Action items
  if (data.actionItems.length > 0) {
    lines.push(t.nextSteps.toUpperCase());
    data.actionItems.forEach((item) => {
      const parts = [`[ ] ${item.title}`];
      if (item.assignee) parts.push(`@${item.assignee}`);
      if (item.dueDate) parts.push(`due ${item.dueDate}`);
      if (item.priority) parts.push(`[${t.priority[item.priority]}]`);
      lines.push(`  ${parts.join("  ")}`);
    });
    lines.push("");
  }

  // Risks
  if (data.risks.length > 0) {
    lines.push(t.risksAndBlockers.toUpperCase());
    data.risks.forEach((r) => lines.push(`  ⚠ ${r.text}`));
    lines.push("");
  }

  // Open questions
  if (data.openQuestions.length > 0) {
    lines.push(t.openQuestions.toUpperCase());
    data.openQuestions.forEach((q) => lines.push(`  ? ${q.text}`));
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

// ── Markdown ─────────────────────────────────────────────────────────────────

export function toMarkdown(data: MeetingNotesResult): string {
  const t = getLabels(data.language as UILanguage);
  const lines: string[] = [];

  // Summary
  if (data.summary.length > 0) {
    lines.push(`## ${t.executiveSummary}`);
    lines.push("");
    data.summary.forEach((b) => lines.push(`- ${b.text}`));
    lines.push("");
  }

  // Decisions
  if (data.decisions.length > 0) {
    lines.push(`## ${t.keyDecisions}`);
    lines.push("");
    data.decisions.forEach((d) => {
      lines.push(`### ${d.title}`);
      lines.push("");
      lines.push(`**Status:** ${t.decisionStatus[d.status]}`);
      if (d.owner) lines.push(`**${t.owner}:** ${d.owner}`);
      if (d.effectiveDate) lines.push(`**${t.effective}:** ${d.effectiveDate}`);
      if (d.evidenceQuote) {
        lines.push("");
        lines.push(`> "${d.evidenceQuote}"`);
      }
      lines.push("");
    });
  }

  // Action items
  if (data.actionItems.length > 0) {
    lines.push(`## ${t.nextSteps}`);
    lines.push("");
    data.actionItems.forEach((item) => {
      const meta: string[] = [];
      if (item.assignee) meta.push(`@${item.assignee}`);
      if (item.dueDate) meta.push(`due ${item.dueDate}`);
      if (item.priority) meta.push(`\`${t.priority[item.priority]}\``);
      const suffix = meta.length > 0 ? ` — ${meta.join(" · ")}` : "";
      lines.push(`- [ ] ${item.title}${suffix}`);
    });
    lines.push("");
  }

  // Risks
  if (data.risks.length > 0) {
    lines.push(`## ${t.risksAndBlockers}`);
    lines.push("");
    data.risks.forEach((r) => lines.push(`- ⚠️ ${r.text}`));
    lines.push("");
  }

  // Open questions
  if (data.openQuestions.length > 0) {
    lines.push(`## ${t.openQuestions}`);
    lines.push("");
    data.openQuestions.forEach((q) => lines.push(`- ❓ ${q.text}`));
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}
