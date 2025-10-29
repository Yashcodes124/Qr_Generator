import CryptoJS from "crypto-js";

//key generation
// By adding PBKDF2 + Salt, you’ll:
// Generate a random salt (unique per encryption).
// Derive a secure 256-bit key from the passphrase + salt using PBKDF2
// Use that key + a random IV (initialization vector) to run AES encryption
// Bundle the salt + IV + ciphertext together for decryption later.

export function generateKeyIV(passphrase) {
  // Encrypt with AES : aes is a algorithm used to secure e-data  by converting it into an unreadable format
  //it encryps data breaking it into 128 bit blocks using a key of 128,256 bits for substitutes  and shuffing through  multiple rounds and uses  the same key for both encryption and decryption.
  const salt = CryptoJS.lib.WordArray.random(128 / 8);
  const iv = CryptoJS.lib.WordArray.random(128 / 8);
  const key = CryptoJS.PBKDF2(passphrase, salt, {
    keySize: 256 / 32,
    iterations: 10000,
    hasher: CryptoJS.algo.SHA256,
  });
  return { key, iv, salt };
}
//data encryption
export function encryptData(data, passphrase) {
  const { key, iv, salt } = generateKeyIV(passphrase);
  const encrypted = CryptoJS.AES.encrypt(data, key, { iv }).toString();
  return [
    // Combine salt + iv + ciphertext (for easy storage)
    CryptoJS.enc.Base64.stringify(salt),
    CryptoJS.enc.Base64.stringify(iv),
    encrypted,
  ].join("::");
}

export function decryptData(combined, passphrase) {
  const [saltB64, ivB64, ciphertext] = combined.split("::");
  const salt = CryptoJS.enc.Base64.parse(saltB64);
  const iv = CryptoJS.enc.Base64.parse(ivB64);
  const key = CryptoJS.PBKDF2(passphrase, salt, {
    keySize: 256 / 32,
    iterations: 10000,
    hasher: CryptoJS.algo.SHA256,
  });
  const decrypted = CryptoJS.AES.decrypt(ciphertext, key, { iv });
  return decrypted.toString(CryptoJS.enc.Utf8);
}
