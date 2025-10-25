const btn = document.getElementById("generateBtn");
const output = document.getElementById("output");

btn.addEventListener("click", async () => {
  const url = document.getElementById("url").value.trim();

  if (!url) {
    output.innerHTML = "<p>Please enter a URL!</p>";
    return;
  }

  output.innerHTML = "<p>Generating QR code...</p>";

  try {
    const response = await fetch("http://localhost:3000/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();

    if (data.qrCode) {
      output.innerHTML = `<img src="${data.qrCode}" alt="QR Code" />`;
    } else {
      output.innerHTML = `<p>Error: ${data.error}</p>`;
    }
  } catch (err) {
    output.innerHTML = `<p>Request failed: ${err.message}</p>`;
  }
});

function generate() {
  const secretData = document.getElementById("secretData").value;
  const passphrase = document.getElementById("passphrase").value;
  fetch("/api/generate-encrypted", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secretData, passphrase }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.error) return alert(data.error);
      document.getElementById(
        "qrOutput"
      ).innerHTML = `<img src="${data.qrCode}" alt="Encrypted QR"><br>
      <label>Raw Ciphertext:</label>
      <textarea rows="3" cols="40">${data.encrypted}</textarea>`;
    });
}

//function to copy the ciphertext
function copyCipherText() {
  const copyTextArea = document.querySelector("#qrOutput textarea");
  if (!copyTextArea) return alert("No ciphertext to copy");
  // select text inside the area
  copyTextArea.select();
  // copy the text to clipboard.
  navigator.clipboard
    .writeText(copyTextArea.value)
    .then(() => alert("Ciphertext Copied!!"))
    .catch(() => alert("Failed to copy ciphertext"));
}
function decrypt() {
  const ciphertext = document.getElementById("qrCipher").value;
  const passphrase = document.getElementById("userPassphrase").value;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, passphrase);
    const original = bytes.toString(CryptoJS.enc.Utf8);
    document.getElementById("decryptedOutput").innerText = original
      ? `Decrypted: ${original}`
      : "Wrong passphrase or invalid ciphertext";
  } catch (e) {
    document.getElementById("decryptedOutput").innerText = "Decryption failed";
  }
}
