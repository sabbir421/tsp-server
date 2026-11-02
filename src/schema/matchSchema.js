const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MATCH_STATUS = {
  SENT: 'sent',
  VIEWED: 'viewed',
  INTERESTED: 'interested',
  DECLINED: 'declined',
};

const VISIT_STATUS = {
  NONE: 'none',
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  RESCHEDULED: 'rescheduled',
  DECLINED: 'declined',
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
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'sent',
    },
    visitRequested: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    visitStatus: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'pending',
    },
    visitDate: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    visitSlot: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    visitMode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'direct',
    },
    visitPeople: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
    },
    visitNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    visitRequestedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    proposedDate: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    proposedTime: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    buyerName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    buyerPhone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    buyerEmail: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    tableName: 'property_matches',
    timestamps: true,
  }
);

module.exports = PropertyMatch;
module.exports.MATCH_STATUS = MATCH_STATUS;
module.exports.VISIT_STATUS = VISIT_STATUS;
