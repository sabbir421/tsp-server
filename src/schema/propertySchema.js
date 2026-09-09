const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PROPERTY_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  MATCHED: 'matched',
};

const Property = sequelize.define(
  'Property',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    propertyType: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    purpose: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    propertyFor: {
      type: DataTypes.ENUM('sale', 'rent'),
      allowNull: false,
    },
    area: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    sector: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    sizeSqFt: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    landAreaKatha: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    priceNegotiable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    bedrooms: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    bathrooms: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    balcony: {
      type: DataTypes.STRING(10),
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
    amenities: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    otherAmenity: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    useMap: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    contactNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    whatsappNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    preferredContact: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    bestTime: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    photos: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    status: {
      type: DataTypes.ENUM(PROPERTY_STATUS.PENDING, PROPERTY_STATUS.VERIFIED, PROPERTY_STATUS.MATCHED),
      allowNull: false,
      defaultValue: PROPERTY_STATUS.PENDING,
    },
    views: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    leads: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: 'properties',
    timestamps: true,
  }
);

module.exports = Property;
module.exports.PROPERTY_STATUS = PROPERTY_STATUS;
