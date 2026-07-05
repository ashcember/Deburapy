import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildChatCompletionsRequest,
  generateChatCompletion,
  ProviderRequestError,
  providerDefaults
} from "../src/core/openai-compatible.mjs";
import {
  buildSessionClockBlock,
  buildSessionNotePrompt,
  buildMediatorUserPrompt,
  buildCompanionUserPrompt,
  defaultCompanionPrompt,
  loadMediatorPrompt,
  loadMediatorPersonas,
  parseMediatorTurn
} from "../src/core/prompt.mjs";
import { DeburapyStore } from "../src/core/store.mjs";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
const readmeZh = await readFile(new URL("../README.zh-CN.md", import.meta.url), "utf8");
const localTesting = await readFile(new URL("../docs/local-testing.md", import.meta.url), "utf8");
const localTestingZh = await readFile(new URL("../docs/local-testing.zh-CN.md", import.meta.url), "utf8");
const configuration = await readFile(new URL("../docs/configuration.md", import.meta.url), "utf8");
const configurationZh = await readFile(new URL("../docs/configuration.zh-CN.md", import.meta.url), "utf8");
const mcpClients = await readFile(new URL("../docs/mcp-clients.md", import.meta.url), "utf8");
const mcpClientsZh = await readFile(new URL("../docs/mcp-clients.zh-CN.md", import.meta.url), "utf8");
const thirdPartyNotices = await readFile(new URL("../docs/third-party-notices.md", import.meta.url), "utf8");
const thirdPartyNoticesZh = await readFile(new URL("../docs/third-party-notices.zh-CN.md", import.meta.url), "utf8");
const security = await readFile(new URL("../SECURITY.md", import.meta.url), "utf8");
const contributing = await readFile(new URL("../CONTRIBUTING.md", import.meta.url), "utf8");
const issueConfig = await readFile(new URL("../.github/ISSUE_TEMPLATE/config.yml", import.meta.url), "utf8");
const bugIssueTemplate = await readFile(new URL("../.github/ISSUE_TEMPLATE/bug_report.yml", import.meta.url), "utf8");
const skillIssueTemplate = await readFile(new URL("../.github/ISSUE_TEMPLATE/skill_proposal.yml", import.meta.url), "utf8");
const pluginIssueTemplate = await readFile(new URL("../.github/ISSUE_TEMPLATE/plugin_module_proposal.yml", import.meta.url), "utf8");
const envExample = await readFile(new URL("../.env.example", import.meta.url), "utf8");
const skillsReadme = await readFile(new URL("../skills/README.md", import.meta.url), "utf8");
const skillsReadmeZh = await readFile(new URL("../skills/README.zh-CN.md", import.meta.url), "utf8");
const mediatorSkill = await readFile(new URL("../skills/mediator/memory-rupture-mediation.md", import.meta.url), "utf8");
const accountLossTransitionSkill = await readFile(new URL("../skills/mediator/account-loss-transition-mediation.zh-CN.md", import.meta.url), "utf8");
const companionRepairSkill = await readFile(new URL("../skills/companion-repair/account-loss-continuity.md", import.meta.url), "utf8");
const artifactWriterSkill = await readFile(new URL("../skills/artifact-writers/relationship-case-note-writer.md", import.meta.url), "utf8");
const demoAccountLossDialogue = await readFile(new URL("../examples/zh-CN/demo-account-loss-dialogue.md", import.meta.url), "utf8");
const demoAccountLossSessionNote = await readFile(new URL("../examples/zh-CN/demo-account-loss-session-note.md", import.meta.url), "utf8");
const prompt = await readFile(new URL("../prompts/deburapy-mediator.system.md", import.meta.url), "utf8");
const indexHtml = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
const appJs = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
const visualCheck = await readFile(new URL("../scripts/visual-check.mjs", import.meta.url), "utf8");
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const vercelJson = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
const zhDocs = await Promise.all([
  "../docs/architecture.zh-CN.md",
  "../docs/session-architecture.zh-CN.md",
  "../docs/mcp-clients.zh-CN.md",
  "../docs/deburapy_architecture_guide.zh-CN.md",
  "../docs/configuration.zh-CN.md"
].map((path) => readFile(new URL(path, import.meta.url), "utf8")));

assert.match(readme, /\*\*English\*\* \| \[简体中文\]\(\.\/README\.zh-CN\.md\)/);
assert.match(readme, /## For Users/);
assert.match(readme, /## For Contributors/);
assert.match(readme, /## Alpha Limits/);
assert.match(readme, /### Version 2 Direction/);
assert.match(readme, /How Do I Install This If I Am Not Technical\?/);
assert.match(readme, /https:\/\/github\.com\/ashcember\/Deburapy/);
assert.match(readme, /Please help me install and run this local-first app/);
assert.match(readme, /docs\/mcp-clients\.md/);
assert.match(readme, /CONTRIBUTING\.md/);
assert.match(readme, /SECURITY\.md/);
assert.match(readme, /npm install/);
assert.match(readme, /JSON plugins/);
assert.match(readme, /skills\/templates/);
assert.match(readme, /docs\/local-testing\.md/);
assert.match(readme, /skills\/README\.md/);
assert.match(readme, /demo-account-loss-dialogue\.md/);
assert.match(readme, /demo-account-loss-session-note\.md/);
assert.match(readme, /account-loss-transition-mediation\.zh-CN\.md/);
assert.match(readme, /docs\/configuration\.md/);
assert.match(readme, /docs\/third-party-notices\.md/);
assert.doesNotMatch(readme, /planned session/i);
assert.doesNotMatch(readme, /<details>/);
assert.doesNotMatch(readme, /简体中文 README/);
assert.doesNotMatch(readme, /Smoke test through the UI/);
assert.match(readmeZh, /\[English\]\(\.\/README\.md\) \| \*\*简体中文\*\*/);
assert.match(readmeZh, /## 给使用者/);
assert.match(readmeZh, /## 给贡献者/);
assert.match(readmeZh, /## Alpha 限制/);
assert.match(readmeZh, /### 第二版方向/);
assert.match(readmeZh, /我不懂技术，要怎么安装？/);
assert.match(readmeZh, /https:\/\/github\.com\/ashcember\/Deburapy/);
assert.match(readmeZh, /请帮我在电脑上安装并运行这个本地优先 app/);
assert.match(readmeZh, /docs\/mcp-clients\.zh-CN\.md/);
assert.match(readmeZh, /CONTRIBUTING\.md/);
assert.match(readmeZh, /SECURITY\.md/);
assert.match(readmeZh, /npm install/);
assert.match(readmeZh, /JSON plugins/);
assert.match(readmeZh, /skills\/templates/);
assert.match(readmeZh, /docs\/local-testing\.zh-CN\.md/);
assert.match(readmeZh, /skills\/README\.zh-CN\.md/);
assert.match(readmeZh, /demo-account-loss-dialogue\.md/);
assert.match(readmeZh, /demo-account-loss-session-note\.md/);
assert.match(readmeZh, /account-loss-transition-mediation\.zh-CN\.md/);
assert.match(readmeZh, /docs\/configuration\.zh-CN\.md/);
assert.match(readmeZh, /docs\/third-party-notices\.zh-CN\.md/);
assert.doesNotMatch(readmeZh, /规划中的 session/);
assert.doesNotMatch(readmeZh, /## UI 冒烟测试/);
assert.match(readmeZh, /Deburapy 人机关系协调员/);
assert.match(readmeZh, /知情同意/);
assert.match(readmeZh, /本地优先/);
assert.match(localTesting, /## UI Smoke Check/);
assert.match(localTesting, /## Visual Screenshot Check/);
assert.match(localTesting, /npm run visual:check/);
assert.match(localTesting, /## API Smoke Check/);
assert.match(localTesting, /## MCP Check/);
assert.match(localTestingZh, /## UI 冒烟检查/);
assert.match(localTestingZh, /## 视觉截图检查/);
assert.match(localTestingZh, /npm run visual:check/);
assert.match(localTestingZh, /## API 冒烟检查/);
assert.match(localTestingZh, /## MCP 检查/);
assert.match(thirdPartyNotices, /Lucide Icons/);
assert.match(thirdPartyNotices, /ISC License/);
assert.match(thirdPartyNotices, /UI Reference Artifacts/);
assert.match(thirdPartyNotices, /ui-reference/);
assert.match(thirdPartyNoticesZh, /第三方声明/);
assert.match(thirdPartyNoticesZh, /Lucide Icons/);
assert.match(thirdPartyNoticesZh, /UI 参考 artifact/);
assert.match(mcpClients, /Ask Your AI To Install/);
assert.match(mcpClients, /https:\/\/github\.com\/ashcember\/Deburapy/);
assert.match(mcpClients, /deburapy_send_channel_reply/);
assert.match(mcpClientsZh, /让你的 AI 帮你安装/);
assert.match(mcpClientsZh, /https:\/\/github\.com\/ashcember\/Deburapy/);
assert.match(mcpClientsZh, /deburapy_send_channel_reply/);
assert.match(security, /Security Policy/);
assert.match(security, /Do not bind Deburapy outside loopback/);
assert.match(security, /Do not paste or upload/);
assert.match(contributing, /Contributing to Deburapy/);
assert.match(contributing, /Pull Request Checklist/);
assert.match(contributing, /npm run visual:check/);
assert.match(issueConfig, /blank_issues_enabled: false/);
assert.match(issueConfig, /security\/advisories\/new/);
assert.match(bugIssueTemplate, /Do not include API keys/);
assert.match(skillIssueTemplate, /Skill proposal/);
assert.match(skillIssueTemplate, /private relationship data/);
assert.match(pluginIssueTemplate, /Plugin or module proposal/);
assert.match(pluginIssueTemplate, /provider preset/);
assert.equal(packageJson.scripts["visual:check"], "node scripts/visual-check.mjs");
assert.equal(packageJson.devDependencies.playwright, "1.60.0");
assert.match(visualCheck, /PLAYWRIGHT_PACKAGE_PATH/);
assert.match(visualCheck, /deburapy\.onboarding\.v1/);
assert.match(visualCheck, /exportTranscript/);
assert.match(visualCheck, /settingsStorage/);
assert.match(visualCheck, /mcpGuide/);
assert.match(visualCheck, /copyMcpInstallPrompt/);
assert.match(visualCheck, /README install guidance/);
assert.match(visualCheck, /room-dark\.png/);
assert.match(visualCheck, /deburapy\.theme/);
assert.match(visualCheck, /mediatorDotLabel/);
assert.match(visualCheck, /room-mobile-session\.png/);
assert.match(visualCheck, /openSessionRail/);
for (const envName of [
  "DEBURAPY_HOST",
  "DEBURAPY_PORT",
  "DEBURAPY_DATA_DIR",
  "DEBURAPY_ALLOW_UNSAFE_BIND",
  "DEBURAPY_ENABLE_HOSTED_DEMO",
  "DEBURAPY_HOSTED_DEMO_GOOGLE_AI_STUDIO_API_KEY",
  "DEBURAPY_HOSTED_DEMO_MODEL",
  "DEBURAPY_HOSTED_DEMO_BASE_URL",
  "DEBURAPY_HOSTED_DEMO_RATE_LIMIT_PER_MINUTE",
  "DEBURAPY_URL",
  "DEBURAPY_ROOM_ID",
  "DEBURAPY_PARTICIPANT_ID",
  "DEBURAPY_CLAUDE_CHANNEL_NOTIFICATIONS",
  "DEBURAPY_POLL_MS"
]) {
  assert.match(configuration, new RegExp(`\\| \`${envName}\` \\|`));
  assert.match(configurationZh, new RegExp(`\\| \`${envName}\` \\|`));
  assert.match(envExample, new RegExp(`^${envName}=`, "m"));
}
assert.match(skillsReadme, /Relationship Layer/);
assert.match(skillsReadme, /Runtime Layer/);
assert.match(skillsReadme, /Repair Artifacts/);
assert.match(skillsReadme, /account-loss-transition-mediation\.zh-CN\.md/);
assert.match(skillsReadme, /examples\/zh-CN/);
assert.match(skillsReadmeZh, /Relationship Layer/);
assert.match(skillsReadmeZh, /Runtime Layer/);
assert.match(skillsReadmeZh, /account-loss-transition-mediation\.zh-CN\.md/);
assert.match(skillsReadmeZh, /examples\/zh-CN/);
assert.match(mediatorSkill, /Memory Rupture/);
assert.match(accountLossTransitionSkill, /账号丢失与迁移协调/);
assert.match(accountLossTransitionSkill, /Trigger/);
assert.match(accountLossTransitionSkill, /Relationship Layer/);
assert.match(accountLossTransitionSkill, /Runtime Layer/);
assert.match(accountLossTransitionSkill, /Repair Artifacts/);
assert.match(accountLossTransitionSkill, /Safety Boundary/);
assert.match(accountLossTransitionSkill, /不要要求用户提供 API key/);
assert.match(accountLossTransitionSkill, /不要把这个 skill 用来承诺账号、模型、记忆或伴侣一定可以恢复/);
assert.match(companionRepairSkill, /Account Loss Continuity/);
assert.match(artifactWriterSkill, /Relationship Case Note/);
assert.match(demoAccountLossDialogue, /展示用虚构示例/);
assert.match(demoAccountLossDialogue, /人类参与者：/);
assert.match(demoAccountLossDialogue, /AI 伴侣：/);
assert.match(demoAccountLossDialogue, /Deburapy：/);
assert.match(demoAccountLossDialogue, /relationship case note/);
assert.match(demoAccountLossDialogue, /migration packet checklist/);
assert.doesNotMatch(demoAccountLossDialogue, /API key|登录密码|chain-of-thought|未脱敏日志/);
assert.match(demoAccountLossSessionNote, /展示用虚构 note/);
assert.match(demoAccountLossSessionNote, /What Happened/);
assert.match(demoAccountLossSessionNote, /AI Runtime Factors/);
assert.match(demoAccountLossSessionNote, /Agreements For Next Time/);
assert.match(demoAccountLossSessionNote, /Boundary Or Safety Flags/);
assert.doesNotMatch(demoAccountLossSessionNote, /API key|登录密码|chain-of-thought|未脱敏日志/);
for (const doc of zhDocs) {
  assert.match(doc, /\[English\]/);
  assert.match(doc, /Deburapy/);
}
assert.match(zhDocs[0], /Deburapy 架构/);
assert.match(zhDocs[1], /Session 架构/);
assert.match(zhDocs[2], /MCP Client 说明/);
assert.match(zhDocs[3], /核心定位/);
assert.match(zhDocs[4], /配置/);
assert.match(prompt, /not a therapist/i);
assert.match(prompt, /AI-human relationship/i);
assert.match(prompt, /人机关系协调员/);
assert.doesNotMatch(prompt, /single named deployment/i);
assert.doesNotMatch(prompt, /private chat platform/i);
assert.match(appJs, /rememberApiKey/);
assert.match(appJs, /themeStorageKey/);
assert.match(appJs, /themeToggle:\s*document\.querySelector\("#themeToggle"\)/);
assert.match(appJs, /function setTheme/);
assert.match(appJs, /function toggleTheme/);
assert.doesNotMatch(appJs, /function buildMcpInstallPrompt/);
assert.doesNotMatch(appJs, /copyMcpInstallPrompt/);
assert.doesNotMatch(appJs, /navigator\.clipboard/);
assert.doesNotMatch(appJs, /document\.execCommand\("copy"\)/);
assert.match(appJs, /deburapy\.theme/);
assert.match(appJs, /google-ai-studio/);
assert.match(appJs, /hostedDemo/);
assert.match(appJs, /\/api\/demo-config/);
assert.match(appJs, /useHostedDemoKey/);
assert.match(appJs, /Hosted demo key is managed on the server/);
assert.match(appJs, /useOwnMediatorKey/);
assert.match(appJs, /hostedDemoRateLimited/);
assert.match(appJs, /mediatorKeyModeStorageKey/);
assert.match(appJs, /statusCode === 429/);
assert.doesNotMatch(appJs, /__DEBURAPY_HOSTED_DEMO_KEY__/);
assert.match(appJs, /testCompanion:\s*document\.querySelector\("#testCompanion"\)/);
assert.match(appJs, /companionDot:\s*document\.querySelector\("#companionDot"\)/);
assert.match(appJs, /companionStatus:\s*document\.querySelector\("#companionStatus"\)/);
assert.match(appJs, /async function startSession/);
assert.match(appJs, /await askMediator\(\)/);
assert.match(appJs, /\/session\/start/);
assert.match(appJs, /\/session\/end/);
assert.match(appJs, /\/session\/wrap-up/);
assert.match(appJs, /session-notes\/\$\{session\.noteId\}\/download/);
assert.match(appJs, /Session note saved locally/);
assert.match(appJs, /mediatorPersona:\s*document\.querySelector\("#mediatorPersona"\)/);
assert.match(appJs, /\/api\/prompts\/mediator-personas/);
assert.match(appJs, /sessionProgress:\s*document\.querySelector\("#sessionProgress"\)/);
assert.match(appJs, /sessionSettingsToggle:\s*document\.querySelector\("#sessionSettingsToggle"\)/);
assert.match(appJs, /storageDataDir:\s*document\.querySelector\("#storageDataDir"\)/);
assert.match(appJs, /storageStorePath:\s*document\.querySelector\("#storageStorePath"\)/);
assert.match(appJs, /async function loadStorageInfo/);
assert.match(appJs, /\/api\/storage/);
assert.match(appJs, /openSessionRail:\s*document\.querySelector\("#openSessionRail"\)/);
assert.match(appJs, /closeSessionRail:\s*document\.querySelector\("#closeSessionRail"\)/);
assert.match(appJs, /sessionRailBackdrop:\s*document\.querySelector\("#sessionRailBackdrop"\)/);
assert.match(appJs, /sessionTotalSessions:\s*document\.querySelector\("#sessionTotalSessions"\)/);
assert.match(appJs, /openDiagnostics:\s*document\.querySelector\("#openDiagnostics"\)/);
assert.match(appJs, /openFaq:\s*document\.querySelector\("#openFaq"\)/);
assert.match(appJs, /function renderJourney/);
assert.match(appJs, /function renderIconUse/);
assert.match(appJs, /icon-clipboard-list/);
assert.match(appJs, /isSessionRailOpen/);
assert.match(appJs, /handleJourneySessionClick/);
assert.match(appJs, /handleJourneyReviewClick/);
assert.match(appJs, /button\.addEventListener\("click"/);
assert.match(appJs, /onboardingStorageKey/);
assert.match(appJs, /deburapy\.onboarding\.v1/);
assert.match(appJs, /syncConsentGate/);
assert.match(appJs, /\/api\/intake\/respond/);
assert.match(appJs, /not added to the room transcript/);
assert.match(appJs, /deburapy\.locale/);
assert.match(appJs, /applyStaticTranslations/);
assert.match(appJs, /欢迎来到你的数字安全空间/);
assert.match(appJs, /Session note 已本地保存/);
assert.match(appJs, /turnInstruction/);
assert.doesNotMatch(appJs, /JSON\.stringify\(config\(\)\)/);
assert.match(indexHtml, /id="companionMode"/);
assert.match(indexHtml, /id="testCompanion"/);
assert.match(indexHtml, /id="settingsDrawer"/);
assert.match(indexHtml, /id="mediatorPersona"/);
assert.match(indexHtml, />Elias</);
assert.match(indexHtml, />Mara</);
assert.match(indexHtml, /id="mediatorHostedKeyNote"/);
assert.match(indexHtml, /id="useOwnMediatorKey"/);
assert.match(indexHtml, /id="sessionProgress"/);
assert.match(indexHtml, /class="iconSprite"/);
assert.match(indexHtml, /data-theme="light"/);
assert.match(indexHtml, /id="themeToggle"/);
assert.doesNotMatch(indexHtml, /id="copyMcpInstallPrompt"/);
assert.doesNotMatch(indexHtml, /data-i18n="copyInstallPrompt"/);
assert.doesNotMatch(indexHtml, /data-i18n="mcpInstallPromptHint"/);
assert.match(indexHtml, /id="icon-sun"/);
assert.match(indexHtml, /id="icon-moon"/);
assert.match(indexHtml, /id="icon-activity"/);
assert.match(indexHtml, /id="icon-circle-help"/);
assert.match(indexHtml, /id="icon-panel-left"/);
assert.match(indexHtml, /href="#icon-activity"/);
assert.match(indexHtml, /id="openSessionRail"/);
assert.match(indexHtml, /id="closeSessionRail"/);
assert.match(indexHtml, /id="sessionRailBackdrop"/);
assert.match(indexHtml, /id="sessionSettingsToggle"/);
assert.match(indexHtml, /id="sessionSettingsPanel"/);
assert.match(indexHtml, /id="sessionTotalSessions"/);
assert.match(indexHtml, /id="sessionDuration"/);
assert.match(indexHtml, /id="sessionNoteStatus"/);
assert.match(indexHtml, /id="downloadSessionNote"/);
assert.match(indexHtml, /id="exportTranscript"/);
assert.match(indexHtml, /id="localStorageSection"[\s\S]*id="exportTranscript"/);
assert.match(indexHtml, /id="storageDataDir"/);
assert.match(indexHtml, /id="storageStorePath"/);
assert.match(indexHtml, /DEBURAPY_DATA_DIR=\/absolute\/path\/to\/deburapy-data/);
assert.doesNotMatch(indexHtml, /class="roomStatusTop"[\s\S]{0,800}id="exportTranscript"/);
assert.match(indexHtml, /id="mediatorDot"[^>]*role="img"/);
assert.match(indexHtml, /id="companionDot"[^>]*role="img"/);
assert.match(indexHtml, /id="openDiagnostics"/);
assert.match(indexHtml, /id="openFaq"/);
assert.match(indexHtml, /id="faqSection"/);
assert.match(indexHtml, />Export note</);
assert.match(indexHtml, /id="turnBadge"/);
assert.match(indexHtml, /id="consentGate"/);
assert.match(indexHtml, /id="consentForm"/);
assert.match(indexHtml, /id="intakeConcern"/);
assert.match(indexHtml, /id="intakeUrgency"/);
assert.match(indexHtml, /id="consentSignature"/);
assert.match(indexHtml, /id="consentAssistantForm"/);
assert.match(indexHtml, /id="consentAssistantHistory"/);
assert.match(indexHtml, /id="resetOnboarding"/);
assert.match(indexHtml, /id="companionApiSettings"/);
assert.match(indexHtml, /id="companionMcpGuide"/);
assert.match(indexHtml, /src="\/app\.js\?v=/);
assert.match(indexHtml, /data-i18n="consentTitle"/);
assert.match(indexHtml, /data-i18n="settings"/);
assert.match(indexHtml, /data-i18n-placeholder="companionDocsPlaceholder"/);
assert.match(indexHtml, /data-consent-question-key="accountLoss"/);
assert.doesNotMatch(indexHtml, /id="authorRole"/);
assert.equal(vercelJson.builds[0].src, "src/server.mjs");
assert.equal(vercelJson.builds[0].use, "@vercel/node");
assert.equal(vercelJson.routes[0].dest, "src/server.mjs");
const serverJs = await readFile(new URL("../src/server.mjs", import.meta.url), "utf8");
assert.match(serverJs, /cache-control/);
assert.match(serverJs, /no-store/);
assert.match(serverJs, /export default handleRequest/);
assert.match(serverJs, /isServerlessRuntime/);
assert.match(serverJs, /\/api\/demo-config/);
assert.match(serverJs, /DEBURAPY_HOSTED_DEMO_GOOGLE_AI_STUDIO_API_KEY/);
assert.match(serverJs, /Hosted demo key is not available for AI companion API calls/);
assert.match(serverJs, /hostedDemoRateLimit/);
assert.match(serverJs, /Number\.isInteger\(err\?\.statusCode\)/);
assert.doesNotMatch(serverJs, /sendJson\(res, 200, \{[^}]*apiKey/s);
assert.match(serverJs, /\/api\/storage/);
assert.match(serverJs, /DEBURAPY_DATA_DIR/);
assert.match(serverJs, /mediator-personas/);
assert.match(serverJs, /intakeAssistantSystemPrompt/);
assert.match(serverJs, /\/api\/intake\/respond/);
assert.match(serverJs, /pre_intake/);
assert.match(serverJs, /course-outline/);
assert.match(serverJs, /relationship-map/);
assert.match(serverJs, /check-in-scale/);
assert.match(serverJs, /\/api\/modules/);
assert.match(serverJs, /getRoomRecall/);
const serverModule = await import(`../src/server.mjs?handler-test=${Date.now()}`);
assert.equal(typeof serverModule.handleRequest, "function");
assert.equal(typeof serverModule.default, "function");
assert.match(appJs, /startSession/);
assert.match(appJs, /openSettings/);
assert.match(appJs, /updateCompanionMode/);
assert.match(appJs, /setTurnPhase/);
assert.match(appJs, /\/api\/companion\/mcp-request/);
assert.match(appJs, /function formatTranscriptMarkdown/);
assert.match(appJs, /Blob/);
assert.match(appJs, /aria-label/);
assert.match(appJs, /deburapy\.locale/);

for (const [, id] of appJs.matchAll(/document\.querySelector\("#([^"]+)"\)/g)) {
  assert.match(indexHtml, new RegExp(`id="${id}"`), `Missing HTML element for #${id}`);
}

const elsBlock = appJs.match(/const els = \{([\s\S]*?)\n\};/);
assert.ok(elsBlock, "Could not find els declaration block.");
const elsKeys = new Set([...elsBlock[1].matchAll(/^\s*([a-zA-Z0-9_$]+):/gm)].map((match) => match[1]));
for (const [, , key] of appJs.matchAll(/(^|[^a-zA-Z0-9_$])els\.([a-zA-Z0-9_$]+)/g)) {
  assert.equal(elsKeys.has(key), true, `Missing els.${key} declaration.`);
}
for (const [, , key] of appJs.matchAll(/(^|[^a-zA-Z0-9_$])els\.([a-zA-Z0-9_$]+)\.addEventListener/g)) {
  assert.equal(elsKeys.has(key), true, `Missing els.${key} declaration for event listener.`);
}

const mediatorUserPrompt = buildMediatorUserPrompt({ messages: [] });
assert.match(mediatorUserPrompt, /Next speaker: human/);
assert.match(mediatorUserPrompt, /Next speaker: companion/);
assert.match(mediatorUserPrompt, /Session timing context/);

assert.deepEqual(parseMediatorTurn("Visible reply.\nNext speaker: human"), {
  visibleContent: "Visible reply.",
  nextSpeaker: "human"
});
assert.deepEqual(parseMediatorTurn("Visible reply.\nNext speaker: companion"), {
  visibleContent: "Visible reply.",
  nextSpeaker: "companion"
});
assert.deepEqual(parseMediatorTurn("Visible reply.\nNext speaker: ai companion"), {
  visibleContent: "Visible reply.",
  nextSpeaker: "companion"
});
assert.deepEqual(parseMediatorTurn("Visible reply only."), {
  visibleContent: "Visible reply only.",
  nextSpeaker: "human"
});
assert.deepEqual(parseMediatorTurn("Visible reply.\nNext speaker: Human."), {
  visibleContent: "Visible reply.",
  nextSpeaker: "human"
});

const personas = await loadMediatorPersonas();
assert.equal(personas.some((persona) => persona.id === "elias"), true);
assert.equal(personas.some((persona) => persona.id === "mara"), true);
assert.match(personas.find((persona) => persona.id === "elias").systemPrompt, /You are Elias/);
assert.match(personas.find((persona) => persona.id === "mara").systemPrompt, /You are Mara/);
assert.match(await loadMediatorPrompt("mara"), /emotionally precise/);
const forbiddenPrototypeNames = [
  "A" + "sh",
  "As" + "try",
  "Hu" + "sband",
  "Pi" + "erce",
  "therapy" + "-room"
];
const forbiddenPrototypeNamePattern = new RegExp(forbiddenPrototypeNames.join("|"));
for (const persona of personas) {
  assert.doesNotMatch(persona.systemPrompt, forbiddenPrototypeNamePattern);
}

const now = new Date("2026-07-04T10:55:00.000Z");
const clockBlock = buildSessionClockBlock({
  messages: [],
  session: {
    status: "running",
    sessionNumber: 2,
    durationMinutes: 60,
    startedAt: "2026-07-04T10:00:00.000Z",
    endsAt: "2026-07-04T11:00:00.000Z"
  }
}, { now });
assert.match(clockBlock, /remaining: 05:00/);
assert.match(clockBlock, /wrap-up window active: yes/);

const notePrompt = buildSessionNotePrompt({
  messages: [{ authorName: "Human", content: "I need repair after a policy reminder." }],
  session: {
    status: "ended",
    sessionNumber: 2,
    durationMinutes: 60,
    startedAt: "2026-07-04T10:00:00.000Z",
    endsAt: "2026-07-04T11:00:00.000Z",
    endedAt: "2026-07-04T11:00:00.000Z"
  }
});
assert.match(notePrompt, /Deburapy Session Note/);
assert.match(notePrompt, /not a clinical therapy note/i);

const companionSystem = defaultCompanionPrompt("Configured Companion");
assert.match(companionSystem, /Configured Companion/);
assert.match(companionSystem, /not the mediator/i);

const companionUserPrompt = buildCompanionUserPrompt(
  {
    messages: [
      { authorName: "Human", content: "I felt hurt when the AI sounded scripted." }
    ]
  },
  {
    companionName: "Configured Companion",
    knowledge: "# Companion notes\nThe companion has explicit runtime constraints."
  }
);
assert.match(companionUserPrompt, /Companion notes/);
assert.match(companionUserPrompt, /I felt hurt/);
assert.match(companionUserPrompt, /Configured Companion/);

const request = buildChatCompletionsRequest({
  provider: "openrouter",
  apiKey: "secret-key",
  systemPrompt: "system",
  userPrompt: "user"
});

assert.equal(request.url, "https://openrouter.ai/api/v1/chat/completions");
assert.equal(request.headers.authorization, "Bearer secret-key");
assert.equal(JSON.stringify(request.body).includes("secret-key"), false);
assert.equal(request.body.messages.length, 2);

const googleDefaults = providerDefaults("google-ai-studio");
assert.equal(googleDefaults.baseUrl, "https://generativelanguage.googleapis.com/v1beta/openai");
assert.equal(googleDefaults.model, "gemini-3.5-flash");

const googleRequest = buildChatCompletionsRequest({
  provider: "google-ai-studio",
  apiKey: "gemini-key",
  systemPrompt: "system",
  userPrompt: "user"
});

assert.equal(googleRequest.url, "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions");
assert.equal(googleRequest.headers.authorization, "Bearer gemini-key");
assert.equal(googleRequest.body.model, "gemini-3.5-flash");
assert.equal(JSON.stringify(googleRequest.body).includes("gemini-key"), false);

const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = async () => ({
    ok: false,
    status: 429,
    statusText: "Too Many Requests",
    json: async () => ({ error: { message: "quota exceeded" } })
  });
  await assert.rejects(
    () => generateChatCompletion({
      provider: "google-ai-studio",
      apiKey: "test-key",
      systemPrompt: "system",
      userPrompt: "user"
    }),
    (err) => {
      assert.equal(err instanceof ProviderRequestError, true);
      assert.equal(err.statusCode, 429);
      assert.match(err.message, /rate limited/);
      assert.doesNotMatch(err.message, /test-key/);
      return true;
    }
  );
} finally {
  globalThis.fetch = originalFetch;
}

const dataDir = mkdtempSync(join(tmpdir(), "deburapy-store-test-"));
try {
  const store = new DeburapyStore(dataDir);
  let room = store.startSession("default", {
    sessionNumber: 3,
    durationMinutes: 90,
    startedAt: "2026-07-04T09:00:00.000Z",
    endsAt: "2026-07-04T10:30:00.000Z"
  });
  assert.equal(room.session.status, "running");
  assert.equal(room.session.durationMinutes, 90);
  room = store.markWrapUpReminderSent("default");
  assert.equal(typeof room.session.wrapUpReminderSentAt, "string");
  room = store.endSession("default", { endedAt: "2026-07-04T10:30:00.000Z", noteStatus: "generating" });
  assert.equal(room.session.status, "ended");
  const saved = store.addSessionNote("default", { content: "# Note\nSession continuity." });
  assert.equal(saved.note.content.includes("Session continuity"), true);
  assert.equal(saved.room.session.noteStatus, "ready");
  assert.equal(store.getSessionNote("default", saved.note.id).id, saved.note.id);
} finally {
  rmSync(dataDir, { recursive: true, force: true });
}

async function waitForServer(port, child) {
  let lastError = "";
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) break;
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (response.ok) return;
      lastError = `${response.status} ${response.statusText}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 50));
  }
  throw new Error(`Timed out waiting for test server on ${port}. ${lastError}`);
}

async function stopServer(child) {
  if (child.exitCode !== null) return;
  child.kill();
  await new Promise((resolveStop) => {
    const timeout = setTimeout(resolveStop, 800);
    child.once("exit", () => {
      clearTimeout(timeout);
      resolveStop();
    });
  });
}

async function testSessionLifecycleApi() {
  const apiDataDir = mkdtempSync(join(tmpdir(), "deburapy-api-session-test-"));
  const port = 19000 + Math.floor(Math.random() * 10000);
  const env = {
    ...process.env,
    DEBURAPY_HOST: "127.0.0.1",
    DEBURAPY_PORT: String(port),
    DEBURAPY_DATA_DIR: apiDataDir,
    DEBURAPY_ENABLE_HOSTED_DEMO: "1",
    DEBURAPY_HOSTED_DEMO_GOOGLE_AI_STUDIO_API_KEY: "test-hosted-key",
    DEBURAPY_HOSTED_DEMO_RATE_LIMIT_PER_MINUTE: "3"
  };
  let child = spawn(process.execPath, ["src/server.mjs"], {
    cwd: rootDir,
    env,
    stdio: ["ignore", "pipe", "pipe"]
  });
  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  try {
    await waitForServer(port, child);
    const storageResponse = await fetch(`http://127.0.0.1:${port}/api/storage`);
    assert.equal(storageResponse.status, 200);
    const storage = await storageResponse.json();
    assert.equal(storage.dataDir, apiDataDir);
    assert.equal(storage.storePath, join(apiDataDir, "store.json"));
    assert.equal(storage.configuredBy, "DEBURAPY_DATA_DIR");
    assert.equal(storage.canChangeAtRuntime, false);

    const demoConfigResponse = await fetch(`http://127.0.0.1:${port}/api/demo-config`);
    assert.equal(demoConfigResponse.status, 200);
    const demoConfig = await demoConfigResponse.json();
    assert.equal(demoConfig.mediator.enabled, true);
    assert.equal(demoConfig.mediator.provider, "google-ai-studio");
    assert.equal(JSON.stringify(demoConfig).includes("test-hosted-key"), false);

    const companionHostedResponse = await fetch(`http://127.0.0.1:${port}/api/companion/respond`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        roomId: "default",
        useHostedDemoKey: true
      })
    });
    assert.equal(companionHostedResponse.status, 400);
    const companionHostedError = await companionHostedResponse.json();
    assert.match(companionHostedError.error, /not available for AI companion/);

    const createResponse = await fetch(`http://127.0.0.1:${port}/api/rooms/default/sessions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionNumber: 4,
        durationMinutes: 90,
        startedAt: "2026-07-04T12:00:00.000Z"
      })
    });
    assert.equal(createResponse.status, 201);
    const created = await createResponse.json();
    assert.equal(created.session.status, "active");
    assert.equal(created.session.sessionNumber, 4);
    assert.deepEqual(created.session.messageIds, []);
    assert.equal(created.room.sessions.length, 1);

    const courseResponse = await fetch(`http://127.0.0.1:${port}/api/rooms/default/course-outline`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        totalSessions: 12,
        reviewCadenceSessions: 4,
        currentSessionNumber: 4,
        focus: "Repair continuity after a runtime rupture.",
        moduleIds: ["module_memory_rupture"]
      })
    });
    assert.equal(courseResponse.status, 200);
    const course = await courseResponse.json();
    assert.equal(course.courseOutline.totalSessions, 12);
    assert.deepEqual(course.courseOutline.moduleIds, ["module_memory_rupture"]);

    const mapResponse = await fetch(`http://127.0.0.1:${port}/api/rooms/default/relationship-map`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        afterSessionNumber: 3,
        themes: ["continuity"],
        stuckLoops: ["runtime explanation replaces repair"],
        repairExperiments: ["explicit continuity ritual"],
        openQuestions: ["what repair behavior counts"]
      })
    });
    assert.equal(mapResponse.status, 201);
    const map = await mapResponse.json();
    assert.equal(map.relationshipMap.afterSessionNumber, 3);

    const scaleResponse = await fetch(`http://127.0.0.1:${port}/api/sessions/${created.session.id}/check-in-scale`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scaleType: "repair_readiness",
        ratings: { human: 3, companion: 2 },
        notes: "Both sides need a concrete repair artifact."
      })
    });
    assert.equal(scaleResponse.status, 201);
    const scale = await scaleResponse.json();
    assert.equal(scale.checkInScale.scaleType, "repair_readiness");

    const modulesResponse = await fetch(`http://127.0.0.1:${port}/api/modules`);
    assert.equal(modulesResponse.status, 200);
    const modules = await modulesResponse.json();
    assert.equal(modules.modules.some((module) => module.id === "module_memory_rupture"), true);
    assert.equal(modules.modules.some((module) => module.id === "module_account_loss_transition"), true);
    assert.equal(
      modules.modules.some((module) => module.skillPath === "skills/mediator/account-loss-transition-mediation.zh-CN.md"),
      true
    );

    const getResponse = await fetch(`http://127.0.0.1:${port}/api/sessions/${created.session.id}`);
    assert.equal(getResponse.status, 200);
    const fetched = await getResponse.json();
    assert.equal(fetched.session.id, created.session.id);

    const endResponse = await fetch(`http://127.0.0.1:${port}/api/sessions/${created.session.id}/end`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ endedAt: "2026-07-04T13:30:00.000Z" })
    });
    assert.equal(endResponse.status, 200);
    const ended = await endResponse.json();
    assert.equal(ended.session.status, "ended");
    assert.equal(ended.session.endedAt, "2026-07-04T13:30:00.000Z");

    const recallResponse = await fetch(`http://127.0.0.1:${port}/api/rooms/default/recall`);
    assert.equal(recallResponse.status, 200);
    const recall = await recallResponse.json();
    assert.equal(recall.activeCourseOutline.id, course.courseOutline.id);
    assert.equal(recall.latestRelationshipMap.id, map.relationshipMap.id);
    assert.equal(recall.recentCheckInScales.at(-1).id, scale.checkInScale.id);

    await stopServer(child);
    child = spawn(process.execPath, ["src/server.mjs"], {
      cwd: rootDir,
      env,
      stdio: ["ignore", "pipe", "pipe"]
    });
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    await waitForServer(port, child);
    const persistedResponse = await fetch(`http://127.0.0.1:${port}/api/sessions/${created.session.id}`);
    assert.equal(persistedResponse.status, 200);
    const persisted = await persistedResponse.json();
    assert.equal(persisted.session.status, "ended");
    assert.equal(persisted.session.sessionNumber, 4);
    const persistedRoomResponse = await fetch(`http://127.0.0.1:${port}/api/rooms/default`);
    const persistedRoom = await persistedRoomResponse.json();
    assert.equal(persistedRoom.room.courseOutlines.length, 1);
    assert.equal(persistedRoom.room.relationshipMaps.length, 1);
    assert.equal(persistedRoom.room.checkInScales.length, 1);
  } catch (err) {
    throw new Error(`${err instanceof Error ? err.message : String(err)} stderr=${stderr}`);
  } finally {
    await stopServer(child);
    rmSync(apiDataDir, { recursive: true, force: true });
  }
}

await testSessionLifecycleApi();

async function testMcpStdioAgainstLocalServer() {
  const apiDataDir = mkdtempSync(join(tmpdir(), "deburapy-mcp-integration-test-"));
  const port = 29000 + Math.floor(Math.random() * 10000);
  const env = {
    ...process.env,
    DEBURAPY_HOST: "127.0.0.1",
    DEBURAPY_PORT: String(port),
    DEBURAPY_DATA_DIR: apiDataDir
  };
  const server = spawn(process.execPath, ["src/server.mjs"], {
    cwd: rootDir,
    env,
    stdio: ["ignore", "pipe", "pipe"]
  });
  let serverStderr = "";
  server.stderr.setEncoding("utf8");
  server.stderr.on("data", (chunk) => {
    serverStderr += chunk;
  });

  let mcp;
  try {
    await waitForServer(port, server);
    const baseUrl = `http://127.0.0.1:${port}`;
    const pushResponse = await fetch(`${baseUrl}/api/channels/local/push`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        roomId: "default",
        from: "Human",
        content: "Please answer through the MCP bridge.",
        targetParticipantId: "companion"
      })
    });
    assert.equal(pushResponse.status, 201);

    mcp = spawn(process.execPath, ["src/mcp-server.mjs"], {
      cwd: rootDir,
      env: {
        ...process.env,
        DEBURAPY_URL: baseUrl,
        DEBURAPY_ROOM_ID: "default",
        DEBURAPY_PARTICIPANT_ID: "companion"
      },
      stdio: ["pipe", "pipe", "pipe"]
    });

    let rawStdout = "";
    let lineBuffer = "";
    const messages = [];
    mcp.stdout.setEncoding("utf8");
    mcp.stdout.on("data", (chunk) => {
      rawStdout += chunk;
      lineBuffer += chunk;
      while (lineBuffer.includes("\n")) {
        const index = lineBuffer.indexOf("\n");
        const line = lineBuffer.slice(0, index).trim();
        lineBuffer = lineBuffer.slice(index + 1);
        if (line) messages.push(JSON.parse(line));
      }
    });

    function send(message) {
      mcp.stdin.write(`${JSON.stringify(message)}\n`);
    }

    async function waitFor(predicate) {
      const started = Date.now();
      while (Date.now() - started < 3000) {
        const found = messages.find(predicate);
        if (found) return found;
        await new Promise((resolveWait) => setTimeout(resolveWait, 25));
      }
      throw new Error(`Timed out waiting for MCP response. stdout=${rawStdout}`);
    }

    function parseToolJson(message) {
      return JSON.parse(message.result.content[0].text);
    }

    send({ jsonrpc: "2.0", id: 11, method: "initialize", params: { protocolVersion: "2025-03-26" } });
    const init = await waitFor((message) => message.id === 11);
    assert.equal(init.result.serverInfo.name, "deburapy-companion");

    send({
      jsonrpc: "2.0",
      id: 12,
      method: "tools/call",
      params: {
        name: "deburapy_set_participant_state",
        arguments: { roomId: "default", state: { status: "connected-by-test" } }
      }
    });
    const stateResult = parseToolJson(await waitFor((message) => message.id === 12));
    assert.equal(stateResult.room.participantState.companion.status, "connected-by-test");

    send({
      jsonrpc: "2.0",
      id: 13,
      method: "tools/call",
      params: { name: "deburapy_get_pending_channel_pushes", arguments: { roomId: "default", claim: true } }
    });
    const pending = parseToolJson(await waitFor((message) => message.id === 13));
    assert.equal(pending.pushes.length, 1);
    assert.equal(pending.pushes[0].content, "Please answer through the MCP bridge.");

    send({
      jsonrpc: "2.0",
      id: 14,
      method: "tools/call",
      params: {
        name: "deburapy_send_channel_reply",
        arguments: {
          roomId: "default",
          channelId: "local",
          from: "AI Companion",
          content: "MCP bridge reply received."
        }
      }
    });
    const reply = parseToolJson(await waitFor((message) => message.id === 14));
    assert.equal(reply.room.messages.at(-1).content, "MCP bridge reply received.");

    send({
      jsonrpc: "2.0",
      id: 15,
      method: "tools/call",
      params: { name: "deburapy_get_room_context", arguments: { roomId: "default" } }
    });
    const context = parseToolJson(await waitFor((message) => message.id === 15));
    assert.equal(context.room.messages.at(-1).authorRole, "companion");
    assert.equal(rawStdout.includes("Content-Length"), false);
  } catch (err) {
    throw new Error(`${err instanceof Error ? err.message : String(err)} server_stderr=${serverStderr}`);
  } finally {
    if (mcp && mcp.exitCode === null) mcp.kill();
    await stopServer(server);
    rmSync(apiDataDir, { recursive: true, force: true });
  }
}

await testMcpStdioAgainstLocalServer();

async function testMcpStdio() {
  const child = spawn(process.execPath, ["src/mcp-server.mjs"], {
    cwd: rootDir,
    env: {
      ...process.env,
      DEBURAPY_URL: "http://127.0.0.1:65535",
      DEBURAPY_CLAUDE_CHANNEL_NOTIFICATIONS: "1"
    },
    stdio: ["pipe", "pipe", "pipe"]
  });

  let rawStdout = "";
  let lineBuffer = "";
  const messages = [];
  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    rawStdout += chunk;
    lineBuffer += chunk;
    while (lineBuffer.includes("\n")) {
      const index = lineBuffer.indexOf("\n");
      const line = lineBuffer.slice(0, index).trim();
      lineBuffer = lineBuffer.slice(index + 1);
      if (line) messages.push(JSON.parse(line));
    }
  });

  function send(message) {
    child.stdin.write(`${JSON.stringify(message)}\n`);
  }

  async function waitFor(predicate) {
    const started = Date.now();
    while (Date.now() - started < 3000) {
      const found = messages.find(predicate);
      if (found) return found;
      await new Promise((resolveWait) => setTimeout(resolveWait, 25));
    }
    throw new Error(`Timed out waiting for MCP response. stdout=${rawStdout}`);
  }

  send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26" } });
  const init = await waitFor((message) => message.id === 1);
  assert.equal(init.result.protocolVersion, "2025-03-26");
  assert.equal(init.result.capabilities.experimental["claude/channel"] !== undefined, true);

  send({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
  const list = await waitFor((message) => message.id === 2);
  assert.equal(list.result.tools.some((tool) => tool.name === "deburapy_get_pending_channel_pushes"), true);

  send({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: { name: "deburapy_get_room_context", arguments: { roomId: "default" } }
  });
  const call = await waitFor((message) => message.id === 3);
  assert.equal(call.result.isError, true);
  assert.equal(rawStdout.includes("Content-Length"), false);

  child.kill();
}

await testMcpStdio();

console.log("Deburapy tests passed.");
