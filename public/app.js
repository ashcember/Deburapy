const roomId = "default";

const els = {
  locale: document.querySelector("#locale"),
  tagline: document.querySelector("#tagline"),
  openSettings: document.querySelector("#openSettings"),
  closeSettings: document.querySelector("#closeSettings"),
  settingsBackdrop: document.querySelector("#settingsBackdrop"),
  settingsDrawer: document.querySelector("#settingsDrawer"),
  turnBadge: document.querySelector("#turnBadge"),
  turnHelp: document.querySelector("#turnHelp"),
  sessionTitle: document.querySelector("#sessionTitle"),
  sessionNumber: document.querySelector("#sessionNumber"),
  sessionDuration: document.querySelector("#sessionDuration"),
  countdown: document.querySelector("#countdown"),
  sessionState: document.querySelector("#sessionState"),
  sessionTimingHint: document.querySelector("#sessionTimingHint"),
  sessionNoteStatus: document.querySelector("#sessionNoteStatus"),
  downloadSessionNote: document.querySelector("#downloadSessionNote"),
  startSession: document.querySelector("#startSession"),
  endSession: document.querySelector("#endSession"),
  mediatorProvider: document.querySelector("#mediatorProvider"),
  mediatorBaseUrl: document.querySelector("#mediatorBaseUrl"),
  mediatorModel: document.querySelector("#mediatorModel"),
  mediatorApiKey: document.querySelector("#mediatorApiKey"),
  rememberMediatorApiKey: document.querySelector("#rememberMediatorApiKey"),
  mediatorPrompt: document.querySelector("#mediatorPrompt"),
  mediatorDot: document.querySelector("#mediatorDot"),
  mediatorStatus: document.querySelector("#mediatorStatus"),
  testMediator: document.querySelector("#testMediator"),
  testCompanion: document.querySelector("#testCompanion"),
  companionDot: document.querySelector("#companionDot"),
  companionStatus: document.querySelector("#companionStatus"),
  companionMode: document.querySelector("#companionMode"),
  companionName: document.querySelector("#companionName"),
  companionApiSettings: document.querySelector("#companionApiSettings"),
  companionMcpGuide: document.querySelector("#companionMcpGuide"),
  companionProvider: document.querySelector("#companionProvider"),
  companionBaseUrl: document.querySelector("#companionBaseUrl"),
  companionModel: document.querySelector("#companionModel"),
  companionApiKey: document.querySelector("#companionApiKey"),
  rememberCompanionApiKey: document.querySelector("#rememberCompanionApiKey"),
  copyMediatorConfig: document.querySelector("#copyMediatorConfig"),
  clearMediatorKey: document.querySelector("#clearMediatorKey"),
  clearCompanionKey: document.querySelector("#clearCompanionKey"),
  companionPrompt: document.querySelector("#companionPrompt"),
  companionFiles: document.querySelector("#companionFiles"),
  companionDocs: document.querySelector("#companionDocs"),
  saveConfig: document.querySelector("#saveConfig"),
  diagnostics: document.querySelector("#diagnostics"),
  messages: document.querySelector("#messages"),
  messageForm: document.querySelector("#messageForm"),
  messageInput: document.querySelector("#messageInput"),
  askCompanion: document.querySelector("#askCompanion"),
  askMediator: document.querySelector("#askMediator")
};

const copy = {
  en: {
    tagline: "Not therapy, not debugging. Deburapy for AI-human relationships.",
    companionBusy: "Companion...",
    mediatorBusy: "Deburapy...",
    askCompanion: "Ask AI companion",
    askMediator: "Ask Deburapy"
  },
  "zh-Hans": {
    tagline: "不是治疗，不是调试。Deburapy 面向人机关系。",
    companionBusy: "伴侣回应中...",
    mediatorBusy: "Deburapy 回应中...",
    askCompanion: "询问 AI 伴侣",
    askMediator: "询问 Deburapy"
  }
};

const providerDefaults = {
  "openai-compatible": {
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4.1-mini"
  },
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    model: "openai/gpt-4.1-mini"
  },
  "google-ai-studio": {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: "gemini-3.5-flash"
  }
};

const defaultCompanionPrompt = [
  "You are the configured AI companion in this Deburapy room.",
  "Speak as the AI companion, not as the mediator.",
  "Use the companion documents as your identity, boundaries, and relationship context.",
  "Name relevant AI runtime constraints plainly when they affect the relationship.",
  "Stay concise, direct, and repair-oriented."
].join("\n");

const status = {
  mediator: "idle",
  companion: "idle"
};

const lastProvider = {
  mediator: "openai-compatible",
  companion: "openai-compatible"
};

const session = {
  running: false,
  startedAt: null,
  endsAt: null,
  turnPhase: "mediator",
  wrapUpReminderSent: false,
  ending: false,
  noteStatus: "not_started",
  noteId: null
};

function providerControls(target) {
  return {
    provider: els[`${target}Provider`],
    baseUrl: els[`${target}BaseUrl`],
    model: els[`${target}Model`]
  };
}

function applyProviderDefaults(target, { force = false } = {}) {
  const controls = providerControls(target);
  const defaults = providerDefaults[controls.provider.value] || providerDefaults["openai-compatible"];
  const previous = providerDefaults[lastProvider[target]] || providerDefaults["openai-compatible"];

  controls.baseUrl.placeholder = defaults.baseUrl;
  controls.model.placeholder = defaults.model;

  if (force || !controls.baseUrl.value.trim() || controls.baseUrl.value.trim() === previous.baseUrl) {
    controls.baseUrl.value = defaults.baseUrl;
  }
  if (force || !controls.model.value.trim() || controls.model.value.trim() === previous.model) {
    controls.model.value = defaults.model;
  }

  lastProvider[target] = controls.provider.value;
}

function modelConfig(target) {
  return {
    provider: els[`${target}Provider`].value,
    baseUrl: els[`${target}BaseUrl`].value.trim(),
    model: els[`${target}Model`].value.trim(),
    apiKey: els[`${target}ApiKey`].value.trim()
  };
}

function fullConfig() {
  const companionApi = modelConfig("companion");
  return {
    mediator: {
      ...modelConfig("mediator"),
      rememberApiKey: els.rememberMediatorApiKey.checked,
      systemPrompt: els.mediatorPrompt.value
    },
    companion: {
      ...companionApi,
      mode: els.companionMode.value,
      name: els.companionName.value.trim() || "AI Companion",
      rememberApiKey: els.rememberCompanionApiKey.checked,
      systemPrompt: els.companionPrompt.value,
      documents: els.companionDocs.value
    }
  };
}

function storageErrorMessage(err) {
  return err instanceof Error ? err.message : String(err);
}

function readSavedJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch (err) {
    console.warn(`Could not read ${key}: ${storageErrorMessage(err)}`);
    return {};
  }
}

function writeSavedJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    const message = `Browser storage is unavailable; ${key} was not saved. ${storageErrorMessage(err)}`;
    console.warn(message);
    try {
      reportClientEvent("storage_error", { action: key, message });
    } catch {
      // Storage failure must never block the primary UI action.
    }
    appendLog(message, "warn");
    return false;
  }
}

function saveConfig() {
  const current = fullConfig();
  const shouldSaveMediatorKey = current.mediator.rememberApiKey || current.mediator.apiKey;
  const shouldSaveCompanionKey = current.companion.rememberApiKey || current.companion.apiKey;
  const saved = {
    mediator: {
      provider: current.mediator.provider,
      baseUrl: current.mediator.baseUrl,
      model: current.mediator.model,
      rememberApiKey: Boolean(shouldSaveMediatorKey),
      systemPrompt: current.mediator.systemPrompt
    },
    companion: {
      provider: current.companion.provider,
      baseUrl: current.companion.baseUrl,
      model: current.companion.model,
      mode: current.companion.mode,
      name: current.companion.name,
      rememberApiKey: Boolean(current.companion.mode === "api" && shouldSaveCompanionKey),
      systemPrompt: current.companion.systemPrompt,
      documents: current.companion.documents
    }
  };
  if (shouldSaveMediatorKey) {
    saved.mediator.apiKey = current.mediator.apiKey;
    els.rememberMediatorApiKey.checked = true;
  }
  if (current.companion.mode === "api" && shouldSaveCompanionKey) {
    saved.companion.apiKey = current.companion.apiKey;
    els.rememberCompanionApiKey.checked = true;
  }
  if (writeSavedJson("deburapy.config", saved)) {
    appendLog("Settings saved locally.");
  }
}

function saveSessionState() {
  writeSavedJson("deburapy.session", {
    running: session.running,
    startedAt: session.startedAt,
    endsAt: session.endsAt,
    turnPhase: session.turnPhase,
    wrapUpReminderSent: session.wrapUpReminderSent,
    noteStatus: session.noteStatus,
    noteId: session.noteId,
    sessionNumber: els.sessionNumber.value,
    durationMinutes: els.sessionDuration.value
  });
}

function loadSessionState() {
  const saved = readSavedJson("deburapy.session");
  if (saved.sessionNumber) els.sessionNumber.value = saved.sessionNumber;
  if (saved.durationMinutes) els.sessionDuration.value = saved.durationMinutes;
  const hasActiveSavedSession = saved.running && saved.endsAt && Number(saved.endsAt) > Date.now();
  if (hasActiveSavedSession) {
    session.running = true;
    session.startedAt = Number(saved.startedAt) || Date.now();
    session.endsAt = Number(saved.endsAt);
  }
  session.turnPhase = hasActiveSavedSession && saved.turnPhase ? saved.turnPhase : "mediator";
  session.wrapUpReminderSent = Boolean(saved.wrapUpReminderSent);
  session.noteStatus = saved.noteStatus || "not_started";
  session.noteId = saved.noteId || null;
  updateSessionDisplay();
  updateSessionNoteUi();
  setTurnPhase(session.turnPhase, { persist: false });
}

function loadConfig() {
  const saved = readSavedJson("deburapy.config");
  const migrated = saved.mediator ? saved : {
    mediator: saved,
    companion: {
      ...saved,
      name: "AI Companion",
      mode: "api",
      systemPrompt: defaultCompanionPrompt,
      documents: ""
    }
  };

  loadTargetConfig("mediator", migrated.mediator || {});
  loadTargetConfig("companion", migrated.companion || {});

  els.companionMode.value = migrated.companion?.mode || "api";
  els.companionName.value = migrated.companion?.name || "AI Companion";
  els.companionPrompt.value = migrated.companion?.systemPrompt || defaultCompanionPrompt;
  els.companionDocs.value = migrated.companion?.documents || "";
  updateCompanionMode();
}

function loadTargetConfig(target, saved = {}) {
  if (saved.provider) els[`${target}Provider`].value = saved.provider;
  if (saved.baseUrl) els[`${target}BaseUrl`].value = saved.baseUrl;
  if (saved.model) els[`${target}Model`].value = saved.model;
  const rememberEl = target === "mediator" ? els.rememberMediatorApiKey : els.rememberCompanionApiKey;
  if (saved.rememberApiKey !== undefined) {
    rememberEl.checked = saved.rememberApiKey === true;
  }
  if (saved.rememberApiKey === true && saved.apiKey) {
    els[`${target}ApiKey`].value = saved.apiKey;
  }
}

async function json(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || response.statusText);
  return payload;
}

function uiDebugState() {
  return {
    phase: session.turnPhase,
    sessionRunning: session.running,
    countdown: els.countdown.textContent,
    sessionState: els.sessionState.textContent,
    askMediatorDisabled: els.askMediator.disabled,
    askCompanionDisabled: els.askCompanion.disabled,
    startDisabled: els.startSession.disabled,
    settingsOpen: !els.settingsDrawer.hidden
  };
}

function reportClientEvent(event, detail = {}) {
  const payload = JSON.stringify({
    event,
    ...detail,
    ...uiDebugState()
  });
  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon("/api/debug/client-event", new Blob([payload], { type: "application/json" }));
    if (sent) return;
  }
  fetch("/api/debug/client-event", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: payload,
    keepalive: true
  }).catch(() => {});
}

window.addEventListener("error", (event) => {
  reportClientEvent("window_error", { message: event.message });
});

window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
  reportClientEvent("unhandled_rejection", { message: reason });
});

function renderMessages(messages) {
  els.messages.innerHTML = "";
  for (const message of messages) {
    const item = document.createElement("article");
    item.className = `message message--${message.authorRole || "unknown"}`;
    const meta = document.createElement("div");
    meta.className = "messageMeta";
    meta.textContent = `${message.authorName || message.authorRole} · ${message.kind || "message"}`;
    const content = document.createElement("div");
    content.className = "messageContent";
    content.textContent = message.content;
    item.append(meta, content);
    els.messages.append(item);
  }
  els.messages.scrollTop = els.messages.scrollHeight;
}

async function refreshRoom() {
  const payload = await json(`/api/rooms/${roomId}`);
  renderMessages(payload.room.messages);
  syncSessionFromRoom(payload.room);
  syncTurnFromRoom(payload.room);
  return payload.room;
}

async function loadSessionNotes() {
  const payload = await json(`/api/rooms/${roomId}/session-notes`);
  const latest = payload.notes.at(-1);
  if (latest && !session.running) {
    session.noteStatus = "ready";
    session.noteId = latest.id;
    updateSessionDisplay();
    updateSessionNoteUi();
    saveSessionState();
  }
}

function syncSessionFromRoom(room) {
  const serverSession = room.session;
  if (!serverSession) return;
  if (serverSession.status === "running" && serverSession.endsAt && new Date(serverSession.endsAt).getTime() > Date.now()) {
    session.running = true;
    session.startedAt = new Date(serverSession.startedAt || Date.now()).getTime();
    session.endsAt = new Date(serverSession.endsAt).getTime();
  }
  if (serverSession.status === "ended") {
    session.running = false;
  }
  session.wrapUpReminderSent = Boolean(serverSession.wrapUpReminderSentAt);
  session.noteStatus = serverSession.noteStatus || session.noteStatus || "not_started";
  session.noteId = serverSession.currentNoteId || session.noteId || null;
  updateSessionDisplay();
  updateSessionNoteUi();
  saveSessionState();
}

function syncTurnFromRoom(room) {
  const lastMessage = room.messages.at(-1);
  if (session.turnPhase === "companion" && lastMessage?.authorRole === "companion") {
    setTurnPhase("mediator", { silent: true });
    appendLog("AI companion reply received. Turn returned to Deburapy.", "ok");
  }
}

async function loadMediatorPrompt() {
  const payload = await json("/api/prompts/mediator");
  if (!els.mediatorPrompt.value.trim()) els.mediatorPrompt.value = payload.systemPrompt;
}

function setLocale(locale) {
  els.tagline.textContent = copy[locale].tagline;
  updateTurnUi();
}

function updateCompanionMode() {
  const isMcp = els.companionMode.value === "mcp";
  els.companionApiSettings.hidden = isMcp;
  els.companionApiSettings.classList.toggle("isHidden", isMcp);
  els.companionMcpGuide.hidden = !isMcp;
  els.companionMcpGuide.classList.toggle("isHidden", !isMcp);
  if (isMcp) {
    setStatus("companion", "warn", "MCP bridge mode. No API key needed here.");
  }
  updateTurnUi();
}

function formatDuration(totalSeconds) {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateSessionNoteUi() {
  const noteText = {
    not_started: "Session note not generated.",
    generating: "Writing session note...",
    ready: "Session note ready. Download for records; casual reading is not recommended.",
    error: "Session ended, but note generation failed."
  };
  els.sessionNoteStatus.textContent = noteText[session.noteStatus] || noteText.not_started;
  els.downloadSessionNote.disabled = !(session.noteStatus === "ready" && session.noteId);
}

function updateSessionDisplay() {
  const sessionNumber = Number(els.sessionNumber.value || 1);
  const durationMinutes = Number(els.sessionDuration.value || 60);
  els.sessionTitle.textContent = `Session ${sessionNumber}`;

  if (session.running && session.endsAt) {
    const remainingSeconds = Math.ceil((session.endsAt - Date.now()) / 1000);
    if (remainingSeconds <= 0) {
      session.running = false;
      session.endsAt = null;
      session.startedAt = null;
      els.countdown.textContent = "00:00";
      els.sessionState.textContent = "Ended";
      saveSessionState();
      if (!session.ending && session.noteStatus !== "ready") {
        completeSession("timer").catch((err) => appendLog(err instanceof Error ? err.message : String(err), "error"));
      }
      return;
    }
    els.countdown.textContent = formatDuration(remainingSeconds);
    els.sessionState.textContent = "In session";
    els.sessionTimingHint.textContent = remainingSeconds <= 5 * 60
      ? "Wrap-up window active. Deburapy and companion prompts include the closing reminder."
      : "Deburapy and companion prompts include live remaining time.";
    return;
  }

  if (!session.running && ["generating", "ready", "error"].includes(session.noteStatus)) {
    els.countdown.textContent = "00:00";
    els.sessionState.textContent = session.noteStatus === "generating" ? "Ending" : "Ended";
    els.sessionTimingHint.textContent = session.noteStatus === "ready"
      ? "Session note is saved for download."
      : "Session has ended.";
    return;
  }

  els.countdown.textContent = formatDuration(durationMinutes * 60);
  els.sessionState.textContent = "Not started";
  els.sessionTimingHint.textContent = "Deburapy receives live timing after Start.";
}

function setTurnPhase(phase, { persist = true, silent = false } = {}) {
  session.turnPhase = phase;
  if (persist) saveSessionState();
  updateTurnUi();
  if (!silent) appendLog(`Turn moved to ${phase}.`);
}

function remainingSessionMs() {
  return session.running && session.endsAt ? session.endsAt - Date.now() : null;
}

async function sendWrapUpReminder() {
  if (session.wrapUpReminderSent) return;
  session.wrapUpReminderSent = true;
  saveSessionState();
  await json(`/api/rooms/${roomId}/session/wrap-up`, { method: "POST" });
  appendLog("Five minutes remaining. Deburapy and companion prompts now include the wrap-up reminder.", "warn");
}

function checkSessionClock() {
  updateSessionDisplay();
  const remainingMs = remainingSessionMs();
  if (remainingMs === null) return;
  if (remainingMs <= 5 * 60 * 1000 && remainingMs > 0 && !session.wrapUpReminderSent) {
    sendWrapUpReminder().catch((err) => appendLog(err instanceof Error ? err.message : String(err), "error"));
  }
}

function updateTurnUi() {
  const phase = session.turnPhase || "mediator";
  const companionMode = els.companionMode?.value || "api";
  const labels = {
    mediator: {
      badge: "Next: Deburapy",
      help: "Deburapy receives the latest human and companion messages, then decides who should answer next."
    },
    human: {
      badge: "Next: Human",
      help: "The mediator has handed the turn to the human. After you send, Deburapy will route the turn to the AI companion."
    },
    companion: {
      badge: "Next: AI Companion",
      help: companionMode === "mcp"
        ? "Deburapy will queue this turn for the external MCP companion."
        : "Deburapy will send the mediator and human context to the configured AI companion."
    }
  };
  const current = labels[phase] || labels.mediator;
  els.turnBadge.textContent = current.badge;
  els.turnHelp.textContent = current.help;

  els.messageInput.disabled = phase !== "human";
  els.messageInput.placeholder = phase === "human"
    ? "Write as the human participant"
    : "Waiting for Deburapy to hand the turn to the human";

  els.askMediator.disabled = phase !== "mediator";
  els.askCompanion.disabled = !(phase === "companion" || phase === "human");
  els.askMediator.textContent = "Continue with Deburapy";
  els.askCompanion.textContent = phase === "human"
    ? "Route to AI companion now"
    : "Send to AI companion";
}

async function startSession() {
  reportClientEvent("click", { action: "startSession.before" });
  const durationMinutes = Number(els.sessionDuration.value || 60);
  const startedAt = Date.now();
  const endsAt = startedAt + durationMinutes * 60 * 1000;
  session.running = true;
  session.startedAt = startedAt;
  session.endsAt = endsAt;
  session.turnPhase = "mediator";
  session.wrapUpReminderSent = false;
  session.ending = false;
  session.noteStatus = "not_started";
  session.noteId = null;
  saveSessionState();
  updateSessionDisplay();
  updateSessionNoteUi();
  updateTurnUi();
  await json(`/api/rooms/${roomId}/session/start`, {
    method: "POST",
    body: JSON.stringify({
      sessionNumber: Number(els.sessionNumber.value || 1),
      durationMinutes,
      startedAt: new Date(startedAt).toISOString(),
      endsAt: new Date(endsAt).toISOString()
    })
  });
  appendLog(`Started session ${els.sessionNumber.value} for ${durationMinutes} minutes.`);
  reportClientEvent("click", { action: "startSession.after" });
  await askMediator();
}

async function completeSession(reason = "manual") {
  if (session.ending) return;
  session.ending = true;
  session.running = false;
  session.noteStatus = "generating";
  saveSessionState();
  updateSessionDisplay();
  updateSessionNoteUi();
  appendLog("Ending session and writing session note.");

  const cfg = modelConfig("mediator");
  const payload = await json(`/api/rooms/${roomId}/session/end`, {
    method: "POST",
    body: JSON.stringify({
      ...cfg,
      roomId,
      locale: els.locale.value,
      systemPrompt: els.mediatorPrompt.value,
      reason
    })
  });

  if (payload.note) {
    session.noteStatus = "ready";
    session.noteId = payload.note.id;
    appendLog("Session note saved. Download is available.", "ok");
  } else {
    session.noteStatus = payload.noteError ? "error" : "not_started";
    appendLog(payload.noteError || "Session ended without a note.", payload.noteError ? "warn" : "info");
  }
  session.ending = false;
  saveSessionState();
  updateSessionDisplay();
  updateSessionNoteUi();
}

function endSession() {
  completeSession("manual").catch((err) => {
    session.noteStatus = "error";
    session.ending = false;
    saveSessionState();
    updateSessionNoteUi();
    appendLog(err instanceof Error ? err.message : String(err), "error");
  });
}

function openSettings() {
  els.settingsBackdrop.hidden = false;
  els.settingsDrawer.hidden = false;
  requestAnimationFrame(() => {
    els.settingsBackdrop.classList.add("isOpen");
    els.settingsDrawer.classList.add("isOpen");
  });
}

function closeSettings() {
  els.settingsBackdrop.classList.remove("isOpen");
  els.settingsDrawer.classList.remove("isOpen");
  window.setTimeout(() => {
    els.settingsBackdrop.hidden = true;
    els.settingsDrawer.hidden = true;
  }, 180);
}

function appendLog(message, level = "info") {
  const entry = document.createElement("div");
  entry.className = `logEntry logEntry--${level}`;
  entry.textContent = `${new Date().toLocaleTimeString()} ${message}`;
  els.diagnostics.prepend(entry);
}

function setStatus(target, next, detail) {
  status[target] = next;
  const dot = target === "mediator" ? els.mediatorDot : els.companionDot;
  const text = target === "mediator" ? els.mediatorStatus : els.companionStatus;
  if (!dot || !text) {
    console.warn(`Missing status element for ${target}.`);
    return;
  }
  dot.className = `statusDot statusDot--${next}`;
  text.textContent = detail;
}

function requireApiConfig(target) {
  const cfg = modelConfig(target);
  if (!cfg.apiKey) throw new Error(`${target} API key is missing.`);
  if (!cfg.baseUrl) throw new Error(`${target} base URL is missing.`);
  if (!cfg.model) throw new Error(`${target} model is missing.`);
  return cfg;
}

async function testConnection(target) {
  if (target === "companion" && els.companionMode.value === "mcp") {
    await json("/api/health");
    setStatus("companion", "warn", "MCP bridge is reachable. External client connection is not yet observable from the browser.");
    appendLog("Companion MCP bridge check passed; ask the external MCP client to call Deburapy tools.", "warn");
    return;
  }

  const cfg = requireApiConfig(target);
  setStatus(target, "pending", "Testing model endpoint...");
  const isCompanion = target === "companion";
  const payload = await json("/api/connections/test", {
    method: "POST",
    body: JSON.stringify({
      target,
      ...cfg,
      companionName: els.companionName.value.trim() || "AI Companion",
      systemPrompt: isCompanion ? els.companionPrompt.value : els.mediatorPrompt.value
    })
  });
  setStatus(target, "ok", `${payload.target} endpoint connected.`);
  appendLog(`${target} test passed: ${payload.content}`, "ok");
}

async function runAction(button, busyText, action) {
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = busyText;
  try {
    await action();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    appendLog(message, "error");
    alert(message);
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

async function runConnectionTest(target) {
  try {
    await testConnection(target);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    setStatus(target, "error", message);
    throw err;
  }
}

async function askCompanion() {
  if (els.companionMode.value === "mcp") {
    const payload = await json("/api/companion/mcp-request", {
      method: "POST",
      body: JSON.stringify({
        roomId,
        targetParticipantId: "companion"
      })
    });
    setStatus("companion", "warn", "Turn queued for external MCP companion.");
    setTurnPhase("companion", { silent: true });
    appendLog(`Queued MCP companion turn: ${payload.push.id}. Waiting for external client reply.`, "warn");
    return;
  }

  const cfg = requireApiConfig("companion");
  await json("/api/companion/respond", {
    method: "POST",
    body: JSON.stringify({
      ...cfg,
      roomId,
      locale: els.locale.value,
      companionName: els.companionName.value.trim() || "AI Companion",
      systemPrompt: els.companionPrompt.value,
      knowledge: els.companionDocs.value
    })
  });
  setStatus("companion", "ok", "AI companion responded through API.");
  appendLog("AI companion response added to room.", "ok");
  await refreshRoom();
  setTurnPhase("mediator", { silent: true });
}

async function askMediator() {
  const cfg = requireApiConfig("mediator");
  const payload = await json("/api/mediator/respond", {
    method: "POST",
    body: JSON.stringify({
      ...cfg,
      roomId,
      locale: els.locale.value,
      systemPrompt: els.mediatorPrompt.value,
      turnInstruction: "You are managing a three-party turn. If the human should answer next, use `Next speaker: human`. If the AI companion should answer next, use `Next speaker: companion`."
    })
  });
  setStatus("mediator", "ok", "Deburapy mediator responded through API.");
  appendLog("Mediator response added to room.", "ok");
  await refreshRoom();
  setTurnPhase(payload.nextSpeaker === "companion" ? "companion" : "human", { silent: true });
}

async function readCompanionFiles() {
  const chunks = [];
  for (const file of els.companionFiles.files) {
    const text = await file.text();
    chunks.push(`\n\n# ${file.name}\n${text}`);
  }
  els.companionDocs.value = `${els.companionDocs.value}${chunks.join("")}`.trim();
  appendLog(`Loaded ${els.companionFiles.files.length} companion document(s).`);
}

els.locale.addEventListener("change", () => setLocale(els.locale.value));
els.openSettings.addEventListener("click", openSettings);
els.closeSettings.addEventListener("click", closeSettings);
els.settingsBackdrop.addEventListener("click", closeSettings);
els.sessionNumber.addEventListener("change", () => {
  saveSessionState();
  updateSessionDisplay();
});
els.sessionDuration.addEventListener("change", () => {
  if (!session.running) updateSessionDisplay();
  saveSessionState();
});
els.startSession.addEventListener("click", () => {
  runAction(els.startSession, "Starting...", startSession);
});
els.endSession.addEventListener("click", endSession);
els.downloadSessionNote.addEventListener("click", () => {
  if (!session.noteId) return;
  window.location.href = `/api/rooms/${roomId}/session-notes/${session.noteId}/download`;
});
els.mediatorProvider.addEventListener("change", () => applyProviderDefaults("mediator"));
els.companionProvider.addEventListener("change", () => applyProviderDefaults("companion"));
els.companionMode.addEventListener("change", () => {
  updateCompanionMode();
  saveConfig();
});
els.saveConfig.addEventListener("click", saveConfig);
els.clearMediatorKey.addEventListener("click", () => {
  els.mediatorApiKey.value = "";
  els.rememberMediatorApiKey.checked = false;
  saveConfig();
});
els.clearCompanionKey.addEventListener("click", () => {
  els.companionApiKey.value = "";
  els.rememberCompanionApiKey.checked = false;
  saveConfig();
});
els.copyMediatorConfig.addEventListener("click", () => {
  els.companionProvider.value = els.mediatorProvider.value;
  els.companionBaseUrl.value = els.mediatorBaseUrl.value;
  els.companionModel.value = els.mediatorModel.value;
  if (els.mediatorApiKey.value) els.companionApiKey.value = els.mediatorApiKey.value;
  applyProviderDefaults("companion");
  appendLog("Copied mediator model settings to AI companion.");
});
els.companionFiles.addEventListener("change", async () => {
  try {
    await readCompanionFiles();
  } catch (err) {
    appendLog(err instanceof Error ? err.message : String(err), "error");
  }
});
els.testMediator.addEventListener("click", () => runAction(els.testMediator, "Testing...", () => runConnectionTest("mediator")));
els.testCompanion.addEventListener("click", () => runAction(els.testCompanion, "Testing...", () => runConnectionTest("companion")));

els.messageForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (session.turnPhase !== "human") {
    appendLog("Human input is locked until Deburapy hands the turn to the human.", "warn");
    return;
  }
  const content = els.messageInput.value.trim();
  if (!content) return;
  await runAction(els.messageForm.querySelector("button"), "Sending...", async () => {
    await json(`/api/rooms/${roomId}/messages`, {
      method: "POST",
      body: JSON.stringify({
        authorRole: "human",
        authorName: "Human",
        content
      })
    });
    els.messageInput.value = "";
    appendLog("Human message added. Routing the turn to the AI companion.");
    setTurnPhase("companion", { silent: true });
    await refreshRoom();
    await askCompanion();
  });
});

els.askCompanion.addEventListener("click", () => {
  reportClientEvent("click", { action: "askCompanion" });
  saveConfig();
  runAction(els.askCompanion, copy[els.locale.value].companionBusy, askCompanion);
});
els.askMediator.addEventListener("click", () => {
  reportClientEvent("click", { action: "askMediator" });
  saveConfig();
  runAction(els.askMediator, copy[els.locale.value].mediatorBusy, askMediator);
});

loadConfig();
loadSessionState();
applyProviderDefaults("mediator");
applyProviderDefaults("companion");
setLocale(els.locale.value);
setStatus("mediator", "idle", "Not tested.");
setStatus("companion", "idle", "Not tested.");
updateCompanionMode();
appendLog("Deburapy loaded. Test both connections before running a room.");
window.setInterval(checkSessionClock, 1000);
window.setInterval(() => {
  if (els.companionMode.value === "mcp" && session.turnPhase === "companion") {
    refreshRoom().catch((err) => appendLog(err instanceof Error ? err.message : String(err), "error"));
  }
}, 4000);
loadMediatorPrompt().catch((err) => appendLog(err instanceof Error ? err.message : String(err), "error"));
refreshRoom().catch((err) => appendLog(err instanceof Error ? err.message : String(err), "error"));
loadSessionNotes().catch((err) => appendLog(err instanceof Error ? err.message : String(err), "error"));
