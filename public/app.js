const roomId = "default";

const els = {
  locale: document.querySelector("#locale"),
  tagline: document.querySelector("#tagline"),
  provider: document.querySelector("#provider"),
  baseUrl: document.querySelector("#baseUrl"),
  model: document.querySelector("#model"),
  apiKey: document.querySelector("#apiKey"),
  rememberApiKey: document.querySelector("#rememberApiKey"),
  saveConfig: document.querySelector("#saveConfig"),
  clearApiKey: document.querySelector("#clearApiKey"),
  pushFrom: document.querySelector("#pushFrom"),
  pushContent: document.querySelector("#pushContent"),
  sendPush: document.querySelector("#sendPush"),
  messages: document.querySelector("#messages"),
  messageForm: document.querySelector("#messageForm"),
  authorRole: document.querySelector("#authorRole"),
  messageInput: document.querySelector("#messageInput"),
  askMediator: document.querySelector("#askMediator"),
  systemPrompt: document.querySelector("#systemPrompt")
};

const copy = {
  en: {
    tagline: "Not therapy, not debugging. Deburapy for AI-human relationships.",
    ask: "Ask Deburapy",
    busy: "Thinking..."
  },
  "zh-Hans": {
    tagline: "不是治疗，不是调试。Deburapy 面向人机关系。",
    ask: "询问 Deburapy",
    busy: "思考中..."
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

let lastProvider = els.provider.value;

function config() {
  return {
    provider: els.provider.value,
    baseUrl: els.baseUrl.value.trim(),
    model: els.model.value.trim(),
    apiKey: els.apiKey.value.trim()
  };
}

function applyProviderDefaults({ force = false } = {}) {
  const defaults = providerDefaults[els.provider.value] || providerDefaults["openai-compatible"];
  const previous = providerDefaults[lastProvider] || providerDefaults["openai-compatible"];

  els.baseUrl.placeholder = defaults.baseUrl;
  els.model.placeholder = defaults.model;

  if (force || !els.baseUrl.value.trim() || els.baseUrl.value.trim() === previous.baseUrl) {
    els.baseUrl.value = defaults.baseUrl;
  }
  if (force || !els.model.value.trim() || els.model.value.trim() === previous.model) {
    els.model.value = defaults.model;
  }

  lastProvider = els.provider.value;
}

function saveConfig() {
  const current = config();
  const saved = {
    provider: current.provider,
    baseUrl: current.baseUrl,
    model: current.model,
    rememberApiKey: els.rememberApiKey.checked
  };
  if (els.rememberApiKey.checked) {
    saved.apiKey = current.apiKey;
  }
  localStorage.setItem("deburapy.config", JSON.stringify(saved));
}

function loadConfig() {
  const saved = JSON.parse(localStorage.getItem("deburapy.config") || "{}");
  if (saved.provider) els.provider.value = saved.provider;
  if (saved.baseUrl) els.baseUrl.value = saved.baseUrl;
  if (saved.model) els.model.value = saved.model;
  els.rememberApiKey.checked = saved.rememberApiKey === true;
  if (saved.rememberApiKey === true && saved.apiKey) {
    els.apiKey.value = saved.apiKey;
  } else if (saved.apiKey) {
    delete saved.apiKey;
    localStorage.setItem("deburapy.config", JSON.stringify(saved));
  }
}

function clearApiKey() {
  els.apiKey.value = "";
  els.rememberApiKey.checked = false;
  saveConfig();
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
    item.className = "message";
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

async function loadPrompt() {
  const payload = await json("/api/prompts/mediator");
  els.systemPrompt.value = payload.systemPrompt;
}

function setLocale(locale) {
  els.tagline.textContent = copy[locale].tagline;
  els.askMediator.textContent = copy[locale].ask;
}

els.locale.addEventListener("change", () => setLocale(els.locale.value));
els.provider.addEventListener("change", () => applyProviderDefaults());
els.saveConfig.addEventListener("click", saveConfig);
els.clearApiKey.addEventListener("click", clearApiKey);

els.messageForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const content = els.messageInput.value.trim();
  if (!content) return;
  await json(`/api/rooms/${roomId}/messages`, {
    method: "POST",
    body: JSON.stringify({
      authorRole: els.authorRole.value,
      authorName: els.authorRole.options[els.authorRole.selectedIndex].text,
      content
    })
  });
  els.messageInput.value = "";
  await refreshRoom();
});

els.sendPush.addEventListener("click", async () => {
  const content = els.pushContent.value.trim();
  if (!content) return;
  await json("/api/channels/local/push", {
    method: "POST",
    body: JSON.stringify({
      roomId,
      from: els.pushFrom.value.trim() || "External Channel",
      content,
      targetParticipantId: "companion"
    })
  });
  els.pushContent.value = "";
  await refreshRoom();
});

els.askMediator.addEventListener("click", async () => {
  const current = config();
  saveConfig();
  els.askMediator.disabled = true;
  els.askMediator.textContent = copy[els.locale.value].busy;
  try {
    await json("/api/mediator/respond", {
      method: "POST",
      body: JSON.stringify({
        ...current,
        roomId,
        locale: els.locale.value,
        systemPrompt: els.systemPrompt.value
      })
    });
    await refreshRoom();
  } catch (err) {
    alert(err instanceof Error ? err.message : String(err));
  } finally {
    els.askMediator.disabled = false;
    els.askMediator.textContent = copy[els.locale.value].ask;
  }
});

loadConfig();
applyProviderDefaults();
setLocale(els.locale.value);
await loadPrompt();
await refreshRoom();
