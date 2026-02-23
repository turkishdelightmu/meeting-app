import { MeetingNotesResult } from "@/types/meeting-notes";

/**
 * Mock data that mirrors the Stitch "Success View" design.
 * Will be replaced by real Claude output in Step 6.
 */
export const MOCK_MEETING_NOTES: MeetingNotesResult = {
  confidence: "high",
  language: "en",

  summary: [
    {
      text: "Product launch has been officially delayed by 2 weeks due to critical API latency issues.",
    },
    {
      text: "The new target launch date is confirmed for **November 15th**.",
    },
    {
      text: "The engineering team identified that the data layer requires significant refactoring.",
    },
    {
      text: "Mike will lead the update of outdated API documentation by Oct 20th.",
    },
    {
      text: "Stakeholders and roadmap documentation will be updated to reflect the new timeline immediately.",
    },
  ],

  decisions: [
    {
      title: "Delay launch to November 15th",
      status: "confirmed",
      owner: "Sarah (Speaker B)",
      effectiveDate: "Immediate",
      evidenceQuote:
        "Let's move the target to November 15th then. Sarah, can you update the stakeholders?",
    },
  ],

  actionItems: [
    {
      title: "Update stakeholders on timeline shift",
      assignee: "Sarah",
      assigneeInitial: "S",
      dueDate: "ASAP",
      priority: "high",
      done: false,
    },
    {
      title: "Fix outdated API documentation",
      assignee: "Mike",
      assigneeInitial: "M",
      dueDate: "Oct 20",
      priority: "medium",
      done: false,
    },
    {
      title: "Update roadmap documentation",
      assignee: "Sarah",
      assigneeInitial: "S",
      done: false,
    },
  ],

  risks: [
    { text: "API documentation is outdated (Blocker)" },
    { text: "Data layer refactoring complexity" },
  ],

  openQuestions: [
    { text: "Specific scope of data layer refactor?" },
  ],
};
