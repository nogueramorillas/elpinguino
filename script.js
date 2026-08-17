document.getElementById("year").textContent = new Date().getFullYear();

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

const dropdownBtn = document.getElementById("servDropdownBtn");
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

// Mobile-only: scroll-reveal + penguin footprints for process steps
(function initProcessScroll() {
  if (window.innerWidth > 600) return;

  var FP = '<svg class="fp" viewBox="0 0 44 56" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">'
    + '<ellipse cx="9"  cy="14" rx="6" ry="9"  transform="rotate(-18 9 14)"/>'
    + '<ellipse cx="22" cy="8"  rx="6" ry="9"/>'
    + '<ellipse cx="35" cy="14" rx="6" ry="9"  transform="rotate(18 35 14)"/>'
    + '<ellipse cx="22" cy="42" rx="16" ry="17"/>'
    + '</svg>';

  var steps = Array.prototype.slice.call(document.querySelectorAll('.process-steps li'));

  steps.forEach(function(li, i) {
    var dot = li.querySelector('.process-dot');
    if (dot) {
      var icon = dot.querySelector('svg');
      if (icon) icon.setAttribute('hidden', '');
      dot.insertAdjacentHTML('afterbegin', FP);
      if (i % 2 === 1) dot.querySelector('.fp').style.transform = 'scaleX(-1)';
    }
    li.classList.add('step-hidden');
  });

  if (!('IntersectionObserver' in window)) {
    steps.forEach(function(li) { li.classList.remove('step-hidden'); });
    return;
  }

  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      var dot = e.target.querySelector('.process-dot');
      if (e.isIntersecting) {
        e.target.classList.remove('step-hidden');
        if (dot) dot.classList.add('fp-lit');
      } else if (e.boundingClientRect.top > 0) {
        e.target.classList.add('step-hidden');
        if (dot) dot.classList.remove('fp-lit');
      }
    });
  }, { threshold: 0.25 });

  steps.forEach(function(li) { obs.observe(li); });
}());
