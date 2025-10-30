// backend/services/historyService.js
import QRHistory from "../models/QRHistory.js";

export const logQRGeneration = async (type, dataSize, req) => {
  try {
    await QRHistory.create({
      type,
      data_size: dataSize,
      ip_address: req.clientIp,
      user_agent: req.get("User-Agent") || "Unknown",
    });
  } catch (error) {
    console.error("Failed to log QR generation:", error);
    // Don't throw error - we don't want to break QR generation if logging fails
  }
};

export const getStats = async () => {
  try {
    const totalQRs = await QRHistory.count();
    const byType = await QRHistory.findAll({
      attributes: [
        "type",
        [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
      ],
      group: ["type"],
    });

    return { totalQRs, byType };
  } catch (error) {
    console.error("Failed to get stats:", error);
    return { totalQRs: 0, byType: [] };
  }
};
