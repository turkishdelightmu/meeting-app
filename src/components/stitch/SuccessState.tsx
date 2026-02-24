"use client";

import { useState, useCallback } from "react";
import type { MeetingNotesResult, ConfidenceLevel, DecisionStatus, Priority } from "@/types/meeting-notes";
import { getLabels } from "@/lib/i18n";
import { toPlainText, toMarkdown } from "@/lib/format";
import { trackEvent } from "@/lib/analytics";

// ── helpers ──────────────────────────────────────────────────────────────────

/** Render **bold** markdown fragments inside plain text */
function renderBold(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}

const confidenceColor: Record<ConfidenceLevel, string> = {
  high: "bg-green-500",
  medium: "bg-yellow-500",
  low: "bg-red-500",
};

const statusStyle: Record<DecisionStatus, { bg: string; text: string; icon: string }> = {
  confirmed: {
    bg: "bg-green-100 dark:bg-green-500/10 dark:border dark:border-green-500/20",
    text: "text-green-800 dark:text-green-400",
    icon: "verified",
  },
  tentative: {
    bg: "bg-yellow-100 dark:bg-yellow-500/10 dark:border dark:border-yellow-500/20",
    text: "text-yellow-800 dark:text-yellow-400",
    icon: "pending",
  },
  rejected: {
    bg: "bg-red-100 dark:bg-red-500/10 dark:border dark:border-red-500/20",
    text: "text-red-800 dark:text-red-400",
    icon: "cancel",
  },
};

const priorityStyle: Record<Priority, { bg: string; text: string }> = {
  high: { bg: "bg-red-100 dark:bg-red-500/10 dark:border dark:border-red-500/20", text: "text-red-700 dark:text-red-400" },
  medium: { bg: "bg-orange-100 dark:bg-orange-500/10 dark:border dark:border-orange-500/20", text: "text-orange-700 dark:text-orange-400" },
  low: { bg: "bg-slate-100 dark:bg-zinc-800", text: "text-slate-600 dark:text-zinc-300" },
};

// Deterministic avatar colours keyed off the initial letter
const avatarPalettes: Record<string, string> = {
  S: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border dark:border-indigo-500/30",
  M: "bg-pink-100 text-pink-600 dark:bg-pink-900/50 dark:text-pink-300 dark:border dark:border-pink-500/30",
  J: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border dark:border-emerald-500/30",
  A: "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300 dark:border dark:border-amber-500/30",
};
function avatarColor(initial: string) {
  return avatarPalettes[initial] ?? "bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300";
}

function normalizeDisplayTitle(value: string): string {
  const trimmed = value.trim().replace(/[.;]+$/g, "");
  if (!trimmed) {
    return value;
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

// ── component ────────────────────────────────────────────────────────────────

interface SuccessStateProps {
  data: MeetingNotesResult;
  source: "claude" | "ollama" | "mock";
}

export default function SuccessState({ data, source }: SuccessStateProps) {
  const t = getLabels(data.language);
  const infoCardCount =
    (data.risks.length > 0 ? 1 : 0) +
    (data.openQuestions.length > 0 ? 1 : 0);
  const infoGridClass =
    infoCardCount === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1";

  // ── Step 8: copy + feedback state ──────────────────────────────────────────
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const showToast = useCallback((msg: string) => {
    setCopyToast(msg);
    setTimeout(() => setCopyToast(null), 1800);
  }, []);

  const handleCopyText = useCallback(async () => {
    const text = toPlainText(data);
    await navigator.clipboard.writeText(text);
    trackEvent({ name: "copy_text", language: data.language, source });
    showToast(t.copied);
  }, [data, source, showToast, t.copied]);

  const handleCopyMarkdown = useCallback(async () => {
    const md = toMarkdown(data);
    await navigator.clipboard.writeText(md);
    trackEvent({ name: "copy_markdown", language: data.language, source });
    showToast(t.copied);
  }, [data, source, showToast, t.copied]);

  const handleFeedback = useCallback(
    (vote: "up" | "down") => {
      const next = feedback === vote ? null : vote;
      setFeedback(next);
      if (next) {
        trackEvent({
          name: next === "up" ? "feedback_up" : "feedback_down",
          language: data.language,
          source,
        });
      }
    },
    [feedback, data.language, source]
  );

  return (
    <section className="flex flex-col bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-sm relative overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-border-dark flex justify-between items-center">
        <div className="flex gap-2 items-center">
          <span className="material-symbols-outlined text-green-500 text-xl">
            check_circle
          </span>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {t.processedNotes}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-1 rounded-full shadow-sm">
            {t.sourceLabel}: {source === "claude" ? t.sourceClaude : source === "ollama" ? t.sourceOllama : t.sourceMock}
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${confidenceColor[data.confidence]}`} />
            {t.aiConfidence}: {t.confidence[data.confidence]}
          </span>
        </div>
      </div>

      {/* ── Scrollable body ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* 1 ▸ Executive Summary */}
          {data.summary.length > 0 && (
            <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-700 p-6">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                <span className="material-symbols-outlined text-primary text-lg">summarize</span>
                {t.executiveSummary}
              </h3>
              <ul className="space-y-3">
                {data.summary.map((bullet, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span className="material-symbols-outlined text-slate-400 text-lg mt-0.5 shrink-0">
                      fiber_manual_record
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {renderBold(bullet.text)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 2 ▸ Key Decisions */}
          {data.decisions.length > 0 && (
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider px-1">
                <span className="material-symbols-outlined text-primary text-lg">gavel</span>
                {t.keyDecisions}
              </h3>
              {data.decisions.map((d, i) => {
                const s = statusStyle[d.status];
                return (
                  <div
                    key={i}
                    className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl shadow-sm border-l-4 border-primary p-5 relative overflow-hidden"
                  >
                    {/* title + badge */}
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-lg font-semibold text-slate-900 dark:text-white leading-tight">
                        {normalizeDisplayTitle(d.title)}
                      </h4>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text} shrink-0 ml-3`}
                      >
                        <span className="material-symbols-outlined text-[14px]">{s.icon}</span>
                        {t.decisionStatus[d.status]}
                      </span>
                    </div>

                    {/* owner / effective date chips */}
                    {(d.owner || d.effectiveDate) && (
                      <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-zinc-400 mb-4 items-center">
                        {d.owner && (
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]">person</span>
                            <span>
                              {t.owner}: <strong className="text-slate-700 dark:text-slate-200">{d.owner}</strong>
                            </span>
                          </div>
                        )}
                        {d.effectiveDate && (
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                            <span>
                              {t.effective}: <strong className="text-slate-700 dark:text-slate-200">{d.effectiveDate}</strong>
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* evidence quote chip */}
                    {d.evidenceQuote && (
                      <div className="bg-white dark:bg-zinc-900/50 rounded border border-slate-100 dark:border-zinc-700 p-3">
                        <p className="text-xs font-mono text-slate-500 dark:text-zinc-400 flex gap-2">
                          <span className="material-symbols-outlined text-[14px] mt-0.5 opacity-50">
                            format_quote
                          </span>
                          &ldquo;{d.evidenceQuote}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 3 ▸ Next Steps / Action Items */}
          {data.actionItems.length > 0 && (
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider px-1">
                <span className="material-symbols-outlined text-primary text-lg">checklist</span>
                {t.nextSteps}
              </h3>
              <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-700 divide-y divide-slate-100 dark:divide-zinc-700">
                {data.actionItems.map((item, i) => (
                  <div key={i} className="p-4 flex items-start gap-4 hover:bg-white dark:hover:bg-zinc-700/50 transition-colors">
                    <div className="mt-1">
                      <input
                        type="checkbox"
                        defaultChecked={item.done}
                        className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {normalizeDisplayTitle(item.title)}
                        </p>
                        {item.priority && (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shrink-0 ${priorityStyle[item.priority].bg} ${priorityStyle[item.priority].text}`}
                          >
                            {t.priority[item.priority]}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-zinc-400">
                        {item.assignee && (() => {
                          const displayInitial = item.assignee.trim().charAt(0).toUpperCase();
                          return (
                            <div className="flex items-center gap-1">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${avatarColor(displayInitial)}`}
                              >
                                {displayInitial}
                              </div>
                              <span>{item.assignee}</span>
                            </div>
                          );
                        })()}
                        {item.dueDate && (
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">event</span>
                            <span>{item.dueDate}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4 ▸ Risks & Open Questions */}
          {(data.risks.length > 0 || data.openQuestions.length > 0) && (
            <div className={`grid ${infoGridClass} gap-6`}>
              {/* Risks */}
              {data.risks.length > 0 && (
                <div className="bg-red-50 dark:bg-zinc-800/50 rounded-xl p-5 border border-red-100 dark:border-zinc-700 relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-red-500/5 dark:bg-red-500/10 rounded-tr-full pointer-events-none" />
                  <h3 className="flex items-center gap-2 text-sm font-bold text-red-800 dark:text-red-400 uppercase tracking-wider mb-3">
                    <span className="material-symbols-outlined text-lg">warning</span>
                    {t.risksAndBlockers}
                  </h3>
                  <ul className="space-y-2">
                    {data.risks.map((r, i) => (
                      <li key={i} className="text-sm text-red-900/80 dark:text-zinc-300 flex gap-2">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400 shrink-0" />
                        <span>{r.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Open Questions */}
              {data.openQuestions.length > 0 && (
                <div className="bg-amber-50 dark:bg-zinc-800/50 rounded-xl p-5 border border-amber-100 dark:border-zinc-700 relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-500/5 dark:bg-amber-500/10 rounded-tr-full pointer-events-none" />
                  <h3 className="flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-3">
                    <span className="material-symbols-outlined text-lg">help</span>
                    {t.openQuestions}
                  </h3>
                  <ul className="space-y-2">
                    {data.openQuestions.map((q, i) => (
                      <li key={i} className="text-sm text-amber-900/80 dark:text-zinc-300 flex gap-2">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                        <span>{q.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Copy toast ─────────────────────────────────────── */}
      {copyToast && (
        <div className="absolute top-4 right-4 z-10 bg-slate-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg animate-fade-in">
          {copyToast}
        </div>
      )}

      {/* ── Bottom Action Bar ──────────────────────────────────── */}
      <div className="p-3 border-t border-slate-100 dark:border-border-dark flex justify-center">
        <div className="bg-slate-50 dark:bg-zinc-800 rounded-full shadow-sm border border-slate-200 dark:border-zinc-700 py-1.5 px-3 inline-flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400 font-medium">
            <span>{t.wasThisUseful}</span>
            <div className="flex gap-1">
              <button
                onClick={() => handleFeedback("up")}
                className={`p-1 rounded transition-colors ${
                  feedback === "up"
                    ? "bg-green-100 dark:bg-green-900/40 text-green-600"
                    : "text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-700 hover:text-green-500"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">thumb_up</span>
              </button>
              <button
                onClick={() => handleFeedback("down")}
                className={`p-1 rounded transition-colors ${
                  feedback === "down"
                    ? "bg-red-100 dark:bg-red-900/40 text-red-600"
                    : "text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-700 hover:text-red-500"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">thumb_down</span>
              </button>
            </div>
          </div>
          <div className="h-4 w-px bg-slate-200 dark:bg-zinc-700" />
          <div className="flex gap-1">
            <button
              onClick={handleCopyText}
              className="size-8 flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 rounded-full transition-colors border border-transparent hover:border-slate-200 dark:hover:border-zinc-600"
              title={t.copyAsText}
              aria-label={t.copyAsText}
            >
              <span className="material-symbols-outlined text-[16px]">content_copy</span>
            </button>
            <button
              onClick={handleCopyMarkdown}
              className="size-8 flex items-center justify-center bg-slate-900 dark:bg-primary text-white rounded-full hover:opacity-90 transition-opacity shadow-md"
              title={t.copyAsMarkdown}
              aria-label={t.copyAsMarkdown}
            >
              <span className="material-symbols-outlined text-[16px]">markdown</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
