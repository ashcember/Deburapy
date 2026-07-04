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
  downloadTranscript: Boolean(document.querySelector("#downloadTranscript")),
  mediatorDotLabel: document.querySelector("#mediatorDot")?.getAttribute("aria-label"),
  companionDotLabel: document.querySelector("#companionDot")?.getAttribute("aria-label"),
  sessionTitle: document.querySelector("#sessionTitle")?.textContent,
  countdown: document.querySelector("#countdown")?.textContent
}));

await page.screenshot({ path: path.join(outputDir, "room.png"), fullPage: false });
await browser.close();

assertCondition(ui.title === "Deburapy", "Page title did not load.");
assertCondition(ui.consentHidden === true, "Consent bypass did not reveal the room UI.");
assertCondition(ui.downloadTranscript === true, "Download transcript button is missing.");
assertCondition(Boolean(ui.mediatorDotLabel), "Mediator status dot is missing aria-label.");
assertCondition(Boolean(ui.companionDotLabel), "Companion status dot is missing aria-label.");
assertCondition(consoleErrors.length === 0, `Browser console errors: ${consoleErrors.join("\n")}`);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  outputDir,
  ui,
  screenshots: [
    path.join(outputDir, "consent.png"),
    path.join(outputDir, "room.png")
  ]
}, null, 2));
