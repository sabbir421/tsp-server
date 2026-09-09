const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const REQUIREMENT_STATUS = {
  ACTIVE: 'active',
  MATCHED: 'matched',
  CLOSED: 'closed',
};

const Requirement = sequelize.define(
  'Requirement',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    buyerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('residential', 'commercial'),
      allowNull: false,
    },
    subType: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    residentialNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    bedrooms: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    sizeSqFt: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    floor: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    totalFloors: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    area: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    zone: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Dhaka',
    },
    mustInclude: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    mustIncludeDetails: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    maxBudget: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'matched', 'closed'),
      allowNull: false,
      defaultValue: 'active',
    },
  },
  {
    tableName: 'requirements',
    timestamps: true,
  }
);

module.exports = Requirement;
module.exports.REQUIREMENT_STATUS = REQUIREMENT_STATUS;
