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
// 🔐 AUTHENTICATION FUNCTIONS
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
}

// Close modal when clicking outside
document.addEventListener("click", function (event) {
  const modal = document.getElementById("authModal");

  if (event.target === modal) {
    //outside the modal
    closeAuthModal();
  }
});
const crossmark = document.getElementById("close-modal");
crossmark.addEventListener("click", function (event) {
  closeAuthModal();
});

// Mock functions - will connect to backend later
function handleLogin() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  // TODO: Connect to backend
  console.log("Login attempt:", { email, password });
  alert("Login functionality will be connected to backend soon!");
}

function handleRegister() {
  const name = document.getElementById("registerName").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;

  // TODO: Connect to backend
  console.log("Register attempt:", { name, email, password });
  alert("Registration will be connected to backend soon!");
}

// 🔹 INITIALIZE EVENT LISTENERS

document.addEventListener("DOMContentLoaded", function () {
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

  showLoader("urlLoader", "Generating QR");
  urlOutput.innerHTML = "";

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();
    if (data.qrCode || data.success) {
      urlOutput.innerHTML = `
        <div class="qr-result">
          <img src="${data.qrCode}" alt="QR Code">
          <p class="success-message">✅ QR Code Generated Successfully!</p>
        </div>
      `;
    } else {
      urlOutput.innerHTML = `<div class="error-message">Error: ${data.error}</div>`;
    }
  } catch (err) {
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

  showLoader("textLoader", "Encrypting");

  try {
    const res = await fetch("/api/generate-encryptedText", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secretData, passphrase }),
    });

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
        <button onclick="copyCipherText()" class="btn btn-outline">📋 Copy Ciphertext</button>
      </div>
    `;
  } catch (err) {
    qrOutput.innerHTML = `<div class="error-message">Failed to encrypt: ${err.message}</div>`;
  } finally {
    hideLoader("textLoader");
  }
}

// ================================
// 🔹 3. COPY CIPHERTEXT
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
    .then(() => alert("✅ Ciphertext copied to clipboard!"))
    .catch(() => alert("❌ Copy failed."));
}

// ================================
// 🔹 4. FILE ENCRYPTION
// ================================

async function encryptFile() {
  const file = document.getElementById("fileInput").files[0];
  const passphrase = document.getElementById("filePassphrase").value.trim();
  const fileOutput = document.getElementById("fileOutput");

  if (!file || !passphrase) {
    fileOutput.innerHTML =
      '<div class="error-message">Please upload a file and enter a passphrase.</div>';
    return;
  }

  showLoader("fileLoader", "Encrypting file");

  const reader = new FileReader();

  reader.onload = async () => {
    try {
      const base64 = reader.result.split(",")[1];
      const response = await fetch("/api/encrypt-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, passphrase, filename: file.name }),
      });

      if (!response.ok) {
        throw new Error(`Server error (${response.status})`);
      }

      const data = await response.json();
      if (data.error) {
        fileOutput.innerHTML = `<div class="error-message">${data.error}</div>`;
        return;
      }

      fileOutput.innerHTML = `
        <div class="qr-result">
          <img src="${data.qrCode}" alt="File QR">
          <div class="success-message">✅ File Encrypted Successfully!</div>
          <a href="${data.downloadUrl}" download class="download-link">📥 Download Encrypted File</a>
        </div>
      `;
    } catch (err) {
      fileOutput.innerHTML = `<div class="error-message">Error encrypting file: ${err.message}</div>`;
    } finally {
      hideLoader("fileLoader");
    }
  };

  reader.readAsDataURL(file);
}

// ================================
// 🔹 5. DECRYPTION FUNCTIONS
// ================================
async function decrypt() {
  const cipher = document.getElementById("qrCipher").value.trim();
  const passphrase = document.getElementById("userPassphrase").value.trim();
  const output = document.getElementById("decryptedOutput");

  console.log("🔓 Frontend decrypt called:", {
    cipher: cipher.substring(0, 50) + "...",
    passphrase: passphrase,
  });

  if (!cipher || !passphrase) {
    output.innerHTML =
      '<div class="error-message">Ciphertext and passphrase are required.</div>';
    return;
  }

  showLoader("decryptLoader", "Decrypting");

  try {
    const response = await fetch("/api/decrypt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cipher, passphrase }),
    });

    const data = await response.json();
    console.log("🔓 Backend response:", data);

    if (data.success) {
      output.innerHTML = `
        <div class="success-message">
          <strong>✅ Decryption Successful!</strong><br>
          <strong>Decrypted text:</strong> ${data.decrypted}
        </div>
      `;
    } else {
      output.innerHTML = `<div class="error-message">${data.error}</div>`;
    }
  } catch (error) {
    console.error("Decryption request failed:", error);
    output.innerHTML = `<div class="error-message">Server error: ${error.message}</div>`;
  } finally {
    hideLoader("decryptLoader");
  }
}

async function decryptFile() {
  const fileInput = document.getElementById("fileDecryptInput");
  const passphrase = document
    .getElementById("fileDecryptPassphrase")
    .value.trim();
  const decryptedOutput = document.getElementById("decryptedOutput");

  if (!fileInput.files.length || !passphrase) {
    decryptedOutput.innerHTML =
      '<div class="error-message">Please upload an encrypted file and enter the passphrase.</div>';
    return;
  }

  showLoader("decryptLoader", "Decrypting file");

  try {
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async () => {
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
      if (data.success) {
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
            <strong>✅ File Decrypted Successfully!</strong><br>
            <a href="${URL.createObjectURL(blob)}" download="${
          data.suggestedFilename
        }" class="download-link">
              📥 Download Decrypted File
            </a>
          </div>
        `;
      } else {
        decryptedOutput.innerHTML = `<div class="error-message">${data.error}</div>`;
      }
      hideLoader("decryptLoader");
    };

    reader.readAsText(file);
  } catch (error) {
    decryptedOutput.innerHTML = `<div class="error-message">File decryption failed: ${error.message}</div>`;
    hideLoader("decryptLoader");
  }
}

// ================================
// 🔹 6. ADVANCED QR FEATURES
// ================================
// Update vCard function
async function generateVCardQR() {
  const name = document.getElementById("vcardName").value.trim();
  const phone = document.getElementById("vcardPhone").value.trim();
  const vcardOutput = document.getElementById("vcardOutput"); // ✅ Changed to vcardOutput

  if (!name || !phone) {
    vcardOutput.innerHTML =
      '<div class="error-message">Name and phone are required</div>';
    return;
  }

  showLoader("textLoader", "Generating vCard QR");

  try {
    const response = await fetch("/api/generate-vcard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name,
        phone: phone,
        email: document.getElementById("vcardEmail").value.trim(),
        company: document.getElementById("vcardCompany").value.trim(),
      }),
    });

    const data = await response.json();

    if (data.success) {
      vcardOutput.innerHTML = `  // ✅ Now using vcardOutput
        <div class="qr-result">
          <img src="${data.qrCode}" alt="vCard QR">
          <p class="success-message">✅ vCard QR Generated Successfully!</p>
        </div>
      `;
    } else {
      vcardOutput.innerHTML = `<div class="error-message">${data.error}</div>`;
    }
  } catch (error) {
    vcardOutput.innerHTML = `<div class="error-message">Failed to generate vCard QR: ${error.message}</div>`;
  } finally {
    hideLoader("textLoader");
  }
}

// Update WiFi function
async function generateWifiQR() {
  const ssid = document.getElementById("wifiSsid").value.trim();
  const password = document.getElementById("wifiPassword").value.trim();
  const wifiOutput = document.getElementById("wifiOutput"); // ✅ Changed to wifiOutput

  if (!ssid || !password) {
    wifiOutput.innerHTML =
      '<div class="error-message">SSID and password are required</div>';
    return;
  }

  showLoader("textLoader", "Generating WiFi QR");

  try {
    const response = await fetch("/api/generate-wifi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ssid: ssid,
        password: password,
        encryption: document.getElementById("wifiEncryption").value,
      }),
    });

    const data = await response.json();
    if (data.success) {
      wifiOutput.innerHTML = `  // ✅ Now using wifiOutput
        <div class="qr-result">
          <img src="${data.qrCode}" alt="WiFi QR">
          <p class="success-message">✅ WiFi QR Generated Successfully!</p>
        </div>
      `;
    } else {
      wifiOutput.innerHTML = `<div class="error-message">${data.error}</div>`;
    }
  } catch (error) {
    wifiOutput.innerHTML = `<div class="error-message">Failed to generate WiFi QR: ${error.message}</div>`;
  } finally {
    hideLoader("textLoader");
  }
}

// ================================
// 🔹 7. STATISTICS
// ================================

async function loadStats() {
  try {
    const response = await fetch("/api/stats");
    const data = await response.json();

    if (data.success) {
      const statsContainer = document.getElementById("statsContainer");
      statsContainer.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-number">${data.stats.totalQRs}</span>
            <span class="stat-label">Total QR Codes</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">${data.stats.recentActivity}</span>
            <span class="stat-label">Last 24 Hours</span>
          </div>
          ${data.stats.byType
            .map(
              (type) => `
            <div class="stat-card">
              <span class="stat-number">${type.count}</span>
              <span class="stat-label">${type.type} QR Codes</span>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    }
  } catch (error) {
    console.error("Failed to load stats:", error);
  }
}
