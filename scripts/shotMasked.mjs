// Anonymised screenshot for the projects showcase. Opens a page in headless
// Chrome, optionally runs login/navigation steps, blurs every trace of the
// client (brand words, logos, contact data, maps, social links) and writes a
// webp. Nothing identifying may survive: a human/agent still checks each shot.
//
// Usage: node scripts/shotMasked.mjs <spec.json>
// spec = {
//   url, out,                      // out = path of the .webp to write
//   width: 1440, height: 900,      // viewport (CSS px)
//   mobile: false, scale: 1,       // mobile emulation + deviceScaleFactor
//   outWidth: 1200,                // resize result to this width
//   terms: ["Brand", "brand.com"], // words to blur wherever they appear (accent/case-insensitive)
//   maskSelectors: [], hideSelectors: [],  // extra CSS selectors to blur / hide
//   steps: [ {goto:url} | {click:sel} | {clickText:regex} | {fill:sel, value|valueEnv} | {press:"Enter"} | {wait:ms} | {scrollTo:sel} | {scrollY:px} ],
//   waitMs: 4500
// }
import { spawn } from "node:child_process";
import { readFileSync, mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import sharp from "sharp";

const spec = JSON.parse(readFileSync(process.argv[2], "utf8"));
const W = spec.width ?? 1440, H = spec.height ?? 900;
mkdirSync(dirname(spec.out), { recursive: true });

const port = 9300 + Math.floor(Math.random() * 600);
const chrome = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", [
  "--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "cdp-"))}`,
  "--hide-scrollbars", "--disable-gpu", "--no-first-run", "--lang=es-ES", "about:blank",
], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 60 && !target; i++) {
  await sleep(200);
  try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page"); } catch {}
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0; const pending = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;

await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: spec.scale ?? 1, mobile: !!spec.mobile });
if (spec.mobile) await send("Emulation.setUserAgentOverride", { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" });
await send("Page.enable");

const dismiss = `(()=>{const b=[...document.querySelectorAll('button,a,[role=button]')].filter(x=>x.offsetParent&&x.children.length<3);
  const h=b.find(x=>/^(rechazar|denegar|solo necesarias|rebutjar|reject|aceptar|acceptar|accept|entendido|continuar|cerrar|close|×|✕)$/i.test((x.innerText||x.getAttribute('aria-label')||'').trim()));
  if(h){h.click();return true}return false})()`;

const MASK = (terms, maskSel, hideSel) => `(()=>{
  const norm=s=>(s||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();
  const T=${JSON.stringify(terms)}.map(norm).filter(t=>t.length>1);
  const Tc=T.map(t=>t.replace(/[^a-z0-9]/g,'')).filter(t=>t.length>2);
  if(!document.getElementById('__maskcss')){const st=document.createElement('style');st.id='__maskcss';
    st.textContent='.__mask{filter:blur(7px)!important;user-select:none}.__maskimg{filter:blur(16px) saturate(.5)!important}';document.head.appendChild(st);}
  const contact=/(\\+?\\d[\\d .-]{7,}\\d)|([\\w.+-]+@[\\w-]+\\.[\\w.]+)|(@[\\w.]{3,})|(https?:\\/\\/\\S+)|(\\b[\\w-]+\\.(com|es|cat|pro|net|org|app|eu|shop|store)\\b)/i;
  const hit=v=>{const n=norm(v),c=n.replace(/[^a-z0-9]/g,'');return T.some(t=>n.includes(t))||Tc.some(t=>c.includes(t))};
  const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const nodes=[];while(w.nextNode())nodes.push(w.currentNode);
  for(const n of nodes){const p=n.parentElement;if(!p||/^(SCRIPT|STYLE|NOSCRIPT)$/.test(p.tagName)||p.closest('.__mask'))continue;
    if(n.nodeValue.trim()&&(hit(n.nodeValue)||contact.test(n.nodeValue))){const s=document.createElement('span');s.className='__mask';n.parentNode.insertBefore(s,n);s.appendChild(n);}}
  // brand split across several elements ("ACME" + "BURGER"): blur the smallest block whose text contains it
  const blocks=[...document.body.querySelectorAll('*')].filter(e=>{if(/^(SCRIPT|STYLE|NOSCRIPT|HTML|BODY)$/.test(e.tagName))return false;
    const t=e.innerText||e.textContent||'';return t.length<=160&&hit(t)});
  blocks.filter(e=>!blocks.some(o=>o!==e&&e.contains(o))).forEach(e=>e.classList.add('__mask'));
  document.querySelectorAll('input,textarea,select').forEach(i=>{if(hit(i.value)||hit(i.placeholder)||contact.test(i.value||''))i.classList.add('__mask')});
  document.querySelectorAll('img,svg,picture,video,canvas,[style*="background-image"]').forEach(el=>{
    const a=el.closest('a');const s=[el.getAttribute('alt'),el.getAttribute('src'),el.getAttribute('srcset'),el.getAttribute('class'),el.id,el.getAttribute('aria-label'),a&&a.getAttribute('aria-label'),a&&a.getAttribute('href')].join(' ');
    if(/logo|brand|isotipo|imagotipo|marca/i.test(s)||el.closest('[class*=logo],[id*=logo],[class*=Logo],[class*=brand],[class*=Brand]')||hit(s))el.classList.add('__maskimg');});
  document.querySelectorAll('header a[href="/"],nav a[href="/"],a[href="./"],a[href="index.html"],a[href="#inicio"],a[href="#top"]').forEach(a=>a.querySelectorAll('img,svg').forEach(e=>e.classList.add('__maskimg')));
  document.querySelectorAll('a[href^="tel:"],a[href^="mailto:"],a[href*="wa.me"],a[href*="whatsapp"],a[href*="instagram.com"],a[href*="facebook.com"],a[href*="tiktok.com"],a[href*="maps"],a[href*="x.com"],a[href*="twitter.com"],a[href*="youtube.com"],a[href*="linkedin.com"]').forEach(a=>a.classList.add('__mask'));
  document.querySelectorAll('iframe').forEach(f=>f.classList.add('__maskimg'));
  ${JSON.stringify(maskSel)}.forEach(q=>{try{document.querySelectorAll(q).forEach(e=>e.classList.add('__mask'))}catch(e){}});
  document.querySelectorAll('.__mask').forEach(e=>{const fs=parseFloat(getComputedStyle(e).fontSize)||14;e.style.setProperty('filter','blur('+Math.max(7,Math.round(fs*0.5))+'px)','important')});
  ${JSON.stringify(hideSel)}.forEach(q=>{try{document.querySelectorAll(q).forEach(e=>e.style.setProperty('visibility','hidden','important'))}catch(e){}});
  return true})()`;

try {
  await send("Page.navigate", { url: spec.url });
  await sleep(spec.waitMs ?? 4500);
  for (let i = 0; i < 2; i++) { if (await evaluate(dismiss)) await sleep(900); }
  for (const s of spec.steps ?? []) {
    if (s.goto) { await send("Page.navigate", { url: s.goto }); await sleep(s.wait ?? 3500); }
    else if (s.click) { await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(s.click)});if(e){e.click();return 1}return 0})()`); await sleep(s.wait ?? 1500); }
    else if (s.clickText) { await evaluate(`(()=>{const re=new RegExp(${JSON.stringify(s.clickText)},'i');const e=[...document.querySelectorAll('button,a,[role=button],[role=tab],li,label')].find(x=>x.offsetParent&&re.test((x.innerText||'').trim()));if(e){e.click();return 1}return 0})()`); await sleep(s.wait ?? 1500); }
    else if (s.fill) {
      const value = s.valueEnv ? (process.env[s.valueEnv] ?? "") : (s.value ?? "");
      await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(s.fill)});if(!e)return 0;e.focus();const p=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(e),'value');p.set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return 1})()`);
      await sleep(s.wait ?? 300);
    }
    else if (s.press) { await send("Input.dispatchKeyEvent", { type: "keyDown", key: s.press, code: s.press, windowsVirtualKeyCode: s.press === "Enter" ? 13 : 0 }); await send("Input.dispatchKeyEvent", { type: "keyUp", key: s.press, code: s.press }); await sleep(s.wait ?? 2500); }
    else if (s.wait) { await sleep(s.wait); }
    else if (s.scrollTo) { await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(s.scrollTo)});if(e)e.scrollIntoView({block:'start'});return 1})()`); await sleep(s.waitAfter ?? 1500); }
    else if (s.scrollY !== undefined) { await evaluate(`window.scrollTo(0,${Number(s.scrollY)})`); await sleep(s.waitAfter ?? 1500); }
  }
  await evaluate(dismiss);
  const mask = MASK(spec.terms ?? [], spec.maskSelectors ?? [], spec.hideSelectors ?? []);
  await evaluate(mask); await sleep(700); await evaluate(mask); await sleep(500);
  const shot = await send("Page.captureScreenshot", { format: "png" });
  if (!shot.result?.data) throw new Error("no screenshot data");
  await sharp(Buffer.from(shot.result.data, "base64")).resize({ width: spec.outWidth ?? 1200 }).webp({ quality: 82 }).toFile(spec.out);
  console.log("ok", spec.out);
} catch (err) {
  console.log("FAIL", err.message);
  process.exitCode = 1;
} finally {
  ws.close(); chrome.kill();
}
