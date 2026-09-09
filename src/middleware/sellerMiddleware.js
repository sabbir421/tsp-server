const { USER_ROLES } = require('../constants');
const { errorResponse } = require('../utils/response');

const sellerOnly = (req, res, next) => {
  if (req.user?.role !== USER_ROLES.SELLER_AGENT) {
    return errorResponse(res, 'Only seller, agent, or developer accounts can manage properties', 403);
  }
  next();
};

module.exports = { sellerOnly };
