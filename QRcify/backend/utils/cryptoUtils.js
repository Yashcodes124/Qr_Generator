import CryptoJS from "crypto-js";

//key generation
export function generateKeyIV(passphrase) {
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
    CryptoJS.enc.Base64.stringify(salt),
    CryptoJS.enc.Base64.stringify(iv),
    encrypted,
  ].join("::");
}
