"use client";

import { useState, useCallback } from "react";
import { UIState, OutputMode, MAX_CHARS } from "@/types/ui-states";
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

  // Derive TOO_LONG automatically from transcript length
  const effectiveState =
    transcript.length > MAX_CHARS && uiState !== UIState.TOO_LONG
      ? UIState.TOO_LONG
      : uiState;

  const handleTranscriptChange = useCallback(
    (value: string) => {
      setTranscript(value);
      // Auto-transition states based on content
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
    setUiState(UIState.EMPTY);
  }, []);

  const handleGenerate = useCallback(() => {
    // Placeholder: will be wired in Step 3
    // For now just transition to LOADING briefly then SUCCESS
    setUiState(UIState.LOADING);
    setTimeout(() => {
      setUiState(UIState.SUCCESS);
    }, 2000);
  }, []);

  const handleMixedLanguageSelect = useCallback(
    (lang: "force_en" | "force_fr") => {
      setOutputMode(lang);
      // Will trigger generate in Step 3
      setUiState(UIState.LOADING);
      setTimeout(() => {
        setUiState(UIState.SUCCESS);
      }, 2000);
    },
    []
  );

  const handleRetry = useCallback(() => {
    setUiState(UIState.LOADING);
    setTimeout(() => {
      setUiState(UIState.SUCCESS);
    }, 2000);
  }, []);

  // DEV toggle to manually switch states
  const handleDevStateChange = useCallback((state: UIState) => {
    setUiState(state);
  }, []);

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
        return <SuccessState />;
      case UIState.VALIDATION_ERROR:
        return (
          <ValidationErrorState
            onRetry={handleRetry}
            rawOutput='{"malformed": true, "missing_fields": ...}'
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
