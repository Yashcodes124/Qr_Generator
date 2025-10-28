//use the FileReader API to read the file’s content. bcs When a user uploads a file in the browser using <input type="file">,the file isn’t automatically readable as text or binary — it’s just a reference.
//const reader = new FileReader();
// reader.readAsText(file);
//Base64 is a safe, text-friendly format that represents binary data using only printable characters (A–Z, a–z, 0–9, +, /).
//example Binary file → Base64 → safe for sending in JSON

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

  // 1️⃣ Basic validation
  if (!file || !passphrase)
    return alert("Please upload a file and enter a passphrase.");

  showLoader("fileLoader", "Encrypting file");

  // FileReader API reads file’s content from <input type="file"> in a browser.
  // Base64 is used because it’s safe for text-based transmission in JSON.
  const reader = new FileReader();

  reader.onload = async () => {
    try {
      // 2️⃣ Extract Base64 content from the data URL
      const base64 = reader.result.split(",")[1];

      // 3️⃣ Send the data to backend for encryption
      const response = await fetch("/api/encrypt-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64,
          passphrase,
          filename: file.name,
        }),
      });

      // 4️⃣ Handle response (ensure valid JSON)
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server error (${response.status}): ${text}`);
      }

      const data = await response.json();
      if (data.error) return alert(data.error);

      // 5️⃣ Show output
      document.getElementById("fileOutput").innerHTML = `
        <img src="${data.qrCode}" alt="File QR"><br>
        <label>Combined (Salt::IV::Ciphertext):</label><br>
        <textarea rows="3" cols="40" readonly>${data.encrypted}</textarea><br>
        <a href="${data.downloadUrl}" download style="text-decoration:none;">Download File</a> <br>
        <h3>QR contains download link instead of ciphertext</h3>
        <br>
      `;
    } catch (err) {
      // 6️⃣ Error handling
      console.error("Error encrypting file:", err);
      alert("Error encrypting file: " + err.message);
    } finally {
      hideLoader("fileLoader");
    }
  };

  // 7️⃣ Read the file as a Data URL (Base64)
  reader.readAsDataURL(file);
}

// ================================
// 🔹 5. DECRYPT CIPHERTEXT
// ================================
async function decrypt() {
  const cipher = document.getElementById("qrCipher").value.trim();
  const passphrase = document.getElementById("userPassphrase").value.trim();

  if (!cipher || !passphrase)
    return alert("Ciphertext and passphrase are required.");

  showLoader("decryptLoader", "Decrypting");

  try {
    const response = await fetch("/api/decrypt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cipher, passphrase }),
    });

    const data = await response.json();

    const output = document.getElementById("decryptedOutput");

    if (data.success) {
      output.innerText = `Decrypted: ${data.decrypted}`;
    } else {
      output.innerText = data.error || "Decryption failed in UI.";
    }
  } catch (error) {
    console.error("Decryption request failed:", error);
    document.getElementById("decryptedOutput").innerText =
      "Server error during decryption.";
  } finally {
    hideLoader("decryptLoader");
  }
}

async function decryptFile() {
  const fileInput = document.getElementById("fileDecryptInput");
  const passphrase = document
    .getElementById("fileDecryptPassphrase")
    .value.trim();

  if (!fileInput.files.length || !passphrase) {
    return alert(
      "Please upload an encrypted (.enc) file and enter the passphrase."
    );
  }

  showLoader("decryptLoader", "Decrypting file...");

  try {
    // Read uploaded file as text
    const file = fileInput.files[0];
    const reader = new FileReader(); //api will read the text string like salt::iv::ciphertext

    reader.onload = async () => {
      const encryptedData = reader.result.trim(); // this will be result of reading  salt::iv::ciphertext
      //this becomes actual encryted data after reading
      // Send file data to backend for decryption
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
      const output = document.getElementById("decryptedOutput");

      if (data.success) {
        output.innerText = "File decrypted successfully. Preparing download...";

        //  Convert base64 back to downloadable file
        const byteCharacters = atob(data.decryptedBase64); //atob() decodes the Base64 string back to binary characters.
        const byteNumbers = new Array(byteCharacters.length) //convert those characters into real bytes:
          .fill(0)
          .map((_, i) => byteCharacters.charCodeAt(i));
        const byteArray = new Uint8Array(byteNumbers); //we have the file as a binary array (Uint8Array).
        const blob = new Blob([byteArray], {
          // wraping bin data in a blob - a special object that the browser can treat as a real file:
          type: "application/octet-stream",
        });

        //  Create download link
        const link = document.createElement("a");
        link.style.alignContent = "center";
        link.style.textDecoration = "none";
        link.href = URL.createObjectURL(blob);
        link.download = data.suggestedFilename;
        link.textContent = "Download Decrypted File";
        output.appendChild(document.createElement("br"));
        output.appendChild(link);
      } else {
        output.innerText = ` ${data.error || "Decryption failed."}`;
      }

      hideLoader("decryptLoader");
    };

    reader.readAsText(file);
  } catch (error) {
    console.error("File decryption failed:", error);
    document.getElementById("decryptedOutput").innerText =
      "Server error during file decryption.";
    hideLoader("decryptLoader");
  }
}
