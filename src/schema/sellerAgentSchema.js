const sequelize = require('../config/database');
const sharedUserFields = require('./sharedUserFields');

const SellerAgent = sequelize.define(
  'SellerAgent',
  sharedUserFields,
  {
    tableName: 'seller_agents',
    timestamps: true,
  }
);

module.exports = SellerAgent;
