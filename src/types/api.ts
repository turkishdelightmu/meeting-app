import type { OutputMode } from "./ui-states";
import type { MeetingNotesResult } from "./meeting-notes";

// ── /api/detect ───────────────────────────────────────────────────────────────

export interface DetectRequest {
  transcript: string;
}

export type DetectedLanguage = "en" | "fr" | "mixed";

export interface DetectResponse {
  language: DetectedLanguage;
}

// ── /api/generate ─────────────────────────────────────────────────────────────

export interface GenerateRequest {
  transcript: string;
  /** "auto" is resolved before calling generate — pass the concrete lang if auto detected mixed */
  outputMode: OutputMode;
}

/** Successful generation */
export interface GenerateSuccessResponse {
  ok: true;
  result: MeetingNotesResult;
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
