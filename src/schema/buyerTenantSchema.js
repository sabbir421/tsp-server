const sequelize = require('../config/database');
const sharedUserFields = require('./sharedUserFields');

const BuyerTenant = sequelize.define(
  'BuyerTenant',
  sharedUserFields,
  {
    tableName: 'buyer_tenants',
    timestamps: true,
  }
);

module.exports = BuyerTenant;
