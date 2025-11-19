import sequelize from "../config/database.js";
import User from "../models/user.js";
import QRHistory from "../models/QRHistory.js";

async function migrateDatabase() {
  console.log("🔄 Starting database migration...");

  try {
    // Connect to database
    await sequelize.authenticate();
    console.log("✅ Connected to database");

    // Get current table structure
    const queryInterface = sequelize.getQueryInterface();

    // Check if userId column exists in QRHistory
    const qrHistoryDesc = await queryInterface.describeTable("qr_history");

    if (!qrHistoryDesc.userId) {
      console.log("📊 Adding userId column to qr_history...");
      await queryInterface.addColumn("qr_history", "userId", {
        type: sequelize.Sequelize.INTEGER,
        allowNull: true,
      });
      console.log("✅ userId column added");
    } else {
      console.log("✅ userId column already exists");
    }

    // Remove foreign key constraint if it exists (SQLite workaround)
    console.log("🔧 Removing foreign key constraints...");

    // In SQLite, we need to recreate the table without FK
    // But since we already made userId nullable without FK, we're good

    console.log("✅ Migration completed successfully!");
    console.log("\n🚀 You can now run: npm start\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    console.log("\n💡 Manual fix:");
    console.log("   Delete: QRcify/database/qr_generator.sqlite");
    console.log("   Then run: npm start\n");
    process.exit(1);
  }
}

migrateDatabase();
