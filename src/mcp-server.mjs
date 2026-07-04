import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFile } from "./core/env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
loadEnvFile(path.join(rootDir, ".env"));

const serverName = "deburapy-companion";
const serverVersion = "0.1.0";
const supportedProtocolVersion = "2025-11-25";
const supportedProtocolVersions = new Set(["2025-03-26", "2025-06-18", supportedProtocolVersion]);
const deburapyUrl = (process.env.DEBURAPY_URL || "http://127.0.0.1:8787").replace(/\/$/, "");
const defaultRoomId = process.env.DEBURAPY_ROOM_ID || "default";
const participantId = process.env.DEBURAPY_PARTICIPANT_ID || "companion";
const enableClaudeNotifications = process.env.DEBURAPY_CLAUDE_CHANNEL_NOTIFICATIONS === "1";

let inputBuffer = "";

class UnknownToolError extends Error {}

function sendJsonRpc(message) {
  const json = JSON.stringify(message);
  process.stdout.write(`${json}\n`);
}

function result(id, value) {
  sendJsonRpc({ jsonrpc: "2.0", id, result: value });
}

function error(id, code, message) {
  sendJsonRpc({ jsonrpc: "2.0", id, error: { code, message } });
}

function toolResponse(value, isError = false) {
  const response = {
    content: [
      {
        type: "text",
        text: typeof value === "string" ? value : JSON.stringify(value, null, 2)
      }
    ]
  };
  if (isError) response.isError = true;
  return response;
}

async function api(path, options = {}) {
  const response = await fetch(`${deburapyUrl}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error || response.statusText);
  return payload;
}

const tools = [
  {
    name: "deburapy_get_pending_channel_pushes",
    description: "Read pending third-party channel pushes for this AI companion.",
    inputSchema: {
      type: "object",
      properties: {
        roomId: { type: "string" },
        participantId: { type: "string" },
        limit: { type: "number" },
        claim: { type: "boolean", description: "Mark returned pushes as delivered." }
      }
    }
  },
  {
    name: "deburapy_send_channel_reply",
    description: "Send a reply from the AI companion back into a Deburapy channel.",
    inputSchema: {
      type: "object",
      required: ["content"],
      properties: {
        roomId: { type: "string" },
        channelId: { type: "string" },
        from: { type: "string" },
        content: { type: "string" }
      }
    }
  },
  {
    name: "deburapy_get_room_context",
    description: "Read the current Deburapy room transcript and participant state.",
    inputSchema: {
      type: "object",
      properties: {
        roomId: { type: "string" }
      }
    }
  },
  {
    name: "deburapy_set_participant_state",
    description: "Update lightweight state for the AI companion in a Deburapy room.",
    inputSchema: {
      type: "object",
      required: ["state"],
      properties: {
        roomId: { type: "string" },
        participantId: { type: "string" },
        state: { type: "object" }
      }
    }
  }
];

async function callTool(name, args = {}) {
  if (name === "deburapy_get_pending_channel_pushes") {
    const params = new URLSearchParams({
      roomId: args.roomId || defaultRoomId,
      participantId: args.participantId || participantId,
      limit: String(args.limit || 20),
      claim: args.claim ? "1" : "0"
    });
    return toolResponse(await api(`/api/mcp/pending?${params.toString()}`));
  }

  if (name === "deburapy_send_channel_reply") {
    return toolResponse(await api(`/api/channels/${args.channelId || "local"}/reply`, {
      method: "POST",
      body: JSON.stringify({
        roomId: args.roomId || defaultRoomId,
        from: args.from || "AI Companion",
        content: args.content
      })
    }));
  }

  if (name === "deburapy_get_room_context") {
    return toolResponse(await api(`/api/rooms/${args.roomId || defaultRoomId}`));
  }

  if (name === "deburapy_set_participant_state") {
    return toolResponse(await api("/api/mcp/state", {
      method: "POST",
      body: JSON.stringify({
        roomId: args.roomId || defaultRoomId,
        participantId: args.participantId || participantId,
        state: args.state || {}
      })
    }));
  }

  throw new UnknownToolError(`Unknown tool: ${name}`);
}

async function handle(message) {
  if (message.method === "initialize") {
    const requestedVersion = message.params?.protocolVersion;
    const protocolVersion = supportedProtocolVersions.has(requestedVersion)
      ? requestedVersion
      : supportedProtocolVersion;
    const capabilities = {
      tools: {}
    };
    if (enableClaudeNotifications) {
      capabilities.experimental = {
        "claude/channel": {}
      };
    }

    return result(message.id, {
      protocolVersion,
      capabilities,
      serverInfo: {
        name: serverName,
        version: serverVersion
      },
      instructions:
        "Deburapy companion MCP: receive third-party channel pushes, inspect room context, and send relationship-room replies."
    });
  }

  if (message.method === "notifications/initialized") return;

  if (message.method === "tools/list") {
    return result(message.id, { tools });
  }

  if (message.method === "tools/call") {
    try {
      const value = await callTool(message.params?.name, message.params?.arguments || {});
      return result(message.id, value);
    } catch (err) {
      const messageText = err instanceof Error ? err.message : String(err);
      if (err instanceof UnknownToolError) {
        return error(message.id, -32602, messageText);
      }
      return result(message.id, toolResponse({ error: messageText }, true));
    }
  }

  if (message.method === "ping") return result(message.id, {});
  if (message.id !== undefined) return error(message.id, -32601, `Unknown method: ${message.method}`);
}

function parseLines() {
  while (true) {
    const newlineIndex = inputBuffer.indexOf("\n");
    if (newlineIndex === -1) return;

    const line = inputBuffer.slice(0, newlineIndex).trim();
    inputBuffer = inputBuffer.slice(newlineIndex + 1);
    if (!line) continue;

    let message;
    try {
      message = JSON.parse(line);
    } catch {
      error(null, -32700, "Parse error");
      continue;
    }

    handle(message).catch((err) => {
      console.error(err);
    });
  }
}

async function pollClaudeChannelNotifications() {
  if (!enableClaudeNotifications) return;
  try {
    const params = new URLSearchParams({
      roomId: defaultRoomId,
      participantId,
      limit: "10",
      claim: "1"
    });
    const payload = await api(`/api/mcp/pending?${params.toString()}`);
    for (const push of payload.pushes || []) {
      sendJsonRpc({
        jsonrpc: "2.0",
        method: "notifications/claude/channel",
        params: {
          content: `${push.from}: ${push.content}`,
          meta: {
            channel_name: push.channelId,
            author: push.from,
            message_id: push.id,
            is_bot: "false"
          }
        }
      });
    }
  } catch (err) {
    console.error(`[deburapy] notification poll failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

process.stdin.on("data", (chunk) => {
  inputBuffer += chunk.toString("utf8");
  parseLines();
});

if (enableClaudeNotifications) {
  setInterval(pollClaudeChannelNotifications, Number(process.env.DEBURAPY_POLL_MS || 3000));
}
