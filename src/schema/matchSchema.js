const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MATCH_STATUS = {
  SENT: 'sent',
  VIEWED: 'viewed',
  INTERESTED: 'interested',
  DECLINED: 'declined',
};

const VISIT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
};

const PropertyMatch = sequelize.define(
  'PropertyMatch',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    requirementId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    propertyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    buyerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    matchScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    sellerNote: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('sent', 'viewed', 'interested', 'declined'),
      allowNull: false,
      defaultValue: 'sent',
    },
    visitStatus: {
      type: DataTypes.ENUM('pending', 'completed'),
      allowNull: false,
      defaultValue: 'pending',
    },
  },
  {
    tableName: 'property_matches',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['requirement_id', 'property_id'],
      },
      {
        unique: true,
        name: 'property_matches_requirement_seller_unique',
        fields: ['requirement_id', 'seller_id'],
      },
    ],
  }
);

module.exports = PropertyMatch;
module.exports.MATCH_STATUS = MATCH_STATUS;
module.exports.VISIT_STATUS = VISIT_STATUS;
