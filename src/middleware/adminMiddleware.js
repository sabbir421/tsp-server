const { AdminUser } = require('../schema');
const { errorResponse } = require('../utils/response');

const adminOnly = async (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return errorResponse(res, 'Admin access required', 403);
  }

  try {
    // Deleted or deactivated admins lose access immediately, even with a valid token
    const admin = await AdminUser.findByPk(req.user.id);
    if (!admin || !admin.isActive || admin.email !== req.user.email) {
      return errorResponse(res, 'Admin access required', 403);
    }
    next();
  } catch (error) {
    console.error('Admin check failed:', error.message);
    return errorResponse(res, 'Internal server error', 500);
  }
};

module.exports = { adminOnly };
