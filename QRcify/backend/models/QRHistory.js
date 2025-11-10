// backend/models/QRHistory.js
// DefinING MY  table structure as a JavaScript class

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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Allow null for now (backward compatibility)
      references: {
        model: "users",
        key: "id",
      },
    },
    type: {
      type: DataTypes.ENUM("url", "encrypted_text", "file", "vcard", "wifi"),
      allowNull: false,
    },
    data_size: {
      type: DataTypes.INTEGER, // Stores character count/data length
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING, // Stores IPv4/IPv6 addresses
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.TEXT, // Stores full browser/device string
      allowNull: true,
    },
  },
  {
    tableName: "qr_history", // Actual table name in PostgreSQL
    timestamps: true, // ✅ Automatically adds createdAt & updatedAt
  }
);

export default QRHistory;

// Sequelize generates this SQL:
// INSERT INTO qr_history (type, data_size, ip_address, created_at, updated_at)
// VALUES ('vcard', 150, '192.168.1.100', NOW(), NOW());
// Example of what gets stored:
/*
id: 1
type: 'vcard'
data_size: 125
ip_address: '192.168.1.100'
user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
createdAt: 2023-12-01 10:30:00
updatedAt: 2023-12-01 10:30:00
*/

// Sequelize automatically creates tables based on your models
// await sequelize.sync();
// Creates: CREATE TABLE IF NOT EXISTS qr_history (...)
