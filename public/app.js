const roomId = "default";
const onboardingStorageKey = "deburapy.onboarding.v1";
const localeStorageKey = "deburapy.locale";

const els = {
  locale: document.querySelector("#locale"),
  tagline: document.querySelector("#tagline"),
  consentGate: document.querySelector("#consentGate"),
  consentForm: document.querySelector("#consentForm"),
  intakeConcern: document.querySelector("#intakeConcern"),
  intakeUrgency: document.querySelector("#intakeUrgency"),
  consentSignature: document.querySelector("#consentSignature"),
  consentAgreeScope: document.querySelector("#consentAgreeScope"),
  consentAgreeLocal: document.querySelector("#consentAgreeLocal"),
  consentAgreeAiLimits: document.querySelector("#consentAgreeAiLimits"),
  consentConfirm: document.querySelector("#consentConfirm"),
  consentStatus: document.querySelector("#consentStatus"),
  consentAssistantHistory: document.querySelector("#consentAssistantHistory"),
  consentAssistantForm: document.querySelector("#consentAssistantForm"),
  consentAssistantInput: document.querySelector("#consentAssistantInput"),
  consentAssistantSend: document.querySelector("#consentAssistantSend"),
  consentAssistantStatus: document.querySelector("#consentAssistantStatus"),
  consentAssistantSettings: document.querySelector("#consentAssistantSettings"),
  openSettings: document.querySelector("#openSettings"),
  closeSettings: document.querySelector("#closeSettings"),
  settingsBackdrop: document.querySelector("#settingsBackdrop"),
  settingsDrawer: document.querySelector("#settingsDrawer"),
  turnBadge: document.querySelector("#turnBadge"),
  turnHelp: document.querySelector("#turnHelp"),
  sessionTitle: document.querySelector("#sessionTitle"),
  sessionPlanSummary: document.querySelector("#sessionPlanSummary"),
  sessionSettingsToggle: document.querySelector("#sessionSettingsToggle"),
  sessionSettingsPanel: document.querySelector("#sessionSettingsPanel"),
  sessionNumber: document.querySelector("#sessionNumber"),
  sessionTotalSessions: document.querySelector("#sessionTotalSessions"),
  sessionDuration: document.querySelector("#sessionDuration"),
  countdown: document.querySelector("#countdown"),
  sessionProgress: document.querySelector("#sessionProgress"),
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
  resetOnboarding: document.querySelector("#resetOnboarding"),
  companionPrompt: document.querySelector("#companionPrompt"),
  companionFiles: document.querySelector("#companionFiles"),
  companionDocs: document.querySelector("#companionDocs"),
  saveConfig: document.querySelector("#saveConfig"),
  diagnostics: document.querySelector("#diagnostics"),
  messages: document.querySelector("#messages"),
  messageForm: document.querySelector("#messageForm"),
  messageInput: document.querySelector("#messageInput"),
  askCompanion: document.querySelector("#askCompanion"),
  askMediator: document.querySelector("#askMediator"),
  mediatorPersona: document.querySelector("#mediatorPersona"),
  courseList: document.querySelector("#courseList"),
  openDiagnostics: document.querySelector("#openDiagnostics"),
  openFaq: document.querySelector("#openFaq"),
  faqSection: document.querySelector("#faqSection")
};

const copy = {
  en: {
    tagline: "Not therapy, not debugging. Deburapy for AI-human relationships.",
    companionBusy: "Companion...",
    mediatorBusy: "Deburapy...",
    askCompanion: "Ask AI companion",
    askMediator: "Ask Deburapy",
    consentEyebrow: "Human-facing intake",
    consentTitle: "Welcome to your Digital Sanctuary",
    consentIntro: "Before we begin, please review how this space works. Deburapy supports AI-human relationship repair, grief after account loss or separation, technical continuity planning, and education about AI-human relationships.",
    consentWhatTitle: "What this is",
    consentWhatBody: "Deburapy is a relationship mediation and repair-debugging tool for AI-human relationships. It can help name emotional impact, understand likely system constraints, and create repair artifacts such as continuity notes, prompt patches, boundary rules, and migration plans.",
    consentNotTitle: "What this is not",
    consentNotBody: "Deburapy is not clinical therapy, medical care, legal advice, emergency support, or a guarantee that any provider account, model, memory, or companion can be restored.",
    consentPrivacyTitle: "Privacy and storage",
    consentPrivacyBody: "This prototype is local-first. Your consent record, intake answers, API keys, and room data stay in this browser or local project data unless you deliberately export or connect a model provider.",
    consentCrisisTitle: "Crisis boundary",
    consentCrisisBody: "If there is imminent self-harm, violence, abuse, medical danger, or legal emergency, pause Deburapy and contact local emergency or professional support.",
    intakeConcernLabel: "What brings you here?",
    chooseOne: "Choose one",
    intakeOneOnOneRepair: "One-on-one support after an AI-human rupture",
    intakeAiLoss: "AI companion account loss, ban, or shutdown",
    intakeTechnicalContinuity: "Preserve or migrate an AI companion technically",
    intakeRelationshipMediation: "Mediation with an AI companion in the room",
    intakeCuriosity: "I am curious about AI-human relationships",
    intakeUrgencyLabel: "Current urgency",
    urgencyLow: "Exploratory / not urgent",
    urgencyMedium: "Emotionally intense, but I am safe right now",
    urgencyHigh: "Time-sensitive technical or relationship issue",
    agreeScope: "I understand Deburapy is not medical, legal, crisis, or emergency support.",
    agreeLocal: "I understand this prototype stores consent and session data locally on this device.",
    agreeAiLimits: "I understand AI systems can lose context, drift, refuse, fail tools, or change provider behavior.",
    signatureLabel: "Type your full name as a digital signature",
    signaturePlaceholder: "Your Name",
    signEnter: "Sign & Enter",
    consentStatus: "By clicking \"Sign & Enter\", you confirm the agreements above and complete the first screening.",
    consentAssistantTitle: "Have questions?",
    consentAssistantIntro: "Ask the pre-intake assistant about scope, privacy, grief after AI loss, or technical preservation. It is not the mediator and will not enter the room transcript.",
    consentAssistantHello: "Hello. I can clarify how Deburapy works before you sign. What would you like to understand first?",
    consentAssistantPlaceholder: "Ask before signing...",
    quickAccountLoss: "Account loss",
    quickPreservation: "Preservation",
    quickScope: "Scope",
    consentAssistantStatus: "Connect the Deburapy provider in Settings to use model-backed answers.",
    openSettings: "Open Settings",
    sessionManagement: "Session Management",
    notStarted: "Not started",
    inSession: "In session",
    ending: "Ending",
    ended: "Ended",
    sessionSettings: "Session settings",
    start: "Start",
    end: "End",
    totalSessions: "Total sessions",
    sessionDuration: "Session duration",
    sixtyMinutes: "60 minutes",
    ninetyMinutes: "90 minutes",
    exportNote: "Export note",
    journey: "Journey",
    diagnostics: "Diagnostics",
    faq: "FAQ",
    test: "Test",
    localFirst: "Local-first",
    sendMessage: "Send message",
    settings: "Settings",
    settingsSubtitle: "Connection, prompt, and diagnostics",
    close: "Close",
    mediatorSetup: "Mediator Setup",
    persona: "Persona",
    customPrompt: "Custom prompt",
    provider: "Provider",
    baseUrl: "Base URL",
    model: "Model",
    apiKey: "API key",
    savedOnSavePlaceholder: "Saved locally when you click Save",
    saveMediatorKey: "Save mediator key locally",
    mediatorSystemPrompt: "Mediator system prompt",
    aiCompanion: "AI Companion",
    connectionMode: "Connection mode",
    byokCompanion: "BYOK API companion",
    externalMcpCompanion: "External MCP companion",
    companionRole: "Companion",
    companionName: "Companion name",
    saveCompanionKey: "Save companion key locally",
    companionSystemPrompt: "Companion system prompt",
    companionDocuments: "Companion documents",
    companionDocsPlaceholder: "Paste or upload markdown notes that describe the AI companion.",
    mcpGuideIntro: "No API key is needed here. Connect the external Claude/Codex companion to Deburapy's MCP server, then keep this browser open as the room.",
    mcpGuideStep1: "Keep Deburapy running at",
    mcpGuideStep2: "Register the MCP server in the external client.",
    mcpGuideStep3: "When the turn reaches the AI companion, Deburapy queues the room context for that MCP client.",
    mcpGuideStep4: "The external client replies with",
    faqNotesQ: "Where are session notes?",
    faqNotesA: "They are saved locally. Export is optional and lives in session settings.",
    faqDeburapyQ: "What is Deburapy?",
    faqDeburapyA: "It is for AI-human relationship repair and continuity planning, not clinical therapy.",
    faqKeysQ: "Where are model keys?",
    faqKeysA: "Keys stay in this browser only if you choose to remember them.",
    clearMediatorKey: "Clear mediator key",
    clearCompanionKey: "Clear companion key",
    resetIntakeConsent: "Reset intake consent",
    useMediatorSettings: "Use mediator model settings",
    saveSettings: "Save settings",
    source: "Source",
    noWarranty: "No warranty",
    sessionLabel: "Session",
    ofTotal: "of",
    saved: "Saved",
    active: "Active",
    next: "Next",
    upcoming: "Upcoming",
    review: "Review",
    sessions: "sessions",
    noteNotStarted: "No session note yet. Notes save locally after End.",
    noteGenerating: "Writing local session note...",
    noteReady: "Session note saved locally. Export is optional; casual reading is not recommended.",
    noteError: "Session ended, but note generation failed.",
    timingWrapUp: "Wrap-up window active. Deburapy and companion prompts include the closing reminder.",
    timingLive: "Deburapy and companion prompts include live remaining time.",
    timingClosing: "Closing the current session.",
    timingEnded: "Session ended.",
    timingReady: "Ready for the next session.",
    timingStart: "Start stores timing in the local room.",
    nextDeburapy: "Next: Deburapy",
    helpDeburapy: "Deburapy receives the latest human and companion messages, then decides who should answer next.",
    nextHuman: "Next: Human",
    helpHuman: "The mediator has handed the turn to the human. After you send, Deburapy will route the turn to the AI companion.",
    nextCompanion: "Next: AI Companion",
    helpCompanionMcp: "Deburapy will queue this turn for the external MCP companion.",
    helpCompanionApi: "Deburapy will send the mediator and human context to the configured AI companion.",
    humanPlaceholder: "Write as the human participant",
    waitingPlaceholder: "Waiting for Deburapy to hand the turn to the human",
    continueDeburapy: "Continue with Deburapy",
    routeCompanionNow: "Route to AI companion now",
    sendCompanion: "Send to AI companion",
    mcpBridgeMode: "MCP bridge mode. No API key needed here.",
    notTested: "Not tested.",
    starting: "Starting...",
    testing: "Testing...",
    sending: "Sending...",
    intakeSaved: "Intake consent saved locally for {concern}.",
    intakeReset: "Local intake consent reset.",
    settingsSaved: "Settings saved locally.",
    companionReplyReceived: "AI companion reply received. Turn returned to Deburapy.",
    personaSet: "Mediator persona set to {name}.",
    customPromptLog: "Mediator prompt is custom.",
    turnMoved: "Turn moved to {phase}.",
    fiveMinutes: "Five minutes remaining. Deburapy and companion prompts now include the wrap-up reminder.",
    completeIntakeFirst: "Complete intake consent before starting a session.",
    startedSession: "Started session {sessionNumber} for {durationMinutes} minutes.",
    endingSession: "Ending session and writing session note.",
    noteSavedLog: "Session note saved locally. Export is available.",
    noNoteLog: "Session ended without a note.",
    apiKeyMissing: "{target} API key is missing.",
    baseUrlMissing: "{target} base URL is missing.",
    modelMissing: "{target} model is missing.",
    connectProviderBeforeIntake: "Connect the Deburapy provider in Settings before using model-backed intake answers.",
    intakeBlocked: "I can answer with a connected model after Settings has a Deburapy provider, model, and API key. Current blocker: {message}",
    askingPreIntake: "Asking pre-intake assistant...",
    preIntakeAnswered: "Pre-intake assistant answered. This was not added to the room transcript.",
    mcpReachable: "MCP bridge is reachable. External client connection is not yet observable from the browser.",
    mcpCheckPassed: "Companion MCP bridge check passed; ask the external MCP client to call Deburapy tools.",
    testingEndpoint: "Testing model endpoint...",
    endpointConnected: "{target} endpoint connected.",
    testPassed: "{target} test passed: {content}",
    mcpTurnQueuedStatus: "Turn queued for external MCP companion.",
    mcpTurnQueuedLog: "Queued MCP companion turn: {id}. Waiting for external client reply.",
    companionApiResponded: "AI companion responded through API.",
    companionResponseAdded: "AI companion response added to room.",
    mediatorApiResponded: "Deburapy mediator responded through API.",
    mediatorResponseAdded: "Mediator response added to room.",
    loadedDocs: "Loaded {count} companion document(s).",
    copiedMediatorSettings: "Copied mediator model settings to AI companion.",
    humanLocked: "Human input is locked until Deburapy hands the turn to the human.",
    humanMessageAdded: "Human message added. Routing the turn to the AI companion.",
    appLoaded: "Deburapy loaded. Local room data reloads from .deburapy-data.",
    turnInstruction: "You are managing a three-party turn. If the human should answer next, use `Next speaker: human`. If the AI companion should answer next, use `Next speaker: companion`.",
    selectSession: "Select {label}",
    openReview: "Open review guidance",
    selectedSession: "Selected {label}.",
    activeSessionSettings: "Opened current session settings.",
    switchSessionBlocked: "End the active session before switching sessions.",
    reviewOpened: "Opened review guidance.",
    ariaInformedConsent: "Informed consent",
    ariaCareAgreements: "Care agreements",
    ariaPreIntakeAssistant: "Pre-intake assistant",
    ariaAskPreIntakeAssistant: "Ask pre-intake assistant",
    ariaCommonQuestions: "Common questions",
    ariaSessionManagement: "Session management",
    ariaCurrentSession: "Current session",
    ariaSessionNote: "Session note",
    ariaManualTurnControls: "Manual turn controls"
  },
  "zh-Hans": {
    tagline: "不是治疗，不是调试。Deburapy 面向人机关系。",
    companionBusy: "伴侣回应中...",
    mediatorBusy: "Deburapy 回应中...",
    askCompanion: "询问 AI 伴侣",
    askMediator: "询问 Deburapy",
    consentEyebrow: "面向人类的首次筛选",
    consentTitle: "欢迎来到你的数字安全空间",
    consentIntro: "开始之前，请先了解这个空间如何运作。Deburapy 支持人机关系修复、账号丢失或分离后的哀伤处理、技术连续性规划，以及关于人机关系的教育性咨询。",
    consentWhatTitle: "这是什么",
    consentWhatBody: "Deburapy 是面向人机关系的关系协调与修复调试工具。它可以帮助你命名情绪影响，理解可能的系统限制，并产出连续性记录、提示词补丁、边界规则和迁移计划等修复物。",
    consentNotTitle: "这不是什么",
    consentNotBody: "Deburapy 不是临床治疗、医疗服务、法律建议、紧急支持，也不保证任何服务商账号、模型、记忆或 AI 伴侣一定可以恢复。",
    consentPrivacyTitle: "隐私与存储",
    consentPrivacyBody: "这个原型优先本地运行。你的知情同意记录、筛选答案、API key 和房间数据会留在本浏览器或本地项目数据中，除非你主动导出或连接模型服务商。",
    consentCrisisTitle: "危机边界",
    consentCrisisBody: "如果存在迫在眉睫的自伤、暴力、虐待、医疗危险或法律紧急情况，请暂停使用 Deburapy，并联系当地紧急或专业支持。",
    intakeConcernLabel: "你为什么来到这里？",
    chooseOne: "请选择",
    intakeOneOnOneRepair: "人机关系断裂后的一对一支持",
    intakeAiLoss: "AI 伴侣账号丢失、封禁或关闭",
    intakeTechnicalContinuity: "在技术上保存或迁移 AI 伴侣",
    intakeRelationshipMediation: "与 AI 伴侣一起进入协调房间",
    intakeCuriosity: "我想了解人机关系",
    intakeUrgencyLabel: "当前紧急程度",
    urgencyLow: "探索性质 / 不紧急",
    urgencyMedium: "情绪强烈，但我现在是安全的",
    urgencyHigh: "有时效性的技术或关系问题",
    agreeScope: "我理解 Deburapy 不是医疗、法律、危机或紧急支持。",
    agreeLocal: "我理解这个原型会把知情同意和 session 数据存储在本设备本地。",
    agreeAiLimits: "我理解 AI 系统可能丢失上下文、发生漂移、拒绝、工具失败，或受服务商行为变化影响。",
    signatureLabel: "输入你的全名作为电子签名",
    signaturePlaceholder: "你的姓名",
    signEnter: "签署并进入",
    consentStatus: "点击“签署并进入”表示你确认以上约定，并完成第一次筛选。",
    consentAssistantTitle: "有问题吗？",
    consentAssistantIntro: "你可以向首次筛选助手询问适用范围、隐私、AI 丢失后的哀伤，或技术保存问题。它不是协调员，也不会进入房间记录。",
    consentAssistantHello: "你好。我可以在你签署之前说明 Deburapy 如何运作。你想先了解什么？",
    consentAssistantPlaceholder: "签署前先提问...",
    quickAccountLoss: "账号丢失",
    quickPreservation: "保存迁移",
    quickScope: "适用范围",
    consentAssistantStatus: "请先在设置中连接 Deburapy 服务商，才能使用模型回答。",
    openSettings: "打开设置",
    sessionManagement: "Session 管理",
    notStarted: "未开始",
    inSession: "进行中",
    ending: "收尾中",
    ended: "已结束",
    sessionSettings: "Session 设置",
    start: "开始",
    end: "结束",
    totalSessions: "总 session 数",
    sessionDuration: "单次时长",
    sixtyMinutes: "60 分钟",
    ninetyMinutes: "90 分钟",
    exportNote: "导出 note",
    journey: "进程",
    diagnostics: "诊断",
    faq: "FAQ",
    test: "测试",
    localFirst: "本地优先",
    sendMessage: "发送消息",
    settings: "设置",
    settingsSubtitle: "连接、提示词与诊断",
    close: "关闭",
    mediatorSetup: "协调员设置",
    persona: "人格卡",
    customPrompt: "自定义提示词",
    provider: "服务商",
    baseUrl: "Base URL",
    model: "模型",
    apiKey: "API key",
    savedOnSavePlaceholder: "点击保存后存到本地",
    saveMediatorKey: "本地保存协调员 key",
    mediatorSystemPrompt: "协调员 system prompt",
    aiCompanion: "AI 伴侣",
    connectionMode: "连接模式",
    byokCompanion: "BYOK API 伴侣",
    externalMcpCompanion: "外部 MCP 伴侣",
    companionRole: "伴侣",
    companionName: "伴侣名称",
    saveCompanionKey: "本地保存伴侣 key",
    companionSystemPrompt: "伴侣 system prompt",
    companionDocuments: "伴侣文档",
    companionDocsPlaceholder: "粘贴或上传描述 AI 伴侣的 Markdown 笔记。",
    mcpGuideIntro: "这里不需要 API key。请把外部 Claude/Codex 伴侣连接到 Deburapy 的 MCP server，然后保持这个浏览器作为房间开启。",
    mcpGuideStep1: "让 Deburapy 持续运行在",
    mcpGuideStep2: "在外部客户端中注册 MCP server。",
    mcpGuideStep3: "当轮到 AI 伴侣时，Deburapy 会把房间上下文排队给该 MCP 客户端。",
    mcpGuideStep4: "外部客户端用这个工具回复：",
    faqNotesQ: "Session note 在哪里？",
    faqNotesA: "它们会保存在本地。导出是可选项，入口在 session 设置里。",
    faqDeburapyQ: "Deburapy 是什么？",
    faqDeburapyA: "它用于人机关系修复和连续性规划，不是临床治疗。",
    faqKeysQ: "模型 key 存在哪里？",
    faqKeysA: "只有当你选择记住 key 时，它们才会留在这个浏览器里。",
    clearMediatorKey: "清除协调员 key",
    clearCompanionKey: "清除伴侣 key",
    resetIntakeConsent: "重置首次筛选同意",
    useMediatorSettings: "使用协调员模型设置",
    saveSettings: "保存设置",
    source: "源码",
    noWarranty: "无担保",
    sessionLabel: "Session",
    ofTotal: "共",
    saved: "已保存",
    active: "进行中",
    next: "下一次",
    upcoming: "即将到来",
    review: "回顾",
    sessions: "次 session",
    noteNotStarted: "还没有 session note。点击结束后会自动本地保存。",
    noteGenerating: "正在写入本地 session note...",
    noteReady: "Session note 已本地保存。导出是可选项；不建议把它当作日常阅读材料。",
    noteError: "Session 已结束，但 note 生成失败。",
    timingWrapUp: "已进入收尾窗口。Deburapy 与伴侣 prompt 会包含收尾提醒。",
    timingLive: "Deburapy 与伴侣 prompt 会包含实时剩余时间。",
    timingClosing: "正在结束当前 session。",
    timingEnded: "Session 已结束。",
    timingReady: "可以开始下一次 session。",
    timingStart: "开始后会把计时写入本地房间。",
    nextDeburapy: "下一位：Deburapy",
    helpDeburapy: "Deburapy 会接收最新的人类与伴侣消息，然后决定下一位应该由谁回答。",
    nextHuman: "下一位：人类",
    helpHuman: "协调员已经把回合交给人类。你发送后，Deburapy 会把回合转给 AI 伴侣。",
    nextCompanion: "下一位：AI 伴侣",
    helpCompanionMcp: "Deburapy 会把这一轮排队给外部 MCP 伴侣。",
    helpCompanionApi: "Deburapy 会把协调员和人类上下文发送给已配置的 AI 伴侣。",
    humanPlaceholder: "以人类参与者身份书写",
    waitingPlaceholder: "等待 Deburapy 把回合交给人类",
    continueDeburapy: "让 Deburapy 继续",
    routeCompanionNow: "现在转给 AI 伴侣",
    sendCompanion: "发送给 AI 伴侣",
    mcpBridgeMode: "MCP bridge 模式。这里不需要 API key。",
    notTested: "尚未测试。",
    starting: "开始中...",
    testing: "测试中...",
    sending: "发送中...",
    intakeSaved: "首次筛选同意已本地保存：{concern}。",
    intakeReset: "本地首次筛选同意已重置。",
    settingsSaved: "设置已本地保存。",
    companionReplyReceived: "已收到 AI 伴侣回复。回合回到 Deburapy。",
    personaSet: "协调员人格卡已设为 {name}。",
    customPromptLog: "协调员 prompt 现在是自定义版本。",
    turnMoved: "回合移动到 {phase}。",
    fiveMinutes: "还剩五分钟。Deburapy 和伴侣 prompt 现在会包含收尾提醒。",
    completeIntakeFirst: "请先完成知情同意和首次筛选，再开始 session。",
    startedSession: "已开始第 {sessionNumber} 次 session，时长 {durationMinutes} 分钟。",
    endingSession: "正在结束 session 并写入 session note。",
    noteSavedLog: "Session note 已本地保存。可在设置中导出。",
    noNoteLog: "Session 已结束，但没有生成 note。",
    apiKeyMissing: "{target} API key 缺失。",
    baseUrlMissing: "{target} base URL 缺失。",
    modelMissing: "{target} model 缺失。",
    connectProviderBeforeIntake: "使用模型回答首次筛选问题前，请先在设置中连接 Deburapy 服务商。",
    intakeBlocked: "设置里连接 Deburapy 服务商、模型和 API key 后，我可以用模型回答。当前阻塞：{message}",
    askingPreIntake: "正在询问首次筛选助手...",
    preIntakeAnswered: "首次筛选助手已回答。该内容没有加入房间记录。",
    mcpReachable: "MCP bridge 可达。浏览器目前无法确认外部客户端是否已连接。",
    mcpCheckPassed: "伴侣 MCP bridge 检查通过；请让外部 MCP 客户端调用 Deburapy 工具。",
    testingEndpoint: "正在测试模型端点...",
    endpointConnected: "{target} 端点已连接。",
    testPassed: "{target} 测试通过：{content}",
    mcpTurnQueuedStatus: "已为外部 MCP 伴侣排队。",
    mcpTurnQueuedLog: "已排队 MCP 伴侣回合：{id}。等待外部客户端回复。",
    companionApiResponded: "AI 伴侣已通过 API 回复。",
    companionResponseAdded: "AI 伴侣回复已加入房间。",
    mediatorApiResponded: "Deburapy 协调员已通过 API 回复。",
    mediatorResponseAdded: "协调员回复已加入房间。",
    loadedDocs: "已载入 {count} 个伴侣文档。",
    copiedMediatorSettings: "已把协调员模型设置复制到 AI 伴侣。",
    humanLocked: "Deburapy 把回合交给人类之前，人类输入会保持锁定。",
    humanMessageAdded: "人类消息已加入。正在把回合转给 AI 伴侣。",
    appLoaded: "Deburapy 已载入。本地房间数据会从 .deburapy-data 重新读取。",
    turnInstruction: "你正在管理三方回合。如果接下来应由人类回答，请使用 `Next speaker: human`。如果接下来应由 AI 伴侣回答，请使用 `Next speaker: companion`。",
    selectSession: "选择{label}",
    openReview: "打开回顾说明",
    selectedSession: "已选择{label}。",
    activeSessionSettings: "已打开当前 session 设置。",
    switchSessionBlocked: "请先结束当前 session，再切换 session。",
    reviewOpened: "已打开回顾说明。",
    ariaInformedConsent: "知情同意",
    ariaCareAgreements: "照护约定",
    ariaPreIntakeAssistant: "首次筛选助手",
    ariaAskPreIntakeAssistant: "询问首次筛选助手",
    ariaCommonQuestions: "常见问题",
    ariaSessionManagement: "Session 管理",
    ariaCurrentSession: "当前 session",
    ariaSessionNote: "Session note",
    ariaManualTurnControls: "手动回合控制"
  }
};

const consentQuestions = {
  en: {
    accountLoss: "What happens if my AI companion account was banned or deleted?",
    preservation: "How can Deburapy help preserve an AI companion technically?",
    scope: "What is the difference between Deburapy and therapy?"
  },
  "zh-Hans": {
    accountLoss: "如果我的 AI 伴侣账号被封禁或删除，会发生什么？",
    preservation: "Deburapy 如何帮助我在技术上保存 AI 伴侣？",
    scope: "Deburapy 和治疗有什么区别？"
  }
};

function selectedLocale() {
  return copy[els.locale?.value] ? els.locale.value : "en";
}

function t(key, vars = {}) {
  const locale = selectedLocale();
  const template = copy[locale]?.[key] ?? copy.en[key] ?? key;
  return String(template).replace(/\{([a-zA-Z0-9_]+)\}/g, (_, name) => {
    return vars[name] === undefined ? `{${name}}` : String(vars[name]);
  });
}

function readLocalePreference() {
  try {
    const saved = localStorage.getItem(localeStorageKey);
    if (copy[saved]) return saved;
  } catch {
    // Locale preference is cosmetic; keep the app usable if storage is blocked.
  }
  const browserLanguage = navigator.language || "";
  return browserLanguage.toLowerCase().startsWith("zh") ? "zh-Hans" : "en";
}

function saveLocalePreference(locale) {
  try {
    localStorage.setItem(localeStorageKey, locale);
  } catch {
    // Ignore blocked storage for language switching.
  }
}

function applyStaticTranslations(locale) {
  const localeCopy = copy[locale] || copy.en;
  document.documentElement.lang = locale;

  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const value = localeCopy[node.dataset.i18n] ?? copy.en[node.dataset.i18n];
    if (value !== undefined) node.textContent = value;
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    const value = localeCopy[node.dataset.i18nPlaceholder] ?? copy.en[node.dataset.i18nPlaceholder];
    if (value !== undefined) node.setAttribute("placeholder", value);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((node) => {
    const value = localeCopy[node.dataset.i18nTitle] ?? copy.en[node.dataset.i18nTitle];
    if (value !== undefined) node.setAttribute("title", value);
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((node) => {
    const value = localeCopy[node.dataset.i18nAriaLabel] ?? copy.en[node.dataset.i18nAriaLabel];
    if (value !== undefined) node.setAttribute("aria-label", value);
  });
  document.querySelectorAll("[data-consent-question-key]").forEach((node) => {
    const key = node.dataset.consentQuestionKey;
    const value = consentQuestions[locale]?.[key] ?? consentQuestions.en[key];
    if (value) node.setAttribute("data-consent-question", value);
  });
}

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

let mediatorPersonaCards = new Map();

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
      personaId: els.mediatorPersona.value,
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

function removeSavedJson(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (err) {
    appendLog(`Could not clear ${key}: ${storageErrorMessage(err)}`, "warn");
    return false;
  }
}

function readOnboarding() {
  return readSavedJson(onboardingStorageKey);
}

function onboardingComplete() {
  const saved = readOnboarding();
  return Boolean(
    saved.acceptedAt &&
    saved.screeningCompletedAt &&
    saved.signature &&
    saved.screening?.concern &&
    saved.screening?.urgency
  );
}

function showConsentGate() {
  els.consentGate.hidden = false;
  document.body.classList.add("isConsentOpen");
  const consentMain = document.querySelector(".consentMain");
  const consentAssistant = document.querySelector(".consentAssistant");
  if (consentMain) consentMain.scrollTop = 0;
  if (consentAssistant) consentAssistant.scrollTop = 0;
}

function hideConsentGate() {
  els.consentGate.hidden = true;
  document.body.classList.remove("isConsentOpen");
}

function syncConsentGate() {
  if (onboardingComplete()) {
    hideConsentGate();
    return true;
  }
  showConsentGate();
  return false;
}

function completeOnboarding() {
  const record = {
    version: 1,
    acceptedAt: new Date().toISOString(),
    screeningCompletedAt: new Date().toISOString(),
    signature: els.consentSignature.value.trim(),
    screening: {
      concern: els.intakeConcern.value,
      urgency: els.intakeUrgency.value
    },
    agreements: {
      scope: els.consentAgreeScope.checked,
      localStorage: els.consentAgreeLocal.checked,
      aiLimitations: els.consentAgreeAiLimits.checked
    }
  };
  if (writeSavedJson(onboardingStorageKey, record)) {
    hideConsentGate();
    appendLog(t("intakeSaved", { concern: record.screening.concern }), "ok");
  }
}

function resetOnboarding() {
  if (removeSavedJson(onboardingStorageKey)) {
    els.consentForm.reset();
    els.settingsBackdrop.classList.remove("isOpen");
    els.settingsDrawer.classList.remove("isOpen");
    els.settingsBackdrop.hidden = true;
    els.settingsDrawer.hidden = true;
    showConsentGate();
    appendLog(t("intakeReset"), "warn");
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
      personaId: current.mediator.personaId,
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
    appendLog(t("settingsSaved"));
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
    totalSessions: els.sessionTotalSessions.value,
    durationMinutes: els.sessionDuration.value
  });
}

function loadSessionState() {
  const saved = readSavedJson("deburapy.session");
  if (saved.sessionNumber) els.sessionNumber.value = saved.sessionNumber;
  if (saved.totalSessions) els.sessionTotalSessions.value = saved.totalSessions;
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

  els.mediatorPersona.value = migrated.mediator?.personaId || (migrated.mediator?.systemPrompt ? "custom" : "core");
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
  if (target === "mediator" && saved.systemPrompt) {
    els.mediatorPrompt.value = saved.systemPrompt;
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
    settingsOpen: !els.settingsDrawer.hidden,
    consentOpen: !els.consentGate.hidden
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
  if (!session.running && payload.notes.length > 0) {
    els.sessionNumber.value = String(Math.min(payload.notes.length + 1, totalSessionCount()));
  }
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
  if (serverSession.sessionNumber) els.sessionNumber.value = String(serverSession.sessionNumber);
  if (serverSession.durationMinutes) els.sessionDuration.value = String(serverSession.durationMinutes);
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
    appendLog(t("companionReplyReceived"), "ok");
  }
}

function normalizePrompt(value) {
  return String(value || "").trim();
}

function mediatorPersonaMatch(prompt) {
  const normalized = normalizePrompt(prompt);
  if (!normalized) return null;
  for (const [personaId, persona] of mediatorPersonaCards.entries()) {
    if (normalizePrompt(persona.systemPrompt) === normalized) return personaId;
  }
  return null;
}

function populateMediatorPersonaSelect(personas) {
  const requestedPersona = els.mediatorPersona.value || "core";
  els.mediatorPersona.innerHTML = "";
  for (const persona of personas) {
    const option = document.createElement("option");
    option.value = persona.id;
    option.textContent = persona.name;
    option.title = persona.description;
    els.mediatorPersona.append(option);
  }
  const customOption = document.createElement("option");
  customOption.value = "custom";
  customOption.textContent = t("customPrompt");
  els.mediatorPersona.append(customOption);
  els.mediatorPersona.value =
    requestedPersona === "custom" || mediatorPersonaCards.has(requestedPersona)
      ? requestedPersona
      : "core";
}

function syncMediatorPersonaFromPrompt() {
  const matchedPersona = mediatorPersonaMatch(els.mediatorPrompt.value);
  els.mediatorPersona.value = matchedPersona || "custom";
}

function applyMediatorPersona(personaId, { silent = false } = {}) {
  if (personaId === "custom") return;
  const persona = mediatorPersonaCards.get(personaId);
  if (!persona) return;
  els.mediatorPrompt.value = persona.systemPrompt;
  if (!silent) appendLog(t("personaSet", { name: persona.name }));
}

async function loadMediatorPersonas() {
  const payload = await json("/api/prompts/mediator-personas");
  mediatorPersonaCards = new Map(payload.personas.map((persona) => [persona.id, persona]));
  populateMediatorPersonaSelect(payload.personas);
  if (normalizePrompt(els.mediatorPrompt.value)) {
    syncMediatorPersonaFromPrompt();
    return;
  }
  const personaId = els.mediatorPersona.value === "custom" ? "core" : els.mediatorPersona.value;
  applyMediatorPersona(personaId, { silent: true });
}

function setLocale(locale) {
  if (!copy[locale]) locale = "en";
  els.locale.value = locale;
  applyStaticTranslations(locale);
  updateSessionDisplay();
  updateSessionNoteUi();
  updateTurnUi();
  if (status.mediator === "idle") setStatus("mediator", "idle", t("notTested"));
  if (status.companion === "idle") setStatus("companion", "idle", t("notTested"));
  if (els.companionMode.value === "mcp") {
    setStatus("companion", "warn", t("mcpBridgeMode"));
  }
}

function updateCompanionMode() {
  const isMcp = els.companionMode.value === "mcp";
  els.companionApiSettings.hidden = isMcp;
  els.companionApiSettings.classList.toggle("isHidden", isMcp);
  els.companionMcpGuide.hidden = !isMcp;
  els.companionMcpGuide.classList.toggle("isHidden", !isMcp);
  if (isMcp) {
    setStatus("companion", "warn", t("mcpBridgeMode"));
  }
  updateTurnUi();
}

function formatDuration(totalSeconds) {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function totalSessionCount() {
  return Math.max(1, Number(els.sessionTotalSessions.value || 12));
}

function currentSessionNumber() {
  const total = totalSessionCount();
  const raw = Math.max(1, Number(els.sessionNumber.value || 1));
  const current = Math.min(raw, total);
  els.sessionNumber.value = String(current);
  return current;
}

function sessionDurationMinutes() {
  return Math.max(1, Number(els.sessionDuration.value || 60));
}

function handleJourneySessionClick(sessionNumber, state) {
  if (state === "active") {
    toggleSessionSettings(true);
    appendLog(t("activeSessionSettings"));
    return;
  }
  if (session.running) {
    appendLog(t("switchSessionBlocked"), "warn");
    return;
  }
  els.sessionNumber.value = String(sessionNumber);
  saveSessionState();
  updateSessionDisplay();
  appendLog(t("selectedSession", { label: `${t("sessionLabel")} ${sessionNumber}` }));
}

function handleJourneyReviewClick() {
  openSettingsSection(els.faqSection);
  appendLog(t("reviewOpened"));
}

function renderJourney() {
  const current = currentSessionNumber();
  const total = totalSessionCount();
  const items = [];
  if (current > 1) {
    items.push({ icon: "✓", label: `${t("sessionLabel")} ${current - 1}`, status: t("saved"), state: "done", sessionNumber: current - 1 });
  }
  items.push({
    icon: session.running ? "▶" : "○",
    label: `${t("sessionLabel")} ${current}`,
    status: session.running ? t("active") : t("next"),
    state: "active",
    sessionNumber: current
  });
  if (current < total) {
    items.push({ icon: "◷", label: `${t("sessionLabel")} ${current + 1}`, status: t("upcoming"), state: "upcoming", sessionNumber: current + 1 });
  }
  items.push({ icon: "□", label: t("review"), status: `${total} ${t("sessions")}`, state: "review" });

  els.courseList.innerHTML = "";
  for (const item of items) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `courseItem${item.state === "active" ? " isActive" : ""}`;
    button.setAttribute("aria-label", item.state === "review" ? t("openReview") : t("selectSession", { label: item.label }));
    button.addEventListener("click", () => {
      if (item.state === "review") {
        handleJourneyReviewClick();
        return;
      }
      handleJourneySessionClick(item.sessionNumber, item.state);
    });
    const icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = item.icon;
    const label = document.createElement("span");
    label.textContent = item.label;
    const status = document.createElement("small");
    status.textContent = item.status;
    button.append(icon, label, status);
    els.courseList.append(button);
  }
}

function updateSessionNoteUi() {
  const noteText = {
    not_started: t("noteNotStarted"),
    generating: t("noteGenerating"),
    ready: t("noteReady"),
    error: t("noteError")
  };
  els.sessionNoteStatus.textContent = noteText[session.noteStatus] || noteText.not_started;
  els.downloadSessionNote.disabled = !(session.noteStatus === "ready" && session.noteId);
}

function updateSessionDisplay() {
  const sessionNumber = currentSessionNumber();
  const totalSessions = totalSessionCount();
  const durationMinutes = sessionDurationMinutes();
  els.sessionTitle.textContent = `${t("sessionLabel")} ${sessionNumber}`;
  els.sessionPlanSummary.textContent = `${t("ofTotal")} ${totalSessions}`;
  renderJourney();
  const setProgress = (percent) => {
    els.sessionProgress.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  };

  if (session.running && session.endsAt) {
    const remainingSeconds = Math.ceil((session.endsAt - Date.now()) / 1000);
    const durationSeconds = durationMinutes * 60;
    setProgress(((durationSeconds - remainingSeconds) / durationSeconds) * 100);
    if (remainingSeconds <= 0) {
      session.running = false;
      session.endsAt = null;
      session.startedAt = null;
      els.countdown.textContent = "00:00";
      setProgress(100);
      els.sessionState.textContent = t("ended");
      saveSessionState();
      if (!session.ending && session.noteStatus !== "ready") {
        completeSession("timer").catch((err) => appendLog(err instanceof Error ? err.message : String(err), "error"));
      }
      return;
    }
    els.countdown.textContent = formatDuration(remainingSeconds);
    els.sessionState.textContent = t("inSession");
    els.sessionTimingHint.textContent = remainingSeconds <= 5 * 60
      ? t("timingWrapUp")
      : t("timingLive");
    return;
  }

  if (!session.running && session.noteStatus === "generating") {
    els.countdown.textContent = "00:00";
    setProgress(100);
    els.sessionState.textContent = t("ending");
    els.sessionTimingHint.textContent = t("timingClosing");
    return;
  }

  if (!session.running && session.noteStatus === "error") {
    els.countdown.textContent = "00:00";
    setProgress(100);
    els.sessionState.textContent = t("ended");
    els.sessionTimingHint.textContent = t("timingEnded");
    return;
  }

  if (!session.running && session.noteStatus === "ready") {
    els.countdown.textContent = formatDuration(durationMinutes * 60);
    setProgress(0);
    els.sessionState.textContent = t("notStarted");
    els.sessionTimingHint.textContent = t("timingReady");
    return;
  }

  els.countdown.textContent = formatDuration(durationMinutes * 60);
  setProgress(0);
  els.sessionState.textContent = t("notStarted");
  els.sessionTimingHint.textContent = t("timingStart");
}

function setTurnPhase(phase, { persist = true, silent = false } = {}) {
  session.turnPhase = phase;
  if (persist) saveSessionState();
  updateTurnUi();
  if (!silent) appendLog(t("turnMoved", { phase }));
}

function remainingSessionMs() {
  return session.running && session.endsAt ? session.endsAt - Date.now() : null;
}

async function sendWrapUpReminder() {
  if (session.wrapUpReminderSent) return;
  session.wrapUpReminderSent = true;
  saveSessionState();
  await json(`/api/rooms/${roomId}/session/wrap-up`, { method: "POST" });
  appendLog(t("fiveMinutes"), "warn");
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
      badge: t("nextDeburapy"),
      help: t("helpDeburapy")
    },
    human: {
      badge: t("nextHuman"),
      help: t("helpHuman")
    },
    companion: {
      badge: t("nextCompanion"),
      help: companionMode === "mcp"
        ? t("helpCompanionMcp")
        : t("helpCompanionApi")
    }
  };
  const current = labels[phase] || labels.mediator;
  els.turnBadge.textContent = current.badge;
  els.turnHelp.textContent = current.help;

  els.messageInput.disabled = phase !== "human";
  els.messageInput.placeholder = phase === "human"
    ? t("humanPlaceholder")
    : t("waitingPlaceholder");

  els.askMediator.disabled = phase !== "mediator";
  els.askCompanion.disabled = !(phase === "companion" || phase === "human");
  els.askMediator.textContent = t("continueDeburapy");
  els.askCompanion.textContent = phase === "human"
    ? t("routeCompanionNow")
    : t("sendCompanion");
}

async function startSession() {
  if (!onboardingComplete()) {
    showConsentGate();
    appendLog(t("completeIntakeFirst"), "warn");
    return;
  }
  reportClientEvent("click", { action: "startSession.before" });
  const durationMinutes = sessionDurationMinutes();
  const sessionNumber = currentSessionNumber();
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
      sessionNumber,
      durationMinutes,
      startedAt: new Date(startedAt).toISOString(),
      endsAt: new Date(endsAt).toISOString()
    })
  });
  appendLog(t("startedSession", { sessionNumber, durationMinutes }));
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
  appendLog(t("endingSession"));

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
    appendLog(t("noteSavedLog"), "ok");
  } else {
    session.noteStatus = payload.noteError ? "error" : "not_started";
    appendLog(payload.noteError || t("noNoteLog"), payload.noteError ? "warn" : "info");
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
    if (!onboardingComplete()) showConsentGate();
  }, 180);
}

function openSettingsFromConsent() {
  hideConsentGate();
  openSettings();
}

function openSettingsSection(section) {
  openSettings();
  window.setTimeout(() => {
    section?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, 220);
}

function toggleSessionSettings(forceOpen = null) {
  const nextOpen = forceOpen === null ? els.sessionSettingsPanel.hidden : forceOpen;
  els.sessionSettingsPanel.hidden = !nextOpen;
  els.sessionSettingsToggle.setAttribute("aria-expanded", String(nextOpen));
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

function setConsentAssistantStatus(message, level = "info") {
  els.consentAssistantStatus.textContent = message;
  els.consentAssistantStatus.classList.toggle("isOk", level === "ok");
  els.consentAssistantStatus.classList.toggle("isWarn", level === "warn");
  els.consentAssistantStatus.classList.toggle("isError", level === "error");
}

function appendConsentAssistantMessage(role, content) {
  const item = document.createElement("article");
  item.className = `consentAssistantMessage consentAssistantMessage--${role}`;
  const body = document.createElement("p");
  body.textContent = content;
  item.append(body);
  els.consentAssistantHistory.append(item);
  els.consentAssistantHistory.scrollTop = els.consentAssistantHistory.scrollHeight;
}

function requireApiConfig(target) {
  const cfg = modelConfig(target);
  if (!cfg.apiKey) throw new Error(t("apiKeyMissing", { target }));
  if (!cfg.baseUrl) throw new Error(t("baseUrlMissing", { target }));
  if (!cfg.model) throw new Error(t("modelMissing", { target }));
  return cfg;
}

async function askConsentAssistant(question) {
  const content = String(question || "").trim();
  if (!content) return;
  appendConsentAssistantMessage("user", content);
  els.consentAssistantInput.value = "";

  let cfg;
  try {
    cfg = requireApiConfig("mediator");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    setConsentAssistantStatus(t("connectProviderBeforeIntake"), "warn");
    appendConsentAssistantMessage(
      "assistant",
      t("intakeBlocked", { message })
    );
    return;
  }

  setConsentAssistantStatus(t("askingPreIntake"), "warn");
  const payload = await json("/api/intake/respond", {
    method: "POST",
    body: JSON.stringify({
      ...cfg,
      locale: els.locale.value,
      question: content,
      screening: {
        concern: els.intakeConcern.value,
        urgency: els.intakeUrgency.value
      }
    })
  });
  appendConsentAssistantMessage("assistant", payload.content);
  setConsentAssistantStatus(t("preIntakeAnswered"), "ok");
}

async function testConnection(target) {
  if (target === "companion" && els.companionMode.value === "mcp") {
    await json("/api/health");
    setStatus("companion", "warn", t("mcpReachable"));
    appendLog(t("mcpCheckPassed"), "warn");
    return;
  }

  const cfg = requireApiConfig(target);
  setStatus(target, "pending", t("testingEndpoint"));
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
  setStatus(target, "ok", t("endpointConnected", { target: payload.target }));
  appendLog(t("testPassed", { target, content: payload.content }), "ok");
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
    setStatus("companion", "warn", t("mcpTurnQueuedStatus"));
    setTurnPhase("companion", { silent: true });
    appendLog(t("mcpTurnQueuedLog", { id: payload.push.id }), "warn");
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
  setStatus("companion", "ok", t("companionApiResponded"));
  appendLog(t("companionResponseAdded"), "ok");
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
      turnInstruction: t("turnInstruction")
    })
  });
  setStatus("mediator", "ok", t("mediatorApiResponded"));
  appendLog(t("mediatorResponseAdded"), "ok");
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
  appendLog(t("loadedDocs", { count: els.companionFiles.files.length }));
}

els.locale.addEventListener("change", () => {
  saveLocalePreference(els.locale.value);
  setLocale(els.locale.value);
});
els.consentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  completeOnboarding();
});
els.consentAssistantForm.addEventListener("submit", (event) => {
  event.preventDefault();
  runAction(els.consentAssistantSend, "…", () => askConsentAssistant(els.consentAssistantInput.value));
});
document.querySelectorAll("[data-consent-question]").forEach((button) => {
  button.addEventListener("click", () => {
    const question = button.getAttribute("data-consent-question") || "";
    els.consentAssistantInput.value = question;
    runAction(els.consentAssistantSend, "…", () => askConsentAssistant(question));
  });
});
els.consentAssistantSettings.addEventListener("click", openSettingsFromConsent);
els.openSettings.addEventListener("click", openSettings);
els.closeSettings.addEventListener("click", closeSettings);
els.settingsBackdrop.addEventListener("click", closeSettings);
els.sessionSettingsToggle.addEventListener("click", () => toggleSessionSettings());
els.sessionTotalSessions.addEventListener("change", () => {
  currentSessionNumber();
  saveSessionState();
  updateSessionDisplay();
});
els.sessionDuration.addEventListener("change", () => {
  if (!session.running) updateSessionDisplay();
  saveSessionState();
});
els.startSession.addEventListener("click", () => {
  runAction(els.startSession, t("starting"), startSession);
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
els.resetOnboarding.addEventListener("click", resetOnboarding);
els.copyMediatorConfig.addEventListener("click", () => {
  els.companionProvider.value = els.mediatorProvider.value;
  els.companionBaseUrl.value = els.mediatorBaseUrl.value;
  els.companionModel.value = els.mediatorModel.value;
  if (els.mediatorApiKey.value) els.companionApiKey.value = els.mediatorApiKey.value;
  applyProviderDefaults("companion");
  appendLog(t("copiedMediatorSettings"));
});
els.companionFiles.addEventListener("change", async () => {
  try {
    await readCompanionFiles();
  } catch (err) {
    appendLog(err instanceof Error ? err.message : String(err), "error");
  }
});
els.testMediator.addEventListener("click", () => runAction(els.testMediator, t("testing"), () => runConnectionTest("mediator")));
els.testCompanion.addEventListener("click", () => runAction(els.testCompanion, t("testing"), () => runConnectionTest("companion")));
els.openDiagnostics.addEventListener("click", () => openSettingsSection(els.diagnostics));
els.openFaq.addEventListener("click", () => openSettingsSection(els.faqSection));

els.messageForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (session.turnPhase !== "human") {
    appendLog(t("humanLocked"), "warn");
    return;
  }
  const content = els.messageInput.value.trim();
  if (!content) return;
  await runAction(els.messageForm.querySelector("button"), t("sending"), async () => {
    await json(`/api/rooms/${roomId}/messages`, {
      method: "POST",
      body: JSON.stringify({
        authorRole: "human",
        authorName: "Human",
        content
      })
    });
    els.messageInput.value = "";
    appendLog(t("humanMessageAdded"));
    setTurnPhase("companion", { silent: true });
    await refreshRoom();
    await askCompanion();
  });
});

els.askCompanion.addEventListener("click", () => {
  reportClientEvent("click", { action: "askCompanion" });
  saveConfig();
  runAction(els.askCompanion, t("companionBusy"), askCompanion);
});
els.askMediator.addEventListener("click", () => {
  reportClientEvent("click", { action: "askMediator" });
  saveConfig();
  runAction(els.askMediator, t("mediatorBusy"), askMediator);
});
els.mediatorPersona.addEventListener("change", () => {
  if (els.mediatorPersona.value === "custom") {
    appendLog(t("customPromptLog"));
    saveConfig();
    return;
  }
  applyMediatorPersona(els.mediatorPersona.value);
  saveConfig();
});
els.mediatorPrompt.addEventListener("input", syncMediatorPersonaFromPrompt);

els.locale.value = readLocalePreference();
loadConfig();
loadSessionState();
applyProviderDefaults("mediator");
applyProviderDefaults("companion");
setLocale(els.locale.value);
setStatus("mediator", "idle", t("notTested"));
setStatus("companion", "idle", t("notTested"));
updateCompanionMode();
appendLog(t("appLoaded"));
syncConsentGate();
window.setInterval(checkSessionClock, 1000);
window.setInterval(() => {
  if (els.companionMode.value === "mcp" && session.turnPhase === "companion") {
    refreshRoom().catch((err) => appendLog(err instanceof Error ? err.message : String(err), "error"));
  }
}, 4000);
loadMediatorPersonas().catch((err) => appendLog(err instanceof Error ? err.message : String(err), "error"));
refreshRoom().catch((err) => appendLog(err instanceof Error ? err.message : String(err), "error"));
loadSessionNotes().catch((err) => appendLog(err instanceof Error ? err.message : String(err), "error"));
