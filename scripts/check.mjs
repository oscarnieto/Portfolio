// Dev-check harness: loads the page in headless Chromium at multiple
// viewports, captures console errors and screenshots.
import { chromium, devices } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:8765";
mkdirSync("shots", { recursive: true });

const targets = [
  { name: "desktop", viewport: { width: 1512, height: 945 } },
  { name: "laptop", viewport: { width: 1280, height: 800 } },
  { name: "mobile", ...devices["iPhone 13"] },
];

const browser = await chromium.launch();
let failures = 0;

for (const t of targets) {
  const ctx = await browser.newContext({ ...t, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
  page.on("requestfailed", (r) => errors.push("REQFAIL: " + r.url()));

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(3500); // let preloader finish + intro play
  await page.screenshot({ path: `shots/${t.name}-hero.png` });

  // scroll through sections
  for (const [sec, label] of [["#about", "about"], ["#work", "work"], ["#services", "services"], ["#contact", "contact"]]) {
    await page.evaluate((s) => document.querySelector(s)?.scrollIntoView(), sec);
    await page.waitForTimeout(1600);
    await page.screenshot({ path: `shots/${t.name}-${label}.png` });
  }

  // horizontal overflow check
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) { errors.push(`HORIZONTAL OVERFLOW: ${overflow}px`); }

  // mobile menu check
  if (t.name === "mobile") {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.tap("#menuToggle");
    await page.waitForTimeout(900);
    await page.screenshot({ path: "shots/mobile-menu.png" });
  }

  if (errors.length) {
    failures++;
    console.log(`\n[${t.name}] ERRORS:`);
    errors.forEach((e) => console.log("  -", e));
  } else {
    console.log(`[${t.name}] clean — no console errors, no overflow`);
  }
  await ctx.close();
}

await browser.close();
process.exit(failures ? 1 : 0);
