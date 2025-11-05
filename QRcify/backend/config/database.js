// backend/config/database.js
import { Sequelize } from "sequelize";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "../../database/qr_generator.sqlite"),
  // So we can see SQL querieslogging: console.log,
  logging: false,
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ SQLite Database Connected Successfully");

    // Sync with force: true to update schema (drops existing tables!)
    await sequelize.sync({alter: true });
    console.log("✅ Database tables synchronized (schema updated)");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
  }
};

export default sequelize;
