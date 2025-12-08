import crypto from "crypto";

console.log("\n=== 🔐 GENERATE SECURE SECRETS ===\n");

const jwtSecret = crypto.randomBytes(32).toString("base64");
const randomToken = crypto.randomBytes(32).toString("hex");

console.log("Copy these values to your .env file:\n");
console.log("JWT_SECRET=" + jwtSecret);
console.log("RANDOM_TOKEN=" + randomToken);

console.log("\n✅ Save these values securely!\n");
