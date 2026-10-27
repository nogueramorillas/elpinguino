// Builds the anonymous projects showcase from a manifest (sectors + projects +
// shots, never client names). Writes:
//   - images/proyectos-mini/<sector>/<shot>.webp  light thumbnails for reel and gallery
//   - data/proyectos.json                          data the gallery loads on demand
//   - index.html                                   icebergs and reel, between marker comments
// Usage: node scripts/build-proyectos.mjs <manifest.json>
// The manifest can also be data/proyectos.json itself (extra fields are ignored).
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = process.argv[2];
if (!manifestPath) { console.error("Usage: node scripts/build-proyectos.mjs <manifest.json>"); process.exit(1); }
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

// Denis has more projects than the ones with captures: never show less than this.
const MIN_TOTAL = 67;

const TYPES = {
  web: "Web pública", tienda: "Tienda", reservas: "Reservas", admin: "Panel de administración",
  cliente: "Panel de cliente", app: "App", movil: "Vista móvil",
};

// Presentation of each sector: short name, noun for alt texts, iceberg layer,
// shape, position (% of the sea width: x desktop, xm mobile), which way the
// flag points (flip = towards the left, flipM on mobile) and extra pole length.
const LOOK = {
  motor:          { short: "Motor",        noun: "un negocio del motor",             layer: "front", shape: "b", x: 46, xm: 52, pole: 26, flipM: true },
  belleza:        { short: "Belleza",      noun: "un negocio de belleza",            layer: "front", shape: "a", x: 15, xm: 19 },
  restauracion:   { short: "Restauración", noun: "un restaurante o bar",             layer: "front", shape: "d", x: 79, xm: 83, flip: true, flipM: true },
  software:       { short: "Software",     noun: "un producto de software",          layer: "mid",   shape: "c", x: 61, xm: 50, pole: 24 },
  "para-llevar":  { short: "Para llevar",  noun: "un negocio de comida para llevar", layer: "mid",   shape: "d", x: 29, xm: 17 },
  empresas:       { short: "Empresas",     noun: "una empresa",                      layer: "mid",   shape: "a", x: 91, xm: 83, flip: true, flipM: true },
  deporte:        { short: "Deporte",      noun: "un proyecto deportivo",            layer: "far",   shape: "a", x: 40, xm: 47 },
  tiendas:        { short: "Tiendas",      noun: "una tienda online",                layer: "far",   shape: "c", x: 8,  xm: 17 },
  turismo:        { short: "Turismo",      noun: "un negocio de turismo",            layer: "far",   shape: "b", x: 73, xm: 83, flip: true, flipM: true },
};
const LAYER_SCALE = { front: 1, mid: 0.8, far: 0.64 };

// What sits "under the water" of each iceberg: captures of the tools the
// business uses every day (the public web and its mobile view are the tip).
const DEEP = [
  { key: "panel", one: "panel", many: "paneles", types: ["admin"] },
  { key: "cliente", one: "área cliente", many: "áreas cliente", types: ["cliente"] },
  { key: "reservas", one: "reserva", many: "reservas", types: ["reservas"] },
  { key: "app", one: "app", many: "apps", types: ["app"] },
];

// Small crops for the pills inside the statement sentence (must read at 100x50 px).
const PILLS = [
  { out: "images/proyectos-mini/pill-brasa.webp", file: "images/proyectos/restauracion/p06-web-2.webp", rect: [750, 330, 600, 300] },
  { out: "images/proyectos-mini/pill-agenda.webp", file: "images/proyectos/belleza/p15-reservas.webp", rect: [180, 410, 480, 240] },
];

// Iceberg shapes: viewBox 0 0 240 300, waterline at y=110.
const SHAPES = {
  a: {
    body: "M18 110 L4 158 L22 228 L72 284 L140 296 L200 262 L236 196 L230 140 L224 110 Z",
    facets: "M18 110 L64 176 L22 228 M64 176 L140 296 M64 176 L176 150 L236 196 M176 150 L224 110",
    shade: "M112 22 L136 48 L160 40 L196 86 L224 110 L124 110 Z",
    mid: "M112 22 L124 110 L152 110 L136 48 Z",
    light: "M18 110 L52 70 L78 78 L112 22 L124 110 Z",
    edge: "M18 110 L52 70 L78 78 L112 22 L136 48 L160 40 L196 86 L224 110",
  },
  b: {
    body: "M14 110 L6 170 L34 246 L96 292 L170 286 L222 236 L238 168 L226 110 Z",
    facets: "M14 110 L70 190 L34 246 M70 190 L96 292 M70 190 L160 170 L222 236 M160 170 L226 110",
    shade: "M130 18 L160 60 L186 72 L226 110 L118 110 Z",
    mid: "M64 30 L88 58 L104 50 L130 18 L118 110 L80 110 Z",
    light: "M14 110 L40 62 L64 30 L80 110 Z",
    edge: "M14 110 L40 62 L64 30 L88 58 L104 50 L130 18 L160 60 L186 72 L226 110",
  },
  c: {
    body: "M10 110 L0 150 L18 220 L80 280 L160 290 L220 250 L240 180 L230 110 Z",
    facets: "M10 110 L60 170 L18 220 M60 170 L160 290 M60 170 L180 160 L240 180 M180 160 L230 110",
    shade: "M120 42 L150 40 L190 48 L214 70 L230 110 L104 110 Z",
    mid: "M60 44 L120 42 L104 110 L70 110 Z",
    light: "M10 110 L28 52 L60 44 L70 110 Z",
    edge: "M10 110 L28 52 L60 44 L150 40 L190 48 L214 70 L230 110",
  },
  d: {
    body: "M30 110 L12 156 L28 222 L84 280 L156 292 L214 248 L234 176 L212 110 Z",
    facets: "M30 110 L80 180 L28 222 M80 180 L156 292 M80 180 L170 160 L234 176 M170 160 L212 110",
    shade: "M118 6 L132 40 L150 62 L176 70 L212 110 L112 110 Z",
    mid: "M100 36 L118 6 L112 110 L84 110 L70 80 Z",
    light: "M30 110 L70 80 L84 110 Z",
    edge: "M30 110 L70 80 L100 36 L118 6 L132 40 L150 62 L176 70 L212 110",
  },
};

const rel = (p) => p.split("\\").join("/");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const miniPath = (file) => file.replace(/^images\/proyectos\//, "images/proyectos-mini/");

// ---- 1. validate ----
const sectors = manifest.sectors;
const projects = manifest.projects;
const errors = [];
for (const s of sectors) {
  if (!LOOK[s.slug]) errors.push(`Sector sin aspecto definido en LOOK: ${s.slug}`);
  const n = projects.filter((p) => p.sector === s.slug).length;
  if (n !== s.count) errors.push(`Sector ${s.slug}: count ${s.count} pero hay ${n} proyectos`);
}
const shots = projects.flatMap((p) => p.shots.map((s) => ({ ...s, project: p })));
for (const s of shots) {
  if (!/^images\/proyectos\/[a-z-]+\/[a-z0-9-]+\.webp$/.test(s.file)) errors.push(`Ruta rara: ${s.file}`);
  else if (!existsSync(join(root, s.file))) errors.push(`Falta: ${s.file}`);
  if (!TYPES[s.type]) errors.push(`Tipo desconocido ${s.type} en ${s.file}`);
}
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }

const walk = (d) => (existsSync(d) ? readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]) : []);
const wanted = new Set(shots.map((s) => s.file));
const strays = walk(join(root, "images/proyectos")).map((f) => rel(f).slice(rel(root).length + 1)).filter((f) => !wanted.has(f));
if (strays.length) console.warn("AVISO: estos archivos de images/proyectos no están en el manifiesto y se publicarían:\n  " + strays.join("\n  "));

// ---- 2. thumbnails ----
const meta = {};
for (const s of shots) {
  const src = join(root, s.file);
  const out = join(root, miniPath(s.file));
  const m = await sharp(src).metadata();
  const width = s.device === "mobile" ? 360 : 640;
  if (!existsSync(out) || statSync(out).mtimeMs < statSync(src).mtimeMs) {
    mkdirSync(dirname(out), { recursive: true });
    await sharp(src).resize({ width, withoutEnlargement: true }).webp({ quality: 70, effort: 5 }).toFile(out);
  }
  const t = await sharp(out).metadata();
  meta[s.file] = { w: m.width, h: m.height, tw: t.width, th: t.height };
}
for (const p of PILLS) {
  const src = join(root, p.file);
  const out = join(root, p.out);
  if (!existsSync(out) || statSync(out).mtimeMs < statSync(src).mtimeMs) {
    const [left, top, width, height] = p.rect;
    await sharp(src).extract({ left, top, width, height }).resize(240, 120).webp({ quality: 74, effort: 5 }).toFile(out);
  }
}
const minis = walk(join(root, "images/proyectos-mini")).map((f) => rel(f).slice(rel(root).length + 1));
const wantedMinis = new Set([...shots.map((s) => miniPath(s.file)), ...PILLS.map((p) => p.out)]);
for (const f of minis) if (!wantedMinis.has(f)) { unlinkSync(join(root, f)); console.log("miniatura sobrante borrada:", f); }

// ---- 3. data/proyectos.json ----
const total = projects.length;
const data = {
  total,
  display: Math.max(MIN_TOTAL, total),
  types: TYPES,
  sectors: sectors.map((s) => ({ slug: s.slug, name: s.name, short: LOOK[s.slug].short, noun: LOOK[s.slug].noun, blurb: s.blurb, count: s.count })),
  projects: projects.map((p) => ({
    id: p.id, sector: p.sector, label: p.label, built: p.built,
    shots: p.shots.map((s) => ({ file: s.file, w: meta[s.file].w, h: meta[s.file].h, type: s.type, device: s.device, caption: s.caption })),
  })),
};
mkdirSync(join(root, "data"), { recursive: true });
writeFileSync(join(root, "data/proyectos.json"), JSON.stringify(data));

// ---- 4. index.html snippets ----
const fmt = (n) => Number(n.toFixed(3));
const sizeOf = (s) => LAYER_SCALE[LOOK[s.slug].layer] * (0.6 + 0.4 * Math.sqrt(s.count / 12));
const delayOf = (s) => -((sectors.indexOf(s) * 2.3) % 7.5); // out of phase, so they never bob in sync
const deepOf = (s) => {
  const list = shots.filter((x) => x.project.sector === s.slug);
  return DEEP.map((d) => ({ ...d, n: list.filter((x) => d.types.includes(x.type)).length }))
    .filter((d) => d.n > 0).sort((a, b) => b.n - a.n);
};
// Labels drawn under the waterline of each iceberg (above the water layer, so they stay readable).
const deepHtml = (s) => {
  const look = LOOK[s.slug];
  const items = deepOf(s).slice(0, 3);
  if (!items.length) return "";
  return `      <span class="berg-deep" data-sector="${s.slug}" style="--x:${look.x}%;--xm:${look.xm}%;--s:${fmt(sizeOf(s))};--delay:${fmt(delayOf(s))}s" aria-hidden="true">${
    items.map((d, i) => `<i style="--i:${i}"><b>${d.n}</b> ${esc(d.n === 1 ? d.one : d.many)}</i>`).join("")}</span>`;
};
const bergHtml = (s, i) => {
  const look = LOOK[s.slug];
  const sh = SHAPES[look.shape];
  const size = sizeOf(s);
  const delay = delayOf(s);
  const nShots = shots.filter((x) => x.project.sector === s.slug).length;
  const under = deepOf(s).map((d) => `${d.n} ${d.n === 1 ? d.one : d.many}`).join(", ");
  const penguin = s.slug === "motor"
    ? `\n          <img class="berg-penguin" src="images/pinguino-explorador.webp?v=2" alt="" width="160" height="160" loading="lazy" decoding="async">`
    : "";
  return `      <button type="button" class="berg berg--${look.shape}" data-sector="${s.slug}" style="--x:${look.x}%;--xm:${look.xm}%;--s:${fmt(size)};--delay:${fmt(delay)}s;--pole:${look.pole || 0}px"${look.flip ? " data-flip" : ""}${look.flipM ? " data-flip-m" : ""} aria-haspopup="dialog" aria-controls="dive" aria-label="${esc(s.name)}: ${s.count} proyectos, ${nShots} capturas${under ? ` (${esc(under)})` : ""}. Ver capturas">
        <span class="berg-float">
          <svg class="berg-ice" viewBox="0 0 240 300" aria-hidden="true" focusable="false">
            <path class="ice-body" d="${sh.body}"/><path class="ice-facets" d="${sh.facets}"/>
            <path class="ice-shade" d="${sh.shade}"/><path class="ice-mid" d="${sh.mid}"/><path class="ice-light" d="${sh.light}"/><path class="ice-edge" d="${sh.edge}"/>
          </svg>${penguin}
          <span class="berg-flag" aria-hidden="true"><span>${esc(look.short)}</span></span>
          <span class="berg-count" aria-hidden="true">${s.count}</span>
        </span>
      </button>`;
};
const layerHtml = (layer) => {
  const list = sectors.filter((s) => LOOK[s.slug].layer === layer).sort((a, b) => b.count - a.count);
  return `    <div class="sea-layer sea-layer--${layer}" data-depth="${{ front: 1, mid: 0.55, far: 0.25 }[layer]}">
${list.map(bergHtml).join("\n")}
      <div class="sea-water" aria-hidden="true"><span class="sea-wave"></span></div>
${list.map(deepHtml).filter(Boolean).join("\n")}
    </div>`;
};
const bergsBlock = ["front", "mid", "far"].map(layerHtml).join("\n");

// Reel: desktop captures, one per project, round-robin across sectors.
const pickable = (s) => s.device === "desktop" && meta[s.file].w === 1400 && meta[s.file].h === 875;
const prefer = ["web", "tienda", "app", "reservas", "admin", "cliente"];
const queues = sectors.map((sec) => projects.filter((p) => p.sector === sec.slug).map((p) => {
  const opts = p.shots.filter(pickable).sort((a, b) => prefer.indexOf(a.type) - prefer.indexOf(b.type));
  return opts[0] ? { ...opts[0], sector: sec.slug } : null;
}).filter(Boolean));
const picks = [];
for (let round = 0; picks.length < 24 && queues.some((q) => q.length > round); round++) {
  for (const q of queues) if (q[round] && picks.length < 24) picks.push(q[round]);
}
const cols = [[], [], []];
// rotate per round so each column mixes sectors
picks.forEach((p, i) => cols[(i + Math.floor(i / sectors.length)) % 3].push(p));
// Each card is a block of ice with a capture frozen inside; it opens the
// gallery of its sector right on that capture.
const SHORT_TYPE = { web: "web", tienda: "tienda", reservas: "reservas", admin: "panel", cliente: "área cliente", app: "app", movil: "móvil" };
const reelCard = (p, dup) => {
  const sec = sectors.find((s) => s.slug === p.sector);
  const m = meta[p.file];
  const label = `Captura de ${TYPES[p.type].toLowerCase()} de ${LOOK[sec.slug].noun}. Abrir la galería de ${LOOK[sec.slug].short}`;
  const a11y = dup ? ' tabindex="-1" aria-hidden="true"' : ` aria-label="${esc(label)}" aria-haspopup="dialog" aria-controls="dive"`;
  return `          <button type="button" class="reel-card" data-sector="${sec.slug}" data-file="${p.file}"${a11y}><img src="${miniPath(p.file)}" srcset="${miniPath(p.file)} ${m.tw}w, ${p.file} ${m.w}w" sizes="(max-width: 600px) 46vw, (max-width: 980px) 31vw, 380px" alt="" width="${m.tw}" height="${m.th}" loading="lazy" decoding="async"><span class="reel-label"><strong>${esc(LOOK[sec.slug].short)}</strong><small>${esc(SHORT_TYPE[p.type])}</small></span></button>`;
};
const reelBlock = cols.map((col, i) => `      <div class="reel-col reel-col-${i + 1}">
        <div class="reel-track">
${col.map((p) => reelCard(p, false)).join("\n")}
${col.map((p) => reelCard(p, true)).join("\n")}
        </div>
      </div>`).join("\n");

const replaceBetween = (html, name, block) => {
  const re = new RegExp(`(<!-- ${name}:start -->)[\\s\\S]*?(<!-- ${name}:end -->)`);
  if (!re.test(html)) throw new Error(`No encuentro los marcadores ${name}:start / ${name}:end en index.html`);
  return html.replace(re, (_, a, b) => `${a}\n${block}\n${b}`);
};
let html = readFileSync(join(root, "index.html"), "utf8");
html = replaceBetween(html, "bergs", bergsBlock);
html = replaceBetween(html, "reel", reelBlock);
// Counters shown around the page. "+N" (never less than MIN_TOTAL) only appears
// once, in the big block of ice; next to it, how it splits between the icebergs
// and the projects that are private or still in progress. The statement shows
// the number of sectors instead, so the figure is not repeated.
const D = data.display;
const rest = D - total;
const split = rest > 0
  ? `<b>${total}</b> flotan aquí · <b>${rest}</b> más son privados o están en marcha`
  : `<b>${total}</b> flotan aquí`;
html = html
  .replace(/data-text="\+\d+" aria-hidden="true">\+\d+</, `data-text="+${D}" aria-hidden="true">+${D}<`)
  .replace(/<span class="sr-only">Más de \d+ <\/span>/, `<span class="sr-only">Más de ${D} </span>`)
  .replace(/<span class="glaciar-split">[\s\S]*?<\/span>/, `<span class="glaciar-split">${split}</span>`)
  .replace(/<strong data-count="\d+" data-sectors>\d+<\/strong>/, `<strong data-count="${sectors.length}" data-sectors>${sectors.length}</strong>`)
  .replace(/Aquí flotan <strong>\d+<\/strong>/, `Aquí flotan <strong>${total}</strong>`);
writeFileSync(join(root, "index.html"), html);

const bytes = (fs) => fs.reduce((a, f) => a + statSync(join(root, f)).size, 0);
console.log(JSON.stringify({
  proyectos: total, mostrado: `+${data.display}`, capturas: shots.length,
  miniaturasKB: Math.round(bytes([...wantedMinis]) / 1024),
  reel: picks.length, jsonKB: Math.round(statSync(join(root, "data/proyectos.json")).size / 1024),
}));
