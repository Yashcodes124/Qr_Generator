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
  fetch("/api/generate-encryptedText", {
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
      <label>Raw Ciphertext:  </label>
      <br>
      <textarea rows="3" cols="40" style="outline:none;">${data.encrypted}</textarea>
      `;
      //  <a href="${data.downloadUrl}" download>Download Encrypted File</a>
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

//function to encrypt files
async function encryptFile() {
  const file = document.getElementById("fileInput").files[0];
  const passphrase = document.getElementById("filePassphrase").value;
  //checking whether file uploaded or not
  if (!file || !passphrase) return alert("File and passphrase required");
  //FileReader() reads the selected file as a Base64 string

  const reader = new FileReader();
  reader.onload = async () => {
    // example:data:application/pdf;base64,JVBERi0xLjQKJcfs...        here - The part before the comma (data:application/pdf;base64) is the Data URI scheme header.
    // - The part after the comma is the actual base64-encoded file content

    const base64 = reader.result.split(",")[1]; // remove data URI prefix
    // Sends the Base64 string, passphrase, and filename to the server
    const response = await fetch("/api/encrypt-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64, passphrase, filename: file.name }),
    });
    const data = await response.json();
    if (data.error) return alert(data.error);
    document.getElementById("fileOutput").innerHTML = `
      <img src="${data.qrCode}" alt="File QR"><br>
      <a href="${data.downloadUrl}" download>Download Encrypted File</a>
    `;
  };
  reader.readAsDataURL(file);
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
