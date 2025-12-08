import CryptoJS from "crypto-js";
//key generation
// By adding PBKDF2 + Salt, you’ll:
// Generate a random salt (unique per encryption).
// Derive a secure 256-bit key from the passphrase + salt using PBKDF2
// Use that key + a random IV (initialization vector) to run AES encryption
// Bundle the salt + IV + ciphertext together for decryption later.

// ==================== CONFIGURATION ====================
const CRYPTO_CONFIG = {
  ALGORITHM: "AES-256-CBC",
  ITERATIONS: parseInt(process.env.ENCRYPTION_ITERATIONS || "310000"),
  KEY_SIZE: 256 / 32, // 256-bit key
  HASH_ALGORITHM: CryptoJS.algo.SHA256,
  SALT_LENGTH: 128 / 8, // 128-bit salt
  IV_LENGTH: 128 / 8, // 128-bit IV
};

console.log(`🔐 Encryption: ${CRYPTO_CONFIG.ALGORITHM}`);
console.log(`🔑 PBKDF2 Iterations: ${CRYPTO_CONFIG.ITERATIONS}`);
console.log(`✅ Crypto Config Loaded`);

// ==================== KEY & IV GENERATION ====================
export function generateKeyIV(passphrase) {
  if (!passphrase || passphrase.length < 8) {
    throw new Error("Passphrase must be at least 8 characters");
  }

  const salt = CryptoJS.lib.WordArray.random(CRYPTO_CONFIG.SALT_LENGTH);
  const iv = CryptoJS.lib.WordArray.random(CRYPTO_CONFIG.IV_LENGTH);

  const key = CryptoJS.PBKDF2(passphrase, salt, {
    keySize: CRYPTO_CONFIG.KEY_SIZE,
    iterations: CRYPTO_CONFIG.ITERATIONS, // ✅ NOW 310,000+
    hasher: CRYPTO_CONFIG.HASH_ALGORITHM,
  });

  return { key, iv, salt };
}

// ==================== ENCRYPTION ====================
export function encryptData(data, passphrase) {
  try {
    if (!data || typeof data !== "string") {
      throw new Error("Data must be a non-empty string");
    }

    const { key, iv, salt } = generateKeyIV(passphrase);

    const encrypted = CryptoJS.AES.encrypt(data, key, { iv }).toString();

    // Format: salt::iv::ciphertext
    const result = [
      CryptoJS.enc.Base64.stringify(salt),
      CryptoJS.enc.Base64.stringify(iv),
      encrypted,
    ].join("::");

    console.log(`✅ Encrypted ${data.length} characters`);
    return result;
  } catch (error) {
    console.error("❌ Encryption error:", error.message);
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

// ==================== DECRYPTION ====================
export function decryptData(combined, passphrase) {
  try {
    if (!combined || typeof combined !== "string") {
      throw new Error("Ciphertext must be a non-empty string");
    }

    if (!passphrase || passphrase.length < 8) {
      throw new Error("Passphrase must be at least 8 characters");
    }

    const parts = combined.split("::");

    if (parts.length !== 3) {
      throw new Error("Invalid cipher format. Expected: salt::iv::ciphertext");
    }

    const [saltB64, ivB64, ciphertext] = parts;

    // ✅ Validate base64 format
    if (!saltB64 || !ivB64 || !ciphertext) {
      throw new Error("Invalid cipher components");
    }

    try {
      var salt = CryptoJS.enc.Base64.parse(saltB64);
      var iv = CryptoJS.enc.Base64.parse(ivB64);
    } catch (e) {
      throw new Error("Invalid base64 encoding in salt or IV");
    }

    // ✅ Derive key with SAME config
    const key = CryptoJS.PBKDF2(passphrase, salt, {
      keySize: CRYPTO_CONFIG.KEY_SIZE,
      iterations: CRYPTO_CONFIG.ITERATIONS, // ✅ MUST MATCH
      hasher: CRYPTO_CONFIG.HASH_ALGORITHM,
    });

    // ✅ Decrypt
    const decrypted = CryptoJS.AES.decrypt(ciphertext, key, { iv });
    const result = decrypted.toString(CryptoJS.enc.Utf8);

    // ✅ VALIDATE OUTPUT - this was missing!
    if (!result || result.length === 0) {
      throw new Error(
        "Decryption failed: Invalid passphrase or corrupted data"
      );
    }

    // ✅ Try to validate it's valid text (not gibberish)
    if (!/^[\x20-\x7E\n\r\t]*$/i.test(result.substring(0, 100))) {
      console.warn("⚠️  Decrypted text may be corrupted");
    }

    console.log(`✅ Decrypted ${result.length} characters`);
    return result;
  } catch (error) {
    console.error("❌ Decryption error:", error.message);
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

// ==================== UTILITY FUNCTIONS ====================
export function validatePassphrase(passphrase) {
  if (!passphrase) return false;
  if (typeof passphrase !== "string") return false;
  if (passphrase.length < 8) return false;
  return true;
}

export function getEncryptionStats() {
  return {
    algorithm: CRYPTO_CONFIG.ALGORITHM,
    iterations: CRYPTO_CONFIG.ITERATIONS,
    keySize: CRYPTO_CONFIG.KEY_SIZE * 8 + "-bit",
    saltSize: CRYPTO_CONFIG.SALT_LENGTH * 8 + "-bit",
    ivSize: CRYPTO_CONFIG.IV_LENGTH * 8 + "-bit",
  };
}

export default {
  generateKeyIV,
  encryptData,
  decryptData,
  validatePassphrase,
  getEncryptionStats,
};
