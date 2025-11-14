// 🔹 LOADER FUNCTIONS
let dotInterval;
function showLoader(loaderId, text = "Processing") {
  const loader = document.getElementById(loaderId);
  if (!loader) return;
  loader.style.display = "flex";

  const loaderText = loader.querySelector("span");
  if (!loaderText) return;

  let dots = "";
  dotInterval = setInterval(() => {
    dots = dots.length < 3 ? dots + "." : "";
    loaderText.textContent = text + dots;
  }, 500);
}

function hideLoader(loaderId) {
  const loader = document.getElementById(loaderId);
  if (loader) loader.style.display = "none";
  if (dotInterval) {
    clearInterval(dotInterval);
    dotInterval = null;
  }
}
function getAuthHeaders() {
  // Check either modern token key names your app might use
  const token =
    localStorage.getItem("userToken") || localStorage.getItem("token");
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}
function parseJSONSafe(res) {
  // Try to parse JSON safely and return object with shape {ok, data}
  return res
    .json()
    .then((data) => ({ ok: res.ok, data }))
    .catch(() => ({ ok: res.ok, data: null }));
}

function showSuccess(msg) {
  const box = document.getElementById("successMessage");
  box.textContent = msg;
  box.style.display = "block";
  setTimeout(() => (box.style.display = "none"), 3000);
}

function showError(msg) {
  const box = document.getElementById("errorMessage");
  box.textContent = msg;
  box.style.display = "block";
  setTimeout(() => (box.style.display = "none"), 4000);
}

// ================================
// 🔐 AUTHENTICATION FUNCTIONS - UPDATED
// ================================
function openAuthModal() {
  const modal = document.getElementById("authModal");
  if (!modal) return;
  modal.style.display = "flex";
  showLoginForm();
}

function openRegisterModal() {
  const modal = document.getElementById("authModal");
  if (!modal) return;
  modal.style.display = "flex";
  showRegisterForm();
}

function showLoginForm() {
  const lf = document.getElementById("loginForm");
  const rf = document.getElementById("registerForm");
  if (lf) lf.style.display = "block";
  if (rf) rf.style.display = "none";
}

function showRegisterForm() {
  const lf = document.getElementById("loginForm");
  const rf = document.getElementById("registerForm");
  if (lf) lf.style.display = "none";
  if (rf) rf.style.display = "block";
}

function closeAuthModal() {
  const modal = document.getElementById("authModal");
  if (modal) modal.style.display = "none";
  // Clear basic form fields if they exist
  const ids = [
    "loginEmail",
    "loginPassword",
    "registerName",
    "registerEmail",
    "registerPassword",
  ];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}
// Close modal when clicking outside
document.addEventListener("click", function (event) {
  const modal = document.getElementById("authModal");
  if (!modal) return;
  if (event.target === modal) {
    closeAuthModal();
  }
});
// Close on Escape key
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeAuthModal();
  }
});

// Enhanced authentication functions - UPDATED
async function handleLogin(event) {
  event.preventDefault();
  const email = (
    (document.getElementById("loginEmail") || {}).value || ""
  ).trim();
  const password = (
    (document.getElementById("loginPassword") || {}).value || ""
  ).trim();
  const errorEl = document.getElementById("errorMessage");
  const successEl = document.getElementById("successMessage");
  if (errorEl) errorEl.textContent = "";
  if (successEl) successEl.textContent = "";

  if (!email || !password) {
    showNotification("Email and password required for login.");
    return;
  }

  showLoader("urlLoader", "Logging in");

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const { ok, data } = await parseJSONSafe(res);
    if (!ok) {
      const msg = data?.error || data?.message || `Server error: ${res.status}`;
      if (errorEl) errorEl.textContent = `Login error: ${msg}`;
      console.error("Login error:", msg, data);
      return;
    }
    if (data.success && data && data.token) {
      localStorage.setItem("userToken", data.token);
      localStorage.setItem("userData", JSON.stringify(data.user || {}));
      if (successEl) successEl.textContent = "Login successful!";
      closeAuthModal();
      updateUIForLoggedInUser(data.user || { name: data.user?.name || "User" });

      setTimeout(() => {
        window.location.href = "/dashboard/dashboard.html";
        localStorage.setItem("username", data.user.name);
      }, 800);
    } else {
      const msg = data?.error || "Login failed";
      if (errorEl) errorEl.textContent = `Login error: ${msg}`;
    }
  } catch (error) {
    console.error("Login error:", error);
    if (errorEl) errorEl.textContent = "Login failed (network error).";
  } finally {
    hideLoader("urlLoader");
  }
}

async function handleRegister(event) {
  event.preventDefault();

  const name = (
    (document.getElementById("registerName") || {}).value || ""
  ).trim();
  const email = (
    (document.getElementById("registerEmail") || {}).value || ""
  ).trim();
  const password = (
    (document.getElementById("registerPassword") || {}).value || ""
  ).trim();
  const errorEl = document.getElementById("errorMessage");
  const successEl = document.getElementById("successMessage");
  if (errorEl) errorEl.textContent = "";
  if (successEl) successEl.textContent = "";
  if (!name || !email || !password) {
    if (errorEl) errorEl.textContent = "All fields are required.";
    return;
  }
  try {
    showLoader("urlLoader", "Registering");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const { ok, data } = await parseJSONSafe(res);

    if (!ok) {
      const msg = data?.error || data?.message || `Server error: ${res.status}`;
      if (errorEl) errorEl.textContent = `Registration error: ${msg}`;
      console.error("Registration error:", msg, data);
      return;
    }
    if (data && data.success) {
      if (successEl)
        successEl.textContent = "Registration successful. Please login.";
      localStorage.setItem("userToken", data.token);
      localStorage.setItem("userData", JSON.stringify(data.user));
      if (successEl) successEl.textContent = "Registration successfull.";
      setTimeout(() => {
        window.location.href = "/dashboard/dashboard.html";
        localStorage.setItem("username", data.user.name);
      }, 800);
    } else {
      const msg = data?.error || "Registration failed";
      if (errorEl) errorEl.textContent = `Registration error: ${msg}`;
    }
  } catch (error) {
    console.error("Registration exception:", err);
    if (errorEl) errorEl.textContent = "Registration failed (network error).";
  } finally {
    hideLoader("urlLoader");
  }
}

function updateUIForLoggedInUser(user) {
  console.log("Updating UI for user:", user?.name || user);
  const authButtons = document.getElementById("authButtons");
  const quickActions = document.getElementById("quickActions");

  if (authButtons) authButtons.style.display = "none";
  if (quickActions) quickActions.style.display = "flex";

  // Update user menu
  const userMenuContainer = document.getElementById("userMenuContainer");
  if (userMenuContainer) {
    userMenuContainer.innerHTML = `
      <div class="user-menu-enhanced">
        <div class="user-avatar">${(user?.name || "U").charAt(0).toUpperCase()}</div>
        <span style="font-weight: 500; color: #2c3e50;">${user?.name || "User"}</span>
        <button onclick="handleLogout()" class="btn btn-warning" style="padding: 8px 16px;">Logout</button>
      </div>
    `;
  }
  if (typeof hideAnalytics === "function") hideAnalytics();
}

function handleLogout() {
  localStorage.removeItem("userToken");
  localStorage.removeItem("userData");
  localStorage.removeItem("token");
  // Reset UI to logged out state
  document.getElementById("authButtons").style.display = "flex";
  document.getElementById("quickActions").style.display = "none";
  document.getElementById("userMenuContainer").innerHTML = "";
  showNotification("Logged out successfully", "success");
  window.location.href = "/";
  hideAnalytics();
}

function checkExistingLogin() {
  const userData = localStorage.getItem("userData");
  const userToken = localStorage.getItem("userToken");

  if (userData && userToken) {
    try {
      const user = JSON.parse(userData);
      updateUIForLoggedInUser(user);
    } catch (e) {
      localStorage.removeItem("userData");
      localStorage.removeItem("userToken");
    }
  }
}
// Profile Menu Functions
function createProfileMenu(user) {
  return `
    <div class="profile-menu" id="profileMenu">
      <div class="profile-menu-header">
        <div class="profile-menu-title">Profile<div class="user-name">${user.name}</div></div>
        <button class="close-profile-menu" onclick="closeProfileMenu()">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="profile-activity">
        <h4 style="color: #2c3e50; margin-bottom: 1rem; font-size: 0.9rem;">Profile Activity</h4>
          <button
              onclick="showAnalytics()"
              class="btn"
              style="padding: 8px 16px;text-align:center;"
            > Analytics
            </button>
        <div class="activity-item">
          <span class="activity-label">Purchases</span>
          <label class="toggle-switch">
            <input type="checkbox" class="toggle-checkbox" checked>
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="activity-item">
          <span class="activity-label">Account Settings</span>
          <label class="toggle-switch">
            <input type="checkbox" class="toggle-checkbox" checked>
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="activity-item">
          <span class="activity-label">Help Center</span>
          <label class="toggle-switch">
            <input type="checkbox" class="toggle-checkbox">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
      
      <div class="plan-section">
        <div class="plan-badge"> Plan Active</div>
        <div class="days-left">check Your Plan Left</div>
      </div>
      
      <button class="logout-btn" onclick="handleLogout()">Logout</button>
    </div>
  `;
}

function toggleProfileMenu() {
  const profileMenu = document.getElementById("profileMenu");
  if (profileMenu) {
    closeProfileMenu();
    return;
  }

  const userData = JSON.parse(localStorage.getItem("userData"));
  if (userData) {
    const menuHTML = createProfileMenu(userData);
    const userMenuContainer = document.getElementById("userMenuContainer");
    userMenuContainer.insertAdjacentHTML("beforeend", menuHTML);

    // Add click outside to close
    setTimeout(() => {
      document.addEventListener("click", closeProfileMenuOutside);
    }, 100);

    // Add Escape key to close
    document.addEventListener("keydown", handleEscapeKey);
  }
}

function handleEscapeKey(event) {
  if (event.key === "Escape") {
    closeProfileMenu();
  }
}

function closeProfileMenu() {
  const profileMenu = document.getElementById("profileMenu");
  if (profileMenu) {
    profileMenu.remove();
    document.removeEventListener("click", closeProfileMenuOutside);
    document.removeEventListener("keydown", handleEscapeKey);
  }
}
function closeProfileMenuOutside(event) {
  const profileMenu = document.getElementById("profileMenu");
  const userMenuContainer = document.getElementById("userMenuContainer");
  const closeButton = event.target.closest(".close-profile-menu");

  // Don't close if clicking the close button (it has its own handler)
  if (closeButton) return;

  if (
    profileMenu &&
    userMenuContainer &&
    !userMenuContainer.contains(event.target) &&
    !profileMenu.contains(event.target)
  ) {
    closeProfileMenu();
  }
}

// Update the updateUIForLoggedInUser function
function updateUIForLoggedInUser(user) {
  console.log("🔄 Updating UI for user:", user.name);

  // Hide auth butjtons, show quick actions
  const authButtons = document.getElementById("authButtons");
  const quickActions = document.getElementById("quickActions");

  if (authButtons) authButtons.style.display = "none";
  if (quickActions) quickActions.style.display = "flex";

  // Update user menu container with profile menu trigger
  const userMenuContainer = document.getElementById("userMenuContainer");
  if (userMenuContainer) {
    userMenuContainer.innerHTML = `
      <button class="user-menu-trigger" onclick="toggleProfileMenu()">
        <div class="user-avatar-small">${user.name
          .charAt(0)
          .toUpperCase()}</div>
        <span>${user.name}</span>
      </button>
    `;
  }

  // Hide analytics by default (show main content)
  hideAnalytics();
}

// Update handleLogout to close profile menu
function handleLogout() {
  closeProfileMenu();
  localStorage.removeItem("userToken");
  localStorage.removeItem("userData");

  // Reset UI to logged out state
  document.getElementById("authButtons").style.display = "flex";
  document.getElementById("quickActions").style.display = "none";
  document.getElementById("userMenuContainer").innerHTML = "";

  // Show all sections (in case analytics was open)
  hideAnalytics();

  showNotification("👋 Logged out successfully!", "success");
}
// Notification system
function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
      background: ${type === "success" ? "#10b981" : type === "warning" ? "#f59e0b" : type === "error" ? "#ef4444" : "#3b82f6"};
    border-radius: 8px;
    color: white;
    font-weight: bold;
    z-index: 10000;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease-out;
  `;

  notification.textContent = message;
  document.body.appendChild(notification);

  // Auto remove after 4 seconds
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-in";
    notification.style.opacity = "0";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add CSS animations
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// ================================
// 🔹 INITIALIZE EVENT LISTENERS - UPDATED
// ================================

document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 QRcify Pro initialized successfully!");

  // Check if user is already logged in
  checkExistingLogin();

  // Auth modal close buttons
  const closeButtons = document.querySelectorAll(".close-modal");
  closeButtons.forEach((button) => {
    button.addEventListener("click", closeAuthModal);
  });

  // URL QR Generation
  const urlBtn = document.getElementById("generateBtn");
  if (urlBtn) {
    urlBtn.addEventListener("click", generateUrlQR);
  }

  // Encrypt Text QR Generation
  const encryptTextBtn = document.getElementById("encryptTextBtn");
  if (encryptTextBtn) {
    encryptTextBtn.addEventListener("click", generateEncryptedQR);
  }

  // Encrypt File - FIXED: Use the new encryptFile function
  const encryptFileBtn = document.getElementById("encryptFileBtn");
  if (encryptFileBtn) {
    encryptFileBtn.addEventListener("click", encryptFile);
  }

  // Decrypt Text
  const decryptBtn = document.getElementById("decryptBtn");
  if (decryptBtn) {
    decryptBtn.addEventListener("click", decryptText);
  }

  // Enter key support for forms
  const urlInput = document.getElementById("url");
  if (urlInput) {
    urlInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") generateUrlQR();
    });
  }

  const secretDataInput = document.getElementById("secretData");
  const passphraseInput = document.getElementById("passphrase");
  if (secretDataInput && passphraseInput) {
    secretDataInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter" && passphraseInput.value) generateEncryptedQR();
    });
    passphraseInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter" && secretDataInput.value) generateEncryptedQR();
    });
  }

  // Smooth scrolling for navigation
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href");
      const targetSection = document.querySelector(targetId);
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // Close quick generator when clicking outside
  document.addEventListener("click", function (event) {
    const quickModal = document.getElementById("quickGeneratorModal");
    if (event.target === quickModal) {
      closeQuickGenerator();
    }
  });
});

// ================================
// 🔹 1. BASIC URL QR GENERATION
// ================================

async function generateUrlQR() {
  const url = (document.getElementById("url") || {}).value?.trim() || "";
  const urlOutput = document.getElementById("output");

  if (!url) {
    if (urlOutput)
      urlOutput.innerHTML =
        '<div class="error-message">Please enter a valid URL!</div>';
    return;
  }

  let processedUrl = url;
  if (
    !processedUrl.startsWith("http://") &&
    !processedUrl.startsWith("https://")
  ) {
    processedUrl = "https://" + processedUrl;
  }
  showLoader("urlLoader", "Generating QR");
  if (urlOutput) urlOutput.innerHTML = "";
  try {
    const headers = Object.assign(
      { "Content-Type": "application/json" },
      getAuthHeaders()
    );
    const response = await fetch("/api/generate", {
      method: "POST",
      headers,
      body: JSON.stringify({ url: processedUrl }),
    });

    if (!response.ok) {
      const { data } = await parseJSONSafe(response);
      throw new Error(data?.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    if (data.qrCode || data.success) {
      urlOutput.innerHTML = `
        <div class="qr-result">
          <img src="${data.qrCode}" alt="QR Code">
          <p class="success-message">✅ QR Code Generated Successfully!</p>
          <p><strong>URL:</strong> ${processedUrl}</p>
          <button onclick="downloadQRImage('${data.qrCode}', 'url-qr')" class="btn btn-outline">📥 Download QR</button>
        </div>
      `;
    } else {
      urlOutput.innerHTML = `<div class="error-message">Error: ${
        data.error || "Unknown error"
      }</div>`;
    }
  } catch (err) {
    console.error("QR generation error:", err);
    if (urlOutput)
      urlOutput.innerHTML = `<div class="error-message">Failed to generate QR: ${err.message}</div>`;
  } finally {
    hideLoader("urlLoader");
  }
}

// function downloadQRImage(dataUrl, filename = "qr-image") {
//   try {
//     const link = document.createElement("a");
//     link.href = dataUrl;
//     link.download = `${filename}.png`;
//     document.body.appendChild(link);
//     link.click();
//     link.remove();
//   } catch (e) {
//     console.error("Download QR failed:", e);
//     showNotification("Download failed", "error");
//   }
// }
// ================================
// 🔹 2. ENCRYPT TEXT → QR GENERATION
// ================================

async function generateEncryptedQR() {
  const secretData =
    (document.getElementById("secretData") || {}).value?.trim() || "";
  const passphrase =
    (document.getElementById("passphrase") || {}).value?.trim() || "";
  const qrOutput = document.getElementById("qrOutput");

  if (!secretData || !passphrase) {
    qrOutput.innerHTML =
      '<div class="error-message">Both secret text and passphrase are required.</div>';
    return;
  }
  showLoader("textLoader", "Encrypting");
  if (passphrase.length <= 8) {
    qrOutput.innerHTML =
      '<div class="error-message">Passphrase must be at least 6 characters long.</div>';
    return;
  }

  showLoader("textLoader", "Encrypting");

  try {
    const headers = Object.assign(
      { "Content-Type": "application/json" },
      getAuthHeaders()
    );
    const res = await fetch("/api/generate-encryptedText", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secretData, passphrase }),
    });
    if (!res.ok) {
      const { data } = await parseJSONSafe(res);
      throw new Error(data?.error || `Server error: ${res.status}`);
    }
    const data = await res.json();
    if (data.error) {
      qrOutput.innerHTML = `<div class="error-message">${data.error}</div>`;
      return;
    }

    qrOutput.innerHTML = `
      <div class="qr-result">
        <img src="${data.qrCode}" alt="Encrypted QR">
        <div class="success-message">✅ Secure QR Generated!</div>
        <label><strong>Encrypted Text:</strong></label>
        <textarea rows="3" class="form-textarea" readonly>${data.encrypted}</textarea>
        <div style="display: flex; gap: 10px; margin-top: 10px;">
          <button onclick="copyCipherText()" class="btn btn-outline copy-btn">📋 Copy Ciphertext</button>
          <button onclick="downloadQRImage('${data.qrCode}', 'encrypted-qr')" class="btn btn-outline">📥 Download QR</button>
        </div>
      </div>
    `;
  } catch (err) {
    console.error("Encryption error:", err);
    qrOutput.innerHTML = `<div class="error-message">Failed to encrypt: ${err.message}</div>`;
  } finally {
    hideLoader("textLoader");
  }
}

// ================================
// 🔹 3. COPY CIPHERTEXT & DOWNLOAD QR
// ================================

function copyCipherText() {
  const textArea = document.querySelector("#qrOutput textarea");
  if (!textArea) {
    alert("No ciphertext found to copy.");
    return;
  }

  textArea.select();
  navigator.clipboard
    .writeText(textArea.value)
    .then(() =>
      showNotification("✅ Ciphertext copied to clipboard!", "success")
    )
    .catch(() => alert(" Copy failed."));
}

function downloadQRImage(qrDataUrl, filename = "qr-code") {
  try {
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `${filename}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("📥 QR code downloaded!", "success");
  } catch (err) {
    console.error("Download error:", err);
    alert("Failed to download QR code.");
  }
}

// ==================== FIXED QUICK GENERATOR FUNCTIONS ====================

// Quick Generation Functions - PROPERLY CONNECTED TO BACKEND
// async function generateQuickURL() {
//   const url = document.getElementById("quickUrl").value.trim();
//   if (!url) {
//     showNotification("Please enter a URL", "error");
//     return;
//   }

//   try {
//     showLoader("urlLoader", "Generating QR");

//     // Process URL (add https:// if missing)
//     let processedUrl = url;
//     if (!url.startsWith("http://") && !url.startsWith("https://")) {
//       processedUrl = "https://" + url;
//     }

//     // DIRECT API CALL to your backend
//     const response = await fetch("/api/generate", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ url: processedUrl }),
//     });

//     const data = await response.json();

//     if (data.success && data.qrCode) {
//       // Show the QR code in output section
//       document.getElementById("output").innerHTML = `
//         <div class="qr-result">
//           <img src="${data.qrCode}" alt="QR Code">
//           <p class="success-message">✅ QR Code Generated Successfully!</p>
//           <p><strong>URL:</strong> ${processedUrl}</p>
//           <button onclick="downloadQRImage('${data.qrCode}', 'url-qr')" class="btn btn-outline">📥 Download QR</button>
//         </div>
//       `;

//       showNotification("URL QR generated successfully!", "success");
//       closeQuickGenerator();

//       // Scroll to show the result
//       document.getElementById("basic").scrollIntoView({ behavior: "smooth" });
//     } else {
//       throw new Error(data.error || "Failed to generate QR");
//     }
//   } catch (error) {
//     console.error("Quick URL generation failed:", error);
//     showNotification("Failed to generate QR: " + error.message, "error");
//   } finally {
//     hideLoader("urlLoader");
//   }
// }

// async function generateQuickText() {
//   const text = document.getElementById("quickText").value.trim();
//   if (!text) {
//     showNotification("Please enter some text", "error");
//     return;
//   }

//   // For quick text, we'll generate a basic QR without encryption
//   try {
//     showLoader("textLoader", "Generating QR");

//     // DIRECT API CALL for basic text QR (not encrypted)
//     const response = await fetch("/api/generate", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ url: text }), // Using URL endpoint for simple text
//     });

//     const data = await response.json();

//     if (data.success && data.qrCode) {
//       // Show the QR code in secure text output section
//       document.getElementById("qrOutput").innerHTML = `
//         <div class="qr-result">
//           <img src="${data.qrCode}" alt="QR Code">
//           <p class="success-message">✅ Text QR Generated Successfully!</p>
//           <p><strong>Text:</strong> ${text.substring(0, 50)}${
//             text.length > 50 ? "..." : ""
//           }</p>
//           <button onclick="downloadQRImage('${
//             data.qrCode
//           }', 'text-qr')" class="btn btn-outline">📥 Download QR</button>
//         </div>
//       `;

//       showNotification("Text QR generated successfully!", "success");
//       closeQuickGenerator();

//       // Scroll to show the result
//       document.getElementById("secure").scrollIntoView({ behavior: "smooth" });
//     } else {
//       throw new Error(data.error || "Failed to generate QR");
//     }
//   } catch (error) {
//     console.error("Quick text generation failed:", error);
//     showNotification("Failed to generate QR: " + error.message, "error");
//   } finally {
//     hideLoader("textLoader");
//   }
// }

// async function generateQuickWifi() {
//   const ssid = document.getElementById("quickSSID").value.trim();
//   const password = document.getElementById("quickPassword").value.trim();

//   if (!ssid || !password) {
//     showNotification("Please enter WiFi name and password", "error");
//     return;
//   }

//   try {
//     // DIRECT API CALL to your WiFi endpoint
//     const response = await fetch("/api/generate-wifi", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         ssid: ssid,
//         password: password,
//         encryption: "WPA",
//       }),
//     });

//     const data = await response.json();

//     if (data.success && data.qrCode) {
//       // Show the QR code in WiFi output section
//       document.getElementById("wifiOutput").innerHTML = `
//         <div class="qr-result">
//           <img src="${data.qrCode}" alt="WiFi QR Code">
//           <p class="success-message">✅ WiFi QR Generated Successfully!</p>
//           <p><strong>Network:</strong> ${ssid}</p>
//           <button onclick="downloadQRImage('${data.qrCode}', 'wifi-qr')" class="btn btn-outline">📥 Download QR</button>
//         </div>
//       `;

//       showNotification("WiFi QR generated successfully!", "success");
//       closeQuickGenerator();

//       // Scroll to show the result
//       document
//         .getElementById("advanced")
//         .scrollIntoView({ behavior: "smooth" });
//     } else {
//       throw new Error(data.error || "Failed to generate WiFi QR");
//     }
//   } catch (error) {
//     console.error("Quick WiFi generation failed:", error);
//     showNotification("Failed to generate WiFi QR: " + error.message, "error");
//   }
// }

// ==================== ENHANCED DASHBOARD FEATURES ====================

// Quick Generator Functions
function showQuickGenerator() {
  document.getElementById("quickGeneratorModal").style.display = "flex";
}

function closeQuickGenerator() {
  document.getElementById("quickGeneratorModal").style.display = "none";
}

function switchQRTab(tabName) {
  // Hide all tabs
  document.querySelectorAll(".generator-content").forEach((tab) => {
    tab.style.display = "none";
  });

  // Remove active class from all tabs
  document.querySelectorAll(".generator-tab").forEach((tab) => {
    tab.classList.remove("active");
  });

  // Show selected tab and activate button
  document.getElementById(tabName + "Tab").style.display = "block";
  event.target.classList.add("active");
}

// Analytics Dashboard - CONNECTS TO YOUR EXISTING /api/stats ENDPOINT
function showAnalytics() {
  // Hide all main sections
  document.querySelectorAll(".section").forEach((section) => {
    if (section.id !== "analyticsDashboard") {
      section.style.display = "none";
    }
  });

  // Show analytics
  document.getElementById("analyticsDashboard").style.display = "block";
  loadRealStats();
}

function hideAnalytics() {
  // Show all main sections
  document.querySelectorAll(".section").forEach((section) => {
    section.style.display = "block";
  });

  // Hide analytics
  document.getElementById("analyticsDashboard").style.display = "none";
}

async function loadRealStats() {
  try {
    showNotification("Loading analytics...", "info");

    // CONNECTS TO YOUR EXISTING BACKEND ENDPOINT
    const response = await fetch("/api/stats");
    const data = await response.json();

    if (data.success) {
      document.getElementById("totalQrs").textContent =
        data.stats.totalQRs || 0;
      document.getElementById("todayActivity").textContent =
        data.stats.recentActivity || 0;

      // Find most popular type
      if (data.stats.byType && data.stats.byType.length > 0) {
        const popular = data.stats.byType.reduce((max, type) =>
          type.count > max.count ? type : max
        );
        document.getElementById("popularType").textContent = popular.type;
      }

      showNotification("Analytics loaded successfully!", "success");
    }
  } catch (error) {
    console.error("Failed to load stats:", error);
    showNotification("Failed to load analytics. Using demo data.", "error");

    // Fallback demo data
    document.getElementById("totalQrs").textContent = "12";
    document.getElementById("todayActivity").textContent = "3";
    document.getElementById("popularType").textContent = "URL";
  }
}

// ==================== FIXED ADVANCED QR GENERATORS ====================

// Fix vCard QR generation in advanced section
async function generateVCardQR() {
  const name = (document.getElementById("vcardName") || {}).value || "";
  const phone = (document.getElementById("vcardPhone") || {}).value || "";
  const email = (document.getElementById("vcardEmail") || {}).value || "";
  const company = (document.getElementById("vcardCompany") || {}).value || "";
  const output = document.getElementById("vcardOutput");
  if (!name || !phone) {
    if (output)
      output.innerHTML = `<div class="error-message">Name and phone required</div>`;
    return;
  }
  showLoader("textLoader", "Generating vCard QR");
  try {
    const headers = Object.assign(
      { "Content-Type": "application/json" },
      getAuthHeaders()
    );
    // DIRECT API CALL to your vCard endpoint
    const response = await fetch("/api/generate-vcard", {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: name,
        phone: phone,
        email: email,
        company: company,
      }),
    });
    if (!response.ok) {
      const { data } = await parseJSONSafe(response);
      throw new Error(data?.error || `Server error: ${response.status}`);
    }
    const data = await response.json();

    if (data.success && data.qrCode) {
      output.innerHTML = `
        <div class="qr-result">
          <img src="${data.qrCode}" alt="vCard QR Code">
          <p class="success-message">✅ vCard QR Generated Successfully!</p>
          <p><strong>Contact:</strong> ${name}</p>
          <button onclick="downloadQRImage('${data.qrCode}', 'vcard-qr')" class="btn btn-outline">📥 Download QR</button>
        </div>
      `;

      showNotification("vCard QR generated successfully!", "success");
    } else {
      if (output)
        output.innerHTML = `<div class="error-message">${data.error || "Failed"}</div>`;
    }
  } catch (error) {
    console.error("vCard QR generation failed:", error);
    showNotification("Failed to generate vCard QR: " + error.message, "error");
  }
}

// Fix WiFi QR generation in advanced section
async function generateWifiQR() {
  const ssid = (document.getElementById("wifiSsid") || {}).value || "";
  const password = (document.getElementById("wifiPassword") || {}).value || "";
  const encryption =
    (document.getElementById("wifiEncryption") || {}).value || "WPA";
  const output = document.getElementById("wifiOutput");
  if (!ssid || !password) {
    showNotification("SSID and password are required for WiFi QR", "error");
    return;
  }
  showLoader("textLoader", "Generating WiFi QR");
  try {
    const headers = Object.assign(
      { "Content-Type": "application/json" },
      getAuthHeaders()
    );
    // DIRECT API CALL to your WiFi endpoint
    const response = await fetch("/api/generate-wifi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ssid: ssid,
        password: password,
        encryption: encryption,
      }),
    });

    const data = await response.json();

    if (data.success && data.qrCode) {
      output.innerHTML = `
        <div class="qr-result">
          <img src="${data.qrCode}" alt="WiFi QR Code">
          <p class="success-message">✅ WiFi QR Generated Successfully!</p>
          <p><strong>Network:</strong> ${ssid} (${encryption})</p>
          <button onclick="downloadQRImage('${data.qrCode}', 'wifi-qr')" class="btn btn-outline">📥 Download QR</button>
        </div>
      `;

      showNotification("WiFi QR generated successfully!", "success");
    } else {
      throw new Error(data.error || "Failed to generate WiFi QR");
    }
  } catch (error) {
    console.error("WiFi QR generation failed:", error);
    showNotification("Failed to generate WiFi QR: " + error.message, "error");
  }
}

// Fix file encryption
async function encryptFile() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput && fileInput.files && fileInput.files[0];
  const passphrase =
    (document.getElementById("filePassphrase") || {}).value?.trim() || "";
  const fileOutput = document.getElementById("fileOutput");

  if (!file || !passphrase) {
    showNotification("Please enter an encryption passphrase and File", "error");
    return;
  }

  try {
    showLoader("fileLoader", "Encrypting file");

    const reader = new FileReader();

    reader.onload = async function (e) {
      try {
        const base64 = reader.result.split(",")[1]; // Remove data URL prefix
        const filename = file.name;
        const headers = Object.assign(
          { "Content-Type": "application/json" },
          getAuthHeaders()
        );
        // DIRECT API CALL to file encryption endpoint
        const response = await fetch("/api/encrypt-file", {
          method: "POST",
          headers,
          body: JSON.stringify({
            base64: base64,
            passphrase: passphrase,
            filename: filename,
          }),
        });

        const data = await response.json();

        if (data.success && data.qrCode) {
          fileOutput.innerHTML = `
            <div class="qr-result">
              <img src="${data.qrCode}" alt="Encrypted File QR Code">
              <p class="success-message">✅ File Encrypted & QR Generated!</p>
              <p><strong>File:</strong> ${filename}</p>
              ${
                data.downloadUrl
                  ? `
                <p><strong>Download URL:</strong> 
                  <a href="${data.downloadUrl}" target="_blank">${data.downloadUrl}</a>
                </p>
              `
                  : ""
              }
              <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button onclick="downloadQRImage('${
                  data.qrCode
                }', 'encrypted-file-qr')" class="btn btn-outline">📥 Download QR</button>
                ${
                  data.downloadUrl
                    ? `
                  <a href="${data.downloadUrl}" download class="btn btn-secondary">📁 Download Encrypted File</a>
                `
                    : ""
                }
              </div>
            </div>
          `;

          showNotification(
            "File encrypted and QR generated successfully!",
            "success"
          );
        } else {
          throw new Error(data.error || "Failed to encrypt file");
        }
      } catch (error) {
        console.error("File encryption failed:", error);
        showNotification("Failed to encrypt file: " + error.message, "error");
      } finally {
        hideLoader("fileLoader");
      }
    };

    reader.readAsDataURL(file);
  } catch (error) {
    console.error("File encryption failed:", error);
    showNotification("Failed to encrypt file: " + error.message, "error");
    hideLoader("fileLoader");
  }
}

async function decryptText() {
  const cipher =
    (document.getElementById("qrCipher") || {}).value?.trim() || "";
  const passphrase =
    (document.getElementById("userPassphrase") || {}).value?.trim() || "";
  const output = document.getElementById("decryptedOutput");
  if (!cipher || !passphrase) {
    showNotification("Ciphertext and passphrase are required", "error");
    return;
  }

  try {
    showLoader("decryptLoader", "Decrypting");
    const headers = Object.assign(
      { "Content-Type": "application/json" },
      getAuthHeaders()
    );
    // DIRECT API CALL to decryption endpoint
    const response = await fetch("/api/decrypt", {
      method: "POST",
      headers,
      body: JSON.stringify({
        cipher: cipher,
        passphrase: passphrase,
      }),
    });
    const parsed = await parseJSONSafe(response);
    if (!response.ok) {
      const msg = parsed.data?.error || `Server error: ${response.status}`;
      if (output) output.innerText = msg;
      return;
    }

    const data = parsed.data;

    if (data.success && data.decrypted && data) {
      output.innerHTML = `
        <div class="success-message">
          <h4>✅ Decryption Successful!</h4>
          <p><strong>Decrypted Text:</strong></p>
          <div style="background: white; padding: 1rem; border-radius: 8px; border: 1px solid #ddd; margin-top: 1rem;">
            ${data.decrypted}
          </div>
          <button onclick="copyToClipboard('${data.decrypted.replace(
            /'/g,
            "\\'"
          )}')" class="btn btn-outline" style="margin-top: 1rem;">
            📋 Copy Text
          </button>
        </div>
      `;

      showNotification("Text decrypted successfully!", "success");
    } else {
      if (output)
        output.innerText =
          data.error || "Wrong passphrase or invalid ciphertext.";
    }
  } catch (error) {
    console.error("Text decryption failed:", error);
    showNotification("Decryption failed: " + error.message, "error");
  } finally {
    hideLoader("decryptLoader");
  }
}
async function decryptFile() {
  const fileInput = document.getElementById("fileDecryptInput");
  const passphrase =
    (document.getElementById("fileDecryptPassphrase") || {}).value?.trim() ||
    "";
  const decryptedOutput = document.getElementById("decryptedFileOutput");

  if (!fileInput || !fileInput.files.length || !passphrase) {
    showNotification("Attach the encrypted file and enter passphrase", "error");
    return;
  }

  try {
    showLoader("decryptLoader", "Decrypting");

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const encryptedData = reader.result.trim();
        const headers = Object.assign(
          { "Content-Type": "application/json" },
          getAuthHeaders()
        );
        // API CALL to decryption endpoint
        const response = await fetch("/api/decrypt-file", {
          method: "POST",
          headers,
          body: JSON.stringify({
            encryptedData: encryptedData,
            passphrase: passphrase,
            filename: file.name,
          }),
        });
        const parsed = await parseJSONSafe(response);
        if (!response.ok) {
          const msg = parsed.data?.error || `Server error: ${response.status}`;
          if (output) output.innerText = msg;
          hideLoader("decryptLoader");
          return;
        }

        const data = parsed.data;
        if (data.success && data.decryptedBase64) {
          // Convert Base64 to downloadable file
          const byteCharacters = atob(data.decryptedBase64);
          const byteNumbers = new Array(byteCharacters.length)
            .fill(0)
            .map((_, i) => byteCharacters.charCodeAt(i));
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], {
            type: "application/octet-stream",
          });

          decryptedOutput.innerHTML = `
            <div class="success-message">
              <h4>✅ File Decryption Successful!</h4>
              <p><strong>Original File:</strong> ${file.name}</p>
              <p><strong>Decrypted File:</strong> ${data.suggestedFilename}</p>
              <div style="margin-top: 1rem;">
                <a href="${URL.createObjectURL(blob)}" download="${
                  data.suggestedFilename
                }" class="btn btn-primary">
                  📥 Download Decrypted File
                </a>
              </div>
            </div>
          `;

          showNotification("File decrypted successfully!", "success");
        } else {
          throw new Error(data.error || "Decryption failed");
        }
      } catch (error) {
        console.error("File decryption failed:", error);
        showNotification("Decryption failed: " + error.message, "error");
      } finally {
        hideLoader("decryptLoader");
      }
    };

    reader.readAsText(file); // Read as text for encrypted data
  } catch (error) {
    console.error("File decryption failed:", error);
    showNotification("Decryption failed: " + error.message, "error");
    hideLoader("decryptLoader");
  }
}

// Helper function for copy to clipboard
function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      showNotification("Text copied to clipboard!", "success");
    })
    .catch(() => {
      showNotification("Failed to copy text", "error");
    });
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", function () {
  console.log("🎯 QRcify Pro fully loaded with authentication!");
});
