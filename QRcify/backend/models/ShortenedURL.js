import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ShortenedURL = sequelize.define(
  "ShortenedURL",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    shortCode: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
      index: true,
    },
    originalURL: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    shortURL: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    customAlias: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      index: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    clicks: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    qrCode: {
      type: DataTypes.TEXT, // Base64 encoded QR code
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "shortened_urls",
    timestamps: true,
  }
);

export default ShortenedURL;
