// backend/services/historyService.js
import QRHistory from "../models/QRHistory.js";
import Sequelize from "sequelize";

export const logQRGeneration = async (type, dataSize, req) => {
  // Parameters
  //example:type:wifi , datasize-5kb, req → IP & user agent
  try {
    // Extract user ID from authenticated request
    const userId = req.user ? req.user.userId : null;
    await QRHistory.create({
      //CREATING DB RECORD
      type, // 'url', 'encrypted_text', 'file', 'vcard', 'wif
      data_size: dataSize, // Size of data for analytics
      userId,
      ip_address: req.clientIp || "unknown", // From middleware: user's IP ADD
      user_agent: req.get("User-Agent") || "Unknown", // Browser/device info
    });
    console.log(`✅ Logged QR generation: ${type} for user ${userId}`);
  } catch (error) {
    console.error("Failed to Log the QR", error); //not affects QR gen
  }
};

//  STATISTICS SERVICE
export const getStats = async (req) => {
  try {
    // Check if req and userId exist
    const userId = req?.user?.userId;
    if (!userId) {
      console.error("❌ No userId found in request");
      console.error("   Request user object:", req?.user);
      return {
        totalQRs: 0,
        byType: [],
        recentActivity: 0,
        todayActivity: 0,
        popularType: "None",
        error: "User not authenticated.",
      };
    }
    console.log(`Fetching stats for user: ${userId}`);
    // 1. TOTAL QR CODES GENERATED
    const totalQRs = await QRHistory.count({
      where: { userId }, //filter by user
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    // 2. BREAKDOWN BY QR TYPE
    const byType = await QRHistory.findAll({
      where: { userId },
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
        userId,
        createdAt: {
          [Sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });
    const todayActivity = await QRHistory.count({
      where: {
        userId,
        // createdAt: {
        //   [Sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000), //last 24 hpurs
        // },
        createdAt: {
          [Sequelize.Op.gte]: today,
          [Sequelize.Op.lt]: tomorrow,
        },
      },
    });
    // Most popular type
    const popularType =
      byType.length > 0
        ? byType.reduce((max, type) => (type.count > max.count ? type : max))
            .type
        : "None";
    console.log(`✅ Stats for user ${userId}:`, {
      totalQRs,
      todayActivity,
      popularType,
    });

    return {
      totalQRs: totalQRs || 0,
      byType: byType || [],
      recentActivity: recentActivity || 0,
      todayActivity: todayActivity || 0,
      popularType: popularType,
    };
  } catch (error) {
    console.error("❌ Failed to get stats:", error);
    return {
      totalQRs: 0,
      byType: [],
      recentActivity: 0,
      todayActivity: 0,
      popularType: "None",
      error: "Failed to fetch statistics at service.",
    };
  }
};

// Helper function for time ago
export function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  if (seconds < 60) return `${seconds} sec ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}
