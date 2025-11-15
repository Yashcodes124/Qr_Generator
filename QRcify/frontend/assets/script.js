// ==================== GLOBAL ERROR HANDLER ====================
window.addEventListener("error", function (event) {
  console.error("❌ Global error:", event.error);
  showNotification(
    "An unexpected error occurred. Please refresh the page.",
    "error"
  );
});

window.addEventListener("unhandledrejection", function (event) {
  console.error("❌ Unhandled promise rejection:", event.reason);
  showNotification("Network error. Please check your connection.", "error");
});

// ==================== UTILITY FUNCTIONS ====================
function getToken() {
  return localStorage.getItem("userToken") || localStorage.getItem("token");
}

function isAuthenticated() {
  return !!getToken();
}

async function apiFetch(endpoint, options = {}) {
  const token = getToken();

  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
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
      localStorage.clear();
      window.location.href = "/index.html";
      throw new Error("Session expired. Please login again.");
    }

    return response;
  } catch (error) {
    console.error("API Fetch error:", error);
    throw error;
  }
}

// ==================== LOADER FUNCTIONS ====================
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

// ==================== NOTIFICATION SYSTEM ====================
function showNotification(message, type = "info") {
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

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-in";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 4000);
}

// ==================== AUTHENTICATION ====================
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
  document.getElementById("loginEmail").value = "";
  document.getElementById("loginPassword").value = "";
  document.getElementById("registerName").value = "";
  document.getElementById("registerEmail").value = "";
  document.getElementById("registerPassword").value = "";
  clearMessages();
}

function showSuccess(message) {
  const successEl = document.getElementById("successMessage");
  if (successEl) {
    successEl.textContent = message;
    successEl.classList.add("show");
    setTimeout(() => successEl.classList.remove("show"), 5000);
  }
}

function showError(message) {
  const errorEl = document.getElementById("errorMessage");
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add("show");
    setTimeout(() => errorEl.classList.remove("show"), 5000);
  }
}

function clearMessages() {
  const successEl = document.getElementById("successMessage");
  const errorEl = document.getElementById("errorMessage");
  if (successEl) successEl.classList.remove("show");
  if (errorEl) errorEl.classList.remove("show");
}

function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const icon = event.currentTarget.querySelector("i");

  if (input.type === "password") {
    input.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
}

async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const btn = document.getElementById("loginBtn");

  if (!email || !password) {
    showError("Please fill in all fields");
    return;
  }

  btn.classList.add("loading");
  btn.textContent = "Logging in...";

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem("userToken", data.token);
      localStorage.setItem("userData", JSON.stringify(data.user));

      showSuccess("Login successful! Redirecting...");

      setTimeout(() => {
        closeAuthModal();
        window.location.href = "/dashboard/dashboard.html";
      }, 1000);
    } else {
      showError(data.error || "Login failed. Please try again.");
    }
  } catch (error) {
    console.error("Login error:", error);
    showError("Connection error. Please check your internet.");
  } finally {
    btn.classList.remove("loading");
    btn.textContent = "Login to Account";
  }
}

async function handleRegister(event) {
  event.preventDefault();

  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value.trim();
  const btn = document.getElementById("registerBtn");

  if (!name || !email || !password) {
    showError("Please fill in all fields");
    return;
  }

  if (password.length < 6) {
    showError("Password must be at least 6 characters");
    return;
  }

  btn.classList.add("loading");
  btn.textContent = "Creating account...";

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (data.success) {
      showSuccess("Account created! Logging you in...");

      setTimeout(async () => {
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
          window.location.href = "/dashboard/dashboard.html";
        }
      }, 1000);
    } else {
      showError(data.error || "Registration failed. Please try again.");
    }
  } catch (error) {
    console.error("Registration error:", error);
    showError("Connection error. Please check your internet.");
  } finally {
    btn.classList.remove("loading");
    btn.textContent = "Create Account";
  }
}

function handleLogout() {
  localStorage.removeItem("userToken");
  localStorage.removeItem("userData");
  window.location.href = "/index.html";
  showNotification("👋 Logged out successfully!", "success");
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

function updateUIForLoggedInUser(user) {
  const authButtons = document.getElementById("authButtons");
  const quickActions = document.getElementById("quickActions");

  if (authButtons) authButtons.style.display = "none";
  if (quickActions) quickActions.style.display = "flex";

  const userMenuContainer = document.getElementById("userMenuContainer");
  if (userMenuContainer) {
    userMenuContainer.innerHTML = `
      <button class="user-menu-trigger" onclick="toggleProfileMenu()">
        <div class="user-avatar-small">${user.name.charAt(0).toUpperCase()}</div>
        <span>${user.name}</span>
      </button>
    `;
  }
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

    setTimeout(() => {
      document.addEventListener("click", closeProfileMenuOutside);
    }, 100);
  }
}

function createProfileMenu(user) {
  return `
    <div class="profile-menu" id="profileMenu">
      <div class="profile-menu-header">
        <div class="profile-menu-title">
          <div class="user-name">${user.name}</div>
        </div>
        <button class="close-profile-menu" onclick="closeProfileMenu()">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="user-info">
        <div class="user-email">${user.email}</div>
      </div>
      <button class="logout-btn" onclick="handleLogout()">Logout</button>
    </div>
  `;
}

function closeProfileMenu() {
  const profileMenu = document.getElementById("profileMenu");
  if (profileMenu) {
    profileMenu.remove();
    document.removeEventListener("click", closeProfileMenuOutside);
  }
}

function closeProfileMenuOutside(event) {
  const profileMenu = document.getElementById("profileMenu");
  const userMenuContainer = document.getElementById("userMenuContainer");
  const closeButton = event.target.closest(".close-profile-menu");

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

// ==================== QR GENERATION ====================
async function generateUrlQR() {
  const url = document.getElementById("url").value.trim();
  const urlOutput = document.getElementById("output");

  if (!url) {
    urlOutput.innerHTML =
      '<div class="error-message">Please enter a valid URL!</div>';
    return;
  }

  let processedUrl = url;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    processedUrl = "https://" + url;
  }

  showLoader("urlLoader", "Generating QR");
  urlOutput.innerHTML = "";

  try {
    const response = await apiFetch("/api/generate", {
      method: "POST",
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
      urlOutput.innerHTML = `<div class="error-message">Error: ${data.error || "Unknown error"}</div>`;
    }
  } catch (err) {
    console.error("QR generation error:", err);
    urlOutput.innerHTML = `<div class="error-message">Failed to generate QR: ${err.message}</div>`;
  } finally {
    hideLoader("urlLoader");
  }
}

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
    const res = await apiFetch("/api/generate-encryptedText", {
      method: "POST",
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

async function encryptFile() {
  const fileInput = document.getElementById("fileInput");
  const passphrase = document.getElementById("filePassphrase").value.trim();

  if (!fileInput.files[0]) {
    showNotification("Please select a file to encrypt", "error");
    return;
  }

  if (!passphrase || passphrase.length < 6) {
    showNotification("Please enter a passphrase (min 6 characters)", "error");
    return;
  }

  try {
    showLoader("fileLoader", "Encrypting file");

    const file = fileInput.files[0];

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      hideLoader("fileLoader");
      showNotification(
        `File too large! Maximum size is 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        "error"
      );
      return;
    }

    const reader = new FileReader();

    reader.onload = async function (e) {
      try {
        const base64 = e.target.result.split(",")[1];
        const filename = file.name;

        const response = await apiFetch("/api/encrypt-file", {
          method: "POST",
          body: JSON.stringify({
            base64: base64,
            passphrase: passphrase,
            filename: filename,
            fileType: file.type,
          }),
        });

        const data = await response.json();

        if (data.success && data.qrCode) {
          document.getElementById("fileOutput").innerHTML = `
            <div class="qr-result">
              <img src="${data.qrCode}" alt="Encrypted File QR Code">
              <p class="success-message">✅ File Encrypted & QR Generated!</p>
              <p><strong>File:</strong> ${filename}</p>
              <p><strong>Size:</strong> ${(data.fileSize / 1024).toFixed(2)} KB</p>
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
                <button onclick="downloadQRImage('${data.qrCode}', 'encrypted-file-qr')" class="btn btn-outline">📥 Download QR</button>
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

          showNotification("File encrypted successfully!", "success");
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

    reader.onerror = function () {
      hideLoader("fileLoader");
      showNotification("Failed to read file", "error");
    };

    reader.readAsDataURL(file);
  } catch (error) {
    console.error("File encryption failed:", error);
    showNotification("Failed to encrypt file: " + error.message, "error");
    hideLoader("fileLoader");
  }
}

async function generateVCardQR() {
  const name = document.getElementById("vcardName").value.trim();
  const phone = document.getElementById("vcardPhone").value.trim();

  if (!name || !phone) {
    showNotification("Name and phone are required for vCard", "error");
    return;
  }

  try {
    const email = document.getElementById("vcardEmail").value.trim();
    const company = document.getElementById("vcardCompany").value.trim();

    const response = await apiFetch("/api/generate-vcard", {
      method: "POST",
      body: JSON.stringify({ name, phone, email, company }),
    });

    const data = await response.json();

    if (data.success && data.qrCode) {
      document.getElementById("vcardOutput").innerHTML = `
        <div class="qr-result">
          <img src="${data.qrCode}" alt="vCard QR Code">
          <p class="success-message">✅ vCard QR Generated Successfully!</p>
          <p><strong>Contact:</strong> ${name}</p>
          <button onclick="downloadQRImage('${data.qrCode}', 'vcard-qr')" class="btn btn-outline">📥 Download QR</button>
        </div>
      `;
      showNotification("vCard QR generated successfully!", "success");
    } else {
      throw new Error(data.error || "Failed to generate vCard QR");
    }
  } catch (error) {
    console.error("vCard QR generation failed:", error);
    showNotification("Failed to generate vCard QR: " + error.message, "error");
  }
}

async function generateWifiQR() {
  const ssid = document.getElementById("wifiSsid").value.trim();
  const password = document.getElementById("wifiPassword").value.trim();
  const encryption = document.getElementById("wifiEncryption").value;

  if (!ssid || !password) {
    showNotification("SSID and password are required for WiFi QR", "error");
    return;
  }

  try {
    const response = await apiFetch("/api/generate-wifi", {
      method: "POST",
      body: JSON.stringify({ ssid, password, encryption }),
    });

    const data = await response.json();

    if (data.success && data.qrCode) {
      document.getElementById("wifiOutput").innerHTML = `
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

// ==================== DECRYPTION ====================
async function decryptText() {
  const cipher = document.getElementById("qrCipher").value.trim();
  const passphrase = document.getElementById("userPassphrase").value.trim();
  const decryptedOutput = document.getElementById("decryptedOutput");

  if (!cipher || !passphrase) {
    decryptedOutput.innerHTML =
      '<div class="error-message">❌ Ciphertext and passphrase are required</div>';
    return;
  }

  try {
    showLoader("decryptLoader", "Decrypting");

    const response = await fetch("/api/decrypt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cipher, passphrase }),
    });

    const data = await response.json();

    hideLoader("decryptLoader");

    if (data.success && data.decrypted) {
      decryptedOutput.innerHTML = `
        <div class="success-message" style="margin-top: 1rem;">
          <h4 style="margin-bottom: 1rem;">✅ Decryption Successful!</h4>
          <p style="margin-bottom: 0.5rem;"><strong>Decrypted Text:</strong></p>
          <div style="background: var(--bg-primary); padding: 1rem; border-radius: 8px; border: 1px solid var(--border); margin-top: 1rem; word-wrap: break-word;">
            ${data.decrypted}
          </div>
          <button onclick="copyToClipboard(\`${data.decrypted.replace(/`/g, "\\`")}\`)" class="btn btn-outline" style="margin-top: 1rem;">
            📋 Copy Text
          </button>
        </div>
      `;
      showNotification("Text decrypted successfully!", "success");
    } else {
      decryptedOutput.innerHTML = `<div class="error-message">❌ ${data.error || "Decryption failed - wrong passphrase?"}</div>`;
      showNotification("Decryption failed", "error");
    }
  } catch (error) {
    hideLoader("decryptLoader");
    console.error("Text decryption failed:", error);
    decryptedOutput.innerHTML = `<div class="error-message">❌ Decryption failed: ${error.message}</div>`;
    showNotification("Decryption failed: " + error.message, "error");
  }
}
async function decryptFile() {
  const fileInput = document.getElementById("fileDecryptInput");
  const passphrase = document
    .getElementById("fileDecryptPassphrase")
    .value.trim();
  const decryptedOutput = document.getElementById("decryptedFileOutput");

  if (!fileInput.files.length || !passphrase) {
    decryptedOutput.innerHTML =
      '<div class="error-message">❌ Select encrypted file and enter passphrase</div>';
    return;
  }

  try {
    showLoader("decryptLoader", "Decrypting");

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const encryptedData = reader.result.trim();

        const response = await fetch("/api/decrypt-file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            encryptedData,
            passphrase,
            filename: file.name,
          }),
        });

        const data = await response.json();

        hideLoader("decryptLoader");

        if (data.success && data.decryptedBase64) {
          const byteCharacters = atob(data.decryptedBase64);
          const byteNumbers = new Array(byteCharacters.length)
            .fill(0)
            .map((_, i) => byteCharacters.charCodeAt(i));
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], {
            type: "application/octet-stream",
          });

          decryptedOutput.innerHTML = `
            <div class="success-message" style="margin-top: 1rem;">
              <h4 style="margin-bottom: 1rem;">✅ File Decryption Successful!</h4>
              <p><strong>Original File:</strong> ${file.name}</p>
              <p><strong>Decrypted File:</strong> ${data.suggestedFilename}</p>
              <div style="margin-top: 1.5rem;">
                <a href="${URL.createObjectURL(blob)}" download="${data.suggestedFilename}" class="btn btn-primary">
                  📥 Download Decrypted File
                </a>
              </div>
            </div>
          `;
          showNotification("File decrypted successfully!", "success");
        } else {
          decryptedOutput.innerHTML = `<div class="error-message">❌ ${data.error || "Decryption failed - wrong passphrase?"}</div>`;
          showNotification("Decryption failed", "error");
        }
      } catch (error) {
        hideLoader("decryptLoader");
        console.error("File decryption failed:", error);
        decryptedOutput.innerHTML = `<div class="error-message">❌ Decryption failed: ${error.message}</div>`;
        showNotification("Decryption failed: " + error.message, "error");
      }
    };

    reader.onerror = function () {
      hideLoader("decryptLoader");
      decryptedOutput.innerHTML =
        '<div class="error-message">❌ Failed to read encrypted file</div>';
      showNotification("Failed to read file", "error");
    };

    reader.readAsText(file);
  } catch (error) {
    hideLoader("decryptLoader");
    console.error("File decryption failed:", error);
    decryptedOutput.innerHTML = `<div class="error-message">❌ Decryption failed: ${error.message}</div>`;
    showNotification("Decryption failed: " + error.message, "error");
  }
}
// ==================== HELPER FUNCTIONS ====================
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

function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => showNotification("Text copied to clipboard!", "success"))
    .catch(() => showNotification("Failed to copy text", "error"));
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

// ==================== QUICK GENERATOR ====================
function showQuickGenerator() {
  document.getElementById("quickGeneratorModal").style.display = "flex";
}

function closeQuickGenerator() {
  document.getElementById("quickGeneratorModal").style.display = "none";
}

function switchQRTab(tabName) {
  document.querySelectorAll(".generator-content").forEach((tab) => {
    tab.style.display = "none";
  });

  document.querySelectorAll(".generator-tab").forEach((tab) => {
    tab.classList.remove("active");
  });

  document.getElementById(tabName + "Tab").style.display = "block";
  event.target.classList.add("active");
}

async function generateQuickURL() {
  const url = document.getElementById("quickUrl").value.trim();
  if (!url) {
    showNotification("Please enter a URL", "error");
    return;
  }

  try {
    showLoader("urlLoader", "Generating QR");

    let processedUrl = url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      processedUrl = "https://" + url;
    }

    const response = await apiFetch("/api/generate", {
      method: "POST",
      body: JSON.stringify({ url: processedUrl }),
    });

    const data = await response.json();

    if (data.success && data.qrCode) {
      document.getElementById("output").innerHTML = `
        <div class="qr-result">
          <img src="${data.qrCode}" alt="QR Code">
          <p class="success-message">✅ QR Code Generated Successfully!</p>
          <p><strong>URL:</strong> ${processedUrl}</p>
          <button onclick="downloadQRImage('${data.qrCode}', 'url-qr')" class="btn btn-outline">📥 Download QR</button>
        </div>
      `;

      showNotification("URL QR generated successfully!", "success");
      closeQuickGenerator();
      document.getElementById("basic").scrollIntoView({ behavior: "smooth" });
    } else {
      throw new Error(data.error || "Failed to generate QR");
    }
  } catch (error) {
    console.error("Quick URL generation failed:", error);
    showNotification("Failed to generate QR: " + error.message, "error");
  } finally {
    hideLoader("urlLoader");
  }
}

async function generateQuickText() {
  const text = document.getElementById("quickText").value.trim();
  if (!text) {
    showNotification("Please enter some text", "error");
    return;
  }

  try {
    showLoader("textLoader", "Generating QR");

    const response = await apiFetch("/api/generate", {
      method: "POST",
      body: JSON.stringify({ url: text }),
    });

    const data = await response.json();

    if (data.success && data.qrCode) {
      document.getElementById("qrOutput").innerHTML = `
        <div class="qr-result">
          <img src="${data.qrCode}" alt="QR Code">
          <p class="success-message">✅ Text QR Generated Successfully!</p>
          <p><strong>Text:</strong> ${text.substring(0, 50)}${text.length > 50 ? "..." : ""}</p>
          <button onclick="downloadQRImage('${data.qrCode}', 'text-qr')" class="btn btn-outline">📥 Download QR</button>
        </div>
      `;

      showNotification("Text QR generated successfully!", "success");
      closeQuickGenerator();
      document.getElementById("secure").scrollIntoView({ behavior: "smooth" });
    } else {
      throw new Error(data.error || "Failed to generate QR");
    }
  } catch (error) {
    console.error("Quick text generation failed:", error);
    showNotification("Failed to generate QR: " + error.message, "error");
  } finally {
    hideLoader("textLoader");
  }
}

async function generateQuickWifi() {
  const ssid = document.getElementById("quickSSID").value.trim();
  const password = document.getElementById("quickPassword").value.trim();

  if (!ssid || !password) {
    showNotification("Please enter WiFi name and password", "error");
    return;
  }

  try {
    const response = await apiFetch("/api/generate-wifi", {
      method: "POST",
      body: JSON.stringify({ ssid, password, encryption: "WPA" }),
    });

    const data = await response.json();

    if (data.success && data.qrCode) {
      document.getElementById("wifiOutput").innerHTML = `
        <div class="qr-result">
          <img src="${data.qrCode}" alt="WiFi QR Code">
          <p class="success-message">✅ WiFi QR Generated Successfully!</p>
          <p><strong>Network:</strong> ${ssid}</p>
          <button onclick="downloadQRImage('${data.qrCode}', 'wifi-qr')" class="btn btn-outline">📥 Download QR</button>
        </div>
      `;

      showNotification("WiFi QR generated successfully!", "success");
      closeQuickGenerator();
      document
        .getElementById("advanced")
        .scrollIntoView({ behavior: "smooth" });
    } else {
      throw new Error(data.error || "Failed to generate WiFi QR");
    }
  } catch (error) {
    console.error("Quick WiFi generation failed:", error);
    showNotification("Failed to generate WiFi QR: " + error.message, "error");
  }
}

// ==================== ANALYTICS ====================
function showAnalytics() {
  document.querySelectorAll(".section").forEach((section) => {
    if (section.id !== "analyticsDashboard") {
      section.style.display = "none";
    }
  });

  document.getElementById("analyticsDashboard").style.display = "block";
  loadRealStats();
}

function hideAnalytics() {
  document.querySelectorAll(".section").forEach((section) => {
    section.style.display = "block";
  });

  document.getElementById("analyticsDashboard").style.display = "none";
}

async function loadRealStats() {
  try {
    showNotification("Loading analytics...", "info");

    const response = await apiFetch("/api/stats");
    const data = await response.json();

    if (data.success) {
      document.getElementById("totalQrs").textContent =
        data.stats.totalQRs || 0;
      document.getElementById("todayActivity").textContent =
        data.stats.recentActivity || 0;

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
    showNotification("Failed to load analytics", "error");

    document.getElementById("totalQrs").textContent = "0";
    document.getElementById("todayActivity").textContent = "0";
    document.getElementById("popularType").textContent = "-";
  }
}

async function loadStats() {
  const statsContainer = document.getElementById("statsContainer");
  statsContainer.innerHTML =
    '<div class="loader-container"><div class="loader"></div><span>Loading statistics...</span></div>';

  try {
    const response = await apiFetch("/api/stats");
    const data = await response.json();

    if (data.success) {
      const stats = data.stats;

      let byTypeHTML = "";
      if (stats.byType && stats.byType.length > 0) {
        byTypeHTML = stats.byType
          .map(
            (item) => `
          <div class="stat-item">
            <span>${item.type}</span>
            <span>${item.count}</span>
          </div>
        `
          )
          .join("");
      }

      statsContainer.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-number">${stats.totalQRs || 0}</span>
            <span class="stat-label">Total QR Codes</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">${stats.recentActivity || 0}</span>
            <span class="stat-label">Recent Activity (24h)</span>
          </div>
        </div>
        ${
          byTypeHTML
            ? `
          <div style="margin-top: 2rem;">
            <h4>By Type</h4>
            <div style="margin-top: 1rem;">
              ${byTypeHTML}
            </div>
          </div>
        `
            : ""
        }
      `;
    }
  } catch (error) {
    console.error("Failed to load stats:", error);
    statsContainer.innerHTML =
      '<div class="error-message">Failed to load statistics</div>';
  }
}

// ==================== INITIALIZATION ====================
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

  // Enter key support for URL input
  const urlInput = document.getElementById("url");
  if (urlInput) {
    urlInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") generateUrlQR();
    });
  }

  // Enter key support for encrypted text
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

  // Close modals on outside click
  const authModal = document.getElementById("authModal");
  if (authModal) {
    authModal.addEventListener("click", function (e) {
      if (e.target === this) {
        closeAuthModal();
      }
    });
  }

  const quickModal = document.getElementById("quickGeneratorModal");
  if (quickModal) {
    quickModal.addEventListener("click", function (e) {
      if (e.target === this) {
        closeQuickGenerator();
      }
    });
  }

  // Close modals on Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeAuthModal();
      closeQuickGenerator();
      closeProfileMenu();
    }
  });
});

// Add CSS animations for notifications
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
