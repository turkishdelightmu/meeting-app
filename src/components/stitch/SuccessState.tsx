import type { MeetingNotesResult, ConfidenceLevel, DecisionStatus, Priority } from "@/types/meeting-notes";

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

const confidenceLabel: Record<ConfidenceLevel, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const statusStyle: Record<DecisionStatus, { bg: string; text: string; icon: string; label: string }> = {
  confirmed: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-800 dark:text-green-400",
    icon: "verified",
    label: "Confirmed",
  },
  tentative: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-800 dark:text-yellow-400",
    icon: "pending",
    label: "Tentative",
  },
  rejected: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-800 dark:text-red-400",
    icon: "cancel",
    label: "Rejected",
  },
};

const priorityStyle: Record<Priority, { bg: string; text: string; label: string }> = {
  high: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", label: "HIGH" },
  medium: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", label: "MED" },
  low: { bg: "bg-slate-100 dark:bg-slate-700", text: "text-slate-600 dark:text-slate-300", label: "LOW" },
};

// Deterministic avatar colours keyed off the initial letter
const avatarPalettes: Record<string, string> = {
  S: "bg-indigo-100 text-indigo-600",
  M: "bg-pink-100 text-pink-600",
  J: "bg-emerald-100 text-emerald-600",
  A: "bg-amber-100 text-amber-600",
};
function avatarColor(initial: string) {
  return avatarPalettes[initial] ?? "bg-slate-200 text-slate-600";
}

// ── component ────────────────────────────────────────────────────────────────

interface SuccessStateProps {
  data: MeetingNotesResult;
  source: "claude" | "mock";
}

export default function SuccessState({ data, source }: SuccessStateProps) {
  return (
    <section className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <div className="flex gap-2 items-center">
          <span className="material-symbols-outlined text-green-500 text-xl">
            check_circle
          </span>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Processed Notes
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full shadow-sm">
            Source: {source === "claude" ? "Claude" : "Mock"}
          </span>
          <span className="text-xs font-medium text-slate-500 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${confidenceColor[data.confidence]}`} />
            AI Confidence: {confidenceLabel[data.confidence]}
          </span>
        </div>
      </div>

      {/* ── Scrollable body ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* 1 ▸ Executive Summary */}
          {data.summary.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                <span className="material-symbols-outlined text-primary text-lg">summarize</span>
                Executive Summary
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
                Key Decisions
              </h3>
              {data.decisions.map((d, i) => {
                const s = statusStyle[d.status];
                return (
                  <div
                    key={i}
                    className="bg-slate-50 dark:bg-slate-800 rounded-xl shadow-sm border-l-4 border-primary p-5 relative overflow-hidden"
                  >
                    {/* title + badge */}
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-lg font-semibold text-slate-900 dark:text-white leading-tight">
                        {d.title}
                      </h4>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text} shrink-0 ml-3`}
                      >
                        <span className="material-symbols-outlined text-[14px]">{s.icon}</span>
                        {s.label}
                      </span>
                    </div>

                    {/* owner / effective date chips */}
                    {(d.owner || d.effectiveDate) && (
                      <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4 items-center">
                        {d.owner && (
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]">person</span>
                            <span>
                              Owner: <strong className="text-slate-700 dark:text-slate-200">{d.owner}</strong>
                            </span>
                          </div>
                        )}
                        {d.effectiveDate && (
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                            <span>
                              Effective: <strong className="text-slate-700 dark:text-slate-200">{d.effectiveDate}</strong>
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* evidence quote chip */}
                    {d.evidenceQuote && (
                      <div className="bg-white dark:bg-slate-900/50 rounded border border-slate-100 dark:border-slate-700 p-3">
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 flex gap-2">
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
                Next Steps
              </h3>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
                {data.actionItems.map((item, i) => (
                  <div
                    key={i}
                    className="p-4 flex items-start gap-4 hover:bg-white dark:hover:bg-slate-700/50 transition-colors"
                  >
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
                          {item.title}
                        </p>
                        {item.priority && (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shrink-0 ${priorityStyle[item.priority].bg} ${priorityStyle[item.priority].text}`}
                          >
                            {priorityStyle[item.priority].label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        {item.assignee && (
                          <div className="flex items-center gap-1">
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${avatarColor(item.assigneeInitial ?? item.assignee[0])}`}
                            >
                              {item.assigneeInitial ?? item.assignee[0]}
                            </div>
                            <span>{item.assignee}</span>
                          </div>
                        )}
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

          {/* 4 ▸ Risks & Open Questions (side-by-side grid) */}
          {(data.risks.length > 0 || data.openQuestions.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Risks */}
              {data.risks.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-5 border border-red-100 dark:border-red-900/30">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-red-800 dark:text-red-400 uppercase tracking-wider mb-3">
                    <span className="material-symbols-outlined text-lg">warning</span>
                    Risks &amp; Blockers
                  </h3>
                  <ul className="space-y-2">
                    {data.risks.map((r, i) => (
                      <li key={i} className="text-sm text-red-900/80 dark:text-red-200 flex gap-2">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400 shrink-0" />
                        <span>{r.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Open Questions */}
              {data.openQuestions.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-5 border border-amber-100 dark:border-amber-900/30">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-3">
                    <span className="material-symbols-outlined text-lg">help</span>
                    Open Questions
                  </h3>
                  <ul className="space-y-2">
                    {data.openQuestions.map((q, i) => (
                      <li key={i} className="text-sm text-amber-900/80 dark:text-amber-200 flex gap-2">
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

      {/* ── Bottom Action Bar ──────────────────────────────────── */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-center">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 py-1.5 px-3 inline-flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Was this useful?</span>
            <div className="flex gap-1">
              <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-green-500 transition-colors">
                <span className="material-symbols-outlined text-[20px]">thumb_up</span>
              </button>
              <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-red-500 transition-colors">
                <span className="material-symbols-outlined text-[20px]">thumb_down</span>
              </button>
            </div>
          </div>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
          <div className="flex gap-1">
            <button
              className="size-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
              title="Copy as text"
              aria-label="Copy as text"
            >
              <span className="material-symbols-outlined text-[16px]">content_copy</span>
            </button>
            <button
              className="size-8 flex items-center justify-center bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full hover:opacity-90 transition-opacity shadow-md"
              title="Copy as markdown"
              aria-label="Copy as markdown"
            >
              <span className="material-symbols-outlined text-[16px]">markdown</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
