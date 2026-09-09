const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { USER_ROLES, OTP_TYPES } = require('../constants');

const OtpCode = sequelize.define(
  'OtpCode',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    otpCode: {
      type: DataTypes.STRING(6),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        OTP_TYPES.REGISTRATION,
        OTP_TYPES.LOGIN,
        OTP_TYPES.PASSWORD_RESET
      ),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(
        USER_ROLES.BUYER_TENANT,
        USER_ROLES.SELLER_AGENT,
        USER_ROLES.BACHELOR_POSTER
      ),
      allowNull: true,
    },
    isUsed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: 'otp_codes',
    timestamps: true,
    updatedAt: false,
  }
);

module.exports = OtpCode;
