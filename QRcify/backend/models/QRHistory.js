// backend/models/QRHistory.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const QRHistory = sequelize.define(
  "QRHistory",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false, // 'url', 'encrypted_text', 'file', 'vcard', 'wifi'
    },
    data_size: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "qr_history",
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

export default QRHistory;
