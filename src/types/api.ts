import type { OutputMode } from "./ui-states";
import type { MeetingNotesResult } from "./meeting-notes";

// ── /api/detect ───────────────────────────────────────────────────────────────

export interface DetectRequest {
  transcript: string;
}

export type DetectedLanguage = "en" | "fr" | "mixed";

export interface DetectResponse {
  language: DetectedLanguage;
  /** 0-1 confidence in the detection result */
  confidence: number;
  /** Percentage of recognised French tokens (0-1) */
  frRatio: number;
  /** Percentage of recognised English tokens (0-1) */
  enRatio: number;
}

// ── /api/generate ─────────────────────────────────────────────────────────────

export type GenerateSource = "claude" | "ollama" | "mock";

export interface GenerateRequest {
  transcript: string;
  /**
   * The output mode chosen by the user or resolved by detect.
   * Should be "force_en" or "force_fr" when auto-detect has resolved.
   * If "auto" is sent, generate will default to English.
   */
  outputMode: OutputMode;
}

/** Successful generation */
export interface GenerateSuccessResponse {
  ok: true;
  result: MeetingNotesResult;
  source: GenerateSource;
}

/** Model refused to process the content */
export interface GenerateRefusalResponse {
  ok: false;
  reason: "refusal";
  message: string;
}

/** Response JSON was structurally invalid */
export interface GenerateValidationErrorResponse {
  ok: false;
  reason: "validation_error";
  rawOutput: string;
}

/** Unexpected server/network failure */
export interface GenerateServerErrorResponse {
  ok: false;
  reason: "server_error";
  message: string;
}

export type GenerateResponse =
  | GenerateSuccessResponse
  | GenerateRefusalResponse
  | GenerateValidationErrorResponse
  | GenerateServerErrorResponse;
