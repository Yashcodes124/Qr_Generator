// ✅ Store registration data temporarily
let pendingRegistration = {
  name: null,
  email: null,
  password: null,
};

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
  window.addEventListener("load", function () {
    document.getElementById("loginForm").reset();
    this.document.getElementById("registerForm").reset();
  });
}

function openRegisterModal() {
  document.getElementById("authModal").style.display = "flex";
  showRegisterForm();
}

function showLoginForm() {
  document.getElementById("loginForm").style.display = "block";
  document.getElementById("registerForm").style.display = "none";
}

// ✅ FIXED: Safely close auth modal
function closeAuthModal() {
  document.getElementById("authModal").style.display = "none";

  // ✅ FIX: Check if elements exist before accessing
  const step1 = document.getElementById("registerFormStep1");
  const step2 = document.getElementById("registerFormStep2");

  if (step1) step1.style.display = "block";
  if (step2) step2.style.display = "none";

  // ✅ Clear form inputs safely
  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");
  const registerName = document.getElementById("registerName");
  const registerEmail = document.getElementById("registerEmail");
  const registerPassword = document.getElementById("registerPassword");
  const otpInput = document.getElementById("otpInput");

  if (loginEmail) loginEmail.value = "";
  if (loginPassword) loginPassword.value = "";
  if (registerName) registerName.value = "";
  if (registerEmail) registerEmail.value = "";
  if (registerPassword) registerPassword.value = "";
  if (otpInput) otpInput.value = "";

  clearMessages();
}

function showRegisterForm() {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("registerForm").style.display = "block";
  document.getElementById("registerFormStep1").style.display = "block";
  document.getElementById("registerFormStep2").style.display = "none";
}
function openForgotPasswordModal() {
  document.getElementById("forgotPasswordModal").style.display = "flex";
  closeAuthModal();
}

function closeForgotPasswordModal() {
  document.getElementById("forgotPasswordModal").style.display = "none";
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
    console.log("Registering User:", email);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (data.success) {
      console.log("✅ Registration successful");

      // ✅ Save registration data
      pendingRegistration = { name, email, password };

      // ✅ Show OTP verification form
      document.getElementById("registerFormStep1").style.display = "none";
      document.getElementById("registerFormStep2").style.display = "block";
      document.getElementById("verificationEmail").textContent =
        `📧 OTP sent to: ${email}`;

      showSuccess("Check your email for the OTP!");

      if (data.emailSent === false) {
        showError("⚠️ Email config not set up. Check server logs for OTP.");
      }

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
      if (data.unverified) {
        showError(
          "Email not verified. Check your email for OTP or request a new one."
        );
        console.log("⚠️ User email not verified");
      } else {
        showError(data.error || "Login failed. Please try again.");
      }
    }
  } catch (error) {
    console.error("Login error:", error);
    showError("Connection error. Please check your internet.");
  } finally {
    btn.classList.remove("loading");
    btn.textContent = "Login to Account";
  }
}

async function handleForgotPassword(event) {
  event.preventDefault();

  const email = document.getElementById("resetEmail").value.trim();
  const btn = document.getElementById("resetBtn");

  btn.classList.add("loading");
  btn.textContent = "Sending...";

  try {
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (data.success) {
      showSuccess("Reset link sent! Check your email");
      setTimeout(() => {
        closeForgotPasswordModal();
        document.getElementById("resetEmail").value = "";
      }, 2000);
    } else {
      showError(data.error || "Failed to send reset link");
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    showError("Failed to send reset link");
  } finally {
    btn.classList.remove("loading");
    btn.textContent = "Send Reset Link";
  }
}

async function handleVerifyOTP(event) {
  event.preventDefault();

  const otp = document.getElementById("otpInput").value.trim();
  const email = pendingRegistration.email;
  const btn = document.getElementById("verifyOTPBtn");

  if (!otp || otp.length !== 6) {
    showError("Please enter a valid 6-digit OTP");
    return;
  }

  btn.classList.add("loading");
  btn.textContent = "Verifying...";

  try {
    console.log("🔍 Verifying OTP for:", email);

    const response = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();

    if (data.success) {
      console.log("✅ Email verified!");

      // ✅ Save token
      localStorage.setItem("userToken", data.token);
      localStorage.setItem("userData", JSON.stringify(data.user));

      showSuccess("Email verified! Redirecting to dashboard...");

      setTimeout(() => {
        closeAuthModal();
        window.location.href = "/dashboard/dashboard.html";
      }, 1500);
    } else {
      showError(data.error || "Verification failed");
    }
  } catch (error) {
    console.error("OTP verification error:", error);
    showError("Verification failed. Please try again.");
  } finally {
    btn.classList.remove("loading");
    btn.textContent = "Verify Email";
  }
}

function handlePasswordResetFromURL() {
  const params = new URLSearchParams(window.location.search);
  const resetToken = params.get("reset");

  if (resetToken) {
    showPasswordResetForm(resetToken);
  }
}

function showPasswordResetForm(resetToken) {
  // Show modal to enter new password
  const newPassword = prompt("Enter new password (min 6 characters):");

  if (!newPassword || newPassword.length < 6) {
    showError("Password must be at least 6 characters");
    return;
  }

  submitPasswordReset(resetToken, newPassword);
}

async function submitPasswordReset(resetToken, newPassword) {
  try {
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetToken, newPassword }),
    });

    const data = await response.json();

    if (data.success) {
      showSuccess("Password reset successfully! Please login");
      setTimeout(() => {
        window.location.href = "/index.html";
      }, 1500);
    } else {
      showError(data.error || "Failed to reset password");
    }
  } catch (error) {
    console.error("Reset password error:", error);
    showError("Failed to reset password");
  }
}

async function handleResendOTP(event) {
  event.preventDefault();

  const email = pendingRegistration.email;
  const btn = event.target;

  btn.disabled = true;
  btn.textContent = "Sending...";

  try {
    console.log("📧 Resending OTP for:", email);

    const response = await fetch("/api/auth/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (data.success) {
      showSuccess("OTP resent! Check your email.");
      btn.textContent = "OTP Sent ✓";

      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = "Resend OTP";
      }, 10000); // Re-enable after 10 seconds
    } else {
      showError(data.error || "Failed to resend OTP");
      btn.disabled = false;
      btn.textContent = "Resend OTP";
    }
  } catch (error) {
    console.error("Resend OTP error:", error);
    showError("Failed to resend OTP");
    btn.disabled = false;
    btn.textContent = "Resend OTP";
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

function createProfileMenu(user) {
  return `
    <div class="profile-menu" id="profileMenu">
      <div class="profile-menu-header">
        <div class="profile-menu-title">
          <div class="user-name">${user.name}</div>
          <div class="user-email" style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">${user.email}</div>
        </div>
        <button class="close-profile-menu" onclick="closeProfileMenu()">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      
      <div class="profile-menu-section" style="border-top: 1px solid var(--border); padding-top: 1rem; margin-top: 1rem;">
        <div class="menu-item" onclick="window.location.href='/dashboard/dashboard.html'" style="padding: 0.75rem; border-radius: 8px; cursor: pointer; transition: background 0.2s; display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
          <i class="fas fa-tachometer-alt" style="width: 20px; color: var(--primary);"></i>
          <span style="font-weight: 500;">Dashboard</span>
        </div>
        
        <div class="menu-item" onclick="showAnalytics(); closeProfileMenu();" style="padding: 0.75rem; border-radius: 8px; cursor: pointer; transition: background 0.2s; display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
          <i class="fas fa-chart-line" style="width: 20px; color: var(--success);"></i>
          <span style="font-weight: 500;">Analytics</span>
        </div>
        
        <div class="menu-item" onclick="alert('My QR Codes - Coming Soon!'); closeProfileMenu();" style="padding: 0.75rem; border-radius: 8px; cursor: pointer; transition: background 0.2s; display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
          <i class="fas fa-qrcode" style="width: 20px; color: var(--warning);"></i>
          <span style="font-weight: 500;">My QR Codes</span>
        </div>
        
        <div class="menu-item" onclick="alert('Settings - Coming Soon!'); closeProfileMenu();" style="padding: 0.75rem; border-radius: 8px; cursor: pointer; transition: background 0.2s; display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
          <i class="fas fa-cog" style="width: 20px; color: var(--text-secondary);"></i>
          <span style="font-weight: 500;">Settings</span>
        </div>
        
        <div class="menu-item" onclick="window.open('https://github.com/Yashcodes124/Qr_Generator', '_blank'); closeProfileMenu();" style="padding: 0.75rem; border-radius: 8px; cursor: pointer; transition: background 0.2s; display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
          <i class="fas fa-question-circle" style="width: 20px; color: var(--info);"></i>
          <span style="font-weight: 500;">Help & Support</span>
        </div>
      </div>
      
      <div class="profile-menu-section" style="border-top: 1px solid var(--border); padding-top: 1rem; margin-top: 1rem;">
        <div class="plan-info" style="background: var(--bg-primary); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-weight: 600; color: var(--text-primary);">Free Plan</span>
            <span style="background: var(--success); color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">Active</span>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-secondary);">
            Unlimited QR codes • Basic analytics
          </div>
          <button onclick="alert('Upgrade to Pro - Coming Soon!'); closeProfileMenu();" style="width: 100%; margin-top: 0.75rem; padding: 0.5rem; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color:grey; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: transform 0.2s;">
            Upgrade to Pro
          </button>
        </div>
      </div>
      
      <button class="logout-btn" onclick="handleLogout()" style="width: 100%; padding: 0.75rem; color:white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
        <i class="fas fa-sign-out-alt"></i>
        Logout
      </button>
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

    setTimeout(() => {
      document.addEventListener("click", closeProfileMenuOutside);
    }, 100);
  }
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
      const escapedText = data.decrypted
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
      const isDark =
        document.documentElement.getAttribute("data-theme") === "dark";
      const bgColor = isDark ? "#2d2d2d" : "#f8f9fa";
      const borderColor = isDark ? "#495057" : "#dee2e6";
      const textColor = isDark ? "#e9ecef" : "#212529";

      decryptedOutput.innerHTML = `
        <div style="margin-top: 1rem; padding: 1.5rem; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 12px;">
          <h4 style="margin-bottom: 1rem; color: #155724;">✅ Decryption Successful!</h4>
          <p style="margin-bottom: 0.5rem; font-weight: 600; color: ${textColor};"><strong>Decrypted Text:</strong></p>
          <div style="background: ${bgColor}; padding: 1.5rem; border-radius: 8px; border: 1px solid ${borderColor}; margin-top: 1rem; word-wrap: break-word; white-space: pre-wrap; font-family: 'Courier New', monospace; color: ${textColor}; max-height: 400px; overflow-y: auto;">
            ${escapedText}
          </div>
          <button onclick="copyDecryptedText(\`${data.decrypted.replace(/`/g, "\\`").replace(/\$/g, "\\$")}\`)" class="btn btn-outline" style="margin-top: 1rem; padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
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
function copyDecryptedText(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => showNotification("✅ Text copied to clipboard!", "success"))
    .catch((err) => {
      console.error("Copy failed:", err);
      showNotification("❌ Failed to copy text", "error");
    });
}
async function decryptFile() {
  const fileInput = document.getElementById("fileDecryptInput");
  const passphrase = document
    .getElementById("fileDecryptPassphrase")
    .value.trim();
  const decryptedOutput = document.getElementById("decryptedFileOutput");

  if (!fileInput.files.length || !passphrase) {
    decryptedOutput.innerHTML =
      '<div class="error-message" style="background: #f8d7da; color: #721c24; padding: 1rem; border-radius: 8px;">❌ Select encrypted file and enter passphrase</div>';
    return;
  }

  try {
    showLoader("decryptLoader", "Decrypting file");

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
            <div style="margin-top: 1rem; padding: 1.5rem; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 12px;">
              <h4 style="margin-bottom: 1rem; color: #155724;">✅ File Decryption Successful!</h4>
              <p style="margin-bottom: 0.5rem;"><strong>Original File:</strong> ${file.name}</p>
              <p style="margin-bottom: 1rem;"><strong>Decrypted File:</strong> ${data.suggestedFilename}</p>
              <div style="margin-top: 1.5rem;">
                <a href="${URL.createObjectURL(blob)}" download="${data.suggestedFilename}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                  📥 Download Decrypted File
                </a>
              </div>
            </div>
          `;
          showNotification("✅ File decrypted successfully!", "success");
        } else {
          decryptedOutput.innerHTML = `<div class="error-message" style="background: #f8d7da; color: #721c24; padding: 1rem; border-radius: 8px;">❌ ${data.error || "Decryption failed - wrong passphrase?"}</div>`;
          showNotification("❌ Decryption failed", "error");
        }
      } catch (error) {
        hideLoader("decryptLoader");
        console.error("File decryption failed:", error);
        decryptedOutput.innerHTML = `<div class="error-message" style="background: #f8d7da; color: #721c24; padding: 1rem; border-radius: 8px;">❌ Decryption failed: ${error.message}</div>`;
        showNotification("Decryption failed", "error");
      }
    };

    reader.onerror = function () {
      hideLoader("decryptLoader");
      decryptedOutput.innerHTML =
        '<div class="error-message" style="background: #f8d7da; color: #721c24; padding: 1rem; border-radius: 8px;">❌ Failed to read encrypted file</div>';
      showNotification("Failed to read file", "error");
    };

    reader.readAsText(file);
  } catch (error) {
    hideLoader("decryptLoader");
    console.error("File decryption failed:", error);
    decryptedOutput.innerHTML = `<div class="error-message" style="background: #f8d7da; color: #721c24; padding: 1rem; border-radius: 8px;">❌ Decryption failed: ${error.message}</div>`;
    showNotification("Decryption failed", "error");
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
// ======================BATCH QR GENERATION=========================
// Parse URLs from text (handles newlines or JSON array)
function parseUrls(input) {
  input = input.trim();

  // Try JSON array format
  if (input.startsWith("[")) {
    try {
      const urls = JSON.parse(input);
      if (Array.isArray(urls)) {
        return urls.filter(
          (url) => typeof url === "string" && url.startsWith("http")
        );
      }
    } catch (e) {
      console.warn("Invalid JSON array format");
    }
  }

  // Parse newline-separated URLs
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && line.startsWith("http"));
}

// Generate batch QR codes
async function generateBatchQR() {
  const input = document.getElementById("batchUrls").value.trim();
  const batchOutput = document.getElementById("batchOutput");

  if (!input) {
    showError("Please enter at least one URL");
    return;
  }

  const urls = parseUrls(input);

  if (urls.length === 0) {
    showError("No valid URLs found (must start with http:// or https://)");
    return;
  }

  console.log(`📦 Generating batch for ${urls.length} URLs`);
  showLoader("batchLoader", "Generating QR codes...");
  batchOutput.innerHTML = "";
  try {
    console.log("📤 Sending request to /api/batch-generate");
    console.log("📝 URLs:", urls);

    const response = await apiFetch("/api/batch-generate", {
      method: "POST",
      body: JSON.stringify({ urls }),
    });

    console.log("📥 Response status:", response.status);
    console.log("📥 Response type:", response.type);

    // Check if response is OK
    if (!response.ok) {
      // Try to get error message
      const contentType = response.headers.get("content-type");
      let errorData;

      if (contentType && contentType.includes("application/json")) {
        errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      } else {
        const text = await response.text();
        console.error("❌ Non-JSON response:", text.substring(0, 200));
        throw new Error(
          `Server error ${response.status}: Invalid response format`
        );
      }
    }

    // Get the blob (ZIP file)
    const blob = await response.blob();
    console.log(`📦 Received blob: ${blob.size} bytes, type: ${blob.type}`);

    if (blob.size === 0) {
      throw new Error("Received empty ZIP file");
    }

    // Verify it's actually a ZIP file
    if (!blob.type.includes("zip") && !blob.type.includes("octet-stream")) {
      console.warn(`⚠️ Unexpected blob type: ${blob.type}`);
    }

    console.log(`✅ Received ZIP file: ${blob.size} bytes`);

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr_codes_batch_${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    console.log("✅ Download triggered");

    // Show success message
    batchOutput.innerHTML = `
      <div style="margin-top: 1rem; padding: 1.5rem; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 12px;">
        <h4 style="margin-top: 0; color: #155724; display: flex; align-items: center; gap: 0.5rem;">
          <span>✅</span> Batch QR Generated!
        </h4>
        <p style="color: #155724; margin: 0.5rem 0;">
          <strong>URLs processed:</strong> ${urls.length}<br>
          <strong>File downloaded:</strong> qr_codes_batch_${Date.now()}.zip
        </p>
        <p style="color: #666; font-size: 0.9rem; margin: 0.5rem 0;">
          Your ZIP file is being downloaded. Check your Downloads folder and extract it to view all QR codes.
        </p>
        <button onclick="document.getElementById('batchUrls').value = ''; document.getElementById('batchOutput').innerHTML = '';" class="btn btn-outline" style="margin-top: 1rem;">
          ↻ Generate Another Batch
        </button>
      </div>
    `;

    showNotification(
      `✅ Downloaded QR codes for ${urls.length} URLs!`,
      "success"
    );
  } catch (error) {
    console.error("❌ Batch QR error:", error);
    console.error("❌ Error details:", error.stack);

    batchOutput.innerHTML = `
      <div style="margin-top: 1rem; padding: 1.5rem; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 12px; border-left: 4px solid #dc3545; color: #721c24;">
        <strong>❌ Error:</strong> ${error.message}
        <div style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">
          <p>Check browser console (F12) for more details</p>
        </div>
      </div>
    `;
    showError("Failed to generate batch: " + error.message);
  } finally {
    hideLoader("batchLoader");
  }
}

// Generate batch from CSV file
async function generateBatchFromCSV() {
  const fileInput = document.getElementById("csvFile");
  const file = fileInput.files[0];
  const batchOutput = document.getElementById("batchOutput");

  if (!file) {
    showError("Please select a CSV file");
    return;
  }

  if (!file.name.match(/\.(csv|txt)$/i)) {
    showError("Please select a .csv or .txt file");
    return;
  }

  console.log("📄 Reading CSV file:", file.name);
  showLoader("batchLoader", "Processing CSV file...");
  batchOutput.innerHTML = "";

  try {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const csvData = e.target.result;
        console.log("📄 CSV data read:", csvData.length, "characters");

        const response = await apiFetch("/api/batch-from-csv", {
          method: "POST",
          body: JSON.stringify({ csvData }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "CSV batch generation failed");
        }

        // Get the blob (ZIP file)
        const blob = await response.blob();

        if (blob.size === 0) {
          throw new Error("Received empty ZIP file");
        }

        console.log(`✅ Received ZIP file: ${blob.size} bytes`);

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `qr_codes_batch_${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Show success message
        batchOutput.innerHTML = `
          <div style="margin-top: 1rem; padding: 1.5rem; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 12px; border-left: 4px solid #28a745;">
            <h4 style="margin-top: 0; color: #155724; display: flex; align-items: center; gap: 0.5rem;">
              <span>✅</span> CSV Batch QR Generated!
            </h4>
            <p style="color: #155724; margin: 0.5rem 0;">
              <strong>File processed:</strong> ${file.name}<br>
              <strong>File downloaded:</strong> qr_codes_batch_${Date.now()}.zip
            </p>
            <p style="color: #666; font-size: 0.9rem; margin: 0.5rem 0;">
              Check your Downloads folder for the ZIP file with all QR codes.
            </p>
            <button onclick="document.getElementById('csvFile').value = ''; document.getElementById('batchOutput').innerHTML = '';" class="btn btn-outline" style="margin-top: 1rem;">
              ↻ Generate Another Batch
            </button>
          </div>
        `;

        showNotification("✅ CSV batch QR downloaded!", "success");
      } catch (error) {
        console.error("❌ CSV batch error:", error);
        batchOutput.innerHTML = `
          <div style="margin-top: 1rem; padding: 1.5rem; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 12px; border-left: 4px solid #dc3545; color: #721c24;">
            <strong>❌ Error:</strong> ${error.message}
          </div>
        `;
        showError("Failed to process CSV: " + error.message);
      } finally {
        hideLoader("batchLoader");
      }
    };

    reader.onerror = () => {
      showError("Failed to read file");
      hideLoader("batchLoader");
    };

    reader.readAsText(file);
  } catch (error) {
    console.error("❌ CSV error:", error);
    showError("Failed to process CSV");
    hideLoader("batchLoader");
  }
}
// ==================== URL SHORTENER =====================
async function shortenSingleURL() {
  const originalURL = document.getElementById("originalURL").value.trim();
  const customAlias = document.getElementById("customAlias").value.trim();
  const title = document.getElementById("urlTitle").value.trim();
  const output = document.getElementById("shortenerOutput");

  if (!originalURL) {
    showError("Please enter a URL to shorten");
    return;
  }

  showLoader("shortenerLoader", "Shortening URL...");
  output.innerHTML = "";

  try {
    const response = await apiFetch("/api/shorten", {
      method: "POST",
      body: JSON.stringify({
        originalURL,
        customAlias: customAlias || undefined,
        title: title || undefined,
      }),
    });

    const data = await response.json();

    if (data.success) {
      const shortLink = data.data;

      output.innerHTML = `
        <div style="margin-top: 1.5rem; padding: 1.5rem; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 12px;">
          <h4 style="margin-top: 0; color: #155724;">✅ URL Shortened Successfully!</h4>
          
          <div style="margin: 1rem 0; padding: 1rem; background: white; border-radius: 8px;">
            <p style="margin: 0.5rem 0;"><strong>Short Link:</strong></p>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <input type="text" value="${shortLink.shortURL}" readonly style="flex: 1; padding: 0.75rem; border: 1px solid #dee2e6; border-radius: 6px; font-family: monospace;" />
              <button onclick="copyToClipboard('${shortLink.shortURL}')" class="btn btn-outline" style="padding: 0.75rem 1rem;">
                📋 Copy
              </button>
            </div>
          </div>

          <div style="margin: 1rem 0; padding: 1rem; background: white; border-radius: 8px;">
            <p style="margin: 0.5rem 0;"><strong>Original URL:</strong></p>
            <p style="margin: 0; word-break: break-all; color: #666;">${shortLink.originalURL}</p>
          </div>

          <div style="margin: 1rem 0; padding: 1rem; background: white; border-radius: 8px; text-align: center;">
            <p style="margin: 0.5rem 0;"><strong>QR Code for Short Link:</strong></p>
            <img src="${shortLink.qrCode}" alt="QR Code" style="max-width: 150px; margin-top: 0.5rem;" />
            <button onclick="downloadQRImage('${shortLink.qrCode}', 'shortlink-qr')" class="btn btn-outline" style="margin-top: 0.5rem;">
              📥 Download QR
            </button>
          </div>

          <button onclick="document.getElementById('originalURL').value = ''; document.getElementById('customAlias').value = ''; document.getElementById('urlTitle').value = ''; document.getElementById('shortenerOutput').innerHTML = '';" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">
            ↻ Shorten Another
          </button>
        </div>
      `;

      showNotification("✅ URL shortened successfully!", "success");
      loadUserShortenedURLs();
    } else {
      throw new Error(data.error || "Failed to shorten URL");
    }
  } catch (error) {
    console.error("❌ URL shortening error:", error);
    output.innerHTML = `<div style="color: #721c24; background: #f8d7da; padding: 1rem; border-radius: 8px;">❌ Error: ${error.message}</div>`;
    showError("Failed to shorten URL: " + error.message);
  } finally {
    hideLoader("shortenerLoader");
  }
}

async function loadUserShortenedURLs() {
  try {
    const response = await apiFetch("/api/urls?limit=20");
    const data = await response.json();

    if (data.success) {
      displayUserShortenedURLs(data.data.urls);
    }
  } catch (error) {
    console.error("❌ Failed to load URLs:", error);
  }
}

function displayUserShortenedURLs(urls) {
  const container = document.getElementById("userShortenedURLsList");
  if (!container) return;

  if (urls.length === 0) {
    container.innerHTML = `<p style="text-align: center; color: #666;">No shortened URLs yet. Create your first one above!</p>`;
    return;
  }

  const html = `
    <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
      <thead>
        <tr style="background: #f0f7ff; border-bottom: 2px solid #3498db;">
          <th style="padding: 0.75rem; text-align: left; font-weight: 600;">Short Code</th>
          <th style="padding: 0.75rem; text-align: left; font-weight: 600;">Original URL</th>
          <th style="padding: 0.75rem; text-align: left; font-weight: 600;">Clicks</th>
          <th style="padding: 0.75rem; text-align: left; font-weight: 600;">Created</th>
          <th style="padding: 0.75rem; text-align: center; font-weight: 600;">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${urls
          .map(
            (url) => `
          <tr style="border-bottom: 1px solid #dee2e6;">
            <td style="padding: 0.75rem; font-family: monospace; font-weight: 600;">${url.shortCode}</td>
            <td style="padding: 0.75rem;">
              <span title="${url.originalURL}" style="display: block; max-width: 200px; overflow: hidden; text-overflow: ellipsis;">
                ${url.originalURL.substring(0, 40)}...
              </span>
            </td>
            <td style="padding: 0.75rem;">
              <span style="background: #e3f2fd; color: #1976d2; padding: 0.25rem 0.75rem; border-radius: 12px; font-weight: 600;">
                ${url.clicks}
              </span>
            </td>
            <td style="padding: 0.75rem; font-size: 0.9rem; color: #666;">
              ${new Date(url.createdAt).toLocaleDateString()}
            </td>
            <td style="padding: 0.75rem; text-align: center;">
              <button onclick="copyToClipboard('${url.shortURL}')" class="btn btn-outline" style="padding: 0.5rem 0.75rem; font-size: 0.85rem; margin-right: 0.25rem;">📋</button>
              <button onclick="deleteShortenedURL(${url.id})" class="btn btn-outline" style="padding: 0.5rem 0.75rem; font-size: 0.85rem; background: #f8d7da; color: #721c24;">🗑️</button>
            </td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}

async function deleteShortenedURL(urlId) {
  if (!confirm("Are you sure you want to delete this shortened URL?")) return;

  try {
    const response = await apiFetch(`/api/urls/${urlId}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (data.success) {
      showNotification("✅ URL deleted successfully", "success");
      loadUserShortenedURLs();
    }
  } catch (error) {
    console.error("❌ Failed to delete URL:", error);
    showError("Failed to delete URL: " + error.message);
  }
}

async function shortenBatchURLs() {
  const input = document.getElementById("batchUrlsToShorten").value.trim();
  const batchOutput = document.getElementById("shortenerBatchOutput");

  if (!input) {
    showError("Please enter at least one URL");
    return;
  }

  const urls = input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && line.startsWith("http"));

  if (urls.length === 0) {
    showError("No valid URLs found");
    return;
  }

  showLoader("batchShortenerLoader", "Shortening URLs...");
  batchOutput.innerHTML = "";

  try {
    const response = await apiFetch("/api/shorten-batch", {
      method: "POST",
      body: JSON.stringify({ urls }),
    });

    const data = await response.json();

    if (data.success) {
      const { shortenedURLs, errors } = data.data;

      batchOutput.innerHTML = `
        <div style="margin-top: 1.5rem; padding: 1.5rem; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 12px;">
          <h4 style="margin-top: 0; color: #155724;">✅ Batch URLs Shortened!</h4>
          <p style="color: #155724; margin: 0.5rem 0;">
            <strong>Successful:</strong> ${shortenedURLs.length}<br>
            ${errors.length > 0 ? `<strong>Failed:</strong> ${errors.length}<br>` : ""}
            <strong>Total:</strong> ${data.data.total}
          </p>

          <div style="margin: 1rem 0; max-height: 300px; overflow-y: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
              <thead>
                <tr style="background: #fff3cd;">
                  <th style="padding: 0.5rem; text-align: left; font-weight: 600;">Short Link</th>
                  <th style="padding: 0.5rem; text-align: left; font-weight: 600;">Original</th>
                </tr>
              </thead>
              <tbody>
                ${shortenedURLs
                  .map(
                    (url) => `
                  <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 0.5rem; font-family: monospace;">${url.shortCode}</td>
                    <td style="padding: 0.5rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis;">
                      ${url.originalURL.substring(0, 30)}...
                    </td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <button onclick="document.getElementById('batchUrlsToShorten').value = ''; document.getElementById('shortenerBatchOutput').innerHTML = '';" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">
            ↻ Shorten Another Batch
          </button>
        </div>
      `;

      showNotification(`✅ Shortened ${shortenedURLs.length} URLs!`, "success");
    }
  } catch (error) {
    console.error("❌ Batch shortening error:", error);
    batchOutput.innerHTML = `<div style="color: #721c24; background: #f8d7da; padding: 1rem; border-radius: 8px;">❌ Error: ${error.message}</div>`;
    showError("Failed to shorten batch: " + error.message);
  } finally {
    hideLoader("batchShortenerLoader");
  }
}

// ==================== INITIALIZATION ====================
document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 QRcify Pro initialized successfully!");

  handlePasswordResetFromURL();
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
  // Add this in DOMContentLoaded section
  const menuStyle = document.createElement("style");
  menuStyle.textContent = `
  .menu-item:hover {
    background: var(--bg-primary) !important;
    transform: translateX(4px);
  }
  
  .menu-item i {
    transition: transform 0.2s;
  }
  
  .menu-item:hover i {
    transform: scale(1.1);
  }
`;
  document.head.appendChild(menuStyle);
});
