const { USER_ROLES } = require('../constants');
const { errorResponse } = require('../utils/response');

const sellerOnly = (req, res, next) => {
  const role = req.user?.role;
  const isSeller =
    role === USER_ROLES.SELLER_AGENT ||
    role === 'owner' ||
    role === 'seller' ||
    role === 'seller_agent' ||
    role === 'agent';

  if (!isSeller) {
    return errorResponse(res, 'Only seller, agent, or developer accounts can manage properties', 403);
  }
  next();
};

module.exports = { sellerOnly };
