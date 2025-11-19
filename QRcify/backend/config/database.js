// backend/config/database.js
import { Sequelize } from "sequelize";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Make sure database directory exists
const dbDir = path.join(__dirname, "../../database");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "../../database/qr_generator.sqlite"),
  logging: false, //Do console.log, to see SQL querieslogging
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true,
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
    await sequelize.sync({ alter: false, force: false }); //Avoid using  force in production
    console.log("✅ Database tables synchronized ");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    if (error.message.includes("FOREIGN KEY constraint")) {
      console.log("\n💡 Fix: Delete database and restart:");
      console.log("   rm -rf database/qr_generator.sqlite");
      console.log("   npm start\n");
    }
    throw error;
  }
};

export default sequelize;
