import { MeetingNotesResult } from "@/types/meeting-notes";

/**
 * Mock data that mirrors the Stitch "Success View" design.
 * English version — used when language is "en" or as default fallback.
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

/**
 * French translation of the mock data.
 * Used when language is "fr" (force_fr output mode).
 */
export const MOCK_MEETING_NOTES_FR: MeetingNotesResult = {
  confidence: "high",
  language: "fr",

  summary: [
    {
      text: "Le lancement du produit a été officiellement reporté de 2 semaines en raison de problèmes critiques de latence de l'API.",
    },
    {
      text: "La nouvelle date de lancement cible est confirmée pour le **15 novembre**.",
    },
    {
      text: "L'équipe d'ingénierie a identifié que la couche de données nécessite une refactorisation importante.",
    },
    {
      text: "Mike dirigera la mise à jour de la documentation API obsolète d'ici le 20 octobre.",
    },
    {
      text: "Les parties prenantes et la documentation de la feuille de route seront mises à jour immédiatement pour refléter le nouveau calendrier.",
    },
  ],

  decisions: [
    {
      title: "Reporter le lancement au 15 novembre",
      status: "confirmed",
      owner: "Sarah (Intervenante B)",
      effectiveDate: "Immédiat",
      evidenceQuote:
        "Let's move the target to November 15th then. Sarah, can you update the stakeholders?",
    },
  ],

  actionItems: [
    {
      title: "Informer les parties prenantes du changement de calendrier",
      assignee: "Sarah",
      assigneeInitial: "S",
      dueDate: "Dès que possible",
      priority: "high",
      done: false,
    },
    {
      title: "Corriger la documentation API obsolète",
      assignee: "Mike",
      assigneeInitial: "M",
      dueDate: "20 oct.",
      priority: "medium",
      done: false,
    },
    {
      title: "Mettre à jour la documentation de la feuille de route",
      assignee: "Sarah",
      assigneeInitial: "S",
      done: false,
    },
  ],

  risks: [
    { text: "La documentation API est obsolète (Bloquant)" },
    { text: "Complexité de la refactorisation de la couche de données" },
  ],

  openQuestions: [
    { text: "Périmètre exact de la refactorisation de la couche de données ?" },
  ],
};
