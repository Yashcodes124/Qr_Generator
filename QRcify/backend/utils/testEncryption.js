import {
  encryptData,
  decryptData,
  getEncryptionStats,
  validatePassphrase,
} from "./cryptoUtils.js";

console.log("\n=== ENCRYPTION TEST ===\n");

// Show stats
console.log("📊 Encryption Config:");
console.log(JSON.stringify(getEncryptionStats(), null, 2));

const testData = "Hello, QRcify Pro! This is a test message.";
const passphrase = "MySecurePassphrase123!";

console.log("\n✅ Test Data:", testData);
console.log("🔐 Passphrase:", passphrase);

try {
  // Validate passphrase
  if (!validatePassphrase(passphrase)) {
    throw new Error("Passphrase validation failed");
  }

  // Encrypt
  console.log("\n🔒 Encrypting...");
  const encrypted = encryptData(testData, passphrase);
  console.log("📝 Encrypted:", encrypted.substring(0, 50) + "...");
  console.log("💾 Size:", encrypted.length, "characters");

  // Decrypt
  console.log("\n🔓 Decrypting...");
  const decrypted = decryptData(encrypted, passphrase);
  console.log("📝 Decrypted:", decrypted);

  // Verify
  if (decrypted === testData) {
    console.log("\n✅ SUCCESS: Encryption/Decryption working correctly!");
  } else {
    console.log("\n❌ ERROR: Decrypted data does not match!");
  }

  // Test wrong passphrase
  console.log("\n🧪 Testing wrong passphrase...");
  try {
    decryptData(encrypted, "WrongPassphrase123!");
    console.log("❌ ERROR: Should have thrown error for wrong passphrase!");
  } catch (error) {
    console.log("✅ Correctly rejected wrong passphrase:", error.message);
  }
} catch (error) {
  console.error("❌ Test failed:", error.message);
  process.exit(1);
}

console.log("\n=== TEST COMPLETE ===\n");
