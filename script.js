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

// Scroll-reveal process steps + penguin footprints on mobile
(function () {
  var FP = '<svg class="fp" viewBox="0 0 44 56" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">'
    + '<ellipse cx="9"  cy="14" rx="6" ry="9"  transform="rotate(-18 9 14)"/>'
    + '<ellipse cx="22" cy="8"  rx="6" ry="9"/>'
    + '<ellipse cx="35" cy="14" rx="6" ry="9"  transform="rotate(18 35 14)"/>'
    + '<ellipse cx="22" cy="42" rx="16" ry="17"/>'
    + '</svg>';

  var steps = document.querySelectorAll('.process-steps li');

  steps.forEach(function (li, i) {
    var dot = li.querySelector('.process-dot');
    if (dot) {
      var icon = dot.querySelector('svg');
      if (icon) icon.classList.add('dot-icon');
      dot.insertAdjacentHTML('afterbegin', FP);
      if (i % 2 === 1) dot.querySelector('.fp').style.transform = 'scaleX(-1)';
    }
    li.style.opacity = '0';
    li.style.transform = 'translateY(28px)';
    li.style.transition = 'opacity 0.5s ease ' + (i * 0.08) + 's, transform 0.5s ease ' + (i * 0.08) + 's';
  });

  if (!('IntersectionObserver' in window)) {
    steps.forEach(function (li) { li.style.opacity = '1'; li.style.transform = 'none'; });
    return;
  }

  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var dot = e.target.querySelector('.process-dot');
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        if (dot) dot.classList.add('fp-lit');
      } else if (e.boundingClientRect.top > 0) {
        e.target.style.opacity = '0';
        e.target.style.transform = 'translateY(28px)';
        if (dot) dot.classList.remove('fp-lit');
      }
    });
  }, { threshold: 0.2 });

  steps.forEach(function (li) { obs.observe(li); });
}());
