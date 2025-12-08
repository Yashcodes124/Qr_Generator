export const config = {
  PORT: process.env.PORT || 3000,
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || "50mb",
  QR_PAYLOAD_LIMIT: process.env.QR_PAYLOAD_LIMIT || 1200,

  // ✅ NOW READS FROM .env (default 310000)
  ENCRYPTION_ITERATIONS: parseInt(
    process.env.ENCRYPTION_ITERATIONS || "310000"
  ),

  // Database settings (auto switchable)
  DB_DIALECT: process.env.DB_DIALECT || "sqlite",
  DB_STORAGE: process.env.DB_STORAGE || "./database/qr_generator.sqlite",
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_USER: process.env.DB_USER || "postgres",
  DB_PASSWORD: process.env.DB_PASSWORD || "",
  DB_NAME: process.env.DB_NAME || "qr_generator",
  DB_PORT: process.env.DB_PORT || 5432,

  JWT_SECRET: process.env.JWT_SECRET || "",
};

// Validate on startup
if (!config.JWT_SECRET) {
  console.error("❌ JWT_SECRET not configured in .env");
  process.exit(1);
}
