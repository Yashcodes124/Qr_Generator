// script.js — Patched (Option A: keep logic, fix runtime errors + token injection)

// -----------------------
// Utilities
// -----------------------
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

// -----------------------
// Modal & Auth UI helpers
// -----------------------
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
  // hide messages
  const sm = document.getElementById("successMessage");
  const em = document.getElementById("errorMessage");
  if (sm) sm.textContent = "";
  if (em) em.textContent = "";
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
  if (e.key === "Escape") closeAuthModal();
});

// -----------------------
// Auth: Register / Login / Logout
// -----------------------
async function handleRegister(e) {
  if (e && e.preventDefault) e.preventDefault();
  const name = (document.getElementById("registerName") || {}).value || "";
  const email = (document.getElementById("registerEmail") || {}).value || "";
  const password =
    (document.getElementById("registerPassword") || {}).value || "";

  const errorEl = document.getElementById("errorMessage");
  const successEl = document.getElementById("successMessage");
  if (errorEl) errorEl.textContent = "";
  if (successEl) successEl.textContent = "";

  if (!name || !email || !password) {
    if (errorEl) errorEl.textContent = "All fields are required.";
    return;
  }

  try {
    showLoader("urlLoader", "Registering"); // reuse existing loader visually
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
      // Optionally auto-login or switch to login form
      showLoginForm();
    } else {
      const msg = data?.error || "Registration failed";
      if (errorEl) errorEl.textContent = `Registration error: ${msg}`;
    }
  } catch (err) {
    console.error("Registration exception:", err);
    if (errorEl) errorEl.textContent = "Registration failed (network error).";
  } finally {
    hideLoader("urlLoader");
  }
}

async function handleLogin(e) {
  if (e && e.preventDefault) e.preventDefault();
  const email = (document.getElementById("loginEmail") || {}).value || "";
  const password = (document.getElementById("loginPassword") || {}).value || "";

  const errorEl = document.getElementById("errorMessage");
  const successEl = document.getElementById("successMessage");
  if (errorEl) errorEl.textContent = "";
  if (successEl) successEl.textContent = "";

  if (!email || !password) {
    if (errorEl) errorEl.textContent = "Email and password required.";
    return;
  }

  try {
    showLoader("urlLoader", "Logging in");

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

    if (data && data.success && data.token) {
      // Save token and user info
      localStorage.setItem("userToken", data.token);
      localStorage.setItem("userData", JSON.stringify(data.user || {}));
      if (successEl) successEl.textContent = "Login successful!";
      closeAuthModal();
      updateUIForLoggedInUser(data.user || { name: data.user?.name || "User" });

      // Optional: redirect to dashboard if you want
      // setTimeout(() => (window.location.href = "/dashboard/dashboard.html"), 800);
    } else {
      const msg = data?.error || "Login failed";
      if (errorEl) errorEl.textContent = `Login error: ${msg}`;
    }
  } catch (err) {
    console.error("Login exception:", err);
    if (errorEl) errorEl.textContent = "Login failed (network error).";
  } finally {
    hideLoader("urlLoader");
  }
}

function handleLogout() {
  localStorage.removeItem("userToken");
  localStorage.removeItem("token");
  localStorage.removeItem("userData");

  const authButtons = document.getElementById("authButtons");
  const quickActions = document.getElementById("quickActions");
  if (authButtons) authButtons.style.display = "block";
  if (quickActions) quickActions.style.display = "none";

  const userMenuContainer = document.getElementById("userMenuContainer");
  if (userMenuContainer) userMenuContainer.innerHTML = "";
  showNotification("Logged out successfully", "success");
  // Optionally redirect to homepage
  // window.location.href = "/";
}

// -----------------------
// UI Update for logged-in user (keeps your original function logic)
// -----------------------
function updateUIForLoggedInUser(user) {
  console.log("🔄 Updating UI for user:", user?.name || user);

  const authButtons = document.getElementById("authButtons");
  const quickActions = document.getElementById("quickActions");

  if (authButtons) authButtons.style.display = "none";
  if (quickActions) quickActions.style.display = "flex";

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

  // Hide analytics by default (show main content)
  if (typeof hideAnalytics === "function") hideAnalytics();
}

// -----------------------
// URL QR Generation
// -----------------------
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
    if (data.qrCode) {
      if (urlOutput) {
        urlOutput.innerHTML = `
          <div class="qr-result">
            <img src="${data.qrCode}" alt="QR Code"/>
            <p class="success-message">✅ QR Code Generated Successfully!</p>
            <p><strong>URL:</strong> ${processedUrl}</p>
            <button onclick="downloadQRImage('${data.qrCode}', 'url-qr')" class="btn btn-outline">📥 Download QR</button>
          </div>
        `;
      }
    } else {
      if (urlOutput)
        urlOutput.innerHTML = `<div class="error-message">Error: ${data.error || "Unknown error"}</div>`;
    }
  } catch (err) {
    console.error("QR generation error:", err);
    if (urlOutput)
      urlOutput.innerHTML = `<div class="error-message">Failed to generate QR: ${err.message}</div>`;
  } finally {
    hideLoader("urlLoader");
  }
}

// helper to download dataURL as image
function downloadQRImage(dataUrl, filename = "qr-image") {
  try {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (e) {
    console.error("Download QR failed:", e);
    showNotification("Download failed", "error");
  }
}

// -----------------------
// Encrypt Text → QR
// -----------------------
async function generateEncryptedQR() {
  const secretData =
    (document.getElementById("secretData") || {}).value?.trim() || "";
  const passphrase =
    (document.getElementById("passphrase") || {}).value?.trim() || "";
  const output = document.getElementById("qrOutput");

  if (!secretData || !passphrase) {
    alert("Both secret text and passphrase are required for Generating QR.");
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
      headers,
      body: JSON.stringify({ secretData, passphrase }),
    });

    if (!res.ok) {
      const { data } = await parseJSONSafe(res);
      throw new Error(data?.error || `Server error: ${res.status}`);
    }
    const data = await res.json();
    if (data.error) {
      alert(data.error);
      return;
    }

    if (output) {
      output.innerHTML = `
        <img src="${data.qrCode}" alt="Encrypted QR"><br>
        <label>Raw Ciphertext:</label><br>
        <textarea rows="3" cols="40" readonly>${data.encrypted}</textarea>
      `;
    }
  } catch (err) {
    alert("Failed to encrypt: " + err.message);
    console.error("Encryption error:", err);
  } finally {
    hideLoader("textLoader");
  }
}

// -----------------------
// Copy Ciphertext
// -----------------------
function copyCipherText() {
  const textArea = document.querySelector("#qrOutput textarea");
  if (!textArea) return alert("No ciphertext found to copy.");

  textArea.select();
  navigator.clipboard
    .writeText(textArea.value)
    .then(() => alert("Ciphertext copied!"))
    .catch(() => alert("Copy failed."));
}

// -----------------------
// File Encryption
// -----------------------
async function encryptFile() {
  const fileEl = document.getElementById("fileInput");
  const file = fileEl && fileEl.files && fileEl.files[0];
  const passphrase =
    (document.getElementById("filePassphrase") || {}).value?.trim() || "";
  const fileOutput = document.getElementById("fileOutput");

  if (!file || !passphrase) {
    return alert("Please upload a file and enter a passphrase.");
  }

  showLoader("fileLoader", "Encrypting file");

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const base64 = reader.result.split(",")[1];
      const headers = Object.assign(
        { "Content-Type": "application/json" },
        getAuthHeaders()
      );

      const response = await fetch("/api/encrypt-file", {
        method: "POST",
        headers,
        body: JSON.stringify({ base64, passphrase, filename: file.name }),
      });

      if (!response.ok) {
        const { data } = await parseJSONSafe(response);
        throw new Error(data?.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) return alert(data.error);

      if (fileOutput) {
        fileOutput.innerHTML = `
          <img src="${data.qrCode}" alt="File QR"><br>
          <label>Combined (Salt::IV::Ciphertext):</label><br>
          <textarea rows="3" cols="40" readonly>${data.encrypted}</textarea><br>
          <a href="${data.downloadUrl}" download style="text-decoration:none;">Download File</a><br>
          <h3>QR contains download link instead of ciphertext (for large files)</h3><br>
        `;
      }
    } catch (err) {
      alert("Error encrypting file: " + err.message);
      console.error("Error encrypting file:", err);
    } finally {
      hideLoader("fileLoader");
    }
  };

  reader.onerror = (e) => {
    console.error("FileReader error:", e);
    alert("Failed to read file");
    hideLoader("fileLoader");
  };

  reader.readAsDataURL(file);
}

// -----------------------
// Decrypt text (uses server decrypt route)
// -----------------------
async function decryptText() {
  const cipher =
    (document.getElementById("qrCipher") || {}).value?.trim() || "";
  const passphrase =
    (document.getElementById("userPassphrase") || {}).value?.trim() || "";
  const output = document.getElementById("decryptedOutput");

  if (!cipher || !passphrase)
    return alert("Ciphertext and passphrase are required.");

  showLoader("decryptLoader", "Decrypting");

  try {
    const headers = Object.assign(
      { "Content-Type": "application/json" },
      getAuthHeaders()
    );
    const response = await fetch("/api/decrypt", {
      method: "POST",
      headers,
      body: JSON.stringify({ cipher, passphrase }),
    });

    const parsed = await parseJSONSafe(response);
    if (!response.ok) {
      const msg = parsed.data?.error || `Server error: ${response.status}`;
      if (output) output.innerText = msg;
      return;
    }

    const data = parsed.data;
    if (data && data.success) {
      if (output) output.innerText = `Decrypted: ${data.decrypted}`;
    } else {
      if (output)
        output.innerText =
          data.error || "Wrong passphrase or invalid ciphertext.";
    }
  } catch (err) {
    console.error("Decryption request failed:", err);
    if (output) output.innerText = "Server error during decryption.";
  } finally {
    hideLoader("decryptLoader");
  }
}

// -----------------------
// Decrypt File (POSTs .enc file text to server)
// -----------------------
async function decryptFile() {
  const fileInput = document.getElementById("fileDecryptInput");
  const passphrase =
    (document.getElementById("fileDecryptPassphrase") || {}).value?.trim() ||
    "";
  const output = document.getElementById("decryptedFileOutput");

  if (!fileInput || !fileInput.files.length || !passphrase) {
    return alert(
      "Please upload an encrypted (.enc) file and enter the passphrase."
    );
  }

  showLoader("decryptLoader", "Decrypting file...");

  try {
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = async () => {
      const encryptedData = (reader.result || "").trim();

      const headers = Object.assign(
        { "Content-Type": "application/json" },
        getAuthHeaders()
      );
      const response = await fetch("/api/decrypt-file", {
        method: "POST",
        headers,
        body: JSON.stringify({
          encryptedData,
          passphrase,
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
      if (data && data.success && data.decryptedBase64) {
        output.innerText = "File decrypted successfully. Preparing download...";
        const byteCharacters = atob(data.decryptedBase64);
        const byteNumbers = new Array(byteCharacters.length)
          .fill(0)
          .map((_, i) => byteCharacters.charCodeAt(i));
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: "application/octet-stream",
        });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = data.suggestedFilename || "decrypted-file";
        link.textContent = "Download Decrypted File";
        output.appendChild(document.createElement("br"));
        output.appendChild(link);
      } else {
        if (output) output.innerText = data?.error || "Decryption failed.";
      }

      hideLoader("decryptLoader");
    };

    reader.onerror = (e) => {
      console.error("FileReader error during decryptFile:", e);
      if (output) output.innerText = "Failed to read file.";
      hideLoader("decryptLoader");
    };

    reader.readAsText(file);
  } catch (error) {
    console.error("File decryption failed:", error);
    if (output) output.innerText = "Server error during file decryption.";
    hideLoader("decryptLoader");
  }
}

// -----------------------
// vCard & WiFi QR generation wrappers (add token header when logged in)
// -----------------------
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
    const response = await fetch("/api/generate-vcard", {
      method: "POST",
      headers,
      body: JSON.stringify({ name, phone, email, company }),
    });

    if (!response.ok) {
      const { data } = await parseJSONSafe(response);
      throw new Error(data?.error || `Server error: ${response.status}`);
    }
    const data = await response.json();
    if (data && data.qrCode) {
      if (output)
        output.innerHTML = `<img src="${data.qrCode}" alt="vCard QR" />`;
    } else {
      if (output)
        output.innerHTML = `<div class="error-message">${data.error || "Failed"}</div>`;
    }
  } catch (err) {
    console.error("vCard QR generation failed:", err);
    if (output)
      output.innerHTML = `<div class="error-message">vCard QR generation failed: ${err.message}</div>`;
  } finally {
    hideLoader("textLoader");
  }
}

async function generateWifiQR() {
  

  if (!ssid) {
    if (output)
      output.innerHTML = `<div class="error-message">SSID required</div>`;
    return;
  }

  showLoader("textLoader", "Generating WiFi QR");
  try {
    const headers = Object.assign(
      { "Content-Type": "application/json" },
      getAuthHeaders()
    );
    const response = await fetch("/api/generate-wifi", {
      method: "POST",
      headers,
      body: JSON.stringify({ ssid, password, encryption }),
    });

    if (!response.ok) {
      const { data } = await parseJSONSafe(response);
      throw new Error(data?.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    if (data && data.qrCode) {
      if (output)
        output.innerHTML = `<img src="${data.qrCode}" alt="WiFi QR" />`;
    } else {
      if (output)
        output.innerHTML = `<div class="error-message">${data.error || "Failed"}</div>`;
    }
  } catch (err) {
    console.error("WiFi QR generation failed:", err);
    if (output)
      output.innerHTML = `<div class="error-message">WiFi QR generation failed: ${err.message}</div>`;
  } finally {
    hideLoader("textLoader");
  }
}

// -----------------------
// Dashboard helpers and notification (kept generic — not changing logic)
// -----------------------
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    padding: 12px 18px;
    background: ${type === "success" ? "#10b981" : type === "warning" ? "#f59e0b" : type === "error" ? "#ef4444" : "#3b82f6"};
    color: white;
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    z-index: 10000;
    font-weight: 600;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// -----------------------
// Small boot checks: hook buttons if present
// -----------------------
document.addEventListener("DOMContentLoaded", () => {
  const genBtn = document.getElementById("generateBtn");
  if (genBtn) genBtn.addEventListener("click", generateUrlQR);

  const encryptTextBtn = document.getElementById("encryptTextBtn");
  if (encryptTextBtn)
    encryptTextBtn.addEventListener("click", generateEncryptedQR);

  const encryptFileBtn = document.getElementById("encryptFileBtn");
  if (encryptFileBtn) encryptFileBtn.addEventListener("click", encryptFile);

  const decryptTextBtn = document.getElementById("decryptBtn");
  if (decryptTextBtn) decryptTextBtn.addEventListener("click", decryptText);

  const decryptFileBtn = document.querySelector(
    "button[onclick='decryptFile()']"
  );
  // fallback: the decryptFile button is sometimes inline onclick; ignore if not found.
});
