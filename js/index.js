const SECTION_IDS = ["home", "projects", "work", "technologies"];
const app = document.getElementById("app");

async function init() {
  await loadComponents();
  initializeNavigationIcons();

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }

  initializeScrollObserver();
  setCurrentButton("home");
}

async function loadComponents() {
  for (const id of SECTION_IDS) {
    const response = await fetch(`components/${id}.html`);
    const html = await response.text();
    app.insertAdjacentHTML("beforeend", html);
  }
}

function initializeNavigationIcons() {
  const iconMap = {
    "btn-home": "home",
    "btn-projects": "briefcase",
    "btn-work": "building-2",
    "btn-technologies": "cpu",
  };

  for (const [buttonId, iconName] of Object.entries(iconMap)) {
    const button = document.getElementById(buttonId);
    const icon = document.createElement("i");
    icon.setAttribute("data-lucide", iconName);
    icon.className = "icon";
    button.appendChild(icon);
  }
}

function switchWindow(id) {
  const section = document.getElementById(id);
  if (!section) return;

  setCurrentButton(id);
  section.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function initializeScrollObserver() {
  const sections = SECTION_IDS
    .map(id => document.getElementById(id))
    .filter(Boolean);

  const observer = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (visible) {
      setCurrentButton(visible.target.id);
    }
  }, {
    root: null,
    rootMargin: "-42% 0px -42% 0px",
    threshold: [0.18, 0.35, 0.6],
  });

  for (const section of sections) {
    observer.observe(section);
  }
}

function setCurrentButton(id) {
  document.querySelectorAll(".nav-button").forEach(button => {
    button.removeAttribute("aria-current");
  });

  const active = document.getElementById(`btn-${id}`);
  if (active) {
    active.setAttribute("aria-current", "page");
  }
}

init();
