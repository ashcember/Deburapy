import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const rootDir = path.resolve(new URL("..", import.meta.url).pathname);
const outputDir = path.resolve(rootDir, process.env.DEBURAPY_VISUAL_DIR || ".deburapy-artifacts/visual");
const baseUrl = process.env.DEBURAPY_VISUAL_URL || "http://127.0.0.1:8787";

function loadPlaywright() {
  try {
    return require("playwright");
  } catch (localError) {
    if (!process.env.PLAYWRIGHT_PACKAGE_PATH) {
      throw new Error([
        "Playwright is not installed for this checkout.",
        "Run `npm install` and, if needed, `npx playwright install chromium`.",
        "For a temporary local override, set PLAYWRIGHT_PACKAGE_PATH=/absolute/path/to/node_modules/playwright."
      ].join(" "));
    }
    try {
      return require(process.env.PLAYWRIGHT_PACKAGE_PATH);
    } catch (overrideError) {
      throw new Error(`Could not load Playwright from PLAYWRIGHT_PACKAGE_PATH: ${overrideError.message}`);
    }
  }
}

function assertCondition(condition, message) {
  if (!condition) throw new Error(message);
}

fs.mkdirSync(outputDir, { recursive: true });

const { chromium } = loadPlaywright();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const consoleErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});

await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.screenshot({ path: path.join(outputDir, "consent.png"), fullPage: false });

await page.evaluate(() => {
  localStorage.setItem("deburapy.locale", "en");
  localStorage.setItem("deburapy.theme", "light");
  localStorage.setItem("deburapy.onboarding.v1", JSON.stringify({
    version: 1,
    acceptedAt: new Date().toISOString(),
    screeningCompletedAt: new Date().toISOString(),
    signature: "Visual QA",
    screening: { concern: "curiosity", urgency: "low" },
    agreements: { scope: true, localStorage: true, aiLimitations: true }
  }));
});
await page.reload({ waitUntil: "networkidle" });

const ui = await page.evaluate(() => ({
  title: document.title,
  consentHidden: document.querySelector("#consentGate")?.hidden,
  themeToggle: Boolean(document.querySelector("#themeToggle")),
  theme: document.documentElement.dataset.theme,
  roomExportTranscript: Boolean(document.querySelector(".roomStatusTop #exportTranscript")),
  settingsExportTranscript: Boolean(document.querySelector("#localStorageSection #exportTranscript")),
  iconSprite: Boolean(document.querySelector(".iconSprite")),
  diagnosticsIcon: Boolean(document.querySelector("#openDiagnostics use[href='#icon-activity']")),
  faqIcon: Boolean(document.querySelector("#openFaq use[href='#icon-circle-help']")),
  mediatorDotLabel: document.querySelector("#mediatorDot")?.getAttribute("aria-label"),
  companionDotLabel: document.querySelector("#companionDot")?.getAttribute("aria-label"),
  sessionTitle: document.querySelector("#sessionTitle")?.textContent,
  countdown: document.querySelector("#countdown")?.textContent
}));

await page.screenshot({ path: path.join(outputDir, "room.png"), fullPage: false });
await page.click("#themeToggle");
await page.waitForFunction(() => document.documentElement.dataset.theme === "dark");
const darkTheme = await page.evaluate(() => ({
  theme: document.documentElement.dataset.theme,
  savedTheme: localStorage.getItem("deburapy.theme"),
  toggleLabel: document.querySelector("#themeToggle")?.getAttribute("aria-label"),
  background: getComputedStyle(document.body).backgroundColor,
  ink: getComputedStyle(document.body).color
}));
await page.screenshot({ path: path.join(outputDir, "room-dark.png"), fullPage: false });
await page.click("#openSettings");
await page.waitForFunction(() => {
  const text = document.querySelector("#storageDataDir")?.textContent || "";
  return text && text !== "Loading...";
});
const settingsStorage = await page.evaluate(() => ({
  localStorageSection: Boolean(document.querySelector("#localStorageSection")),
  dataDir: document.querySelector("#storageDataDir")?.textContent,
  storePath: document.querySelector("#storageStorePath")?.textContent,
  configuredBy: document.querySelector("#storageConfiguredBy")?.textContent,
  envExample: document.querySelector("#storageEnvExample")?.textContent,
  transcriptExportText: document.querySelector("#localStorageSection #exportTranscript")?.textContent?.trim()
}));
await page.selectOption("#companionMode", "mcp");
await page.waitForFunction(() => document.querySelector("#companionMcpGuide")?.hidden === false);
const mcpGuide = await page.evaluate(() => ({
  visible: document.querySelector("#companionMcpGuide")?.hidden === false,
  copyInstallPrompt: Boolean(document.querySelector("#copyMcpInstallPrompt")),
  copyInstallPromptText: document.querySelector("#copyMcpInstallPrompt")?.textContent?.trim(),
  guideText: document.querySelector("#companionMcpGuide")?.textContent || ""
}));
await page.evaluate(() => {
  document.querySelector("#localStorageSection")?.scrollIntoView({ block: "start" });
});
await page.waitForTimeout(160);
await page.screenshot({ path: path.join(outputDir, "settings-local-storage.png"), fullPage: false });
await page.setViewportSize({ width: 390, height: 844 });
await page.reload({ waitUntil: "networkidle" });

const mobileBefore = await page.evaluate(() => {
  const button = document.querySelector("#openSessionRail");
  const rail = document.querySelector("#sessionRail");
  const buttonStyle = window.getComputedStyle(button);
  const railStyle = window.getComputedStyle(rail);
  return {
    openSessionRail: buttonStyle.display,
    persistedTheme: document.documentElement.dataset.theme,
    buttonText: button?.textContent?.trim(),
    railTransform: railStyle.transform
  };
});

await page.click("#openSessionRail");
await page.waitForTimeout(240);
const mobileAfter = await page.evaluate(() => {
  const rail = document.querySelector("#sessionRail");
  const backdrop = document.querySelector("#sessionRailBackdrop");
  const rect = rail.getBoundingClientRect();
  return {
    bodyOpen: document.body.classList.contains("isSessionRailOpen"),
    expanded: document.querySelector("#openSessionRail")?.getAttribute("aria-expanded"),
    backdropOpen: backdrop?.classList.contains("isOpen"),
    railLeft: Math.round(rect.left),
    railWidth: Math.round(rect.width)
  };
});

await page.screenshot({ path: path.join(outputDir, "room-mobile-session.png"), fullPage: false });
await browser.close();

assertCondition(ui.title === "Deburapy", "Page title did not load.");
assertCondition(ui.consentHidden === true, "Consent bypass did not reveal the room UI.");
assertCondition(ui.themeToggle === true, "Theme toggle is missing.");
assertCondition(ui.theme === "light", "Initial theme should be light.");
assertCondition(darkTheme.theme === "dark", "Theme toggle did not switch to dark mode.");
assertCondition(darkTheme.savedTheme === "dark", "Dark theme preference was not persisted.");
assertCondition(darkTheme.toggleLabel.includes("light"), "Theme toggle label did not update after dark mode.");
assertCondition(ui.roomExportTranscript === false, "Transcript export should not be visible in the room status bar.");
assertCondition(ui.settingsExportTranscript === true, "Transcript export is missing from Settings local storage.");
assertCondition(ui.iconSprite === true, "SVG icon sprite is missing.");
assertCondition(ui.diagnosticsIcon === true, "Diagnostics icon is missing.");
assertCondition(ui.faqIcon === true, "FAQ icon is missing.");
assertCondition(Boolean(ui.mediatorDotLabel), "Mediator status dot is missing aria-label.");
assertCondition(Boolean(ui.companionDotLabel), "Companion status dot is missing aria-label.");
assertCondition(settingsStorage.localStorageSection === true, "Local storage settings section is missing.");
assertCondition(Boolean(settingsStorage.dataDir), "Storage data directory was not rendered.");
assertCondition(settingsStorage.storePath.endsWith("store.json"), "Storage store path was not rendered.");
assertCondition(settingsStorage.envExample.includes("DEBURAPY_DATA_DIR="), "Storage env example is missing.");
assertCondition(settingsStorage.transcriptExportText.includes("Export"), "Transcript export is not tucked into Settings.");
assertCondition(mcpGuide.visible === true, "MCP companion guide did not open.");
assertCondition(mcpGuide.copyInstallPrompt === true, "AI install prompt copy button is missing.");
assertCondition(mcpGuide.copyInstallPromptText.includes("install prompt"), "AI install prompt button text is wrong.");
assertCondition(mcpGuide.guideText.includes("deburapy_send_channel_reply"), "MCP guide is missing reply tool guidance.");
assertCondition(mobileBefore.openSessionRail !== "none", "Mobile session button is hidden.");
assertCondition(mobileBefore.persistedTheme === "dark", "Theme preference did not persist across reload.");
assertCondition(mobileBefore.buttonText.includes("Session"), "Mobile session button label is missing.");
assertCondition(mobileAfter.bodyOpen === true, "Mobile session drawer did not set the open state.");
assertCondition(mobileAfter.expanded === "true", "Mobile session button did not update aria-expanded.");
assertCondition(mobileAfter.backdropOpen === true, "Mobile session backdrop did not open.");
assertCondition(mobileAfter.railLeft >= -2, "Mobile session drawer did not slide into view.");
assertCondition(mobileAfter.railWidth > 280, "Mobile session drawer width is unexpectedly small.");
assertCondition(consoleErrors.length === 0, `Browser console errors: ${consoleErrors.join("\n")}`);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  outputDir,
  ui,
  darkTheme,
  settingsStorage,
  mcpGuide,
  mobileBefore,
  mobileAfter,
  screenshots: [
    path.join(outputDir, "consent.png"),
    path.join(outputDir, "room.png"),
    path.join(outputDir, "room-dark.png"),
    path.join(outputDir, "settings-local-storage.png"),
    path.join(outputDir, "room-mobile-session.png")
  ]
}, null, 2));
