// Headless checks: console errors, horizontal scroll, labels, core flows, screenshots. Usage: node scripts/browser-check.mjs
import { chromium } from "playwright-core";
import fs from "node:fs";
const BASE = process.env.BASE || "http://localhost:4173";
const SHOTS = process.env.SHOTS || `${process.env.HOME}/workspace/your_files/money-tracker`;
const exe = process.env.CHROME || `${process.env.HOME}/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome`;
const results = [];
const ok = (name, pass, info = "") => { results.push({ name, pass, info }); console.log(`${pass ? "PASS" : "FAIL"} ${name} ${info}`); };

const browser = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
for (const vp of [{ w: 390, h: 844, tag: "390" }, { w: 1366, h: 900, tag: "1366" }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, acceptDownloads: true, deviceScaleFactor: vp.w < 500 ? 2 : 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  const noHScroll = async (where) => {
    const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    ok(`[${vp.tag}] no horizontal scroll: ${where}`, o.sw <= o.cw, `${o.sw}/${o.cw}`);
  };
  const unlabelled = async (where) => {
    const n = await page.evaluate(() => [...document.querySelectorAll("input,select,textarea,button,a[href]")].filter((el) => {
      if (el.type === "hidden" || el.closest("[aria-hidden=true]")) return false;
      const name = el.getAttribute("aria-label") || el.labels?.[0]?.textContent || el.textContent?.trim() || el.getAttribute("title") || el.getAttribute("aria-labelledby");
      return !name;
    }).map((el) => el.outerHTML.slice(0, 80)));
    ok(`[${vp.tag}] every control has a name: ${where}`, n.length === 0, n.join(" | "));
  };

  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  ok(`[${vp.tag}] empty state shown`, await page.getByText("Your passbook is empty").isVisible());
  await noHScroll("empty home");
  if (vp.tag === "390") await page.screenshot({ path: `${SHOTS}/01-empty-390.png` });

  // Add an entry through the real form
  await page.getByRole("button", { name: /add first entry/i }).click();
  await page.locator("#amount").fill("-5");
  await page.getByRole("button", { name: /^save$/i }).click();
  ok(`[${vp.tag}] negative amount rejected`, await page.locator("#amount-error").isVisible());
  await page.locator("#amount").fill("250.50");
  await page.locator("#note").fill("Canteen lunch");
  if (vp.tag === "390") await page.screenshot({ path: `${SHOTS}/02-add-sheet-390.png` });
  await page.getByRole("button", { name: /^save$/i }).click();
  await page.waitForTimeout(400);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("kaasu:data:v1") || "{}"));
  ok(`[${vp.tag}] entry saved to localStorage`, stored.entries?.length === 1 && stored.entries[0].amount === 25050);
  ok(`[${vp.tag}] dashboard shows spent`, await page.getByText("₹250.5", { exact: false }).first().isVisible().catch(() => false) || await page.getByText("₹251").first().isVisible().catch(() => false));

  // Edit then delete
  await page.goto(BASE + "/entries/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Canteen lunch/ }).click();
  await page.locator("#amount").fill("300");
  await page.getByRole("button", { name: /save changes/i }).click();
  await page.waitForTimeout(300);
  ok(`[${vp.tag}] edit works`, (await page.evaluate(() => JSON.parse(localStorage.getItem("kaasu:data:v1")).entries[0].amount)) === 30000);
  await page.getByRole("button", { name: /Canteen lunch/ }).click();
  await page.getByRole("button", { name: /^delete$/i }).first().click();
  await page.getByRole("alertdialog").getByRole("button", { name: /^delete$/i }).click();
  await page.waitForTimeout(300);
  ok(`[${vp.tag}] delete works`, (await page.evaluate(() => JSON.parse(localStorage.getItem("kaasu:data:v1")).entries.length)) === 0);

  // Sample data and every page
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /load sample data/i }).click();
  await page.waitForTimeout(900);
  await noHScroll("dashboard with data");
  await unlabelled("dashboard");
  await page.screenshot({ path: `${SHOTS}/03-dashboard-light-${vp.tag}.png`, fullPage: vp.tag === "1366" });
  for (const p of ["entries", "budgets", "recurring", "goals", "settings"]) {
    await page.goto(`${BASE}/${p}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(250);
    await noHScroll(p);
    await unlabelled(p);
    if (vp.tag === "390" && ["entries", "budgets", "goals"].includes(p)) await page.screenshot({ path: `${SHOTS}/04-${p}-390.png` });
  }

  // Search filter
  await page.goto(BASE + "/entries/", { waitUntil: "networkidle" });
  await page.locator("#q").fill("zzzz-no-match");
  ok(`[${vp.tag}] search filters`, await page.getByText("Nothing matches").waitFor({ timeout: 3000 }).then(() => true, () => false));

  // Budget validation
  await page.goto(BASE + "/budgets/", { waitUntil: "networkidle" });
  const first = page.locator("input[inputmode=decimal]").first();
  await first.fill("99999999999");
  await first.press("Enter");
  ok(`[${vp.tag}] over-max budget rejected`, await page.getByRole("alert").first().isVisible());

  // Settings: CSV export, malicious CSV import, backup + restore
  await page.goto(BASE + "/settings/", { waitUntil: "networkidle" });
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /export csv/i }).click()]);
  const csv = fs.readFileSync(await dl.path(), "utf8");
  ok(`[${vp.tag}] CSV export has header + rows`, csv.startsWith("date,type,amount,category,method,note") && csv.split("\n").length > 5);
  const evil = "date,type,amount,category,method,note\n2026-11-20,expense,120,Food,GPay,=HYPERLINK(\"http://x\")\n21/11/2026,expense,-4,Food,cash,neg\n2026-11-22,income,abc,Pocket money,upi,bad\n";
  fs.writeFileSync("/tmp/kaasu-evil.csv", evil);
  await page.locator("input[type=file][accept*=csv]").setInputFiles("/tmp/kaasu-evil.csv");
  await page.waitForTimeout(500);
  const imported = await page.evaluate(() => JSON.parse(localStorage.getItem("kaasu:data:v1")).entries.find((e) => e.amount === 12000 && e.date === "2026-11-20"));
  ok(`[${vp.tag}] CSV import adds valid row, method GPay->upi`, imported?.method === "upi");
  ok(`[${vp.tag}] CSV formula stripped`, imported && !imported.note.startsWith("="), JSON.stringify(imported?.note));
  ok(`[${vp.tag}] CSV bad rows reported`, await page.getByText(/2 rows skipped/).waitFor({ timeout: 3000 }).then(() => true, () => false));
  const [bk] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /save full backup/i }).click()]);
  const backupPath = "/tmp/kaasu-backup.json"; fs.copyFileSync(await bk.path(), backupPath);
  const count = (await page.evaluate(() => JSON.parse(localStorage.getItem("kaasu:data:v1")).entries.length));
  fs.writeFileSync("/tmp/kaasu-bad.json", '{"app":"other"}');
  await page.locator("input[type=file][accept*=json]").setInputFiles("/tmp/kaasu-bad.json");
  ok(`[${vp.tag}] bad backup refused`, await page.getByText(/Couldn.t restore/).waitFor({ timeout: 3000 }).then(() => true, () => false));
  await page.locator("#erase").fill("ERASE");
  await page.getByRole("button", { name: /erase all data/i }).click();
  await page.waitForTimeout(300);
  ok(`[${vp.tag}] erase all`, (await page.evaluate(() => JSON.parse(localStorage.getItem("kaasu:data:v1")).entries.length)) === 0);
  await page.locator("input[type=file][accept*=json]").setInputFiles(backupPath);
  await page.getByRole("button", { name: /replace and restore/i }).click();
  await page.waitForTimeout(300);
  ok(`[${vp.tag}] restore from backup`, (await page.evaluate(() => JSON.parse(localStorage.getItem("kaasu:data:v1")).entries.length)) === count, `${count}`);

  // Dark theme
  await page.getByText("Dark", { exact: true }).click();
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  ok(`[${vp.tag}] dark theme persists`, (await page.evaluate(() => document.documentElement.dataset.theme)) === "dark");
  await noHScroll("dark dashboard");
  await page.screenshot({ path: `${SHOTS}/05-dashboard-dark-${vp.tag}.png`, fullPage: vp.tag === "1366" });

  // Keyboard: Tab reaches skip link first; focus visible
  await page.goto(BASE + "/entries/", { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");
  ok(`[${vp.tag}] first Tab = skip link`, (await page.evaluate(() => document.activeElement?.textContent)) === "Skip to content");
  if (vp.tag === "1366") {
    await page.locator("body").click({ position: { x: 700, y: 5 } });
    await page.keyboard.press("n");
    ok(`[1366] N shortcut opens add sheet`, await page.getByRole("dialog").isVisible());
    await page.keyboard.press("Escape");
  }
  ok(`[${vp.tag}] no console errors`, errors.length === 0, errors.slice(0, 5).join(" | "));
  await ctx.close();
}

// Reduced motion
const rctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
const rp = await rctx.newPage();
await rp.goto(BASE + "/", { waitUntil: "networkidle" });
const dur = await rp.evaluate(() => getComputedStyle(document.body).transitionDuration);
ok("[reduced-motion] CSS durations collapsed", dur === "0.00001s" || dur === "1e-05s" || dur.startsWith("0"), dur);
await rctx.close();
await browser.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
