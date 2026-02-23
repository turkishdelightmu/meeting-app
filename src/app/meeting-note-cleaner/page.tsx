"use client";

import { useState, useCallback, useRef } from "react";
import { UIState, OutputMode, MAX_CHARS } from "@/types/ui-states";
import type { MeetingNotesResult } from "@/types/meeting-notes";
import type { DetectResponse, GenerateResponse } from "@/types/api";
import { MOCK_MEETING_NOTES } from "@/data/mock-meeting-notes";
import Header from "@/components/stitch/Header";
import InputPanel from "@/components/stitch/InputPanel";
import EmptyState from "@/components/stitch/EmptyState";
import TooLongState from "@/components/stitch/TooLongState";
import MixedPickerState from "@/components/stitch/MixedPickerState";
import LoadingState from "@/components/stitch/LoadingState";
import SuccessState from "@/components/stitch/SuccessState";
import ValidationErrorState from "@/components/stitch/ValidationErrorState";
import ModelRefusalState from "@/components/stitch/ModelRefusalState";
import DevToggle from "@/components/stitch/DevToggle";

export default function MeetingNoteCleanerPage() {
  const [transcript, setTranscript] = useState("");
  const [outputMode, setOutputMode] = useState<OutputMode>("auto");
  const [uiState, setUiState] = useState<UIState>(UIState.EMPTY);
  const [notesResult, setNotesResult] = useState<MeetingNotesResult | null>(null);
  const [validationRaw, setValidationRaw] = useState<string>("");

  // Keep a stable ref to current transcript + outputMode for retry
  const transcriptRef = useRef(transcript);
  const outputModeRef = useRef(outputMode);
  transcriptRef.current = transcript;
  outputModeRef.current = outputMode;

  // Derive TOO_LONG automatically from transcript length
  const effectiveState =
    transcript.length > MAX_CHARS && uiState !== UIState.TOO_LONG
      ? UIState.TOO_LONG
      : uiState;

  const handleTranscriptChange = useCallback(
    (value: string) => {
      setTranscript(value);
      if (value.length > MAX_CHARS) {
        setUiState(UIState.TOO_LONG);
      } else if (value.length === 0 && uiState === UIState.TOO_LONG) {
        setUiState(UIState.EMPTY);
      } else if (uiState === UIState.TOO_LONG && value.length <= MAX_CHARS) {
        setUiState(UIState.EMPTY);
      }
    },
    [uiState]
  );

  const handleClear = useCallback(() => {
    setTranscript("");
    setOutputMode("auto");
    setNotesResult(null);
    setValidationRaw("");
    setUiState(UIState.EMPTY);
  }, []);

  // ── Core API helpers ────────────────────────────────────────────────────────

  /** Call /api/generate and transition to the appropriate state */
  const callGenerate = useCallback(
    async (text: string, mode: OutputMode) => {
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: text, outputMode: mode }),
        });

        if (!res.ok) {
          setUiState(UIState.VALIDATION_ERROR);
          setValidationRaw(`HTTP ${res.status}: ${res.statusText}`);
          return;
        }

        const data: GenerateResponse = await res.json();

        if (data.ok) {
          setNotesResult(data.result);
          setUiState(UIState.SUCCESS);
        } else if (data.reason === "refusal") {
          setUiState(UIState.MODEL_REFUSAL);
        } else if (data.reason === "validation_error") {
          setValidationRaw(data.rawOutput);
          setUiState(UIState.VALIDATION_ERROR);
        } else {
          setValidationRaw("server_error");
          setUiState(UIState.VALIDATION_ERROR);
        }
      } catch (err) {
        setValidationRaw(err instanceof Error ? err.message : String(err));
        setUiState(UIState.VALIDATION_ERROR);
      }
    },
    []
  );

  // ── User action handlers ────────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    setUiState(UIState.LOADING);

    try {
      // Step 1: detect language (only matters when outputMode === "auto")
      let resolvedMode: OutputMode = outputModeRef.current;

      if (outputModeRef.current === "auto") {
        const detectRes = await fetch("/api/detect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: transcriptRef.current }),
        });

        if (detectRes.ok) {
          const { language }: DetectResponse = await detectRes.json();
          if (language === "mixed") {
            setUiState(UIState.MIXED_PICKER);
            return;
          }
          // Resolve auto → concrete language for the generate call
          resolvedMode = language === "fr" ? "force_fr" : "force_en";
        }
        // If detect fails, default resolvedMode stays "auto" → generate will default to English
      }

      // Step 2: generate notes with the resolved language
      await callGenerate(transcriptRef.current, resolvedMode);
    } catch (err) {
      setValidationRaw(err instanceof Error ? err.message : String(err));
      setUiState(UIState.VALIDATION_ERROR);
    }
  }, [callGenerate]);

  const handleMixedLanguageSelect = useCallback(
    async (lang: "force_en" | "force_fr") => {
      setOutputMode(lang);
      setUiState(UIState.LOADING);
      await callGenerate(transcriptRef.current, lang);
    },
    [callGenerate]
  );

  const handleRetry = useCallback(async () => {
    setUiState(UIState.LOADING);
    await callGenerate(transcriptRef.current, outputModeRef.current);
  }, [callGenerate]);

  // DEV toggle to manually switch states
  const handleDevStateChange = useCallback((state: UIState) => {
    if (state === UIState.SUCCESS && !notesResult) {
      setNotesResult(MOCK_MEETING_NOTES);
    }
    setUiState(state);
  }, [notesResult]);

  const renderOutputPanel = () => {
    switch (effectiveState) {
      case UIState.EMPTY:
        return <EmptyState />;
      case UIState.TOO_LONG:
        return <TooLongState charCount={transcript.length} />;
      case UIState.MIXED_PICKER:
        return (
          <MixedPickerState onSelectLanguage={handleMixedLanguageSelect} />
        );
      case UIState.LOADING:
        return <LoadingState />;
      case UIState.SUCCESS:
        return notesResult ? <SuccessState data={notesResult} /> : <EmptyState />;
      case UIState.VALIDATION_ERROR:
        return (
          <ValidationErrorState
            onRetry={handleRetry}
            rawOutput={validationRaw || '{"malformed": true}'}
          />
        );
      case UIState.MODEL_REFUSAL:
        return <ModelRefusalState onClear={handleClear} />;
      default:
        return <EmptyState />;
    }
  };

  const isGenerating = effectiveState === UIState.LOADING;
  const isInputDisabled = effectiveState === UIState.MIXED_PICKER;

  return (
    <>
      <Header />
      <main className="flex-1 overflow-y-auto w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
          {/* Left Column: Input */}
          <InputPanel
            transcript={transcript}
            onTranscriptChange={handleTranscriptChange}
            outputMode={outputMode}
            onOutputModeChange={setOutputMode}
            onGenerate={handleGenerate}
            onClear={handleClear}
            isGenerating={isGenerating}
            disabled={isInputDisabled}
          />

          {/* Right Column: Output */}
          {renderOutputPanel()}
        </div>
      </main>

      {/* DEV toggle for state switching */}
      <DevToggle
        currentState={effectiveState}
        onStateChange={handleDevStateChange}
      />
    </>
  );
}
