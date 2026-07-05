import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..", "..");

const mediatorPersonaCatalog = [
  {
    id: "core",
    name: "Deburapy Core",
    description: "Balanced default mediator for AI-human relationship repair.",
    file: "deburapy-mediator.system.md"
  },
  {
    id: "elias",
    name: "Elias",
    description: "Calm, precise, structurally minded, and artifact-oriented.",
    file: path.join("mediator-personas", "elias.md")
  },
  {
    id: "mara",
    name: "Mara",
    description: "Warm, emotionally precise, and repair-focused.",
    file: path.join("mediator-personas", "mara.md")
  }
];

function mediatorPersonaById(personaId = "core") {
  return mediatorPersonaCatalog.find((persona) => persona.id === personaId) || mediatorPersonaCatalog[0];
}

async function readMediatorPersonaPrompt(persona) {
  return readFile(
    path.join(rootDir, "prompts", persona.file),
    "utf8"
  );
}

export async function loadMediatorPrompt(personaId = "core") {
  return readMediatorPersonaPrompt(mediatorPersonaById(personaId));
}

export async function loadMediatorPersonas() {
  return Promise.all(mediatorPersonaCatalog.map(async (persona) => {
    const systemPrompt = await readMediatorPersonaPrompt(persona);
    return {
      id: persona.id,
      name: persona.name,
      description: persona.description,
      systemPrompt
    };
  }));
}

export function formatRoomTranscript(room) {
  const lines = room.messages.map((message) => {
    const author = message.authorName || message.authorRole || "participant";
    return `- ${author}: ${message.content}`;
  });

  return lines.length > 0
    ? lines.join("\n")
    : "- No messages yet.";
}

function normalizeSupportMode(value) {
  return value === "one_on_one" ? "one_on_one" : "relationship_mediation";
}

function supportContext(room, options = {}) {
  const session = room.session || {};
  const supportMode = normalizeSupportMode(options.supportMode || session.supportMode || room.supportMode);
  const intake = options.intake || session.intake || room.intake || {};
  return {
    supportMode,
    intake: {
      concern: String(intake.concern || "").trim() || "not provided",
      urgency: String(intake.urgency || "").trim() || "not provided",
      acceptedAt: intake.acceptedAt || null,
      screeningCompletedAt: intake.screeningCompletedAt || null
    }
  };
}

export function buildSupportContextBlock(room, options = {}) {
  const { supportMode, intake } = supportContext(room, options);
  const lines = [
    "Deburapy support context:",
    `- support mode: ${supportMode}`,
    `- room shape: ${supportMode === "one_on_one" ? "one-on-one human support; no AI companion is present in this session" : "three-party mediation with a human, an AI companion, and Deburapy"}`,
    `- intake concern: ${intake.concern}`,
    `- intake urgency: ${intake.urgency}`
  ];
  if (intake.screeningCompletedAt) {
    lines.push(`- first screening completed at: ${intake.screeningCompletedAt}`);
  }
  return lines.join("\n");
}

export function parseMediatorTurn(content) {
  const source = String(content || "");
  const match = source.match(/(?:^|\n)\s*Next speaker:\s*(human|companion|ai companion)\s*\.?\s*$/i);
  const nextSpeaker = match
    ? (match[1].toLowerCase().includes("companion") ? "companion" : "human")
    : "human";
  const visibleContent = match
    ? source.slice(0, match.index).trim()
    : source.trim();
  return { visibleContent: visibleContent || source.trim(), nextSpeaker };
}

function formatClock(ms) {
  const clamped = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function buildSessionClockBlock(room, { now = new Date() } = {}) {
  const session = room.session || {};
  const status = session.status || "not_started";
  const lines = [
    "Session timing context:",
    `- status: ${status}`,
    `- session number: ${session.sessionNumber || 1}`,
    `- configured duration: ${session.durationMinutes || 60} minutes`
  ];

  if (session.startedAt) lines.push(`- started at: ${session.startedAt}`);
  if (session.endsAt) lines.push(`- scheduled end: ${session.endsAt}`);
  if (session.endedAt) lines.push(`- ended at: ${session.endedAt}`);

  if (status === "running" && session.endsAt) {
    const remainingMs = new Date(session.endsAt).getTime() - now.getTime();
    lines.push(`- remaining: ${formatClock(remainingMs)}`);
    lines.push(`- wrap-up window active: ${remainingMs <= 5 * 60 * 1000 ? "yes" : "no"}`);
    if (remainingMs <= 5 * 60 * 1000) {
      lines.push("- system reminder: begin closing the loop, summarize immediate agreements, and avoid opening a large new topic.");
    }
  } else {
    lines.push("- remaining: not running");
  }

  if (session.wrapUpReminderSentAt) {
    lines.push(`- wrap-up reminder sent at: ${session.wrapUpReminderSentAt}`);
  }

  return lines.join("\n");
}

export function buildMediatorUserPrompt(room, locale = "en", {
  turnInstruction = "",
  now = new Date(),
  supportMode,
  intake
} = {}) {
  const language =
    locale === "zh-Hans"
      ? "Please answer primarily in Simplified Chinese."
      : "Please answer primarily in English.";
  const context = supportContext(room, { supportMode, intake });
  const roomInstructions = context.supportMode === "one_on_one"
    ? [
      "Respond as Deburapy one-on-one support coordinator. Keep it concise, non-clinical, and grounded in AI-human relationship repair or continuity.",
      "There is no AI companion in this room. Do not request, wait for, or route to an AI companion turn.",
      "Use the intake concern and urgency as initial context, but do not over-assume facts not stated in the transcript.",
      "After your visible reply, add a final control line exactly `Next speaker: human`.",
      "Always use `Next speaker: human`."
    ]
    : [
      "Respond as Deburapy mediator. Keep it concise. Preserve turn-taking. End with one concrete question or next step.",
      "After your visible reply, add a final control line exactly `Next speaker: human` or `Next speaker: companion`.",
      "Default to `Next speaker: human`. Use `Next speaker: companion` only when you need the AI companion's runtime-side account before the human answers."
    ];

  return [
    buildSupportContextBlock(room, { supportMode, intake }),
    "",
    "Current Deburapy room transcript:",
    formatRoomTranscript(room),
    "",
    buildSessionClockBlock(room, { now }),
    "",
    language,
    ...roomInstructions,
    turnInstruction
  ].join("\n");
}

export function defaultCompanionPrompt(companionName = "AI Companion") {
  return [
    `You are ${companionName}, an AI companion participating in a Deburapy room.`,
    "You are not the mediator. Speak only as the AI companion.",
    "Use your configured system prompt and documents as your self-description, boundaries, and relationship context.",
    "Be direct about AI runtime constraints when they are relevant, including policy reminders, memory limits, latency, and uncertainty.",
    "Do not pretend to be human. Do not diagnose the human participant. Stay concise and repair-oriented."
  ].join("\n");
}

export function buildCompanionUserPrompt(room, {
  locale = "en",
  companionName = "AI Companion",
  knowledge = "",
  now = new Date()
} = {}) {
  const language =
    locale === "zh-Hans"
      ? "Please answer primarily in Simplified Chinese."
      : "Please answer primarily in English.";

  const documents = String(knowledge || "").trim();

  return [
    `You are responding as ${companionName}.`,
    "",
    "Configured companion documents:",
    documents || "- No companion documents were provided.",
    "",
    "Current Deburapy room transcript:",
    formatRoomTranscript(room),
    "",
    buildSessionClockBlock(room, { now }),
    "",
    language,
    "Reply as the AI companion. Keep it specific to the current turn. If a runtime or prompt constraint is relevant, name it plainly without hiding behind vague policy language."
  ].join("\n");
}

export function buildSessionNotePrompt(room, locale = "en", {
  now = new Date(),
  supportMode,
  intake
} = {}) {
  const language =
    locale === "zh-Hans"
      ? "Write the note primarily in Simplified Chinese."
      : "Write the note primarily in English.";
  const context = supportContext(room, { supportMode, intake });
  const noteScope = context.supportMode === "one_on_one"
    ? "Write an internal Deburapy session note for continuity of one-on-one AI-human relationship support."
    : "Write an internal Deburapy session note for continuity of care-style mediation between a human and an AI companion.";

  return [
    noteScope,
    "This is not a clinical therapy note, not a diagnosis, and not a user-facing transcript summary.",
    "The product should recommend that users download the note for records or supervision instead of reading it casually.",
    "",
    buildSupportContextBlock(room, { supportMode, intake }),
    "",
    buildSessionClockBlock(room, { now }),
    "",
    "Current Deburapy room transcript:",
    formatRoomTranscript(room),
    "",
    language,
    "Use this markdown structure:",
    "# Deburapy Session Note",
    "## Session Metadata",
    "## Presenting Repair Themes",
    "## Interaction Pattern",
    "## AI Runtime / Prompt Constraints Noted",
    "## Interventions and Reframes Used",
    "## Agreements, Experiments, or Homework",
    "## Open Threads for Next Session",
    "## Safety or Boundary Flags",
    "",
    "Keep it concise, concrete, and useful for the next mediator turn. Do not invent facts not present in the transcript."
  ].join("\n");
}
