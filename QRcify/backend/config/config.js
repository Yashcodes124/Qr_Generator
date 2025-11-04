// backend/config/config.js
export const config = {
  PORT: process.env.PORT || 3000,
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || "50mb",
  QR_PAYLOAD_LIMIT: process.env.QR_PAYLOAD_LIMIT || 1200,
  ENCRYPTION_ITERATIONS: process.env.ENCRYPTION_ITERATIONS || 10000,

  // ✅ Database settings (auto switchable)
  DB_DIALECT: process.env.DB_DIALECT || "sqlite",
  DB_STORAGE: process.env.DB_STORAGE || "./database/qr_generator.sqlite",
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_USER: process.env.DB_USER || "postgres",
  DB_PASSWORD: process.env.DB_PASSWORD || "",
  DB_NAME: process.env.DB_NAME || "qr_generator",
  DB_PORT: process.env.DB_PORT || 5432,

  JWT_SECRET: process.env.JWT_SECRET || "",
};
