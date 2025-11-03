// backend/services/historyService.js
import QRHistory from "../models/QRHistory.js";
import Sequelize from "sequelize";

export const logQRGeneration = async (type, dataSize, req) => {
  // Parameters
  //example:
  // - "wifi" → type of QR generated
  // - wifiString.length → data size
  // - req → IP & user agent
  try {
    //CREATING DB RECORD
    await QRHistory.create({
      type, // 'url', 'encrypted_text', 'file', 'vcard', 'wif
      data_size: dataSize, // Size of data for analytics

      ip_address: req.clientIp || "unknown", // From middleware: user's IP ADD
      user_agent: req.get("User-Agent") || "Unknown", // Browser/device info
    });
    // console.log(` Logged QR generation: ${type}`);
  } catch (error) {
    console.error(" QR logging skipped (database not available)", error);
    // Don't throw error - we don't want to break QR generation if logging fails
  }
};

//  STATISTICS SERVICE
export const getStats = async () => {
  try {
    // 1. TOTAL QR CODES GENERATED
    const totalQRs = await QRHistory.count(); // SQL: SELECT COUNT(*) FROM qr_history;

    // 2. BREAKDOWN BY QR TYPE
    const byType = await QRHistory.findAll({
      // SQL: SELECT * FROM qr_history;
      // Find with conditions
      attributes: [
        "type",
        [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
      ],
      group: ["type"],
      raw: true, // Returns plain objects instead of model instances
    });

    // 3. RECENT ACTIVITY (last 24 hours)
    const recentActivity = await QRHistory.count({
      where: {
        createdAt: {
          [Sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    return {
      totalQRs: totalQRs || 0,
      byType: byType || [],
      recentActivity: recentActivity || 0,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Failed to get stats:", error);
    return {
      totalQRs: 0,
      byType: [],
      recentActivity: 0,
      error: "Failed to fetch statistics",
    };
  }
};
