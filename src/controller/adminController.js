const { BuyerTenant, SellerAgent, Property, Requirement, PropertyMatch, OtpCode } = require('../schema');
const { generateToken } = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/response');

const AdminController = {
  // Admin Login
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const adminEmail = process.env.ADMIN_EMAIL || 'sabbiralazim@gmail.com';
      const adminPass = process.env.ADMIN_PASSWORD || '123456';

      const validAdmins = [
        { email: 'sabbiralazim@gmail.com', pass: '123456', name: 'Sabbir Al Azim' },
        { email: 'admin@truespaceproperty.com', pass: 'admin123456', name: 'Platform Administrator' },
        { email: adminEmail, pass: adminPass, name: 'Admin User' },
      ];

      const match = validAdmins.find((a) => a.email.toLowerCase() === (email || '').toLowerCase().trim() && a.pass === password);

      if (match) {
        const token = generateToken({ id: 999999, role: 'admin', email: match.email });
        return successResponse(res, {
          token,
          user: {
            id: 999999,
            fullName: match.name,
            email: match.email,
            role: 'admin',
          },
        }, 'Admin login successful');
      }

      return errorResponse(res, 'Invalid admin credentials', 401);
    } catch (err) {
      console.error('Admin login error:', err);
      return errorResponse(res, 'Login failed', 500);
    }
  },

  // Dashboard Stats & Analytics
  async getDashboardStats(req, res) {
    try {
      const [
        totalSellers,
        totalBuyers,
        totalProperties,
        pendingProperties,
        verifiedProperties,
        matchedProperties,
        totalRequirements,
        totalMatches,
        acceptedMatches,
        completedVisits,
        totalOtps,
      ] = await Promise.all([
        SellerAgent.count(),
        BuyerTenant.count(),
        Property.count(),
        Property.count({ where: { status: 'pending' } }),
        Property.count({ where: { status: 'verified' } }),
        Property.count({ where: { status: 'matched' } }),
        Requirement.count(),
        PropertyMatch.count(),
        PropertyMatch.count({ where: { status: 'accepted' } }),
        PropertyMatch.count({ where: { siteVisitStatus: 'completed' } }),
        OtpCode.count(),
      ]);

      // Recent 5 activities across properties & matches
      const [recentProperties, recentRequirements, recentMatches] = await Promise.all([
        Property.findAll({ limit: 5, order: [['createdAt', 'DESC']] }),
        Requirement.findAll({ limit: 5, order: [['createdAt', 'DESC']] }),
        PropertyMatch.findAll({ limit: 5, order: [['createdAt', 'DESC']] }),
      ]);

      return successResponse(res, {
        metrics: {
          totalUsers: totalSellers + totalBuyers,
          totalSellers,
          totalBuyers,
          totalProperties,
          pendingProperties,
          verifiedProperties,
          matchedProperties,
          totalRequirements,
          totalMatches,
          acceptedMatches,
          completedVisits,
          totalOtps,
        },
        recentActivities: {
          properties: recentProperties,
          requirements: recentRequirements,
          matches: recentMatches,
        },
      }, 'Dashboard stats fetched successfully');
    } catch (err) {
      console.error('Admin stats error:', err);
      return errorResponse(res, 'Failed to fetch dashboard stats', 500);
    }
  },

  // User Management
  async getUsers(req, res) {
    try {
      const { role, search } = req.query;
      let sellers = [];
      let buyers = [];

      if (!role || role === 'all' || role === 'seller_agent') {
        sellers = await SellerAgent.findAll({
          attributes: { exclude: ['password'] },
          order: [['createdAt', 'DESC']],
        });
      }

      if (!role || role === 'all' || role === 'buyer_tenant') {
        buyers = await BuyerTenant.findAll({
          attributes: { exclude: ['password'] },
          order: [['createdAt', 'DESC']],
        });
      }

      let allUsers = [
        ...sellers.map((u) => ({ ...u.toJSON(), userRole: 'seller_agent', roleLabel: 'Seller / Agent' })),
        ...buyers.map((u) => ({ ...u.toJSON(), userRole: 'buyer_tenant', roleLabel: 'Buyer / Tenant' })),
      ];

      if (search) {
        const q = search.toLowerCase().trim();
        allUsers = allUsers.filter(
          (u) =>
            (u.fullName && u.fullName.toLowerCase().includes(q)) ||
            (u.email && u.email.toLowerCase().includes(q)) ||
            (u.phone && u.phone.includes(q))
        );
      }

      return successResponse(res, allUsers, 'Users fetched successfully');
    } catch (err) {
      console.error('Admin getUsers error:', err);
      return errorResponse(res, 'Failed to fetch users', 500);
    }
  },

  async updateUserStatus(req, res) {
    try {
      const { role, id } = req.params;
      const { isActive, isPhoneVerified } = req.body;
      const Model = role === 'seller_agent' ? SellerAgent : BuyerTenant;

      const user = await Model.findByPk(id);
      if (!user) return errorResponse(res, 'User not found', 404);

      const updateData = {};
      if (typeof isActive === 'boolean') updateData.isActive = isActive;
      if (typeof isPhoneVerified === 'boolean') updateData.isPhoneVerified = isPhoneVerified;

      await user.update(updateData);
      return successResponse(res, user, 'User status updated');
    } catch (err) {
      console.error('Admin updateUserStatus error:', err);
      return errorResponse(res, 'Failed to update user', 500);
    }
  },

  async deleteUser(req, res) {
    try {
      const { role, id } = req.params;
      const Model = role === 'seller_agent' ? SellerAgent : BuyerTenant;
      const count = await Model.destroy({ where: { id } });
      if (!count) return errorResponse(res, 'User not found', 404);
      return successResponse(res, null, 'User deleted successfully');
    } catch (err) {
      console.error('Admin deleteUser error:', err);
      return errorResponse(res, 'Failed to delete user', 500);
    }
  },

  // Property Management
  async getProperties(req, res) {
    try {
      const { status, search } = req.query;
      const whereClause = {};
      if (status && status !== 'all') {
        whereClause.status = status;
      }

      let properties = await Property.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
      });

      if (search) {
        const q = search.toLowerCase().trim();
        properties = properties.filter(
          (p) =>
            (p.title && p.title.toLowerCase().includes(q)) ||
            (p.area && p.area.toLowerCase().includes(q)) ||
            (p.city && p.city.toLowerCase().includes(q)) ||
            (p.address && p.address.toLowerCase().includes(q))
        );
      }

      return successResponse(res, properties, 'Properties fetched successfully');
    } catch (err) {
      console.error('Admin getProperties error:', err);
      return errorResponse(res, 'Failed to fetch properties', 500);
    }
  },

  async updatePropertyStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const property = await Property.findByPk(id);
      if (!property) return errorResponse(res, 'Property not found', 404);

      await property.update({ status });
      return successResponse(res, property, 'Property status updated');
    } catch (err) {
      console.error('Admin updatePropertyStatus error:', err);
      return errorResponse(res, 'Failed to update property', 500);
    }
  },

  async deleteProperty(req, res) {
    try {
      const { id } = req.params;
      const count = await Property.destroy({ where: { id } });
      if (!count) return errorResponse(res, 'Property not found', 404);
      return successResponse(res, null, 'Property deleted successfully');
    } catch (err) {
      console.error('Admin deleteProperty error:', err);
      return errorResponse(res, 'Failed to delete property', 500);
    }
  },

  // Requirement Management
  async getRequirements(req, res) {
    try {
      const { search } = req.query;
      let requirements = await Requirement.findAll({
        order: [['createdAt', 'DESC']],
      });

      if (search) {
        const q = search.toLowerCase().trim();
        requirements = requirements.filter(
          (r) =>
            (r.title && r.title.toLowerCase().includes(q)) ||
            (r.area && r.area.toLowerCase().includes(q)) ||
            (r.city && r.city.toLowerCase().includes(q)) ||
            (r.category && r.category.toLowerCase().includes(q))
        );
      }

      return successResponse(res, requirements, 'Requirements fetched successfully');
    } catch (err) {
      console.error('Admin getRequirements error:', err);
      return errorResponse(res, 'Failed to fetch requirements', 500);
    }
  },

  async deleteRequirement(req, res) {
    try {
      const { id } = req.params;
      const count = await Requirement.destroy({ where: { id } });
      if (!count) return errorResponse(res, 'Requirement not found', 404);
      return successResponse(res, null, 'Requirement deleted successfully');
    } catch (err) {
      console.error('Admin deleteRequirement error:', err);
      return errorResponse(res, 'Failed to delete requirement', 500);
    }
  },

  // Match Management
  async getMatches(req, res) {
    try {
      const matches = await PropertyMatch.findAll({
        order: [['createdAt', 'DESC']],
      });
      return successResponse(res, matches, 'Matches fetched successfully');
    } catch (err) {
      console.error('Admin getMatches error:', err);
      return errorResponse(res, 'Failed to fetch matches', 500);
    }
  },

  // OTP Logs
  async getOtpLogs(req, res) {
    try {
      const logs = await OtpCode.findAll({
        order: [['createdAt', 'DESC']],
        limit: 100,
      });
      return successResponse(res, logs, 'OTP audit logs fetched successfully');
    } catch (err) {
      console.error('Admin getOtpLogs error:', err);
      return errorResponse(res, 'Failed to fetch OTP logs', 500);
    }
  },
};

module.exports = AdminController;
