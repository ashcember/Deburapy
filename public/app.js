const roomId = "default";

const els = {
  locale: document.querySelector("#locale"),
  tagline: document.querySelector("#tagline"),
  mediatorProvider: document.querySelector("#mediatorProvider"),
  mediatorBaseUrl: document.querySelector("#mediatorBaseUrl"),
  mediatorModel: document.querySelector("#mediatorModel"),
  mediatorApiKey: document.querySelector("#mediatorApiKey"),
  rememberMediatorApiKey: document.querySelector("#rememberMediatorApiKey"),
  mediatorPrompt: document.querySelector("#mediatorPrompt"),
  mediatorDot: document.querySelector("#mediatorDot"),
  mediatorStatus: document.querySelector("#mediatorStatus"),
  testMediator: document.querySelector("#testMediator"),
  companionMode: document.querySelector("#companionMode"),
  companionName: document.querySelector("#companionName"),
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
  return {
    mediator: {
      ...modelConfig("mediator"),
      rememberApiKey: els.rememberMediatorApiKey.checked,
      systemPrompt: els.mediatorPrompt.value
    },
    companion: {
      ...modelConfig("companion"),
      mode: els.companionMode.value,
      name: els.companionName.value.trim() || "AI Companion",
      rememberApiKey: els.rememberCompanionApiKey.checked,
      systemPrompt: els.companionPrompt.value,
      documents: els.companionDocs.value
    }
  };
}

function saveConfig() {
  const current = fullConfig();
  const saved = {
    mediator: {
      provider: current.mediator.provider,
      baseUrl: current.mediator.baseUrl,
      model: current.mediator.model,
      rememberApiKey: current.mediator.rememberApiKey,
      systemPrompt: current.mediator.systemPrompt
    },
    companion: {
      provider: current.companion.provider,
      baseUrl: current.companion.baseUrl,
      model: current.companion.model,
      mode: current.companion.mode,
      name: current.companion.name,
      rememberApiKey: current.companion.rememberApiKey,
      systemPrompt: current.companion.systemPrompt,
      documents: current.companion.documents
    }
  };
  if (current.mediator.rememberApiKey) saved.mediator.apiKey = current.mediator.apiKey;
  if (current.companion.rememberApiKey) saved.companion.apiKey = current.companion.apiKey;
  localStorage.setItem("deburapy.config", JSON.stringify(saved));
  appendLog("Settings saved locally.");
}

function loadConfig() {
  const saved = JSON.parse(localStorage.getItem("deburapy.config") || "{}");
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
}

function loadTargetConfig(target, saved = {}) {
  if (saved.provider) els[`${target}Provider`].value = saved.provider;
  if (saved.baseUrl) els[`${target}BaseUrl`].value = saved.baseUrl;
  if (saved.model) els[`${target}Model`].value = saved.model;
  const rememberEl = target === "mediator" ? els.rememberMediatorApiKey : els.rememberCompanionApiKey;
  rememberEl.checked = saved.rememberApiKey === true;
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
}

async function loadMediatorPrompt() {
  const payload = await json("/api/prompts/mediator");
  if (!els.mediatorPrompt.value.trim()) els.mediatorPrompt.value = payload.systemPrompt;
}

function setLocale(locale) {
  els.tagline.textContent = copy[locale].tagline;
  els.askCompanion.textContent = copy[locale].askCompanion;
  els.askMediator.textContent = copy[locale].askMediator;
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
    appendLog("MCP companion mode waits for an external Claude/Codex client to read pending room context and reply.", "warn");
    alert("MCP companion mode needs an external MCP client. Use BYOK API companion for this browser-only smoke test.");
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
}

async function askMediator() {
  const cfg = requireApiConfig("mediator");
  await json("/api/mediator/respond", {
    method: "POST",
    body: JSON.stringify({
      ...cfg,
      roomId,
      locale: els.locale.value,
      systemPrompt: els.mediatorPrompt.value
    })
  });
  setStatus("mediator", "ok", "Deburapy mediator responded through API.");
  appendLog("Mediator response added to room.", "ok");
  await refreshRoom();
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
els.mediatorProvider.addEventListener("change", () => applyProviderDefaults("mediator"));
els.companionProvider.addEventListener("change", () => applyProviderDefaults("companion"));
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
  const content = els.messageInput.value.trim();
  if (!content) return;
  await json(`/api/rooms/${roomId}/messages`, {
    method: "POST",
    body: JSON.stringify({
      authorRole: "human",
      authorName: "Human",
      content
    })
  });
  els.messageInput.value = "";
  appendLog("Human message added.");
  await refreshRoom();
});

els.askCompanion.addEventListener("click", () => {
  saveConfig();
  runAction(els.askCompanion, copy[els.locale.value].companionBusy, askCompanion);
});
els.askMediator.addEventListener("click", () => {
  saveConfig();
  runAction(els.askMediator, copy[els.locale.value].mediatorBusy, askMediator);
});

loadConfig();
applyProviderDefaults("mediator");
applyProviderDefaults("companion");
setLocale(els.locale.value);
setStatus("mediator", "idle", "Not tested.");
setStatus("companion", "idle", "Not tested.");
appendLog("Deburapy loaded. Test both connections before running a room.");
await loadMediatorPrompt();
await refreshRoom();
