import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..", "..");

export async function loadMediatorPrompt() {
  return readFile(
    path.join(rootDir, "prompts", "deburapy-mediator.system.md"),
    "utf8"
  );
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

export function buildMediatorUserPrompt(room, locale = "en", { turnInstruction = "" } = {}) {
  const language =
    locale === "zh-Hans"
      ? "Please answer primarily in Simplified Chinese."
      : "Please answer primarily in English.";

  return [
    "Current Deburapy room transcript:",
    formatRoomTranscript(room),
    "",
    language,
    "Respond as Deburapy mediator. Keep it concise. Preserve turn-taking. End with one concrete question or next step.",
    "After your visible reply, add a final control line exactly `Next speaker: human` or `Next speaker: companion`.",
    "Default to `Next speaker: human`. Use `Next speaker: companion` only when you need the AI companion's runtime-side account before the human answers.",
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
  knowledge = ""
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
    language,
    "Reply as the AI companion. Keep it specific to the current turn. If a runtime or prompt constraint is relevant, name it plainly without hiding behind vague policy language."
  ].join("\n");
}
