"use client";
import { useState } from "react";
import { UIState } from "@/types/ui-states";

interface HeaderProps {
  currentState?: UIState;
  onDevStateChange?: (state: UIState) => void;
}

const states = Object.values(UIState);

export default function Header({ currentState, onDevStateChange }: HeaderProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const showDevControls =
    process.env.NEXT_PUBLIC_ENABLE_DEV_UI === "true" && Boolean(onDevStateChange);

  return (
    <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between z-10 sticky top-0">
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <span className="material-symbols-outlined">description</span>
        </div>
        <h1 className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">
          Meeting Note Cleaner
        </h1>
      </div>
      <div className="flex items-center gap-3 relative">
        {showDevControls && (
          <>
            <button
              onClick={() => setIsSettingsOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400 text-sm font-medium"
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
              <span className="hidden sm:inline">Settings</span>
            </button>
            {isSettingsOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-[320px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-4 z-50">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs uppercase tracking-wider font-bold text-slate-500">
                    Developer UI
                  </p>
                  {currentState && (
                    <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                      {currentState}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {states.map((state) => (
                    <button
                      key={state}
                      onClick={() => {
                        onDevStateChange?.(state);
                        setIsSettingsOpen(false);
                      }}
                      className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-colors ${
                        currentState === state
                          ? "bg-primary text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {state}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
          </>
        )}
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white font-bold text-xs">
            JD
          </div>
        </div>
      </div>
    </header>
  );
}
