document.getElementById("year").textContent = new Date().getFullYear();

// Header gets a soft shadow once the page scrolls
const siteHeader = document.querySelector(".site-header");
const updateHeader = () => siteHeader.classList.toggle("is-scrolled", window.scrollY > 8);
updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Fade-up sections and cards as they enter the viewport. The hidden state only
// applies under .js-reveal, so without JS (or IntersectionObserver) nothing is hidden.
// With reduced motion the CSS keeps the fade but drops the slide.
(function () {
  if (!("IntersectionObserver" in window)) return;

  const groups = [
    [".section-heading", 0],
    [".statement-text", 0],
    [".statement-stats > div", 90],
    
    [".service-card", 80],
    [".social-banner", 0],
    [".services-perks", 0],
    [".services-cta", 0],
    [".process-steps li", 90],
    [".faq-list details", 60],
    [".cta-x-box", 0],
  ];

  const targets = [];
  groups.forEach(([selector, step]) => {
    document.querySelectorAll(selector).forEach((el, i) => {
      el.classList.add("reveal");
      if (step) el.style.setProperty("--reveal-delay", `${(i % 6) * step}ms`);
      targets.push(el);
    });
  });

  document.documentElement.classList.add("js-reveal");

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add("is-visible");
      io.unobserve(el);
      // Once the entrance finishes, drop the reveal classes so the element's own
      // transitions (e.g. card hover lift) apply again without the reveal delay.
      const delay = parseInt(el.style.getPropertyValue("--reveal-delay"), 10) || 0;
      setTimeout(() => {
        el.classList.remove("reveal", "is-visible");
        el.style.removeProperty("--reveal-delay");
      }, 750 + delay);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

  targets.forEach((el) => io.observe(el));
}());

const navToggle = document.getElementById("navToggle");
const mainNav = document.getElementById("mainNav");

navToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

mainNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

// The services dropdown only exists on the home page; service pages link directly.
const dropdownBtn = document.getElementById("servDropdownBtn");
if (dropdownBtn) {
  const dropdown = dropdownBtn.closest(".nav-dropdown");

  dropdownBtn.addEventListener("click", (event) => {
    event.preventDefault();
    const isOpen = dropdown.classList.toggle("open");
    dropdownBtn.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (event) => {
    if (!dropdown.contains(event.target)) {
      dropdown.classList.remove("open");
      dropdownBtn.setAttribute("aria-expanded", "false");
    }
  });
}

// Mobile footprints for process steps — fill on scroll, never hides content
(function () {
  if (!('IntersectionObserver' in window)) return;

  var FP = '<svg class="fp" viewBox="0 0 44 56" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">'
    + '<ellipse cx="9"  cy="14" rx="6" ry="9"  transform="rotate(-18 9 14)"/>'
    + '<ellipse cx="22" cy="8"  rx="6" ry="9"/>'
    + '<ellipse cx="35" cy="14" rx="6" ry="9"  transform="rotate(18 35 14)"/>'
    + '<ellipse cx="22" cy="42" rx="16" ry="17"/>'
    + '</svg>';

  document.querySelectorAll('.process-steps .process-dot').forEach(function (dot, i) {
    var icon = dot.querySelector('svg');
    if (icon) icon.classList.add('dot-icon');
    dot.insertAdjacentHTML('afterbegin', FP);
    if (i % 2 === 1) dot.querySelector('.fp').style.transform = 'scaleX(-1)';
  });

  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var dot = e.target.querySelector('.process-dot');
      if (!dot) return;
      if (e.isIntersecting) {
        dot.classList.add('fp-lit');
      } else if (e.boundingClientRect.top > 0) {
        dot.classList.remove('fp-lit');
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.process-steps li').forEach(function (li) { obs.observe(li); });
}());

// ===== Rotating word in the hero headline =====
(function () {
  const el = document.querySelector(".rotator");
  if (!el) return;
  const words = el.dataset.words.split("|");
  let i = 0;
  setInterval(() => {
    el.classList.add("is-out");
    setTimeout(() => {
      i = (i + 1) % words.length;
      el.textContent = words[i];
      el.classList.remove("is-out");
      el.classList.add("is-in");
      void el.offsetWidth; // restart the transition from the "in" position
      el.classList.remove("is-in");
    }, 280);
  }, 2400);
}());

// ===== Hero penguin talks: rotating speech bubble, click for the next line =====
(function () {
  const bubble = document.getElementById("heroBubble");
  const messages = [
    'Hola 👋<br><strong>Yo me encargo.</strong>',
    '¿Tu web es de 2010? 😅<br><strong>La ponemos al día.</strong>',
    '¿El ordenador va a pedales?<br><strong>Lo dejamos volando.</strong>',
    '¿El WiFi no llega?<br><strong>Eso tiene solución.</strong>',
    '¿Quieres vender online?<br><strong>Montamos tu tienda.</strong>',
    '¡Pínchame! 🐧<br><strong>No muerdo.</strong>',
  ];
  let msg = 0;

  const say = (html) => {
    if (!bubble) return;
    bubble.classList.add("is-swapping");
    setTimeout(() => {
      bubble.innerHTML = html;
      bubble.classList.remove("is-swapping");
    }, 220);
  };
  const nextMessage = () => { msg = (msg + 1) % messages.length; say(messages[msg]); };

  let autoTalk = setInterval(nextMessage, 4500);

  const heroPenguin = document.getElementById("heroPenguin");
  if (heroPenguin) {
    heroPenguin.style.cursor = "pointer";
    heroPenguin.addEventListener("click", () => {
      nextMessage();
      clearInterval(autoTalk); // user is reading: give them more time
      autoTalk = setInterval(nextMessage, 6000);
    });
  }
}());

// ===== Stats count up when they scroll into view =====
(function () {
  const nums = document.querySelectorAll("[data-count]");
  if (!nums.length || !("IntersectionObserver" in window)) return;
  const run = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const prefix = el.dataset.prefix || "";
    const start = performance.now();
    const dur = 1400;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = prefix + (target * eased).toFixed(decimals);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.6 });
  nums.forEach((n) => io.observe(n));
}());

// ===== Cursor spotlight on service cards =====
document.querySelectorAll(".service-card").forEach((card) => {
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
});


// ===== Hero idea box: type what you need, send it straight to WhatsApp =====
(function () {
  const form = document.getElementById("ideaBox");
  if (!form) return;
  const input = document.getElementById("ideaInput");

  const examples = [
    "Quiero una web para mi restaurante con reservas…",
    "Necesito una tienda online para vender ropa…",
    "El ordenador de la oficina va lentísimo…",
    "El WiFi no llega a la sala del fondo…",
    "Quiero que me llevéis Instagram y TikTok…",
  ];
  let i = 0;
  setInterval(() => {
    if (document.activeElement === input || input.value) return;
    i = (i + 1) % examples.length;
    input.placeholder = examples[i];
  }, 3200);

  form.querySelectorAll("[data-idea]").forEach((chip) => {
    chip.addEventListener("click", () => {
      input.value = chip.dataset.idea + ": ";
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    });
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) {
      form.classList.remove("shake"); void form.offsetWidth; form.classList.add("shake");
      input.focus();
      return;
    }
    const msg = "Hola, vengo de vuestra web 🐧\n\n" + text;
    window.open("https://wa.me/34624403792?text=" + encodeURIComponent(msg), "_blank", "noopener");
  });
}());

// ===== Professional micro-interactions =====
(function () {
  const reduce = prefersReducedMotion;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // 1) Scroll progress bar
  const bar = document.createElement("div");
  bar.className = "scroll-progress";
  document.body.appendChild(bar);
  const setBar = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
  };
  setBar();
  addEventListener("scroll", setBar, { passive: true });
  addEventListener("resize", setBar);

  // Split an element's text nodes into word spans (keeps inner tags like <em>)
  const splitWords = (root) => {
    const words = [];
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const s = document.createElement("span");
            s.className = "w";
            s.textContent = part;
            frag.appendChild(s);
            words.push(s);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && !child.matches("img, svg, .pill-img")) {
          walk(child);
        }
      });
    };
    walk(root);
    return words;
  };

  // 2) Statement lights up word by word while scrolling through it
  const statement = document.querySelector(".statement-text");
  if (statement) {
    statement.classList.remove("reveal");
    const words = splitWords(statement);
    statement.classList.add("scrub");
    const update = () => {
      const r = statement.getBoundingClientRect();
      const start = innerHeight * 0.85, end = innerHeight * 0.35;
      const p = Math.min(1, Math.max(0, (start - r.top) / (start - end + r.height * 0.6)));
      const lit = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle("on", i < lit));
    };
    update();
    addEventListener("scroll", update, { passive: true });
  }

  // 3) Section titles rise in word by word. Checked on scroll/load (not only
  // IntersectionObserver) so a title can never stay hidden.
  {
    const titles = [...document.querySelectorAll(".section-heading h2, .faq-right h2, .why-x h2, .asesor-copy h2, .cta-x h2, .page-hero h1")];
    titles.forEach((t) => {
      splitWords(t).forEach((w, i) => w.style.setProperty("--d", `${i * 55}ms`));
      t.classList.add("words");
    });
    const check = () => {
      titles.forEach((t) => {
        if (t.classList.contains("words-in")) return;
        if (t.getBoundingClientRect().top < innerHeight * 0.9) t.classList.add("words-in");
      });
    };
    check();
    addEventListener("scroll", check, { passive: true });
    addEventListener("load", check);
    setTimeout(() => titles.forEach((t) => { if (t.getBoundingClientRect().top < innerHeight) t.classList.add("words-in"); }), 1500);
  }

  // 4) Subtle 3D tilt on cards (desktop only)
  if (fine) {
    document.querySelectorAll(".service-card, .stack-card").forEach((card) => {
      card.classList.add("tilt");
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty("--rx", `${(-y * 5).toFixed(2)}deg`);
        card.style.setProperty("--ry", `${(x * 6).toFixed(2)}deg`);
      });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
  }
}());

// ===== Proyectos: archipiélago de témpanos + galería por sector =====
// The icebergs (one per sector) are static buttons in index.html. The captures
// come from data/proyectos.json, which is anonymous: no client names, logos,
// links or contact data. Thumbnails load first; full-size images only open
// in the lightbox.
(function () {
  const section = document.getElementById("proyectos");
  const sea = document.getElementById("sea");
  const dive = document.getElementById("dive");
  if (!section || !sea || !dive || typeof dive.showModal !== "function") return;

  const reduce = prefersReducedMotion;
  const DATA_URL = "data/proyectos.json?v=17p";
  const root = document.documentElement;
  const $ = (id) => document.getElementById(id);
  const track = $("diveTrack");
  const chips = $("diveSectors");
  const progress = $("diveProgress");
  const lb = $("diveLb");
  const lbFrame = $("lbFrame");
  const lbImg = $("lbImg");
  const stepBtns = [...dive.querySelectorAll("[data-dive-step]")];
  const underLb = [dive.querySelector(".dive-top"), chips, track, dive.querySelector(".dive-bar")];

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));
  const thumbOf = (file) => file.replace("images/proyectos/", "images/proyectos-mini/");
  const pad = (n) => String(n).padStart(2, "0");
  const smooth = reduce ? "auto" : "smooth";

  let data = null;
  let dataPromise = null;
  const loadData = () => dataPromise || (dataPromise = fetch(DATA_URL)
    .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then((d) => (data = d))
    .catch((err) => { dataPromise = null; throw err; }));

  // ---- 1. Entrance (icebergs rise from the water) + prefetch of the data ----
  const bergs = [...sea.querySelectorAll(".berg")];
  if ("IntersectionObserver" in window) {
    if (!reduce) {
      const order = { far: 0, mid: 1, front: 2 };
      bergs.forEach((b) => {
        const layer = b.closest(".sea-layer");
        const row = order[(layer.className.match(/sea-layer--(\w+)/) || [])[1]] || 0;
        const i = [...layer.querySelectorAll(".berg")].indexOf(b);
        b.style.setProperty("--rise", `${row * 220 + i * 110}ms`);
      });
      section.classList.add("is-armed");
    }
    const once = (target, options, fn) => {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { fn(); io.disconnect(); }
      }, options);
      io.observe(target);
    };
    once(section.querySelector(".glaciar-head"), { threshold: 0.2 }, () => section.classList.add("head-in"));
    once(sea, { threshold: 0.18 }, () => section.classList.add("is-in"));
    once(section, { rootMargin: "900px 0px" }, () => loadData().catch(() => {}));
  }

  // ---- 2. Parallax: the three water layers move at different speeds ----
  if (!reduce) {
    const layers = [...sea.querySelectorAll(".sea-layer")];
    let mx = 0;
    let raf = 0;
    const paint = () => {
      raf = 0;
      const r = sea.getBoundingClientRect();
      if (r.bottom < -120 || r.top > innerHeight + 120) return;
      const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      layers.forEach((l) => {
        const d = parseFloat(l.dataset.depth) || 0;
        l.style.translate = `${(mx * d * -18).toFixed(1)}px ${(p * d * 44).toFixed(1)}px`;
      });
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(paint); };
    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", queue);
    if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
      sea.addEventListener("pointermove", (e) => {
        const r = sea.getBoundingClientRect();
        mx = ((e.clientX - r.left) / r.width) * 2 - 1;
        queue();
      });
      sea.addEventListener("pointerleave", () => { mx = 0; queue(); });
    }
    queue();
  }

  // ---- 3. Gallery of a sector ----
  let current = null; // { slug, shots: [] }
  let opener = null;
  let pushed = false;   // history entry of the open gallery
  let lbPushed = false; // history entry of the enlarged capture
  let closing = false;
  let lbIndex = -1;
  let shotEls = [];
  const blurb = $("diveBlurb");
  const infoBtn = $("diveInfo");

  const loadImg = (img) => {
    if (!img.dataset.src) return;
    if (img.dataset.srcset) {
      img.sizes = img.dataset.sizes || "";
      img.srcset = img.dataset.srcset;
      img.removeAttribute("data-srcset");
      img.removeAttribute("data-sizes");
    }
    img.src = img.dataset.src;
    img.removeAttribute("data-src");
  };
  const lazy = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { loadImg(e.target); lazy.unobserve(e.target); } });
      }, { root: track, rootMargin: "0px 1200px" })
    : null;
  const markLoaded = (e) => { if (e.target.tagName === "IMG") e.target.classList.add("is-loaded"); };
  track.addEventListener("load", markLoaded, true);
  track.addEventListener("error", markLoaded, true);

  const sectorOf = (slug) => data.sectors.find((s) => s.slug === slug);
  const altFor = (type, sector) => `Captura de ${(data.types[type] || "pantalla").toLowerCase()} de ${sector.noun}`;
  const splitBuilt = (built) => built.split(/\s\+\s/).map((t) => t.trim()).filter(Boolean)
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1));
  const shorten = (t, max) => (t.length <= max ? t : `${t.slice(0, t.lastIndexOf(" ", max)).replace(/[,;:]$/, "")}…`);
  // Thumbnails first; on retina screens (or the taller phone frame) the browser picks the full capture.
  const SIZES_DESKTOP = "(max-width: 600px) 172vw, 560px";
  const SIZES_MOBILE = "(max-width: 600px) 60vw, 240px";
  const ICON_LOCK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5" stroke="currentColor" stroke-width="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="15.5" r="1.4" fill="currentColor"/></svg>';

  const renderChips = () => {
    chips.innerHTML = data.sectors.map((s) =>
      `<button type="button" data-sector="${esc(s.slug)}" aria-label="${esc(s.name)}: ${s.count} proyectos">${esc(s.short)} <b aria-hidden="true">${s.count}</b></button>`
    ).join("");
  };

  const setInfo = (show) => {
    infoBtn.setAttribute("aria-expanded", String(show));
    blurb.classList.toggle("is-open", show);
  };

  const render = (slug) => {
    const sector = sectorOf(slug);
    if (!sector) return false;
    const all = data.projects.filter((p) => p.sector === slug);
    const open = all.filter((p) => p.shots.length);
    const hidden = all.filter((p) => !p.shots.length);
    const shots = [];
    let k = 0;
    const nextK = () => Math.min(k++, 8);

    let html = open.map((p, i) => {
      const parts = splitBuilt(p.built);
      const card = `<div class="dive-card" style="--k:${nextK()}">
          <span class="dive-idx">${pad(i + 1)} / ${pad(all.length)}</span>
          <h3 id="dive-${esc(p.id)}">${esc(p.label)}</h3>
          <ul class="dive-built">${parts.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
          ${parts.length > 2 || p.built.length > 140 ? `<button type="button" class="dive-built-more" aria-expanded="false">Ver todo lo que incluye</button>` : ""}
          <p class="dive-more">${p.shots.length} ${p.shots.length === 1 ? "captura" : "capturas"}</p>
        </div>`;
      const figures = p.shots.map((s) => {
        const n = shots.push({ ...s, label: p.label }) - 1;
        const mobile = s.device === "mobile";
        const tw = mobile ? 360 : 640;
        const thumb = thumbOf(s.file);
        const typeName = data.types[s.type] || "Captura";
        return `<figure class="dive-shot" style="--k:${nextK()}">
          <button type="button" class="frame frame--${mobile ? "mobile" : "desktop"}" style="--ar:${(s.w / s.h).toFixed(4)}" data-shot="${n}" aria-label="Ampliar captura: ${esc(s.caption)}">
            ${mobile ? "" : "<span class=\"frame-bar\" aria-hidden=\"true\"><i></i><i></i><i></i><b></b></span>"}
            <span class="frame-screen"><img data-src="${esc(thumb)}" data-srcset="${esc(thumb)} ${tw}w, ${esc(s.file)} ${s.w}w" data-sizes="${mobile ? SIZES_MOBILE : SIZES_DESKTOP}" alt="${esc(altFor(s.type, sector))}" width="${tw}" height="${Math.round((tw * s.h) / s.w)}" decoding="async"></span>
          </button>
          <figcaption><span class="shot-type shot-type--${esc(s.type)}">${esc(typeName)}</span>${esc(s.caption)}</figcaption>
        </figure>`;
      }).join("");
      return `<article class="dive-project" aria-labelledby="dive-${esc(p.id)}">${card}${figures}</article>`;
    }).join("");

    // Private tools: counted, never shown. One compact card for all of them.
    if (hidden.length) {
      const from = open.length + 1;
      const idx = hidden.length === 1 ? pad(from) : `${pad(from)}–${pad(all.length)}`;
      html += `<article class="dive-project" aria-labelledby="dive-private">
        <div class="dive-card dive-card--private" style="--k:${nextK()}">
          <span class="dive-private-icon">${ICON_LOCK}</span>
          <span class="dive-idx">${idx} / ${pad(all.length)}</span>
          <h3 id="dive-private">${hidden.length} ${hidden.length === 1 ? "herramienta interna" : "herramientas internas"}</h3>
          <p class="dive-private-note">Productos privados o de uso interno: los contamos, pero no publicamos capturas.</p>
          <ul class="dive-private-list">${hidden.map((p) => `<li><strong>${esc(p.label)}</strong><span>${esc(shorten(splitBuilt(p.built)[0] || "", 96))}</span></li>`).join("")}</ul>
        </div>
      </article>`;
    }

    current = { slug, shots };
    $("diveTitle").textContent = sector.name;
    $("diveCount").textContent = all.length;
    $("diveShots").textContent = shots.length;
    blurb.textContent = sector.blurb;
    setInfo(false);
    chips.querySelectorAll("button").forEach((b) => b.setAttribute("aria-current", String(b.dataset.sector === slug)));

    dive.classList.remove("is-filled");
    if (lazy) lazy.disconnect();
    track.innerHTML = html;
    track.scrollLeft = 0;
    void track.offsetWidth;
    dive.classList.add("is-filled");
    shotEls = [...track.querySelectorAll(".dive-shot")];
    track.querySelectorAll("img[data-src]").forEach((img, i) => {
      if (!lazy || i < 3) loadImg(img); else lazy.observe(img);
    });
    fitFrames();
    updateTrack();
    return true;
  };

  // The CSS sizes the frames from the free height; long captions or very short
  // windows can still overflow, so trim --fh until every capture fits whole.
  function fitFrames() {
    if (!dive.open || !shotEls.length) return;
    dive.style.removeProperty("--fh");
    for (let pass = 0; pass < 3; pass++) {
      const cs = getComputedStyle(track);
      const avail = track.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      let need = 0;
      shotEls.forEach((el) => {
        const lift = Math.abs(parseFloat(getComputedStyle(el).getPropertyValue("--lift")) || 0);
        need = Math.max(need, el.offsetHeight + 2 * lift);
      });
      const over = Math.ceil(need - avail);
      if (over <= 0) break;
      const probe = document.createElement("i");
      probe.style.cssText = "position:absolute;visibility:hidden;height:var(--fh)";
      dive.appendChild(probe);
      const fh = probe.offsetHeight;
      probe.remove();
      dive.style.setProperty("--fh", `${Math.max(140, fh - over)}px`);
    }
  }

  // keep the active sector chip in view inside its scrollable row
  const centerChip = () => {
    const b = chips.querySelector("[aria-current=\"true\"]");
    if (!b) return;
    const left = b.offsetLeft - (chips.clientWidth - b.offsetWidth) / 2;
    chips.scrollTo({ left: Math.max(0, left), behavior: dive.open ? smooth : "auto" });
  };

  const renderError = () => {
    current = { slug: "", shots: [] };
    $("diveTitle").textContent = "No hemos podido cargar las capturas";
    $("diveCount").textContent = "0";
    $("diveShots").textContent = "0";
    blurb.textContent = "Revisa tu conexión y vuelve a pulsar el témpano.";
    track.innerHTML = "";
    shotEls = [];
  };

  // progress bar, arrows and the depth effect while the gallery scrolls
  let trackRaf = 0;
  function updateTrack() {
    trackRaf = 0;
    const max = track.scrollWidth - track.clientWidth;
    const x = track.scrollLeft;
    progress.style.setProperty("--p", max > 0 ? (x / max).toFixed(4) : "1");
    stepBtns[0].disabled = x <= 2;
    stepBtns[1].disabled = x >= max - 2;
    if (reduce || !dive.open) return;
    const tr = track.getBoundingClientRect();
    const cx = tr.left + tr.width / 2;
    shotEls.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.right < tr.left - 300 || r.left > tr.right + 300) return;
      const d = Math.max(-1, Math.min(1, (r.left + r.width / 2 - cx) / tr.width));
      el.style.setProperty("--d", d.toFixed(3));
      el.style.setProperty("--ad", Math.abs(d).toFixed(3));
    });
  }
  track.addEventListener("scroll", () => { if (!trackRaf) trackRaf = requestAnimationFrame(updateTrack); }, { passive: true });
  addEventListener("resize", () => { if (dive.open) { fitFrames(); updateTrack(); } });

  const scrollStep = (dir, amount) => track.scrollBy({ left: dir * amount, behavior: smooth });
  stepBtns.forEach((b) => b.addEventListener("click", () => scrollStep(+b.dataset.diveStep, track.clientWidth * 0.75)));
  // vertical mouse wheel moves the gallery sideways, except over a card that
  // still has text to scroll (its own scroll goes first)
  track.addEventListener("wheel", (e) => {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    const card = e.target.closest(".dive-card");
    if (card && card.scrollHeight > card.clientHeight + 1) {
      const canUp = card.scrollTop > 0;
      const canDown = card.scrollTop + card.clientHeight < card.scrollHeight - 1;
      if ((e.deltaY < 0 && canUp) || (e.deltaY > 0 && canDown)) return;
    }
    e.preventDefault();
    track.scrollLeft += e.deltaY * (e.deltaMode === 1 ? 32 : 1);
  }, { passive: false });
  // arrows move the gallery from anywhere in the dialog (except the sector chips)
  dive.addEventListener("keydown", (e) => {
    if (!lb.hidden || e.altKey || e.ctrlKey || e.metaKey || chips.contains(e.target)) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      scrollStep(e.key === "ArrowRight" ? 1 : -1, Math.min(460, track.clientWidth * 0.6));
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      track.scrollTo({ left: e.key === "Home" ? 0 : track.scrollWidth, behavior: smooth });
    }
  });

  const setOrigin = (el) => {
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (!r.width) return;
    dive.style.setProperty("--ox", `${Math.round(r.left + r.width / 2)}px`);
    dive.style.setProperty("--oy", `${Math.round(r.top + r.height * 0.25)}px`);
  };

  // centre one capture in the track (coming from a block of the reel)
  const goToShot = (file) => {
    const n = current ? current.shots.findIndex((s) => s.file === file) : -1;
    const btn = n >= 0 && track.querySelector(`[data-shot="${n}"]`);
    if (!btn) return;
    const fig = btn.closest(".dive-shot");
    const img = fig.querySelector("img[data-src]");
    if (img) loadImg(img);
    track.scrollLeft = Math.max(0, fig.offsetLeft - (track.clientWidth - fig.offsetWidth) / 2);
    fig.classList.add("is-target");
    setTimeout(() => fig.classList.remove("is-target"), 2600);
  };

  const openDive = async (slug, origin, file) => {
    opener = origin || document.activeElement;
    setOrigin(origin);
    try {
      await loadData();
      if (!chips.children.length) renderChips();
      render(slug);
    } catch (err) {
      renderError();
    }
    if (!dive.open) {
      dive.showModal();
      root.classList.add("dive-lock");
      try { history.pushState({ dive: slug }, ""); pushed = true; } catch (err) { pushed = false; }
    }
    fitFrames();
    $("diveTitle").focus({ preventScroll: true });
    centerChip();
    if (file) goToShot(file);
    updateTrack();
  };

  const finishClose = () => {
    closing = false;
    dive.classList.remove("is-closing");
    if (dive.open) dive.close();
  };
  const closeDive = () => {
    if (!dive.open || closing) return;
    if (!lb.hidden) hideLbUi(false);
    // close back into what opened it: the reel block (same sector) or the sector's iceberg
    const fromReel = opener && opener.isConnected && opener.classList.contains("reel-card")
      && current && opener.dataset.sector === current.slug;
    const berg = !fromReel && current && current.slug && sea.querySelector(`.berg[data-sector="${current.slug}"]`);
    if (berg) opener = berg;
    setOrigin(opener);
    if (reduce) { finishClose(); return; }
    closing = true;
    dive.classList.add("is-closing");
    setTimeout(finishClose, 500);
  };

  dive.addEventListener("close", () => {
    closing = false;
    dive.classList.remove("is-closing", "is-filled");
    dive.style.removeProperty("--fh");
    root.classList.remove("dive-lock");
    if (!lb.hidden) hideLbUi(false);
    // drop our own history entries (capture + gallery) in one step
    const steps = (lbPushed ? 1 : 0) + (pushed ? 1 : 0);
    lbPushed = false;
    pushed = false;
    if (steps) history.go(-steps);
    if (opener && opener.isConnected) opener.focus({ preventScroll: true });
  });
  // The phone's back button: first closes the enlarged capture, then the gallery.
  addEventListener("popstate", (e) => {
    const st = e.state || {};
    if (st.lb) return;
    if (!lb.hidden) {
      lbPushed = false;
      hideLbUi(true);
      if (st.dive) return;
    }
    if (!st.dive && dive.open) {
      pushed = false;
      lbPushed = false;
      closeDive();
    }
  });

  // Esc: closes the enlarged capture first, then the gallery
  let escAt = -1;
  const onEscape = () => { if (!lb.hidden) hideLb(true); else closeDive(); };
  dive.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      escAt = performance.now();
      onEscape();
    } else if (!lb.hidden && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault();
      stepLb(e.key === "ArrowRight" ? 1 : -1);
    }
  });
  dive.addEventListener("cancel", (e) => {
    e.preventDefault();
    if (performance.now() - escAt < 150) return; // already handled by keydown
    onEscape();
  });

  // ---- 4. Lightbox: full-size capture, thumbnail shown while it loads ----
  function showLb(i) {
    const s = current && current.shots[i];
    if (!s) return;
    lbIndex = i;
    const mobile = s.device === "mobile";
    const typeName = data.types[s.type] || "Captura";
    lbFrame.className = `frame dive-lb-frame frame--${mobile ? "mobile" : "desktop"}`;
    lbFrame.style.setProperty("--ar", (s.w / s.h).toFixed(4));
    lbFrame.querySelector(".frame-bar").hidden = mobile;
    lbImg.alt = altFor(s.type, sectorOf(current.slug));
    lbImg.width = s.w;
    lbImg.height = s.h;
    lbImg.src = thumbOf(s.file);
    const full = new Image();
    full.onload = () => { if (lbIndex === i) lbImg.src = s.file; };
    full.src = s.file;
    const type = $("lbType");
    type.className = `shot-type shot-type--${s.type}`;
    type.textContent = typeName;
    $("lbProject").textContent = s.label;
    $("lbCaption").textContent = s.caption;
    $("lbPos").textContent = `${i + 1} / ${current.shots.length}`;
  }
  function stepLb(dir) {
    const n = current.shots.length;
    if (n) showLb((lbIndex + dir + n) % n);
  }
  function openLb(i) {
    showLb(i);
    lb.hidden = false;
    underLb.forEach((el) => { el.inert = true; });
    lb.querySelector("[data-lb-close]").focus();
    // its own history entry, so "back" on the phone only closes the capture
    if (pushed && !lbPushed) {
      try { history.pushState({ dive: current.slug, lb: 1 }, ""); lbPushed = true; } catch (err) { lbPushed = false; }
    }
  }
  function hideLbUi(refocus) {
    lb.hidden = true;
    lbFrame.classList.remove("is-zoomed");
    underLb.forEach((el) => { el.inert = false; });
    if (!refocus) return;
    const b = track.querySelector(`[data-shot="${lbIndex}"]`);
    if (b) {
      b.focus({ preventScroll: true });
      b.scrollIntoView({ block: "nearest", inline: "center", behavior: smooth });
    }
  }
  function hideLb(refocus) {
    hideLbUi(refocus);
    if (lbPushed) { lbPushed = false; history.back(); }
  }

  track.addEventListener("click", (e) => {
    const more = e.target.closest(".dive-built-more");
    if (more) {
      const card = more.closest(".dive-card");
      const show = !card.classList.contains("is-open");
      card.classList.toggle("is-open", show);
      more.setAttribute("aria-expanded", String(show));
      more.textContent = show ? "Ver menos" : "Ver todo lo que incluye";
      return;
    }
    const b = e.target.closest("[data-shot]");
    if (b) openLb(+b.dataset.shot);
  });
  lb.addEventListener("click", (e) => {
    if (e.target.closest("[data-lb-close]")) { hideLb(true); return; }
    const s = e.target.closest("[data-lb-step]");
    if (s) { stepLb(+s.dataset.lbStep); return; }
    if (e.target === lb || e.target.classList.contains("dive-lb-stage")) hideLb(true);
  });
  // tap / click on the capture: double size, centred where you touched; again to go back
  lbFrame.addEventListener("click", (e) => {
    const screen = e.target.closest(".frame-screen");
    if (!screen) return;
    const r = screen.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width;
    const fy = (e.clientY - r.top) / r.height;
    const zoom = !lbFrame.classList.contains("is-zoomed");
    lbFrame.classList.toggle("is-zoomed", zoom);
    if (zoom) {
      screen.scrollLeft = fx * screen.scrollWidth - r.width / 2;
      screen.scrollTop = fy * screen.scrollHeight - r.height / 2;
    }
  });
  let swipeX = null;
  lb.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") swipeX = e.clientX; });
  lb.addEventListener("pointerup", (e) => {
    if (swipeX === null) return;
    const dx = e.clientX - swipeX;
    swipeX = null;
    if (lbFrame.classList.contains("is-zoomed")) return; // panning the enlarged capture
    if (Math.abs(dx) > 50) stepLb(dx < 0 ? 1 : -1);
  });
  lb.addEventListener("pointercancel", () => { swipeX = null; });

  // ---- 5. Wiring ----
  sea.addEventListener("click", (e) => {
    const b = e.target.closest(".berg");
    if (b) openDive(b.dataset.sector, b);
  });
  // the labels under the water light up with their iceberg
  const deeps = [...sea.querySelectorAll(".berg-deep")];
  const lightDeep = (slug) => deeps.forEach((d) => d.classList.toggle("is-lit", d.dataset.sector === slug));
  sea.addEventListener("pointerover", (e) => { const b = e.target.closest(".berg"); lightDeep(b ? b.dataset.sector : null); });
  sea.addEventListener("pointerleave", () => lightDeep(null));
  sea.addEventListener("focusin", (e) => { const b = e.target.closest(".berg"); lightDeep(b ? b.dataset.sector : null); });
  sea.addEventListener("focusout", () => lightDeep(null));
  // blocks of the reel open their sector right on that capture
  const reelWindow = document.querySelector(".reel-window");
  if (reelWindow) {
    reelWindow.addEventListener("click", (e) => {
      const card = e.target.closest(".reel-card[data-sector]");
      if (card) openDive(card.dataset.sector, card, card.dataset.file);
    });
  }
  chips.addEventListener("click", (e) => {
    const b = e.target.closest("[data-sector]");
    if (!b || !data || (current && b.dataset.sector === current.slug)) return;
    render(b.dataset.sector);
    centerChip();
  });
  infoBtn.addEventListener("click", () => setInfo(infoBtn.getAttribute("aria-expanded") !== "true"));
  dive.addEventListener("click", (e) => {
    if (blurb.classList.contains("is-open") && !e.target.closest("#diveInfo, #diveBlurb")) setInfo(false);
  });
  dive.querySelector("[data-dive-close]").addEventListener("click", closeDive);
}());
