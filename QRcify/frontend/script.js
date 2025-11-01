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
  clearInterval(dotInterval);
}

// ================================
// 🔐 AUTHENTICATION FUNCTIONS - UPDATED
// ================================

function openAuthModal() {
  document.getElementById("authModal").style.display = "flex";
  showLoginForm();
}

function openRegisterModal() {
  document.getElementById("authModal").style.display = "flex";
  showRegisterForm();
}

function showLoginForm() {
  document.getElementById("loginForm").style.display = "block";
  document.getElementById("registerForm").style.display = "none";
}

function showRegisterForm() {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("registerForm").style.display = "block";
}

function closeAuthModal() {
  document.getElementById("authModal").style.display = "none";
  // Clear form fields
  document.getElementById("loginEmail").value = "";
  document.getElementById("loginPassword").value = "";
  document.getElementById("registerName").value = "";
  document.getElementById("registerEmail").value = "";
  document.getElementById("registerPassword").value = "";
}

// Close modal when clicking outside
document.addEventListener("click", function (event) {
  const modal = document.getElementById("authModal");
  if (event.target === modal) {
    closeAuthModal();
  }
});

// Enhanced authentication functions - UPDATED
async function handleLogin() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!email || !password) {
    alert("Email and password required for login.");
    return;
  }

  showLoader("urlLoader", "Logging in");

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success) {
      // ✅ STORE TOKEN AND USER DATA
      localStorage.setItem("userToken", data.token);
      localStorage.setItem("userData", JSON.stringify(data.user));

      closeAuthModal();
      updateUIForLoggedInUser(data.user);
      showNotification("🎉 Login successful! Welcome back.", "success");
    } else {
      alert(data.error || "Login failed. Please try again.");
    }
  } catch (error) {
    console.error("Login error:", error);
    alert("Login failed. Please check your connection and try again.");
  } finally {
    hideLoader("urlLoader");
  }
}

async function handleRegister() {
  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value.trim();

  if (!name || !email || !password) {
    alert("Please fill in all fields.");
    return;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters long.");
    return;
  }

  showLoader("urlLoader", "Creating account");

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (data.success) {
      // ✅ AUTO-LOGIN AFTER SUCCESSFUL REGISTRATION
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const loginData = await loginResponse.json();

      if (loginData.success) {
        localStorage.setItem("userToken", loginData.token);
        localStorage.setItem("userData", JSON.stringify(loginData.user));

        closeAuthModal();
        updateUIForLoggedInUser(loginData.user);
        showNotification(
          "🎉 Registration successful! Welcome to QRcify Pro!",
          "success"
        );
      } else {
        closeAuthModal();
        showLoginForm();
        alert("Registration successful! Please login with your credentials.");
      }
    } else {
      alert(data.error || "Registration failed. Please try again.");
    }
  } catch (error) {
    console.error("Registration error:", error);
    alert("Registration failed. Please check your connection and try again.");
  } finally {
    hideLoader("urlLoader");
  }
}
function handleLogout() {
  console.log("🚪 Logging out...");

  // Clear stored user data
  localStorage.removeItem("userToken");
  localStorage.removeItem("userData");

  // Reset UI
  const authButtons = document.getElementById("authButtons");
  if (authButtons) {
    authButtons.style.display = "flex";
    console.log("✅ Auth buttons shown");
  }

  const userMenuContainer = document.getElementById("userMenuContainer");
  if (userMenuContainer) {
    userMenuContainer.innerHTML = "";
    console.log("✅ User menu cleared");
  }

  // Hide any open dropdown
  const dropdownMenu = document.getElementById("dropdownMenu");
  if (dropdownMenu) {
    dropdownMenu.style.display = "none";
  }

  showNotification("👋 Logged out successfully!", "success");

  // Optional: Refresh the page to reset any user-specific state
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

function updateUIForLoggedInUser(user) {
  console.log("🔄 Updating UI for user:", user);

  // Hide auth buttons
  const authButtons = document.getElementById("authButtons");
  if (authButtons) {
    authButtons.style.display = "none";
    console.log("✅ Auth buttons hidden");
  }

  // Show user menu
  const userMenuContainer = document.getElementById("userMenuContainer");
  if (userMenuContainer) {
    userMenuContainer.innerHTML = `
      <div id="userMenu" style="display: inline-block; position: relative;">
        <button id="userDropdown" class="btn btn-outline" style="display: flex; align-items: center; gap: 8px;">
          👤 ${user.name || user.email}
          <span style="font-size: 12px;">▼</span>
        </button>
        <div id="dropdownMenu" class="dropdown-content">
          <a href="#" onclick="showDashboard()">📊 Dashboard</a>
          <a href="#" onclick="showProfile()">⚙️ Profile</a>
          <a href="#" onclick="handleLogout()" style="color: #e74c3c;">🚪 Logout</a>
        </div>
      </div>
    `;

    // Add dropdown toggle functionality
    const userDropdown = document.getElementById("userDropdown");
    const dropdownMenu = document.getElementById("dropdownMenu");

    if (userDropdown && dropdownMenu) {
      userDropdown.addEventListener("click", function (e) {
        e.stopPropagation();
        console.log("🎯 Dropdown clicked");
        const isVisible = dropdownMenu.style.display === "block";
        dropdownMenu.style.display = isVisible ? "none" : "block";
      });

      // Close dropdown when clicking elsewhere
      document.addEventListener("click", function () {
        console.log("📌 Closing dropdown");
        dropdownMenu.style.display = "none";
      });

      // Prevent dropdown from closing when clicking inside it
      dropdownMenu.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    }
  }
}

function showDashboard() {
  alert(
    "📊 Dashboard feature coming soon!\n\nPlanned features:\n• Your QR code history\n• Usage statistics\n• Saved templates"
  );
}

function showProfile() {
  alert(
    "⚙️ Profile management coming soon!\n\nPlanned features:\n• Update your information\n• Change password\n• Account settings"
  );
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
    border-radius: 8px;
    color: white;
    font-weight: bold;
    z-index: 10000;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease-out;
  `;

  if (type === "success") {
    notification.style.background = "linear-gradient(135deg, #27ae60, #219a52)";
  } else if (type === "error") {
    notification.style.background = "linear-gradient(135deg, #e74c3c, #c0392b)";
  } else {
    notification.style.background = "linear-gradient(135deg, #3498db, #2980b9)";
  }

  notification.textContent = message;
  document.body.appendChild(notification);

  // Auto remove after 4 seconds
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-in";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 4000);
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

  // Encrypt File
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
});

function checkExistingLogin() {
  const userData = localStorage.getItem("userData");
  const userToken = localStorage.getItem("userToken");

  if (userData && userToken) {
    try {
      const user = JSON.parse(userData);
      updateUIForLoggedInUser(user);
      console.log("✅ User automatically logged in:", user.email);
    } catch (e) {
      console.error("❌ Invalid user data in storage");
      // Clear invalid data
      localStorage.removeItem("userData");
      localStorage.removeItem("userToken");
    }
  }
}

// ================================
// 🔹 REST OF YOUR QR FUNCTIONS (UNCHANGED)
// ================================

// [Keep all your existing QR functions exactly as they were:
// generateUrlQR, generateEncryptedQR, encryptFile, decryptText,
// generateVCardQR, generateWifiQR, loadStats, etc.]
// ... include all your existing QR functionality here ...

// ================================
// 🔹 1. BASIC URL QR GENERATION
// ================================

async function generateUrlQR() {
  const url = document.getElementById("url").value.trim();
  const urlOutput = document.getElementById("output");

  if (!url) {
    urlOutput.innerHTML =
      '<div class="error-message">Please enter a valid URL!</div>';
    return;
  }

  // Add https:// if missing
  let processedUrl = url;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    processedUrl = "https://" + url;
  }

  showLoader("urlLoader", "Generating QR");
  urlOutput.innerHTML = "";

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: processedUrl }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
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
    urlOutput.innerHTML = `<div class="error-message">Failed to generate QR: ${err.message}</div>`;
  } finally {
    hideLoader("urlLoader");
  }
}

// ================================
// 🔹 2. ENCRYPT TEXT → QR GENERATION
// ================================

async function generateEncryptedQR() {
  const secretData = document.getElementById("secretData").value.trim();
  const passphrase = document.getElementById("passphrase").value.trim();
  const qrOutput = document.getElementById("qrOutput");

  if (!secretData || !passphrase) {
    qrOutput.innerHTML =
      '<div class="error-message">Both secret text and passphrase are required.</div>';
    return;
  }

  if (passphrase.length < 6) {
    qrOutput.innerHTML =
      '<div class="error-message">Passphrase must be at least 6 characters long.</div>';
    return;
  }

  showLoader("textLoader", "Encrypting");

  try {
    const res = await fetch("/api/generate-encryptedText", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secretData, passphrase }),
    });

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
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
          <button onclick="copyCipherText()" class="btn btn-outline">📋 Copy Ciphertext</button>
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

// [Include all your other existing QR functions...]
// copyCipherText, downloadQRImage, encryptFile, decryptText,
// generateVCardQR, generateWifiQR, loadStats, etc.

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
    .catch(() => alert("❌ Copy failed."));
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

// Initialize when page loads
document.addEventListener("DOMContentLoaded", function () {
  console.log("🎯 QRcify Pro fully loaded with authentication!");
});
