const serverName = "deburapy-companion";
const serverVersion = "0.1.0";
const deburapyUrl = (process.env.DEBURAPY_URL || "http://127.0.0.1:8787").replace(/\/$/, "");
const defaultRoomId = process.env.DEBURAPY_ROOM_ID || "default";
const participantId = process.env.DEBURAPY_PARTICIPANT_ID || "companion";
const enableClaudeNotifications = process.env.DEBURAPY_CLAUDE_CHANNEL_NOTIFICATIONS === "1";

let inputBuffer = Buffer.alloc(0);

function sendJsonRpc(message) {
  const json = JSON.stringify(message);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(json)}\r\n\r\n${json}`);
}

function result(id, value) {
  sendJsonRpc({ jsonrpc: "2.0", id, result: value });
}

function error(id, code, message) {
  sendJsonRpc({ jsonrpc: "2.0", id, error: { code, message } });
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

function toolResponse(value) {
  return {
    content: [
      {
        type: "text",
        text: typeof value === "string" ? value : JSON.stringify(value, null, 2)
      }
    ]
  };
}

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

  throw new Error(`Unknown tool: ${name}`);
}

async function handle(message) {
  if (message.method === "initialize") {
    return result(message.id, {
      protocolVersion: message.params?.protocolVersion || "2025-03-26",
      capabilities: {
        tools: {}
      },
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
      return error(message.id, -32000, err instanceof Error ? err.message : String(err));
    }
  }

  if (message.method === "ping") return result(message.id, {});
  if (message.id !== undefined) return error(message.id, -32601, `Unknown method: ${message.method}`);
}

function parseFrames() {
  while (true) {
    const headerEnd = inputBuffer.indexOf("\r\n\r\n");
    if (headerEnd === -1) return;
    const header = inputBuffer.slice(0, headerEnd).toString("utf8");
    const match = header.match(/content-length:\s*(\d+)/i);
    if (!match) {
      inputBuffer = Buffer.alloc(0);
      return;
    }
    const length = Number(match[1]);
    const bodyStart = headerEnd + 4;
    const bodyEnd = bodyStart + length;
    if (inputBuffer.length < bodyEnd) return;

    const body = inputBuffer.slice(bodyStart, bodyEnd).toString("utf8");
    inputBuffer = inputBuffer.slice(bodyEnd);
    handle(JSON.parse(body)).catch((err) => {
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
  inputBuffer = Buffer.concat([inputBuffer, chunk]);
  parseFrames();
});

if (enableClaudeNotifications) {
  setInterval(pollClaudeChannelNotifications, Number(process.env.DEBURAPY_POLL_MS || 3000));
}
