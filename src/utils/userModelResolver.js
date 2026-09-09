const { USER_ROLES } = require('../constants');
const { BuyerTenant, SellerAgent, BachelorPoster } = require('../schema');

const ROLE_MODEL_MAP = {
  [USER_ROLES.BUYER_TENANT]: BuyerTenant,
  [USER_ROLES.SELLER_AGENT]: SellerAgent,
  [USER_ROLES.BACHELOR_POSTER]: BachelorPoster,
};

const getModelByRole = (role) => {
  const model = ROLE_MODEL_MAP[role];
  if (!model) {
    throw { status: 400, message: 'Invalid user role' };
  }
  return model;
};

module.exports = {
  ROLE_MODEL_MAP,
  getModelByRole,
};
