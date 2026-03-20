import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "../docs/screenshots");
fs.mkdirSync(outDir, { recursive: true });

const BASE = "http://localhost:3000";

const pages = [
  { name: "01-dashboard", path: "/" },
  { name: "02-members", path: "/members" },
  { name: "03-teams", path: "/teams" },
  { name: "04-customers", path: "/customers" },
  { name: "05-projects", path: "/projects" },
  { name: "06-invoices", path: "/invoices" },
];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

for (const { name, path: pagePath } of pages) {
  await page.goto(BASE + pagePath, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`Captured: ${name}.png`);
}

// Team detail page
const teamRes = await fetch(`${BASE}/teams`);
const teamHtml = await teamRes.text();
const teamMatch = teamHtml.match(/href="\/teams\/([^"]+)"/);
if (teamMatch) {
  await page.goto(`${BASE}/teams/${teamMatch[1]}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, "07-team-detail.png"), fullPage: false });
  console.log("Captured: 07-team-detail.png");
}

// Project detail
const projRes = await fetch(`${BASE}/projects`);
const projHtml = await projRes.text();
const projMatch = projHtml.match(/href="\/projects\/([^"]+)"/);
if (projMatch) {
  await page.goto(`${BASE}/projects/${projMatch[1]}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, "08-project-detail.png"), fullPage: false });
  console.log("Captured: 08-project-detail.png");
}

// Invoice detail — find paid invoice (INV-001)
const invRes = await fetch(`${BASE}/invoices`);
const invHtml = await invRes.text();
// Get all invoice IDs
const invMatches = [...invHtml.matchAll(/href="\/invoices\/([^"]+)"/g)];
if (invMatches.length > 0) {
  await page.goto(`${BASE}/invoices/${invMatches[0][1]}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, "09-invoice-detail.png"), fullPage: false });
  console.log("Captured: 09-invoice-detail.png");
}

await browser.close();
console.log("All screenshots saved to docs/screenshots/");
