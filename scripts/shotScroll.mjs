// Viewport-sized screenshots while scrolling down a page (real scroll, so sticky
// sections and scroll animations render as a visitor sees them).
// Usage: node scripts/shotScroll.mjs <url> <outPrefix> <width> <height> <stepPx> <maxShots> [mobile]
import { spawn } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [url, out, W = "1440", H = "900", step = "900", max = "12", mobile] = process.argv.slice(2);
const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", [
  "--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "cdp-"))}`,
  "--hide-scrollbars", "--disable-gpu", "--no-first-run", "about:blank",
], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page"); } catch {}
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0; const pending = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJs = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;

await send("Emulation.setDeviceMetricsOverride", { width: +W, height: +H, deviceScaleFactor: 1, mobile: !!mobile });
if (mobile) await send("Emulation.setTouchEmulationEnabled", { enabled: true });
await send("Page.navigate", { url });
await sleep(4000);
const total = await evalJs("document.documentElement.scrollHeight");
let y = Number(process.env.START || 0), n = 0;
while (n < +max) {
  await evalJs(`window.scrollTo(0, ${y})`);
  await sleep(1200);
  const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 70 });
  writeFileSync(`${out}_${String(n).padStart(2, "0")}.jpg`, Buffer.from(shot.result.data, "base64"));
  n++;
  if (y + +H >= total) break;
  y += +step;
}
console.log(JSON.stringify({ total, shots: n }));
ws.close(); chrome.kill();
