import fs from "node:fs";
import path from "node:path";

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function defaultRoom(roomId = "default") {
  return {
    id: roomId,
    title: "Deburapy Room",
    locale: "en",
    participants: [
      { id: "human", label: "Human", kind: "human" },
      { id: "companion", label: "AI Companion", kind: "ai_companion" },
      { id: "mediator", label: "Deburapy", kind: "mediator" }
    ],
    turn: {
      mode: "suggested",
      nextParticipantId: "human"
    },
    messages: [],
    pendingPushes: [],
    participantState: {}
  };
}

export class DeburapyStore {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.filePath = path.join(dataDir, "store.json");
  }

  load() {
    fs.mkdirSync(this.dataDir, { recursive: true });
    if (!fs.existsSync(this.filePath)) {
      const data = { rooms: { default: defaultRoom("default") } };
      this.save(data);
      return data;
    }

    return JSON.parse(fs.readFileSync(this.filePath, "utf8"));
  }

  save(data) {
    fs.mkdirSync(this.dataDir, { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  getRoom(roomId = "default") {
    const data = this.load();
    if (!data.rooms[roomId]) {
      data.rooms[roomId] = defaultRoom(roomId);
      this.save(data);
    }
    return data.rooms[roomId];
  }

  updateRoom(roomId, updater) {
    const data = this.load();
    if (!data.rooms[roomId]) data.rooms[roomId] = defaultRoom(roomId);
    const room = data.rooms[roomId];
    updater(room);
    this.save(data);
    return room;
  }

  addMessage(roomId, input) {
    return this.updateRoom(roomId, (room) => {
      room.messages.push({
        id: newId("msg"),
        createdAt: nowIso(),
        authorRole: input.authorRole || "human",
        authorName: input.authorName || input.authorRole || "Participant",
        content: String(input.content || "").trim(),
        channelId: input.channelId || "local",
        kind: input.kind || "room_message"
      });
    });
  }

  addChannelPush(roomId, channelId, input) {
    const push = {
      id: newId("push"),
      createdAt: nowIso(),
      roomId,
      channelId,
      from: input.from || "External Channel",
      content: String(input.content || "").trim(),
      targetParticipantId: input.targetParticipantId || "companion",
      delivered: false
    };

    this.updateRoom(roomId, (room) => {
      room.pendingPushes.push(push);
      room.messages.push({
        id: push.id,
        createdAt: push.createdAt,
        authorRole: "channel",
        authorName: push.from,
        content: push.content,
        channelId,
        kind: "channel_push"
      });
    });

    return push;
  }

  getPendingPushes(roomId, participantId, { limit = 20, claim = false } = {}) {
    let selected = [];
    const room = this.updateRoom(roomId, (draft) => {
      selected = draft.pendingPushes
        .filter((push) => {
          return !push.delivered && (!participantId || push.targetParticipantId === participantId);
        })
        .slice(0, limit);

      if (claim) {
        const selectedIds = new Set(selected.map((push) => push.id));
        draft.pendingPushes = draft.pendingPushes.map((push) => {
          return selectedIds.has(push.id) ? { ...push, delivered: true } : push;
        });
      }
    });

    return { room, pushes: selected };
  }

  setParticipantState(roomId, participantId, state) {
    return this.updateRoom(roomId, (room) => {
      room.participantState[participantId] = {
        ...(room.participantState[participantId] || {}),
        ...state,
        updatedAt: nowIso()
      };
    });
  }
}
