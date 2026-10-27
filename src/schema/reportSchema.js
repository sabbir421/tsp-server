const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define(
  'Report',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    reportId: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Listing',
    },
    target: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    reportedBy: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'Anonymous',
    },
    severity: {
      type: DataTypes.ENUM('High', 'Medium', 'Low'),
      allowNull: false,
      defaultValue: 'Medium',
    },
    status: {
      type: DataTypes.ENUM('pending', 'resolved', 'dismissed'),
      allowNull: false,
      defaultValue: 'pending',
    },
  },
  {
    tableName: 'reports',
    timestamps: true,
  }
);

module.exports = Report;
