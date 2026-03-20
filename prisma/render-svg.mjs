import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svgPath = path.join(__dirname, "../docs/data-model.svg");
const outPath = path.join(__dirname, "../docs/data-model.png");

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1680, height: 1020 });
await page.goto("file://" + svgPath, { waitUntil: "networkidle" });
await page.waitForTimeout(800); // let fonts render
await page.screenshot({ path: outPath, fullPage: false });
await browser.close();
console.log("Saved:", outPath);
