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
    sessions: [],
    courseOutlines: [],
    relationshipMaps: [],
    checkInScales: [],
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
  if (!Array.isArray(room.sessions)) room.sessions = [];
  room.sessions = room.sessions.map((session) => ({
    ...session,
    messageIds: Array.isArray(session.messageIds) ? session.messageIds : []
  }));
  if (!Array.isArray(room.courseOutlines)) room.courseOutlines = [];
  if (!Array.isArray(room.relationshipMaps)) room.relationshipMaps = [];
  if (!Array.isArray(room.checkInScales)) room.checkInScales = [];
  if (!Array.isArray(room.sessionNotes)) room.sessionNotes = [];
  return room;
}

function findSessionInData(data, sessionId) {
  for (const room of Object.values(data.rooms || {})) {
    ensureRoomShape(room);
    const session = room.sessions.find((item) => item.id === sessionId);
    if (session) return { room, session };
  }
  return null;
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

  createSession(roomId, input = {}) {
    let created;
    const startedAt = input.startedAt || nowIso();
    const durationMinutes = Number(input.durationMinutes || 60);
    const endsAt = input.endsAt || new Date(new Date(startedAt).getTime() + durationMinutes * 60 * 1000).toISOString();
    const room = this.updateRoom(roomId, (draft) => {
      const sessionNumber = Number(input.sessionNumber || draft.sessions.length + 1);
      created = {
        id: input.sessionId || newId("session"),
        roomId,
        sessionNumber,
        status: "active",
        durationMinutes,
        startedAt,
        messageIds: Array.isArray(input.messageIds) ? input.messageIds : []
      };
      if (input.courseOutlineId) created.courseOutlineId = input.courseOutlineId;
      if (Array.isArray(input.moduleIds)) created.moduleIds = input.moduleIds;
      draft.sessions.push(created);
      draft.session = {
        ...defaultSessionState(),
        id: created.id,
        status: "running",
        sessionNumber,
        durationMinutes,
        startedAt,
        endsAt,
        endedAt: null,
        wrapUpReminderSentAt: null,
        noteStatus: "not_started",
        currentNoteId: null
      };
    });
    return { room, session: created };
  }

  getSession(sessionId) {
    const data = this.load();
    const found = findSessionInData(data, sessionId);
    return found ? { room: found.room, session: found.session } : null;
  }

  endSessionRecord(sessionId, input = {}) {
    const data = this.load();
    const found = findSessionInData(data, sessionId);
    if (!found) return null;
    const endedAt = input.endedAt || nowIso();
    found.session.status = "ended";
    found.session.endedAt = endedAt;
    if (input.mediatorNoteId) found.session.mediatorNoteId = input.mediatorNoteId;
    if (found.room.session?.id === sessionId) {
      found.room.session = {
        ...defaultSessionState(),
        ...found.room.session,
        status: "ended",
        endedAt,
        noteStatus: input.noteStatus || found.room.session.noteStatus || "not_started"
      };
    }
    this.save(data);
    return { room: found.room, session: found.session };
  }

  upsertCourseOutline(roomId, input = {}) {
    let outline;
    const room = this.updateRoom(roomId, (draft) => {
      const id = input.id || draft.courseOutlines.at(-1)?.id || newId("course");
      const existingIndex = draft.courseOutlines.findIndex((item) => item.id === id);
      outline = {
        id,
        totalSessions: Number(input.totalSessions || draft.courseOutlines.at(-1)?.totalSessions || 12),
        reviewCadenceSessions: Number(input.reviewCadenceSessions || draft.courseOutlines.at(-1)?.reviewCadenceSessions || 4),
        currentSessionNumber: Number(input.currentSessionNumber || draft.session?.sessionNumber || 1),
        focus: String(input.focus || draft.courseOutlines.at(-1)?.focus || "").trim(),
        moduleIds: Array.isArray(input.moduleIds) ? input.moduleIds : (draft.courseOutlines.at(-1)?.moduleIds || []),
        createdAt: existingIndex >= 0 ? draft.courseOutlines[existingIndex].createdAt : nowIso(),
        updatedAt: nowIso()
      };
      if (existingIndex >= 0) {
        draft.courseOutlines[existingIndex] = outline;
      } else {
        draft.courseOutlines.push(outline);
      }
    });
    return { room, courseOutline: outline };
  }

  createRelationshipMap(roomId, input = {}) {
    let relationshipMap;
    const room = this.updateRoom(roomId, (draft) => {
      relationshipMap = {
        id: input.id || newId("map"),
        afterSessionNumber: Number(input.afterSessionNumber || draft.session?.sessionNumber || draft.sessions.length || 1),
        createdAt: input.createdAt || nowIso(),
        themes: Array.isArray(input.themes) ? input.themes : [],
        stuckLoops: Array.isArray(input.stuckLoops) ? input.stuckLoops : [],
        repairExperiments: Array.isArray(input.repairExperiments) ? input.repairExperiments : [],
        openQuestions: Array.isArray(input.openQuestions) ? input.openQuestions : []
      };
      draft.relationshipMaps.push(relationshipMap);
    });
    return { room, relationshipMap };
  }

  addCheckInScale(sessionId, input = {}) {
    const data = this.load();
    const found = findSessionInData(data, sessionId);
    if (!found) return null;
    const checkInScale = {
      id: input.id || newId("scale"),
      roomId: found.room.id,
      sessionId,
      createdAt: input.createdAt || nowIso(),
      scaleType: input.scaleType || "repair_readiness",
      ratings: input.ratings && typeof input.ratings === "object" ? input.ratings : {},
      notes: String(input.notes || "").trim()
    };
    found.room.checkInScales.push(checkInScale);
    this.save(data);
    return { room: found.room, session: found.session, checkInScale };
  }

  getRoomRecall(roomId, { beforeSessionId } = {}) {
    const room = this.getRoom(roomId);
    const targetSession = beforeSessionId
      ? room.sessions.find((session) => session.id === beforeSessionId)
      : null;
    const targetNumber = targetSession?.sessionNumber || Infinity;
    const priorSessions = room.sessions
      .filter((session) => session.sessionNumber < targetNumber)
      .sort((a, b) => b.sessionNumber - a.sessionNumber);
    const priorSessionIds = new Set(priorSessions.map((session) => session.id));
    const priorNotes = room.sessionNotes
      .filter((note) => !beforeSessionId || priorSessionIds.has(note.sessionId) || note.sessionNumber < targetNumber)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    const latestRelationshipMap = [...room.relationshipMaps]
      .filter((map) => map.afterSessionNumber < targetNumber)
      .sort((a, b) => b.afterSessionNumber - a.afterSessionNumber)
      .at(0) || null;
    return {
      roomId,
      beforeSessionId: beforeSessionId || null,
      previousSession: priorSessions.at(0) || null,
      latestMediatorNote: priorNotes.at(0) || null,
      latestRelationshipMap,
      activeCourseOutline: room.courseOutlines.at(-1) || null,
      recentCheckInScales: room.checkInScales.slice(-3)
    };
  }

  startSession(roomId, input = {}) {
    return this.createSession(roomId, input).room;
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
      const sessionRecord = room.sessions.find((item) => item.id === room.session.id);
      if (sessionRecord) {
        sessionRecord.status = "ended";
        sessionRecord.endedAt = room.session.endedAt;
      }
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
      const sessionRecord = draft.sessions.find((item) => item.id === note.sessionId);
      if (sessionRecord) sessionRecord.mediatorNoteId = note.id;
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
      const message = {
        id: newId("msg"),
        createdAt: nowIso(),
        authorRole: input.authorRole || "human",
        authorName: input.authorName || input.authorRole || "Participant",
        content: String(input.content || "").trim(),
        channelId: input.channelId || "local",
        kind: input.kind || "room_message"
      };
      room.messages.push(message);
      const activeSession = room.sessions.find((item) => item.id === room.session?.id)
        || room.sessions.find((item) => item.status === "active");
      if (activeSession && !activeSession.messageIds.includes(message.id)) {
        activeSession.messageIds.push(message.id);
      }
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
        const message = {
          id: push.id,
          createdAt: push.createdAt,
          authorRole: "channel",
          authorName: push.from,
          content: push.content,
          channelId,
          kind: "channel_push"
        };
        room.messages.push(message);
        const activeSession = room.sessions.find((item) => item.id === room.session?.id)
          || room.sessions.find((item) => item.status === "active");
        if (activeSession && !activeSession.messageIds.includes(message.id)) {
          activeSession.messageIds.push(message.id);
        }
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
