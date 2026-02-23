// ── Step 8: Lightweight instrumentation / analytics ──────────────────────────
// Console-based event logger. Swap the implementation for a real analytics
// provider (Mixpanel, Amplitude, PostHog, etc.) when ready.

export type AnalyticsEvent =
  | { name: "copy_text"; language: string; source: string }
  | { name: "copy_markdown"; language: string; source: string }
  | { name: "feedback_up"; language: string; source: string }
  | { name: "feedback_down"; language: string; source: string }
  | { name: "generate_start"; outputMode: string }
  | { name: "generate_success"; language: string; source: string; durationMs: number }
  | { name: "generate_error"; reason: string };

/**
 * Track an analytics event.
 * Currently logs to the browser console; replace the body with
 * your provider's `track()` call when you integrate a real service.
 */
export function trackEvent(event: AnalyticsEvent): void {
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${event.name}`, event);
  }
}
