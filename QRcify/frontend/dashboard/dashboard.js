// ----------------->  Checking auth  <------------------
const token =
  localStorage.getItem("token") || localStorage.getItem("userToken");
const userData = localStorage.getItem("userData");

if (!token) {
  window.location.href = "../index.html";
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("collapsed");
}

// -----------------> SIDE bar and MODE(theme) <-----------------
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

// Loading User Data
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    document.getElementById("themeIcon").className = "fas fa-sun";
  }
  try {
    const user = JSON.parse(userData);
    document.querySelector(".header-title h1").textContent =
      `Welcome back, ${user.name}! 👋`;
  } catch (error) {
    document.querySelector(".header-title h1").textContent = `Welcome back! 👋`;
  }
  loadDashboardData(); //real DATA from Dashboard.
});

// -----------------> Loading Dashboard Data <-----------------
async function loadDashboardData() {
  try {
    // Fetch dashboard stats
    const statsResponse = await fetch("/api/dashboard/stats", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const statsData = await statsResponse.json();

    if (statsData.success) {
      // Update stats
      animateValue("totalQRs", 0, statsData.stats.totalQRs, 2000);

      document.querySelector(
        ".stat-card:nth-child(2) .stat-value"
      ).textContent = formatNumber(statsData.stats.totalScans);

      document.querySelector(
        ".stat-card:nth-child(3) .stat-value"
      ).textContent = statsData.stats.todayActivity;

      document.querySelector(
        ".stat-card:nth-child(4) .stat-value"
      ).textContent = statsData.stats.popularType.toUpperCase();
    }
    // Fetch recent activity
    const historyResponse = await fetch("/api/qr/history", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const historyData = await historyResponse.json();

    if (historyData.success && historyData.history.length > 0) {
      updateActivityList(historyData.history);
    }
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
    showNotification("Failed to load data. Using demo data.", "warning");
  }
}

async function loadDashboardData() {
  try {
    // Fetch dashboard stats
    const statsResponse = await fetch("/api/dashboard/stats", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const statsData = await statsResponse.json();

    if (statsData.success) {
      // Update stats
      animateValue("totalQRs", 0, statsData.stats.totalQRs, 2000);

      document.querySelector(
        ".stat-card:nth-child(2) .stat-value"
      ).textContent = formatNumber(statsData.stats.totalScans);

      document.querySelector(
        ".stat-card:nth-child(3) .stat-value"
      ).textContent = statsData.stats.todayActivity;

      document.querySelector(
        ".stat-card:nth-child(4) .stat-value"
      ).textContent = statsData.stats.popularType.toUpperCase();
    }

    // Fetch recent activity
    const historyResponse = await fetch("/api/qr/history", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const historyData = await historyResponse.json();

    if (historyData.success && historyData.history.length > 0) {
      updateActivityList(historyData.history);
    }
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
    showNotification("Failed to load data. Using demo data.", "warning");
  }
} // -----------------> Updated Activity List <-----------------

function updateActivityList(history) {
  const activityList = document.querySelector(".activity-list");

  const iconMap = {
    url: { icon: "fa-link", color: "blue", title: "URL QR Generated" },
    encrypted_text: {
      icon: "fa-lock",
      color: "green",
      title: "Encrypted Text Created",
    },
    file: { icon: "fa-file", color: "purple", title: "File Encrypted" },
    vcard: {
      icon: "fa-address-card",
      color: "orange",
      title: "vCard QR Generated",
    },
    wifi: { icon: "fa-wifi", color: "blue", title: "WiFi QR Generated" },
  };

  activityList.innerHTML = history
    .map((item) => {
      const config = iconMap[item.type] || iconMap.url;
      return `
      <div class="activity-item">
        <div class="activity-icon ${config.color}">
          <i class="fas ${config.icon}"></i>
        </div>
        <div class="activity-content">
          <div class="activity-title">${config.title}</div>
          <div class="activity-desc">${item.dataSize} bytes</div>
        </div>
        <div class="activity-time">${item.timeAgo}</div>
      </div>
    `;
    })
    .join("");
}

// ==================== ANIMATE COUNTER ====================
function animateValue(id, start, end, duration) {
  const element = document.getElementById(id);
  if (!element) return;

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

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

// -----------------> Page Navigation For Sidebar<-----------------
function switchPage(page) {
  switch (page) {
    case "generators":
      window.location.href = "../index.html#basic";
      break;
    case "analytics":
      showNotification("Advanced analytics coming soon!", "info");
      break;
    case "qr-codes":
      showNotification("My QR Codes page coming soon!", "info");
      break;
    case "teams":
      showNotification("Team collaboration coming soon!", "info");
      break;
    case "settings":
      showNotification("Settings page coming soon!", "info");
      break;
    case "help":
      window.open("https://github.com/Yashcodes124/Qr_Generator", "_blank");
      break;
    default:
      loadDashboardData(); // Refresh dashboard
  }
}

// -----------------> QR modal for login and register <-----------------
function openQRModal() {
  document.getElementById("qrModal").classList.add("show");
}

function closeQRModal() {
  document.getElementById("qrModal").classList.remove("show");
}

document.getElementById("qrModal")?.addEventListener("click", function (e) {
  if (e.target === this) closeQRModal();
});

// -----------------> Notification for all msg types <-----------------
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === "success" ? "#10b981" : type === "warning" ? "#f59e0b" : type === "error" ? "#ef4444" : "#3b82f6"};
    color: white;
    border:1px solid white;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    animation: slideIn 0.3s ease;
    font-weight: 500;
    max-width: 300px;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add notification CSS animations
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Refresh stats every 30 seconds
// -----------------> AUTO REFRESH <-----------------
setInterval(loadDashboardData, 30000);
