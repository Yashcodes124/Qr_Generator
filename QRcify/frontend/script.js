const btn = document.getElementById("generateBtn");
const output = document.getElementById("output");

btn.addEventListener("click", async () => {
  const url = document.getElementById("url").value.trim();

  if (!url) {
    output.innerHTML = "<p>Please enter a URL!</p>";
    return;
  }

  output.innerHTML = "<p>Generating QR code...</p>";

  const response = await fetch("http://localhost:3000/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  const data = await response.json();

  if (data.qrCode) {
    output.innerHTML = <img src="${data.qrCode}" alt="QR Code" />;
  } else {
    output.innerHTML = <p>Error: ${data.error}</p>;
  }
});
