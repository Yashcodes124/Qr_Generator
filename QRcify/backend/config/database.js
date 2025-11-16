// backend/config/database.js
import { Sequelize } from "sequelize";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "../../database/qr_generator.sqlite"),
  logging: false, //Do console.log, to see SQL querieslogging
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: false,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ SQLite Database Connected Successfully");

    // Sync with force: true to update schema (drops existing tables!)
    await sequelize.sync({ alter: true });
    console.log("✅ Database tables synchronized ");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    throw error;
  }
};

export default sequelize;
