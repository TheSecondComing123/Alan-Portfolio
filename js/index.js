const WINDOW_IDS = ["home", "projects", "technologies"];
const app = document.getElementById("app");
let currentCarouselIndex = 0;

async function init() {
  await loadComponents();
  initializeNavigationIcons();

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }

  document.querySelector(".carousel-item")?.classList.add("active");
  switchWindow("home");
}

async function loadComponents() {
  for (const id of WINDOW_IDS) {
    const response = await fetch(`components/${id}.html`);
    const html = await response.text();
    app.insertAdjacentHTML("beforeend", html);
  }
}

function initializeNavigationIcons() {
  const iconMap = {
    "btn-home": "home",
    "btn-projects": "briefcase",
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
  document.querySelectorAll(".window-container").forEach(container => {
    container.classList.remove("active");
  });

  setTimeout(() => {
    document.getElementById(id)?.closest(".window-container")?.classList.add("active");
  }, 10);

  document.querySelectorAll(".nav-button").forEach(button => {
    button.removeAttribute("aria-current");
  });
  document.getElementById(`btn-${id}`).setAttribute("aria-current", "page");
}

function carousel(direction) {
  const items = document.querySelectorAll(".carousel-item");
  if (!items.length) return;

  items[currentCarouselIndex].classList.remove("active", "prev");

  const delta = direction === "next" ? 1 : -1;
  currentCarouselIndex = (currentCarouselIndex + delta + items.length) % items.length;

  if (direction === "prev") {
    items[currentCarouselIndex].classList.add("active", "prev");
  } else {
    items[currentCarouselIndex].classList.add("active");
  }
}

function copy(type, value, element) {
  navigator.clipboard.writeText(value).then(() => {
    const originalText = element.textContent;
    element.textContent = "Copied!";
    element.classList.add("copied");

    setTimeout(() => {
      element.textContent = originalText;
      element.classList.remove("copied");
    }, 1500);
  });
}

document.addEventListener("keypress", (event) => {
  const isContactValue = event.target.classList.contains("contact-value");
  const isActivationKey = event.key === "Enter" || event.key === " ";

  if (isContactValue && isActivationKey) {
    event.preventDefault();
    const value = event.target.getAttribute("data-value");
    copy("", value, event.target);
  }
});

init();
