const bcrypt = require('bcryptjs');
const { BuyerTenant, SellerAgent, Property, Requirement, PropertyMatch, OtpCode, AdminUser } = require('../schema');
const { generateToken } = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/response');

const AdminController = {
  // Admin Login
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const cleanEmail = (email || '').toLowerCase().trim();

      // Check AdminUser database table first
      if (AdminUser) {
        try {
          const dbAdmin = await AdminUser.findOne({ where: { email: cleanEmail } });
          if (dbAdmin) {
            const isMatch = await bcrypt.compare(password, dbAdmin.password);
            if (isMatch) {
              const token = generateToken({ id: dbAdmin.id, role: 'admin', email: dbAdmin.email });
              return successResponse(res, {
                token,
                user: {
                  id: dbAdmin.id,
                  fullName: dbAdmin.fullName,
                  email: dbAdmin.email,
                  role: 'admin',
                },
              }, 'Admin login successful');
            }
          }
        } catch (dbErr) {
          console.warn('AdminUser table query fallback:', dbErr.message);
        }
      }

      // Fallback static credentials
      const validAdmins = [
        { email: 'sabbiralazim@gmail.com', pass: '123456', name: 'Sabbir Al Azim' },
        { email: 'admin@truespaceproperty.com', pass: 'admin123456', name: 'Platform Administrator' },
        { email: (process.env.ADMIN_EMAIL || '').toLowerCase(), pass: process.env.ADMIN_PASSWORD, name: 'Admin User' },
      ];

      const match = validAdmins.find((a) => a.email && a.email.toLowerCase() === cleanEmail && a.pass === password);

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

  // Admin Account Creation & Management
  async getAdmins(req, res) {
    try {
      let admins = [];
      if (AdminUser) {
        admins = await AdminUser.findAll({
          attributes: { exclude: ['password'] },
          order: [['createdAt', 'DESC']],
        });
      }

      // Always include default admin in list if not already present
      const defaultAdmin = {
        id: 999999,
        fullName: 'Sabbir Al Azim',
        email: 'sabbiralazim@gmail.com',
        role: 'super_admin',
        isActive: true,
        createdAt: new Date(),
      };

      const hasDefault = admins.some((a) => a.email.toLowerCase() === defaultAdmin.email.toLowerCase());
      if (!hasDefault) {
        admins.unshift(defaultAdmin);
      }

      return successResponse(res, admins, 'Admins fetched successfully');
    } catch (err) {
      console.error('getAdmins error:', err);
      return errorResponse(res, 'Failed to fetch admin accounts', 500);
    }
  },

  async createAdmin(req, res) {
    try {
      const { fullName, email, password } = req.body;
      if (!fullName || !email || !password) {
        return errorResponse(res, 'Full name, email, and password are required', 400);
      }

      const cleanEmail = email.toLowerCase().trim();

      if (AdminUser) {
        const existing = await AdminUser.findOne({ where: { email: cleanEmail } });
        if (existing) {
          return errorResponse(res, 'An admin with this email address already exists', 409);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = await AdminUser.create({
          fullName: fullName.trim(),
          email: cleanEmail,
          password: hashedPassword,
          role: 'admin',
          isActive: true,
        });

        const plain = newAdmin.toJSON();
        delete plain.password;
        return successResponse(res, plain, 'New admin account created successfully', 201);
      }

      return errorResponse(res, 'Admin database service unavailable', 500);
    } catch (err) {
      console.error('createAdmin error:', err);
      return errorResponse(res, err.message || 'Failed to create admin account', 500);
    }
  },

  async deleteAdmin(req, res) {
    try {
      const { id } = req.params;
      if (Number(id) === 999999) {
        return errorResponse(res, 'Cannot delete primary root super admin account', 400);
      }
      if (AdminUser) {
        await AdminUser.destroy({ where: { id } });
      }
      return successResponse(res, null, 'Admin account deleted successfully');
    } catch (err) {
      console.error('deleteAdmin error:', err);
      return errorResponse(res, 'Failed to delete admin account', 500);
    }
  },

  // Dashboard Stats & Analytics
  async getDashboardStats(req, res) {
    try {
      let totalSellers = 0;
      let totalBuyers = 0;
      let totalProperties = 0;
      let pendingProperties = 0;
      let verifiedProperties = 0;
      let matchedProperties = 0;
      let totalRequirements = 0;
      let totalMatches = 0;
      let acceptedMatches = 0;
      let completedVisits = 0;
      let totalOtps = 0;

      let recentProperties = [];
      let recentRequirements = [];
      let recentMatches = [];

      try {
        totalSellers = await SellerAgent.count();
      } catch (e) { console.warn('Count sellers err:', e.message); }

      try {
        totalBuyers = await BuyerTenant.count();
      } catch (e) { console.warn('Count buyers err:', e.message); }

      try {
        totalProperties = await Property.count();
        pendingProperties = await Property.count({ where: { status: 'pending' } });
        verifiedProperties = await Property.count({ where: { status: 'verified' } });
        matchedProperties = await Property.count({ where: { status: 'matched' } });
      } catch (e) { console.warn('Count properties err:', e.message); }

      try {
        totalRequirements = await Requirement.count();
      } catch (e) { console.warn('Count requirements err:', e.message); }

      try {
        totalMatches = await PropertyMatch.count();
        acceptedMatches = await PropertyMatch.count({ where: { status: 'interested' } });
        completedVisits = await PropertyMatch.count({ where: { visitStatus: 'completed' } });
      } catch (e) { console.warn('Count matches err:', e.message); }

      try {
        totalOtps = await OtpCode.count();
      } catch (e) { console.warn('Count OTPs err:', e.message); }

      try {
        recentProperties = await Property.findAll({ limit: 5, order: [['createdAt', 'DESC']] });
      } catch (e) { console.warn('Recent properties err:', e.message); }

      try {
        recentRequirements = await Requirement.findAll({ limit: 5, order: [['createdAt', 'DESC']] });
      } catch (e) { console.warn('Recent requirements err:', e.message); }

      try {
        recentMatches = await PropertyMatch.findAll({ limit: 5, order: [['createdAt', 'DESC']] });
      } catch (e) { console.warn('Recent matches err:', e.message); }

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

  // User Verification Badge
  async updateUserBadge(req, res) {
    try {
      const { role, id } = req.params;
      const { verificationStatus, verificationBadge } = req.body;
      const Model = role === 'seller_agent' ? SellerAgent : BuyerTenant;
      const user = await Model.findByPk(id);
      if (!user) return errorResponse(res, 'User not found', 404);

      await user.update({
        verificationStatus: verificationStatus || user.verificationStatus,
        verificationBadge: verificationBadge !== undefined ? verificationBadge : user.verificationBadge,
      });

      return successResponse(res, user, 'User verification updated');
    } catch (err) {
      console.error('Admin updateUserBadge error:', err);
      return errorResponse(res, 'Failed to update user badge', 500);
    }
  },

  // Moderation Reports
  async getReports(req, res) {
    try {
      const { Report } = require('../schema');
      const reports = await Report.findAll({
        order: [['createdAt', 'DESC']],
      });
      return successResponse(res, reports, 'Reports fetched successfully');
    } catch (err) {
      console.error('Admin getReports error:', err);
      return errorResponse(res, 'Failed to fetch reports', 500);
    }
  },

  async updateReportStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const { Report } = require('../schema');
      const report = await Report.findByPk(id);
      if (!report) return errorResponse(res, 'Report not found', 404);

      await report.update({ status });
      return successResponse(res, report, 'Report status updated');
    } catch (err) {
      console.error('Admin updateReportStatus error:', err);
      return errorResponse(res, 'Failed to update report', 500);
    }
  },

  // Blog / Content Management
  async getPosts(req, res) {
    try {
      const { BlogPost } = require('../schema');
      const posts = await BlogPost.findAll({
        order: [['createdAt', 'DESC']],
      });
      return successResponse(res, posts, 'Posts fetched successfully');
    } catch (err) {
      console.error('Admin getPosts error:', err);
      return errorResponse(res, 'Failed to fetch posts', 500);
    }
  },

  async createPost(req, res) {
    try {
      const { BlogPost } = require('../schema');
      const post = await BlogPost.create(req.body);
      return successResponse(res, post, 'Post created successfully', 201);
    } catch (err) {
      console.error('Admin createPost error:', err);
      return errorResponse(res, 'Failed to create post', 500);
    }
  },

  async updatePost(req, res) {
    try {
      const { id } = req.params;
      const { BlogPost } = require('../schema');
      const post = await BlogPost.findByPk(id);
      if (!post) return errorResponse(res, 'Post not found', 404);

      await post.update(req.body);
      return successResponse(res, post, 'Post updated successfully');
    } catch (err) {
      console.error('Admin updatePost error:', err);
      return errorResponse(res, 'Failed to update post', 500);
    }
  },

  async deletePost(req, res) {
    try {
      const { id } = req.params;
      const { BlogPost } = require('../schema');
      const count = await BlogPost.destroy({ where: { id } });
      if (!count) return errorResponse(res, 'Post not found', 404);
      return successResponse(res, null, 'Post deleted successfully');
    } catch (err) {
      console.error('Admin deletePost error:', err);
      return errorResponse(res, 'Failed to delete post', 500);
    }
  },
};

module.exports = AdminController;
