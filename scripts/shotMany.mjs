// Batch screenshots for the portfolio reel. Reads a JSON list of {slug,url}
// and writes images/reel/<slug>.webp (desktop above-the-fold, 560px wide).
// Closes welcome popups / declines cookie banners before capturing.
// Usage: node scripts/shotMany.mjs scripts/reel-sites.json
import { spawn } from "node:child_process";
import { readFileSync, mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";

const sites = JSON.parse(readFileSync(process.argv[2], "utf8"));
mkdirSync("images/reel", { recursive: true });
const port = 9500 + Math.floor(Math.random() * 300);
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
await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 860, deviceScaleFactor: 1, mobile: false });

const dismissFor = (rx) => `(()=>{
  const btns=[...document.querySelectorAll('button,a,[role=button],div,span')].filter(b=>b.offsetParent && b.children.length<3);
  const pick=(re)=>btns.find(b=>re.test((b.innerText||b.getAttribute('aria-label')||'').trim()));
  const hit=pick(new RegExp(${JSON.stringify(rx)},'i'));
  if(hit){hit.click();return (hit.innerText||'').trim().slice(0,20)}
  return '';
})()`;

for (const s of sites) {
  try {
    await send("Page.navigate", { url: s.url });
    await sleep(5500);
    const rx = s.click ?? "^(rechazar|denegar|solo necesarias|reject|ver web|continuar|cerrar|close|×|✕)";
    const dismiss = dismissFor(rx);
    const a = s.click === "" ? "" : (await send("Runtime.evaluate", { expression: dismiss, returnByValue: true })).result?.result?.value;
    await sleep(1200);
    const b = s.click === "" ? "" : (await send("Runtime.evaluate", { expression: dismiss, returnByValue: true })).result?.result?.value;
    await sleep(1500);
    await send("Runtime.evaluate", { expression: "window.scrollTo(0,0)" });
    await sleep(400);
    const shot = await send("Page.captureScreenshot", { format: "png" });
    await sharp(Buffer.from(shot.result.data, "base64")).resize({ width: 560 }).webp({ quality: 80 }).toFile(`images/reel/${s.slug}.webp`);
    console.log("ok", s.slug, a ? `(clicked: ${a})` : "", b ? `(clicked: ${b})` : "");
  } catch (err) {
    console.log("FAIL", s.slug, err.message);
  }
}
ws.close(); chrome.kill();
