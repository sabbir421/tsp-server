const { USER_ROLES } = require('../constants');
const { errorResponse } = require('../utils/response');

const buyerOnly = (req, res, next) => {
  if (req.user?.role !== USER_ROLES.BUYER_TENANT) {
    return errorResponse(res, 'Only buyer or tenant accounts can manage requirements', 403);
  }
  next();
};

module.exports = { buyerOnly };
