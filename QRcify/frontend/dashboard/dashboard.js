// Toggle Sidebar
if (!localStorage.getItem("token")) {
  window.location.href = "index.html"; // back to login
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("collapsed");
}

// Toggle Dark Mode
function toggleDarkMode() {
  const html = document.documentElement;
  const icon = document.getElementById("themeIcon");
  const isDark = html.getAttribute("data-theme") === "dark";

  if (isDark) {
    html.setAttribute("data-theme", "light");
    icon.className = "fas fa-moon";
    localStorage.setItem("theme", "light");
  } else {
    html.setAttribute("data-theme", "dark");
    icon.className = "fas fa-sun";
    localStorage.setItem("theme", "dark");
  }
}

// Load Saved Theme
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  const username = localStorage.getItem("username") || "User";
  document.querySelector(".header-title h1").textContent =
    `Welcome back, ${username}! 👋`;

  if (savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    document.getElementById("themeIcon").className = "fas fa-sun";
  }

  animateValue("totalQRs", 0, 1234, 2000);
});

// Animate Counter
function animateValue(id, start, end, duration) {
  const element = document.getElementById(id);
  const range = end - start;
  const increment = range / (duration / 16);
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if (current >= end) {
      element.textContent = end.toLocaleString();
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current).toLocaleString();
    }
  }, 16);
}

// Page Navigation
function switchPage(page) {
  const mainContent = document.getElementById("mainContent");
  fetch(`sections/${page}.html`)
    .then((res) => res.text())
    .then((html) => {
      mainContent.innerHTML = html;
      console.log(`Loaded: ${page}`);
    })
    .catch((err) => {
      mainContent.innerHTML = `<p style="color:red;">Error loading ${page}</p>`;
    });
}

// QR Modal
function openQRModal() {
  document.getElementById("qrModal").classList.add("show");
}

function closeQRModal() {
  document.getElementById("qrModal").classList.remove("show");
}

// Close modal on outside click
document.getElementById("qrModal").addEventListener("click", function (e) {
  if (e.target === this) closeQRModal();
});
