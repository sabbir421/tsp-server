const sequelize = require('../config/database');
const sharedUserFields = require('./sharedUserFields');

const BachelorPoster = sequelize.define(
  'BachelorPoster',
  sharedUserFields,
  {
    tableName: 'bachelor_posters',
    timestamps: true,
  }
);

module.exports = BachelorPoster;
