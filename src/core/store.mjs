import fs from "node:fs";
import path from "node:path";

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function defaultSessionState() {
  return {
    id: null,
    status: "not_started",
    sessionNumber: 1,
    durationMinutes: 60,
    startedAt: null,
    endsAt: null,
    endedAt: null,
    wrapUpReminderSentAt: null,
    noteStatus: "not_started",
    currentNoteId: null
  };
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
    participantState: {},
    session: defaultSessionState(),
    sessionNotes: []
  };
}

function ensureRoomShape(room) {
  if (!room.turn) {
    room.turn = {
      mode: "suggested",
      nextParticipantId: "human"
    };
  }
  if (!Array.isArray(room.messages)) room.messages = [];
  if (!Array.isArray(room.pendingPushes)) room.pendingPushes = [];
  if (!room.participantState) room.participantState = {};
  room.session = {
    ...defaultSessionState(),
    ...(room.session || {})
  };
  if (!Array.isArray(room.sessionNotes)) room.sessionNotes = [];
  return room;
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
    ensureRoomShape(data.rooms[roomId]);
    return data.rooms[roomId];
  }

  updateRoom(roomId, updater) {
    const data = this.load();
    if (!data.rooms[roomId]) data.rooms[roomId] = defaultRoom(roomId);
    const room = data.rooms[roomId];
    ensureRoomShape(room);
    updater(room);
    ensureRoomShape(room);
    this.save(data);
    return room;
  }

  startSession(roomId, input = {}) {
    const startedAt = input.startedAt || nowIso();
    const durationMinutes = Number(input.durationMinutes || 60);
    const endsAt = input.endsAt || new Date(new Date(startedAt).getTime() + durationMinutes * 60 * 1000).toISOString();
    return this.updateRoom(roomId, (room) => {
      room.session = {
        ...defaultSessionState(),
        id: input.sessionId || newId("session"),
        status: "running",
        sessionNumber: Number(input.sessionNumber || 1),
        durationMinutes,
        startedAt,
        endsAt,
        endedAt: null,
        wrapUpReminderSentAt: null,
        noteStatus: "not_started",
        currentNoteId: null
      };
    });
  }

  markWrapUpReminderSent(roomId) {
    return this.updateRoom(roomId, (room) => {
      if (!room.session.wrapUpReminderSentAt) {
        room.session.wrapUpReminderSentAt = nowIso();
      }
    });
  }

  endSession(roomId, input = {}) {
    return this.updateRoom(roomId, (room) => {
      room.session = {
        ...defaultSessionState(),
        ...room.session,
        status: "ended",
        endedAt: input.endedAt || nowIso(),
        noteStatus: input.noteStatus || room.session.noteStatus || "not_started"
      };
    });
  }

  setSessionNoteStatus(roomId, noteStatus) {
    return this.updateRoom(roomId, (room) => {
      room.session.noteStatus = noteStatus;
    });
  }

  addSessionNote(roomId, input = {}) {
    let note;
    const room = this.updateRoom(roomId, (draft) => {
      const session = draft.session || defaultSessionState();
      note = {
        id: newId("note"),
        roomId,
        sessionId: session.id || null,
        sessionNumber: session.sessionNumber || Number(input.sessionNumber || 1),
        createdAt: nowIso(),
        title: input.title || `Deburapy Session ${session.sessionNumber || 1} Note`,
        content: String(input.content || "").trim(),
        format: "markdown",
        recommendedReader: "mediator_or_clinician"
      };
      draft.sessionNotes.push(note);
      draft.session.currentNoteId = note.id;
      draft.session.noteStatus = "ready";
    });
    return { room, note };
  }

  getSessionNotes(roomId) {
    const room = this.getRoom(roomId);
    return { room, notes: room.sessionNotes };
  }

  getSessionNote(roomId, noteId) {
    const room = this.getRoom(roomId);
    return room.sessionNotes.find((note) => note.id === noteId) || null;
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

  addChannelPush(roomId, channelId, input, { visible = true } = {}) {
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
      if (visible) {
        room.messages.push({
          id: push.id,
          createdAt: push.createdAt,
          authorRole: "channel",
          authorName: push.from,
          content: push.content,
          channelId,
          kind: "channel_push"
        });
      }
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
