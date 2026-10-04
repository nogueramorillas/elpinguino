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
    [".project-card", 90],
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
    const titles = [...document.querySelectorAll(".section-heading h2, .projects-heading h2, .faq-right h2, .why-x h2, .asesor-copy h2, .cta-x h2, .page-hero h1")];
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
    document.querySelectorAll(".project-card, .service-card, .stack-card").forEach((card) => {
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
