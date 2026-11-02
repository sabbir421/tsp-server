const { USER_ROLES } = require('../constants');
const { errorResponse } = require('../utils/response');

const buyerOnly = (req, res, next) => {
  const role = req.user?.role;
  const isBuyer =
    role === USER_ROLES.BUYER_TENANT ||
    role === 'buyer' ||
    role === 'tenant' ||
    role === 'buyer_tenant';

  if (!isBuyer) {
    return errorResponse(res, 'Only buyer or tenant accounts can manage requirements', 403);
  }
  next();
};

module.exports = { buyerOnly };
