import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on("console", (msg) => { if (msg.type() === "error") errors.push("CONSOLE: " + msg.text()); });
page.on("pageerror", (err) => errors.push("PAGEERROR: " + (err.stack || err.message)));
await page.goto("http://paradisebeach.com.br/", { waitUntil: "networkidle", timeout: 30000 }).catch((e) => errors.push("GOTO: " + e.message));
await page.waitForTimeout(3000);
const bodyText = await page.locator("body").innerText().catch(() => "");
console.log("=== BODY (first 300) ===");
console.log(bodyText.slice(0, 300));
console.log("=== ERRORS ===");
console.log(errors.join("\n") || "nenhum");
await browser.close();
