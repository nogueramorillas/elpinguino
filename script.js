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
