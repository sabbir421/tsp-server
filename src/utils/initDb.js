require('dotenv').config();

const sequelize = require('../config/database');
require('../schema');

const initDatabase = async () => {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  console.log('Database synchronized successfully');
};

initDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Database init failed:', err.message);
    process.exit(1);
  });
