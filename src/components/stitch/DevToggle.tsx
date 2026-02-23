"use client";

import { useState } from "react";
import { UIState } from "@/types/ui-states";

interface DevToggleProps {
  currentState: UIState;
  onStateChange: (state: UIState) => void;
}

const states = Object.values(UIState);

export default function DevToggle({
  currentState,
  onStateChange,
}: DevToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectState = (state: UIState) => {
    onStateChange(state);
    setIsOpen(false);
  };

  return (
    <div className="fixed top-20 right-4 z-50">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="size-12 rounded-full bg-slate-900 text-white shadow-xl flex items-center justify-center hover:bg-slate-800 transition-colors"
        aria-label="Toggle dev state switcher"
        title={`DEV: ${currentState}`}
      >
        <span className="material-symbols-outlined text-[20px]">bug_report</span>
      </button>

      {isOpen && (
        <div className="mt-2 bg-slate-900 text-white rounded-lg shadow-xl p-3 text-xs w-[220px]">
          <div className="flex items-center justify-between mb-2 text-slate-300">
            <span className="font-bold uppercase tracking-wider">DEV: UI State</span>
            <span className="text-[10px] font-mono bg-slate-700 px-2 py-0.5 rounded">
              {currentState}
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {states.map((state) => (
              <button
                key={state}
                onClick={() => handleSelectState(state)}
                className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-colors ${
                  currentState === state
                    ? "bg-primary text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {state}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
