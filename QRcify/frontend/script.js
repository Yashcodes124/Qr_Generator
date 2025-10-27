// ================================
// 🔹 GLOBAL HELPERS
// ================================
let dotInterval;

// Show loader for specific section
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

// Hide loader for specific section
function hideLoader(loaderId) {
  const loader = document.getElementById(loaderId);
  if (loader) loader.style.display = "none";
  clearInterval(dotInterval);
}

// ================================
// 🔹 1. BASIC URL → QR GENERATION
// ================================
const urlBtn = document.getElementById("generateBtn");
const urlOutput = document.getElementById("output");

urlBtn.addEventListener("click", async () => {
  const url = document.getElementById("url").value.trim();
  if (!url) {
    urlOutput.innerHTML = "<p>Please enter a valid URL!</p>";
    return;
  }

  showLoader("urlLoader", "Generating");
  urlOutput.innerHTML = "";

  try {
    const response = await fetch("/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();
    if (data.qrCode) {
      urlOutput.innerHTML = `<img src="${data.qrCode}" alt="QR Code"> <br> QR Generated Successfully....`;
    } else {
      urlOutput.innerHTML = `<p>Error: ${data.error}</p>`;
    }
  } catch (err) {
    urlOutput.innerHTML = `<p>Request failed: ${err.message}</p>`;
  } finally {
    hideLoader("urlLoader");
  }
});

// ================================
// 🔹 2. ENCRYPT TEXT → QR GENERATION
// ================================
async function generate() {
  const secretData = document.getElementById("secretData").value.trim();
  const passphrase = document.getElementById("passphrase").value.trim();

  if (!secretData || !passphrase)
    return alert(
      "Both secret text and passphrase are required for Generating QR."
    );

  showLoader("textLoader", "Encrypting");

  try {
    const res = await fetch("/api/generate-encryptedText", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secretData, passphrase }),
    });

    const data = await res.json();
    if (data.error) {
      alert(data.error);
      return;
    }

    document.getElementById("qrOutput").innerHTML = `
      <img src="${data.qrCode}" alt="Encrypted QR"><br>
      <label>Raw Ciphertext:</label><br>
      <textarea rows="3" cols="40" readonly>${data.encrypted}</textarea>
    `;
  } catch (err) {
    alert("Failed to encrypt: " + err.message);
  } finally {
    hideLoader("textLoader");
  }
}

// ================================
// 🔹 3. COPY CIPHERTEXT
// ================================
function copyCipherText() {
  const textArea = document.querySelector("#qrOutput textarea");
  if (!textArea) return alert("No ciphertext found to copy.");

  textArea.select();
  navigator.clipboard
    .writeText(textArea.value)
    .then(() => alert("Ciphertext copied!"))
    .catch(() => alert("Copy failed."));
}

// ================================
// 🔹 4. FILE ENCRYPTION
// ================================
async function encryptFile() {
  const file = document.getElementById("fileInput").files[0];
  const passphrase = document.getElementById("filePassphrase").value.trim();

  if (!file || !passphrase)
    return alert("Please upload a file and enter a passphrase.");

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

      const data = await response.json();
      if (data.error) return alert(data.error);

      document.getElementById("fileOutput").innerHTML = `
        <img src="${data.qrCode}" alt="File QR"><br>
        <label>Raw Ciphertext:</label><br>
        <textarea rows="3" cols="40" readonly>${data.encrypted}</textarea><br>
        <a href="${data.downloadUrl}" download>Download Encrypted File</a>
      `;
    } catch (err) {
      alert("Error encrypting file: " + err.message);
    } finally {
      hideLoader("fileLoader");
    }
  };
  reader.readAsDataURL(file);
}

// ================================
// 🔹 5. DECRYPT CIPHERTEXT
// ================================
async function decrypt() {
  const cipher = document
    .getElementById("qrCipher")
    .value.trim()
    .replace(/\s+/g, "") // remove spaces/newlines
    .replace(/ /g, "+"); // fix lost '+' from QR copy

  const passphrase = document.getElementById("userPassphrase").value.trim();

  if (!cipher || !passphrase)
    return alert("Ciphertext and passphrase are required.");

  showLoader("decryptLoader", "Decrypting");

  try {
    const bytes = CryptoJS.AES.decrypt(
      "U2FsdGVkX190bKeEIHQtK+7SmcUwugJefStThJRJKal8juVjR2ZtmutDcMz4pAl+qsFg/TS1MdAmitSOIwWH/LO1EgrQWRJ6jcx8ikU701c=",
      "yashbro"
    );

    const original = bytes.toString(CryptoJS.enc.Utf8);
    if (!original) {
      console.log("Wrong passphrase or invalid ciphertext");
    }

    const output = document.getElementById("decryptedOutput");
    output.innerText = original
      ? `Decrypted: ${original}`
      : "Wrong passphrase or invalid ciphertext.";
  } catch (e) {
    console.error("Decryption error:", e);
    document.getElementById("decryptedOutput").innerText = "Decryption failed.";
  } finally {
    hideLoader("decryptLoader");
  }
}
