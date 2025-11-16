// ==================== AUTH CHECK ====================
const token =
  localStorage.getItem("token") || localStorage.getItem("userToken");
const userData = localStorage.getItem("userData");

console.log("🔑 Token found:", token ? "Yes" : "No");
console.log("👤 User data:", userData);

if (!token) {
  console.log("❌ No token, redirecting to login...");
  window.location.href = "../index.html";
}

// ==================== API HELPER ====================
async function apiFetch(endpoint, options = {}) {
  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(endpoint, mergedOptions);

    if (response.status === 401) {
      console.error("❌ Unauthorized - redirecting to login");
      localStorage.clear();
      window.location.href = "../index.html";
      throw new Error("Session expired");
    }

    return response;
  } catch (error) {
    console.error("API Fetch error:", error);
    throw error;
  }
}

// ==================== SIDEBAR & THEME ====================
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("collapsed");
}

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

// ==================== LOAD USER DATA ====================
window.addEventListener("DOMContentLoaded", () => {
  console.log("📊 Dashboard loading...");

  // Load theme
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    document.getElementById("themeIcon").className = "fas fa-sun";
  }

  // Load user name
  try {
    const user = JSON.parse(userData);
    const headerTitle = document.querySelector(".header-title h1");
    if (headerTitle) {
      headerTitle.textContent = `Welcome back, ${user.name}! 👋`;
    }
    console.log("✅ User loaded:", user.name);
  } catch (e) {
    console.error("❌ Failed to parse user data:", e);
  }

  // ✅ LOAD REAL DATA FROM BACKEND
  loadDashboardData();
});

// ==================== LOAD DASHBOARD DATA ====================
async function loadDashboardData() {
  console.log("🔄 Fetching real dashboard data...");

  try {
    // Fetch dashboard stats
    const statsResponse = await apiFetch("/api/dashboard/stats");
    const statsData = await statsResponse.json();

    console.log("📊 Stats response:", statsData);

    if (statsData.success) {
      // ✅ UPDATE REAL DATA
      const stats = statsData.stats;

      // Update total QRs with animation
      animateValue("totalQRs", 0, stats.totalQRs || 0, 2000);

      // Update other stats
      const scanElement = document.querySelector(
        ".stat-card:nth-child(2) .stat-value"
      );
      if (scanElement) {
        scanElement.textContent = formatNumber(stats.totalScans || 0);
      }

      const activityElement = document.querySelector(
        ".stat-card:nth-child(3) .stat-value"
      );
      if (activityElement) {
        activityElement.textContent = stats.todayActivity || 0;
      }

      const popularElement = document.querySelector(
        ".stat-card:nth-child(4) .stat-value"
      );
      if (popularElement) {
        popularElement.textContent = (
          stats.popularType || "None"
        ).toUpperCase();
      }

      console.log("✅ Dashboard stats updated:", {
        totalQRs: stats.totalQRs,
        todayActivity: stats.todayActivity,
        popularType: stats.popularType,
      });
    } else {
      console.error("❌ Stats API returned error:", statsData);
    }

    // Fetch recent activity
    const historyResponse = await apiFetch("/api/qr/history");
    const historyData = await historyResponse.json();

    console.log("📋 History response:", historyData);

    if (historyData.success && historyData.history.length > 0) {
      updateActivityList(historyData.history);
      console.log(
        "✅ Activity list updated with",
        historyData.history.length,
        "items"
      );
    } else {
      console.log("ℹ️ No history found");
    }
  } catch (error) {
    console.error("❌ Failed to load dashboard data:", error);
    showNotification("Failed to load data. Using demo mode.", "warning");
  }
}

// ==================== UPDATE ACTIVITY LIST ====================
function updateActivityList(history) {
  const activityList = document.querySelector(".activity-list");
  if (!activityList) {
    console.error("❌ Activity list element not found");
    return;
  }

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
          <div class="activity-desc">${item.dataSize || 0} bytes</div>
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
  if (!element) {
    console.error(`❌ Element #${id} not found`);
    return;
  }

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

// ==================== PAGE NAVIGATION ====================
function switchPage(page) {
  console.log("📍 Navigating to:", page);

  switch (page) {
    case "dashboard":
      loadDashboardData();
      break;
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
      console.log("Unknown page:", page);
  }
}

// ==================== QR MODAL ====================
function openQRModal() {
  document.getElementById("qrModal").classList.add("show");
}

function closeQRModal() {
  document.getElementById("qrModal").classList.remove("show");
}

document.getElementById("qrModal")?.addEventListener("click", function (e) {
  if (e.target === this) closeQRModal();
});

// ==================== NOTIFICATION SYSTEM ====================
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === "success" ? "#10b981" : type === "warning" ? "#f59e0b" : type === "error" ? "#ef4444" : "#3b82f6"};
    color: white;
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

// ==================== AUTO REFRESH ====================
// Refresh stats every 30 seconds
setInterval(loadDashboardData, 30000);

console.log("✅ Dashboard initialized successfully");
