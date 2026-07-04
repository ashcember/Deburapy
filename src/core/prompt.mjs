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

export function buildMediatorUserPrompt(room, locale = "en") {
  const language =
    locale === "zh-Hans"
      ? "Please answer primarily in Simplified Chinese."
      : "Please answer primarily in English.";

  return [
    "Current Deburapy room transcript:",
    formatRoomTranscript(room),
    "",
    language,
    "Respond as Deburapy mediator. Keep it concise. Preserve turn-taking. End with one concrete question or next step."
  ].join("\n");
}
