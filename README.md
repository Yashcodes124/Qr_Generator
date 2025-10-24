# 📦 Secure Encrypted QR Code Tool

**A developer-focused open-source app for sharing secrets and sensitive data securely using encrypted QR codes.**

---

## 🚀 Features

- **AES-encrypted data**—no secret leaves your browser or server without encryption
- **Stateless and open**—server never stores any secret or key
- **Frontend + API included** for quick use, fork, or integration
- **Extensible**—ready for QR camera scan, batch encode, and more
- **MIT License** for commercial and educational use

---

## 🔒 Why encrypted QR codes?

Traditional (raw) QR codes make secrets visible to anyone with a scanner. This tool lets you input any sensitive data, encrypt it with a passphrase, and generate a QR that can only be decrypted with the correct key.

**Use cases:**

- Developer/devops credential exchange on-site or at a distance
- Securing Wi-Fi, keys, API tokens, config values for field devices
- Safe event invitation or access codes

---

## 🛠️ Setup

1. **Clone the repo**
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Run the server**
   ```bash
   node index.js
   ```
   By default, it will run on `http://localhost:3000/`.

---

## 🖥️ Usage

1. Open [http://localhost:3000](http://localhost:3000) in your browser.
2. In the **Generate** section:
   - Enter your secret text and a passphrase.
   - Click "Generate QR" to receive a sharable, encrypted QR image.
3. In the **Decrypt** section:
   - Paste the ciphertext (from QR scan or copy).
   - Enter the passphrase to reveal your original secret.
4. **No data is ever stored on the server**.

---

## ⚡ Roadmap

- [ ] Add in-browser QR code camera scanning
- [ ] Batch QR encode/decode
- [ ] Add secure file encryption and QR transmission
- [ ] PWA/mobile mode for field use
- [ ] i18n/localization

---

## 🤝 Contributing

Contributions, bug reports, and feature requests welcome!

- Fork, branch, and submit a pull request.
- For camera QR scan (next step), consider using [jsQR](https://github.com/cozmo/jsQR) or [html5-qrcode](https://github.com/mebjas/html5-qrcode).

---

## 📜 License

MIT

---

## ⭐ Credits

Built using [Express.js](https://expressjs.com), [crypto-js](https://github.com/brix/crypto-js), and [qr-image](https://github.com/alexeyten/qr-image).
